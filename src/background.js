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

//webRequest.onCompleted -> isXML -> tabs.onUpdated -> checkForMapml -> updateURL -> tabs.onUpdated -> updated -> content.js
var updated = false;
var isXML = false;
var layerSrc = {};
var request;

function updateURL() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let tab = tabs[0].id;
    if(request.tabId !== tab) tab = request.tabId;
    layerSrc[tab] = request.url;
    let url = chrome.runtime.getURL("templates/mapml-viewer.html");
    setTimeout(function () {
      chrome.tabs.update(tab, {url: url}, function () {
        updated = true;
      });
    });
  });
}

chrome.webRequest.onCompleted.addListener(function (details) {
  if(details.responseHeaders) {
    details.responseHeaders.forEach(i => {
      if(i.name !== "Content-Type") return;
      if(!i.value.includes("application/xml")) return;
      request = details
      isXML = true;
    });
  }
}, {urls: ["<all_urls>"]}, ["responseHeaders"]);

//Regenerates map on reload and forward/back navigation
chrome.webNavigation.onCommitted.addListener(function (details) {
  let url = chrome.runtime.getURL("templates/mapml-viewer.html");
  if((details.transitionType === "reload" || details.transitionQualifiers[0] === "forward_back")
      && details.url === url) updated = true;
});

function checkForMapml() {
  let mapml = document.querySelector("mapml-");
  return (mapml !== null);
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if(isXML && tab.status === "complete") {
    isXML = false;
    chrome.scripting.executeScript({target: {tabId: tabId}, func: checkForMapml},
        (results) => {
          if(results[0].result) updateURL();
        });
  }
  if(updated && tab.status === "complete") {
    updated = false;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      let tab = tabs[0].id;
      let src = layerSrc[tab];
      chrome.tabs.sendMessage(tabId, {msg: "add-layer", url: src});
    });
  }
});