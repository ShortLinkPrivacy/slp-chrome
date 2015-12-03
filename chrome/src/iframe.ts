/// <reference path="../typings/openpgp/openpgp.d.ts" />
/// <reference path="../typings/rivets/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

interface AppConfig {
    keyStore: KeyStore.Interface;
    privateKeyStore: PrivateKeyStore.Interface;
}

class App {
    element: HTMLElement;
    config: AppConfig;
    keyStore: KeyStore.Interface;
    privateKeyStore: PrivateKeyStore.Interface;

    constructor( config: AppConfig ) {
        this.element = document.getElementById('iframe');
        this.keyStore = config.keyStore;
        this.privateKeyStore = config.privateKeyStore;
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

}

window.onload = function() {
    var config = new Config();
    var app = window["app"] = new App({
        keyStore: new KeyStore.LocalStore(config),
        privateKeyStore: new PrivateKeyStore.LocalStore(config)
    });

    var element = document.getElementById('iframe');

    // Rivets
    rivets.configure({
        handler: function(target, event, binding) {
            this.call(app, event, binding.view.models)
        }
    });
    rivets.bind(element, app);
};
