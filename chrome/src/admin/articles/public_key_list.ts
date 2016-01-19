
module Admin {

    export class PublicKeyList implements Application.Article {

        filename = "pub_list.html";
        articleId = "publicKeyList";
        filter: string;
        foundKeys: Array<Keys.KeyItem> = [];
        hasFoundKeys: { (): boolean };

        constructor() {
            this.hasFoundKeys = function(): boolean {
                return this.foundKeys.length > 0;
            };
        }

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

