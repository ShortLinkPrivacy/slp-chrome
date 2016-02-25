/// <reference path="../../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../interfaces.ts" />
/// <reference path="../../keys.ts" />
/// <reference path="../../storage.ts" />
/// <reference path="../PrivateKey.ts" />

module PrivateKeyStore {

    export class Local extends LocalStorage implements Interface {

        private static label = 'privateKey';
        private static store = chrome.storage.sync;

        constructor() {
            super(Local.store);
        }

        set(key: Keys.PrivateKey|string, callback: PrivateKeyCallback): void {
            var setter: Interfaces.Dictionary = {},
                _key: Keys.PrivateKey;

            // May throw!
            if ( typeof key == "string" )
                _key = new Keys.PrivateKey(<string>key)
            else
                _key = <Keys.PrivateKey>key

            this._set_single(Local.label, _key.armored(), () => {
                callback(_key);
            })
        }

        getArmored(callback: {(armored: string): void}) {
            this._get_single(Local.label, callback);
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
            this._remove_single(Local.label, callback);
        }
    }
}
