/* global chrome */

/* eslint-disable no-undef */
// console.log(`SEND CLICK MESSAGE TO CONTENT SCRIPT. TABID: ${debugTabId}`)
// chrome.tabs.sendMessage(tabId, {"message": "clicked_browser_action", "tab_id": debugTabId});

let goals;
let infotab;
let maintabId;
let debugTabId;
const port = null;
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

function finishWork() {
  enabled = false;
  console.log(`detach from tab: ${debugTabId}`);
  chrome.debugger.detach({ tabId: debugTabId });
}

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
            regexpMatches.forEach((text, index) => {
              matches.responses[`${goal}`][`${requests[params.requestId]}`].push(text);
            });
            chrome.storage.local.set({ matches });
            console.log(`SEND INFO TO INFOTAB: ${infotab.id}`);
            chrome.tabs.sendMessage(infotab.id, { greeting: 'HELLO' }, function (response) {
              // console.log(response.farewell);
            });
          }
        });
      }
    );
  }
}

function attachToTab() {
  chrome.debugger.attach({ tabId: debugTabId }, '1.0', onAttach.bind(null, debugTabId));
  chrome.debugger.onDetach.addListener((source, reason) => {
    debugTabId = null;
  });
}
function listenTabNetwork() {
  // Enables network tracking, network events will now be delivered to the client.
  chrome.debugger.sendCommand({ tabId: debugTabId }, 'Network.enable');
  // Fired whenever debugging target issues instrumentation event.
  chrome.debugger.onEvent.addListener(onEvent);
}

function createNewTab() {
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
        // delete query because we don't need to know current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.reload(maintabId);
        });
      }
    );
  });
}

function startWork(popupRequest, trackedGoals) {
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
  createNewTab();
  listenTabNetwork();
}

// Listening to messages page
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.message === 'wanted') {
    console.log(Array.isArray(request.goal));
    console.log(`GET MESSAGE FROM CONTENT SCRIPT: GOAL:${request.goal}`);
    startWork(request, request.goal);
  } else if (request.message === 'detach') {
    console.log(`GET MESSAGE FROM CONTENT SCRIPT TO DETACHE TAB ${request.tabId}`);
    return;
    debugTabId = sender.debugTabId;
    finishWork();
  } else {
    // TODO: check this part
    // alert(request.message);
  }
});

startFromWhiteList();

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, 'toggle');
  });
});

const remove_toggle_marker = () => {
  chrome.storage.local.clear();
};

chrome.tabs.onRemoved.addListener(() => {
  remove_toggle_marker();
});

chrome.windows.onRemoved.addListener(() => {
  remove_toggle_marker();
});
