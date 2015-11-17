/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../PublicKey.ts" />
/// <reference path="../Services.ts" />

module Services {

    interface LocalStoreConfig {
        // chrome storage (local or sync)
        store: chrome.storage.StorageArea;

        // public keys
        directory: string;

        // messages 
        messages: string;
    }

    class LocalStore implements Services.Storage {
        private directory: PublicKeyDict = {};
        private messages: Interfaces.Dictionary = {};
        private config: LocalStoreConfig;

        constructor(config: any) {
            this.config = config.storage.localStore;
        }

        private checkRuntimeError(error: string): void {
            if ( typeof chrome.runtime != "undefined" && chrome.runtime.lastError ) {
                throw chrome.runtime.lastError;
            }
        }

        private saveDirectory(callback: Interfaces.Callback): void {
            var setter: Interfaces.Dictionary = {};
            setter[this.config.directory] = this.directory;
            this.config.store.set(setter, function() {
                this.checkRuntimeError();
                callback();
            })
        }

        initialize(callback: Interfaces.Callback): void {
            var store = this.config.store;
            var mk = this.config.messages;
            var dk = this.config.directory;

            // Load the directory with publick keys and messages
            store.get([mk, dk], function(result){
                if ( typeof result[dk] != "undefined" ) {
                    this.directory = result[dk];
                }
                if ( typeof result[mk] != "undefined" ) {
                    this.messages = result[mk];
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
                var userIds = key.userIds();
                userIds.forEach(id => {
                    if (id.match(re)) {
                        result.push(key);
                    }
                });
            }
            callback(result);
        }

        storeMessage(armored: string, callback: Interfaces.Callback): void {
            
        }

        loadMessage(id: string, callback: MessageCallback): void {

        }

    }

}

