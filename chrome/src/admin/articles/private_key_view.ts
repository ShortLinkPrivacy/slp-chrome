
module Admin {
    export class PrivateKeyView implements Application.Article {

        filename = "view.html";
        articleId = "privateKeyView";

        hasPrivateKey: boolean;
        showingPublic: boolean;

        onBind() {
            this.hasPrivateKey = bg.privateKey ? true : false;
            this.showingPublic = true;
        }

        toggle() {
            this.showingPublic = !this.showingPublic;
        }

        toggleText(): string {
            return this.showingPublic ? 'show secret key' : 'show public key';
        }

        armored(): Interfaces.Armor {
            if ( !this.hasPrivateKey ) return;
            return this.showingPublic
                ? bg.privateKey.toPublic().armored()
                : bg.privateKey.armored()
        }
    }
}
