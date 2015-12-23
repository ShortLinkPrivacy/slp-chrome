
function getArmorType(text: string): number {
  var reHeader = /^-----BEGIN PGP (MESSAGE, PART \d+\/\d+|MESSAGE, PART \d+|SIGNED MESSAGE|MESSAGE|PUBLIC KEY BLOCK|PRIVATE KEY BLOCK|SIGNATURE)-----$\n/m;

  var header = text.match(reHeader);

  if (!header) {
      return 0;
  }

  // BEGIN PGP MESSAGE, PART X/Y
  // Used for multi-part messages, where the armor is split amongst Y
  // parts, and this is the Xth part out of Y.
  if (header[1].match(/MESSAGE, PART \d+\/\d+/)) {
    return 1;
  } else
  // BEGIN PGP MESSAGE, PART X
  // Used for multi-part messages, where this is the Xth part of an
  // unspecified number of parts. Requires the MESSAGE-ID Armor
  // Header to be used.
  if (header[1].match(/MESSAGE, PART \d+/)) {
    return 2;

  } else
  // BEGIN PGP SIGNATURE
  // Used for detached signatures, OpenPGP/MIME signatures, and
  // cleartext signatures. Note that PGP 2.x uses BEGIN PGP MESSAGE
  // for detached signatures.
  if (header[1].match(/SIGNED MESSAGE/)) {
    return 3;

  } else
  // BEGIN PGP MESSAGE
  // Used for signed, encrypted, or compressed files.
  if (header[1].match(/MESSAGE/)) {
    return 4;

  } else
  // BEGIN PGP PUBLIC KEY BLOCK
  // Used for armoring public keys.
  if (header[1].match(/PUBLIC KEY BLOCK/)) {
    return 5;

  } else
  // BEGIN PGP PRIVATE KEY BLOCK
  // Used for armoring private keys.
  if (header[1].match(/PRIVATE KEY BLOCK/)) {
    return 6;
  }

  return 0;
}
