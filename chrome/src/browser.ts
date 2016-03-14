/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var app: App,
    bg: Interfaces.BackgroundPage = <Interfaces.BackgroundPage>chrome.extension.getBackgroundPage(),
    tab: chrome.tabs.Tab;   // current open tab

var keybase = new API.Keybase();

interface BoolFunc {
    (): boolean;
}

//---------------------------------------------------------------------------
// Sends messages to the active element in the content script of the current tab
//---------------------------------------------------------------------------
function sendElementMessage(msg: Interfaces.ContentMessage<any>, callback?: Interfaces.ResultCallback<any>): void {
    msg.elementLocator = bg.elementLocatorDict[tab.id];
    chrome.tabs.sendMessage(tab.id, msg, callback);
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
            bg.encryptPublicKey((result: Interfaces.Success<Messages.UrlType>) => {
                this.wait = false;
                if ( result.success ) {
                    sendElementMessage({ action: 'setElementText', value: result.value }, (result) => {
                        if (result.success) {
                            window.close();
                        } else {
                            app.setError(result.error);
                        }
                    });
                } else {
                    app.setError(result.error);
                }
            })
        }
    }

    export class Expiration {
        value: number;
        show: BoolFunc;

        constructor(data: { value: number }) {
            this.value = data.value;
            this.show = function() {
                return this.value > 0;
            }
        }

        toggle(e: Event): void {
            e.preventDefault();
            this.value = 3600;
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

    private isInArray(item: Keys.KeyItem, array: Keys.KeyItemList): boolean {
        var i: number;
        for (i = 0; i < array.length; i++) {
            var testItem = array[i];
            if ( item.key.fingerprint() == testItem.key.fingerprint())
                return true;
        }

        return false;
    }

    // Checks if 'item' is already selected
    private isSelected(item: Keys.KeyItem): boolean {
        return this.isInArray(item, this.selected);
    }


    private isFound(item: Keys.KeyItem): boolean {
        return this.isInArray(item, this.found);
    }

    setFromKeys(list: Array<Keys.PublicKey>): void {
        var i: number,
            result: Keys.KeyItemList = [];

        // Move all keys, except own key so it doesn't show up in the list
        for (i = 0; i < list.length; i++) {
            var k = list[i];
            if ( k.fingerprint() != bg.privateKey.fingerprint() ) {
                result.push(new Keys.KeyItem(k))
            }
        }

        this.selected = result;
    }

    forEach(func: { (item: Keys.KeyItem): void }): void {
        this.selected.forEach(func);
    }

    moveToSelected(e: Event, model: {index: number}) {
        var item = this.found[model.index];
        if ( this.isSelected(item) == false ) {
            this.selected.push(item);
            if ( item.isRemote ) {
                bg.store.addressBook.save(item.key, () => {});
            }
        }
        this.filter = "";
        this.found= [];
        this.focus(<MouseEvent>e);
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
        var found: Keys.KeyItemList = [],
            i: number;

        if ( !this.filter ) {
            this.found = [];
            return;
        }

        // Get keys and move them to the local found array, then into this.found
        var keysToItems = function(keys: Keys.PublicKeyArray, isRemote: boolean): void {
            for (i = 0; i < keys.length; i++) {
                var keyItem = new Keys.KeyItem(keys[i], this.filter);
                keyItem.isRemote = isRemote;
                if ( !this.isSelected(keyItem) && !this.isFound(keyItem) )
                    found.push(keyItem);
            }
            this.found = found;
        }.bind(this);

        // Search the local address book
        bg.store.addressBook.search(this.filter, (keys) => {
            keysToItems(keys, false);

            // Search also in keybase
            if ( bg.preferences.enableKeybase && bg.config.enableKeybase ) {
                keybase.search(this.filter, (keys) => {
                    keysToItems(keys, true);
                });
            }
        });
    }
}

/*
 * The main application handles all articles, bit it itself
 * also handles the private key password entry screen.
 */

class App {

    error: string;
    critical: boolean;
    password: string;
    wait: boolean;

    hasPrivateKey: BoolFunc;
    isDecrypted: BoolFunc;
    alreadyEncrypted: boolean;
    timeToLive: number;

    recepients: Recepients;
    clearText: string;

    constructor() {
        this.timeToLive = 0;
        this.recepients = new Recepients([]);
        this.critical = false;

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
        var re: RegExp,
            text: string,
            lastMessage: Interfaces.LastMessage,
            i: number;

        re = new RegExp(bg.slp.itemRegExp);

        sendElementMessage({ action: 'getElementText' }, (response) => {
            if ( !response ) return;

            text = response.value;
            lastMessage = response.lastMessage;

            this.alreadyEncrypted = re.exec(text) ? true : false;
            this.clearText = text;

            if ( lastMessage ) {
                // lastMessage.body actually contains an array of fingerprints, so we
                // have to look them up in the address book and translate them into
                // keys
                if ( lastMessage.fingerprints.length ) {
                    bg.store.addressBook.load(lastMessage.fingerprints, (keys) => {
                        this.recepients.setFromKeys(keys);
                    });
                }

                if ( lastMessage.timeToLive ) {
                    this.timeToLive = lastMessage.timeToLive;
                }
            }

        });
    }

    setError(msg: string): void {
        bg._ga('browser_error', msg);
        this.error = msg;
    }

    //---------------------------------------------------------------------------
    // Encrypt the message and paste the url back to the textarea
    //---------------------------------------------------------------------------
    sendMessage(e: Event) {
        var keyList: Array<openpgp.key.Key> = [],
            clearMessage: Messages.ClearType;

        // This should never happen because we don't show the submit button
        if (this.recepients.hasSelected() == false) return;

        // Collect a list of keys and fingerprints. The keys are used to encrypt
        // the message, and the fingerprints are saved in the editable so they
        // can be reused again with a shortcut
        this.recepients.forEach((item) => {
            keyList.push(item.key.openpgpKey());
        })

        // The clear message is a record
        clearMessage = {
            body: this.clearText,
            timeToLive: this.timeToLive
        };

        this.wait = true;
        bg.encryptMessage(clearMessage, keyList, (result: Interfaces.Success<Messages.UrlType>) => {
            this.wait = false;
            if ( result.success ) {
                sendElementMessage({ action: 'setElementText', value: result.value }, (result) => {
                    if ( result.success ) {
                        window.close();
                    } else {
                        this.setError(result.error);
                    }
                });
            } else {
                this.setError(result.error);
            }
        })
    }

    //---------------------------------------------------------------------------
    // Restore the original message back in the textarea
    //---------------------------------------------------------------------------
    restoreMessage(e: Event) {
        sendElementMessage({ action: 'restoreElementText' }, (result) => {
            if ( result.success ) {
                window.close();
            } else {
                this.setError(chrome.i18n.getMessage("browserGenericError"));
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
            if ( bg.unlockKey(this.password) ) {
                window.close();
            } else {
                this.error = chrome.i18n.getMessage("browserBadPassword")
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
        bg._ga('browser', 'lock');
        window.close();
    }

    //---------------------------------------------------------------------------
    // Go to the settings page
    //---------------------------------------------------------------------------
    goSettings(e: MouseEvent): void {
        bg._ga('browser', 'goSettings');
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

        bg._ga('browser', 'run');
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

function run(): void {
    loadComponents();
    app = window["app"] = new App();
    app.run();
}

window.onerror = function(e) {
    app.critical = true;
    bg.console.log(e);
    bg._ga('browser_critical', e);
};

window.onload = run;
