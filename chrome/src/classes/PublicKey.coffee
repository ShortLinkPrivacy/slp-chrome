class PublicKey
    constructor: (@armor)->
        result = openpgp.key.readArmored(@armor)
        if result.err?.length > 0 or result.keys?.length == 0
            throw "This does not seem to be a valid public key"

        key = result.keys[0]
        if not key.isPublic()
            throw "This does not seem to be a valid public key"

        # For the full API to key see:
        # http://openpgpjs.org/openpgpjs/doc/module-key-Key.html
        @key = key

    fingerprint: ->
        @key.primaryKey.fingerprint

    userId: (num)->
        if num? then @key.getUserIds()[num] else @key.getPrimaryUser()

    expirationTime: ->
        @key.getExpirationTime()


window.PublicKey = PublicKey
