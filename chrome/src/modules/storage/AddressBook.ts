/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../interfaces.ts" />
/// <reference path="../keys.ts" />

module AddressBookStore {

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

    export interface ArmorArrayCallback {
        (armorArr: Array<Interfaces.Armor>): void;
    }

    export interface Interface {
        save(key: Keys.PublicKey, callback: Interfaces.Callback): void;
        loadSingle(fingerprint: Interfaces.Fingerprint, callback: PublicKeyCallback): void;
        load(fingerprints: Array<Interfaces.Fingerprint>, callback: PublicKeySearchCallback): void;
        search(searchTerm: string, callback: PublicKeySearchCallback): void;
        deleteAll(callback: Interfaces.Callback): void;
        exportKeys(callback: ArmorArrayCallback): void;
        importKeys(keys: Array<Interfaces.Armor>, callback: Interfaces.Callback): void;
    }

}
