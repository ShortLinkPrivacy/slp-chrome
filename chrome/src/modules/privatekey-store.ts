/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="../../typings/openpgp/openpgp.d.ts" />
/// <reference path="interfaces.ts" />
/// <reference path="keys.ts" />

module PrivateKeyStore {

    // Callback interface for the function that returns the private key
    export interface PrivateKeyCallback {
        (result: Keys.PrivateKey): void;
    }

    // Anyone implementing settings should implements this
    export interface Interface {
        set(key: Keys.PrivateKey|string, callback: PrivateKeyCallback): void;
        get(callback: PrivateKeyCallback): void;
        remove(callback: Interfaces.Callback): void;
    }

}
