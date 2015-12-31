/// <reference path="../../typings/chrome/chrome.d.ts" />

// The get initialized by the background page
var linkRe: RegExp,
    privateKeyDecrypted: boolean;

// Observer for newly created elements
var observer: MutationObserver;

function decodeText(codedText: string, callback: { (decodedText): void }): void {
    var match = linkRe.exec(codedText),
        messageId: string;

    if (!match) {
        callback(codedText);
        return;
    }

    messageId = match[1];

    chrome.runtime.sendMessage({ command: "decryptLink" }, (result) => {
        if ( result.success ) {
            codedText = codedText.replace(linkRe, result.value);
        } else {
            codedText = codedText.replace(linkRe, "[PGP MESSAGE:" + messageId + "]"); // TODO: add link
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
        node: Node;

    // Create a walker from the root element, searching only for text nodes
    walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    while (node = walk.nextNode()) {
        if (node.nodeValue.match(linkRe))
            decodeNode(node);
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


/************************************************************
 * Bootstrap and run at window.onload
 ************************************************************/
function run(): void {

    // All of this only matters if the guy has a private key set up
    chrome.runtime.sendMessage({ getPrivateKey: true }, (value) => {
        if ( value ) {
            traverseNodes(document.body);
            eventObserver();
        } else {
            // TODO: nag about adding public key
            // (perhaps only when there are nodes to decrypt)
        }
    });
}

// Listen for messages from the extension
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

    // The background page is ready
    else if ( msg.backgroundReady ) {
        linkRe = msg.linkRe;
        privateKeyDecrypted = msg.privateKeyDecrypted;
        run();
    }
});

