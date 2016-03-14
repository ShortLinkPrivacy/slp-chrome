
module Admin {

    export class PublicKeyList implements Application.Article {

        filename = "pub_list.html";
        articleId = "publicKeyList";
        filter: string;
        foundKeys: Array<Keys.KeyItem> = [];
        hasFoundKeys: { (): boolean };
        wait: boolean;

        constructor() {
            this.hasFoundKeys = function(): boolean {
                return this.foundKeys.length > 0;
            };
        }

        onBind() {
            bg._ga('admin', 'PublicKeyList');
        }

        doFilter(): void {
            if ( this.filter == "" || this.filter == null ) {
                this.foundKeys = [];
                return;
            }

            this.wait = true;
            bg.store.addressBook.search(this.filter, (keys) => {
                this.foundKeys = keys.map((k) => { return new Keys.KeyItem(k, this.filter) })
                this.wait = false;
            });
        }

        remove(e: Event, model: {index: number}): void {
            e.preventDefault();
            var keyItem = this.foundKeys[model.index];
            bg.store.addressBook.deleteSingle(keyItem.key.fingerprint(), () => {
                this.foundKeys.splice(model.index, 1);
            });
        }

    }
}

