/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var app: App,
    bg: Interfaces.BackgroundPage = <Interfaces.BackgroundPage>chrome.extension.getBackgroundPage(),
    tab: chrome.tabs.Tab;   // current open tab

interface ElementMessage {
    elementLocator?: Interfaces.ElementLocator;
    getElementText?: boolean;
    setElementText?: string;
    restoreElementText?: boolean;

    lastKeysUsed?: Array<Keys.Fingerprint>;
}

interface BoolFunc {
    (): boolean;
}

//---------------------------------------------------------------------------
// Sends messages to the active element in the content script of the current tab
//---------------------------------------------------------------------------
function sendElementMessage(msg: ElementMessage, callback?: Interfaces.ResultCallback<any>): void {
    msg.elementLocator = bg.elementLocatorDict[tab.id];
    chrome.tabs.sendMessage(tab.id, msg, callback);
}

//---------------------------------------------------------------------------
// Encrypt own public key and create a crypted url
//---------------------------------------------------------------------------
function encryptPublicKey(callback: Interfaces.SuccessCallback): void {
    var armoredText: Keys.Armor,
        url: string;

    // If the url is already in the prefs, then use it DISABLED
    /* 
    if ( url = bg.preferences.publicKeyUrl ) {
        callback({ success: true, value: url });
        return;
    }
    */

    armoredText = bg.privateKey.toPublic().armored();

    bg.store.message.save(armoredText, (result) => {
        if ( result.success ) {
            // Get the url of the public key and store it in the prefs
            url = bg.store.message.getURL(result.id);
            bg.preferences.publicKeyUrl = url;
            bg.preferences.publicKeySaveTime = new Date();
            bg.store.preferences.save();

            // Then return success
            callback({ success: true, value: url });
        } else {

            // Return error
            callback({ success: false, error: result.error })
        }
    });
}

module Components {
    export class TextInput {
        value: string;
        forceShow: boolean;
        wait: boolean;
        visible: BoolFunc;

        constructor(data: { value: string }) {
            this.value = data.value;
            this.wait = false;
            this.visible = function(): boolean {
                return this.value || this.forceShow;
            }
        }

        show(): void {
            this.forceShow = true;
            document.getElementById('clear-text').focus();
        }

        sendPublicKey(): void {
            this.wait = true;
            encryptPublicKey((result) => {
                this.wait = false;
                if ( result.success ) {
                    sendElementMessage({ setElementText: result.value });
                    window.close();
                } else {
                    app.error = result.error;
                }
            })
        }
    }

    export class Expiration {
        value: number;
        show: boolean;

        constructor(data: { value: number }) {
            this.value = data.value;
            this.show = false;
        }

        toggle(e: Event): void {
            e.preventDefault();
            this.show = !this.show;
        }

        change(e: Event): void {
            if ( this.value == 0 ) {
                this.show = false;
            }
        }
    }

}


/* 
 * Receprents can not be a Rivets component, because it is not fully self
 * contained. Its attributes leak out into other parts of the browser.html page
 */
class Recepients {
    found: Keys.KeyItemList;
    selected: Keys.KeyItemList;
    filter: string;
    hasFound: BoolFunc;
    hasSelected: BoolFunc;

    constructor(selected: Keys.KeyItemList) {
        this.found = [];
        this.selected = [];
        this.hasFound = function() {
            return this.found.length > 0
        };
        this.hasSelected = function() {
            return this.selected.length > 0
        };
    }

    // Checks if 'item' is already selected
    private isSelected(item: Keys.KeyItem): boolean {
        var i: number;
        for (i = 0; i < this.selected.length; i++) {
            var testItem = this.selected[i];
            if ( item.key.fingerprint() == testItem.key.fingerprint())
                return true;
        }

        return false;
    }

    setFromKeys(list: Array<Keys.PublicKey>): void {
        this.selected = list.map( k => {
            return new Keys.KeyItem(k)
        });
    }

    forEach(func: { (item: Keys.KeyItem): void }): void {
        this.selected.forEach(func);
    }

    moveToSelected(e: Event, model: {index: number}) {
        var item = this.found[model.index];
        if ( this.isSelected(item) == false ) {
            this.selected.push(item);
        }
        this.filter = "";
        this.found= [];
    }

    removeFromSelected(e: Event, model: {index: number}) {
        this.selected.splice(model.index, 1);
    }

    focus(e: MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();
        var el = <HTMLInputElement>document.getElementById('ftr');
        el.focus();
    }

    search(e: KeyboardEvent): void {

        // Backspace removes the last added key if the filter is empty
        if ( e.keyCode == 8 && !this.filter ) {
            this.selected.pop();
            return;
        }

        if ( !this.filter ) {
            this.found = [];
            return;
        }

        bg.store.addressBook.search(this.filter, (keys) => {
            this.found = keys.map( k => { 
                return new Keys.KeyItem(k, this.filter) 
            });
        });
    }
}

/*
 * The main application handles all articles, bit it itself
 * also handles the private key password entry screen.
 */

class App {

    error: string;
    password: string;
    wait: boolean;

    hasPrivateKey: BoolFunc;
    isDecrypted: BoolFunc;
    alreadyEncrypted: boolean;
    expiration: number;

    recepients: Recepients;
    clearText: string;

    constructor() {
        this.expiration = 0;
        this.recepients = new Recepients([]);

        this.hasPrivateKey = function() {
            return bg.privateKey ? true : false;
        }

        this.isDecrypted = function() {
            return this.hasPrivateKey() ? bg.privateKey.isDecrypted() : false;
        }

        chrome.tabs.query({ active: true }, (tabs) => {
            tab = tabs[0];
            this.getElementText();
        })
    }

    private getElementText(): void {
        var re: RegExp, text: string, lastKeysUsed: Array<string>,
            i: number;

        re = new RegExp(bg.store.message.getReStr());

        sendElementMessage({ getElementText: true }, (response) => {
            if ( !response ) return;

            text = response.value;
            lastKeysUsed = response.lastKeysUsed;

            this.alreadyEncrypted = re.exec(text) ? true : false;
            this.clearText = text;

            // lastKeysUsed actually contains an array of fingerprints, so we
            // have to look them up in the address book and translate them into
            // keys
            if ( lastKeysUsed.length ) {
                bg.store.addressBook.load(lastKeysUsed, (keys) => {
                    this.recepients.setFromKeys(keys);
                });
            }
        });
    }

    //---------------------------------------------------------------------------
    // Encrypt the message and paste the url back to the textarea
    //---------------------------------------------------------------------------
    sendMessage(e: Event) {
        var keyList: Array<openpgp.key.Key> = [],
            fingerprintList: Array<Keys.Fingerprint> = [],
            i: number;

        // This should never happen because we don't show the submit button
        if (this.recepients.hasSelected() == false) return;

        // Collect a list of keys and fingerprints. The keys are used to encrypt
        // the message, and the fingerprints are saved in the editable so they
        // can be reused again with a shortcut
        this.recepients.forEach((item) => {
            keyList.push(item.key.openpgpKey());
            fingerprintList.push(item.key.fingerprint());
        })

        // Also push our own key, so we can read our own message
        keyList.push(bg.privateKey.key.toPublic());

        this.wait = true;
        bg.encryptMessage(this.clearText, keyList, (result) => {
            this.wait = false;
            if ( result.success ) {
                sendElementMessage({ setElementText: result.value, lastKeysUsed: fingerprintList }, (result) => {
                    if ( result.success ) {
                        window.close();
                    } else {
                        this.error = "No input field was found on the page";
                    }
                });
            } else {
                this.error = result.error;
            }
        })
    }

    //---------------------------------------------------------------------------
    // Restore the original message back in the textarea
    //---------------------------------------------------------------------------
    restoreMessage(e: Event) {
        sendElementMessage({ restoreElementText: true }, (result) => {
            if ( result.success ) {
                window.close();
            } else {
                this.error = "There was an error";
            }
        })
    }

    //---------------------------------------------------------------------------
    // Unlock the private key by providing a password
    //---------------------------------------------------------------------------
    enterPassword(e: KeyboardEvent): void {
        if ( e.keyCode != 13 ) {
            this.error = "";
            return;
        }

        if ( this.password ) {
            this.wait = true;
            if ( bg.privateKey.decrypt(this.password) ) {
                chrome.tabs.query({currentWindow: true}, (tabs) => {
                    tabs.forEach((tab) => {
                        chrome.tabs.sendMessage(tab.id, { traverse: true });
                    });
                });
                chrome.browserAction.setBadgeText({text: ""});
                window.close();
            } else {
                this.error = "Wrong password";
            }
            this.wait = false;
        }
    }

    //---------------------------------------------------------------------------
    // Lock the privateKey
    //---------------------------------------------------------------------------
    lock(): void {
        bg.privateKey.lock();
        bg.lockDown();
        window.close();
    }

    //---------------------------------------------------------------------------
    // Go to the settings page
    //---------------------------------------------------------------------------
    goSettings(e: MouseEvent): void {
        chrome.runtime.openOptionsPage(() => {});
    }

    //---------------------------------------------------------------------------
    // Run application
    //---------------------------------------------------------------------------
    run(): void {
        rivets.configure({
            handler: function(target, ev, binding) {
                this.call(binding.model, ev, binding.view.models)
            }
        });

        rivets.bind(document.body, this);

        if (this.isDecrypted() == false) {
            document.getElementById('pwd').focus();
        }
    }
}

function loadComponents(): void {
    var els = document.querySelectorAll('script[type="text/template"]');

    [].forEach.call(els, (el: HTMLElement) => {
        var name = el.getAttribute('data-name'),
            func = el.getAttribute('data-class');

        rivets.components[name] = {
            template: function() { return el.innerHTML },
            initialize: function(el, data) { 
                return new Components[func](data)
            }
        };
    })
}

window.onload = function() {
    loadComponents();
    app = window["app"] = new App();
    app.run();
};
