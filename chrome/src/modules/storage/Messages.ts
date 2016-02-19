/// <reference path="../../../typings/chrome/chrome.d.ts" />
/// <reference path="../interfaces.ts" />

module MessageStore {

    // Success callback with value type message id
    export type IdCallback = Interfaces.SuccessCallback<Messages.Id>;

    // Success callback with value type armored object
    export type ArmoredCallback = Interfaces.SuccessCallback<Messages.Armored>;

    // Anyone implementing settings should implements this
    export interface Interface {

        save(armor: Messages.ArmorType, callback: IdCallback): void;
        load(id: Messages.Id, callback: ArmoredCallback): void;

        // Get the URL from an id
        getURL(id: Messages.Id): string;

        // Returns a string for the regex that matches the url. Why string?
        // Because we'll end up passing it to content via a message and RegExp
        // is an object (i.e. it'll get lost in the message)
        getReStr(): string;
    }

}

