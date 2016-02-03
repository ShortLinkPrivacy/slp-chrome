/// <reference path="../../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../interfaces.ts" />
/// <reference path="../../keys.ts" />
/// <reference path="../AddressBook.ts" />

module AddressBookStore {

    interface LocalStoreConfig {
        // chrome storage (local or sync)
        store: chrome.storage.StorageArea;

        // public keys
        directory: string;
    }

    interface KeyDirectory {
        // fingerprint => [ userId, userId, ... ]
        [fingerprint: string]: Array<Interfaces.UserID>;
    }

    export class LocalStore implements Interface {
        private directory: KeyDirectory;
        private messages: Interfaces.Dictionary = {};
        private config: LocalStoreConfig;

        constructor(config: any) {
            this.config = config.keyStore.localStore;
        }

        private checkRuntimeError(): void {
            if ( typeof chrome.runtime != "undefined" && chrome.runtime.lastError ) {
                throw chrome.runtime.lastError;
            }
        }

        private initialize(callback: Interfaces.Callback): void {
            var d = this.config.directory;

            if ( this.directory ) {
                callback();
                return;
            }

            // Load the directory with public keys and messages
            this.config.store.get(d, (result) => {
                this.checkRuntimeError();
                this.directory = result[d] || {};
                callback();
            });
        }

        save(key: Keys.PublicKey, callback: Interfaces.Callback): void {
            var p = <string>key.fingerprint(),
                k = this.config.directory,
                setter = {};

            this.initialize(() => {
                if ( this.directory[p] ) {
                    if (callback) callback();
                    return;
                }

                this.directory[p] = key.userIds();

                setter[p] = key.armored();
                setter[k] = this.directory;

                this.config.store.set( setter, () => {
                    this.checkRuntimeError();
                    if (callback) callback();
                });
            })
        }

        load(fingerprints: Array<Interfaces.Fingerprint>, callback: PublicKeySearchCallback): void {
            var result: PublicKeyArray = [];

            this.config.store.get( fingerprints, (found) => {
                this.checkRuntimeError();

                Object.keys(found).forEach((p) => {
                    var key = new Keys.PublicKey( found[p] );
                    result.push( key );
                });

                if (callback) callback(result);
            });
        }

        search(userId: Interfaces.UserID, callback: PublicKeySearchCallback): void {
            var result: PublicKeyArray = [],
                getter: Array<string> = [],
                userIdLower = userId.toLowerCase();

            this.initialize(() => {
                Object.keys(this.directory).forEach((p) => {
                    var userIds = this.directory[p];
                    userIds.forEach((id:string) => {
                        var idLower = id.toLowerCase();
                        if (idLower.search(userIdLower) >= 0)
                            getter.push(p);
                    });
                })

                this.config.store.get( getter, (item) => {
                    var key: Keys.PublicKey;

                    this.checkRuntimeError();

                    Object.keys(item).forEach((p) => {
                        key = new Keys.PublicKey( item[p] );
                        result.push( key );
                    });

                    if (callback) callback(result);
                });
            })
        }

        deleteAll(callback: Interfaces.Callback): void {
            var deleter: Array<string>;

            this.initialize(() => {
                deleter = Object.keys(this.directory);

                this.config.store.remove( deleter, () => {
                    this.checkRuntimeError();
                    this.directory = {};
                    callback();
                });
            })
        }

        exportKeys(callback: ArmorArrayCallback): void {
            var fingerprints: Array<string>,
                armors: Array<Interfaces.Armor>;

            this.initialize(() => {
                fingerprints = Object.keys(this.directory);
                this.load(fingerprints, (pubKeyArr) => {
                    // convert result to array of armors and return it via the callback
                    armors = pubKeyArr.map((k) => { return k.armored() })
                    callback(armors);
                })
            })

        }

        importKeys(keys: Array<Interfaces.Armor>, callback: Interfaces.Callback): void {

        }

    }

}

