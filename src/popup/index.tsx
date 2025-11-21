import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';
import { SettingsProvider } from '../contexts/SettingsContext';
import '../assets/styles/tailwind.css';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <SettingsProvider>
      <Popup />
    </SettingsProvider>
  </React.StrictMode>
);

// HMR
if (import.meta.hot) {
  import.meta.hot.accept();
  chrome.runtime.sendMessage({ type: 'VITE_HMR_RELOAD' });
}
