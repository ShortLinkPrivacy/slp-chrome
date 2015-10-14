
openpgp = null
triggerRe = /localhost\/x\/(.+)$/gi
apiUrl = "http://localhost:5000"

loadModules = (callback)->
    unless openpgp?
        chrome.runtime.sendMessage { loadModules: yes }, (response)=>
            console.log 'openpgp loaded'
            openpgp = window.openpgp
            callback?()

decryptLinks = (node)->
    match = triggerRe.exec(node.nodeValue)
    while match?
        id = match[1]
        console.log "Found: #{id}"
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
if pageContainsCode()
    loadModules =>
        walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        while node = walk.nextNode()
            decryptLinks(node)
