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


class KeyPairGenerate extends Article
    filename: 'mykeys/generate.html'

    submit: (e)=>
        e.preventDefault()

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
            storage.set config.keyName, keypair.publicKeyArmored, =>
                @spinner = off
                app.switch.to 'keyPairView'


        .catch (error)=>
            @spinner = off
            @error = "Can not create a new key - #{error}"


class KeyPairImport extends Article
    filename: 'mykeys/import.html'

    submit: (e)=>
        e.preventDefault()

        result = openpgp.key.readArmored(@key)
        if result.err?.length > 0 or result.keys?.length == 0
            @error = "This does not seem to be a valid private key"
            return

        key = result.keys[0]
        if not key.isPrivate()
            @error = "This does not seem to be a valid private key"
            return

        storage.set config.keyName, key.armor(), =>
            app.switch.to 'keyPairView'


class KeyPairView extends Article
    filename: 'mykeys/view.html'

    onBind: =>
        if app.key then return @key = app.key
        app.readKey (key)=>
            @key = key
            @public = key?.toPublic()

    toGenerate: ->
        app.switch.to 'keyPairGenerate'

    toImport: ->
        app.switch.to 'keyPairImport'


class KeyPairRemove extends Article
    filename: 'mykeys/remove.html'

    doRemove: ->
        storage.remove config.keyName
        app.key = null
        app.switch.to 'keyPairView'


class ArticleSwitcher
    constructor: ->
        @path = "templates"
        @articles =
            keyPairGenerate: new KeyPairGenerate()
            keyPairImport: new KeyPairImport()
            keyPairView: new KeyPairView()
            keyPairRemove: new KeyPairRemove()

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
        @element = (document.getElementsByTagName('body'))[0]
        @key = null

        @switch = new ArticleSwitcher()
        @switch.to 'keyPairView'

    template: (e)=>
        e.preventDefault()
        @switch.to e.target.rel

    readKey: (callback)=>
        storage.get config.keyName, (key)=>
            return callback() unless key?

            @key = (openpgp.key.readArmored key).keys[0]
            window.key = @key
            callback @key


window.onload = ->
    app = window.app = new App()
    rivets.bind app.element, app
