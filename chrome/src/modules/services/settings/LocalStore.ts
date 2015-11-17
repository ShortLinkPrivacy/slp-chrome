/// <reference path="../../../../typings/chrome/chrome.d.ts" />
/// <reference path="../definitions.ts" />
/// <reference path="../../interfaces.ts" />
/// <reference path="../../pgp/keys.ts" />

module Services {

    export interface SettingsConfig {
        privateKey: string;
        store: chrome.storage.StorageArea;
    }

    export class LocalStore implements Settings {
        private config: SettingsConfig;

        constructor(config: any) {
            this.config = config.settings.localStore;
        }

        storePrivateKey(key: PGP.PrivateKey, callback: Interfaces.Callback): void {
            var setter: Interfaces.Dictionary = {};
            setter[this.config.privateKey] = key.armored();
            this.config.store.set(setter, function() {
                this.checkRuntimeError();
                callback();
            })
        }

        loadPrivateKey(callback: PrivateKeyCallback): void {
            this.config.store.get(this.config.privateKey, function(result){
                callback(result[this.config.privateKey]);
            })
        }
    }
}
