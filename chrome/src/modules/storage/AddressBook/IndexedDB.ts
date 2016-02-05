/// <reference path="../../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../interfaces.ts" />
/// <reference path="../../keys.ts" />
/// <reference path="../AddressBook.ts" />

module AddressBookStore {

    var storeName = "keys";

    export class IndexedDB implements Interface {

        private dbName: string;

        constructor(config: Config) {
            this.dbName = config.addressBookStore.indexedDb.dbName;
        }

        private initialize(callback: Interfaces.ResultCallback): void {
            var request = indexedDB.open(this.dbName);
            request.onupgradeneeded = function() {
                var db = request.result;
                var store = db.createObjectStore(storeName, {keyPath: "fingerprint"});
                store.createIndex("by_fingerprint", "fingerprint");
                store.createIndex("by_userId", "userId", { unique: true });
            };

            request.onsuccess = function() {
                callback(request.result);
            };
        }

        save(key: Keys.PublicKey, callback: Interfaces.Callback): void {
            this.initialize((db) => {
                var tx = db.transaction(storeName, "readwrite"),
                    store = tx.objectStore(storeName),
                    userIds = key.userIds();

                tx.oncomplete = callback;

                userIds.forEach((userId) => {
                    store.put({
                        fingerprint: key.fingerprint(),
                        armor: key.armored(),
                        userId: userId
                    });
                });
            });
        }

        loadSingle(fingerprint: Interfaces.Fingerprint, callback: PublicKeyCallback): void {
            this.initialize((db) => {
                var tx = db.transaction(storeName, "readonly"),
                    store = tx.objectStore(storeName),
                    index = store.index("by_fingerprint");

                var request = index.get(fingerprint);
                request.onsuccess = () => {
                    var obj = request.result;
                    var key: Keys.PublicKey;
                    if ( obj != undefined ) {
                        key = new Keys.PublicKey(obj.armor);
                    }
                    callback(key);
                }
            })
        }

        load(fingerprints: Array<Interfaces.Fingerprint>, callback: PublicKeySearchCallback): void {
            var result: PublicKeyArray = [];

            var _load = function(idx: number, done: PublicKeySearchCallback): void {
                this.loadSingle(fingerprints[idx], (key) => {
                    result.push(key);
                    if ( idx < fingerprints.length - 1 ) {
                        _load(idx + 1, done);
                    } else {
                        done(result);
                    }
                });
            }.bind(this);

            this.initialize((db) => {
                _load(0, callback);
            });
        }

        search(userId: Interfaces.UserID, callback: PublicKeySearchCallback): void {
        }

        deleteAll(callback: Interfaces.Callback): void {
        }

        exportKeys(callback: ArmorArrayCallback): void {
        }

        importKeys(keys: Array<Interfaces.Armor>, callback: Interfaces.Callback): void {
        }
    }
}
