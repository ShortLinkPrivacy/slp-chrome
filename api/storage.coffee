data = {}

class Storage
    set: (key, value, callback)->
        data[key] = value
        callback()

    get: (key, callback)->
        callback(data[key])

    remove: (key, callback)->
        delete data[key]
        callback()

module.exports = Storage
