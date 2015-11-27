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
            var armoredDir = {};
            for ( var fingerprint in this.directory ) {
                armoredDir[fingerprint] = this.directory[fingerprint].armored();
            }
            this.save(this.config.directory, armoredDir, callback);
        }

        private saveMessages(callback: Interfaces.Callback): void {
            this.save(this.config.messages, this.messages, callback);
        }

        initialize(callback: Interfaces.Callback): void {
            var store = this.config.store;
            var mk = this.config.messages;
            var dk = this.config.directory;
            var dir: Interfaces.Dictionary;

            // Load the directory with public keys and messages
            store.get([mk, dk], (result) => {

                // Load all public keys from localStore.
                // All keys are stored in armored text, so when we load them
                // back, we have to convert them to Key.PublicKey
                if ( typeof result[dk] != "undefined" ) {
                    dir = result[dk];
                    for (var k in dir) {
                        this.directory[k] = new Keys.PublicKey(dir[k]);
                    }
                }

                // Load all messages from LocalStore
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

