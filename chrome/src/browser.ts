/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="../typings/pathjs/pathjs.d.ts" />
/// <reference path="modules.d.ts" />

var app: App,
    bg: Interfaces.BackgroundPage = <Interfaces.BackgroundPage>chrome.extension.getBackgroundPage();

function sendMessageToContent(msg: any, callback?: Interfaces.ResultCallback): void {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, msg, callback);
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
class KeyItem {
    key: Keys.PublicKey;

    constructor(key: Keys.PublicKey) {
        this.key = key;
    }

    getPrimaryUser(): string {
        return this.key.getPrimaryUser();
    }
}
*/

class EncryptTab implements Application.Article {
    filename = "encrypt.html";
    articleId = "encrypt";
    filter: string;
    foundKeys = [];
    selectedKeys = [];
    clearText: string;
    alreadyEncrypted: boolean;

    constructor() {
        this.filter = ""; // TODO - last used

        sendMessageToContent({ getElement: true }, (el) => {
            var re = new RegExp(bg.messageStore.getReStr());
            if ( el ) {
                this.alreadyEncrypted = re.exec(el.value) ? true : false;
                if ( el.tagName == 'TEXTAREA' ) this.clearText = el.value;
            }
        });
    }

    doFilter(): void {
        if ( !this.filter ) {
            this.foundKeys = [];
            return;
        }

        bg.keyStore.searchPublicKey(this.filter, (keys) => {
            this.foundKeys = keys.map( k => { return new KeyItem(k) } );
        });
    }

    hasSelectedKeys(): boolean {
        return this.selectedKeys.length > 0;
    }

    hasFoundKeys(): boolean {
        return this.foundKeys.length > 0;
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

    select(e: Event, model: {index: number}) {
        var item = this.foundKeys[model.index];
        if ( this.isSelected(item) == false ) {
            this.selectedKeys.push(item);
        }
    }

    remove(e: Event, model: {index: number}) {
        this.selectedKeys.splice(model.index, 1);
    }

    private encryptMessage(text: string, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback): void {

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

    submit(e: Event) {
        var keyList: Array<openpgp.key.Key>;

        // This should never happen because we don't show the submit button
        if (this.hasSelectedKeys() == false) return;

        keyList = this.selectedKeys.map(item => { return item.key.openpgpKey() })

        // Also push our own key, so we can read our own message
        keyList.push(bg.privateKey.key.toPublic());

        this.encryptMessage(this.clearText, keyList, (result) => {
            if ( result.success ) {
                sendMessageToContent({ setElement: result.value });
                window.close();
            } else {
                app.error = result.error;
            }
        })
    }

    restore(e: Event) {
        sendMessageToContent({ restore: true }, (result) => {
            if ( result.success ) {
                window.close();
            } else {
                app.error = "There was an error";
            }
        })
    }
}

class MyKeyTab implements Application.Article {
    filename = "mykey.html";
    articleId = "myKey";
    publicKey: string;

    private encryptKey(sendResponse: Interfaces.SuccessCallback): void {
        var armoredText: string;

        // TODO: cache this link in the settings
        armoredText = bg.privateKey.toPublic().armored();

        bg.messageStore.save(armoredText, (result) => {
            if ( result.success ) {
                sendResponse({
                    success: true,
                    value: bg.messageStore.getURL(result.id)
                })
            } else {
                sendResponse({
                    success: false,
                    error: result.error
                })
            }
        });
    }

    submit(): void {
        this.encryptKey((result) => {
            if ( result.success ) {
                sendMessageToContent({ setElement: result.value });
                window.close();
            } else {
                app.error = result.error;
            }
        })
    }
}

class ControlTab implements Application.Article {
    filename = "control.html";
    articleId = "control";
}

class LockTab implements Application.Article {
    filename = "lock.html";
    articleId = "lock";

    submit(): void {
        bg.privateKey.lock();

        chrome.tabs.query({currentWindow: true}, (tabs) => {
            tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, { lock: true });
            });
        });

        window.close();
    }
}

/*
 * The main application handles all articles, bit it itself
 * also handles the private key password entry screen.
 */

class App extends Application.Main {
    error: string;
    password: string;
    tabs: any = {};
    initVars: Interfaces.InitVars;

    constructor( config: Application.AppConfig ) {
        super(config);

        this.initVars = bg.initialize();

        // Articles
        this.registerArticle( new EncryptTab() );
        this.registerArticle( new MyKeyTab() );
        this.registerArticle( new ControlTab() );
        this.registerArticle( new LockTab() );

        // Router
        this.router();
    }

    router(): void {
        Path.map("#/a").to(() => { this.loadArticle('encrypt') });
        Path.map("#/b").to(() => { this.loadArticle('myKey') });
        Path.map("#/c").to(() => { this.loadArticle('control') });
        Path.map("#/d").to(() => { this.loadArticle('lock') });
    }

    // Use the DOM API to manipulate the tabs. Why not rivets?  Because
    // rivets doesn't allow for calculation within the HTML, so stuff
    // like rv-class-active="currentTab == 'blah'" doesn't fly.
    activateTab(name: string): void {
        var elements: HTMLCollection,
            i: number;

        elements = document.getElementById('tabs').children;
        for (i = 0; i < elements.length; i++) {
            var li: Element,
                a: Element;

            li = elements[i];
            a = (<HTMLElement>li).children[0];
            a.className = a.getAttribute('rel') == name ? "active" : "";
        }
    }

    // Overload the parent loadArticle, so we can also activate the tab
    // for that article.
    loadArticle(articleId: string, onBindArgs?: any): void {
        super.loadArticle(articleId, onBindArgs);
        this.activateTab(articleId);
    }

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

    goSettings(e: MouseEvent): void {
        chrome.runtime.openOptionsPage(() => {});
    }

    run(): void {
        // Rivets
        rivets.configure({
            handler: function(target, ev, binding) {
                this.call(app, ev, binding.view.models)
            }
        });
        rivets.bind(document.body, this);

        // Path
        Path.listen();

        // Init
        if (this.initVars.isDecrypted) {
            window.location.hash = "#/a";
        }
    }
}

window.onload = function() {
    app = window["app"] = new App({
        path: "src/templates/browser"
    });

    app.run();
};



