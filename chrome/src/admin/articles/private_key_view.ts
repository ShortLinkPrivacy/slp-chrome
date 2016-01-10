/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyView implements Application.Article {

        filename = "view.html";
        articleId = "privateKeyView";

        key: Keys.PrivateKey;
        publicKey: Keys.PublicKey;

        onBind() {
            this.key = bg.privateKey;
            if (this.key != null) {
                this.publicKey = this.key.toPublic();
            }
        }

    }
    app.registerArticle( new PrivateKeyView() );
}
