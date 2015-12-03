modules =
    openpgp:
        filename: "bower_components/openpgp/dist/openpgp.min.js"
        property: "openpgp"
    rivets:
        filename: "bower_components/rivets/dist/rivets.min.js"
        property: "rivets"
    jquery:
        filename: "bower_components/jquery/dist/jquery.min.js"
        property: "$"

chrome.runtime.onMessage.addListener (msg, sender, sendResponse)->
    console.log "Received runtime message:", msg

    # If the message came from the iframe, then it's for the content page.
    if msg.iframe
        chrome.tabs.sendMessage sender.tab.id, msg.message, sendResponse

    # If the message came from the content, it's for the background page
    else if (name = msg.loadModule)?
        filename = modules[name].filename
        property = modules[name].property
        chrome.tabs.executeScript null, { file: filename }, ->
            sendResponse { property: property }

    return true
