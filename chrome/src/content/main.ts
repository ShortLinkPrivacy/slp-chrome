/// <reference path="../../typings/openpgp/openpgp.d.ts" />
/// <reference path="../../typings/rivets/rivets.d.ts" />
/// <reference path="../../typings/chrome/chrome.d.ts" />
/// <reference path="../modules.d.ts" />
/// <reference path="popup.ts" />
/// <reference path="func.ts" />

window.onload = function() {
    var nodes: Array<Node>;
    nodes = Content.nodesToDecrypt();
    if ( nodes.length ) {
        Content.loadModule("openpgp", () => {
            setTimeout( () => {
                Content.processNodes(nodes);
            }, 1000 );
        })
    }
}

