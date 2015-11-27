class Chrome
    data = {}

    itemsToArr = (items)->
        arr = []
        if typeof items is "string"
            arr = [items]
        else if ( typeof items is "object" )
            if items.hasOwnProperty('length')
                arr = items
            else
                arr = Object.keys items

        return arr

    get: ( items, callback )->
        arr = itemsToArr(items)

        result = {}
        for k in arr
            result[k] = data[k]

        callback(result)
        return

    set: (items, callback)->
        for k of items
            data[k] = items[k]

        callback()
        return

    remove: (items, callback)->
        arr = itemsToArr(items)
        for k in arr
            delete data[k]

        callback()
        return

    data: ->
        data

exports.Chrome = Chrome
