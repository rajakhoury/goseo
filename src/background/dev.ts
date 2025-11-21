let lastFocusedWindowId: number | undefined;

chrome.runtime.onMessage.addListener((message) => {
  if (message === 'get-current-tab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.runtime.sendMessage({ type: 'CURRENT_TAB', tab: tabs[0] });
      }
    });
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    lastFocusedWindowId = windowId;
  }
});

const reloadExtension = () => {
  chrome.runtime.reload();
};

let fileWatcherInterval: number;

if (import.meta.env.DEV) {
  fileWatcherInterval = setInterval(() => {
    fetch(chrome.runtime.getURL('popup/index.js'))
      .then(() => {
        if (lastFocusedWindowId) {
          chrome.windows.update(lastFocusedWindowId, { focused: true });
        }
        reloadExtension();
      })
      .catch((error) => {
        console.warn('File watcher fetch failed:', error);
      });
  }, 1000) as unknown as number;
}

chrome.runtime.onSuspend.addListener(() => {
  if (fileWatcherInterval) {
    clearInterval(fileWatcherInterval);
  }
});

export {};
