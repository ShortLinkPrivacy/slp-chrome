
module Admin {
    export class PrivateKeyView implements Application.Article {

        filename = "view.html";
        articleId = "privateKeyView";

        hasPrivateKey: boolean;
        showPublic: boolean;
        showAdvanced: boolean;

        onBind() {
            this.hasPrivateKey = bg.privateKey ? true : false;

            // Must flip this twice, because it causes 'armored()' to
            // re-evaluate in the template. In the rare case of when a key is
            // deleted, then reimported, the advanced view would show blank.
            this.showPublic = false;
            this.showPublic = true;

            this.showAdvanced = false;
        }

        toggleTypeKey(e: Event) {
            e.preventDefault();
            this.showPublic = !this.showPublic;
        }

        toggleTypeText(): string {
            return this.showPublic ? 'show secret key' : 'show public key';
        }

        toggleShowKey(e: Event) {
            e.preventDefault();
            bg._ga('admin', 'PrivateKeyView: advanced');
            this.showAdvanced = !this.showAdvanced;
        }

        armored(): Keys.Armor {
            if ( !this.hasPrivateKey ) return;
            return this.showPublic
                ? bg.privateKey.toPublic().armored()
                : bg.privateKey.armored()
        }
    }
}
