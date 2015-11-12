class Storage

    config = null
    store = null

    constructor: (_config)->
        if not _config? then throw "Configuration needed"
        config = _config
        store = config.store

    storeObject: ( value, callback )->
        store.set value, (result)->
            if runtime?.lastError
                throw "Error saving an object: #{runtime.lastError}"
            callback(result)

    set: (key, value, callback)->
        obj = {}
        obj[key] = value
        @storeObject obj, callback

    get: (key, callback)->
        store.get key, (items)->
            if runtime?.lastError
                throw "Error retrieving #{key}: #{runtime.lastError}"
            callback items[key]

    remove: (key)->
        store.remove key, ->
            if runtime?.lastError
                throw "Error removing #{key}: #{runtime.lastError}"

window.Storage = Storage
