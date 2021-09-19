/* global chrome */
/* eslint-disable no-undef */

let goals;
let infotab;
let debugTabId;
const requests = {};
const matches = {};

const startFromWhiteList = () => {
  chrome.storage.local.clear();
};

const onAttach = () => {
  const error = chrome.runtime.lastError;
  if (error) {
    console.warn(`OnAttach Error:\n ${error.message} `);
  }
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

// debuggeeId - The debuggee that generated this event.
// message - Method name. Should be one of the notifications defined by the remote debugging protocol.
// params - JSON object with the parameters.
const onEvent = (debuggeeId, message, params) => {
  // working only witn our tab
  if (debugTabId !== debuggeeId.tabId) return;
  if (
    message === 'Network.requestWillBeSent' &&
    !params.request.url.match(/data:image|\.jpeg|\.css|\.gif|\.png|\.ico|\.woff/)
  ) {
    // useful params:
    // params.requestId ; params.request.url ; (params.requestId, params.redirectResponse)? ;  params.request.method;
    requests[params.requestId] = params.request.url;
  } else if (message === 'Network.loadingFinished') {
    // get response body if it is request id which we need
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
        const error = chrome.runtime.lastError;
        if (error) {
          // if response was failed to load by browser then response variable will be undefined and runtime.lastError will appear:
          // {"code":-32000,"message":"No resource with given identifier found"}
          console.warn(`Runtime error from ${requests[params.requestId]}:\n ${error.message}\n  `);
        }
        goals.forEach((goal) => {
          if (response && response.body.includes(goal)) {
            const escapedGoal = escapeRegExp(goal);
            const reg = new RegExp(`.{0,40}${escapedGoal}.{0,40}`, 'g');

            // logging in background script console
            console.log('FOUND!!! RESPONSE:');
            response.body.match(reg).forEach((text) => {
              console.log(text.replace(goal, `%c${goal}%c`), 'color: green', 'color: graydark');
            });
            console.log(`FROM: ${requests[params.requestId]}`);
            // end of logging

            matches.responses[`${goal}`][`${requests[params.requestId]}`] = [];
            regexpMatches = response.body.match(reg);
            regexpMatches.forEach((text) => {
              matches.responses[`${goal}`][`${requests[params.requestId]}`].push(text);
            });
            console.log(`SEND INFO TO INFOTAB: ${infotab.id}`);
            // TODO: every time send only new match instead of all
            chrome.tabs.sendMessage(infotab.id, { responses: matches.responses });
          }
        });
      }
    );
  }
};

const attachToTab = () => {
  chrome.debugger.attach({ tabId: debugTabId }, '1.0', onAttach.bind(null, debugTabId));
  chrome.debugger.onDetach.addListener(() => {
    debugTabId = null;
  });
};
const listenMaintabNetwork = () => {
  // Enables network tracking, network events will now be delivered to the client.
  chrome.debugger.sendCommand({ tabId: debugTabId }, 'Network.enable');
  // Fired whenever debugging target issues instrumentation event.
  chrome.debugger.onEvent.addListener(onEvent);
};

const reloadMainTab = () => {
  // reload tab for watching requests from target page
  chrome.tabs.query({ active: true, currentWindow: true }, () => {
    chrome.tabs.reload(debugTabId);
  });
};

const createInfoTab = () => {
  chrome.tabs.create(
    {
      url: chrome.extension.getURL('infotab.html'),
    },
    (tab) => {
      infotab = tab;
      reloadMainTab();
      listenMaintabNetwork();
    }
  );
};

const startWatchingRequests = (popupRequest, trackedGoals) => {
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
};

startFromWhiteList();

// Listen if extension icon was clicked
chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, 'toggle');
  });
});

// Listening messages from pages
chrome.runtime.onMessage.addListener((request) => {
  if (request.message === 'wanted') {
    startWatchingRequests(request, request.goal);
  } else if (request.message === 'detach') {
    // use addListener((request, sender) in this case
    // debugTabId = sender.debugTabId;
    // chrome.debugger.detach({ tabId: debugTabId });
  }
});

// Clear all if the tab or window were closed
chrome.tabs.onRemoved.addListener(() => {
  startFromWhiteList();
});
chrome.windows.onRemoved.addListener(() => {
  startFromWhiteList();
});
