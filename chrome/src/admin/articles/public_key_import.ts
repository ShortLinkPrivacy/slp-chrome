/// <reference path="../main.ts" />

module Admin {
    class PublicKeyImport implements Article {

        app: App;
        filename = "public/import.html";
        articleId = "publicKeyImport";

        error: string;
        key: string;

        submit(e: Event): void {
            e.preventDefault();

            var publicKey: Keys.PublicKey = null;
            try {
                publicKey = new Keys.PublicKey(this.key);
            } catch (err) {
                this.error = err;
                return;
            }

            try {
                this.app.storage.storePublicKey(publicKey, () => {
                    console.log("Added: ", publicKey);
                });
            } catch ( err ) {
                this.error = err;
            }
        }
    }
}
