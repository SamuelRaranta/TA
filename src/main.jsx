import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Tangkap penanda recovery password SECARA SINKRON sebelum supabase-js
// sempat mengonsumsi token di URL (client menghapus hash saat init,
// sehingga penanda hilang dan halaman update-password tak pernah tampil).
// Lihat: GoTrueClient._getSessionFromURL -> window.location.hash = ''.
try {
  const href = window.location.href || '';
  const isOAuth = Boolean(
    localStorage.getItem('agriconnect_oauth_in_progress') ||
    href.includes('provider_token=') ||
    href.includes('provider_refresh_token=')
  );

  if (isOAuth) {
    sessionStorage.removeItem('agriconnect_recovery_pending');
  } else {
    const hasRecoveryMarker =
      href.includes('type=recovery') ||
      href.includes('token_hash=') ||
      (sessionStorage.getItem('agriconnect_recovery_pending') === '1');
    if (hasRecoveryMarker) {
      sessionStorage.setItem('agriconnect_recovery_pending', '1');
    }
  }
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
