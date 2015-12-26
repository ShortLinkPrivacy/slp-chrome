/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../privatekey-store.ts" />
/// <reference path="../interfaces.ts" />
/// <reference path="../keys.ts" />

module PrivateKeyStore {

    export interface PrivateKeyStoreConfig {
        store: chrome.storage.StorageArea;
        privateKeyLabel: string;
    }

    export class LocalStore implements Interface {
        private store: chrome.storage.StorageArea;
        private privateKeyLabel: string;

        constructor(config: any) {
            var c = config.privateKeyStore.localStore;
            this.store = c.store;
            this.privateKeyLabel = c.privateKeyLabel;
        }

        private checkRuntimeError(): void {
            if ( typeof chrome.runtime != "undefined" && chrome.runtime.lastError ) {
                throw chrome.runtime.lastError;
            }
        }

        set(key: Keys.PrivateKey|string, callback: Interfaces.Callback): void {
            var setter: Interfaces.Dictionary = {},
                _key: Keys.PrivateKey;

            // May throw!
            if ( typeof key == "string" )
                _key = new Keys.PrivateKey(<string>key)
            else
                _key = <Keys.PrivateKey>key

            setter[this.privateKeyLabel] = _key.armored();
            this.store.set(setter, () => {
                this.checkRuntimeError();
                callback();
            });
        }

        getArmored(callback: {(armored: string): void}) {
            this.store.get(this.privateKeyLabel, (result) => {
                var armoredText: string = result[this.privateKeyLabel];
                callback(armoredText);
            });
        }

        get(callback: PrivateKeyCallback): void {
            this.getArmored((armoredText) => {
                var privateKey: Keys.PrivateKey;

                // TODO: Check for corrupted private key, and remove it if it is
                if ( armoredText ) {
                    privateKey = new Keys.PrivateKey(armoredText);
                }

                callback(privateKey);
            });
        }

        remove(callback: Interfaces.Callback): void {
            this.store.remove(this.privateKeyLabel, () => {
                callback();
            });
        }
    }
}
