/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var config = new Config(),
    privateKeyStore: PrivateKeyStore.Interface = new PrivateKeyStore.LocalStore(config),
    messageStore: MessageStore.Interface = new MessageStore.RemoteService(config.messageStore.localHost),
    linkRe = new RegExp(messageStore.getRe());

// Private key
var privateKey: Keys.PrivateKey,
    privateKeyPassword: string = "Password-123"; // TODO

//############################################################################

var dispatcher = {
    init: initVars,
    decryptLink: decryptLink
};

interface ResultStruct {
    success: boolean;
    error?: string;
    value?: any;
}

interface ResultCallback {
    (result: ResultStruct): void;
}

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
    var url: string = request.url,
        match = linkRe.exec(url),
        messageId: string;

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

function initVars(request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback): void {
    sendResponse({
        success: true,
        value: {
            linkRe: messageStore.getRe(),
            isDecrypted: privateKey.isDecrypted()
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

privateKeyStore.get((pk) => {
    var i: number,
        privateKeyDecrypted: boolean,
        message: any = {};

    if ( pk ) {
        privateKey = pk;
        privateKey.decrypt(privateKeyPassword); // TODO: what if it doesn't decrypt
    } else {
        // TODO: nag about adding a public key
    }
});
