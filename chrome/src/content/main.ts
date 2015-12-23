/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />


var config = new Config();

// How we load the private key
var privateKeyStore = new PrivateKeyStore.LocalStore(config);

var privateKey: Keys.PrivateKey;

// Contains all loaded modules
var loadedModules: Interfaces.Dictionary = {};

// Regexp for a PGP message
var pgpRe = /----BEGIN PGP MESSAGE----/gi;

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
function processNodes(nodes: Array<Node>): void {
    var node: Node,
        i: number,
        text: string;

    for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        text = node.nodeValue;
        if (text.match(pgpRe)) {
            var message = openpgp.message.readArmored(text);
            openpgp.decryptMessage( privateKey.key, message )
               .then((plainText) => {
                   node.nodeValue = plainText;
               })
               .catch((error) => {
                   console.log(error);
               });
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

class Popup {

    /*------------------------------------------------------------
     *  Private variables and constants
     *-----------------------------------------------------------*/

    // Icon to show in the corner of each textarea
    private iconSize: number = 16;
    private iconSrc: string = chrome.runtime.getURL("/images/padlock.png");

    private popupWidth = 300;
    private popupHeight = 300;

    // Iframe to open inside the popup
    private iframeSrc = chrome.runtime.getURL("/iframe.html");

    // Textarea props to save (and restore) when showing and hiding the icon in
    // the corner
    private propsToSave: Array<string> = [
        'backgroundPositionX',
        'backgroundPositionY',
        'backgroundRepeat',
        'backgroundAttachment',
        'backgroundImage'
    ];


    // Save element's props here
    private savedProps: Object;

    /*------------------------------------------------------------
     *  Public variables and constructor
     *-----------------------------------------------------------*/

    // Holder of the currently opened UI object
    static current: Popup;

    // The texarea element we're modifying
    el: HTMLTextAreaElement;

    // The popup div that will contain the iframe
    popup: HTMLElement;

    // The iframe element
    iframe: HTMLIFrameElement;

    // A this-bound version of closePopup
    closeBound: EventListenerObject;

    constructor(el: HTMLTextAreaElement) {
        this.el = el;
        this.savedProps = {};

        // Save the current props
        this.saveProps();

        // Bind events
        el.addEventListener('mousemove', this.onMouseMove.bind(this));
        el.addEventListener('mouseout', this.onMouseOut.bind(this));
        el.addEventListener('keydown', this.onKeyDown.bind(this));
        el.addEventListener('click', this.onClick.bind(this));

        // Bind closer
        this.closeBound = this.closePopup.bind(this);
    }

    /*------------------------------------------------------------
     *  Event handers
     *-----------------------------------------------------------*/

    private onMouseMove(e: MouseEvent): void {
        if (!this.canEncrypt()) return;
        this.showIcon();
        if ( this.isOverIcon(e) ) {
            this.el.style.cursor = 'pointer';
        } else {
            this.el.style.cursor = 'text';
        }
    }

    private onMouseOut(e: MouseEvent): void {
        this.hideIcon();
    }

    private onKeyDown(e: Event): void {
        this.hideIcon();
    }

    private onClick(e: MouseEvent): void {
        if (!this.canEncrypt()) return;
        if ( this.isOverIcon(e) ) this.openPopup(e.x, e.y);
    }

    /*------------------------------------------------------------
     *  Save and restore element props
     *-----------------------------------------------------------*/

    // Save the element's style properties
    saveProps(): void {
        this.propsToSave.forEach((p) => {
            this.savedProps[p] = this.el.style[p]
        })
    }

    // Restore saved properties
    restoreProps(): void {
        this.propsToSave.forEach((p) => {
            this.el.style[p] = this.savedProps[p]
        })
    }

    /*------------------------------------------------------------
     *  Icon
     *-----------------------------------------------------------*/

    isOverIcon(e: MouseEvent): boolean {
        return this.el.offsetWidth - e.offsetX < this.iconSize && e.offsetY < this.iconSize
    }

    canEncrypt(): boolean {
        if (!this.el.value) return false;
        if (this.el.value.match(/localhost/)) return false; // TODO: real url
        return true;
    }

    showIcon(): void {
        this.el.style.backgroundPositionX = 'right'
        this.el.style.backgroundPositionY = 'top'
        this.el.style.backgroundRepeat = 'no-repeat'
        this.el.style.backgroundAttachment = 'scroll'
        this.el.style.backgroundImage = "url(" + this.iconSrc + ")"
    }

    hideIcon(): void {
        this.restoreProps()
    }

    /*------------------------------------------------------------
     *  Open and close popup
     *-----------------------------------------------------------*/

    openPopup(x: number, y: number): void {

        var popup: HTMLElement,
            iframe: HTMLIFrameElement;

        // popup element
        popup = document.createElement('div')
        popup.style.width = this.popupWidth + "px"
        popup.style.height = this.popupHeight + "px"
        popup.style.position = "absolute"
        popup.style.left = x + "px"
        popup.style.top = y + "px"

        // iframe element
        iframe = document.createElement('iframe')
        iframe.src = this.iframeSrc
        iframe.width = "100%"
        iframe.height = "100%"
        iframe.style.border = "none"

        popup.appendChild(iframe)
        document.body.appendChild(popup)


        // If clicked on the popup, do not bubble down
        popup.addEventListener('click', (e: Event) => {
            e.stopPropagation()
        });


        // If clicked outside of the popup, close it.
        // Can't bind right away, because it fires on the icon click
        setTimeout(() => {
            document.addEventListener('click', this.closeBound);
        }, 1000);

        this.popup = popup
        this.iframe = iframe
        Popup.current = this
    }

    // Close the popup and optionally set the new text of the input
    closePopup(newText?: string): void {
        this.popup.remove();
        Popup.current = null;
        document.removeEventListener('click', this.closeBound);
        if ( newText ) {
            this.el.value = newText;
            this.el.dispatchEvent(new Event('input'));
        }
    }

    encrypt(armoredPublicKeys: Array<string>, callback: Interfaces.ResultCallback): void {
        var keys: Array<openpgp.key.Key>;

        loadModule("openpgp", () => {
            keys = armoredPublicKeys.map((armoredText: string) => {
                return openpgp.key.readArmored(armoredText).keys[0];
            })

            openpgp.encryptMessage( keys, this.el.value ).then(callback).catch((err) => {
                console.log(err);
            })
        });
    }
}

window.onload = function() {
    setTimeout(run, config.decryptDelay);
}
