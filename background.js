// Make background blue when any message is received
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
  chrome.tabs.executeScript(null, {file: "bower_components/openpgp/dist/openpgp.min.js"}, function(){
    sendResponse("Got the message");
  });
  return true;
})
