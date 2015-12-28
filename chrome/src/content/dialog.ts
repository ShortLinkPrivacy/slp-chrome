/// <reference path="../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../../typings/rivets/rivets.d.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="../modules.d.ts" />

interface EncryptResult {
    success: boolean;
    encryptedText?: string;
    error?: string;
}

interface EncryptCallback {
    (result: EncryptResult): void;
}

class Dialog {

    // Dialog size
    private width = 300;
    private height = 300;
    
    // The texarea element we're modifying
    el: HTMLTextAreaElement;
    
    // The popup div that will contain the iframe
    popup: HTMLElement;

    // The iframe element
    iframe: HTMLIFrameElement;

    // Iframe to open inside the popup
    private iframeSrc = chrome.runtime.getURL("/iframe.html");

    private isOpen = false;
    
    // A this-bound version of closePopup
    cancelBound: EventListenerObject = this.cancel.bind(this);

    constructor() {

        // Content page message listener. The iframe posts here.
        window.addEventListener('message', (e) => {
            var msg = e.data.message;

            if (!e.data.iframe) return;
            if (!msg) return;

            if (msg.closePopup && this.isOpen) {
                if ( msg.keys && msg.keys.length ) {
                    this.encrypt(msg.keys, (result) => {
                        if ( result.success ) {
                            this.accept(result.encryptedText)
                        } else {
                            this.cancel();
                            Notif.error(result.error);
                        }
                    })
                } else {
                    this.cancel()
                }
            }
        });
    }

    open(el: HTMLTextAreaElement): void {
        var popup: HTMLElement,
            iframe: HTMLIFrameElement;

        this.el = el;

        // popup element
        popup = document.createElement('div');
        popup.style.width = this.width + "px";
        popup.style.height = this.height + "px";
        popup.style.position = "absolute";
        popup.style.left = Math.max(0, (window.innerWidth - this.width) / 2) + "px";
        popup.style.top = Math.max(0, (window.innerHeight - this.height) / 2) + "px";
        popup.style.boxShadow = "rgb(204, 204, 204) 5px 5px 10px";

        // iframe element
        iframe = document.createElement('iframe');
        iframe.src = this.iframeSrc;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.style.border = "none";


        // If clicked on the popup, do not bubble down
        popup.addEventListener('click', (e: Event) => {
            e.stopPropagation()
        });

        // If clicked outside of the popup, close it.
        // Can't bind right away, because it fires on the icon click
        setTimeout(() => {
            document.addEventListener('click', this.cancelBound);
        }, 1000);

        popup.appendChild(iframe)
        document.body.appendChild(popup);

        // Fade in
        popup.style.opacity = "0";
        (function fade() {
            var o = parseFloat(popup.style.opacity);
            if ((o += .1) < 1) {
                popup.style.opacity = "" + o;
                setTimeout(fade, 10);
            } else {
                popup.style.opacity = "1";
            }
        })();

        this.popup = popup
        this.iframe = iframe
        this.isOpen = true;
    }

    cancel(): void {
        this.popup.remove();
        this.isOpen = false;
        document.removeEventListener('click', this.cancelBound);
    }

    // Close the popup and optionally set the new text of the input
    accept(newText: string): void {
        this.cancel();
        this.el.value = newText;
        this.el.dispatchEvent(new Event('input'));
    }

    private encrypt(armoredPublicKeys: Array<string>, callback: EncryptCallback): void {
        var keys: Array<openpgp.key.Key>;

        loadModule("openpgp", () => {
            keys = armoredPublicKeys.map((armoredText: string) => {
                return openpgp.key.readArmored(armoredText).keys[0];
            })

            openpgp.encryptMessage( keys, this.el.value )
                .then((armoredText) => {
                    messageStore.save(armoredText, (result) => {
                        if ( result.success ) {
                            callback({ success: true, encryptedText: messageStore.getURL(result.id) })
                        } else {
                            callback({ success: false, error: "Server Error: " + result.error })
                        }
                    });
                })
                .catch((err) => {
                    callback({ success: false, error: "OpenPGP Error: " + err })
                });
        });
    }
}
