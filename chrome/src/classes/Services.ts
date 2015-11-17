/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="../typings/openpgp.d.ts" />
/// <reference path="Interfaces.ts" />
/// <reference path="PublicKey.ts" />

module Services {

    // Callback function that returns a key
    export interface PublicKeyCallback {
        (result: PGP.PublicKey): void;
    }

    // An array of public keys
    export interface PublicKeyArray {
        [index: number]: PGP.PublicKey;
        push(key: PGP.PublicKey);
    }

    // A dictionary of fingerprints and public keys
    export interface PublicKeyDict {
        [fingerprint: string]: PGP.PublicKey;
    }

    // Callback function that returns an array of keys
    export interface PublicKeySearchCallback {
        (result: PublicKeyArray): void;
    }

    // Callback interface for the function that returns a message
    export interface MessageCallback {
        (result: string): void;
    }

    export interface Storage {
        // Public Keys
        storePublicKey(key: PGP.PublicKey, callback: Interfaces.Callback): void;
        loadPublicKey(fingerprint: string, callback: PublicKeyCallback): void;
        searchPublicKey(userId: string, callback: PublicKeySearchCallback): void;

        // Messages
        storeMessage(armored: string, callback: Interfaces.Callback): void;
        loadMessage(id: string, callback: MessageCallback): void;
    }

}
