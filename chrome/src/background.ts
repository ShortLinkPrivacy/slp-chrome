/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules/interfaces.ts" />

var modules = {
    openpgp: {
        filename: "bower_components/openpgp/dist/openpgp.min.js",
        property: "openpgp"
    }
};

function sendMessageToContent(msg: any, callback?: Interfaces.ResultCallback): void {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, msg, callback);
    });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    var name: string,
        filename: string,
        property: string;

    // If the message came from the content, it's for the background page
    if (name = msg.loadModule) {
        filename = modules[name].filename
        property = modules[name].property
        chrome.tabs.executeScript(null, { file: filename }, () => {
            sendResponse({ property: property });
        });
    }

    return true;
});

