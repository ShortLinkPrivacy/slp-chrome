
module Admin {
    export class PrivateKeyRemove implements Application.Article {

        filename = "remove.html";
        articleId = "privateKeyRemove";

        doRemove(): void {
            var view: PrivateKeyView = <PrivateKeyView>app.articles["privateKeyView"];
            bg.store.privateKey.remove(() => {
                bg.lockDown(true);

                // Clear prefs
                bg.preferences.setupNagCount = 0;
                bg.preferences.publicKeyUrl = null;
                bg.preferences.save();

                view.hasPrivateKey = false;

                // Notify
                app.notify.sticky = true;
                app.notify.info = chrome.i18n.getMessage('removeKeySuccess');

                bg._ga('admin', 'PrivateKeyRemove');
                window.location.hash = '#/key/view';
            });
        }
    }
}
