
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
                app.notify.error = chrome.i18n.getMessage("passwordsDoNotMatch");
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
                    bg.store.privateKey.set(key, () => {
                        this.spinner = false;
                        bg._ga('admin', 'generateKeyPair');
                        app.notify.sticky = true;
                        app.notify.info = chrome.i18n.getMessage('generateKeySuccess');
                        window.location.hash = "#/key/view";
                    })
               })["catch"]((error)=>{
                   this.spinner = false;
                   bg._ga('error', 'generateKeyPair: ' + error);
                   app.notify.error = chrome.i18n.getMessage("generateKeyError", error);
               })
        }
    }
}
