
modules = {}
triggerRe = /localhost\/x\/(.+)$/gi
apiUrl = "http://localhost:5000"

log = ()->
    date = new Date()
    console.log(date.toISOString(), arguments)

ajaxPost = (url, payload, success)->
    xmlhttp = new XMLHttpRequest()
    xmlhttp.open('POST', url, true)
    xmlhttp.onreadystatechange = ->
        if xmlhttp.readyState == 4
            # TODO: try catch this
            response = JSON.parse(xmlhttp.responseText)
            if 200 <= xmlhttp.status <= 299
                success(response)
            else
                console.log response

    xmlhttp.setRequestHeader('Content-Type', 'application/json')
    xmlhttp.send(JSON.stringify payload)

loadModule = (name, callback)->
    if not modules[name]
        log "Requesting module #{name}"
        chrome.runtime.sendMessage { loadModule: name }, (res)=>
            log "Received response", res
            if (property = res.property)?
                log "Loaded module #{property}"
                modules[property] = window[property]
                callback?()
            else
                # TODO: error
    else
        callback?()

encryptText = ->
    console.log "here"

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

serviceCall = (payload, opt)->

# Main

elements = document.getElementsByTagName('textarea')
for el in elements
    el.addEventListener 'mousedown', (event)->
        message = el.value
        return unless event.which == 3 and message
        loadModule 'openpgp', ->
            openpgp = modules.openpgp
            chrome.storage.local.get 'privateKey', (val)->
                privateKeyArmored  = val.privateKey
                if not privateKeyArmored?
                    #TODO show a message about not having a private key
                else
                    privateKey = openpgp.key.readArmored(privateKeyArmored).keys[0]
                    publicKey = privateKey.toPublic()
                    openpgp.encryptMessage(publicKey, message)
                        .then (encryptedMessage)->
                            fingeredHash = {}
                            fingeredHash[publicKey.primaryKey.fingerprint] = encryptedMessage
                            ajaxPost "#{apiUrl}/x", { messages: fingeredHash }, (result)->
                                if result.id?
                                    el.value = "#{apiUrl}/x/#{result.id}"
                                    el.dispatchEvent(new Event 'input')
                                else
                                    console.log "error" # TODO: handle error
                        .catch (error)->
                            #TODO process error

#if pageContainsCode()
#    loadModule, 'openpgp', ->
#        walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
#        while node = walk.nextNode()
#            decryptLinks(node)
