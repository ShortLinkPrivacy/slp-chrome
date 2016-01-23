/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

// These get initialized by the background page
var init: Interfaces.InitVars;

// Observer for newly created elements
var observer: MutationObserver;

// Regular expression for the url
var urlRe: RegExp;

// The last active (events 'input' and 'click') element. It is going to be
// requested by the browser script.
var activeElement: HTMLElement = null;

function decodeText(codedText: string, callback: { (decodedText): void }): void {
     var   match = urlRe.exec(codedText),
        messageId: string,
        url: string;

    if (!match) {
        callback(codedText);
        return;
    }

    url = match[0];
    messageId = match[1];

    chrome.runtime.sendMessage({ command: "decryptLink", url: url }, (result) => {
        if ( result.success ) {
            codedText = codedText.replace(url, result.value);
        } else {
            codedText = "Error decrypting"
        }
        decodeText(codedText, callback);
    });
};

// This closure is used by 'hotlinkPublicKeys'. It returns a 'click' binder
// which is attached to public key buttons.
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

// Takes a parent element, searches for elements with a spcific class name
// and attaches onClick bindings so they can be imported into the user's address
// book
function hotlinkPublicKeys(parentEl: HTMLElement): void {
    var list = parentEl.getElementsByClassName(init.config.pgpPK),
        i: number;

    for (i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.classList.contains(init.config.pgpPKAdded)) continue;
        el.addEventListener('click', _bindOnClick(<HTMLElement>el));
    }
}

function decodeNode(node: Node): void {
    decodeText( node.nodeValue, (newValue) => {
        if ( newValue != node.nodeValue ) {
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
        }
    });
}

function traverseNodes(root: HTMLElement): void {
    var walk: TreeWalker,
        node: Node;

    // Create a walker from the root element, searching only for text nodes
    walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    while (node = walk.nextNode()) {
        if (node.nodeValue.match(urlRe)) {
            if ( init.isDecrypted ) {
                decodeNode(node);
            } else {
                chrome.runtime.sendMessage({ command: 'needPassword' });
            }
        }
    }
}

// Traverse nodes for the creation of new editable elements
function findNewEditables(root: HTMLElement): void {
    var walk: TreeWalker,
        node: Node;

    // Create a walker from the root element, searching only for element nodes
    walk = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

    while (node = walk.nextNode()) {
        var el = <HTMLElement>node;
        if ( el.contentEditable  == "true" || el.tagName == "TEXTAREA" ) {
            el.addEventListener('input', bindListener(el));
            el.addEventListener('click', bindListener(el));
        }
    }
}

// Observe for new nodes
function eventObserver(): void {
    observer = new MutationObserver((mutationArray) => {
        mutationArray.forEach((mutation) => {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                var node = mutation.addedNodes[i];
                traverseNodes(<HTMLElement>node);
                findNewEditables(<HTMLElement>node);
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

function $data(el: HTMLElement, name: string, value?: any): string {
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

    // Private function that sets an editable element's value.
    // Used in setElementText and restoreElementText
    function setElementValue(el: HTMLElement, value: string): void {
        if ( el.contentEditable == "true" ) {
            el.textContent = value;
        } else if ( el.tagName == "TEXTAREA" ) {
            (<HTMLTextAreaElement>el).value = value;
        }
        el.dispatchEvent(new Event('input'));
        el.focus();
    }

    // Get the active element and its value
    // ------------------------------------------------------------
    var getElementText = function(msg, sendResponse) {
        var value: string = null;
        if ( activeElement ) {
            value = activeElement.tagName == "TEXTAREA" 
                ? (<HTMLTextAreaElement>activeElement).value 
                : activeElement.textContent;
        }        
        sendResponse({ value: value });
    }

    // Set the active element and mark it as encrypted
    // ------------------------------------------------------------
    var setElementText = function(msg, sendResponse) {

        // If there is no activeElement, then try to fine one
        if ( !activeElement ) {
            activeElement = 
                <HTMLElement>document.querySelector("[contentEditable=true]") ||
                <HTMLElement>document.querySelector("textarea");
        }

        // Still nothin found? Oh, well.
        if ( !activeElement ) return;

        // Save the original value of the element so it can be restored and set
        // the new value (encrypted url). Note that in order to get the value
        // of the element, we're using the already established getElementText
        // call, do we don't have to repeat code or resort to too much
        // abstraction.
        getElementText(null, (result) => {
            $data(activeElement, init.config.pgpElAttr, result.value);
            setElementValue(activeElement, msg.setElementText);
        });
    }

    // Restore the original text of the textarea
    // ------------------------------------------------------------
    var restoreElementText = function(msg, sendResponse) {
        var orgValue: string;

        // TODO: search for the element
        if (!activeElement) return;

        orgValue = $data(activeElement, init.config.pgpElAttr);
        if ( typeof orgValue != "undefined" && orgValue != null ) {
            $data(activeElement, init.config.pgpElAttr, null);
            setElementValue(activeElement, orgValue);
            sendResponse({ success: true })
        } else {
            sendResponse({ success: false });
        }
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

// Installs listeners for 'input' and 'click' to all editable and textareas and
// updates the activeElement variable to whichever element was edited last.
// This is needed by the browser script in order to determine which element to
// encrypt and decrypt.

function bindListener(element: Element) {
    return function(e: Event): void {
        activeElement = <HTMLElement>element;
    }
}

function updateActiveElement() {
    var editables = document.querySelectorAll("[contentEditable=true]"),
        textareas = document.getElementsByTagName('textarea');

    function doList(list) {
        var i: number;
        for (i = 0; i < list.length; i++) {
            var el = list[i];
            el.addEventListener('input', bindListener(el));
            el.addEventListener('click', bindListener(el));
        }
    }

    doList(editables);
    doList(textareas);
}

// Get variables and bootstrap
getInitVars(() => {
    updateActiveElement();
    if ( init.hasPrivateKey ) {
        traverseNodes(document.body);
        eventObserver();
        listenToMessages();
    }
})
