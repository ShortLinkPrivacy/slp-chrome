/// <reference path="../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="Interfaces.ts" />
/// <reference path="PublicKey.ts" />
module Services {

    // Callback function that returns a key
    interface PublicKeyCallback {
        (result: PGP.PublicKey): void;
    }

    // An array of public keys
    interface PublicKeyArray {
        [index: number]: PGP.PublicKey;
        push(key: PGP.PublicKey);
    }

    // A dictionary of fingerprints and public keys
    interface PublicKeyDict {
        [fingerprint: string]: PGP.PublicKey;
    }

    // Callback function that returns an array of keys
    interface PublicKeySearchCallback {
        (result: PublicKeyArray): void;
    }

    interface Storage {
        // Public Key
        storePublicKey(key: PGP.PublicKey, callback: Interfaces.Callback): void;
        loadPublicKey(fingerprint: string, callback: PublicKeyCallback): void;
        searchPublicKey(userId: string, callback: PublicKeySearchCallback): void;

        // Messages
        //storeMessage(armored: string, callback: Interfaces.Callback): void;
        //loadMessage(id: string, callback: Interfaces.Callback): void;
    }

    class LocalStore implements Storage {
        private config: Interfaces.LocalStoreConfig;
        private directory: PublicKeyDict = {};
        private store: chrome.storage.StorageArea;

        constructor(config: Interfaces.LocalStoreConfig ) {
            this.config = config;
            this.store = config.store;
        }

        private checkRuntimeError(error: string): void {
            if ( typeof chrome.runtime != "undefined" && chrome.runtime.lastError ) {
                throw chrome.runtime.lastError;
            }
        }

        private saveDirectory(callback: Interfaces.Callback): void {
            var setter: Interfaces.Dictionary = {};
            setter[this.config.directoryKey] = this.directory;
            this.store.set(setter, function() {
                this.checkRuntimeError();
                callback();
            })
        }

        initialize(callback: Interfaces.Callback): void {
            var store = this.config.store;
            var dirKey = this.config.directoryKey;
            store.get(dirKey, function(result){
                if ( typeof result[dirKey] != "undefined" ) {
                    this.directory = result[dirKey];
                }
                callback();
            });
        }

        storePublicKey(key: PGP.PublicKey, callback: Interfaces.Callback): void {
            if ( this.directory[key.fingerprint()] ) return;
            this.directory[key.fingerprint()] = key;
            this.saveDirectory(callback);
        }

        loadPublicKey(fingerprint: string, callback: PublicKeyCallback): void {
            var key = this.directory[fingerprint];
            callback(key);
        }

        searchPublicKey(userId: string, callback: PublicKeySearchCallback): void {
            var result: PublicKeyArray = [];
            var re = new RegExp(userId);
            for (var fingerprint in this.directory) {
                var key = this.directory[fingerprint];
                var userIds = key.getUserIds();
                userIds.forEach(id => {
                    if (id.match(re)) {
                        result.push(key);
                    }
                });
            }
            callback(result);
        }

    }
}
