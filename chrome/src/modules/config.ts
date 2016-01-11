/// <reference path="interfaces.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />

class Config {
    // Default private key bits
    defaultBits = 2048;

    // Milliseconds to wait before decrypting the page nodes.
    // This is to give the page code enough time to render.
    decryptDelay = 1000;

    // Settings types
    privateKeyStore = {
        localStore: {
            store: chrome.storage.sync,
            privateKeyLabel: 'privateKey'
        }
    };

    // Key storage types
    keyStore = {
        localStore: {
            store: chrome.storage.local,
            directory: 'directory',
        }
    };

    // Message storage types
    messageStore = {
        localHost: {
            //url: 'http://mamr.com',
            url: 'http://localhost:5000',
            path: '/x'
        }
    };
}
