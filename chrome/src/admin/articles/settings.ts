
module Admin {
    export class Settings implements Application.Article {

        filename = "settings.html";
        articleId = "settings";
        exported: string;

        doExport() {
            bg.keyStore.exportKeys((keys) => {
                this.exported = JSON.stringify({
                    privateKey: bg.privateKey ? bg.privateKey.armored() : null,
                    addressBook: keys
                });
            })

        }
    }
}
