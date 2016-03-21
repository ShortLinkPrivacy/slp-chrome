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

function _err(e: string|Interfaces.Success<any>): Interfaces.Success<any> {
    if ( typeof e == "string" ) {
        _ga('error', <string>e);
        return {
            success: false,
            error: <string>e
        }
    } else {
        _ga('error', (<Interfaces.Success<any>>e).error);
        return <Interfaces.Success<any>>e;
    }
}

function isOSX(): boolean {
    return window.navigator.platform.match(/mac/i) != null;
}

//############################################################################

// Creates a HTML snippet with a button to replace a public key armored message
function makePublicKeyText(key: Keys.PublicKey, callback: Interfaces.ResultCallback<string>): void {
    var username = key.getPrimaryUser(),
        classList: Array<string>,
        html: string;

    classList = [config.pgpPK];

    store.addressBook.loadSingle(key.fingerprint(), (found) => {
        if ( found ) classList.push(config.pgpPKAdded);
        html = "<span class='" + classList.join(' ') + "'>" + username + "</span>";
        callback(html);
    });
}

function encryptMessage(msg: Messages.ClearType, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback<Messages.UrlType>): void {
    // Add own key to the key list
    keyList.push(privateKey.toPublic().openpgpKey());

    Messages.encrypt(msg, keyList, (result) => {
        if ( result.success ) {
            var armor = result.value;
            slp.saveMessage(armor, (result) => {
                if ( result.success ) {
                    var umsg = <Messages.UrlType>armor;
                    umsg.body = MagicURL.messageUrl(result.value.id);
                    callback({ success: true, value: umsg });
                } else {
                    callback(_err(result));
                }
            });
        } else {
            callback(_err(result))
        }
    })
}

// Encrypt own public key and create a crypted url
function encryptPublicKey(callback: Interfaces.SuccessCallback<Messages.UrlType>): void {
    var keyRecord: Keys.Record,
        url: Messages.Url;

    // If the url is already in the prefs, then use it DISABLED
    /*
    if ( url = bg.preferences.publicKeyUrl ) {
        callback({ success: true, value: url });
        return;
    }
    */

    keyRecord = {
        body: privateKey.toPublic()
    };

    slp.saveKey(keyRecord, (result) => {
        if ( result.success == true ) {

            // Get the url of the public key and store it in the prefs
            url = MagicURL.keyUrl(result.value.id);
            preferences.publicKeyUrl = url;
            preferences.save();

            // Then return success
            callback({ success: true, value: { body: url } });
        } else {

            // Return error
            callback(_err(result))
        }
    });
}

// Broadcasts a message to all tabs
function broadcast(message: Interfaces.ContentMessage<any>, callback?: Interfaces.Callback): void {
    var i: number;
    chrome.tabs.query({}, (tabs) => {
        for (i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, message);
        }
        if ( callback ) callback();
    });
}

function lockDown(): void {
    broadcast({action: 'lock'});
}

// Unlocks the private key and sends a 'traverse' broadcast.
// Returns true if the key was successfuly unlocked.
function unlockKey(password: string): boolean {
    if ( privateKey.decrypt(password) ) {
        broadcast({ action: 'windowMessage', value: 'slp_key_unlocked' });
        broadcast({ action: 'traverse' });
        //chrome.browserAction.setBadgeText({text: ""});
        return true;
    }

    return false;
}

//############################################################################

class Message {
    private request: {
        fullPath?: string,
        lastMessage?: Interfaces.LastMessage;
        text?: string;
        frameId?: string;
        elementId?: string;
        properties?: any;
    };
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

        result.hasPrivateKey = privateKey ? true : false;
        result.isDecrypted = privateKey ? privateKey.isDecrypted() : false;
        result.config = config;

        this.sendResponse({ success: true, value: result });
    }

    decryptLink(): void {
        var fullPath: string,
            url: MagicURL;

        if ( !(fullPath = this.request.fullPath) ) {
            this.sendResponse(_err('Wrong link ID'));
            return;
        }

        url = new MagicURL(MagicURL.domain + "/" + fullPath);
        if ( url.isMessage() == true ) {
            slp.loadMessage(url.id, (result) => {
                if ( result.success ) {
                    Messages.decrypt( result.value, privateKey, this.sendResponse );
                } else {
                    this.sendResponse(result);
                }
            });
        } else if ( url.isKey() == true ) {
            slp.loadKey(url.id, (result) => {
                if ( result.success ) {
                    makePublicKeyText(result.value, (html) => {
                        this.sendResponse({ success: true, value: { body: html } });
                    });
                } else {
                    this.sendResponse(result);
                }
            })
        } else {
            this.sendResponse(_err("Invalid link"));
        }
    }

    needPassword(): void {
        //chrome.browserAction.setBadgeText({text: '*'});
    }

    // Called by the content script when the user clicks a button with public
    // key url in it The request contains the messageId of the message url
    // containing the armored text of the public key
    addPublicKey(): void {
        var fullPath: string = this.request.fullPath,
            armored: Messages.ArmorType,
            url: MagicURL;

        url = new MagicURL(MagicURL.domain + "/" + fullPath);
        if ( !url.isKey() ) {
            this.sendResponse(_err("Invalid link"));
            return;
        }

        slp.loadKey( url.id, (result) => {
            if ( !result.success ) {
                this.sendResponse(_err(result));
                return;
            }

            store.addressBook.save(result.value, () => {
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

        if ( lastMessage && lastMessage.fingerprints && lastMessage.fingerprints.length ) {
            store.addressBook.load(lastMessage.fingerprints, (foundKeys) => {
                keyList = foundKeys.map( k => { return k.openpgpKey() });

                // The new message is like the old message, but using the new text
                clearMessage = <Messages.ClearType>lastMessage;
                clearMessage.body = text;

                encryptMessage(clearMessage, keyList, this.sendResponse);
            });
        } else {
            this.sendResponse({ success: false, error: "No previous message in this editable" })
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

contextMenuId = chrome.contextMenus.create({
    title: chrome.i18n.getMessage("contextMenu", isOSX() ? "Command+Option+L" : "Ctrl+Shift+L"),
    contexts: ["editable"],
    enabled: false,
    onclick: (info, tab) => {
        var eloc = elementLocatorDict[tab.id];
        if (!eloc) return;
        chrome.tabs.sendMessage(tab.id, {
            action: 'encryptLast',
            elementLocator: eloc
        });
    }
});

//############################################################################
// Google Analytics
//----------------------------------------------------------------------------
declare function ga(a?, b?, c?, d?);
var _ga = function(category: string, action: string): void {};
function googleAnalytics() {
    (function(i?,s?,o?,g?,r?,a?,m?){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=(new Date()).getTime();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', config.googleAnalyticsId, 'auto');
    ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
    ga('require', 'displayfeatures');
    ga('send', 'pageview', '/background.html');
}

//############################################################################

// Main
preferences = new Preferences(function(){

    // Google Analytics
    if ( config.allowCollectData && preferences.allowCollectData ) {
        googleAnalytics();
        _ga = function(category: string, action: string): void {
            // In case the user turns this off in the Preferences tab ...
            if ( preferences.allowCollectData ) {
                ga('send', 'event', category, action);
            }
        };
    }

    slp = new API.ShortLinkPrivacy();

    store = {
        privateKey: new PrivateKeyStore.Local(),
        addressBook: new AddressBookStore.IndexedDB()
    }

    store.privateKey.get((pk) => {
        if ( pk ) {
            privateKey = pk;
            _ga('background', 'private key loaded');
        } else if (preferences.setupNagCount < config.maxSetupNag) {
            _ga('background', 'no private key');
            preferences.setupNagCount++;
            preferences.save();
            chrome.runtime.openOptionsPage();
        }
    });
});
