/// <reference path="modules/config.ts" />
/// <reference path="modules/keys.ts" />
/// <reference path="modules/store/LocalStore.ts" />
/// <reference path="modules/settings/LocalStore.ts" />
/// <reference path="typings/openpgp.d.ts" />

var config = new Config();
var storage = new Store.LocalStore(config);
var settings = new Settings.LocalStore(config);

interface Article {
    // The name of the template
    filename: string;
}

class KeyGenerate implements Article {

    filename: string = "key/generate.html";
    error: string = null;
    spinner: boolean = false;

    name: string;
    email: string;
    passphrase: string;
    confirm: string;
    numBits: number = config.defaultBits;

    submit(e: Event): void {
        e.preventDefault();

        if (this.passphrase != this.confirm) {
            this.error = "The passphrase and the passphrase confirmation do not match";
            return;
        }

        this.spinner = true;

        var options = {
            numBits: config.defaultBits,
            userId: this.name + " " + this.email,
            passphrase: this.passphrase
        };

        openpgp.generateKeyPair(options)
           .then((generated)=>{
                var key = new Keys.PrivateKey(generated.privateKeyArmored);
                settings.storePrivateKey(key, ()=>{
                    this.spinner = false;
                    //app.switch.to('keyView');
                })
           }).catch((error)=>{
               this.spinner = false;
               this.error = "Can not create a new key - " + error;
           })
    }

}
