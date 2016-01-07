/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="../typings/pathjs/pathjs.d.ts" />
/// <reference path="modules.d.ts" />

var app: App,
    config = new Config();

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

        sendMessageToContent({ getElement: true }, (el: HTMLTextAreaElement) => {
            if ( this.alreadyEncrypted = el["crypted"] ) return;
            if ( el.tagName == 'TEXTAREA' ) this.clearText = el.value;
        });
    }

    doFilter(): void {
        if ( !this.filter ) {
            this.foundKeys = [];
            return;
        }

        app.keyStore.searchPublicKey(this.filter, (keys) => {
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
        if ( !this.isSelected(item) ) {
            this.selectedKeys.push(item);
        }
    }

    remove(e: Event, model: {index: number}) {
        this.selectedKeys.splice(model.index, 1);
    }

    submit(e: Event) {
        var keyList: Array<string>,
            i: number;

        // This should never happen because we don't show the submit button
        if (!this.hasSelectedKeys) return;

        keyList = this.selectedKeys.map(item => { return item.key.armored() })

        // We can encrypt here, but we chose to delegate that to the background
        // page, because it already has an unlocked copy of the private key.
        chrome.runtime.sendMessage({ command: 'encryptMessage', text: this.clearText, keyList: keyList }, (result) => {
            if ( result.success ) {
                sendMessageToContent({ setElement: result.value });
                window.close();
            } else {
                app.error = result.error;
            }
        })
    }
}

class MyKeyTab implements Application.Article {
    filename = "mykey.html";
    articleId = "myKey";
    publicKey: string;

    submit(): void {
        chrome.runtime.sendMessage({ command: 'encryptKey' }, (result) => {
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
        chrome.runtime.sendMessage({ command: 'lock' }, () => {
            window.close();
        });
    }
}

/*
 * The main application handles all articles, bit it itself
 * also handles the private key password entry screen.
 */

class App extends Application.Main {
    initVars: Interfaces.InitVars;
    error: string;
    password: string;
    tabs: any = {};

    constructor( config: Application.AppConfig ) {
        super(config);

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
            chrome.runtime.sendMessage({ command: 'unlock', password: this.password }, (result) => {
                if ( result.success ) {
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
            });
        }
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

        // Call background for init
        this.keyStore.initialize(() => {
            chrome.runtime.sendMessage({ command: 'init' }, (result: { value: Interfaces.InitVars }) => {
                this.initVars = result.value;
                if (this.initVars.isDecrypted) {
                    window.location.hash = "#/a";
                }
            });
        });
    }
}

window.onload = function() {
    app = window["app"] = new App({
        path: "src/templates/browser",
        keyStore: new KeyStore.LocalStore(config)
    });

    app.run();
};



