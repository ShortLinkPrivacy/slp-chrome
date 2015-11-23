/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyView implements Article {

        filename = "key/view.html";
        articleId = "privateKeyView";

        key: Keys.PrivateKey;
        publicKey: Keys.PublicKey;

        onBind(): void {
            if (app.key) {
                this.key = app.key;
                return;
            }
            app.readKey((key) => {
                this.key = key;
                if ( key ) {
                    this.publicKey = key.toPublic();
                }
            });
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
