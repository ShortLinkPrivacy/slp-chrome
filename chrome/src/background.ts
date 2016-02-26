/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

// App Config
var config = new Config();

// Storage
var store: Interfaces.StoreCollection;

// User Preferences
var preferences: Preferences;

// Short link privacy API
var slp: API.ShortLinkPrivacy;

// Private key
var privateKey: Keys.PrivateKey;

// Active elements for each tab
var elementLocatorDict: Interfaces.ElementLocatorDict = {};

// Context menu
var contextMenuId: any;

//############################################################################

// Creates a HTML snippet with a button to replace a public key armored message
function makePublicKeyText(armor: Keys.Armor, messageId: Messages.Id, callback: Interfaces.ResultCallback<string>): void {
    var key = new Keys.PublicKey(armor),
        username = key.getPrimaryUser(),
        classList: Array<string>,
        html: string;

    classList = [config.pgpPK];

    store.addressBook.loadSingle(key.fingerprint(), (found) => {
        if ( found ) classList.push(config.pgpPKAdded);
        html = "<span class='" + classList.join(' ') + "' rel='" + messageId + "'>" + username + "</span>";
        callback(html);
    });
}

function encryptMessage(msg: Messages.ClearType, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback<string>): void {
    openpgp.encryptMessage( keyList, msg.body )
        .then((armoredText) => {
            msg.body = armoredText;
            slp.saveItem(<Messages.ArmorType>msg, (result) => {
                if ( result.success ) {
                    callback({ success: true, value: slp.getItemUrl(result.value.id) });
                } else {
                    callback({ success: false, error: result.error });
                }
            });
        })["catch"]((err) => {
            callback({ success: false, error: "OpenPGP Error: " + err });
        });
}

// Encrypt own public key and create a crypted url
function encryptPublicKey(callback: Interfaces.SuccessCallback<string>): void {
    var armoredMessage: Messages.ArmorType,
        url: string;

    // If the url is already in the prefs, then use it DISABLED
    /*
    if ( url = bg.preferences.publicKeyUrl ) {
        callback({ success: true, value: url });
        return;
    }
    */

    armoredMessage = {
        body: privateKey.toPublic().armored()
    };

    slp.saveItem(armoredMessage, (result) => {
        if ( result.success ) {
            // Get the url of the public key and store it in the prefs
            url = slp.getItemUrl(result.value.id);
            preferences.publicKeyUrl = url;
            preferences.save();

            // Then return success
            callback({ success: true, value: url });
        } else {

            // Return error
            callback({ success: false, error: result.error })
        }
    });
}


function lockDown(callback?: Interfaces.Callback): void {
    var i: number;
    chrome.tabs.query({}, (tabs) => {
        for (i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, { lock: true });
        }
        if ( callback ) callback();
    });
}

//############################################################################

class Message {
    private request: any;
    private sender: chrome.runtime.MessageSender;
    private sendResponse: Interfaces.SuccessCallback<any>;

    constructor(request: any, sender: chrome.runtime.MessageSender, sendResponse: Interfaces.SuccessCallback<any>) {
        this.request = request;
        this.sender = sender;
        this.sendResponse = sendResponse;
    }

    // Initialize variables, settings etc.
    initVars(): void {
        var result: Interfaces.InitVars = {};

        result.linkRe = slp.itemRegExp;
        result.hasPrivateKey = privateKey ? true : false;
        result.isDecrypted = privateKey ? privateKey.isDecrypted() : false;
        result.config = config;

        this.sendResponse({ success: true, value: result });
    }

    decryptLink(): void {
        var re: RegExp,
            messageId: Messages.Id,
            armored: Messages.Armored;

        messageId = this.request.messageId;

        if (!messageId) {
            this.sendResponse({ success: false, error: 'Wrong link ID' });
            return;
        }

        slp.loadItem( messageId, (result) => {
            if ( !result.success ) {
               this.sendResponse({ success: false, error: 'decode', value: messageId });
               return;
            }

            armored = result.value;
            if ( armored.isMessage() == true ) {
                armored.decrypt( privateKey, (r) => this.sendResponse(r) );
            } else if ( armored.isPublicKey() == true ) {
                makePublicKeyText(armored.body(), messageId, (html) => {
                    this.sendResponse({ success: true, value: html });
                });
            }
        });
    }

    needPassword(): void {
        chrome.browserAction.setBadgeText({text: '*'});
    }

    // Called by the content script when the user clicks a button with public
    // key url in it The request contains the messageId of the message url
    // containing the armored text of the public key
    addPublicKey(): void {
        var key: Keys.PublicKey,
            messageId: Messages.Id = this.request.messageId,
            armored: Messages.Armored;

        slp.loadItem( messageId, (result) => {
            if ( !result.success ) {
               this.sendResponse({ success: false, error: 'decode', value: messageId });
               return;
            }

            armored = result.value;
            try {
                key = new Keys.PublicKey(armored.body());
            } catch (err) {
                this.sendResponse({ success: false, error: err });
                return;
            }

            store.addressBook.save(key, () => {
                this.sendResponse({ success: true });
            });
        });
    }

    // Remember the active editable element
    setActiveElement(): void {
        chrome.tabs.query({ active: true }, (tabs) => {
            var tabId = tabs[0].id;
            elementLocatorDict[tabId] = {
                frameId: this.request.frameId,
                elementId: this.request.elementId
            };
        });
    }

    // Encrypt text with a set of fingerprints. Used by content to send a quick
    // encrypt with the last keys command.
    encryptLikeLastMessage(): void {
        var lastMessage: Interfaces.LastMessage,
            text: string,
            keyList: Array<openpgp.key.Key> = [],
            clearMessage: Messages.ClearType;

            lastMessage = this.request.lastMessage;
            text = this.request.text;

            if ( lastMessage.body && lastMessage.body.length ) {
                store.addressBook.load(lastMessage.body, (foundKeys) => {
                    keyList = foundKeys.map( k => { return k.openpgpKey() });
                    keyList.push(privateKey.key.toPublic());

                    // The new message is like the old message, but using the new text
                    clearMessage = { body: text, timeToLive: lastMessage.timeToLive };

                    encryptMessage(clearMessage, keyList, (result) => {
                        this.sendResponse(result);
                    })
                });
            }
    }

    // Send updates to the context menu. Most cases enable and disable it.
    updateContextMenu(): void {
        var properties = this.request.properties;
        chrome.contextMenus.update(contextMenuId, properties);
    }

}

//############################################################################

chrome.runtime.onMessage.addListener((request, sender, sendResponse: Interfaces.SuccessCallback<any>) => {
    var message = new Message(request, sender, sendResponse);
    message[request.command]();
    return true;
});

chrome.runtime.onInstalled.addListener((reason) => {
    store.privateKey.get((pk) => {
        if (!pk) chrome.runtime.openOptionsPage();
    });
});

contextMenuId = chrome.contextMenus.create({
    title: "Encrypt for Last Recepient",
    contexts: ["editable"],
    enabled: false,
    onclick: (info, tab) => {
        var eloc = elementLocatorDict[tab.id];
        if (!eloc) return;
        chrome.tabs.sendMessage(tab.id, {
            encryptLast: true,
            elementLocator: eloc
        });
    }
});

//############################################################################

// Main
preferences = new Preferences(function(){

    slp = new API.ShortLinkPrivacy();

    store = {
        privateKey: new PrivateKeyStore.Local(),
        addressBook: new AddressBookStore.IndexedDB()
    }

    store.privateKey.get((pk) => {
        if ( pk ) {
            privateKey = pk;
        }
    });
});
