import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Handle GitHub Pages SPA redirection query parameter
(function() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  if (p) {
    window.history.replaceState(null, '', p + window.location.hash);
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
