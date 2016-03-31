module Messages {

    // Regexp for PGP message types
    var reHeader = /^-----BEGIN PGP (MESSAGE, PART \d+\/\d+|MESSAGE, PART \d+|SIGNED MESSAGE|MESSAGE|PUBLIC KEY BLOCK|PRIVATE KEY BLOCK|SIGNATURE)-----/;

    export type Id = string;
    export type Armor = string;
    export type Url = string;

    // Message structure
    export interface Record<T> extends Interfaces.RecordCommon {
        body: T;
        fingerprints?: Keys.FingerprintArray;
    }

    // Clear and Armor message types
    export type ClearType = Record<string>;
    export type ArmorType = Record<Armor>;
    export type UrlType = Record<Armor>;

    export enum ArmorTextType {
        None, MultipartSection, MultipartLast,
        Signed, Message, PublicKey, PrivateKey
    };

    export function isExpired(m: ArmorType): boolean {
        var now = new Date(), createdDate = new Date(m.createdDate);
        return now.getTime() < createdDate.getTime() + m.timeToLive;
    }

    export function getArmorType(m: ArmorType): ArmorTextType {

      var text = m.body;
      var header = text.match(reHeader);

      if (!header) {
          return ArmorTextType.None;
      }

      // BEGIN PGP MESSAGE, PART X/Y
      // Used for multi-part messages, where the armor is split amongst Y
      // parts, and this is the Xth part out of Y.
      if (header[1].match(/MESSAGE, PART \d+\/\d+/)) {
        return ArmorTextType.MultipartSection;
      } else
      // BEGIN PGP MESSAGE, PART X
      // Used for multi-part messages, where this is the Xth part of an
      // unspecified number of parts. Requires the MESSAGE-ID Armor
      // Header to be used.
      if (header[1].match(/MESSAGE, PART \d+/)) {
        return ArmorTextType.MultipartLast;

      } else
      // BEGIN PGP SIGNATURE
      // Used for detached signatures, OpenPGP/MIME signatures, and
      // cleartext signatures. Note that PGP 2.x uses BEGIN PGP MESSAGE
      // for detached signatures.
      if (header[1].match(/SIGNED MESSAGE/)) {
        return ArmorTextType.Signed;

      } else
      // BEGIN PGP MESSAGE
      // Used for signed, encrypted, or compressed files.
      if (header[1].match(/MESSAGE/)) {
        return ArmorTextType.Message;

      } else
      // BEGIN PGP PUBLIC KEY BLOCK
      // Used for armoring public keys.
      if (header[1].match(/PUBLIC KEY BLOCK/)) {
        return ArmorTextType.PublicKey;

      } else
      // BEGIN PGP PRIVATE KEY BLOCK
      // Used for armoring private keys.
      if (header[1].match(/PRIVATE KEY BLOCK/)) {
        return ArmorTextType.PrivateKey;
      }

      return ArmorTextType.None;
    }

    export function isMessage(m: ArmorType): boolean {
        var armorType = getArmorType(m);
        return armorType == ArmorTextType.Signed || armorType == ArmorTextType.Message;
    }

    export function isPublicKey(m: ArmorType): boolean {
        var armorType = getArmorType(m);
        return armorType == ArmorTextType.PublicKey;
    }

    export function isPrivateKey(m: ArmorType): boolean {
        var armorType = getArmorType(m);
        return armorType == ArmorTextType.PrivateKey;
    }

    export function decrypt(m: ArmorType, privateKey: Keys.PrivateKey, callback: Interfaces.SuccessCallback<ClearType> ): void {
        // If we have a fingerprints array, then check if our key is in it
        if ( m.fingerprints && m.fingerprints.length > 0 ) {
            if ( m.fingerprints.indexOf(privateKey.fingerprint()) < 0 ) {
                callback({success: false, error: "Message encrypted for another recipient"});
                return;
            }
        }
        var message = openpgp.message.readArmored(<string>m.body);
        openpgp.decryptMessage( privateKey.key, message )
           .then((clearText: string) => {
               var cmsg = <ClearType>m;
               cmsg.body = clearText;
               callback({ success: true, value: cmsg });
           })["catch"]((error) => {
               callback({ success: false, error: error });
           });
    }

    export function encrypt(m: ClearType, keyList: Array<openpgp.key.Key>, callback: Interfaces.SuccessCallback<ArmorType>): void {
        if ( !keyList || keyList.length == 0 ) {
            callback({ success: false, error: "No public keys selected" });
            return;
        }
        openpgp.encryptMessage( keyList, m.body )
            .then((armoredText) => {
                var armorMsg = <ArmorType>m;
                armorMsg.body = armoredText;
                armorMsg.fingerprints = keyList.map((k) => { return k.primaryKey.getFingerprint() });
                callback({success: true, value: armorMsg});
            })["catch"]((err) => {
                callback({ success: false, error: "OpenPGP Error: " + err });
            });
    }
}
