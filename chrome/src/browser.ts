/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var app: App,
    bg: Interfaces.BackgroundPage = <Interfaces.BackgroundPage>chrome.extension.getBackgroundPage();

//---------------------------------------------------------------------------
// Sends messages to the content script of the current tab
//---------------------------------------------------------------------------
function sendMessageToContent(msg: any, callback?: Interfaces.ResultCallback): void {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, msg, callback);
    });
}

//---------------------------------------------------------------------------
// Encrypt own private key and create a crypted url
//---------------------------------------------------------------------------
function encryptPrivateKey(callback: Interfaces.SuccessCallback): void {
    var armoredText: string;

    // TODO: cache this link in the settings
    armoredText = bg.privateKey.toPublic().armored();

    bg.messageStore.save(armoredText, (result) => {
        if ( result.success ) {
            callback({
                success: true,
                value: bg.messageStore.getURL(result.id)
            })
        } else {
            callback({
                success: false,
                error: result.error
            })
        }
    });
}

function encryptMessage(text: string, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback): void {
    openpgp.encryptMessage( keyList, text )
        .then((armoredText) => {
            bg.messageStore.save(armoredText, (result) => {
                if ( result.success ) {
                    callback({
                        success: true,
                        value: bg.messageStore.getURL(result.id)
                    });
                } else {
                    callback({
                        success: false,
                        error: result.error
                    });
                }
            });
        })
        .catch((err) => {
            callback({
                success: false,
                error: "OpenPGP Error: " + err
            });
        });
}


/*
 * Address Book tab controller
 */

function KeyItem(k) {
  this.key = k;
  this.getPrimaryUser = function() {
    return this.key.getPrimaryUser()
  }
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

    hasPrivateKey: BoolFunc;
    isDecrypted: BoolFunc;
    hasSelectedKeys: BoolFunc;
    hasFoundKeys: BoolFunc;
    alreadyEncrypted: boolean;
    isTextarea: boolean;

    filter: string;
    foundKeys = [];
    selectedKeys = [];
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

        sendMessageToContent({ getElement: true }, (el) => {
            var re = new RegExp(bg.messageStore.getReStr());
            if ( el ) {
                this.alreadyEncrypted = re.exec(el.value) ? true : false;
                this.isTextarea = el.tagName == 'TEXTAREA';
                this.clearText = el.value;
            }
        });
    }

    //---------------------------------------------------------------------------
    // Execute the search for public keys
    //---------------------------------------------------------------------------
    doFilter(): void {
        if ( !this.filter ) {
            this.foundKeys = [];
            return;
        }

        bg.keyStore.searchPublicKey(this.filter, (keys) => {
            this.foundKeys = keys.map( k => { return new KeyItem(k) } );
        });
    }

    // Checks if 'key' is already in the 'selectedKeys' array
    private isSelected(item): boolean {
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
        var keyList: Array<openpgp.key.Key>;

        // This should never happen because we don't show the submit button
        if (this.hasSelectedKeys() == false) return;

        keyList = this.selectedKeys.map(item => { return item.key.openpgpKey() })

        // Also push our own key, so we can read our own message
        keyList.push(bg.privateKey.key.toPublic());

        encryptMessage(this.clearText, keyList, (result) => {
            if ( result.success ) {
                sendMessageToContent({ setElement: result.value });
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
        sendMessageToContent({ restore: true }, (result) => {
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
        }
    }

    //---------------------------------------------------------------------------
    // Lock the privateKey
    //---------------------------------------------------------------------------
    lock(): void {
        bg.privateKey.lock();

        chrome.tabs.query({currentWindow: true}, (tabs) => {
            tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, { lock: true });
            });
        });

        window.close();
    }

    //---------------------------------------------------------------------------
    // Encrypt own private key and pastes the url to the textarea
    //---------------------------------------------------------------------------
    sendPrivateKey(): void {
        encryptPrivateKey((result) => {
            if ( result.success ) {
                sendMessageToContent({ setElement: result.value });
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
    }
}

window.onload = function() {
    app = window["app"] = new App();
    app.run();
};

