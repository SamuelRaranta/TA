import React from 'react';
import { TrendUp, TrendDown, Equals, Clock, Building } from '@phosphor-icons/react';

const BENCHMARKS = [
  {
    commodity: 'Cengkeh Zanzibar Kering Langowan',
    price: 125000,
    unit: 'kg',
    change: '+2.4%',
    trend: 'up',
    source: 'ASPEKINDO Minahasa'
  },
  {
    commodity: 'Kopra Putih Kering Kombi (KA 6%)',
    price: 13800,
    unit: 'kg',
    change: '+1.8%',
    trend: 'up',
    source: 'Distanbun Minahasa'
  },
  {
    commodity: 'Beras Superwin Tondano',
    price: 15200,
    unit: 'kg',
    change: '+0.7%',
    trend: 'up',
    source: 'Pasar Kawangkoan'
  },
  {
    commodity: 'Jagung Kuning Pipil Kakas',
    price: 5400,
    unit: 'kg',
    change: '-0.5%',
    trend: 'down',
    source: 'Bapanas Sulut'
  },
  {
    commodity: 'Cabai Rawit Merah (Rica Minahasa)',
    price: 48500,
    unit: 'kg',
    change: '+4.2%',
    trend: 'up',
    source: 'Hortikultura Modoinding'
  },
  {
    commodity: 'Kentang Granola Modoinding',
    price: 14500,
    unit: 'kg',
    change: '0.0%',
    trend: 'neutral',
    source: 'Pasar Langowan'
  },
  {
    commodity: 'Biji Pala Kupas ABCD Sonder',
    price: 105000,
    unit: 'kg',
    change: '+1.2%',
    trend: 'up',
    source: 'Sentra Pala Sonder'
  }
];

const TRUSTED_INSTITUTIONS = [
  'Dinas Pertanian Minahasa',
  'Bapanas Sulut',
  'ASPEKINDO Minahasa',
  'Pasar Tradisional Langowan',
  'Sentra Hortikultura Modoinding'
];

export default function MarketPriceTicker() {
  return (
    <section id="harga-pasar" style={{ padding: '3rem 0 4rem 0', backgroundColor: 'var(--bg-canvas)', transition: 'background-color 0.3s ease' }}>
      <div className="container">
        
        {/* Trusted By / Institutional Benchmark Strip */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            marginBottom: '1.25rem'
          }}>
            SUMBER ACUAN HARGA & MITRA KOMODITAS RESMI
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '2.5rem',
            opacity: 0.85
          }}>
            {TRUSTED_INSTITUTIONS.map((inst, idx) => (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)'
                }}
              >
                <Building size={18} weight="bold" color="var(--text-muted)" />
                <span>{inst}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Benchmark Price Cards Row */}
        <div style={{
          background: 'var(--bg-canvas-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)'
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                HARGA ACUAN PASAR HARI INI
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                • Referensi Negosiasi Terverifikasi Admin
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} />
              Update: Hari ini, 08:30 WIB
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem'
          }}>
            {BENCHMARKS.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-surface-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.source}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: item.trend === 'up' ? '#10b981' : item.trend === 'down' ? '#ef4444' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {item.trend === 'up' && <TrendUp size={12} weight="bold" />}
                    {item.trend === 'down' && <TrendDown size={12} weight="bold" />}
                    {item.trend === 'neutral' && <Equals size={12} weight="bold" />}
                    {item.change}
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.commodity}
                </div>

                <div style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }} className="tabular-data">
                  Rp {item.price.toLocaleString('id-ID')}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>/{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
