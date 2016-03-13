
module Admin {
    export class PublicKeyImport implements Application.Article {

        filename = "pub_import.html";
        articleId = "publicKeyImport";
        key: string;

        submit(e: Event): void {
            e.preventDefault();

            var publicKey: Keys.PublicKey = null;
            try {
                publicKey = new Keys.PublicKey(this.key);
            } catch (err) {
                app.notify.error = err;
                return;
            }

            try {
                bg.store.addressBook.save(publicKey, () => {
                    bg._ga('admin', 'PublicKeyImport');
                    app.notify.info = chrome.i18n.getMessage('addPublicKey', publicKey.getPrimaryUser());
                    this.key = "";
                });
            } catch ( err ) {
                app.notify.error = err;
                bg._ga('error', 'PublicKeyImport: ' + err);
            }
        }
    }
}
