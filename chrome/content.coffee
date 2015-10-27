
openpgp = null
triggerRe = /localhost\/x\/(.+)$/gi
apiUrl = "http://localhost:5000"

loadOpenPgp = (callback)->
    unless openpgp?
        chrome.runtime.sendMessage { loadOpenPgp: yes }, (response)=>
            console.log 'openpgp loaded'
            openpgp = window.openpgp
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

# Main

elements = document.getElementsByTagName('textarea')
for el in elements
    el.onmousedown = (event)->
        message = el.value
        return unless event.which == 3 and message
        loadOpenPgp ->
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
                            $.ajax {
                                beforeSend: (xhrObj)->
                                    xhrObj.setRequestHeader("Accept", "application/json")
                                contentType: "application/json"
                                type: "POST"
                                url: "#{apiUrl}/x"
                                data: JSON.stringify { messages: fingeredHash }
                                dataType: "json"
                                success: (result)->
                                    if result.id?
                                        el.value = "#{apiUrl}/x/#{result.id}"
                                    else
                                        console.log "error" # TODO: handle error
                                error: (error)->
                                    console.log(error)
                                    #TODO: handle error
                            }
                        .catch (error)->
                            #TODO process error

#if pageContainsCode()
#    loadOpenPgp =>
#        walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
#        while node = walk.nextNode()
#            decryptLinks(node)
