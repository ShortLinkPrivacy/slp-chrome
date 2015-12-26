/// <reference path="../typings/chrome/chrome.d.ts" />

var modules = {
    openpgp: {
        filename: "bower_components/openpgp/dist/openpgp.min.js",
        property: "openpgp"
    }
};

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

/*
chrome.contextMenus.create({
    id: "123",
    title: "PGP Encrypt",
    contexts: ["editable"],
});

chrome.contextMenus.onClicked.addListener(() => {
    console.log('click');
})
*/
