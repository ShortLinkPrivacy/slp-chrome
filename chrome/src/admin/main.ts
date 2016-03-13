/// <reference path="../modules.d.ts" />
/// <reference path="../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../../typings/rivets/rivets.d.ts" />
/// <reference path="../../typings/pathjs/pathjs.d.ts" />

declare var Clipboard: any;

module Admin {

    // Are we running the code in unit tests
    var in_testing = typeof window["mocha"] != "undefined";

    export var app: App;
    export var bg: Interfaces.BackgroundPage = <Interfaces.BackgroundPage>chrome.extension.getBackgroundPage();

    class Notify {
        error: string;
        info: string;

        constructor() {
            this.clear = this.clear.bind(this);
        }

        clear(): void {
            this.error = this.info = null;
        }
    }

    export class App extends Application.Main {
        notify: Notify = new Notify();
        critical: boolean = false;

        constructor(args: Application.AppConfig) {
            super(args);

            this.registerArticle( new PrivateKeyGenerate() );
            this.registerArticle( new PrivateKeyImport() );
            this.registerArticle( new PrivateKeyRemove() );
            this.registerArticle( new PrivateKeyView() );
            this.registerArticle( new PublicKeyImport() );
            this.registerArticle( new PublicKeyList() );
            this.registerArticle( new Preferences() );

            this.initRouter();
        }

        key(): Keys.PrivateKey {
            return bg.privateKey;
        }

        private initRouter() {
            Path.map("#/key/generate").to(() => {
                this.loadArticle('privateKeyGenerate');
            });

            Path.map("#/key/import").to(() => {
                this.loadArticle('privateKeyImport');
            });

            Path.map("#/key/view").to(() => {
                this.loadArticle('privateKeyView');
            });

            Path.map("#/key/remove").to(() => {
                this.loadArticle('privateKeyRemove');
            });

            Path.map("#/pub/import").to(() => {
                this.loadArticle('publicKeyImport');
            });

            Path.map("#/pub/list").to(() => {
                this.loadArticle('publicKeyList');
            });

            Path.map("#/prefs").to(() => {
                this.loadArticle('preferences');
            });
        }

        loadArticle(articleId: string, onBindArgs?: any): void {
            this.notify.clear();
            super.loadArticle(articleId, onBindArgs);
        }

        log(...args): void {
            console.log(args);
        }

        // This goes to window.onload or jquery
        run(): void {

            // Do not run the app if in unit tests
            if ( in_testing ) return;

            // Rivets
            rivets.configure({
                handler: function(target, event, binding) {
                    this.call(app.currentArticle, event, binding.view.models)
                }
            });
            rivets.bind(document.body, this);

            // Clipboard
            //new Clipboard('.copy');

            // App
            Path.listen();
            if ( !window.location.hash ) {
                window.location.hash = "#/key/view";
            }
        }
    }

    window.onerror = function(e) {
        app.critical = true;
        bg.console.log(e);
        bg._ga('admin_critical', e);
    };

    window.onload = function() {
        app = window["app"] = new App({
            path: "src/templates/admin"
        });

        app.run();
        bg._ga('admin', 'run');
    }
}

