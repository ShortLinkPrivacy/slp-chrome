module Interfaces {

    // The LastMessage structure is like a message
    // structure, but the `body` attribute is an array
    // of keys (fingerprints) which were used to
    // encrypt the previous message
    export type LastMessage = Messages.Record<Keys.FingerprintArray>;

    export interface Dictionary extends Object {
        [index: string]: any;
    }

    export interface Callback {
        (): void;
    }

    export interface ResultCallback<T> {
        (result: T): void;
    }

    export interface Success {
        success: boolean;
        error?: string;
    }

    export interface SuccessCallback<T> {
        (result: Success & { value?: T }): void;
    }

    export interface InitVars {
        linkRe?: string;
        isDecrypted?: boolean;
        hasPrivateKey?: boolean;
        config?: Config;
    }

    export interface ElementLocator {
        command?: string;
        frameId: string;
        elementId: string;
    }

    export interface ElementLocatorDict {
        [tabId: number]: ElementLocator;
    }

    export interface StoreCollection {
        privateKey: PrivateKeyStore.Interface;
        addressBook: AddressBookStore.Interface;
    }

    export interface BackgroundPage extends Window {
        config: Config;
        store: StoreCollection;
        privateKey: Keys.PrivateKey;
        elementLocatorDict: ElementLocatorDict;
        preferences: Preferences;
        slp: API.ShortLinkPrivacy;

        initialize(): InitVars;
        encryptMessage(msg: Messages.ClearType, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback<string>): void;
        encryptPublicKey(callback: SuccessCallback<string>): void;
        lockDown(callback?: Callback): void;

        Message: any;
    }
}
