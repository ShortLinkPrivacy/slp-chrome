/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="interfaces.ts" />

class Preferences extends LocalStorage {

    // Configuration
    protected static label = 'preferences';
    protected static store = chrome.storage.sync;

    // Preferences
    //---------------------------------------------------------
    publicKeyUrl: string;
    //---------------------------------------------------------

    constructor(callback: Interfaces.Callback) {
        super(Preferences.store);
        this.load(callback);
    }

    load(callback: Interfaces.Callback) {
        this._get_single(Preferences.label, (str: string) => {
            var json;
            try {
                json = JSON.parse(str);
            } catch (e) {
                json = {};
            }
            Object.keys(json).forEach((k) => {
                this[k] = json[k];
            });
            callback();
        })
    }

    // Save all changes back to store
    save(): void {
        this._set_single(Preferences.label, JSON.stringify(this), ()=>{});
    }

}

