/// <reference path="../../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../interfaces.ts" />
/// <reference path="../../keys.ts" />
/// <reference path="../../storage.ts" />
/// <reference path="../PrivateKey.ts" />

module PrivateKeyStore {

    export class Local extends LocalStorage implements Interface {

        label: string;

        constructor(config: Config) {
            this.label = config.privateKeyStore.local.label;
            super(config.privateKeyStore.local.store);
        }

        set(key: Keys.PrivateKey|string, callback: PrivateKeyCallback): void {
            var setter: Interfaces.Dictionary = {},
                _key: Keys.PrivateKey;

            // May throw!
            if ( typeof key == "string" )
                _key = new Keys.PrivateKey(<string>key)
            else
                _key = <Keys.PrivateKey>key

            this._set_single(this.label, _key.armored(), () => {
                callback(_key);
            })
        }

        getArmored(callback: {(armored: string): void}) {
            this._get_single(this.label, callback);
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
            this._remove_single(this.label, callback);
        }
    }
}
