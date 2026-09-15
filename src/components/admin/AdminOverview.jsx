import React, { useState } from 'react';
import { 
  CurrencyDollar, 
  ShieldCheck, 
  Users, 
  FileText, 
  ArrowUp, 
  CheckCircle, 
  Clock, 
  Warning, 
  Eye, 
  ArrowRight,
  CaretRight,
  Sparkle,
  Truck,
  Package,
  HandCoins,
  ShieldWarning
} from '@phosphor-icons/react';
import { 
  PLATFORM_OVERVIEW_METRICS, 
  ADMIN_CHART_SPLINE_DATA, 
  INITIAL_ESCROW_TRANSACTIONS, 
  INITIAL_KYC_VERIFICATIONS 
} from './adminMockData';

export default function AdminOverview({ onNavigate }) {
  const [activeTimeframe, setActiveTimeframe] = useState('30d');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // SVG Spline chart calculations for Radiant Gold curve
  const chartWidth = 620;
  const chartHeight = 170;
  const paddingX = 40;
  const paddingY = 25;

  const points = ADMIN_CHART_SPLINE_DATA.map((d, i) => {
    const x = paddingX + (i / (ADMIN_CHART_SPLINE_DATA.length - 1)) * (chartWidth - paddingX * 2);
    // Min GMV 7, Max 16
    const y = chartHeight - paddingY - ((d.gmv - 7) / (16 - 7)) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  // Catmull-rom / cubic spline SVG path generator
  const createSmoothPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i != pts.length - 2 ? pts[i + 2] : p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const splinePath = createSmoothPath(points);
  const areaPath = `${splinePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.65rem' }}>
      
      {/* 1. Header Banner Operasional */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #161f33 0%, #101524 100%)',
          border: '1px solid rgba(245, 158, 11, 0.22)',
          borderRadius: '18px',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{
              background: 'rgba(245, 158, 11, 0.18)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              PLATFORM OPERATIONS HQ
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>• WIB Live Gateway</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            Pusat Pengawasan Operasional <span style={{ color: '#fbbf24' }}>AgriConnect</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
            Pantau arus dana rekening bersama escrow, verifikasi identitas legalitas KYC, dan kelancaran alur komoditas nasional.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button 
            type="button" 
            className="admin-btn-secondary"
            onClick={() => onNavigate('kyc')}
          >
            <Users size={16} weight="bold" />
            <span>Review 5 KYC Pending</span>
          </button>
          <button 
            type="button" 
            className="admin-btn-primary"
            onClick={() => onNavigate('escrow')}
          >
            <HandCoins size={17} weight="bold" />
            <span>Rilis Dana Escrow</span>
          </button>
        </div>
      </div>

      {/* 2. Urgent Attention Alert Box (Gold / Amber border) */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1.5px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '14px',
        padding: '1rem 1.35rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
            flexShrink: 0
          }}>
            <ShieldWarning size={22} weight="fill" />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fef08a' }}>
              Tindakan Mendesak Hari Ini: 2 Escrow Siap Dicairkan (Rp 891.000.000)
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
              Surat timbang gudang tujuan telah terbit dan diverifikasi petugas lapangan. Menunggu persetujuan Super Admin.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('escrow')}
          style={{
            background: '#fbbf24',
            color: '#0b0f19',
            border: 'none',
            borderRadius: '8px',
            padding: '0.45rem 1rem',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>Eksekusi Rilis Dana</span>
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>

      {/* 3. Four Core KPI Cards (Obsidian Dark with Gold Accents) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* Card 1: Total GMV */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total GMV Platform
            </span>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CurrencyDollar size={20} weight="bold" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            {PLATFORM_OVERVIEW_METRICS.totalGmv}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
            <ArrowUp size={13} weight="bold" />
            <span>{PLATFORM_OVERVIEW_METRICS.totalGmvTrend}</span>
          </div>
        </div>

        {/* Card 2: Escrow Holding */}
        <div className="admin-card" style={{ borderLeft: '3.5px solid #fbbf24' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Dana Escrow Tertahan
            </span>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.22)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} weight="fill" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fef08a', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            {PLATFORM_OVERVIEW_METRICS.escrowHolding}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {PLATFORM_OVERVIEW_METRICS.escrowHoldingSub}
          </div>
        </div>

        {/* Card 3: Pending KYC Verifications */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Antrean Verifikasi KYC
            </span>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} weight="bold" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            {PLATFORM_OVERVIEW_METRICS.pendingVerifications} Pengajuan
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            3 Kelompok Tani • 2 Industri Pembeli
          </div>
        </div>

        {/* Card 4: Active Binding Agreements */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Kontrak Binding Berjalan
            </span>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} weight="bold" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            {PLATFORM_OVERVIEW_METRICS.activeBindings} Kontrak
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Total Volume: <strong style={{ color: '#34d399' }}>{PLATFORM_OVERVIEW_METRICS.totalVolumeTon}</strong>
          </div>
        </div>

      </div>

      {/* 4. Center Grid: Radiant Gold Spline Chart + Urgent Queue */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1.15fr)',
        gap: '1.5rem'
      }}>
        
        {/* Left Widget: Perputaran Nilai Transaksi Platform (Radiant Gold Spline) */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">
                <Sparkle size={18} color="#fbbf24" weight="fill" />
                Tren Perputaran Nilai GMV Platform (Miliar Rupiah)
              </h3>
              <div className="admin-card-subtitle">
                Grafik pertumbuhan akumulasi transaksi komoditas terserap melalui platform
              </div>
            </div>

            {/* Timeframe selector */}
            <div style={{ display: 'flex', gap: '4px', background: '#0d121e', padding: '3px', borderRadius: '8px' }}>
              {['1d', '7d', '30d', '16m', 'Max'].map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setActiveTimeframe(tf)}
                  style={{
                    background: activeTimeframe === tf ? '#fbbf24' : 'transparent',
                    color: activeTimeframe === tf ? '#0b0f19' : '#94a3b8',
                    border: 'none',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Spline Graph with Gold Gradient & Glow */}
          <div style={{ position: 'relative', width: '100%', height: '180px', marginTop: '0.5rem' }}>
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="goldGradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.38" />
                  <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#0b0f19" stopOpacity="0" />
                </linearGradient>
                <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Lines */}
              {[40, 80, 120, 160].map((y) => (
                <line 
                  key={y} 
                  x1={paddingX} 
                  y1={y} 
                  x2={chartWidth - paddingX} 
                  y2={y} 
                  stroke="rgba(245, 158, 11, 0.08)" 
                  strokeDasharray="3 3" 
                />
              ))}

              {/* Area Fill */}
              <path d={areaPath} fill="url(#goldGradientArea)" />

              {/* Glowing Spline Line */}
              <path 
                d={splinePath} 
                fill="none" 
                stroke="#fbbf24" 
                strokeWidth="3.5" 
                filter="url(#goldGlow)" 
                strokeLinecap="round" 
              />

              {/* Interactive Data Dots */}
              {points.map((pt, idx) => (
                <g 
                  key={idx} 
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r={hoveredPoint?.month === pt.month ? 7 : 4.5} 
                    fill="#0b0f19" 
                    stroke="#fbbf24" 
                    strokeWidth="2.5" 
                  />
                  {/* Month Label */}
                  <text 
                    x={pt.x} 
                    y={chartHeight - 4} 
                    textAnchor="middle" 
                    fill="#94a3b8" 
                    fontSize="10" 
                    fontWeight="700"
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div 
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '15px',
                  background: '#0d121e',
                  border: '1px solid #fbbf24',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 10px rgba(245, 158, 11, 0.2)'
                }}
              >
                <div style={{ color: '#fbbf24', fontWeight: 800 }}>Bulan {hoveredPoint.month} 2026</div>
                <div>GMV: <strong>Rp {hoveredPoint.gmv} Miliar</strong></div>
                <div style={{ color: '#94a3b8' }}>Volume: {hoveredPoint.volume} Ton ({hoveredPoint.transactions} Kontrak)</div>
              </div>
            )}
          </div>

          <div style={{
            marginTop: 'auto',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#94a3b8'
          }}>
            <span>Tingkat Keberhasilan Pengadaan: <strong style={{ color: '#34d399' }}>99.4%</strong></span>
            <span>Rata-rata Waktu Transaksi: <strong style={{ color: '#fef08a' }}>2.4 Hari</strong></span>
          </div>
        </div>

        {/* Right Widget: Antrean Escrow & Pencairan Dana Mendesak */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">
                <HandCoins size={18} color="#fbbf24" weight="fill" />
                Antrean Rilis Escrow
              </h3>
              <div className="admin-card-subtitle">
                Pencairan dana ke rekening Poktan Tani
              </div>
            </div>

            <button 
              type="button"
              className="admin-btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
              onClick={() => onNavigate('escrow')}
            >
              Lihat Semua
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {INITIAL_ESCROW_TRANSACTIONS.slice(0, 2).map((esc) => (
              <div 
                key={esc.id}
                style={{
                  background: '#0e1424',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '12px',
                  padding: '0.9rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fbbf24' }}>
                    {esc.contractId}
                  </span>
                  <span className="admin-status-pill warning" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    {esc.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.84rem', fontWeight: 750, color: '#ffffff' }}>
                  {esc.commodity} ({esc.volumeTon} Ton)
                </div>

                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Petani: <strong style={{ color: '#e2e8f0' }}>{esc.farmerName}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.4rem',
                  borderTop: '1px dashed rgba(245, 158, 11, 0.15)',
                  marginTop: '0.2rem'
                }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Net Cair Petani:</span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fef08a' }}>
                    Rp {esc.netPayableToFarmer.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="admin-btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            onClick={() => onNavigate('escrow')}
          >
            <span>Buka Panel Rilis Escrow</span>
            <ArrowRight size={15} weight="bold" />
          </button>
        </div>

      </div>

      {/* 5. Bottom Section: KYC Verification Queue Quick Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">
              <Users size={18} color="#fbbf24" weight="fill" />
              Verifikasi KYC Pengguna Baru Menunggu Persetujuan
            </h3>
            <div className="admin-card-subtitle">
              Pemeriksaan legalitas SK Kelompok Tani dan NIB OSS Pembeli Korporat
            </div>
          </div>

          <button 
            type="button" 
            className="admin-btn-secondary"
            onClick={() => onNavigate('kyc')}
          >
            Buka Modul KYC Lengkap ({INITIAL_KYC_VERIFICATIONS.filter(k => k.status === 'Menunggu Verifikasi').length} Menunggu)
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Pengajuan</th>
                <th>Jenis Akun</th>
                <th>Nama Entitas / Poktan</th>
                <th>PIC & Kontak</th>
                <th>Dokumen Legalitas</th>
                <th>Status</th>
                <th>Aksi Cepat</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_KYC_VERIFICATIONS.filter(k => k.status === 'Menunggu Verifikasi').map((kyc) => (
                <tr key={kyc.id}>
                  <td style={{ fontWeight: 750, color: '#fbbf24' }}>{kyc.id}</td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: kyc.type === 'petani' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: kyc.type === 'petani' ? '#34d399' : '#60a5fa',
                      border: `1px solid ${kyc.type === 'petani' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                    }}>
                      {kyc.type === 'petani' ? 'Petani / Poktan' : 'Pembeli Korporat'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{kyc.name}</td>
                  <td>
                    <div>{kyc.pic}</div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{kyc.phone}</div>
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>
                    <div style={{ color: '#fef08a', fontWeight: 600 }}>{kyc.legalDocs.type}</div>
                    <div style={{ color: '#64748b' }}>No: {kyc.legalDocs.docNumber}</div>
                  </td>
                  <td>
                    <span className="admin-status-pill warning">
                      <Clock size={12} weight="bold" />
                      {kyc.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                      onClick={() => onNavigate('kyc')}
                    >
                      <Eye size={14} weight="bold" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
