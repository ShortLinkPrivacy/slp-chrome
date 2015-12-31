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

    export interface InitVars {
        linkRe: string;
        isDecrypted: boolean;
    }

}
