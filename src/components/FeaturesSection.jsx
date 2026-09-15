import React from 'react';
import { 
  FolderSimple,
  UsersThree,
  ChartLineUp,
  Clock,
  Lightning,
  PuzzlePiece,
  ArrowRight
} from '@phosphor-icons/react';

const FEATURES_DATA = [
  {
    icon: FolderSimple,
    title: 'Manajemen Listing Panen',
    desc: 'Petani mendaftarkan komoditas dengan kuantitas skala besar, grade mutu teruji, dan jadwal ketersediaan panen yang transparan.',
    linkText: 'Pelajari listing'
  },
  {
    icon: UsersThree,
    title: 'Penawaran & Negosiasi Dua Arah',
    desc: 'Pembeli dapat mengajukan penawaran kuantitas dan harga secara langsung. Petani dapat menerima, menolak, atau memberi counter-offer.',
    linkText: 'Pelajari negosiasi'
  },
  {
    icon: ChartLineUp,
    title: 'Acuan Harga Pasar Terkini',
    desc: 'Integrasi data harga harian dari PIHPS Nasional dan pasar induk sebagai acuan objektif untuk menegosiasikan harga yang adil.',
    linkText: 'Lihat data pasar'
  },
  {
    icon: Clock,
    title: 'Jadwal Pengecekan Fisik',
    desc: 'Atur jadwal kunjungan tim inspeksi pembeli ke gudang petani secara resmi untuk memastikan kesesuaian kadar air dan mutu barang.',
    linkText: 'Alur inspeksi'
  },
  {
    icon: Lightning,
    title: 'Digital Binding Agreement',
    desc: 'Sistem otomatis mengunci kesepakatan tertulis digital untuk mencegah pembatalan sepihak dan melindungi kedua belah pihak.',
    linkText: 'Cara kerja binding'
  },
  {
    icon: PuzzlePiece,
    title: 'Transaksi Langsung Bebas Makelar',
    desc: 'Pelunasan diselesaikan langsung antar rekening pihak terkait tanpa potongan komisi perantara atau penahanan dana tidak perlu.',
    linkText: 'Panduan transaksi'
  }
];

export default function FeaturesSection({ onOpenSimulation }) {
  return (
    <section id="keunggulan" style={{ padding: '5.5rem 0', backgroundColor: 'var(--bg-canvas)', position: 'relative', transition: 'background-color 0.3s ease' }}>
      
      {/* Subtle connecting grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.6,
        pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span className="pill-badge" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              FEATURES
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.2vw, 2.75rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.85rem',
            letterSpacing: '-0.035em'
          }}>
            Everything You Need to{' '}
            <span style={{ color: 'var(--accent-primary)' }}>
              Succeed
            </span>
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Fitur tangguh yang dibangun khusus untuk memperlancar rantai pasok komoditas pertanian dan memberikan hasil nyata.
          </p>
        </div>

        {/* 6 Cards in 3x2 Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.75rem'
        }} className="features-grid-3x2">
          {FEATURES_DATA.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="saas-card"
                style={{
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease'
                }}
              >
                <div>
                  {/* Rounded Icon Box with Light Blue Background */}
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'var(--accent-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--accent-primary-border)'
                  }}>
                    <Icon size={24} color="var(--accent-primary)" weight="fill" />
                  </div>

                  <h3 style={{
                    fontSize: '1.18rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '0.65rem',
                    letterSpacing: '-0.02em'
                  }}>
                    {item.title}
                  </h3>

                  <p style={{
                    fontSize: '0.92rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: '1.5rem'
                  }}>
                    {item.desc}
                  </p>
                </div>

                {/* Learn more Link */}
                <button
                  type="button"
                  onClick={onOpenSimulation}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: 0,
                    transition: 'gap 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.gap = '10px'}
                  onMouseLeave={(e) => e.currentTarget.style.gap = '6px'}
                >
                  <span>Learn more</span>
                  <ArrowRight size={15} weight="bold" />
                </button>
              </div>
            );
          })}
        </div>

      </div>

      <style>{`
        @media (max-width: 960px) {
          .features-grid-3x2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
