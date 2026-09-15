import React, { useState } from 'react';
import { 
  Plant, 
  ArrowRight,
  List,
  X,
  CaretDown,
  Sun,
  Moon,
  Buildings,
  ShieldCheck
} from '@phosphor-icons/react';

export default function GlassNavbar({ 
  onOpenLogin, 
  onOpenSignup, 
  onOpenFarmerDashboard,
  onOpenBuyerDashboard,
  onOpenAdminDashboard,
  theme, 
  onToggleTheme 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      backgroundColor: 'var(--nav-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      <div className="container">
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '76px'
        }}>
          {/* Brand Logo */}
          <a 
            href="#" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.65rem', 
              textDecoration: 'none',
              color: 'var(--text-primary)' 
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)'
            }}>
              <Plant size={22} weight="fill" color="#ffffff" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.28rem', letterSpacing: '-0.03em' }}>
              Agri<span style={{ color: 'var(--accent-primary)' }}>Connect</span>
            </div>
          </a>

          {/* Desktop Navigation Links (Reordered & Refined Font Size) */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.75rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
            className="desktop-nav"
          >
            {/* 1. Harga Pasar */}
            <a 
              href="#harga-pasar" 
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Harga Pasar
            </a>

            {/* 2. Keunggulan */}
            <a 
              href="#keunggulan" 
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Keunggulan
            </a>

            {/* 3. Jelajahi Komoditas */}
            <a 
              href="#komoditas" 
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Jelajahi Komoditas
            </a>

            {/* 4. Alur Binding */}
            <a 
              href="#alur-binding" 
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Alur Binding
            </a>
          </div>

          {/* Right Action: Dark/Light Mode Toggle + Sign In + Primary Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            
            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? (
                <Sun size={20} weight="bold" color="#fbbf24" />
              ) : (
                <Moon size={20} weight="bold" color="#475569" />
              )}
            </button>

            {/* Sign in text button */}
            <button
              type="button"
              onClick={onOpenLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.5rem 0.25rem'
              }}
              className="desktop-nav"
            >
              Masuk
            </button>

            {/* Primary Pill Button */}
            <button
              onClick={onOpenSignup}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.35rem',
                minHeight: '44px',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              <span>Masuk / Daftar</span>
              <span className="btn-circle-icon">
                <ArrowRight size={13} weight="bold" />
              </span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px'
              }}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '1.25rem 0',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: 'var(--bg-canvas)'
            }}
          >
            <a 
              href="#harga-pasar" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 600 }}
            >
              Harga Pasar
            </a>
            <a 
              href="#keunggulan" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 600 }}
            >
              Keunggulan
            </a>
            <a 
              href="#komoditas" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 600 }}
            >
              Jelajahi Komoditas
            </a>
            <a 
              href="#alur-binding" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 600 }}
            >
              Alur Binding
            </a>

            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); onOpenFarmerDashboard(); }}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%'
              }}
            >
              <Plant size={18} weight="bold" />
              <span>Buka Dashboard Petani</span>
            </button>

            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); onOpenBuyerDashboard(); }}
              style={{
                background: 'rgba(84, 82, 246, 0.12)',
                border: '1px solid rgba(84, 82, 246, 0.3)',
                color: '#5452f6',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%'
              }}
            >
              <Buildings size={18} weight="bold" />
              <span>Buka Dashboard Pembeli</span>
            </button>

            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); onOpenAdminDashboard(); }}
              style={{
                background: '#0e1424',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%'
              }}
            >
              <ShieldCheck size={18} weight="fill" />
              <span>Buka Dashboard Admin</span>
            </button>

            {/* Mobile Auth Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
                className="btn btn-outline"
                style={{ flex: 1, minHeight: '42px', fontSize: '0.9rem' }}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); onOpenSignup(); }}
                className="btn btn-primary"
                style={{ flex: 1, minHeight: '42px', fontSize: '0.9rem' }}
              >
                Daftar
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 890px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
