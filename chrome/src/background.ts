/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var config = new Config(),
    privateKeyStore: PrivateKeyStore.Interface = new PrivateKeyStore.LocalStore(config),
    messageStore: MessageStore.Interface = new MessageStore.RemoteService(config.messageStore.localHost),
    keyStore: KeyStore.Interface = new KeyStore.LocalStore(config);

// Private key
var privateKey: Keys.PrivateKey;

// Active elements for each tab
var elementLocatorDict: Interfaces.ElementLocatorDict = {};

//############################################################################

enum ArmorType { None, MultipartSection, MultipartLast, Signed, Message, PublicKey, PrivateKey };

function getArmorType(text: string): ArmorType {
  var reHeader = /^-----BEGIN PGP (MESSAGE, PART \d+\/\d+|MESSAGE, PART \d+|SIGNED MESSAGE|MESSAGE|PUBLIC KEY BLOCK|PRIVATE KEY BLOCK|SIGNATURE)-----/;

  var header = text.match(reHeader);

  if (!header) {
      return ArmorType.None;
  }

  // BEGIN PGP MESSAGE, PART X/Y
  // Used for multi-part messages, where the armor is split amongst Y
  // parts, and this is the Xth part out of Y.
  if (header[1].match(/MESSAGE, PART \d+\/\d+/)) {
    return ArmorType.MultipartSection;
  } else
  // BEGIN PGP MESSAGE, PART X
  // Used for multi-part messages, where this is the Xth part of an
  // unspecified number of parts. Requires the MESSAGE-ID Armor
  // Header to be used.
  if (header[1].match(/MESSAGE, PART \d+/)) {
    return ArmorType.MultipartLast;

  } else
  // BEGIN PGP SIGNATURE
  // Used for detached signatures, OpenPGP/MIME signatures, and
  // cleartext signatures. Note that PGP 2.x uses BEGIN PGP MESSAGE
  // for detached signatures.
  if (header[1].match(/SIGNED MESSAGE/)) {
    return ArmorType.Signed;

  } else
  // BEGIN PGP MESSAGE
  // Used for signed, encrypted, or compressed files.
  if (header[1].match(/MESSAGE/)) {
    return ArmorType.Message;

  } else
  // BEGIN PGP PUBLIC KEY BLOCK
  // Used for armoring public keys.
  if (header[1].match(/PUBLIC KEY BLOCK/)) {
    return ArmorType.PublicKey;

  } else
  // BEGIN PGP PRIVATE KEY BLOCK
  // Used for armoring private keys.
  if (header[1].match(/PRIVATE KEY BLOCK/)) {
    return ArmorType.PrivateKey;
  }

  return ArmorType.None;
}

//############################################################################

// Creates a HTML snippet with a button to replace a public key armored message
function makePublicKeyText(armor: string, messageId: string, callback: Interfaces.ResultCallback): void {
    var key = new Keys.PublicKey(armor),
        username = key.getPrimaryUser(),
        classList: Array<string>,
        icon: string,
        html: string;

    //icon = '<img src="' + chrome.runtime.getURL('/images/pubkey.png') + '">';
    classList = [config.pgpPK];

    keyStore.searchPublicKey(username, (keys) => {
        if ( keys.length ) classList.push(config.pgpPKAdded);
        html = "<span class='" + classList.join(' ') + "' rel='" + messageId + "'>" + username + "</span>";
        callback(html);
    });
}

function encryptMessage(text: string, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback): void {
    openpgp.encryptMessage( keyList, text )
        .then((armoredText) => {
            messageStore.save(armoredText, (result) => {
                if ( result.success ) {
                    callback({ success: true, value: messageStore.getURL(result.id) });
                } else {
                    callback({ success: false, error: result.error });
                }
            });
        })["catch"]((err) => {
            callback({ success: false, error: "OpenPGP Error: " + err });
        });
}

//############################################################################

class Message {
    private request: any;
    private sender: chrome.runtime.MessageSender;
    private sendResponse: Interfaces.SuccessCallback;

    constructor(request: any, sender: chrome.runtime.MessageSender, sendResponse: Interfaces.SuccessCallback) {
        this.request = request;
        this.sender = sender;
        this.sendResponse = sendResponse;
    }

    // Initialize variables, settings etc.
    initVars(): void {
        var result: Interfaces.InitVars = {};

        result.linkRe = messageStore.getReStr();
        result.hasPrivateKey = privateKey ? true : false;
        result.isDecrypted = privateKey ? privateKey.isDecrypted() : false;
        result.config = config;

        this.sendResponse({ success: true, value: result });
    }

    decryptLink(): void {
        var re: RegExp, match: Array<string>, messageId: string;

        re  = new RegExp(messageStore.getReStr());
        match = re.exec(this.request.url)

        if (!match) {
            this.sendResponse({ success: false, error: 'match' });
            return;
        }

        messageId = match[1];

        messageStore.load( messageId, (result) => {
            if ( !result.success ) {
               this.sendResponse({ success: false, error: 'decode', value: messageId });
               return;
            }

            var armorType = getArmorType(result.armor);
            if ( armorType == ArmorType.Signed || armorType == ArmorType.Message ) {
                var message = openpgp.message.readArmored(result.armor);

                openpgp.decryptMessage( privateKey.key, message )
                   .then((plainText) => {
                       this.sendResponse({ success: true, value: plainText });
                   })["catch"]((error) => {
                       this.sendResponse({ success: false, error: 'decode', value: messageId });
                   });
            } else if ( armorType == ArmorType.PublicKey ) {
                makePublicKeyText(result.armor, messageId, (html) => {
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
            messageId: string = this.request.messageId;

        messageStore.load( messageId, (result) => {
            if ( !result.success ) {
               this.sendResponse({ success: false, error: 'decode', value: messageId });
               return;
            }

            try {
                key = new Keys.PublicKey(result.armor);
            } catch (err) {
                this.sendResponse({ success: false, error: err });
                return;
            }

            keyStore.storePublicKey(key, () => {
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
    encryptLastKeysUsed(): void {
        var lastKeysUsed: Array<string> = this.request.lastKeysUsed,
            text: string = this.request.text,
            keyList: Array<openpgp.key.Key> = [];
        
            if ( lastKeysUsed.length ) {
                keyStore.loadPublicKeys(lastKeysUsed, (foundKeys) => {
                    keyList = foundKeys.map( k => { return k.openpgpKey() });
                    keyList.push(privateKey.key.toPublic());
                    encryptMessage(text, keyList, (result) => {
                        this.sendResponse(result);
                    })
                });
            }
    }

}

//############################################################################

chrome.runtime.onMessage.addListener((request, sender, sendResponse: Interfaces.SuccessCallback) => {
    var message = new Message(request, sender, sendResponse);
    message[request.command]();
    return true;
});

chrome.runtime.onInstalled.addListener((reason) => {
    if (!privateKey)
        chrome.runtime.openOptionsPage();
})

//############################################################################

privateKeyStore.get((pk) => {
    if ( pk ) {
        privateKey = pk;
    } else {
        // TODO: nag about adding a public key
    }
});
