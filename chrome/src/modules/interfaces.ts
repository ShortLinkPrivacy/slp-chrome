module Interfaces {
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
    }

    export interface BackgroundPage extends Window {
        config: Config;
        privateKeyStore: PrivateKeyStore.Interface;
        messageStore: MessageStore.Interface;
        keyStore: KeyStore.Interface;
        privateKey: Keys.PrivateKey;
        initialize: { (): InitVars };
    }

}
