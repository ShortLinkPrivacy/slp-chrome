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

    lastKeysUsed?: Array<Interfaces.Fingerprint>;
}

//---------------------------------------------------------------------------
// Sends messages to the active element in the content script of the current tab
//---------------------------------------------------------------------------
function sendElementMessage(msg: ElementMessage, callback?: Interfaces.ResultCallback): void {
    msg.elementLocator = bg.elementLocatorDict[tab.id];
    chrome.tabs.sendMessage(tab.id, msg, callback);
}

//---------------------------------------------------------------------------
// Encrypt own public key and create a crypted url
//---------------------------------------------------------------------------
function encryptPublicKey(callback: Interfaces.SuccessCallback): void {
    var armoredText: Interfaces.Armor,
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

/*
 * The main application handles all articles, bit it itself
 * also handles the private key password entry screen.
 */

interface BoolFunc {
    (): boolean;
}

class App {

    error: string;
    password: string;
    wait: boolean;

    hasPrivateKey: BoolFunc;
    isDecrypted: BoolFunc;
    hasSelectedKeys: BoolFunc;
    hasFoundKeys: BoolFunc;
    alreadyEncrypted: boolean;

    filter: string;
    foundKeys: Array<Keys.KeyItem> = [];
    selectedKeys: Array<Keys.KeyItem> = [];
    clearText: string;

    constructor() {
        this.filter = ""; // TODO - last used

        this.hasPrivateKey = function() {
            return bg.privateKey ? true : false;
        }

        this.isDecrypted = function() {
            return this.hasPrivateKey() ? bg.privateKey.isDecrypted() : false;
        }

        this.hasSelectedKeys = function() {
            return this.selectedKeys.length > 0
        };

        this.hasFoundKeys = function() {
            return this.foundKeys.length > 0
        };

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
                    this.selectedKeys = keys.map( k => {
                        return new Keys.KeyItem(k)
                    });
                });
            }
        });
    }

    //---------------------------------------------------------------------------
    // Execute the search for public keys
    //---------------------------------------------------------------------------
    doFilter(e: KeyboardEvent): void {

        // Backspace removes the last added key if the filter is empty
        if ( e.keyCode == 8 && !this.filter ) {
            this.selectedKeys.pop();
            return;
        }

        if ( !this.filter ) {
            this.foundKeys = [];
            return;
        }

        bg.store.addressBook.search(this.filter, (keys) => {
            this.foundKeys = keys.map( k => { 
                return new Keys.KeyItem(k, this.filter) 
            });
        });
    }

    focusFilter(e: MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();
        var el = <HTMLInputElement>document.getElementById('ftr');
        el.focus();
    }

    // Checks if 'key' is already in the 'selectedKeys' array
    private isSelected(item: Keys.KeyItem): boolean {
        var i: number;
        for (i = 0; i < this.selectedKeys.length; i++) {
            var testItem = this.selectedKeys[i];
            if ( item.key.fingerprint() == testItem.key.fingerprint())
                return true;
        }

        return false;
    }

    //---------------------------------------------------------------------------
    // Add the clicked key to the list of selected keys
    //---------------------------------------------------------------------------
    addPublicKey(e: Event, model: {index: number}) {
        var item = this.foundKeys[model.index];
        if ( this.isSelected(item) == false ) {
            this.selectedKeys.push(item);
        }
        this.filter = "";
        this.foundKeys = [];
    }

    //---------------------------------------------------------------------------
    // Remove the clicked key from the list of selected keys
    //---------------------------------------------------------------------------
    removePublicKey(e: Event, model: {index: number}) {
        this.selectedKeys.splice(model.index, 1);
    }

    //---------------------------------------------------------------------------
    // Encrypt the message and paste the url back to the textarea
    //---------------------------------------------------------------------------
    sendMessage(e: Event) {
        var keyList: Array<openpgp.key.Key> = [],
            fingerprintList: Array<Interfaces.Fingerprint> = [],
            i: number;

        // This should never happen because we don't show the submit button
        if (this.hasSelectedKeys() == false) return;

        // Collect a list of keys and fingerprints. The keys are used to encrypt
        // the message, and the fingerprints are saved in the editable so they
        // can be reused again with a shortcut
        for (i = 0; i < this.selectedKeys.length; i++) {
            var item = this.selectedKeys[i];
            keyList.push(item.key.openpgpKey());
            fingerprintList.push(item.key.fingerprint());
        }

        // Also push our own key, so we can read our own message
        keyList.push(bg.privateKey.key.toPublic());

        this.wait = true;
        bg.encryptMessage(this.clearText, keyList, (result) => {
            this.wait = false;
            if ( result.success ) {
                sendElementMessage({ setElementText: result.value, lastKeysUsed: fingerprintList });
                window.close();
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
    // Encrypt own private key and pastes the url to the textarea
    //---------------------------------------------------------------------------
    sendPublicKey(): void {
        this.wait = true;
        encryptPublicKey((result) => {
            this.wait = false;
            if ( result.success ) {
                sendElementMessage({ setElementText: result.value });
                window.close();
            } else {
                this.error = result.error;
            }
        })
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
                this.call(app, ev, binding.view.models)
            }
        });
        rivets.bind(document.body, this);

        if (this.isDecrypted() == false) {
            document.getElementById('pwd').focus();
        }
    }
}

window.onload = function() {
    app = window["app"] = new App();
    app.run();
};

