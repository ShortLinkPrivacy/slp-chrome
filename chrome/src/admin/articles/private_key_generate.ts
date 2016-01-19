
module Admin {
    export class PrivateKeyGenerate implements Application.Article {

        filename = "generate.html";
        articleId = "privateKeyGenerate";

        spinner: boolean = false;
        name: string;
        email: string;
        passphrase: string;
        confirm: string;
        numBits: number;

        constructor() {
            this.numBits = bg.config.defaultBits;
        }

        submit(e: Event): void {
            e.preventDefault();

            if (this.passphrase != this.confirm) {
                app.notify.error = "The passphrase and the passphrase confirmation do not match";
                return;
            }

            this.spinner = true;

            var options = {
                numBits: bg.config.defaultBits,
                userId: this.name + ' <' + this.email + '>',
                passphrase: this.passphrase
            };

            openpgp.generateKeyPair(options)
               .then((generated)=>{
                    var key = bg.privateKey = new Keys.PrivateKey(generated.privateKeyArmored);
                    bg.privateKeyStore.set(key, () => {
                        this.spinner = false;
                        window.location.hash = "#/key/view";
                    })
               }).catch((error)=>{
                   this.spinner = false;
                   app.notify.error = "Can not create a new key - " + error;
               })
        }
    }
}
