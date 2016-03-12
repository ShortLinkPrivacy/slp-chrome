/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="interfaces.ts" />

class Preferences extends LocalStorage {

    // Configuration
    static label = 'preferences';
    static store = chrome.storage.sync;

    // Preferences
    //---------------------------------------------------------

    // Cached public key url (not used)
    publicKeyUrl: string;

    // Do not use Google Analytics
    allowCollectData: boolean = true;

    // How many times we've nagged about setup
    setupNagCount: number = 0;

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
                if ( k != 'store' ) this[k] = json[k];
            });
            callback();
        })
    }

    // Save all changes back to store
    save(callback?: Interfaces.ResultCallback<any>): void {
        var setter = {}
        Object.keys(this).forEach((k) => {
            if (this.hasOwnProperty(k)) setter[k] = this[k];
        });
        this._set_single(Preferences.label, JSON.stringify(setter), () => {
            if ( callback ) callback(setter);
        });
    }

}

