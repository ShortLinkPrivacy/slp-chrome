/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../settings.ts" />
/// <reference path="../interfaces.ts" />
/// <reference path="../keys.ts" />

module PrivateKeyStore {

    export interface PrivateKeyStoreConfig {
        privateKeyLabel: string;
        store: chrome.storage.StorageArea;
    }

    export class LocalStore implements PrivateKeyStore.Interface {
        private config: PrivateKeyStoreConfig;

        constructor(config: any) {
            this.config = config.settings.localStore;
        }

        private checkRuntimeError(): void {
            if ( typeof chrome.runtime != "undefined" && chrome.runtime.lastError ) {
                throw chrome.runtime.lastError;
            }
        }

        set(key: Keys.PrivateKey, callback: Interfaces.Callback): void {
            var setter: Interfaces.Dictionary = {};
            setter[this.config.privateKeyLabel] = key.armored();
            this.config.store.set(setter, () => {
                this.checkRuntimeError();
                callback();
            });
        }

        get(callback: PrivateKeyCallback): void {
            this.config.store.get(this.config.privateKeyLabel, (result) => {
                var armoredText: string = result[this.config.privateKeyLabel];
                var privateKey: Keys.PrivateKey;

                // Check for corrupted private key, and remove it if it is
                if ( armoredText ) {
                    try {
                        privateKey = new Keys.PrivateKey(armoredText);
                    } catch (err) {
                        throw "key.corrupted";
                    }
                }

                callback(privateKey);
            });
        }

        remove(callback: Interfaces.Callback): void {
            this.config.store.remove(this.config.privateKeyLabel, () => {
                callback();
            });
        }
    }
}
