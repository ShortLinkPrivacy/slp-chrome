/// <reference path="Interfaces.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />

class Config {
    constructor(opts: Interfaces.Dictionary) {
        var result = {

            // Name of private key in sync store
            settings: {
                localStore: {
                    store: chrome.storage.sync,
                    privateKey: 'privateKey'
                }
            },

            // Storage types
            storage: {
                localStore: {
                    store: chrome.storage.local,
                    directory: 'directory',
                    messages: 'messages'
                }
            }
        };

        for (var prop in opts) {
            if (opts.hasOwnPropety(prop)) {
                result[prop] = opts[prop];
            }
        }
    }
}
