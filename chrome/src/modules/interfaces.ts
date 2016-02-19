module Interfaces {

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
        message: MessageStore.Interface;
        addressBook: AddressBookStore.Interface;
        preferences: PrefsStore;
    }

    export interface Preferences {
        publicKeyUrl: string;
        publicKeySaveTime: Date;
    }

    export interface BackgroundPage extends Window {
        config: Config;
        store: StoreCollection;
        privateKey: Keys.PrivateKey;
        elementLocatorDict: ElementLocatorDict;
        preferences: Preferences;

        initialize(): InitVars;
        encryptMessage(msg: Messages.ClearType, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback<string>): void;
        lockDown(callback?: Callback): void;

        Message: any;
    }
}
