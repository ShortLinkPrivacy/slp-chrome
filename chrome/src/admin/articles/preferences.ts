
module Admin {
    export class Preferences implements Application.Article {

        filename = "preferences.html";
        articleId = "preferences";
        allowGA: boolean;

        onBind() {
            this.allowGA = !bg.preferences.noGA;
        }

        toggleGA(e: Event) {
            bg.preferences.noGA = !(<HTMLInputElement>e.target).checked;
            bg.preferences.save();
        }

    }
}
