
module Admin {
    export class PrivateKeyView implements Application.Article {

        filename = "view.html";
        articleId = "privateKeyView";

        hasPrivateKey: boolean;
        showPublic: boolean;
        showAdvanced: boolean = false;

        onBind() {
            this.hasPrivateKey = bg.privateKey ? true : false;
            this.showPublic = true;
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
            this.showAdvanced = !this.showAdvanced;
        }

        armored(): Interfaces.Armor {
            if ( !this.hasPrivateKey ) return;
            return this.showPublic
                ? bg.privateKey.toPublic().armored()
                : bg.privateKey.armored()
        }
    }
}
