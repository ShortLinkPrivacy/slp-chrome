/// <reference path="modules/config.ts" />
/// <reference path="modules/keys.ts" />
/// <reference path="modules/store/LocalStore.ts" />
/// <reference path="modules/settings/LocalStore.ts" />
/// <reference path="typings/openpgp.d.ts" />
/// <reference path="typings/rivets.d.ts" />

var config = new Config();
var storage = new Store.LocalStore(config);
var settings = new Settings.LocalStore(config);

var app: App = null;

interface Article {
    // The name of the template
    filename: string;

    onBind?(): void;
}

/***************************************************************
 * @KeyGenerate
 * Allows the user to generate a pair of keys using a simple web
 * form.
 ***************************************************************/
class KeyGenerate implements Article {

    filename = "key/generate.html";
    error: string = null;
    spinner: boolean = false;

    name: string;
    email: string;
    passphrase: string;
    confirm: string;
    numBits: number = config.defaultBits;

    submit(e: Event): void {
        e.preventDefault();

        if (this.passphrase != this.confirm) {
            this.error = "The passphrase and the passphrase confirmation do not match";
            return;
        }

        this.spinner = true;

        var options = {
            numBits: config.defaultBits,
            userId: this.name + " " + this.email,
            passphrase: this.passphrase
        };

        openpgp.generateKeyPair(options)
           .then((generated)=>{
                var key = new Keys.PrivateKey(generated.privateKeyArmored);
                settings.storePrivateKey(key, ()=>{
                    this.spinner = false;
                    app.switcher.to('keyView');
                })
           }).catch((error)=>{
               this.spinner = false;
               this.error = "Can not create a new key - " + error;
           })
    }

}


/***************************************************************
 * @KeyImport
 * Allows the user to import an already created private key
 ***************************************************************/

class KeyImport implements Article {

    filename = "key/import.html";
    error: string;
    key: string;

    submit(e: Event): void {
        e.preventDefault();
        var key: Keys.PrivateKey;

        try {
            key = new Keys.PrivateKey(this.key);
        } catch (err) {
            this.error = err;
            return;
        }

        settings.storePrivateKey(key, ()=>{
            app.switcher.to('keyView');
        });

    }
}


/***************************************************************
 * @KeyView
 * Display the private key armored text and other info
 ***************************************************************/

class KeyView implements Article {
    filename = "key/view.html";
    key: Keys.PrivateKey;
    private publicKey: Keys.PublicKey;

    onBind(): void {
        if (app.key) {
            this.key = app.key;
            return;
        }
        app.readKey((key) => {
            this.key = key;
            this.publicKey = key.toPublic();
        })
    }
}

/***************************************************************
 * @KeyRemove
 * Remove the private key
 ***************************************************************/

class KeyRemove implements Article {
    filename = "key/remove.html";

    doRemove(): void {
        settings.removePrivateKey(() => {
            app.key = null;
            app.switcher.to('keyView');
        });
    }
}

/***************************************************************
 * @PublicImport
 * Import a public key
 ***************************************************************/

class PublicImport implements Article {
    filename = "public/import.html";
    error: string;
    key: string;

    submit(e: Event): void {
        e.preventDefault();

        var publicKey: Keys.PublicKey = null;
        try {
            publicKey = new Keys.PublicKey(this.key);
        } catch (err) {
            this.error = err;
            return;
        }

        try {
            storage.storePublicKey(publicKey, () => {
                console.log("Added: ", publicKey);
            });
        } catch ( err ) {
            this.error = err;
        }
    }
}

class App {
    element: JQuery;
    key: Keys.PrivateKey;

    private path: string = "templates";

    private articles: { [name: string]: Article } = {
        keyGenerate:  new KeyGenerate(),
        keyImport:    new KeyImport(),
        keyView:      new KeyView(),
        keyRemove:    new KeyRemove(),
        publicImport: new PublicImport()
    };

    private current: string;
    private binding: Rivets.View = null;
    private element: JQuery = $('article');

    constructor() {
        this.element = $('body');
        this.switcher.to('keyView');
    }

    readKey(callback: Settings.PrivateKeyCallback) {
        settings.loadPrivateKey((key) => {
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
        this.current = name;
        article = this.articles[name];

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
