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
    messageStore: MessageStore.Interface;
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
    messageStore: MessageStore.Interface;
    privateKeyStore: PrivateKeyStore.Interface;
    filter: string;
    foundKeys: Array<KeyItem>;
    key: Keys.PrivateKey;
    error: string;
    clearText: string;

    constructor( config: AppConfig ) {
        this.element = document.getElementById('iframe');
        this.keyStore = config.keyStore;
        this.privateKeyStore = config.privateKeyStore;
        this.messageStore = config.messageStore;
        this.foundKeys = [];

        this.filter = ""; // TODO - last used
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

    private encrypt(text: string, keyList: Array<openpgp.key.Key>, callback: Interfaces.ResultCallback): void {
        openpgp.encryptMessage( keyList, text )
            .then((armoredText) => {
                this.messageStore.save(armoredText, (result) => {
                    if ( result.success ) {
                        callback(this.messageStore.getURL(result.id));
                    } else {
                        app.error = result.error;
                    }
                });
            })
            .catch((err) => {
                this.error = "OpenPGP Error: " + err;
            });
    }

    submit(e: Event) {
        var keyList: Array<openpgp.key.Key> = [],
            i: number,
            key: KeyItem;

        if (this.foundKeys.length == 0) return;     // TODO: show tip

        for (i = 0; i < this.foundKeys.length; i++) {
            key = this.foundKeys[i];
            if ( key.selected ) {
                keyList.push(key.publicKey.openpgpKey())
            }
        }

        // Add our key too, so we can read our own messages
        keyList.push(this.key.toPublic().openpgpKey());

        this.encrypt( this.clearText, keyList, (url) => {
            sendMessageToContent({ setElement: url });
            window.close();
        });
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
            this.privateKeyStore.get((key) => {     // TODO: what if there is no key?
                this.key = key;
                sendMessageToContent({ getElement: true }, (value) => {
                    this.clearText = value || "boza"; // XXX
                    this.doFilter();
                })
            })
        });
    }

}

var config = new Config();
app = window["app"] = new App({
    keyStore: new KeyStore.LocalStore(config),
    privateKeyStore: new PrivateKeyStore.LocalStore(config),
    messageStore: new MessageStore.RemoteService(config.messageStore.localHost)
});

window.onload = app.run.bind(app);
