/// <reference path="../main.ts" />

module Admin {
    class PublicKeyList implements Application.Article {

        filename = "pub_list.html";
        articleId = "publicKeyList";
        filter: string;
        foundKeys: KeyStore.PublicKeyArray = [];

        doFilter(): void {
            if ( this.filter == "" || this.filter == null ) {
                this.foundKeys = [];
                return;
            }

            bg.keyStore.searchPublicKey(this.filter, (keys) => {
                this.foundKeys = keys;
            });
        }

    }
    app.registerArticle( new PublicKeyList() );
}

