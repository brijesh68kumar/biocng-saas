import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Entry point of React app: mount <App /> into <div id="root"></div> in public/index.html
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode helps catch common issues in development.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional performance metrics hook.
reportWebVitals();
