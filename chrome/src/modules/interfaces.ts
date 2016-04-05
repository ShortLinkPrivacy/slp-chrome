module Interfaces {

    // The last message is just a regular UrlType message. We define its own
    // type just for the hell of it.
    export type LastMessage = Messages.UrlType;

    export interface Dictionary extends Object {
        [index: string]: any;
    }

    export interface Callback {
        (): void;
    }

    export interface ResultCallback<T> {
        (result: T): void;
    }

    export interface Success<T> {
        success: boolean;
        error?: string;
        value?: T;
    }

    export interface SuccessCallback<T> {
        (result: Success<T>): void;
    }

    export interface RecordCommon {
        createdDate?: string;
        timeToLive?: number;
        extVersion?: string;
        host?: string;
    }

    export interface InitVars {
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

    export interface ContentMessage<T> {
        action: string;
        elementLocator?: ElementLocator;
        value?: T;
    }

    export interface ElementTextMessage {
        value: string;
        isAlreadyEncrypted: boolean;
        lastMessage: LastMessage;
        selectionRequired: boolean;
        host: string;
    }

    export interface BackgroundPage extends Window {
        config: Config;
        store: StoreCollection;
        privateKey: Keys.PrivateKey;
        elementLocatorDict: ElementLocatorDict;
        preferences: Preferences;
        slp: API.ShortLinkPrivacy;

        initialize(): InitVars;
        encryptMessage(msg: Messages.ClearType, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback<Messages.UrlType>): void;
        encryptPublicKey(callback: SuccessCallback<Messages.UrlType>): void;
        lockDown(hard?: boolean): void;
        unlockKey(password: string): boolean;
        _ga(category: string, action: string): void;

        Message: any;
    }
}
