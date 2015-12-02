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

    sendMessage(msg: any, callback: Interfaces.ResultCallback): void {
        chrome.runtime.sendMessage({ content: msg }, callback);
    }

    close(e: Event): void {
        this.sendMessage( { closePopup: true }, (res) => {
            console.log(res);
        });
    }

}

window.onload = function() {
    var config = new Config();
    var app = window["app"] = new App({
        keyStore: new KeyStore.LocalStore(config),
        privateKeyStore: new PrivateKeyStore.LocalStore(config)
    });
};
