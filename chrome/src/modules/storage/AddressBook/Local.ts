/// <reference path="../../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../interfaces.ts" />
/// <reference path="../../keys.ts" />
/// <reference path="../AddressBook.ts" />

module AddressBookStore {

    interface KeyDirectory {
        [fingerprint: string]: Array<Interfaces.UserID>;
    }

    export class Local extends LocalStorage implements Interface {
        private label: string;
        private directory: KeyDirectory;

        constructor(config: Config) {
            this.directory = {};
            this.label = config.addressBookStore.local.label;
            super(config.addressBookStore.local.store);
        }

        private initialize(callback: Interfaces.Callback): void {
            if ( this.directory ) {
                callback();
                return;
            }

            // Load the directory of the address book
            this._get_single(this.label, callback);
        }

        save(key: Keys.PublicKey, callback: Interfaces.Callback): void {
            var p = <string>key.fingerprint(),
                k = this.label,
                setter = {};

            this.initialize(() => {
                if ( this.directory[p] ) {
                    callback();
                    return;
                }

                this.directory[p] = key.userIds();

                setter[p] = key.armored();
                setter[k] = this.directory;

                this._set_many(setter, callback);
            })
        }

        load(fingerprints: Array<Interfaces.Fingerprint>, callback: PublicKeySearchCallback): void {
            var result: PublicKeyArray = [];

            this._get_many(fingerprints, (found) => {
                Object.keys(found).forEach((p) => {
                    var key = new Keys.PublicKey( found[p] );
                    result.push( key );
                });

                callback(result);
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

                this._get_many(getter, (item) => {
                    var key: Keys.PublicKey;

                    Object.keys(item).forEach((p) => {
                        key = new Keys.PublicKey( item[p] );
                        result.push( key );
                    });

                    callback(result);
                });
            })
        }

        deleteAll(callback: Interfaces.Callback): void {
            var remover: Array<string>;

            this.initialize(() => {
                remover = Object.keys(this.directory);
                remover.push(this.label);
                this.directory = {};
                this._remove_many(remover, callback);
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

