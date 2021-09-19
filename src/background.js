/* global chrome */
/* eslint-disable no-undef */

let goals;
let infotab;
let maintabId;
let debugTabId;
const requests = {};
const matches = {};

function startFromWhiteList() {
  chrome.storage.local.clear();
}

function onAttach() {
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
  }
}

// function finishWatchingRequests() {
//   enabled = false;
//   console.log(`detach from tab: ${debugTabId}`);
//   chrome.debugger.detach({ tabId: debugTabId });
// }

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// debuggeeId - The debuggee that generated this event.
// message - Method name. Should be one of the notifications defined by the remote debugging protocol.
// params - JSON object with the parameters.
function onEvent(debuggeeId, message, params) {
  // working only witn our tab
  if (debugTabId !== debuggeeId.tabId) return;
  if (message === 'Network.requestWillBeSent') {
    // useful params:
    // params.requestId ; params.request.url ; (params.requestId, params.redirectResponse)? ;  params.request.method;
    requests[params.requestId] = params.request.url;
    // remember request id
    if (params.request.url === '<PATTERN>') {
      requests[params.requestId] = params.request.url;
    }
  } else if (message === 'Network.loadingFinished') {
    // get response body if it is needed request id
    if (!requests.hasOwnProperty(params.requestId)) {
      return;
    }
    chrome.debugger.sendCommand(
      {
        tabId: debuggeeId.tabId,
      },
      'Network.getResponseBody',
      {
        requestId: params.requestId,
      },
      (response) => {
        // if response was failed to load by browser then response variable will be undefined and runtime.lastError will appear:
        // {"code":-32000,"message":"No resource with given identifier found"}
        goals.forEach((goal) => {
          if (
            response &&
            !requests[params.requestId].match(/data:image|\.jpeg|\.css|\.gif|\.png|\.ico|\.woff/) &&
            response.body.includes(goal)
          ) {
            console.log('FOUND!!! RESPONSE:');
            const escapedGoal = escapeRegExp(goal);
            const reg = new RegExp(`.{0,40}${escapedGoal}.{0,40}`, 'g');
            response.body.match(reg).forEach((text) => {
              console.log(text.replace(goal, `%c${goal}%c`), 'color: green', 'color: graydark');
            });
            console.log(`FROM: ${requests[params.requestId]}`);
            matches.responses[`${goal}`][`${requests[params.requestId]}`] = [];
            regexpMatches = response.body.match(reg);
            regexpMatches.forEach((text) => {
              matches.responses[`${goal}`][`${requests[params.requestId]}`].push(text);
            });
            console.log(`SEND INFO TO INFOTAB: ${infotab.id}`);
            chrome.tabs.sendMessage(infotab.id, { responses: matches.responses });
          }
        });
      }
    );
  }
}

function attachToTab() {
  chrome.debugger.attach({ tabId: debugTabId }, '1.0', onAttach.bind(null, debugTabId));
  chrome.debugger.onDetach.addListener(() => {
    debugTabId = null;
  });
}
function listenMaintabNetwork() {
  // Enables network tracking, network events will now be delivered to the client.
  chrome.debugger.sendCommand({ tabId: debugTabId }, 'Network.enable');
  // Fired whenever debugging target issues instrumentation event.
  chrome.debugger.onEvent.addListener(onEvent);
}

function reloadMainTab() {
  // reload tab for watching requests from target page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.reload(maintabId);
  });
}

function createInfoTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    maintabId = tabs[0].id;
    chrome.tabs.create(
      {
        url: chrome.extension.getURL('infotab.html'),
      },
      (tab) => {
        infotab = tab;
        console.log(`Create infotab: ${tab.id}`);
        console.log(`Maintab: ${maintabId}`);
        reloadMainTab();
      }
    );
  });
}

function startWatchingRequests(popupRequest, trackedGoals) {
  console.log(`GET MESSAGE FROM CONTENT SCRIPT => GOAL:${trackedGoals}`);
  goals = trackedGoals;
  enabled = true;
  matches.responses = {};

  goals.forEach((goal) => {
    matches.responses[`${goal}`] = {};
  });

  if (debugTabId !== popupRequest.tabId) {
    debugTabId = popupRequest.tabId;
    matches.url = popupRequest.url;
    attachToTab();
  }
  createInfoTab();
  listenMaintabNetwork();
}

startFromWhiteList();

// Track if extension icon is clicked
chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, 'toggle');
  });
});

// Listening messages from pages
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.message === 'wanted') {
    startWatchingRequests(request, request.goal);
  } else if (request.message === 'detach') {
    // debugTabId = sender.debugTabId;
    // finishWatchingRequests();
  }
});

// Clear all if the tab or window were closed
chrome.tabs.onRemoved.addListener(() => {
  startFromWhiteList();
});
chrome.windows.onRemoved.addListener(() => {
  startFromWhiteList();
});
