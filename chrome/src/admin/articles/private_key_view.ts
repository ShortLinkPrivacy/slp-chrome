/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyView implements Article {

        filename = "key/view.html";
        articleId = "privateKeyView";

        key: Keys.PrivateKey;
        publicKey: Keys.PublicKey;

        onBind(): void {
            this.key = app.key;
        }

        toGenerate() {
            app.loadArticle('privateKeyGenerate');
        }

        toImport() {
            app.loadArticle('privateKeyImport');
        }

    }
    app.registerArticle( new PrivateKeyView() );
}
