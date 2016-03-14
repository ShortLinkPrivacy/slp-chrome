
module KeySource {

    // Defines how we interface with remote key stores, like Keybase etc.
    export interface RemoteStore {
        search(what: string, callback: Interfaces.ResultCallback<Keys.PublicKeyArray>): void;
    }

}
