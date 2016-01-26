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

    iframe: =>
        frame = document.createElement 'iframe'
        frame.src = "iframe.html"
        document.body.appendChild(frame)

    deleteAll: =>
        @items = []
        localStorage.removeItem(key)


window.onload = ->
    window.app = new Play()
    el = document.getElementById('content')
    rivets.bind el, app
