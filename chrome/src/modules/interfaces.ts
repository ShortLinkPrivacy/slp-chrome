module Interfaces {

    export interface Armor extends String {}
    export interface UserID extends String {}
    export interface Fingerprint extends String {}

    export interface Dictionary extends Object {
        [index: string]: any;
    }

    export interface Callback {
        (): void;
    }

    export interface ResultCallback {
        (result: any): void;
    }

    export interface SuccessStruct {
        success: boolean;
        error?: string;
        value?: any;
    }

    export interface SuccessCallback {
        (result: SuccessStruct): void;
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

    export interface BackgroundPage extends Window {
        config: Config;
        privateKeyStore: PrivateKeyStore.Interface;
        messageStore: MessageStore.Interface;
        keyStore: KeyStore.Interface;
        privateKey: Keys.PrivateKey;
        elementLocatorDict: ElementLocatorDict;

        initialize(): InitVars;
        encryptMessage(text: string, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback): void;
        lockDown(callback?: Callback): void;
    }
}
