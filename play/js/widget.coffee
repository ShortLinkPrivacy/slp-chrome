
class Icon
   
    # Private constants
    # ------------------------------------------------

    imageSize = 16
    imageSrc = 'icon.png'
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
            console.log @el

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

    # Restore saved properties
    restoreProps: ->
        for prop in propsToSave
            @el.style[prop] = @saved[prop]

    isOverIcon: (event)->
        return @el.offsetWidth - event.offsetX < imageSize and event.offsetY < imageSize

    # Analyzes the value ot the textarea and decides if we can encrypt it
    canEncrypt: ()->
        return no unless @el.value
        return no if @el.value.test(/localhost/)    # TODO: real url
        yes
        

    showIcon: ->
        @el.style.backgroundPositionX = 'right'
        @el.style.backgroundPositionY = 'top'
        @el.style.backgroundRepeat = 'no-repeat'
        @el.style.backgroundAttachment = 'scroll'
        @el.style.backgroundImage = "url(#{imageSrc})"

    hideIcon: ->
        @restoreProps()


window.addEventListener 'DOMContentLoaded', ()->
        elements = document.getElementsByTagName 'textarea'
        for el in elements
            new Icon(el)
