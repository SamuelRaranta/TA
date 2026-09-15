import React, { useState } from 'react';
import { 
  CheckCircle, 
  ArrowRight,
  FileLock,
  Plant,
  TrendUp
} from '@phosphor-icons/react';

export default function BindingFlowSection({ onOpenSimulation }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section id="alur-binding" style={{ padding: '6rem 0', backgroundColor: 'var(--bg-canvas)', borderTop: '1px solid var(--border-subtle)', transition: 'background-color 0.3s ease' }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: '4rem',
          alignItems: 'center'
        }} className="split-growth-grid">
          
          {/* SISI KIRI: White Dashboard Mockup matching Reference Image Bottom Left */}
          <div style={{
            background: 'var(--bg-surface-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-dashboard)',
            padding: '1.75rem',
            transition: 'background-color 0.3s ease, border-color 0.3s ease'
          }}>
            
            {/* Top Navigation Tabs matching Reference ("Overview", "Tasks", "Analytics", "Files", "Settings") */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  style={{
                    background: activeTab === 'overview' ? 'var(--accent-primary-light)' : 'transparent',
                    color: activeTab === 'overview' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  style={{
                    background: activeTab === 'tasks' ? 'var(--accent-primary-light)' : 'transparent',
                    color: activeTab === 'tasks' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  8 Binding Deals
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  style={{
                    background: activeTab === 'analytics' ? 'var(--accent-primary-light)' : 'transparent',
                    color: activeTab === 'analytics' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Analytics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('files')}
                  style={{
                    background: activeTab === 'files' ? 'var(--accent-primary-light)' : 'transparent',
                    color: activeTab === 'files' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Dokumen Kontrak
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  style={{
                    background: activeTab === 'settings' ? 'var(--accent-primary-light)' : 'transparent',
                    color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Settings
                </button>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-canvas-subtle)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                This Month ▾
              </span>
            </div>

            {/* Performance Title */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>Kinerja Platform & Realisasi Pasokan</div>
            </div>

            {/* 3 Metric Cards with Wave Sparklines matching Reference Image exactly */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              {/* Card 1: Blue Wave */}
              <div style={{ background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Volume Terikat</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }} className="tabular-data">14.800 T</div>
                <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>+18.2% bln ini</div>
                
                {/* Blue Sparkline Wave */}
                <div style={{ height: '32px', width: '100%' }}>
                  <svg viewBox="0 0 100 32" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <path d="M 0,25 Q 25,5 50,20 T 100,10" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Green Wave */}
              <div style={{ background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Realisasi Sukses</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }} className="tabular-data">98.4%</div>
                <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>+7.4% on track</div>
                
                {/* Green Sparkline Wave */}
                <div style={{ height: '32px', width: '100%' }}>
                  <svg viewBox="0 0 100 32" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <path d="M 0,20 Q 30,28 60,10 T 100,15" fill="none" stroke="#10b981" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Orange/Amber Wave */}
              <div style={{ background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Kapasitas Gudang</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0' }} className="tabular-data">68%</div>
                <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700, marginBottom: '6px' }}>Tersedia 4.200 T</div>
                
                {/* Amber Sparkline Wave */}
                <div style={{ height: '32px', width: '100%' }}>
                  <svg viewBox="0 0 100 32" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <path d="M 0,15 Q 35,5 70,25 T 100,12" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Projects + Team Activity matching Reference */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: '1rem'
            }}>
              {/* Recent Projects */}
              <div style={{ background: 'var(--bg-canvas-subtle)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Projects</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 600 }}>View all</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <span>Cengkeh Langowan 10 Ton</span>
                    <span style={{ color: '#10b981' }}>Lolos Cek Fisik</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <span>Jagung Kakas 50 Ton</span>
                    <span style={{ color: 'var(--accent-primary)' }}>Binding Terkunci</span>
                  </div>
                </div>
              </div>

              {/* Team Activity */}
              <div style={{ background: 'var(--bg-canvas-subtle)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Team Activity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700 }}>
                    JC
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>Jane Cooper</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mengonfirmasi verifikasi 2m ago</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* SISI KANAN: Text + 4 Checkmarks + Blue CTA Button matching Reference */}
          <div>
            {/* Pill Badge matching Reference "[ BUILT FOR GROWTH ]" */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span className="pill-badge" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                BUILT FOR GROWTH
              </span>
            </div>

            {/* Headline matching Reference "Scale Your Business Without Limits" */}
            <h2 style={{
              fontSize: 'clamp(2.2rem, 3.5vw, 3rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '1.25rem',
              letterSpacing: '-0.04em',
              lineHeight: 1.15
            }}>
              Scale Your Commodity Trade{' '}
              <span style={{ color: 'var(--accent-primary)' }}>
                Without Limits
              </span>
            </h2>

            {/* Subtext */}
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              marginBottom: '2rem'
            }}>
              AgriConnect tumbuh bersama Anda. Baik Anda kelompok tani mandiri maupun korporasi distributor pangan skala nasional, platform kami dirancang untuk kepastian transaksi.
            </p>

            {/* 4 Blue Checkmarks matching Reference */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={20} color="var(--accent-primary)" weight="fill" />
                <span style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Scalable untuk volume panen tonase berapapun
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={20} color="var(--accent-primary)" weight="fill" />
                <span style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Keamanan kontrak dengan verifikasi legalitas KYC
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={20} color="var(--accent-primary)" weight="fill" />
                <span style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  99.9% kepastian komitmen binding tanpa ingkar janji
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={20} color="var(--accent-primary)" weight="fill" />
                <span style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Dukungan mediasi dan pendampingan transaksi 24/7
                </span>
              </div>
            </div>

            {/* Primary Blue Pill Button with Circular White Arrow */}
            <button
              onClick={onOpenSimulation}
              className="btn btn-primary"
              style={{
                fontSize: '0.98rem',
                padding: '0.8rem 1.8rem',
                fontWeight: 600,
                borderRadius: '9999px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
            >
              <span>Mulai Buat Penawaran Binding</span>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px'
              }}>
                <ArrowRight size={13} weight="bold" />
              </span>
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .split-growth-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }
      `}</style>
    </section>
  );
}
