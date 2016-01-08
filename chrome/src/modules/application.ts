/// <reference path="../../typings/rivets/rivets.d.ts" />

module Application {

    export interface Article {
        articleId: string;
        filename: string;
        onBind?(args?: any): void;
    }

    export interface ArticleDict {
        [name: string]: Article;
    }

    export interface AppConfig {
        path?: string;
        element?: HTMLElement;
    }

    export class Main {
        path: string;
        element: HTMLElement;
        articles: ArticleDict = {};
        binding: Rivets.View = null;
        currentArticle: Article;

        constructor( config: AppConfig ) {
            this.element = config.element || (document.getElementsByTagName('article'))[0];
            this.path = config.path || "src/templates";
        }

        private xmlGet(url: string, success: Interfaces.ResultCallback): void {
            var r = new XMLHttpRequest();
            r.open('GET', url, true);
            r.onreadystatechange = function() {
                if (r.readyState == 4) {
                    success(r.responseText);
                }
            }
            r.send();
        }

        // Loads a page from the template folder
        private loadPage(filename: string, callback?: Interfaces.Callback): void {
            var fullpath: string = this.path + "/" + filename;

            this.xmlGet(fullpath, (result) => {
                this.element.innerHTML = result;
                if (callback) callback();
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

        // Loads a page and binds it to a controller
        loadArticle(articleId: string, onBindArgs?: any): void {
            var article: Article = this.articles[articleId];

            if (article == null) {
                throw "Article " + articleId + " is not initialized";
            }

            this.currentArticle = article;

            // Remove previous binding
            if ( this.binding != null ) {
                this.binding.unbind();
            }

            this.loadPage(article.filename, () => {
                rivets.configure({
                    handler: function(target, ev, binding) {
                        this.call(article, ev, binding.view.models)
                    }
                });
                this.binding = rivets.bind(this.element, article);
                if ( article.onBind ) article.onBind(onBindArgs);
            });
        }
    }

}
