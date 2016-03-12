/// <reference path="interfaces.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />

class Config {

    //######################################################
    // OpenPGP
    //######################################################

    // Default private key bits
    defaultBits = 1024;

    //######################################################
    // Class and property names
    //######################################################

    // The class name to add to decrypted nodes. It's used
    // to recognize them during lock.
    pgpClassName = '__pgp';

    // Propery to add to nodes with the original content. On
    // lock this data is restored.
    pgpData = '__pgp_data';

    // Class name to add to public key links. It's CSS is defined in
    // css/content.less
    pgpPK = '__pgp_pk';

    // Class name for public keys that have been added to the
    // address book The css should define this class as disabled.
    pgpPKAdded = '__pgp_pk_added';

    // Attribute we add to the encrypted editable with
    // the contents of the original message, in case
    // the user wants to reverse the encryption.  The
    // name of the flag that we will use in the text
    // area element to signal that it has been
    // encrypted.
    pgpElAttr = '__pgp_crypted';

    // Class name to five text nodes, after they're converted to enchanted
    // elements.
    pgpEnchanted = '__pgp_enchanted';


    //######################################################
    // Background page
    //######################################################

    // How many times to nag about setup before it stops
    maxSetupNag = 3;

    // Central switch for data collection
    allowCollectData = true;

    // Own GA code
    googleAnalyticsId = 'UA-74656221-1';
}
