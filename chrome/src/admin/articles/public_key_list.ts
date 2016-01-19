
module Admin {

    export class PublicKeyList implements Application.Article {

        filename = "pub_list.html";
        articleId = "publicKeyList";
        filter: string;
        foundKeys: Array<Keys.KeyItem> = [];

        doFilter(): void {
            if ( this.filter == "" || this.filter == null ) {
                this.foundKeys = [];
                return;
            }

            bg.keyStore.searchPublicKey(this.filter, (keys) => {
                this.foundKeys = keys.map((k) => { return new Keys.KeyItem(k) })
            });
        }

    }
}

