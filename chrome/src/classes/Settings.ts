/// <reference path="Interfaces.ts" />
/// <reference path="PublicKey.ts" />

module Services {

    // Callback interface for the function that returns the private key
    export interface PrivateKeyCallback {
        (result: PGP.PrivateKey): void;
    }

    export interface Settings {
        storePrivateKey(key: PGP.PrivateKey, callback: Interfaces.Callback): void;
        loadPrivateKey(callback: PrivateKeyCallback): void;
    }

}
