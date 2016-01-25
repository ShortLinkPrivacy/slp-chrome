/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

// These get initialized by the background page
var init: Interfaces.InitVars;

// Observer for newly created elements
var observer: MutationObserver;

// Regular expression for the url
var urlRe: RegExp;

// Connection port for messages to background
var port: chrome.runtime.Port;

// Generator of element IDs
var idGenerator = (function() {
    var counter = 1000;
    return function(prefix?: string): string {
        if (!prefix) prefix = "element";
        return ['slp', prefix, counter++].join("-");
    }
})();

// Installs listeners for 'input' and 'click' to all editable and textareas
class Editable {
    element: HTMLElement = null;
    frameId: string;
    savedValue: string;

    constructor(el: HTMLElement) {
        // If the element has no id, then assign one to it
        if ( el.id == "" ) {
            el.id = idGenerator('editable');
        }

        this.element = el;
        this.frameId = window.frameElement ? window.frameElement.id : null;
        this.bindEvents();

        // Save the new instance in an attribute on the element
        $data(this.element, init.config.pgpElAttr, this);
    }

    private bindEvents(): void {
        var message: Interfaces.ElementLocator = {
            command: 'activeElement',
            frameId: this.frameId,
            elementId: this.element.id
        };
        this.element.addEventListener('focus', function() {
            chrome.runtime.sendMessage(message);
        }.bind(this));
    }

    // Get the text value of the editable
    getText(): string {
        if ( !this.element ) return;
        return this.element.tagName == "TEXTAREA" 
            ? (<HTMLTextAreaElement>this.element).value 
            : this.element.textContent;
    }

    // Set a new text value in the editable element while saving the original
    // value of the element so it can be restored
    setText(text: string, noSave?: boolean): void {
        if ( !this.element ) return;

        // Save original value
        if (!noSave) {
            this.savedValue = this.getText();
        }

        // Set new value
        if ( this.element.contentEditable == "true" ) {
            this.element.textContent = text;
        } else if ( this.element.tagName == "TEXTAREA" ) {
            (<HTMLTextAreaElement>this.element).value = text;
        }

        // Dispatch events and focus
        this.element.dispatchEvent(new Event('input'));
        this.element.focus();
    }


    // Restore the saved value of the element
    restoreText(): boolean {
        if ( !this.element ) return;
        if ( typeof this.savedValue != "undefined" && this.savedValue != null ) {
            this.setText(this.savedValue, true);
            this.savedValue = null;
            return true;
        }

        return false;
    }
}

// Takes a parent element, searches for elements with a spcific class name
// and attaches onClick bindings so they can be imported into the user's address
// book
var hotlinkPublicKeys = (function() {

    function _bindOnClick(el: HTMLElement) {
        return function(e: MouseEvent): void {
            e.preventDefault();
            e.stopPropagation();
            chrome.runtime.sendMessage({ command: 'addPublicKey', messageId: el.getAttribute('rel') }, (result) => {
                if ( result.success ) {
                    el.classList.add(init.config.pgpPKAdded);
                    el.removeEventListener('click', _bindOnClick(el));
                }
            })
        }
    }

    function hotlinkPublicKeys(parentEl: HTMLElement): void {
        var list = parentEl.getElementsByClassName(init.config.pgpPK),
            i: number;

        for (i = 0; i < list.length; i++) {
            var el = list[i];
            if (el.classList.contains(init.config.pgpPKAdded)) continue;
            el.addEventListener('click', _bindOnClick(<HTMLElement>el));
        }
    }

    return hotlinkPublicKeys;
})();

var traverseNodes = (function(){

    function decodeURL(url: string, callback: { (decodedText): void }): void {
        chrome.runtime.sendMessage({ command: "decryptLink", url: url }, (result) => {
            callback( result.success ? result.value : "Error decrypting" );
        });
    }

    function decodeNode(node: Node, url: string): void {

        // If the private key has not been unlocked, then add a notification
        if ( !init.isDecrypted ) {
            chrome.runtime.sendMessage({ command: 'needPassword' });
            return;
        }

        decodeURL(url, (newValue) => {
            var parentEl = node.parentElement;

            // Remove links (some sites hotlink URLs)
            if ( parentEl.tagName == 'A' ) {
                parentEl = parentEl.parentElement;
            }

            // Save the current value of the element and give it a new class
            $data(parentEl, init.config.pgpData, parentEl.innerHTML)
            parentEl.classList.add(init.config.pgpClassName);

            // Set the new value
            parentEl.innerHTML = newValue;

            // Create public key hotlinks
            hotlinkPublicKeys(parentEl);
        });
    }

    function traverseNodes(root: HTMLElement): void {
        var walk: TreeWalker,
            node: Node,
            match;

        // Create a walker from the root element, searching only for text nodes
        walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);

        while (node = walk.nextNode()) {
            if ( node.nodeType == Node.TEXT_NODE ) {
                if ( match = urlRe.exec(node.nodeValue) ) {
                    decodeNode(node, match[0]);
                }
            } else if ( node.nodeType == Node.ELEMENT_NODE ) {
                var el = <HTMLElement>node;

                // Is it editable? Then make it work.
                if ( el.contentEditable  == "true" || el.tagName == "TEXTAREA" ) {
                    new Editable(el);

                // Is it a link? Then get the href, place it in the textContent of the link,
                // then traverse this node only to decode 
                } else if ( el.tagName == "A" && (match = urlRe.exec(el.getAttribute('href'))) ) {
                    decodeNode(node, match[0]);
                    walk.nextNode();    // Skip next node (it's the text inside the A)
                }
            }
        }
    }

    return traverseNodes;
})();

// Observe for new nodes
function eventObserver(): void {
    observer = new MutationObserver((mutationArray) => {
        mutationArray.forEach((mutation) => {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                var node = mutation.addedNodes[i];
                traverseNodes(<HTMLElement>node);
            }
        });
    });
    observer.observe(document, { childList: true, subtree: true });
}

// Retrieves variables indicating the status of the background page, such as
// 'isDecrypted' (the private key) and others.
function getInitVars(callback: Interfaces.Callback): void {
    chrome.runtime.sendMessage({command: 'init'}, (result) => {
        init = result.value;
        urlRe = new RegExp(init.linkRe);
        callback()
    });
}

function $data(el: HTMLElement, name: string, value?: any): any {
    if ( typeof value != "undefined" ) {
        if ( value == null )
            delete el.attributes[name]
        else
            el.attributes[name] = value;
    }

    return el.attributes[name];
}

// Listen for messages from the extension
function listenToMessages() {

    var editable: Editable;

    // Get the active element and its value
    // ------------------------------------------------------------
    var getElementText = function(msg, sendResponse) {
        if (!editable) return;
        sendResponse({ value: editable.getText() });
    }

    // Set the active element and mark it as encrypted
    // ------------------------------------------------------------
    var setElementText = function(msg, sendResponse) {
        if (!editable) return;
        editable.setText(msg.setElementText);
    }

    // Restore the original text of the textarea
    // ------------------------------------------------------------
    var restoreElementText = function(msg, sendResponse) {
        if (!editable) return;
        var result = editable.restoreText();
        sendResponse({ success: result });
    }

    // Return all decrypted nodes to their original values
    // ------------------------------------------------------------
    var lock = function(msg, sendResponse) {
        var els = document.getElementsByClassName(init.config.pgpClassName),
            i: number,
            parentEl: HTMLElement,
            orgValue: string;

        observer.disconnect()
        getInitVars(() => {
            // getElementsByClassName returns a live collection, which will
            // change as the collection criteria changes. This is why we
            // remove the class names in reverse
            for (i = els.length - 1; i >= 0; i--) {
                parentEl = <HTMLElement>els[i];
                parentEl.classList.remove(init.config.pgpClassName);
                if ( orgValue = $data(parentEl, init.config.pgpData) ) {
                    parentEl.innerHTML = orgValue;
                    $data(parentEl, init.config.pgpData, null);
                }
            }
            observer.observe(document, { childList: true, subtree: true });
        });
    }

    // Decrypt all nodes
    // ------------------------------------------------------------
    var traverse = function(msg, sendResponse) {
        getInitVars(() => { traverseNodes(document.body) });
    }

    // Message listener
    // ============================================================
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        var eloc: Interfaces.ElementLocator, 
            element: HTMLElement;

        if ( eloc = msg.elementLocator ) {
            if ( window.frameElement && window.frameElement.id != eloc.frameId )
                return;
            if ( !window.frameElement && eloc.frameId != null )
                return;
            element = document.getElementById(eloc.elementId);
            editable = $data(element, init.config.pgpElAttr);
        } else {
            editable = null;
        }

        if ( msg.getElementText )
            getElementText(msg, sendResponse)
        else if ( msg.setElementText)
            setElementText(msg, sendResponse)
        else if ( msg.traverse )
            traverse(msg, sendResponse)
        else if ( msg.lock )
            lock(msg, sendResponse)
        else if ( msg.restoreElementText )
            restoreElementText(msg, sendResponse)
    });
}

// Bootstrap
getInitVars(() => {

    // If we are in a frame and the frame has no id attribute, 
    // then assign one to it
    if ( window.frameElement && !window.frameElement.id ) {
        window.frameElement.id = idGenerator('frame');
    }

    if ( init.hasPrivateKey ) {
        traverseNodes(document.body);
        eventObserver();
        listenToMessages();
    }
})
