openpgp = "bower_components/openpgp/dist/openpgp.min.js"

chrome.runtime.onMessage.addListener (msg, sender, sendResponse)->
    if msg.loadOpenPgp
        chrome.tabs.executeScript null, { file: openpgp }, ->
            sendResponse "Got the message"

    return true
