/// <reference path="dialog.ts" />
/// <reference path="armor.ts" />
/// <reference path="notif.ts" />
/// <reference path="../modules.d.ts" />

var config = new Config(),

// How we load the private key
privateKeyStore = new PrivateKeyStore.LocalStore(config),

// How we load messages TODO: move to prod
messageStore = new MessageStore.RemoteService(config.messageStore.localHost),

// Private key
privateKeyArmored: string,
privateKey: Keys.PrivateKey,

// Contains all loaded modules
loadedModules: Interfaces.Dictionary = {},

// Observer for newly created elements
observer: MutationObserver,

// Dialog object
dialog = new Dialog();

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

function unlockPrivateKey(callback: { (success: boolean): void }): void {
    if (!privateKey) {
        privateKey = new Keys.PrivateKey(privateKeyArmored);
        privateKey.key.decrypt('Password-123'); // TODO
    }
    callback(true);
}

function decodeText(codedText: string, callback: { (decodedText): void }): void {
    var match = messageStore.regexp.exec(codedText),
        armoredText: string,
        messageId: string;

    if (!match) {
        callback(codedText);
        return;
    }

    messageId = match[1];

    messageStore.load( messageId, (result) => {
        if ( !result.success ) {
           codedText = codedText.replace(messageStore.regexp, "[PGP MESSAGE:" + messageId + "]"); // TODO: add link
           decodeText(codedText, callback);
           return;
        }

        var armorType = Armor.getType(result.armor);
        if ( armorType == Armor.Type.Signed || armorType == Armor.Type.Message ) { // TODO, other types
            loadModule("openpgp", () => {
                unlockPrivateKey((success) => {
                    var message = openpgp.message.readArmored(result.armor);

                    openpgp.decryptMessage( privateKey.key, message )
                       .then((plainText) => {
                           codedText = codedText.replace(messageStore.regexp, plainText)
                           decodeText(codedText, callback);
                       })
                       .catch((error) => {
                           codedText = codedText.replace(messageStore.regexp, "[PGP MESSAGE:" + messageId + "]"); // TODO: add link
                           decodeText(codedText, callback);
                       });
                });
            });
        }
    });
};

function decodeNode(node: Node ): void {
    decodeText( node.nodeValue, (newValue) => {
        node.nodeValue = newValue;
    });
}

function traverseNodes(root: HTMLElement): void {
    var walk: TreeWalker,
        node: Node;

    // Create a walker from the root element, searching only for text nodes
    walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    while (node = walk.nextNode()) {
        decodeNode(node);
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
            //prepareTextAreas();

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

            // Listen for messages from the extension
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
