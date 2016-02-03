
module PrefsStore {

    interface PrefsData {
        pubKeyUrl: string;
    }

    export interface Interface {
        constructor(config: any, callback: Interfaces.Callback);
        private set(name: string, value: any): void;
        pubKeyUrl(value?: string, callback?: Interfaces.Callback): string;
    }
}
