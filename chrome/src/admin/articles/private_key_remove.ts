
module Admin {
    export class PrivateKeyRemove implements Application.Article {

        filename = "remove.html";
        articleId = "privateKeyRemove";

        doRemove(): void {
            var view: PrivateKeyView = <PrivateKeyView>app.articles["privateKeyView"];
            bg.store.privateKey.remove(() => {
                bg.privateKey = null;
                bg.lockDown();
                view.hasPrivateKey = false;
                window.location.hash = '#/key/view';
            });
        }
    }
}
