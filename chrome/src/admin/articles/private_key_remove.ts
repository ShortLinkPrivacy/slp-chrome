/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyRemove implements Article {

        app: App;
        filename = "key/remove.html";
        articleId = "privateKeyRemove";

        doRemove(): void {
            this.app.settings.removePrivateKey(() => {
                this.app.key = null;
                this.app.loadArticle('privateKeyView');
            });
        }
    }
}
