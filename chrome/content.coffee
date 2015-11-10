
modules = {}
triggerRe = /localhost\/x\/(.+)$/gi
apiUrl = "http://localhost:5000"

utils =
    log: ()->
        date = new Date()
        console.log(date.toISOString(), arguments)

    # TODO
    error: (message)->
        console.log message

    ajax: (method, url, payload, success)->
        xmlhttp = new XMLHttpRequest()
        xmlhttp.open(methos, url, true)
        xmlhttp.onreadystatechange = ->
            if xmlhttp.readyState == 4
                response = null
                try
                    response = JSON.parse(xmlhttp.responseText)
                catch err
                    utils.error "Bad response from server: #{err}"
                    return

                if 200 <= xmlhttp.status <= 299
                    success(response)
                else
                    utils.error response

        xmlhttp.setRequestHeader('Content-Type', 'application/json')
        xmlhttp.send(JSON.stringify payload)

    post: (url, payload, success)->
        utils.ajax 'POST', url, payload, success

    get: (url, payload, success)->
        utils.ajax 'GET', url, payload, success

    loadModule: (name, callback)->
        if not modules[name]
            utils.log "Requesting module #{name}"
            chrome.runtime.sendMessage { loadModule: name }, (res)=>
                utils.log "Received response", res
                if (property = res.property)?
                    utils.log "Loaded module #{property}"
                    modules[property] = window[property]
                    callback?()
                else
                    # TODO: error
        else
            callback?()

class UI

    # Private constants
    # ------------------------------------------------

    # Icon to show in the corner of each textarea
    iconSize = 16
    iconSrc = '/icon.png'

    # Popup that displays when you click the image
    popupWidth = 200
    popupHeight = 300

    # Popup header height in pixels
    headerHeight = 20

    # Iframe to open inside the popup
    iframeSrc = chrome.runtime.getURL '/iframe.html'

    # Textarea props to save (and restore) when showing
    # and hiding the icon in the corner
    propsToSave = [
        'backgroundPositionX'
        'backgroundPositionY'
        'backgroundRepeat'
        'backgroundAttachment'
        'backgroundImage'
    ]

    # Event handlers
    # ------------------------------------------------

    onMouseMove = (event)->
        return unless @canEncrypt()
        @showIcon()
        if @isOverIcon(event)
            @el.style.cursor = 'pointer'
        else
            @el.style.cursor = 'text'

    onMouseOut = (event)->
        @hideIcon()

    onKeyDown = (event)->
        @hideIcon()

    onClick = (event)->
        return unless @canEncrypt()
        if @isOverIcon(event)
            @openPopup(event.x, event.y)

    # Class methods
    # ------------------------------------------------

    constructor: (@el)->
        @saved = {}

        # Save the current props
        @saveProps()

        # Bind events
        @el.addEventListener 'mousemove', onMouseMove.bind(this)
        @el.addEventListener 'mouseout', onMouseOut.bind(this)
        @el.addEventListener 'keydown', onKeyDown.bind(this)
        @el.addEventListener 'click', onClick.bind(this)

    # Save the element's style properties
    saveProps: ->
        for prop in propsToSave
            @saved[prop] = @el.style[prop]
        return

    # Restore saved properties
    restoreProps: ->
        for prop in propsToSave
            @el.style[prop] = @saved[prop]
        return

    # Is the mouse (event) hovering the icon?
    isOverIcon: (event)->
        return @el.offsetWidth - event.offsetX < iconSize and event.offsetY < iconSize

    # Analyzes the value ot the textarea and decides if we can encrypt it
    canEncrypt: ()->
        return no unless @el.value
        return no if @el.value.match(/localhost/)    # TODO: real url
        yes

    showIcon: ->
        @el.style.backgroundPositionX = 'right'
        @el.style.backgroundPositionY = 'top'
        @el.style.backgroundRepeat = 'no-repeat'
        @el.style.backgroundAttachment = 'scroll'
        @el.style.backgroundImage = "url(#{iconSrc})"

    hideIcon: ->
        @restoreProps()

    openPopup: (x, y)->

        # popup element
        popup = document.createElement('div')
        popup.style.width = "#{popupWidth}px"
        popup.style.height = "#{popupHeight}px"
        popup.style.position = "absolute"
        popup.style.left = "#{x}px"
        popup.style.top = "#{y}px"

        # iframe element
        iframe = document.createElement('iframe')
        iframe.src = iframeSrc
        iframe.width = "100%"
        iframe.height = "100%"
        iframe.style.border = "none"
        popup.appendChild(iframe)

        document.body.appendChild(popup)

        # If clicked on the popup, do not bubble down
        popup.addEventListener 'click', (event)->
            event.stopPropagation()

        # If clicked outside of the popup, close it.
        bindCloseClick = ->
            document.addEventListener 'click', ->
                popup.remove()
                document.removeEventListener 'click', this

        # Can't bind right away, because it fires on the icon click
        setTimeout bindCloseClick, 1000

        @popupEl = popup
        @iframeEl = iframe

decryptLinks = (node)->
    match = triggerRe.exec(node.nodeValue)
    while match?
        id = match[1]
        console.log "Found: #{id}"

        # jQuery
        $.get "#{apiUrl}/x/#{id}", (res)->
            window.node = node
            node.nodeValue = res.fingerprint

        match = triggerRe.exec(node.nodeValue)

pageContainsCode = ->
    walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while node = walk.nextNode()
        if triggerRe.exec(node.nodeValue)
            return true
    false


pageInit = ->
    elements = document.getElementsByTagName('textarea')
    for el in elements
        el.__pgp = new UI(el)

# Main
pageInit()

#elements = document.getElementsByTagName('textarea')
#for el in elements
#    el.addEventListener 'mousedown', (event)->
#        message = el.value
#        return unless event.which == 3 and message
#        loadModule 'openpgp', ->
#            openpgp = modules.openpgp
#            chrome.storage.local.get 'privateKey', (val)->
#                privateKeyArmored  = val.privateKey
#                if not privateKeyArmored?
#                    #TODO show a message about not having a private key
#                else
#                    privateKey = openpgp.key.readArmored(privateKeyArmored).keys[0]
#                    publicKey = privateKey.toPublic()
#                    openpgp.encryptMessage(publicKey, message)
#                        .then (encryptedMessage)->
#                            fingeredHash = {}
#                            fingeredHash[publicKey.primaryKey.fingerprint] = encryptedMessage
#                            ajaxPost "#{apiUrl}/x", { messages: fingeredHash }, (result)->
#                                if result.id?
#                                    el.value = "#{apiUrl}/x/#{result.id}"
#                                    el.dispatchEvent(new Event 'input')
#                                else
#                                    console.log "error" # TODO: handle error
#                        .catch (error)->
#                            #TODO process error

#if pageContainsCode()
#    loadModule, 'openpgp', ->
#        walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
#        while node = walk.nextNode()
#            decryptLinks(node)
