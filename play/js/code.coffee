class Play
    key = 'play'

    constructor: ->
        store = localStorage.getItem(key) or "[]"
        @items = JSON.parse( store )

    submit: =>
        return unless @message?
        @items.push @message
        store = JSON.stringify(@items)
        localStorage.setItem(key, store)
        @message = ""

    deleteAll: =>
        @items = []
        localStorage.removeItem(key)


window.onload = ->
    window.app = new Play()
    el = document.getElementById('content')
    rivets.bind el, app
