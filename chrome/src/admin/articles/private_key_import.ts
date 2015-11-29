/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyImport implements Article {

        filename = "key/import.html";
        articleId = "privateKeyImport";
        key: string;

        submit(e: Event): void {
            e.preventDefault();
            var key: Keys.PrivateKey;

            try {
                app.privateKeyStore.set(key, () => {
                    window.location.hash = "#/key/view"
                });
            } catch (err) {
                app.notify.error = err;
            }

        }
    }

    app.registerArticle( new PrivateKeyImport() );
}
