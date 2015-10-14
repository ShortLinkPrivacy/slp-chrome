chrome.runtime.onMessage.addListener (msg, sender, sendResponse)->
    if msg.loadModules
        chrome.tabs.executeScript null, { file: "bower_components/openpgp/dist/openpgp.min.js" }, ->
            sendResponse "Got the message"

    return true
