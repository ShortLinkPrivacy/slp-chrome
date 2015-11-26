/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyView implements Article {

        filename = "key/view.html";
        articleId = "privateKeyView";

        key: Keys.PrivateKey;
        publicKey: Keys.PublicKey;

        onBind() {
            this.key = app.key;
            if (this.key != null) {
                this.publicKey = this.key.toPublic();
            }
        }

    }
    app.registerArticle( new PrivateKeyView() );
}
