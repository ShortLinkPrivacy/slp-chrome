config    = new window.Config()
storage   = new window.Storage(config)
PublicKey = window.PublicKey

class AddressBook
    constructor: (@config)->

    #------------------------------------------------------
    add: (publicKey, callback)->
        if not publicKey?
            throw "Missing required parameter"

        # TODO: test
        expirationTime = publicKey.expirationTime()
        if expirationTime? and expirationTime < new Date()
            throw "This public key expired on #{publicKey.expirationTime()}"

        # Since we'using just a simple key/value store, we will
        # bind each public key to its fingerprint. In order to
        # keep track of the available public keys, we must keep a
        # directory. The directory is also a key/value store, in
        # the format { userId: fingerprint }, since some keys
        # have several userIds. Use the directory when searching
        # for a userId. Obtain the fingerprint hash, and use it
        # agains the root storage to get the armored text of the
        # public key.
        #
        storage.get console.directoryKey, (dir)=>
            dir = {} unless dir?

            # Save each userId -> fingerprint
            for userId in publicKey.key.getUserIds()
                dir[userId] = publicKey.fingerprint()

            record = {}
            record[publicKey.fingerprint()] = publicKey.armor
            record[console.directoryKey] = dir
            storage.storeObject(record, callback)


    #------------------------------------------------------
    find: (fingerprint, callback)->
        storage.get(fingerprint, callback)


window.AddressBook = AddressBook
