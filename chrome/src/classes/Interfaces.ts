module Interfaces {
    export interface Dictionary {
        [index: string]: any;
    }

    export interface Callback {
        (): void;
    }

    export interface ResultCallback {
        (result: any): void;
    }

    export interface LocalStoreConfig {
        // chrome storage (local or sync)
        store: chrome.storage.StorageArea;

        // own private key
        keyName: string;

        // directory of public keys
        directoryKey: string;
    }

}
