import React from 'react';
import ReactDOM from 'react-dom/client';
import Tetrado from './Tetrado.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Tetrado />
  </React.StrictMode>
);

// Register service worker for PWA / offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (err) {
      console.warn('SW registration failed:', err);
    });
  });
}
