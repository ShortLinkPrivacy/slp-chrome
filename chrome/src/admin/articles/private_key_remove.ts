/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyRemove implements Application.Article {

        filename = "remove.html";
        articleId = "privateKeyRemove";

        doRemove(): void {
            bg.privateKeyStore.remove(() => {
                bg.privateKey = null;
                window.location.hash = '#/key/view';
            });
        }
    }
    app.registerArticle( new PrivateKeyRemove() );
}
