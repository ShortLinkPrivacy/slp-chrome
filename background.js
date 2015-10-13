chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){

  // Load openpgp if message is received
  if (msg.loadModule) {
    chrome.tabs.executeScript(null, {file: "bower_components/openpgp/dist/openpgp.min.js"}, function(){
      sendResponse("Got the message");
    });
  }
  return true;
})
