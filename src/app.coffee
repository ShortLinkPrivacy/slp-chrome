app     = null
config  = new window.Config()
keyring = new window.Keyring(config)
storage = new window.Storage(config)

##########################################################
# Article
##########################################################
#
class Article
    constructor: ->
        @error = null
        @note = null
        @initialize()

    # Override with the name of the template
    filename: null

    # Runs right after the constructor. Use it to
    # initialize defaults and variables
    initialize: ->

    # Fires when the article is inserted into the page
    # and all events are attached
    # Use it to find elements within the article.
    onBind: ->

class MyKeysList extends Article
    filename: 'mykeys/list.html'

class KeyPairGenerate extends Article
    filename: 'mykeys/generate.html'

    onBind: ->
        @form = (document.getElementsByName 'newKeysForm')[0]

    submit: =>
        return unless @form.checkValidity()

        if @passphrase != @confirm
            @error = "The passphrase and the passphrase confirmation do not match"
            return

        @spinner = on

        options =
            numBits: config.defaultBits
            userId: "#{@name} <#{@email}>"
            passphrase: @passphrase

        openpgp.generateKeyPair(options)
        .then (keypair)=>
            storage.set { key: keypair.key }, =>
                @spinner = off


        .catch (error)=>
            @spinner = off
            @error = "Can not create a new key - #{error}"

        return no


class KeyPairImport extends Article
    filename: 'mykeys/import.html'

    onBind: ->
        @form = (document.getElementsByName 'importKeysForm')[0]

    submit: =>
        return unless @form.checkValidity()

        key = openpgp.key.readArmored(@key)
        if key.err?.length or not key.isPrivate()
            @error = "This does not seem to be a valid private key"
            return

        storage.set { key: key }, =>
            @note = "Your key has been imported"

        return no


class ArticleSwitcher
    constructor: ->
        @path = "templates"
        @articles =
            keyPairGenerate: new KeyPairGenerate()
            keyPairImport: new KeyPairImport()
            myKeysList: new MyKeysList()

        @curent = null
        @binding = null
        @element = $('article')

    error: (message)->
        @element.html(message).addClass('warning')

    to: (name)->
        @binding.unbind() if @binding?
        @current = name
        article = @articles[name]

        # Sanity check - do we have this article?
        if not article?
            @error "Article #{name} not initialized"
            return

        # Get the fullpath of the aricle
        fullpath = "#{@path}/#{article.filename}"

        # Load it into the element
        @element.load fullpath, (res, status, xhr)=>

            # Error
            if status == "error"
                @error "Can not load #{fullpath}"
                return

            @binding = rivets.bind @element, article
            article.onBind()

class App
    constructor: ->
        @switch = new ArticleSwitcher()
        @switch.to 'keyPairImport'

$ ->
    window.app = new App()
