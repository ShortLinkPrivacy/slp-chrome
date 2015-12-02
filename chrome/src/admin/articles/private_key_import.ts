/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyImport implements Article {

        filename = "key/import.html";
        articleId = "privateKeyImport";
        key: string;

        submit(e: Event): void {
            e.preventDefault();

            try {
                app.privateKeyStore.set(this.key, () => {
                    window.location.hash = "#/key/view"
                });
            } catch (err) {
                app.notify.error = err;
            }

        }
    }

    app.registerArticle( new PrivateKeyImport() );
}
