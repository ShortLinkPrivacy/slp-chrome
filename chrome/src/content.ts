/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

// These get initialized by the background page
var init: Interfaces.InitVars;

// Observer for newly created elements
var observer: MutationObserver;

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
            node.nodeValue = newValue;

            // Remove links (some sites hotlink URLs)
            if ( node.parentElement.tagName == "A" ) {
                var el = document.createElement('span');
                el.innerHTML = node.nodeValue;
                node.parentElement.parentElement.appendChild(el);
                node.parentElement.remove();
            }
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

// Listen for messages from the extension
function listenToMessages() {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        var el: HTMLTextAreaElement = <HTMLTextAreaElement>document.activeElement;

        // Get the active element value. If the element is a TEXTAREA, then
        // return its value. Otherwise returns null.
        if ( msg.getElement ) {
            var value;
            if ( el.tagName == 'TEXTAREA' ) value = el.value || "";
            sendResponse(value);
        }

        // Encrypt the current textarea
        else if ( msg.setElement ) {
            el.value = msg.setElement;
            el.dispatchEvent(new Event('input'));
            el.focus();
        }
    });
}

// Get variables and bootstrap
chrome.runtime.sendMessage({command: 'init'}, (result) => {
    init = result.value;
    traverseNodes(document.body);
    eventObserver();
    listenToMessages();
});
