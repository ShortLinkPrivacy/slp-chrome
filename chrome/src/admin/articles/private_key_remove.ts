
module Admin {
    export class PrivateKeyRemove implements Application.Article {

        filename = "remove.html";
        articleId = "privateKeyRemove";

        doRemove(): void {
            bg.privateKeyStore.remove(() => {
                bg.privateKey = null;
                window.location.hash = '#/key/view';
            });
        }
    }
}
