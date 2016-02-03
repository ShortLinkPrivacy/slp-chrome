
module Admin {
    export class Advanced implements Application.Article {

        filename = "advanced.html";
        articleId = "advanced";
        exported: string;

        doExport() {
            bg.addressBookStore.exportKeys((keys) => {
                this.exported = JSON.stringify({
                    privateKey: bg.privateKey ? bg.privateKey.armored() : null,
                    addressBook: keys
                });
            })

        }
    }
}
