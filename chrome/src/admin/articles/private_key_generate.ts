/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyGenerate implements Article {

        app: App;
        filename = "key/generate.html";
        articleId = "privateKeyGenerate";

        error: string = null;
        spinner: boolean = false;
        name: string;
        email: string;
        passphrase: string;
        confirm: string;
        numBits: number = this.app.config.defaultBits;

        submit(e: Event): void {
            e.preventDefault();

            if (this.passphrase != this.confirm) {
                this.error = "The passphrase and the passphrase confirmation do not match";
                return;
            }

            this.spinner = true;

            var options = {
                numBits: this.app.config.defaultBits,
                userId: this.name + " " + this.email,
                passphrase: this.passphrase
            };

            openpgp.generateKeyPair(options)
               .then((generated)=>{
                    var key = new Keys.PrivateKey(generated.privateKeyArmored);
                    this.app.settings.storePrivateKey(key, () => {
                        this.spinner = false;
                        this.app.loadArticle('keyView');
                    })
               }).catch((error)=>{
                   this.spinner = false;
                   this.error = "Can not create a new key - " + error;
               })
        }
    }

    app.registerArticle( new PrivateKeyGenerate() );
}
