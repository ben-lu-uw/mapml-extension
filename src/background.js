/**
 * Used to send back user location on demand, this goes around the need to ask the user
 * for permission on every site the extension runs on for their location
 */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(message);
  if (request.command === "get-location") {
    navigator.geolocation.getCurrentPosition (function (position) {
      sendResponse ({
        lon: position.coords.longitude,
        lat: position.coords.latitude,
      });
    });
    return true;
  }
});

/**
 * Runs on installs and updates once
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("options", function (obj) {
    if(!obj.options){
      chrome.storage.local.set({
        options: {},
      });
    }
  });

});
var tab;
var updated = false;
var layerSrc;
chrome.webRequest.onCompleted.addListener(function (details) {
  if(details.responseHeaders) {
    details.responseHeaders.forEach(i => {
      if(i.name !== "Content-Type") return;
      if(!i.value.includes("application/xml")) return;
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        tab = tabs[0].id;
        layerSrc = details.url;
        let url = chrome.runtime.getURL("templates/mapml-viewer.html");
        chrome.tabs.update(tab, {active: true, url: url}, function (tab) {
          updated = true;
        });
      });
    });
  }
}, {urls: ["<all_urls>"]}, ["responseHeaders"]);

chrome.webNavigation.onCommitted.addListener(function (details) {
  let url = chrome.runtime.getURL("templates/mapml-viewer.html");
  if((details.transitionType === "reload" || details.transitionQualifiers[0] === "forward_back")
      && details.url === url) updated = true;
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if(updated && tab.status === "complete") {
    updated = false;
    chrome.tabs.sendMessage(tabId, {msg: "add-layer", url: layerSrc});
  }
});