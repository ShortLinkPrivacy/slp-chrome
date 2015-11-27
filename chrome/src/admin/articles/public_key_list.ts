/// <reference path="../main.ts" />

module Admin {
    class PublicKeyList implements Article {

        filename = "public/list.html";
        articleId = "publicKeyList";
        filter: string;
        foundKeys: Store.PublicKeyArray = [];

        doFilter(): void {
            if ( this.filter == "" || this.filter == null ) {
                this.foundKeys = [];
                return;
            }

            app.storage.searchPublicKey(this.filter, (keys) => {
                this.foundKeys = keys;
            });
        }

    }
    app.registerArticle( new PublicKeyList() );
}

