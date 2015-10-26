class Storage
    constructor: (@config)->

    set: (key, value, callback)->
        obj = {}
        obj[key] = value
        chrome.storage.local.set obj, callback

    get: (key, callback)->
        chrome.storage.local.get key, (items)->
            if runtime?.lastError
                throw "Error saving #{key}: #{runtime.lastError}"
            callback items[key]

    remove: (key)->
        chrome.storage.local.remove key, ->
            if runtime?.lastError
                throw "Error saving #{key}: #{runtime.lastError}"

window.Storage = Storage
