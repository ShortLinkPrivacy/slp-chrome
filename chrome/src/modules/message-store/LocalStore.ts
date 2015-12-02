/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../message-store.ts" />
/// <reference path="../interfaces.ts" />

module MessageStore {

    export interface MessageConfig {
        store: chrome.storage.StorageArea;
    }

    export class LocalStore implements MessageStore.Interface {
        private store: chrome.storage.StorageArea;
        
        constructor(config: any) {
            this.store = config.messageStore.localStore.store;
        }

        private checkRuntimeError(): void {
            if ( typeof chrome.runtime != "undefined" && chrome.runtime.lastError ) {
                throw chrome.runtime.lastError;
            }
        }

        save(armored: string, callback: MessageIdCallback): void {
            var algo = openpgp.enums.hash.md5,
                md5 = openpgp.crypto.hash.digest(algo, armored),
                setter = {};

            setter[md5] = armored;

            this.store.set(setter, () => {
                this.checkRuntimeError();
                callback(md5);
            })
        }

        load(id: string, callback: MessageCallback): void {
            this.store.get(id, (items) => {
                this.checkRuntimeError();
                callback(items[id]);
            });
        }

    }
}

