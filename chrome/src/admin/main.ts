/// <reference path="../modules/config.ts" />
/// <reference path="../modules/keys.ts" />
/// <reference path="../modules/store/LocalStore.ts" />
/// <reference path="../modules/settings/LocalStore.ts" />
/// <reference path="../typings/openpgp.d.ts" />
/// <reference path="../typings/rivets.d.ts" />

module Admin {

    interface ArticleConstructor {
        app: App,
        name: string;
        filename: string;
    }

    interface AppConstructor {
        config: Config;
        storage: Store.Interface;
        settings: Settings.Interface;
    }

    class Article {
        
        // Reference to the main application
        private app: App;

        filename: string;
        name: string;

        // Run this after the article has been bound to the element
        onBind(): void {};

        constructor( args: ArticleConstructor ) {
            this.filename = args.filename;
            this.name = args.name;
            this.app = args.app;

            this.register();
        }

        register() {
            this.app.articles[this.name] = this;
        }
    }

    class App {

        path: string = "templates";
        articles: { [intex: string ]: Article } = {};
        binding: Rivets.View = null;
        element: JQuery = $('article');
        key: Keys.PrivateKey;
        currentArticle: Article;
        config: Config;
        settings: Settings.Interface;
        storage: Store.Interface;

        constructor(args: AppConstructor) {
            this.config = args.config;
            this.storage = args.storage;
            this.settings = args.settings;
            this.element = $('body');
            this.loadArticle('keyView');
        }

        readKey(callback: Settings.PrivateKeyCallback) {
            this.settings.loadPrivateKey((key) => {
                if (!key) return callback(null);
                this.key = key;
                callback(key);
            });
        }

        error(message: string): void {
            this.element.html(message).addClass('warning');
        }

        loadArticle(name: string): void {
            var article: Article;
            var fullpath: string;

            if ( this.binding != null ) {
                this.binding.unbind();
            }

            this.currentArticle = article = this.articles[name];

            if (article == null) {
                this.error("Article " + name + " is not initialized");
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
                article.onBind();
            })

        }
    }

    // Bootstrap
    $(() => {
        var app: App;
        var config = new Config();

        app = window["app"] = new App({
            config: config,
            storage: new Store.LocalStore(config),
            settings: new Settings.LocalStore(config)
        });

        rivets.bind(app.element, app);
    })
}

