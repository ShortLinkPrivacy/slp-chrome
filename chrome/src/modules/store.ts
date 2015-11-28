/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="../typings/openpgp.d.ts" />
/// <reference path="interfaces.ts" />
/// <reference path="keys.ts" />

declare var exports: { [index: string]: any };

module Store {

    // Callback function that returns a key
    export interface PublicKeyCallback {
        (result: Keys.PublicKey): void;
    }

    // An array of public keys
    export interface PublicKeyArray {
        [index: number]: Keys.PublicKey;
        push(key: Keys.PublicKey);
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
        // Initialization
        initialize(callback: Interfaces.Callback): void;

        // Public Keys
        storePublicKey(key: Keys.PublicKey, callback: Interfaces.Callback): void;
        loadPublicKey(fingerprint: string, callback: PublicKeyCallback): void;
        searchPublicKey(userId: string, callback: PublicKeySearchCallback): void;
        deleteAllPublicKeys(callback: Interfaces.Callback): void;

        // Messages
        storeMessage(armored: string, callback: Interfaces.Callback): void;
        loadMessage(id: string, callback: MessageCallback): void;
    }

    if ( typeof window == "undefined" ) {
        exports["Store"] = Store;
    }
}
