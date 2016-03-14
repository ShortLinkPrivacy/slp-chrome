
module Admin {
    export class Preferences implements Application.Article {

        filename = "preferences.html";
        articleId = "preferences";
        allowCollectData: boolean;
        enableKeybase: boolean;

        onBind() {
            this.allowCollectData = bg.preferences.allowCollectData;
            this.enableKeybase = bg.preferences.enableKeybase;
        }

        toggle(e: Event): void {
            var prop = (<HTMLElement>e.target).getAttribute('rv-checked');
            bg.preferences[prop] = (<HTMLInputElement>e.target).checked;
        }

    }
}
