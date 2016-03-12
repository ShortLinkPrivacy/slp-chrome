
module Admin {
    export class PrivateKeyImport implements Application.Article {

        filename = "import.html";
        articleId = "privateKeyImport";
        key: string;

        submit(e: Event): void {
            e.preventDefault();

            try {
                bg.store.privateKey.set(this.key, (pk) => {
                    bg._ga('admin', 'import private key');
                    bg.privateKey = pk;
                    this.key = "";
                    window.location.hash = "#/key/view"
                });
            } catch (err) {
                bg._ga('error', err);
                app.notify.error = err;
            }

        }
    }
}
