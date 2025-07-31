import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Minimal process polyfill - only if needed and safe
if (typeof window !== 'undefined') {
  // Set global reference safely
  if (!window.global) {
    window.global = window;
  }

  // Only set process if it doesn't exist or is incomplete
  if (!window.process || !window.process.env) {
    const processPolyfill = {
      env: {
        NODE_ENV: 'development',
        REACT_APP_VERSION: '1.0.0',
      },
      browser: true,
      nextTick: function (callback) {
        if (typeof callback === 'function') {
          setTimeout(callback, 0);
        }
      },
    };

    // Try to set process polyfill safely
    if (!window.process) {
      try {
        window.process = processPolyfill;
      } catch (e) {
        // Silently ignore if can't set
      }
    }
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
