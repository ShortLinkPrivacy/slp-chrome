
module Admin {
    export class PrivateKeyView implements Application.Article {

        filename = "view.html";
        articleId = "privateKeyView";

        hasPrivateKey: boolean;
        fingerprint: string;
        userIds: Array<string>;
        armored: string;

        onBind() {
            var pub: Keys.PublicKey;

            this.hasPrivateKey = bg.privateKey ? true : false;
            if ( this.hasPrivateKey == true ) {
                pub = bg.privateKey.toPublic();
                this.fingerprint = pub.fingerprint();
                this.userIds = pub.userIds();
                this.armored = pub.armored();
            }
        }

        copyToClipboard() {
            app.notify.info = "Use your mouse to select the text, then press Ctrl-C (or Command-C if you're using Apple)";
        }
    }
}
