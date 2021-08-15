/* global chrome */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg === 'toggle') {
    toggle();
  } else {
    console.log(msg);
  }
});

chrome.storage.local.get((stored) => {
  const { toggled, tabUrl } = stored;
  if (window.location.href === tabUrl && toggled) {
    toggle();
    setTimeout(() => {
      checkResponsesFromStorage();
    }, 3000);
  }
});

const iframe = document.createElement('iframe');
iframe.style.background = 'green';
iframe.style.height = '100%';
iframe.style.width = '0px';
iframe.style.position = 'fixed';
iframe.style.top = '0px';
iframe.style.right = '0px';
iframe.style.zIndex = '9000000000000000000';
iframe.frameBorder = 'none';
iframe.src = chrome.extension.getURL('index.html');

document.body.appendChild(iframe);

function toggle() {
  if (iframe.style.width === '0px') {
    iframe.style.width = '400px';
    console.log('SHOW FRAME');
  } else {
    iframe.style.width = '0px';
    console.log('HIDE FRAME');
  }
}

function checkResponsesFromStorage() {
  chrome.storage.local.get(({ matches }) => {
    console.log(matches);
  });
}

document.onselectionchange = () => {
  const content = window.getSelection().toString().trim();
  if (content === '') return;
  iframe.contentWindow.postMessage(content, '*');
};
