/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyImport implements Article {

        app: App;
        filename = "key/import.html";
        articleId = "privateKeyImport";

        error: string;
        key: string;

        submit(e: Event): void {
            e.preventDefault();
            var key: Keys.PrivateKey;

            try {
                key = new Keys.PrivateKey(this.key);
            } catch (err) {
                this.error = err;
                return;
            }

            this.app.settings.storePrivateKey(key, () => {
                this.app.loadArticle('keyView');
            });

        }
    }

    app.registerArticle( new PrivateKeyImport() );
}
