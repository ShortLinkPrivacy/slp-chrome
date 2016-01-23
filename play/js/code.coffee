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

    submit2: =>
        return unless @message2?
        @items.push @message2
        store = JSON.stringify(@items)
        localStorage.setItem(key, store)
        @message2 = ""

    submit3: =>
        return unless @message3?
        @items.push @message3
        store = JSON.stringify(@items)
        localStorage.setItem(key, store)
        @message3 = ""

    submit4: =>
        return unless @message4?
        @items.push @message4
        store = JSON.stringify(@items)
        localStorage.setItem(key, store)
        @message4 = ""

    deleteAll: =>
        @items = []
        localStorage.removeItem(key)


window.onload = ->
    window.app = new Play()
    el = document.getElementById('content')
    rivets.bind el, app
