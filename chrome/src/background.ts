/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var config = new Config(),
    privateKeyStore: PrivateKeyStore.Interface = new PrivateKeyStore.LocalStore(config),
    messageStore: MessageStore.Interface = new MessageStore.RemoteService(config.messageStore.localHost),
    keyStore: KeyStore.Interface = new KeyStore.LocalStore(config);

// Private key
var privateKey: Keys.PrivateKey,
    privateKeyPassword: string;

//############################################################################

interface ResultStruct {
    success: boolean;
    error?: string;
    value?: any;
}

interface ResultCallback {
    (result: ResultStruct): void;
}

interface DispatchCall {
    [method: string]: (request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback) => void;
}

var dispatcher: DispatchCall = {
    init: function(request, sender, sendResponse: ResultCallback) {
        sendResponse({ success: true, value: initVars() });
    },
    decryptLink: decryptLink,
    needPassword: needPassword,
    unlock: unlockPassword,
    lock: lockPassword,
    encryptKey: encryptKey
};

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

function decryptLink(request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback): void {
    var re: RegExp, match: Array<string>, messageId: string;

    re  = new RegExp(messageStore.getReStr());
    match = re.exec(request.url)

    if (!match) {
        sendResponse({ success: false, error: 'match' });
        return;
    }

    messageId = match[1];

    messageStore.load( messageId, (result) => {
        if ( !result.success ) {
           sendResponse({ success: false, error: 'decode', value: messageId });
           return;
        }

        var armorType = getArmorType(result.armor);
        if ( armorType == ArmorType.Signed || armorType == ArmorType.Message ) { // TODO, other types
            var message = openpgp.message.readArmored(result.armor);

            openpgp.decryptMessage( privateKey.key, message )
               .then((plainText) => {
                   sendResponse({ success: true, value: plainText });
               })
               .catch((error) => {
                   sendResponse({ success: false, error: 'decode', value: messageId });
               });
        }
    });
}


function initVars(): Interfaces.InitVars {
    return {
        linkRe: messageStore.getReStr(),
        isDecrypted: privateKey.isDecrypted()
    }
}

function needPassword(request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback): void {
    chrome.browserAction.setBadgeText({text: '*'});
}

function unlockPassword(request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback): void {
    var success: boolean;

    privateKeyPassword = request.password;
    success = privateKey.decrypt(privateKeyPassword); 

    sendResponse({ success: success });
}

function lockPassword(request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback): void {
    var success: boolean;

    privateKeyPassword = null;
    privateKey.lock(); 

    chrome.tabs.query({currentWindow: true}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, { lock: true });
        });
    });

    sendResponse({ success: true });
}

function encryptKey(request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback): void {
    var armoredText: string;

    // TODO: cache this link in the settings
    armoredText = privateKey.toPublic().armored();

    messageStore.save(armoredText, (result) => {
        if ( result.success ) {
            sendResponse({
                success: true,
                value: messageStore.getURL(result.id)
            });
        } else {
            sendResponse({ 
                success: false, 
                error: result.error 
            });
        }
    });
}

//############################################################################

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    var func;
    if ( msg && msg.command && (func = dispatcher[msg.command]) ) {
        func(msg, sender, sendResponse);
    }
    return true;
});

//----------------------------------------------------------------------------

privateKeyStore.get((pk) => {
    if ( pk ) {
        privateKey = pk;
    } else {
        // TODO: nag about adding a public key
    }
});
