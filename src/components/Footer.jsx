import React from 'react';
import { Plant, Buildings, Envelope, Phone, MapPin, ShieldCheck } from '@phosphor-icons/react';

export default function Footer({ 
  onOpenFarmerDashboard, 
  onOpenBuyerDashboard,
  onOpenAdminDashboard 
}) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-canvas)',
      padding: '4.5rem 0 2rem 0',
      position: 'relative',
      zIndex: 1,
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr',
          gap: '2.5rem',
          marginBottom: '3rem'
        }} className="footer-grid">
          
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(84, 82, 246, 0.25)'
              }}>
                <Plant size={20} color="#ffffff" weight="fill" />
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Agri<span style={{ color: 'var(--accent-primary)' }}>Connect</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '290px', marginBottom: '1.5rem' }}>
              Platform B2B digitalisasi rantai pasok agrikultur Indonesia. Menghubungkan langsung kelompok tani dengan pembeli industri melalui sistem kontrak mengikat (Binding Agreement).
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
              <ShieldCheck size={18} weight="fill" />
              Transparansi & Legalitas Terjamin
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Navigasi
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.92rem' }}>
              <li><a href="#harga-pasar" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Harga Pasar Nasional</a></li>
              <li><a href="#keunggulan" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Keunggulan Platform</a></li>
              <li><a href="#komoditas" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Jelajahi Komoditas</a></li>
              <li><a href="#alur-binding" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Alur Kontrak Binding</a></li>
              <li><a href="#faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>FAQ & Pertanyaan Umum</a></li>
            </ul>
          </div>

          {/* User Portals & Services */}
          <div>
            <h4 style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Portal Pengguna
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.92rem' }}>
              <li>
                <button 
                  type="button"
                  onClick={onOpenFarmerDashboard}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer', 
                    fontSize: '0.92rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <Plant size={16} color="#10b981" weight="bold" />
                  <span>Portal Petani</span>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={onOpenBuyerDashboard}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer', 
                    fontSize: '0.92rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#5452f6'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <Buildings size={16} color="#5452f6" weight="bold" />
                  <span>Portal Pembeli</span>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={onOpenAdminDashboard}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer', 
                    fontSize: '0.92rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fbbf24'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <ShieldCheck size={16} color="#fbbf24" weight="bold" />
                  <span>Portal Admin (Ops)</span>
                </button>
              </li>
              <li><a href="#panduan-binding" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Panduan Komitmen Binding</a></li>
              <li><a href="#resolusi-sengketa" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Mediasi Sengketa Transaksi</a></li>
            </ul>
          </div>

          {/* Legal & Contacts */}
          <div>
            <h4 style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kontak & Bantuan
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Envelope size={16} color="var(--accent-primary)" />
                support@agriconnect.id
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="var(--accent-primary)" />
                +62 811-2345-6789
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <MapPin size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                Sentra Niaga Pertanian Indonesia, Jakarta & Surabaya
              </div>
            </div>
          </div>

        </div>

        {/* Legal Disclaimer Box */}
        <div style={{
          padding: '1.1rem 1.4rem',
          background: 'var(--bg-canvas-subtle)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          marginBottom: '2rem'
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>Catatan Hukum & Operasional:</strong> AgriConnect berperan sebagai penghubung (connector) dan platform kesepakatan komitmen penawaran awal (binding agreement). AgriConnect tidak menyediakan armada logistik fisik maupun menampung pembayaran penuh (escrow otomatis). Pengecekan fisik komoditas dan transaksi pelunasan dilakukan langsung antar pihak setelah jadwal kesepakatan disetujui.
        </div>

        {/* Bottom Copyright */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.84rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1.5rem'
        }}>
          <div>
            © 2026 AgriConnect Indonesia. Seluruh hak cipta dilindungi undang-undang.
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <a href="#terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Syarat & Ketentuan</a>
            <a href="#privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Kebijakan Privasi</a>
            <a href="#kyc" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Panduan Verifikasi KYC</a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 540px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
