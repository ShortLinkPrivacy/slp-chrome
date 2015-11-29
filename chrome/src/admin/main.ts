/// <reference path="../modules/config.ts" />
/// <reference path="../modules/keys.ts" />
/// <reference path="../modules/key-store/LocalStore.ts" />
/// <reference path="../modules/privatekey-store/LocalStore.ts" />
/// <reference path="../modules/message-store/LocalStore.ts" />
/// <reference path="../typings/openpgp.d.ts" />
/// <reference path="../typings/rivets.d.ts" />
/// <reference path="../../typings/pathjs/pathjs.d.ts" />

module Admin {

    // Are we running the code in unit tests
    var in_testing = typeof window["mocha"] != "undefined";

    export var app: App;

    export interface Article {
        articleId: string;
        filename: string;
        onBind?(args?: Object): void;
    }

    interface AppInitialize {
        config: Config;
        keyStore: KeyStore.Interface;
        privateKeyStore: PrivateKeyStore.Interface;
        messageStore: MessageStore.Interface;
    }

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

    export class App {

        path: string = "src/templates";
        articles: { [index: string]: Article } = {};
        binding: Rivets.View = null;
        element: JQuery;
        currentArticle: Article;
        config: Config;

        key: Keys.PrivateKey;
        keyStore: KeyStore.Interface;
        privateKeyStore: PrivateKeyStore.Interface;
        messageStore: MessageStore.Interface;

        notify: Notify = new Notify();

        constructor(args: AppInitialize) {
            this.config = args.config;
            this.keyStore = args.keyStore;
            this.privateKeyStore = args.privateKeyStore;
            this.messageStore = args.messageStore;
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

            Path.map("#/pub/list").to(() => {
                this.loadArticle('publicKeyList');
            });
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

            // Clear error and info when pages change
            this.notify.clear();

            this.element.load(fullpath, (res, status, xhr) => {

                // Error
                if ( status == "error" ) {
                    this.notify.error = "Can not load " + fullpath;
                    return;
                }

                if (callback) callback();
            });
        }

        // Loads a page and binds it to a controller
        loadArticle(articleId: string, onBindArgs?: Object): void {
            var article: Article = this.articles[articleId];

            if (article == null) {
                this.notify.error = "Article " + articleId + " is not initialized";
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
            rivets.bind($('body'), this);

            // App
            this.element = $('article');
            this.keyStore.initialize(() => {
                this.privateKeyStore.get((key) => {
                    this.key = key
                    Path.listen();
                    window.location.hash = "#/key/view";
                });
            });
        }
    }

    var config = new Config();
    app = window["app"] = new App({
        config: config,
        keyStore: new KeyStore.LocalStore(config),
        privateKeyStore: new PrivateKeyStore.LocalStore(config),
        messageStore: new MessageStore.LocalStore(config)
    });

}

