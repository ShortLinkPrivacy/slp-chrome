/// <reference path="../typings/chrome/chrome.d.ts" />
/// <reference path="modules/interfaces.ts" />

var menuId = "1";

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
    console.log ("Received runtime message:", msg);
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

var mid = chrome.contextMenus.create({
    id: menuId,
    title: "PGP Encrypt",
    contexts: ["editable"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    sendMessageToContent({ popup: true, info: info });
})

