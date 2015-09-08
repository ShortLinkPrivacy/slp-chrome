# A keyring is an array of Key structures. It contains all own PGP keys 
# possesed by the user of the application.
#
class KeyRing
    keyring = []

    constructor: (@config)->
        @load()

    purge: ->
        keyring = []
        localStorage.removeItem @config.keyringTag

    # Load the keyring, expand it into Key structures and move it to @keyring
    load: ()->
        json = localStorage.getItem @config.keyringTag
        keyring = []
        if json
            try
                keyring = JSON.parse json
            catch e
                throw "Unable to parse the 'keys' storage"

    # Save the current keyring into a JSON structure and in localStorage
    save: ->
        json = JSON.stringify keyring
        localStorage.setItem @config.keyringTag, json

    # Locate a key by its email address
    find: (email)->
        for key in keyring
            return key if key.email == email

        return

    add: (key)->
        keyring.push key
        @save()

    length: ->
        keyring.length

    at: (idx)->
        keyring[idx]

    all: ->
        keyring

window.KeyRing = KeyRing
