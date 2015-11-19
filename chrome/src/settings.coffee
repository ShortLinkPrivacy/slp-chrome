app     = null
config  = new window.Config()

Services = window.Services
Keys = window.Keys

storage = new Services.LocalStore(config)

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


##########################################################
# KeyGenerate
##########################################################
#
class KeyGenerate extends Article
    filename: 'key/generate.html'

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
        .then (result)=>
            console.log result
            storage.storePublicKey result, =>
                @spinner = off
                app.switch.to 'keyView'


        .catch (error)=>
            @spinner = off
            @error = "Can not create a new key - #{error}"


##########################################################
# KeyImport
##########################################################
#
class KeyImport extends Article
    filename: 'key/import.html'

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
            app.switch.to 'keyView'


##########################################################
# KeyView
##########################################################
#
class KeyView extends Article
    filename: 'key/view.html'

    onBind: =>
        if app.key then return @key = app.key
        app.readKey (key)=>
            @key = key
            @public = key?.toPublic()

    toGenerate: ->
        app.switch.to 'keyGenerate'

    toImport: ->
        app.switch.to 'keyImport'


##########################################################
# KeyRemove
##########################################################
#
class KeyRemove extends Article
    filename: 'key/remove.html'

    doRemove: ->
        storage.remove config.keyName
        app.key = null
        app.switch.to 'keyView'


##########################################################
# PublicImport
##########################################################
#
class PublicImport extends Article
    filename: 'public/import.html'

    submit: (e)=>
        e.preventDefault()

        publicKey = null
        try
            publicKey = new PublicKey(@key)
        catch err
            @error = err
            return

        try
            addressBook.add publicKey, ->
                console.log "Added: ", publicKey
        catch err
            @error = err

class ListAddresses extends Article
    filename: 'public/list.html'


##########################################################
# ArticleSwitcher
##########################################################
#
class ArticleSwitcher
    constructor: ->
        @path = "templates"
        @articles =
            keyGenerate: new KeyGenerate()
            keyImport: new KeyImport()
            keyView: new KeyView()
            keyRemove: new KeyRemove()
            publicImport: new PublicImport()

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


##########################################################
# App
##########################################################
#
class App
    constructor: ->
        @element = (document.getElementsByTagName('body'))[0]
        @key = null

        @switch = new ArticleSwitcher()
        @switch.to 'keyView'

    template: (e)=>
        e.preventDefault()
        @switch.to e.target.rel

    readKey: (callback)=>
        storage.get config.keyName, (key)=>
            return callback() unless key?

            @key = (openpgp.key.readArmored key).keys[0]
            window.key = @key
            callback @key


##########################################################
# Main
##########################################################
#
window.onload = ->
    app = window.app = new App()
    rivets.bind app.element, app
