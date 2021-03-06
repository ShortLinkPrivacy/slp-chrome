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
        (armorArr: Keys.ArmorArray): void;
    }

    export interface Interface {
        save(key: Keys.PublicKey, callback: Interfaces.Callback): void;
        loadSingle(fingerprint: Keys.Fingerprint, callback: PublicKeyCallback): void;
        load(fingerprints: Keys.FingerprintArray, callback: PublicKeySearchCallback): void;
        search(searchTerm: string, callback: PublicKeySearchCallback): void;
        deleteSingle(fingerprint: Keys.Fingerprint, callback: Interfaces.SuccessCallback<any>): void;
        deleteAll(callback: Interfaces.Callback): void;
    }

}
