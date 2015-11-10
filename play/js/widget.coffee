class Icon

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
    iframeSrc = '/iframe.html'

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

        # header element
        header = document.createElement('div')
        header.style.width = "100%"
        header.style.height = "#{headerHeight}px"
        header.style.margin = "0"
        header.style.padding = "0"
        header.backgroundColor = "#ccc"
        popup.appendChild(header)

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

            header.addEventListener 'click', ->
                popup.remove()
                document.removeEventListener 'click', this

        # Can't bind right away, because it fires on the icon click
        setTimeout bindCloseClick, 1000

        @popupEl = popup
        @iframeEl = iframe

window.addEventListener 'DOMContentLoaded', ()->
        elements = document.getElementsByTagName 'textarea'
        for el in elements
            new Icon(el)
