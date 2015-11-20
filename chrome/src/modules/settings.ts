/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="../typings/openpgp.d.ts" />
/// <reference path="interfaces.ts" />
/// <reference path="keys.ts" />

module Settings {

    // Callback interface for the function that returns the private key
    export interface PrivateKeyCallback {
        (result: Keys.PrivateKey): void;
    }

    // Anyone implementing settings should implements this
    export interface Interface {
        storePrivateKey(key: Keys.PrivateKey, callback: Interfaces.Callback): void;
        loadPrivateKey(callback: PrivateKeyCallback): void;
        removePrivateKey(callback: Interfaces.Callback): void;
    }

}
