/// <reference path="../modules/config.ts" />
/// <reference path="../modules/keys.ts" />
/// <reference path="../modules/store/LocalStore.ts" />
/// <reference path="../modules/settings/LocalStore.ts" />
/// <reference path="../typings/openpgp.d.ts" />
/// <reference path="../typings/rivets.d.ts" />

module Admin {

    export var app: App;

    export interface Article {
        articleId: string;
        filename: string;
        onBind?(): void;
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
        }

        template(e: Event): void {
            e.preventDefault();
            this.loadArticle($(e.target).prop('rel'));
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

        loadArticle(articleId: string): void {
            var article: Article;
            var fullpath: string;

            if ( this.binding != null ) {
                this.binding.unbind();
            }

            this.currentArticle = article = this.articles[articleId];

            if (article == null) {
                this.error("Article " + articleId + " is not initialized");
                return;
            }

            // Get the fullpath of the article
            fullpath = this.path + "/" + article.filename;

            // Load the article into the element
            this.element.load(fullpath, (res, status, xhr)=>{

                // Error
                if ( status == "error" ) {
                    this.error("Can not load " + fullpath);
                    return;
                }

                this.binding = rivets.bind(this.element, article);
                if ( article.onBind ) article.onBind();
            })

        }

        // This goes to window.onload or jquery
        run(): void {
            rivets.configure({
                handler: function(target, event, binding) {
                    this.call(app.currentArticle, event, binding.view.models)
                }
            });
            rivets.bind($('body'), this);
            this.element = $('article');
            this.settings.loadPrivateKey((key) => { 
                this.key = key 
                this.loadArticle('privateKeyView');
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

