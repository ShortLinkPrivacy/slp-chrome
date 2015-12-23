/// <reference path="popup.ts" />
/// <reference path="armor.ts" />

var config = new Config();

// How we load the private key
var privateKeyStore = new PrivateKeyStore.LocalStore(config);

var privateKey: Keys.PrivateKey;

// Contains all loaded modules
var loadedModules: Interfaces.Dictionary = {};

// Nodes to decrypt
var nodes: Array<Node>;

/**************************************************
 * Loads a module on demand
 **************************************************/
function loadModule(name: string, callback: Interfaces.Callback): void {
    if (!loadedModules[name]) {
        chrome.runtime.sendMessage({ loadModule: name }, (res) => {
            var property: string;
            if ( property = res.property ) {
                loadedModules[property] = window[property]
                callback()
            }
        })
    } else {
        callback()
    }
}

/**************************************************
 * Collects a list of nodes that need to be decrypted
 **************************************************/
function nodesToDecrypt(): Array<Node> {
    var walk: TreeWalker,
        node: Node,
        result: Array<Node>,
        armorType: number;

    result = [];
    walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    while (node = walk.nextNode()) {
        armorType = getArmorType(node.nodeValue);
        if ( armorType == 3 || armorType == 4 ) {   // TODO: messages only
            result.push(node);
        }
    }

    return result;
}

/*********************************************************
 * Takes a list of nodes and decrypts them one by one.
 *--------------------------------------------------------
 * This can not be done in one step in nodesToDecrypt because
 * loading the openpgp module on the fly, flushes all
 * variables, for some reason.
 *********************************************************/
function processNodes(nodes: Array<Node>): void {
    var node: Node,
        i: number;

    for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        var message = openpgp.message.readArmored(node.nodeValue);
        openpgp.decryptMessage( privateKey.key, message )
           .then((plainText) => {
               node.nodeValue = plainText;
           })
           .catch((error) => {
               node.nodeValue = "&lt;PGP MESSAGE&gt;"; // TODO: icon
           });
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
        new Popup(textAreas[i]);
    }
}


function run(): void {
    privateKeyStore = new PrivateKeyStore.LocalStore(config);

    // Get all nodes that must be decrypted
    nodes = nodesToDecrypt();

    // All of this only matters if the guy has a private key set up
    privateKeyStore.has((value) => {
        if ( value ) {

            // Prepare all textareas
            prepareTextAreas();

            // Decrypt nodes
            if ( nodes.length ) {
                loadModule("openpgp", () => {
                    privateKeyStore.get((pk) => {
                        privateKey = pk;
                        privateKey.key.decrypt('Password-123'); // TODO
                        processNodes(nodes);
                    });
                });
            }
        } else {
            if ( nodes.length ) {
                // TODO: nag about adding public key
                // (perhaps only when there are nodes to decrypt)
            }
        }
    });
}

window.onload = function() {
    setTimeout(run, config.decryptDelay);
}
