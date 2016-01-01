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

// TODO: belongs elsewhere
class KeyItem {
    publicKey: Keys.PublicKey;
    selected: boolean;

    constructor(key: Keys.PublicKey) {
        this.publicKey = key;
        this.selected = false;
    }

    name(): string {
        return this.publicKey.getPrimaryUser();
    }
}

/*
 * Address Book tab controller
 */

class AddressBookTab implements Application.Article {
    filename = "address_book.html";
    articleId = "addressBook";
    filter: string;
    foundKeys: Array<KeyItem>;
    error: string;
    clearText: string;

    constructor() {
        this.filter = ""; // TODO - last used
    }

    doFilter(): void {
        if ( this.filter == "" || this.filter == null ) {
            this.foundKeys = [];
            return;
        }

        app.keyStore.searchPublicKey(this.filter, (keys) => {
            this.foundKeys = keys.map((k) => {
                return new KeyItem(k);
            })
        });
    }

    select(e: Event, model: {index: number}) {
        var keyItem = this.foundKeys[model.index];
        keyItem.selected = !keyItem.selected;
    }

    submit(e: Event) {
        var keyList: Array<string> = [],
            i: number,
            key: KeyItem;

        if (this.foundKeys.length == 0) return;     // TODO: show tip

        for (i = 0; i < this.foundKeys.length; i++) {
            key = this.foundKeys[i];
            if ( key.selected ) {
                keyList.push(key.publicKey.armored())
            }
        }

        chrome.runtime.sendMessage({ command: 'encryptMessage', text: this.clearText, keyList: keyList }, (result) => {
            if ( result.success ) {
                sendMessageToContent({ setElement: result.value });
                window.close();
            } else {
                this.error = result.error;
            }
        })
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

    constructor( config: Application.AppConfig ) {
        super(config);

        // Articles
        this.registerArticle( new AddressBookTab() );

        // Router
        this.router();
    }

    router(): void {
        Path.map("#/ab").to(() => {
            this.loadArticle('addressBook');
        });
    }

    enterPassword(e: KeyboardEvent): void {
        if ( e.keyCode != 13 ) return;
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
                this.call(app, event, binding.view.models)
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
                    window.location.hash = "#/ab";
                }
            });
        });
    }
}

window.onload = function() {
    app = window["app"] = new App({
        element: document.getElementById('article'),
        path: "src/templates/background",
        keyStore: new KeyStore.LocalStore(config),
        messageStore: new MessageStore.RemoteService(config.messageStore.localHost)
    });

    app.run();
};



