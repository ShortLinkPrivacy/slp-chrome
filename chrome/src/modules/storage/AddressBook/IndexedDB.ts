/// <reference path="../../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../interfaces.ts" />
/// <reference path="../../keys.ts" />
/// <reference path="../AddressBook.ts" />

module AddressBookStore {

    export class IndexedDB implements Interface {

        static dbName = "AddressBook";
        static dbVersion = 1;

        private onerror: { (e: any): void };

        constructor() {
            this.onerror = function(e){
                throw Error(e.target.request.error);
            }.bind(this);
        }

        private initialize(callback: Interfaces.ResultCallback<any>): void {
            var request = indexedDB.open(IndexedDB.dbName, IndexedDB.dbVersion);

            request.onupgradeneeded = ()=> {
                var db = request.result;
                db.createObjectStore("ids", {keyPath: "userId"});
                db.createObjectStore("armor", {keyPath: "fingerprint"});
                console.log("DB initialized: ", IndexedDB.dbVersion);
            };

            request.onsuccess = ()=> {
                callback(request.result);
            };

            request.onerror = this.onerror;
        }

        save(key: Keys.PublicKey, callback: Interfaces.Callback): void {
            this.initialize((db) => {
                var request = db.transaction("armor", "readwrite").objectStore("armor").put({
                    fingerprint: key.fingerprint(),
                    armor: key.armored()
                });
                
                request.onsuccess = ()=> {
                    var tx = db.transaction("ids", "readwrite"), ids = tx.objectStore("ids");
                    key.userIds().forEach((userId) => {
                        ids.put({ userId: userId, fingerprint: key.fingerprint() })
                    });
                    tx.oncomplete = callback;
                };

                request.onerror = this.onerror;
            });
        }

        loadSingle(fingerprint: Keys.Fingerprint, callback: PublicKeyCallback): void {
            if (!fingerprint) return;

            this.initialize((db) => {
                var request = db.transaction("armor").objectStore("armor").get(fingerprint);

                request.onsuccess = ()=> {
                    var obj = request.result;
                    var key: Keys.PublicKey;
                    if ( obj != undefined ) {
                        key = new Keys.PublicKey(obj.armor);
                    }
                    callback(key);
                };

                request.onerror = this.onerror.bind(this);
            })
        }

        load(fingerprints: Keys.FingerprintArray, callback: PublicKeySearchCallback): void {
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
                if (fingerprints.length > 0) {
                    _load(0, callback);
                } else {
                    callback(result);
                }
            });
        }

        search(searchTerm: Keys.UserId, callback: PublicKeySearchCallback): void {
            var fingerprints: Keys.FingerprintArray = [];

            this.initialize((db) => {
                var request = db.transaction("ids", "readonly").objectStore("ids").openCursor();

                request.onsuccess = ()=> {
                    var cursor = request.result,
                        userId: string,
                        fingerprint: string,
                        searchRe: RegExp;

                    if (cursor) {
                        userId = cursor.value.userId;
                        fingerprint = cursor.value.fingerprint;
                        searchRe = new RegExp(searchTerm.replace(/\\/g, ""), 'i');
                        if (userId.search(searchRe) >= 0 
                            && fingerprints.indexOf(fingerprint) < 0) {
                            fingerprints.push(fingerprint);
                        }
                        cursor["continue"]();
                    } else {
                        this.load(fingerprints, callback);
                    }
                }

            })

        }

        deleteAll(callback: Interfaces.Callback): void {
            var deleteStore = function(name: string, db: any, onsuccess: Interfaces.Callback) {
                var request = db.transaction(name, "readwrite").objectStore(name).openCursor();
                var cursor;

                request.onsuccess = ()=> {
                    if ( cursor = request.result ) {
                        cursor["delete"]().onsuccess = ()=>{
                            cursor["continue"]();
                        }
                    } else {
                        onsuccess();
                    }
                };
            }

            this.initialize((db) => {
                deleteStore("ids", db, () => {
                    deleteStore("armor", db, callback)
                });
            })
        }

        exportKeys(callback: ArmorArrayCallback): void {
        }

        importKeys(keys: Keys.ArmorArray, callback: Interfaces.Callback): void {
        }
    }
}
