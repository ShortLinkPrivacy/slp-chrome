/// <reference path="../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../../typings/rivets/rivets.d.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="../modules.d.ts" />

module Content {

    // Contains all loaded modules
    var loadedModules: Interfaces.Dictionary = {};

    // Regexp for a PGP message
    var pgpRe = /----BEGIN PGP MESSAGE----/gi;

    /**************************************************
     * Loads a module on demand
     **************************************************/
    export function loadModule(name: string, callback: Interfaces.Callback): void {
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
    export function nodesToDecrypt(): Array<Node> {
        var walk: TreeWalker,
            node: Node,
            result: Array<Node>;

        result = [];
        walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

        while (node = walk.nextNode()) {
            if ( node.nodeValue.match(pgpRe) ) {
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
    export function processNodes(nodes: Array<Node>): void {
        var node: Node,
            i: number,
            text: string;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            text = node.nodeValue;
            if (text.match(pgpRe)) {
                var message = openpgp.message.readArmored(text);
                console.log(message);
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
            new Popup(textAreas[i]);
        }
    }

}

