/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../interfaces.ts" />
/// <reference path="../keys.ts" />
/// <reference path="../store.ts" />

module Store {

    interface LocalStoreConfig {
        // chrome storage (local or sync)
        store: chrome.storage.StorageArea;

        // public keys
        directory: string;

        // messages
        messages: string;
    }

    export class LocalStore implements Store.Interface {
        private directory: PublicKeyDict = {};
        private messages: Interfaces.Dictionary = {};
        private config: LocalStoreConfig;

        constructor(config: any) {
            this.config = config.storage.localStore;
        }

        private checkRuntimeError(): void {
            if ( typeof chrome.runtime != "undefined" && chrome.runtime.lastError ) {
                throw chrome.runtime.lastError;
            }
        }

        private save(key: string, value: any, callback: Interfaces.Callback): void {
            var setter: Interfaces.Dictionary = {};
            setter[key] = value;
            this.config.store.set(setter, () => {
                this.checkRuntimeError();
                callback();
            });
        }

        private saveDirectory(callback: Interfaces.Callback): void {
            this.save(this.config.directory, this.directory, callback);
        }

        private saveMessages(callback: Interfaces.Callback): void {
            this.save(this.config.messages, this.messages, callback);
        }

        initialize(callback: Interfaces.Callback): void {
            var store = this.config.store;
            var mk = this.config.messages;
            var dk = this.config.directory;

            // Load the directory with publick keys and messages
            store.get([mk, dk], (result) => {
                if ( typeof result[dk] != "undefined" ) {
                    this.directory = result[dk];
                }
                if ( typeof result[mk] != "undefined" ) {
                    this.messages = result[mk];
                }
                callback();
            });
        }

        storePublicKey(key: Keys.PublicKey, callback: Interfaces.Callback): void {
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
                var userIds = key.userIds();
                userIds.forEach(id => {
                    if (id.match(re)) {
                        result.push(key);
                    }
                });
            }
            callback(result);
        }

        deleteAllPublicKeys(callback: Interfaces.Callback): void {
            this.directory = {};
            this.saveDirectory(callback);
        }

        storeMessage(armored: string, callback: Interfaces.Callback): void {
            var algo = openpgp.enums.hash.md5;
            var md5 = openpgp.crypto.hash.digest(algo, armored);
            this.messages[md5] = armored;
            this.saveMessages(callback);
        }

        loadMessage(id: string, callback: MessageCallback): void {
            callback(this.messages[id]);
        }

    }

}

