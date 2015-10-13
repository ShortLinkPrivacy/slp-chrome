
urlRe = /localhost\/(.+)$/gi

loadModule = ->
    unless openpgp?
        chrome.runtime.sendMessage { loadModule: yes }, (response)->
            console.log response
            console.log openpgp.config


decryptLinks = (node)->
    match = urlRe.exec(node.nodeValue)
    while match?
        console.log "Found: #{match[0]} - #{match[1]} - #{match[2]}"
        match = urlRe.exec(node.nodeValue)


walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
while node = walk.nextNode()
    decryptLinks(node)

console.log "Done"
