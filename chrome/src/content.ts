/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

// These get initialized by the background page
var init: Interfaces.InitVars;

// Observer for newly created elements
var observer: MutationObserver;

// Regular expression for the url
var urlRe: RegExp,
    urlReg: RegExp;

// Has anything been done on this tab slp-wise. Used to determine if the tab
// needs to get refreshed after upgrade
var hasWorkDone: boolean;

// Generator of element IDs
function idGenerator (prefix: string) {
    if (typeof prefix == "undefined") prefix = "id";
    return Math.random().toString(36).substr(2, 16);
};

function isOSX(): boolean {
    return window.navigator.platform.match(/mac/i) != null;
}

interface BgPageArgs {
    frameId?: string;
    elementId?: string;
    messageId?: Messages.Id;
    properties?: any;
    text?: string;
    lastMessage?: Interfaces.LastMessage;
    url?: string;
}

function messageBgPage(command: string, args: BgPageArgs, callback?: Interfaces.ResultCallback<any>): void {
    var message = args ? args : {};
    message["command"] = command;
    chrome.runtime.sendMessage(message, callback);
}

// Installs listeners for 'input' and 'click' to all editable and textareas
class Editable {
    element: HTMLElement = null;
    frameId: string;
    savedValue: string;
    lastMessage: Interfaces.LastMessage;

    constructor(el: HTMLElement) {
        // If the element was already initialized, then bail
        if ( $data(el, init.config.pgpElAttr) ) return;

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
        var eventHandler = function() {
            this.setAsActive();
            this.updateContextMenu();
        }.bind(this);

        // Change listeners
        this.element.addEventListener('focus', eventHandler);
        this.element.addEventListener('click', eventHandler);
        this.element.addEventListener('input', eventHandler);

        // Quick encrypt shortcut
        this.element.addEventListener('keydown', (e: KeyboardEvent) => {
            var trigger: boolean;
            if ( isOSX() ) {
                // Mac: Command-Option-L
                trigger = e.keyCode == 76 && e.metaKey == true && e.altKey == true;
            } else {
                // PC: Shift-Ctrl-L
                trigger = e.keyCode == 76 && e.ctrlKey == true && e.shiftKey == true;
            }
            if (trigger == true) {
                e.preventDefault();
                e.stopPropagation();
                this.encryptLast();
            }
        })
    }

    // Tells if it's OK to encrypt for the last recepient
    private okToUseLast(): boolean {
        return this.getText()
            && this.hasLastMessage()
            && !this.isAlreadyEncrypted() ? true : false;
    }

    // Is the element a TEXTAREA?
    isTextarea(): boolean {
        return this.element.tagName == "TEXTAREA";
    }

    // Does the editable contain a magic url?
    isAlreadyEncrypted(): boolean {
        return this.getText() && this.getText().match(urlRe) ? true : false;
    }

    // Do we have the last keys used to encrypt?
    hasLastMessage(): boolean {
        return this.lastMessage
            && this.lastMessage.fingerprints
            && this.lastMessage.fingerprints.length > 0 ? true : false;
    }

    // Set this editable as the active one for this tab
    setAsActive(): void {
        messageBgPage('setActiveElement', {
            frameId: this.frameId,
            elementId: this.element.id
        });
    }

    // Update the context menu based on the contents of the editable
    updateContextMenu(): void {
        messageBgPage('updateContextMenu', {
            properties: { enabled: this.okToUseLast() }
        });
    }

    // Encrypt the editable with the last keys used
    encryptLast(callback?: Interfaces.ResultCallback<string>): void {
        if ( this.okToUseLast() == false ) return;

        var args = {
            text: this.getText(),
            lastMessage: this.lastMessage
        };

        messageBgPage('encryptLikeLastMessage', args, (result: Interfaces.Success<Messages.UrlType>) => {
            if ( result.success ) {
                var umsg = result.value;
                this.setText(umsg.body);
                if ( callback ) callback(umsg.body);
            }
        });
    }

    // Get the text value of the editable
    getText(): string {
        if ( !this.element ) return;
        return this.isTextarea() == true
            ? (<HTMLTextAreaElement>this.element).value
            : this.element.textContent;
    }

    // Selects the contents of the element. Needed to paste
    // the new value
    private selectTextInElement(): void {
        if ( this.isTextarea() == true ) {
            this.element.focus();
            document.execCommand('selectAll', false, null);
        } else {
            // http://jsfiddle.net/zAZyy/
            if (window.getSelection) {
                var selection = window.getSelection();
                var range = document.createRange();
                range.selectNodeContents(this.element);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    // Set a new text value in the editable element while saving the original
    // value of the element so it can be restored
    setText(text: string, noSave?: boolean): void {
        if ( !this.element ) return;

        // Save original value
        if (!noSave) {
            this.savedValue = this.getText();
        }

        // Focus the element and select all the text inside
        this.element.focus();
        this.selectTextInElement();

        // Create a text event with the new value (it's like pasting it over the selection)
        var ev = document.createEvent('TextEvent');
        ev.initTextEvent('textInput', true, true, window, text, 0, 'en_US');  // XXX: Chrome only
        this.element.dispatchEvent(ev);
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
            messageBgPage('addPublicKey', { messageId: el.getAttribute('rel') }, (result: Interfaces.Success<Messages.Id>) => {
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

            // Add no-style class to the paren element, which is
            // the echanted span container.
            if ( el.parentElement ) {
                el.parentElement.classList.add('__pgp_neutral')
            }

            // Add click binding only if the 'added-already' class is not set
            if (!el.classList.contains(init.config.pgpPKAdded)) {
                el.addEventListener('click', _bindOnClick(<HTMLElement>el));
            }

        }
    }

    return hotlinkPublicKeys;
})();

var traverseNodes = (function(){

    // Tells if the A element is a match for decryption. Most A elements will
    // have the URL in the href attribute, but Twitter (and possibly others)
    // will have it in the 'data-expanded-url' and such. Returns the magic URL
    // if found or undefined if not.
    function isMatchingA(el: HTMLElement): string {
        var i: number,
            attr: string;

        if ( el.tagName != 'A' ) return;

        for (i = 0; i < el.attributes.length; i++) {
            attr = el.attributes.item(i).value;
            if ( attr.match(urlRe) ) return attr;
        }
    }

    // Tells if the element is inside an editable. It will check up to 'steps'
    // levels up to find the editable element.  Twitter (and possibly others)
    // will create a link inside the editable. We don't want to decrypt it!
    function isInsideEditable(el: HTMLElement|Node): boolean {
        var steps: number = 3;

        while (el.parentElement && !el.parentElement.isContentEditable && steps > 0){
            el = el.parentElement;
            steps--;
        }

        return el.parentElement && el.parentElement.isContentEditable;
    }

    // Finds all links that point to magic urls and replaces them with text
    // nodes, so they can be found by getNodeList.
    function fixLinks(root: HTMLElement): void {
        if ((<Node>root).nodeType != Node.ELEMENT_NODE) return;

        var els = root.getElementsByTagName('a'),
            url: string,
            i: number;

        for (i = 0; i < els.length; i++) {
            var element = els[i];
            if ( isInsideEditable(element) ) continue;
            if ( url = isMatchingA(element) ) {
                element.innerText = url
            }
        }
    }

    // Remove all attributes from an anchor element
    function removeAllAttributes(el: HTMLAnchorElement): void {
        var i: number, name: string;

        if ( el.tagName != 'A' ) return;

        for (i = el.attributes.length - 1; i >= 0; i--) {
            name = el.attributes.item(i).name;
            el.removeAttribute(name);
        }
    }

    // Takes a node and replaces all magic links with magic <span> elements
    function enchantNode(node: Node): void {
        var text: string,
            parentEl, grandParentEl: HTMLElement;

        if ( node.nodeType != Node.TEXT_NODE ) return;
        if ( !node.parentElement ) return;

        parentEl = node.parentElement;

        // We will be creating element, so we must stop the observer
        stopObserver();

        // If the node is trapped in a link, then try to replace the A element
        // with a SPAN element. Sometimes that's not possible (Hangouts), so in
        // this case we neuter the A element and reuse it as a container.
        if ( parentEl.tagName == "A" ) {

            if ( window.location.host == 'hangouts.google.com') {
                removeAllAttributes(<HTMLAnchorElement>parentEl);
                parentEl.className = '__pgp_inherit';
            } else {
                grandParentEl = parentEl.parentElement;
                var span = document.createElement('span');
                span.appendChild(node);
                grandParentEl.replaceChild(span, parentEl);
                parentEl = span;
            }

        }

        // Save the element value it its "memory" element, so it can be restored
        if ( !parentEl.classList.contains(init.config.pgpClassName) ) {
            $data(parentEl, init.config.pgpData, parentEl.innerHTML);
            parentEl.classList.add(init.config.pgpClassName);
        }

        // Replace all magic urls inside the link with magic <span> elements
        text = node.nodeValue.replace(urlReg, "<span class='" + init.config.pgpEnchanted + "' rel='$1'>Decrypting ...</span>");
        parentEl.innerHTML = text;

        // Restart the observer
        startObserver();
    }

    function setElementExpiration(el: HTMLElement, amsg: Messages.ClearType): void {
        var now, cre: Date, ttl: number;

        if (!amsg.timeToLive) return;

        now = new Date();
        cre = amsg.createdDate ? new Date(amsg.createdDate) : now;
        ttl = now.getTime() - cre.getTime() + amsg.timeToLive * 1000;
        setTimeout(() => {
            el.innerHTML = "Expired private message";
            el.classList.add("__pgp_expired");
        }, Math.max(0, ttl));
    }

    // Gathers a list of all enchanted elements and decodes them one by one
    function decodeEnchanted(root: HTMLElement, callback: Interfaces.Callback): void {
        var els = root.getElementsByClassName(init.config.pgpEnchanted),
            i: number,
            count = 0;

        var _decode = function(idx: number, done: Interfaces.Callback): void {
            var element = <HTMLElement>(els[idx]),
                messageId: Messages.Id = element.getAttribute('rel');

            if (!messageId) return;

            count++;
            messageBgPage( 'decryptLink', { messageId: messageId }, (result: Interfaces.Success<Messages.ClearType>) => {
                if ( result.success ) {
                    var amsg: Messages.ClearType = result.value;
                    element.innerHTML = amsg.body;
                    element.classList.add("__pgp_decrypted");

                    // Expiring?
                    setElementExpiration(element, amsg);
                } else {
                    element.innerText = result.error;
                    element.classList.add("__pgp_error");
                }
                count--;
                if ( count <= 0) done();
            })
        }

        if ( els.length > 0) {
            for (i = 0; i < els.length; i++) _decode(i, callback);
        } else {
            callback();
        }
    }

    // Returns an array of nodes that contain short links. These nodes will be
    // of type TEXT.  Some nodes might have several short links in them mixed
    // inside unencrypted text.
    function getNodeList(root: HTMLElement): Array<Node> {
        var walk: TreeWalker,
            node: Node,
            nodeList: Array<Node> = [];

        // Create a walker from the root element, searching only for text nodes
        walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

        while (node = walk.nextNode()) {
            if (node.nodeValue.match(urlRe) && !isInsideEditable(node)) nodeList.push(node);
        }

        return nodeList;
    }

    function traverseNodes(root: HTMLElement): void {
        var nodeList: Array<Node>,
            i: number;

        // Fix links with altered magic urls in the innerText
        fixLinks(root);

        // Gather a list of TEXT nodes that contain magic urls
        nodeList = getNodeList(root);

        // If no nodes found, return
        if (nodeList.length == 0) return;

        // Found something to decrypt in the page, mark hasWorkDone
        hasWorkDone = true;

        // If the private key has not been unlocked, then add a notification
        // and return
        if ( !init.isDecrypted ) {
            messageBgPage('needPassword', {});
            return;
        }

        // Run over all found nodes, look for magic urls and turn them into
        // enchanted span elements
        for (i = 0; i < nodeList.length; i++) {
            enchantNode(nodeList[i]);
        }

        // Find all echanted elements and decode them.
        decodeEnchanted(root, () => {
            // Look for the public key class and bind onclick events
            hotlinkPublicKeys(root);

            // Send a 'decoding_complete' message to the window. Can be used
            // for testing and such.
            window.postMessage('slp_done_decoding', document.location.href);
        });

    }

    return traverseNodes;
})();

// Find all editables and bind class Editable to them
function bindEditables(root: HTMLElement): void {
    if ((<Node>root).nodeType != Node.ELEMENT_NODE) return;

    var editables = root.querySelectorAll("[contenteditable='true']"),
        textareas = root.getElementsByTagName('textarea'),
        i: number,
        last: Editable;

    for (i = 0; i < textareas.length; i++)
        last = new Editable(<HTMLElement>textareas[i]);
    for (i = 0; i < editables.length; i++)
        last = new Editable(<HTMLElement>editables[i]);

    // Set the last one found as the active one
    if ( last && last.element ) {
        last.setAsActive();
        hasWorkDone = true;
    }
}

// Observe for new nodes
function eventObserver(): void {
    observer = new MutationObserver((mutationArray) => {
        mutationArray.forEach((mutation) => {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                var el = <HTMLElement>mutation.addedNodes[i];
                traverseNodes(el);
                bindEditables(el);
            }
        });
    });
    startObserver();
}

function stopObserver() {
    if ( observer ) observer.disconnect();
}

function startObserver() {
    if ( observer )
        observer.observe(document, { childList: true, subtree: true });
}

// Retrieves variables indicating the status of the background page, such as
// 'isDecrypted' (the private key) and others.
function getInitVars(callback: Interfaces.Callback): void {
    messageBgPage('initVars', {}, (result: Interfaces.Success<Interfaces.InitVars>) => {
        init = result.value;
        urlRe = new RegExp(init.linkRe);
        urlReg = new RegExp(init.linkRe, 'g');
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
// TODO: maybe convert it to class, like background
class MessageListener {
    editable: Editable;

    constructor() {
        chrome.runtime.onMessage.addListener((msg: Interfaces.ContentMessage<any>, sender, sendResponse) => {
            var eloc: Interfaces.ElementLocator,
                element: HTMLElement;

            // If element locator element is provided in the message, then we're
            // dealing with an editable and we need to first locate it.
            if ( eloc = msg.elementLocator ) {

                // If we're in a frame and the id of the frame does not match the
                // one provided in the locator, then no.
                if ( window.frameElement && window.frameElement.id != eloc.frameId )
                    return;

                // If we're in the top window and the id of the frame in the
                // locator is not null, then no.
                if ( !window.frameElement && eloc.frameId != null )
                    return;

                // At this point, we have determined that the element and frame ID
                // provided in the locator match the document we're running in.  If
                // the element can not be found, then bail. Gmail (and possibly
                // others do some frame trickery that confuses the shit out of the
                // content script)
                if (element = document.getElementById(eloc.elementId)) {
                    this.editable = $data(element, init.config.pgpElAttr);
                } else {
                    return;
                }
            } else {
                this.editable = null;
            }

            try {
                this[msg.action](sendResponse, msg);
            } catch(e) {
                // TODO: report error
                sendResponse({success: false, error: e});
            }
        });
    }

    // Get the active element and its value
    getElementText(sendResponse) {
        if (!this.editable) return;
        sendResponse({
            value: this.editable.getText(),
            lastMessage: this.editable.lastMessage
        });
    }

    // Set the active element and mark it as encrypted
    setElementText(sendResponse, msg: Interfaces.ContentMessage<Messages.UrlType>) {
        var urlMsg: Messages.UrlType;

        if (!this.editable) {
            sendResponse({ success: false, error: "No editable input fields found" });
            return;
        };

        urlMsg = msg.value;

        this.editable.setText(urlMsg.body);

        // Only set the last message if it has fingerprints. Otherwise it
        // will be a public key link or other non-message type.
        if ( urlMsg.fingerprints && urlMsg.fingerprints.length ) {
            this.editable.lastMessage = urlMsg;
        }

        sendResponse({ success: true });
    }

    // Restore the original text of the textarea
    restoreElementText(sendResponse) {
        if (!this.editable) return;
        var result = this.editable.restoreText();
        sendResponse({ success: result });
    }

    // Encrypt using the last used keys
    encryptLast() {
        if (!this.editable) return;
        this.editable.encryptLast();
    }

    // Return all decrypted nodes to their original values
    lock() {
        var els = document.getElementsByClassName(init.config.pgpClassName),
            i: number,
            parentEl: HTMLElement,
            orgValue: string;

        stopObserver();
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
            startObserver();
        });
    }

    // Decrypt all nodes
    traverse() {
        getInitVars(() => { traverseNodes(document.body) });
    }

}

// Bootstrap
getInitVars(() => {

    // If we are in a frame and the frame has no id attribute,
    // then assign one to it
    if ( window.frameElement && !window.frameElement.id ) {
        window.frameElement.id = idGenerator('frame');
    }

    if ( init.hasPrivateKey ) {
        new MessageListener();
        eventObserver();
        traverseNodes(document.body);
        bindEditables(document.body);
    }
})
