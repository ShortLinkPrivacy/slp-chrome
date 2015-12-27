/// <reference path="popup.ts" />
/// <reference path="armor.ts" />

var config = new Config();

// How we load the private key
var privateKeyStore = new PrivateKeyStore.LocalStore(config);

var privateKeyArmored: string;
var privateKey: Keys.PrivateKey;

// Contains all loaded modules
var loadedModules: Interfaces.Dictionary = {};

var observer: MutationObserver;

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
 * Bind message listeners and popup class to each text area
 ************************************************************/
function prepareTextAreas(): void {

    // Content page message listener. The iframe posts here.
    window.addEventListener('message', (e) => {
        var msg = e.data.message,
            current: Popup = Popup.current;

        if (e.data.iframe && msg) {
            if (msg.closePopup && current) {
                if ( msg.keys && msg.keys.length ) {
                    current.encrypt(msg.keys, (encryptedText) => {
                        current.closePopup(encryptedText)
                    })
                } else {
                    current.closePopup()
                }
            }
        }
    });

    // Textarea elements get UIs attached to them
    var textAreas = document.getElementsByTagName('textarea'),
        i: number;

    for (i = 0; i < textAreas.length; ++i) {
        var p = new Popup(textAreas[i]);
        textAreas[i]["popup"] = p;
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
                    document.activeElement["popup"].openPopup(100, 100);
                }
            });

        } else {
            // TODO: nag about adding public key
            // (perhaps only when there are nodes to decrypt)
        }
    });


}

run();
