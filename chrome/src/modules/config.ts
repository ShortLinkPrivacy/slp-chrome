/// <reference path="interfaces.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />

class Config {
    // Default private key bits
    defaultBits = 2048;

    // Settings types
    settings = {
        localStore: {
            store: chrome.storage.sync,
            privateKey: 'privateKey'
        }
    };

    // Storage types
    storage = {
        localStore: {
            store: chrome.storage.local,
            directory: 'directory',
            messages: 'messages'
        }
    };


    // The constructor will take an optional object, whch can be
    // used to feed different values to all of the default
    // properties. This can be useful when writing tests.
    constructor(opts?: Interfaces.Dictionary) {
        if (typeof opts != "undefined") {
            for (var prop in opts) {
                if (opts.hasOwnPropety(prop)) {
                    this[prop] = opts[prop];
                }
            }
        }
    }
}
