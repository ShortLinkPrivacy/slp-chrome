#
# This represents a single PGP key structure. It consists of a public and 
# private keys, and some meta data about the owner of the key
#
class Key

    constructor: (@config)->

    fromObject: (obj)->
        @id = obj.id
        @email = obj.email
        @publicKeyArmored = obj.publicKeyArmored
        @privateKeyArmored = obj.privateKeyArmored

    create: (id, email, passphrase, bits, onSuccess, onError)->
        if not bits? then bits = @config.defaultBits

        options =
            numBits: bits
            userId: "#{id} <#{email}>"
            passphrase: passphrase

        openpgp.generateKeyPair(options)
        .then( (newKey)=>
            @id = id
            @email = email
            @privateKeyArmored = newKey.privateKeyArmored
            @publicKeyArmored = newKey.publicKeyArmored
            if @create._then?() then @create._then(key)
        )
        .catch( (error)=>
            if @create._catch?() then @create._catch(error)
            throw "Can not create a new key - #{error}"
        )

    title: ->
        "#{@email}<#{@email}>"

    toJSON: ->
        id: @id
        email: @email
        publicKeyArmored: @publicKeyArmored
        privateKeyArmored: @privateKeyArmored

Key.prototype.create.then = (callback)->
    Key.prototype.create._then = callback

Key.prototype.create.catch = (callback)->
    Key.prototype.create._catch = callback

# A keyring is an array of Key structures. It contains all own PGP keys 
# possesed by the user of the application.
#
class KeyRing
    keyring = []

    constructor: (@config)->
        @load()

    purge: ->
        localStorage.removeItem @config.keyringTag

    # Load the keyring, expand it into Key structures and move it to @keyring
    load: (complete)->
        localStorage.getItem @config.keyringTag, (json)->
            result = keyring = []
            if json
                try
                    result = JSON.parse json
                catch e
                    throw "Unable to parse the 'keys' storage"
                finally
                    result = []

            keyring = result.map (obj)->
                key = new Key(@config)
                key.fromObject(obj)
                return key

            complete() if complete?()

    # Save the current keyring into a JSON structure and in localStorage
    save: ->
        result = keyring.map (key)-> key.toJSON()
        json = JSON.stringify result
        localStorage.setItem @config.keyringTag, json

    # Locate a key by its email address
    find: (email)->
        for key in keyring
            return key if key.email == email

        return

    add: (key)->
        keyring.push(key)

    length: ->
        keyring.length

    at: (idx)->
        keyring[idx]

window.Key = Key
window.KeyRing = KeyRing
