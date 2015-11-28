class FakeStorage
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

    clear: ->
        data = {}

    data: ->
        data


locl = new FakeStorage()
sync = new FakeStorage()
for method in ['get', 'set', 'remove', 'clear']
    chrome.storage.local[method] = locl[method].bind(locl)
    chrome.storage.sync[method]  = sync[method].bind(sync)

chrome.storage.local._data = locl.data.bind(locl)
chrome.storage.sync._data = sync.data.bind(sync)

window.FakeStorage = FakeStorage
window.fakeLocal = locl
window.fakeSync = sync
