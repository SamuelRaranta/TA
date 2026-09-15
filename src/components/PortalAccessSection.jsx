import React from 'react';
import { Plant, Buildings, ArrowRight, ShieldCheck } from '@phosphor-icons/react';

export default function PortalAccessSection({ 
  onOpenFarmerDashboard, 
  onOpenBuyerDashboard,
  onOpenAdminDashboard
}) {
  return (
    <section 
      id="portal-akses"
      style={{
        padding: '5rem 0 4rem 0',
        backgroundColor: 'var(--bg-canvas-subtle)',
        borderTop: '1px solid var(--border-subtle)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{
            fontSize: '0.76rem',
            fontWeight: 750,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-primary)',
            background: 'rgba(84, 82, 246, 0.08)',
            border: '1px solid rgba(84, 82, 246, 0.18)',
            padding: '5px 14px',
            borderRadius: '9999px',
            display: 'inline-block',
            marginBottom: '0.85rem'
          }}>
            Akses Langsung Dashboard
          </span>
          <h2 style={{ 
            fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', 
            fontWeight: 800, 
            color: 'var(--text-primary)', 
            margin: '0 0 0.6rem 0',
            letterSpacing: '-0.025em'
          }}>
            Pilih Portal Sesuai Peran Anda
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '0.95rem', 
            maxWidth: '580px', 
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Masuk langsung ke dashboard khusus untuk mengelola komoditas panen, penawaran harga, pengadaan pasokan, dan pengawasan operasional platform.
          </p>
        </div>

        {/* Portal Cards Grid (3 Columns: Petani, Pembeli, Admin) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1180px',
          margin: '0 auto'
        }}>
          {/* Card 1: Portal Petani */}
          <div 
            onClick={onOpenFarmerDashboard}
            style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1.5px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              padding: '1.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.08)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 16px 36px rgba(16, 185, 129, 0.18)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}>
                  <Plant size={28} weight="fill" />
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Petani & Gapoktan
                </span>
              </div>

              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: 800, 
                color: 'var(--text-primary)', 
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                Portal Petani
              </h3>
              <p style={{ 
                fontSize: '0.86rem', 
                color: 'var(--text-secondary)', 
                lineHeight: 1.6, 
                margin: 0 
              }}>
                Kelola komoditas hasil panen, monitor penawaran harga dari pembeli, pantau pergerakan harga pasar, dan buat kesepakatan binding agreement.
              </p>
            </div>

            <div style={{
              marginTop: '1.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <span style={{
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                Buka Dashboard Petani
                <ArrowRight size={15} weight="bold" />
              </span>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <ArrowRight size={14} weight="bold" />
              </div>
            </div>
          </div>

          {/* Card 2: Portal Pembeli */}
          <div 
            onClick={onOpenBuyerDashboard}
            style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1.5px solid rgba(84, 82, 246, 0.3)',
              borderRadius: '20px',
              padding: '1.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(84, 82, 246, 0.08)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 16px 36px rgba(84, 82, 246, 0.18)';
              e.currentTarget.style.borderColor = '#5452f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(84, 82, 246, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(84, 82, 246, 0.3)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(84, 82, 246, 0.15) 0%, rgba(59, 130, 246, 0.25) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5452f6'
                }}>
                  <Buildings size={28} weight="fill" />
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#5452f6',
                  background: 'rgba(84, 82, 246, 0.12)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Pembeli & Industri
                </span>
              </div>

              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: 800, 
                color: 'var(--text-primary)', 
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                Portal Pembeli
              </h3>
              <p style={{ 
                fontSize: '0.86rem', 
                color: 'var(--text-secondary)', 
                lineHeight: 1.6, 
                margin: 0 
              }}>
                Cari komoditas hasil panen petani, ajukan penawaran harga dan tonase, pantau status penawaran, serta kelola tagihan & rekening bersama escrow.
              </p>
            </div>

            <div style={{
              marginTop: '1.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <span style={{
                color: '#5452f6',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                Buka Dashboard Pembeli
                <ArrowRight size={15} weight="bold" />
              </span>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(84, 82, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5452f6'
              }}>
                <ArrowRight size={14} weight="bold" />
              </div>
            </div>
          </div>

          {/* Card 3: Portal Admin (Seragam dengan Card 1 & 2) */}
          <div 
            onClick={onOpenAdminDashboard}
            style={{
              background: 'var(--card-bg, #ffffff)',
              border: '1.5px solid rgba(84, 82, 246, 0.3)',
              borderRadius: '20px',
              padding: '1.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(84, 82, 246, 0.08)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 16px 36px rgba(84, 82, 246, 0.18)';
              e.currentTarget.style.borderColor = '#5452f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(84, 82, 246, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(84, 82, 246, 0.3)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(84, 82, 246, 0.15) 0%, rgba(59, 130, 246, 0.25) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5452f6'
                }}>
                  <ShieldCheck size={28} weight="fill" />
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#5452f6',
                  background: 'rgba(84, 82, 246, 0.12)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Administrator
                </span>
              </div>

              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: 800, 
                color: 'var(--text-primary)', 
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                Portal Admin
              </h3>
              <p style={{ 
                fontSize: '0.86rem', 
                color: 'var(--text-secondary)', 
                lineHeight: 1.6, 
                margin: 0 
              }}>
                Pengawasan platform terpusat, verifikasi legalitas KYC pengguna, pengelolaan rekening bersama escrow, dan mediasi sengketa komoditas nasional.
              </p>
            </div>

            <div style={{
              marginTop: '1.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <span style={{
                color: '#5452f6',
                fontWeight: 750,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                Buka Dashboard Admin
                <ArrowRight size={15} weight="bold" />
              </span>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(84, 82, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5452f6'
              }}>
                <ArrowRight size={14} weight="bold" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
