class Storage
    constructor: ->
        @ownKeys = []
        @otherKeys = []
        @counter = 0

    nextCounter: ->
        @counter++

    findKeyByID: (keyRing, userId)->
        for key in keyRing
            if key.userId == userId
                return key
        return null

    saveKey: ( keyRing, keypair )->
        keyRing.push keypair

    saveOwnKey: (keypair, success, error)->
        @saveKey( @ownKeys, keypair )

    saveOtherKey: (keypair, success, error)->
        @saveKey( @otherKeys, keypair )
        

window.app.factory 'storage', ->
    new Storage()
