/// <reference path="modules/config.ts" />
/// <reference path="modules/keys.ts" />
/// <reference path="modules/key-store/LocalStore.ts" />
/// <reference path="modules/privatekey-store/LocalStore.ts" />
/// <reference path="modules/message-store/LocalStore.ts" />
/// <reference path="typings/openpgp.d.ts" />
/// <reference path="typings/rivets.d.ts" />
/// <reference path="../typings/chrome/chrome.d.ts" />

interface AppConfig {

}

class App {
    element: HTMLElement;
    config: AppConfig;
    keyStore: KeyStore.Interface;

    constructor() {
        this.element = document.getElementById('iframe');
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
