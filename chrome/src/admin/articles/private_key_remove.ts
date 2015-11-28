/// <reference path="../main.ts" />

module Admin {
    class PrivateKeyRemove implements Article {

        filename = "key/remove.html";
        articleId = "privateKeyRemove";

        doRemove(): void {
            app.settings.removePrivateKey(() => {
                app.key = null;
                window.location.hash = '#/key/view';
            });
        }
    }
    app.registerArticle( new PrivateKeyRemove() );
}
