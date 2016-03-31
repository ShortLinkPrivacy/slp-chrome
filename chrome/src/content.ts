/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

// These get initialized by the background page
var init: Interfaces.InitVars;

// Observer for newly created elements
var observer: MutationObserver;

// Regular expression for the url
var urlRe = MagicURL.anyRegExp(),
    urlReg = MagicURL.anyRegExp("g");

// Has anything been done on this tab slp-wise. Used to determine if the tab
// needs to get refreshed after upgrade
var hasWorkDone: boolean;

// Editable property name containing the magic link. Used to determine if the
// editable is already encrypted by comparing to the text.
const propEncrypted = 'encrypted';

// Editable property containing the instance of the editable class
const propInstance = 'instance';

// Editable propery containing the original value of the editable
const propOriginal = 'original';


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
    fullPath?: string;
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
        if ( $data(el, propInstance) ) return;

        // If the element has no id, then assign one to it
        if ( el.id == "" ) {
            el.id = idGenerator('editable');
        }

        this.element = el;
        this.frameId = window.frameElement ? window.frameElement.id : null;
        this.bindEvents();

        // Save the new instance in an attribute on the element
        $data(this.element, propInstance, this);
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
        if ( this.selectionRequired() && !this.getSelection() ) 
            return false;

        return this.getText()
            && this.hasLastMessage()
            && !this.isAlreadyEncrypted() ? true : false;
    }

    // Tells if we're on a website that requires that the editable is selected
    selectionRequired(): boolean {
        // If it's Facebook, then we require selection for multiline text.
        // Why? Because we're unable to simulate multi-line selection in
        // Facebook.  It "seems" that we've selected the whole thing, but in
        // reality we've only selected the current line.
        if ( window.location.host.match(/facebook\.com$/) ) {
            return this.getText().trim().match(/\n/) ? true : false;
        }

        return false;
    }

    // Get the selected text in the editable
    getSelection(): string {
        var sel = document.getSelection();
        if ( !sel.toString().trim() ) return null;

        // If this is a textarea, then we just return the stringified selection
        if ( this.isTextarea() ) {
            var s = (<HTMLTextAreaElement>this.element).selectionStart;
            var e = (<HTMLTextAreaElement>this.element).selectionEnd;
            return this.getText().substring(s, e);
        }

        // Otherwise, we need to look for the anchor nodes insite the editable
        var isDescendant = function(child: Node) {
             var parent = child.parentNode;
             while (parent != null) {
                 if (parent == this.element) return true;
                 parent = parent.parentNode;
             }
             return false;
        }.bind(this);

        return isDescendant(sel.anchorNode) && isDescendant(sel.focusNode)
            ? sel.toString()
            : null;
    }

    // Is the element a TEXTAREA?
    isTextarea(): boolean {
        return this.element.tagName == "TEXTAREA";
    }

    // Does the editable contain a magic url?
    isAlreadyEncrypted(): boolean {
        var text = this.getText(),
            encr = $data(this.element, propEncrypted);
        return text && encr && encr == text;
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
                $data(this.element, propEncrypted, umsg.body);
                if ( callback ) callback(umsg.body);
            }
        });
    }

    // Get the text value of the editable
    getText(): string {
        if ( !this.element ) return;
        return this.isTextarea() == true
            ? (<HTMLTextAreaElement>this.element).value
            : (this.element.innerText || this.element.textContent);
    }

    // Selects the contents of the element. Needed to paste
    // the new value
    private selectTextInElement(): void {

        // Do not select if a selection already exists
        if ( this.getSelection() ) return;

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
    setText(text: string): void {
        if ( !this.element ) return;

        // Save the original value
        this.savedValue = this.getText();

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
            this.setText(this.savedValue);
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
            var fullPath: string;
            try {
                fullPath = el.parentElement.getAttribute('rel');
            } catch ( err ) {
                // an error maybe one day
            }
            if (!fullPath) return;
            messageBgPage('addPublicKey', { fullPath: fullPath }, (result: Interfaces.Success<Messages.Id>) => {
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
            $data(parentEl, propOriginal, parentEl.innerHTML);
            parentEl.classList.add(init.config.pgpClassName);
        }

        // Replace all magic urls inside the link with magic <span> elements
        text = node.nodeValue.replace(urlReg, "<span class='" + init.config.pgpEnchanted + "' rel='$1/$2'>Decrypting ...</span>");
        parentEl.innerHTML = text;

        // Restart the observer
        startObserver();
    }

    function setElementExpiration(el: HTMLElement, clearMsg: Messages.ClearType): void {
        var now: Date,
            ttl: number;

        if (!clearMsg.timeToLive) return;

        setTimeout(() => {
            el.innerHTML = "Expired private message";
            el.classList.add("__pgp_error");
        }, Math.max(0, clearMsg.timeToLive * 1000));
    }

    // Gathers a list of all enchanted elements and decodes them one by one
    function decodeEnchanted(root: HTMLElement, callback: Interfaces.Callback): void {
        var els = root.getElementsByClassName(init.config.pgpEnchanted),
            i: number,
            count = 0;

        var _decode = function(idx: number, done: Interfaces.Callback): void {
            var element = <HTMLElement>(els[idx]),
                fullPath: string = element.getAttribute('rel');

            if (!fullPath) return;

            count++;
            messageBgPage( 'decryptLink', { fullPath: fullPath }, (result: Interfaces.Success<Messages.ClearType>) => {
                if ( result.success ) {
                    var clearMsg: Messages.ClearType = result.value;
                    element.innerHTML = clearMsg.body.replace(/\n/g, '<br/>');
                    element.classList.add("__pgp_decrypted");

                    // Expiring?
                    setElementExpiration(element, clearMsg);
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
    function getNodeList(root: HTMLElement, re: RegExp): Array<Node> {
        var walk: TreeWalker,
            node: Node,
            nodeList: Array<Node> = [];

        // Create a walker from the root element, searching only for text nodes
        walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

        while (node = walk.nextNode()) {
            if (!node.nodeValue.match(re)) continue;
            if (isInsideEditable(node)) continue;
            nodeList.push(node);
        }

        return nodeList;
    }

    function traverseNodes(root: HTMLElement): void {
        var nodeList: Array<Node>,
            i: number;

        // Fix links with altered magic urls in the innerText
        fixLinks(root);

        // Gather a list of TEXT nodes that contain magic urls.  If the private
        // key is decrypted, then we gather ALL matching magic links, otherwise
        // we only collect the links with public keys.
        let nodeRe = init.isDecrypted
            ? MagicURL.anyRegExp()
            : MagicURL.keyRegExp();
        nodeList = getNodeList(root, nodeRe);

        // If no nodes found, return
        if (nodeList.length == 0) return;

        // Found something to decrypt in the page, mark hasWorkDone
        hasWorkDone = true;

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
        callback()
    });
}

function $data(el: HTMLElement, name: string, value?: any): any {
    var _name = "__" + name;
    if ( typeof value != "undefined" ) {
        if ( value == null )
            delete el.attributes[_name]
        else
            el.attributes[_name] = value;
    }

    return el.attributes[_name];
}

// Listen for messages from the extension
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
                    this.editable = $data(element, propInstance);
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
    getElementText(sendResponse: { (value: Interfaces.ElementTextMessage): void }) {
        if (!this.editable) return;

        var selectionRequired = this.editable.selectionRequired();
        var value: string;
        
        // If selection is required, then use the selected text as value to
        // pass. Otherwise use the selected text with a fallback to the entire
        // text.
        if ( selectionRequired ) { 
            value = this.editable.getSelection()
        } else {
            value = this.editable.getSelection() || this.editable.getText();
        }

        sendResponse({
            value: value,
            isAlreadyEncrypted: this.editable.isAlreadyEncrypted(),
            lastMessage: this.editable.lastMessage,
            selectionRequired: selectionRequired
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

        // If the message has fingerprints, we know we're dealing with an
        // encrypted message (as opposed to a public key)
        if ( urlMsg.fingerprints && urlMsg.fingerprints.length ) {
            this.editable.lastMessage = urlMsg;

            // Save the magic url in a property. We will use it to compare the
            // editable text to it in order to determine if the editable is
            // encrypted or not. See isAlreadyEncrypted() for reference.
            $data(this.editable.element, propEncrypted, urlMsg.body);
        }

        this.editable.setText(urlMsg.body);
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
                if ( orgValue = $data(parentEl, propOriginal) ) {
                    parentEl.innerHTML = orgValue;
                    $data(parentEl, propOriginal, null);
                }
            }
            startObserver();
        });
    }

    // Decrypt all nodes
    traverse() {
        getInitVars(() => { traverseNodes(document.body) });
    }

    // Send a window message to self (mostly used for testing and debugging)
    windowMessage(sendResponse, msg: Interfaces.ContentMessage<string>) {
        window.postMessage(msg.value, document.location.href);
    }
}

// Bootstrap
getInitVars(() => {

    // If we are in a frame and the frame has no id attribute,
    // then assign one to it
    if ( window.frameElement && !window.frameElement.id ) {
        window.frameElement.id = idGenerator('frame');
    }

    new MessageListener();
    eventObserver();
    traverseNodes(document.body);
    bindEditables(document.body);
})
