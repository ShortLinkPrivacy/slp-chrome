
module PrefsStore {

    export class LocalStore implements Interface {
        store: chrome.store.StorageArea;
        label: string;
        data: PrefsData;

        constructor(config: any, callback: Interface.Callback) {
            this.store = config.prefsStore.localStore.store;
            this.label = config.prefsStore.localStore.prefsLabel;
            this.store.get(this.label, (result) => {
                this.data = result[this.label];
                callback();
            })
        }

        private set(name: string, value: any, callback?: Interface.Callback): void {
            var setter: Interfaces.Dictionary = {};
            this.data[name] = value;
            setter[this.label] = this.data;
            this.store.set(setter, callback);
        }

        pubKeyUrl(value?: string, callback?: Interfaces.Callback): string {
            if ( typeof value != "undefined" ) {
                this.set('pubKeyUrl', value, callback)
            }
            return this.data.pubKeyUrl;
        }

    }
}
