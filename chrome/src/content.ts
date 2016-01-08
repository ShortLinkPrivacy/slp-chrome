/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

// These get initialized by the background page
var init: Interfaces.InitVars;

// Observer for newly created elements
var observer: MutationObserver;

// Classes and attributes to add to decrypted nodes
var pgpClassName = '__pgp',         // The class name to add to dectypted nodes
    pgpData = '__pgp_data';         // Propery to add to nodes with the original content


function decodeText(codedText: string, callback: { (decodedText): void }): void {
    var re = new RegExp(init.linkRe),
        match = re.exec(codedText),
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
            codedText = codedText.replace(url, "[PGP MESSAGE:" + messageId + "]"); // TODO: add link
        }
        decodeText(codedText, callback);
    });
};

function decodeNode(node: Node): void {
    decodeText( node.nodeValue, (newValue) => {
        if ( newValue != node.nodeValue ) {
            var parentEl = node.parentElement;

            // Remove links (some sites hotlink URLs)
            if ( parentEl.tagName == 'A' ) {
                parentEl = parentEl.parentElement;
            }

            // Save the current value of the element and give it a new class
            $data(parentEl, pgpData, parentEl.innerHTML)
            parentEl.classList.add(pgpClassName);

            // Set the new value
            parentEl.innerHTML = newValue;
        }
    });
}

function traverseNodes(root: HTMLElement): void {
    var walk: TreeWalker,
        node: Node,
        re: RegExp;

    re = new RegExp(init.linkRe);

    // Create a walker from the root element, searching only for text nodes
    walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    while (node = walk.nextNode()) {
        if (node.nodeValue.match(re)) {
            if ( init.isDecrypted ) {
                decodeNode(node);
            } else {
                chrome.runtime.sendMessage({ command: 'needPassword' });
            }
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
        callback()
    });
}

function $data(el: HTMLElement, name: string, value?: any): string {
    if ( typeof value != "undefined" ) {
        el.attributes[name] = value;
    }

    return el.attributes[name];
}

// Listen for messages from the extension
function listenToMessages() {

    // The name of the flag that we will use in the text area element to
    // signal that it has been encrypted.
    var _crypted = '__pgp_crypted';

    // The handler function to be added oninput to each encrypted element.
    // It listens for changes in value and marks the element as non-encrypted.
    var inputListener = function(e: Event) {
        $data(<HTMLElement>e.target, _crypted, false);
    };

    // Set the textarea value and fire the change events
    var setElementValue = function(el: HTMLTextAreaElement, value: string): void {
        el.value = value;
        el.dispatchEvent(new Event('input'));
        el.focus();
    }

    // Get the active element and some metadata about it
    // ------------------------------------------------------------
    var getElement = function(msg, sendResponse) {
        var el = <HTMLTextAreaElement>document.activeElement;

        sendResponse({
            tagName: el.tagName,
            value: el.value,
            crypted: $data(el, _crypted) ? true : false
        });
    }

    // Set the active element and mark it as encrypted
    // ------------------------------------------------------------
    var setElement = function(msg, sendResponse) {
        var el = <HTMLTextAreaElement>document.activeElement;

        if ( el.tagName == 'TEXTAREA' ) {
            // Save the original value of the element and mark it as encrypted.
            // We will do two thing with this:
            // 1) We'll be able to restore the clear text if requested.
            // 2) We will recognize this element as encrypted and will not allow
            //    that it gets encrypted again.
            $data(el, _crypted, el.value);

            // Set new value (encrypted url)
            setElementValue(el, msg.setElement);

            // If the element value ever changes, then clear the encrypted flag.
            // You can not double-bind the same function, so there is no need to
            // wrap this in a condition.
            el.addEventListener('input', inputListener);
        }
    }

    // Restore the original text of the textarea
    // ------------------------------------------------------------
    var restoreElement = function(msg, sendResponse) {
        var el = <HTMLTextAreaElement>document.activeElement,
            orgValue: string;

        orgValue = $data(el, _crypted);
        if ( typeof orgValue != "undefined" && orgValue != null ) {
            setElementValue(el, orgValue);
            sendResponse({ success: true })
        } else {
            sendResponse({ success: false });
        }
    }

    // Return all decrypted nodes to their original values
    // ------------------------------------------------------------
    var lock = function(msg, sendResponse) {
        var els = document.getElementsByClassName(pgpClassName),
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
                parentEl.classList.remove(pgpClassName);
                if ( orgValue = $data(parentEl, pgpData) ) {
                    parentEl.innerHTML = orgValue;
                    $data(parentEl, pgpData, null);
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
        if ( msg.getElement )
            getElement(msg, sendResponse)
        else if ( msg.setElement )
            setElement(msg, sendResponse)
        else if ( msg.traverse )
            traverse(msg, sendResponse)
        else if ( msg.lock )
            lock(msg, sendResponse)
        else if ( msg.restore )
            restoreElement(msg, sendResponse)
    });
}

// Get variables and bootstrap
getInitVars(() => {
    traverseNodes(document.body);
    eventObserver();
    listenToMessages();
})
