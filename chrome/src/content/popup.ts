/// <reference path="../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../../typings/rivets/rivets.d.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="../modules.d.ts" />

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
