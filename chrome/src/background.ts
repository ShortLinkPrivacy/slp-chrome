/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules.d.ts" />

var config = new Config(),
    privateKeyStore = new PrivateKeyStore.LocalStore(config),
    messageStore = new MessageStore.RemoteService(config.messageStore.localHost),

// Private key
var privateKey: Key.PrivateKey,
    privateKeyArmored: string,
    privateKeyPassword: string;

//############################################################################

var dispatcher = {
    getPrivateKey: getPrivateKey,
    getPassword: getPassword,
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

function getPrivateKey(request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback): void {
    sendResponse({ success: true, value: privateKeyArmored });
}

function getPassword(request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback): void {
    sendResponse({ success: true, value: privateKeyPassword });
}

function decryptLink(request: any, sender: chrome.runtime.MessageSender, sendResponse: ResultCallback): void {
    var url: string = request.url,
        match = messageStore.regexp.exec(url),
        messageId: string;

    if (!match) {
        sendResponse({ success: false, error: 'match' });
        return;
    }

    messageId = match[1];

    messageStore.load( messageId, (result) => {
        if ( !result.success ) {
           sendResponse({ success: false, error: 'decode', id: messageId });
           return;
        }

        var armorType = getArmorType(result.armor);
        if ( armorType == ArmorType.Signed || armorType == ArmorType.Message ) { // TODO, other types
            var message = openpgp.message.readArmored(result.armor);

            openpgp.decryptMessage( privateKey.key, message )
               .then((plainText) => {
                   codedText = codedText.replace(messageStore.regexp, plainText)
                   decodeText(codedText, callback);
               })
               .catch((error) => {
                   codedText = codedText.replace(messageStore.regexp, "[PGP MESSAGE:" + messageId + "]"); // TODO: add link
                   decodeText(codedText, callback);
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


privateKeyStore.getArmored((value) => {
    if ( value ) {
        privateKeyPassword = "Password-123"; // TODO
        privateKeyArmored = value;
    } else {
        // TODO: nag about adding a public key
    }
});
