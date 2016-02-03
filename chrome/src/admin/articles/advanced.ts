
module Admin {
    export class Advanced implements Application.Article {

        filename = "advanced.html";
        articleId = "advanced";
        exported: string;

        doExport() {
            bg.store.addressBook.exportKeys((keys) => {
                this.exported = JSON.stringify({
                    privateKey: bg.privateKey ? bg.privateKey.armored() : null,
                    addressBook: keys
                });
            })

        }
    }
}
