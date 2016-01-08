/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="../../typings/openpgp/openpgp.d.ts" />
/// <reference path="interfaces.ts" />
/// <reference path="keys.ts" />

declare var exports: { [index: string]: any };

module KeyStore {

    // Callback function that returns a key
    export interface PublicKeyCallback {
        (result: Keys.PublicKey): void;
    }

    // An array of public keys
    export interface PublicKeyArray extends Array<Keys.PublicKey> {
    }

    // Callback function that returns an array of keys
    export interface PublicKeySearchCallback {
        (result: PublicKeyArray): void;
    }

    // Callback interface for the function that returns a message
    export interface MessageCallback {
        (result: string): void;
    }

    export interface Interface {
        storePublicKey(key: Keys.PublicKey, callback: Interfaces.Callback): void;
        loadPublicKey(fingerprint: string, callback: PublicKeyCallback): void;
        searchPublicKey(userId: string, callback: PublicKeySearchCallback): void;
        deleteAllPublicKeys(callback: Interfaces.Callback): void;
    }

    if ( typeof window == "undefined" ) {
        exports["KeyStore"] = KeyStore;
    }
}
