/// <reference path="../modules/config.ts" />
/// <reference path="../modules/keys.ts" />
/// <reference path="../modules/store/LocalStore.ts" />
/// <reference path="../modules/settings/LocalStore.ts" />
/// <reference path="../typings/openpgp.d.ts" />
/// <reference path="../typings/rivets.d.ts" />
/// <reference path="../../typings/pathjs/pathjs.d.ts" />

module Admin {

    export var app: App;

    export interface Article {
        articleId: string;
        filename: string;
        onBind?(args?: Object): void;
    }

    interface AppInitialize {
        config: Config;
        storage: Store.Interface;
        settings: Settings.Interface;
    }

    export class App {

        path: string = "src/templates";
        articles: { [index: string]: Article } = {};
        binding: Rivets.View = null;
        element: JQuery;
        key: Keys.PrivateKey;
        currentArticle: Article;
        config: Config;
        settings: Settings.Interface;
        storage: Store.Interface;

        constructor(args: AppInitialize) {
            this.config = args.config;
            this.storage = args.storage;
            this.settings = args.settings;
            this.initRouter();
        }

        private initRouter() {
            Path.map("#/key/generate").to(() => {
                this.loadArticle('privateKeyGenerate');
            });

            Path.map("#/key/import").to(() => {
                this.loadArticle('privateKeyImport');
            });

            Path.map("#/key/view").to(() => {
                if ( this.key ) {
                    this.loadArticle('privateKeyView');
                } else {
                    this.loadPage('key/missing.html');
                }
            });

            Path.map("#/key/remove").to(() => {
                this.loadArticle('privateKeyRemove');
            });

            Path.map("#/pub/import").to(() => {
                this.loadArticle('publicKeyImport');
            });
        }

        error(message: string): void {
            this.element.html(message).addClass('warning');
        }

        registerArticle(article: Article) {
            if ( !article.articleId )
                throw "Article articleId is missing";

            if ( !article.filename )
                throw "Article filename is missing";

            if ( this.articles[article.articleId] )
                throw "Article ID " + article.articleId + " is already taken";

            this.articles[article.articleId] = article;
        }

        // Loads a page from the template folder
        loadPage(filename: string, callback?: Interfaces.Callback): void {
            var fullpath: string = this.path + "/" + filename;

            this.element.load(fullpath, (res, status, xhr) => {

                // Error
                if ( status == "error" ) {
                    this.error("Can not load " + fullpath);
                    return;
                }

                if (callback) callback();
            });
        }

        // Loads a page and binds it to a controller
        loadArticle(articleId: string, onBindArgs?: Object): void {
            var article: Article = this.articles[articleId];

            if (article == null) {
                this.error("Article " + articleId + " is not initialized");
                return;
            }

            this.currentArticle = article;

            // Remove previous binding
            if ( this.binding != null ) {
                this.binding.unbind();
            }

            this.loadPage(article.filename, () => {
                this.binding = rivets.bind(this.element, article);
                if ( article.onBind ) article.onBind(onBindArgs);
            });
        }

        // This goes to window.onload or jquery
        run(): void {

            // Rivets
            rivets.configure({
                handler: function(target, event, binding) {
                    this.call(app.currentArticle, event, binding.view.models)
                }
            });
            rivets.bind($('body'), this);

            // App
            this.element = $('article');
            this.settings.loadPrivateKey((key) => {
                this.key = key
                Path.listen();
                window.location.hash = "#/key/view";
            });
        }
    }

    var config = new Config();
    app = window["app"] = new App({
        config: config,
        storage: new Store.LocalStore(config),
        settings: new Settings.LocalStore(config)
    });

}

