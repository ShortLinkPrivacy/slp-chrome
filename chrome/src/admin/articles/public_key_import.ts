/// <reference path="../main.ts" />

module Admin {
    class PublicKeyImport implements Article {

        filename = "public/import.html";
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
                app.storage.storePublicKey(publicKey, () => {
                    app.log("Added: ", publicKey);
                    app.notify.info = "Key for " + publicKey.getPrimaryUser() + " added successfully";
                    this.key = "";
                });
            } catch ( err ) {
                app.notify.error = err;
            }
        }
    }
    app.registerArticle( new PublicKeyImport() );
}
