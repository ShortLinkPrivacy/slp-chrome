/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var app: App;

function sendMessageToContent(msg: any, callback?: Interfaces.ResultCallback): void {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, msg, callback);
    });
}

interface AppConfig {
    keyStore: KeyStore.Interface;
    privateKeyStore: PrivateKeyStore.Interface;
}

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

class App {
    element: HTMLElement;
    config: AppConfig;
    keyStore: KeyStore.Interface;
    privateKeyStore: PrivateKeyStore.Interface;
    filter: string;
    foundKeys: Array<KeyItem>;
    key: Keys.PrivateKey;

    constructor( config: AppConfig ) {
        this.element = document.getElementById('iframe');
        this.keyStore = config.keyStore;
        this.privateKeyStore = config.privateKeyStore;
        this.foundKeys = [];

        this.filter = ""; // TODO - most used
    }

    doFilter(): void {
        if ( this.filter == "" || this.filter == null ) {
            this.foundKeys = [];
            return;
        }

        this.keyStore.searchPublicKey(this.filter, (keys) => {
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
        var armoredTexts: Array<string> = [],
            i: number,
            key: KeyItem;

        // We can't send objects with methods in a message, so we'll collect
        // only the armored text of all keys
        for (i = 0; i < this.foundKeys.length; i++) {
            key = this.foundKeys[i];
            if ( key.selected ) {
                armoredTexts.push(key.publicKey.armored())
            }
        }

        // Last, but not least we push the guys own public key, so he can read
        // his own messages
        armoredTexts.push(this.key.toPublic().armored());

        // Close and send keys
        sendMessageToContent({ encrypt: true, keys: armoredTexts });
        window.close();
    }

    run(): void {
        // Rivets
        this.element = document.getElementById('iframe');
        rivets.configure({
            handler: function(target, ev, binding) {
                this.call(app, ev, binding.model)
            }
        });
        rivets.bind(this.element, this);

        this.keyStore.initialize(() => {
            this.privateKeyStore.get((key) => {
                this.key = key;
            })
            this.doFilter();
        });
    }

}

var config = new Config();
app = window["app"] = new App({
    keyStore: new KeyStore.LocalStore(config),
    privateKeyStore: new PrivateKeyStore.LocalStore(config)
});

window.onload = app.run.bind(app);
