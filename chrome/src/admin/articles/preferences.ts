
module Admin {
    export class Preferences implements Application.Article {

        filename = "preferences.html";
        articleId = "preferences";
        allowGoogleAnalytics: boolean;

        onBind() {
            this.allowGoogleAnalytics = bg.preferences.allowGoogleAnalytics;
        }

        toggleGoogleAnalytics(e: Event) {
            bg.preferences.allowGoogleAnalytics = this.allowGoogleAnalytics;
            bg.preferences.save();
        }

    }
}
