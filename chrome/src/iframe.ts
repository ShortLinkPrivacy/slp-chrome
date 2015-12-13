/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var app: App;

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

    sendMessageToBackground(msg: any, callback: Interfaces.ResultCallback): void {
        chrome.runtime.sendMessage({ iframe: true, message: msg }, callback);
    }

    sendMessageToContent(msg: any): void {
        window.parent.postMessage({ iframe: true, message: msg }, '*' );
    }

    close(e: Event, keys?: Array<Keys.PublicKey>): void {
        var response = { closePopup: true };
        if (keys) response["keys"] = keys;
        this.sendMessageToContent(response);
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
        var keys = this.foundKeys.filter((k) => { 
            return k.selected 
        }).map((k) => { 
            return k.publicKey 
        });
        this.sendMessageToContent( { keys: keys } );
        this.close(e);
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
        })
    }

}

var config = new Config();
app = window["app"] = new App({
    keyStore: new KeyStore.LocalStore(config),
    privateKeyStore: new PrivateKeyStore.LocalStore(config)
});

window.onload = app.run.bind(app);
