/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyView implements Article {

        app: App;
        filename = "key/view.html";
        articleId = "privateKeyView";

        key: Keys.PrivateKey;
        publicKey: Keys.PublicKey;

        onBind(): void {
            if (this.app.key) {
                this.key = this.app.key;
                return;
            }
            this.app.readKey((key) => {
                this.key = key;
                this.publicKey = key.toPublic();
            });
        }
    }
    app.registerArticle( new PrivateKeyView() );
}
