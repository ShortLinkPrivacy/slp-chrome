/// <reference path="interfaces.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />

class Config {
    // Default private key bits
    defaultBits = 2048;

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
        localStore: {
            store: chrome.storage.local,
            directory: 'messages',
        }
    };
}
