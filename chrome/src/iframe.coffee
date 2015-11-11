app     = null
config  = new window.Config()
storage = new window.Storage(config)

class App
    constructor: ->
        @element = document.getElementById('iframe')

    # Sends a message to the content script
    sendMessage: (msg, callback)->
        chrome.runtime.sendMessage { content: msg }, callback

    close: (e)=>
        @sendMessage { closePopup: true }, (res)->
            console.log res


window.onload = ->
    app = window.app = new App()
    rivets.bind app.element, app
