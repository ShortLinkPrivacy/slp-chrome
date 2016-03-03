
module Admin {
    export class PrivateKeyRemove implements Application.Article {

        filename = "remove.html";
        articleId = "privateKeyRemove";

        doRemove(): void {
            var view: PrivateKeyView = <PrivateKeyView>app.articles["privateKeyView"];
            bg.store.privateKey.remove(() => {
                bg.privateKey = null;
                bg.lockDown();
                bg.preferences.setupNagCount = 0;
                bg.preferences.save();
                view.hasPrivateKey = false;
                bg._ga('admin', 'Remove private key');
                window.location.hash = '#/key/view';
            });
        }
    }
}
