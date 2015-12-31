/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="interfaces.ts" />

module MessageStore {

    export interface ResultStatus {
        success?: boolean;
        error?: string;
    }

    export interface MessageIdStruct extends ResultStatus {
        id?: string
    }

    export interface MessageArmoredStruct extends ResultStatus {
        armor?: string;
    }

    // Callback interface for the function that returns the private key
    export interface MessageArmoredCallback {
        (result: MessageArmoredStruct): void;
    }

    export interface MessageIdCallback {
        (result: MessageIdStruct): void;
    }

    // Anyone implementing settings should implements this
    export interface Interface {
        save(armor: string, callback: MessageIdCallback): void;
        load(id: string, callback: MessageArmoredCallback): void;

        // Get the URL from an id
        getURL(id: string): string;

        // Returns a string for the regex that matches the url. Why string?
        // Because we'll end up passing it to content via a message and RegExp
        // is an object (i.e. it'll get lost in the message)
        getReStr(): string;
    }

}

