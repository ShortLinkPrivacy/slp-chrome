/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="interfaces.ts" />

class PrefsStore extends LocalStorage {

    label: string;
    data: Interfaces.Preferences;

    constructor(config: Config) {
        super(config.prefsStore.local.store);
        this.label = config.prefsStore.local.label;
    }

    load(callback: Interfaces.Callback) {
        this._get_single(this.label, (result) => {
            this.data = result || {};
            callback();
        })
    }

    // Save all changes back to store
    save(): void {
        this._set_single(this.label, this.data, ()=>{});
    }

}

