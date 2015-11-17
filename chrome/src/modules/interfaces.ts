module Interfaces {
    export interface Dictionary {
        [index: string]: any;
        hasOwnPropety(value: string): boolean;
    }

    export interface Callback {
        (): void;
    }

    export interface ResultCallback {
        (result: any): void;
    }

}
