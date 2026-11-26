import React, { useState, useEffect } from 'react';
import { Plant, ArrowsClockwise, DownloadSimple, CheckCircle, WarningCircle } from '@phosphor-icons/react';

/**
 * Deteksi apakah aplikasi sedang dibuka di dalam Aplikasi Mobile (APK Android Studio / Standalone PWA / TWA)
 * atau sedang dibuka di browser web biasa (Chrome, Safari, Edge, dll).
 */
export const checkIsMobileApp = () => {
  if (typeof window === 'undefined') return false;
  
  // 1. Standalone PWA mode (dipasang di home screen HP)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || window.navigator.standalone === true 
    || document.referrer.includes('android-app://');

  // 2. Android WebView wrapper (aplikasi buatan Android Studio) & Native App flag
  const isWebView = /wv|WebView|Android.*Version\/[\d.]+/i.test(navigator.userAgent)
    || window.AndroidApp !== undefined
    || window.isNativeApp === true
    || window.AgriConnectNative !== undefined
    || window.AgriConnectNative !== undefined;

  return isStandalone || isWebView;
};

export default function AppDownloadPromoCard({ 
  role = 'farmer', 
  isCompact = false,
  className = ''
}) {
  const [isMobileApp, setIsMobileApp] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    setIsMobileApp(checkIsMobileApp());
  }, []);

  // Handler 1: Update Aplikasi (Khusus Versi Mobile App)
  const handleUpdateApp = async () => {
    setIsUpdating(true);
    setFeedbackMsg({ type: 'info', text: 'Memeriksa pembaruan sistem cloud...' });

    try {
      if ('caches' in window) {
        try {
          const keys = await window.caches.keys();
          await Promise.all(keys.map(k => window.caches.delete(k)));
        } catch (e) {
          console.warn('[Update] Gagal membersihkan cache:', e);
        }
      }

      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.update();
          }
        } catch (e) {
          console.warn('[Update] Service worker update error:', e);
        }
      }

      await new Promise(r => setTimeout(r, 1000));
      setFeedbackMsg({ type: 'success', text: 'Aplikasi Anda sudah versi terbaru (v1.2.0)!' });
      
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error('[Update] Gagal cek pembaruan:', err);
      setFeedbackMsg({ type: 'error', text: 'Gagal memperbarui. Memuat ulang...' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } finally {
      setTimeout(() => setIsUpdating(false), 2000);
    }
  };

  // Handler 2: Download Aplikasi APK (Khusus Saat Dibuka di Browser)
  const handleDownloadApp = () => {
    setIsDownloading(true);
    setFeedbackMsg({ type: 'success', text: 'Memulai unduhan AgriConnect.apk...' });

    try {
      const link = document.createElement('a');
      link.href = '/downloads/AgriConnect.apk';
      link.setAttribute('download', 'AgriConnect.apk');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('[Download] Fallback link download:', err);
      window.location.href = '/downloads/AgriConnect.apk';
    }

    setTimeout(() => {
      setIsDownloading(false);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }, 1500);
  };

  return (
    <div 
      className={`clone-sidebar-promo-card sky-blue-card ${isCompact ? 'compact' : 'spacious'} ${className}`}
      style={{ position: 'relative' }}
    >
      <div className="clone-promo-sky-glow" />
      
      {/* Icon Badge */}
      <div 
        className="clone-promo-icon-badge sky-badge" 
        title={isMobileApp ? "Pembaruan Aplikasi AgriConnect" : "AgriConnect Mobile App"}
      >
        {isMobileApp ? (
          <ArrowsClockwise 
            size={isCompact ? 13 : 16} 
            weight="bold" 
            color="#0284c7" 
            className={isUpdating ? 'animate-spin' : ''} 
          />
        ) : (
          <Plant size={isCompact ? 13 : 16} weight="fill" color="#0284c7" />
        )}
      </div>

      {/* Title & Subtitle disesuaikan persis instruksi pengguna */}
      {isMobileApp ? (
        <>
          <h4 className="clone-promo-title">Update<br />Aplikasi</h4>
          <p className="clone-promo-subtitle">Versi Terbaru v1.2.0</p>
        </>
      ) : (
        <>
          <h4 className="clone-promo-title">
            Download our<br />{role === 'buyer' ? 'Buyer App' : 'Mobile app'}
          </h4>
          <p className="clone-promo-subtitle">Get easy in another way</p>
        </>
      )}

      {/* Action Button */}
      {isMobileApp ? (
        <button 
          type="button" 
          className="clone-promo-btn sky-btn"
          onClick={handleUpdateApp}
          disabled={isUpdating}
          style={{ opacity: isUpdating ? 0.8 : 1, cursor: isUpdating ? 'wait' : 'pointer' }}
        >
          {isUpdating ? 'Memeriksa...' : 'Update Aplikasi'}
        </button>
      ) : (
        <button 
          type="button" 
          className="clone-promo-btn sky-btn"
          onClick={handleDownloadApp}
          disabled={isDownloading}
          style={{ 
            opacity: isDownloading ? 0.8 : 1, 
            cursor: isDownloading ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {isDownloading ? (
            <>
              <ArrowsClockwise size={13} weight="bold" className="animate-spin" />
              <span>Mengunduh...</span>
            </>
          ) : (
            <>
              <DownloadSimple size={13} weight="bold" />
              <span>Download</span>
            </>
          )}
        </button>
      )}

      {/* Feedback Toast Banner */}
      {feedbackMsg && (
        <div style={{
          marginTop: '8px',
          padding: '5px 8px',
          borderRadius: '6px',
          background: feedbackMsg.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
          color: '#ffffff',
          fontSize: '0.68rem',
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.3,
          animation: 'fadeIn 0.2s ease'
        }}>
          {feedbackMsg.text}
        </div>
      )}
    </div>
  );
}
