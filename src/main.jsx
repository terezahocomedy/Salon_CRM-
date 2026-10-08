import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Workaround: remove Netlify-injected "Powered by Netlify" badge
const removeNetlifyBadge = () => {
  try {
    document.body.querySelectorAll(':scope > *').forEach((el) => {
      if (el.id === 'root') return
      const text = (el.textContent || '').trim()
      const link = el.matches('a[href*="netlify.com"]') ? el : el.querySelector('a[href*="netlify.com"]')
      const fixed = (n) => window.getComputedStyle(n).position === 'fixed'
      if (text === 'Powered by Netlify' || (link && (fixed(link) || fixed(el)))) el.remove()
    })
  } catch (e) {
    // ignore
  }
}
removeNetlifyBadge()
new MutationObserver(removeNetlifyBadge).observe(document.body, { childList: true })
