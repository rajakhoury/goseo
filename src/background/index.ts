const reloadExtension = () => {
  if (import.meta.env.DEV) {
    chrome.runtime.reload();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  }
};

if (import.meta.env.DEV) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'VITE_HMR_RELOAD') {
      reloadExtension();
    }
  });

  import('./dev');
}

export {};
