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
    if (name = msg.loadModule)?
        filename = modules[name].filename
        property = modules[name].property
        chrome.tabs.executeScript null, { file: filename }, ->
            sendResponse { property: property }

    return true
