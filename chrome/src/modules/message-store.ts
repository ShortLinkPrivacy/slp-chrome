/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="interfaces.ts" />

module MessageStore {

    // Callback interface for the function that returns the private key
    export interface MessageCallback {
        (armored: string): void;
    }

    export interface MessageIdCallback {
        (id: string): void;
    }

    // Anyone implementing settings should implements this
    export interface Interface {
        save(armored: string, callback: MessageIdCallback): void;
        load(id: string, callback: MessageCallback): void;
    }

}

