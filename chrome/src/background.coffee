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

    # First check to see if this is a message intended for the
    # content script and if so, pass it down
    if (content = msg.content)?
        chrome.tabs.query {active: true, currentWindow: true}, (tabs)->
            chrome.tabs.sendMessage tabs[0].id, content, sendResponse

    # Handle other messages here
    # --------------------------
    else if (name = msg.loadModule)?
        filename = modules[name].filename
        property = modules[name].property
        chrome.tabs.executeScript null, { file: filename }, ->
            sendResponse { property: property }


    return true
