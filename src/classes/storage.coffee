class Storage
    constructor: (@config)->

    set: ( object, callback )->
        chrome.storage.local.set object, callback

    get: ( key, callback )->
        chrome.storage.local.get key, (items)->
            if runtime?.lastError
                throw "Error saving #{key}: #{runtime.lastError}"
            callback items

window.Storage = Storage
