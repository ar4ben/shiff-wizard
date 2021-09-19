/* global chrome */
console.log('Content script has been loaded succesfully!');

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

function toggle() {
  if (iframe.style.width === '0px') {
    iframe.style.width = '400px';
  } else {
    iframe.style.width = '0px';
  }
}

document.body.appendChild(iframe);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg === 'toggle') {
    toggle();
  } else {
    console.log(msg);
  }
});

document.onselectionchange = () => {
  const content = window.getSelection().toString().trim();
  if (content === '') return;
  iframe.contentWindow.postMessage(content, '*');
};
