/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var app: App;

interface AppConfig {
    keyStore: KeyStore.Interface;
    privateKeyStore: PrivateKeyStore.Interface;
}

class App {
    element: HTMLElement;
    config: AppConfig;
    keyStore: KeyStore.Interface;
    privateKeyStore: PrivateKeyStore.Interface;
    filter: string;
    foundKeys: KeyStore.PublicKeyArray = [];
    key: Keys.PrivateKey;

    constructor( config: AppConfig ) {
        this.element = document.getElementById('iframe');
        this.keyStore = config.keyStore;
        this.privateKeyStore = config.privateKeyStore;

        this.filter = "ifn"; // TODO - most used
    }

    sendMessageToBackground(msg: any, callback: Interfaces.ResultCallback): void {
        chrome.runtime.sendMessage({ iframe: true, message: msg }, callback);
    }

    sendMessageToContent(msg: any): void {
        window.parent.postMessage({ iframe: true, message: msg }, '*' );
    }

    close(e: Event): void {
        this.sendMessageToContent( { closePopup: true } );
    }

    doFilter(): void {
        if ( this.filter == "" || this.filter == null ) {
            this.foundKeys = [];
            return
        }

        this.keyStore.searchPublicKey(this.filter, (keys) => {
            this.foundKeys = keys;
        });
    }

    select(e: Event, a: any, self: { index: number }) {

    }

    run(): void {
        // Rivets
        this.element = document.getElementById('iframe');
        rivets.configure({
            handler: function(target, event, binding) {
                this.call(app, event, binding.view.models)
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
