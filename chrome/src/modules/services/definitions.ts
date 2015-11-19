/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../typings/openpgp.d.ts" />
/// <reference path="../interfaces.ts" />
/// <reference path="../pgp/keys.ts" />

module Services {

    /*************************************************************
     * STORAGE
     *************************************************************/

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
        deleteAllPublicKeys(callback: Interfaces.Callback): void;

        // Messages
        storeMessage(armored: string, callback: Interfaces.Callback): void;
        loadMessage(id: string, callback: MessageCallback): void;
    }

    /*************************************************************
     * SETTINGS
     *************************************************************/

    // Callback interface for the function that returns the private key
    export interface PrivateKeyCallback {
        (result: PGP.PrivateKey): void;
    }

    export interface Settings {
        storePrivateKey(key: PGP.PrivateKey, callback: Interfaces.Callback): void;
        loadPrivateKey(callback: PrivateKeyCallback): void;
    }

}
