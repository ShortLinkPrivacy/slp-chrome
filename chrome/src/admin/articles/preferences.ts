
module Admin {
    export class Preferences implements Application.Article {

        filename = "preferences.html";
        articleId = "preferences";
        allowCollectData: boolean;

        onBind() {
            this.allowCollectData = bg.preferences.allowCollectData;
        }

        toggleCollectData(e: Event) {
            bg.preferences.allowCollectData = (<HTMLInputElement>e.target).checked;
            bg.preferences.save();
        }

    }
}
