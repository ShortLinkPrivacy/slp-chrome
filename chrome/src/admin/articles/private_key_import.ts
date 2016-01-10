
module Admin {
    export class PrivateKeyImport implements Application.Article {

        filename = "import.html";
        articleId = "privateKeyImport";
        key: string;

        submit(e: Event): void {
            e.preventDefault();

            try {
                bg.privateKeyStore.set(this.key, (pk) => {
                    bg.privateKey = pk;
                    this.key = "";
                    window.location.hash = "#/key/view"
                });
            } catch (err) {
                app.notify.error = err;
            }

        }
    }
}
