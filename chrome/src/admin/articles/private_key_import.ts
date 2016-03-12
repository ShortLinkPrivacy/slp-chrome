
module Admin {
    export class PrivateKeyImport implements Application.Article {

        filename = "import.html";
        articleId = "privateKeyImport";
        key: string;

        submit(e: Event): void {
            e.preventDefault();

            try {
                bg.store.privateKey.set(this.key, (pk) => {
                    bg._ga('admin', 'PrivateKeyImport');
                    bg.privateKey = pk;
                    this.key = "";
                    window.location.hash = "#/key/view"
                });
            } catch (err) {
                bg._ga('error', 'PrivateKeyImport: ' + err);
                app.notify.error = err;
            }

        }
    }
}
