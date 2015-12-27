/// <reference path="dialog.ts" />
/// <reference path="armor.ts" />

var config = new Config();

// How we load the private key
var privateKeyStore = new PrivateKeyStore.LocalStore(config);

// Private key
var privateKeyArmored: string;
var privateKey: Keys.PrivateKey;

// Contains all loaded modules
var loadedModules: Interfaces.Dictionary = {};

// Observer for newly created elements
var observer: MutationObserver;

// Dialog object
var dialog = new Dialog();

/**************************************************
 * Loads a module on demand
 **************************************************/
function loadModule(name: string, callback: Interfaces.Callback): void {
    if (!loadedModules[name]) {
        chrome.runtime.sendMessage({ loadModule: name }, (res) => {
            var property: string;
            if ( property = res.property ) {
                loadedModules[name] = window[property]
                callback()
            }
        })
    } else {
        callback()
    }
}

function textContainsCode(text: string): boolean {
    var armorType = getArmorType(text);
    return ( armorType == 3 || armorType == 4 ); // TODO, these are messages only
}


function decodeNode(node: Node): void {
    loadModule("openpgp", () => {
        if (!privateKey) {
            privateKey = new Keys.PrivateKey(privateKeyArmored);
            privateKey.key.decrypt('Password-123'); // TODO
        }

        var message = openpgp.message.readArmored(node.nodeValue); // TODO: there might be more

        openpgp.decryptMessage( privateKey.key, message )
           .then((plainText) => {
               node.nodeValue = plainText;
           })
           .catch((error) => {
               node.nodeValue = "&lt;PGP MESSAGE&gt;"; // TODO: icon
           });
    });
};

function traverseNodes(root: HTMLElement): void {
    var walk: TreeWalker,
        node: Node,
        armorType: number;

    // Create a walker from the root element, searching only for text nodes
    walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    while (node = walk.nextNode()) {
        if ( textContainsCode(node.nodeValue) ) {
            decodeNode(node);
        }
    }
}

/************************************************************
 * Bind context menu enable/disable
 ************************************************************/
function prepareTextAreas(): void {
    var textAreas = document.getElementsByTagName('textarea'),
        i: number;

    var triggerContextMenu = function(el) {
        return function(e) {
            chrome.runtime.sendMessage({ 
                contextMenu: true, 
                update: { enabled: el.value ? true : false }
            });
        }
    };

    for (i = 0; i < textAreas.length; ++i) {
        var el: HTMLTextAreaElement = textAreas[0];
        el.addEventListener('focus', triggerContextMenu(el));
        el.addEventListener('input', triggerContextMenu(el));
    }
}

/************************************************************
 * Bootstrap and run at window.onload
 ************************************************************/
function run(): void {
    privateKeyStore = new PrivateKeyStore.LocalStore(config);

    // All of this only matters if the guy has a private key set up
    privateKeyStore.getArmored((value) => {
        if ( value ) {
            privateKeyArmored = value;

            // Prepare all textareas
            prepareTextAreas();

            // Decrypt existing nodes
            traverseNodes(document.body);

            // Observe for new nodes
            observer = new MutationObserver((mutationArray) => {
                mutationArray.forEach((mutation) => {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        traverseNodes(<HTMLElement>node);
                    }
                });
            });
            observer.observe(document, { childList: true, subtree: true });

            // listen for messages from the extension
            chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
                if ( msg.popup ) {
                    dialog.open(<HTMLTextAreaElement>document.activeElement);
                }
            });

        } else {
            // TODO: nag about adding public key
            // (perhaps only when there are nodes to decrypt)
        }
    });


}

run();
