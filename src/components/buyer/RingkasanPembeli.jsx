import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  TrendUp, 
  TrendDown, 
  Plus, 
  ArrowRight,
  ArrowUp,
  Buildings,
  CheckCircle,
  CurrencyCircleDollar,
  ChartLineUp,
  MagnifyingGlass,
  FileText,
  Handshake,
  Truck,
  Receipt
} from '@phosphor-icons/react';
import { DEFAULT_AVATAR } from '../../lib/constants';

// Catmull-Rom to Cubic Bezier curve path generator for ultra-smooth spline waves
function getBezierPath(points) {
  if (!points || points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function BuyerCloneOverview({ 
  onNavigate, 
  marketPrices = [], 
  offers = [], 
  transactions = [],
  proposals = [],
  buyerProfile = null,
  onOpenOfferModal,
  isLoading = false 
}) {
  const displayPrices = marketPrices || [];
  const displayOffers = offers || [];
  const displayTransactions = transactions || [];

  const totalVolumeTon = displayTransactions.reduce((acc, curr) => acc + (Number(curr.volumeTon) || 0), 0);
  const totalSpent = displayTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const uniqueCommoditiesCount = new Set(displayTransactions.map(t => t.productName || t.commodityName).filter(Boolean)).size;
  const activeProposalsCount = (proposals || []).filter(p => p.status === 'Aktif').length || displayOffers.filter(o => o.status === 'Disetujui' || o.status === 'Aktif').length;
  const displayName = buyerProfile?.name ? buyerProfile.name.split(' ')[0] : 'Mitra';

  // 6-Month Procurement Wave Spline Data (Mar s/d Agu)
  const months6Data = [
    { month: 'Mar', trans: 140, ton: 320, date: '12 Mar 2026', blueY: 66, orangeY: 78 },
    { month: 'Apr', trans: 155, ton: 360, date: '10 Apr 2026', blueY: 58, orangeY: 72 },
    { month: 'Mei', trans: 180, ton: 410, date: '21 Mei 2026', blueY: 48, orangeY: 85 },
    { month: 'Jun', trans: 195, ton: 440, date: '16 Jun 2026', blueY: 40, orangeY: 65 },
    { month: 'Jul', trans: 215, ton: 490, date: '24 Jul 2026', blueY: 50, orangeY: 74 },
    { month: 'Agu', trans: 240, ton: 560, date: '14 Agu 2026', blueY: 28, orangeY: 48 },
  ];

  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(5); // Default active at Agu (index 5)
  const [activeTimeframe, setActiveTimeframe] = useState('7d'); // Timeframe filter

  // Spline calculations
  const chartWidth = 360;
  const chartHeight = 98;
  const leftPad = 26;
  const rightPad = 26;
  const stepX = (chartWidth - leftPad - rightPad) / (months6Data.length - 1);

  const bluePoints = months6Data.map((m, i) => ({ x: leftPad + i * stepX, y: m.blueY }));
  const orangePoints = months6Data.map((m, i) => ({ x: leftPad + i * stepX, y: m.orangeY }));

  const bluePath = getBezierPath(bluePoints);
  const orangePath = getBezierPath(orangePoints);
  const lastX = leftPad + (months6Data.length - 1) * stepX;
  const blueArea = `${bluePath} L ${lastX} ${chartHeight + 10} L ${leftPad} ${chartHeight + 10} Z`;
  const orangeArea = `${orangePath} L ${lastX} ${chartHeight + 10} L ${leftPad} ${chartHeight + 10} Z`;

  const activePoint = bluePoints[hoveredMonthIndex] || bluePoints[5];
  const activeOrangePoint = orangePoints[hoveredMonthIndex] || orangePoints[5];

  // Live Real-Time Clock in WIB (Waktu Indonesia Barat - UTC+7)
  const getWibTimeObj = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\./g, ':');

    const date = now.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return { time, date };
  };

  const [currentTimeWIB, setCurrentTimeWIB] = useState(getWibTimeObj);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeWIB(getWibTimeObj());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Datang';
  };
  const greeting = getGreeting();

  return (
    <div className="clone-dashboard-content">
      {/* Header Section with Greeting */}
      <div className="clone-dash-header">
        <div>
          <h1 className="clone-dash-title clone-greeting-title">
            <span className="clone-greeting-blue">{greeting},</span> {isLoading && !buyerProfile?.name ? (
              <span className="agri-skeleton-text" style={{ display: 'inline-block', width: '100px', height: '28px', verticalAlign: 'middle' }} />
            ) : displayName}! 👋
          </h1>
          <p className="clone-dash-subtitle">
            Ringkasan pengadaan komoditas, status penawaran ke kelompok tani, dan jadwal armada muat Anda hari ini.
          </p>
        </div>
        <div className="clone-dash-header-actions">
          <button 
            type="button" 
            className="clone-btn-primary"
            onClick={() => onNavigate ? onNavigate('katalog') : null}
            title="Jelajahi Katalog Komoditas Petani"
          >
            <MagnifyingGlass size={14} weight="bold" />
            <span>Cari Komoditas</span>
          </button>
          <button 
            type="button" 
            className="clone-btn-secondary"
            onClick={() => onNavigate ? onNavigate('transaksi') : null}
            title="Lihat Riwayat Transaksi & Pengadaan"
          >
            <Receipt size={14} weight="bold" />
            <span>Riwayat Pesanan</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards (Cloned Design) */}
      <div className="clone-kpi-grid">
        {/* KPI 1: Total Pembelian (Featured Blue Gradient Card) */}
        <div 
          className="clone-kpi-card solid-purple compact-kpi"
          onClick={() => onNavigate && onNavigate('transaksi')}
          title="Klik untuk melihat total pembelian"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Pembelian</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn white-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('transaksi'); }}
              aria-label="Lihat Total Pembelian"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', color: '#ffffff' }}>
            {isLoading ? (
              <div className="agri-skeleton-pulse" style={{ height: '28px', width: '80px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
            ) : (
              <>
                {totalVolumeTon} <span className="clone-kpi-unit" style={{ marginLeft: '6px', color: 'rgba(255,255,255,0.85)' }}>Ton</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 2: Komoditas Dibeli (White Card) */}
        <div 
          className="clone-kpi-card white-card compact-kpi"
          onClick={() => onNavigate && onNavigate('katalog')}
          title="Klik untuk melihat komoditas yang dibeli"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Komoditas Dibeli</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('katalog'); }}
              aria-label="Buka Katalog Komoditas"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {isLoading ? (
              <div className="agri-skeleton-pulse" style={{ height: '28px', width: '60px', borderRadius: '4px' }} />
            ) : (
              <>
                {uniqueCommoditiesCount} <span className="clone-kpi-unit" style={{ marginLeft: '6px' }}>Komoditas</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 3: Transaksi Saya (White Card) */}
        <div 
          className="clone-kpi-card white-card compact-kpi"
          onClick={() => onNavigate && onNavigate('transaksi')}
          title="Klik untuk melihat riwayat transaksi saya"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Transaksi Saya</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('transaksi'); }}
              aria-label="Buka Transaksi Saya"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {isLoading ? (
              <div className="agri-skeleton-pulse" style={{ height: '28px', width: '60px', borderRadius: '4px' }} />
            ) : (
              <>
                {displayTransactions.length} <span className="clone-kpi-unit" style={{ marginLeft: '6px' }}>Transaksi</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 4: Proposal Saya (White Card) */}
        <div 
          className="clone-kpi-card white-card compact-kpi"
          onClick={() => onNavigate && onNavigate('ajukan-penawaran')}
          title="Klik untuk melihat proposal saya"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Proposal Saya</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('ajukan-penawaran'); }}
              aria-label="Buka Proposal Saya"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {isLoading ? (
              <div className="agri-skeleton-pulse" style={{ height: '28px', width: '60px', borderRadius: '4px' }} />
            ) : (
              <>
                {activeProposalsCount} <span className="clone-kpi-unit" style={{ marginLeft: '6px' }}>Aktif</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3-Column × 2-Row Grid Layout */}
      <div className="clone-widgets-grid">
        
        {/* ================= COLUMN 1 (LEFT) ================= */}
        <div className="clone-widget-col">
          
          {/* Card 1: Procurement Report (6-Month Spline Wave Chart) */}
          <div className="clone-card">
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.45rem' }}>
              <h3 className="clone-card-title">Procurement Volume</h3>
              <span className="clone-card-period-tag">6 Bulan</span>
            </div>

            {/* Spline Wave Chart Container */}
            <div 
              className="clone-spline-container"
              onMouseLeave={() => setHoveredMonthIndex(5)}
            >
              {/* Floating Dark Tooltip Bubble */}
              <div 
                className="clone-spline-tooltip"
                style={{
                  left: `${(activePoint.x / chartWidth) * 100}%`,
                  top: `${Math.max(12, activePoint.y - 12)}px`,
                  transform: hoveredMonthIndex >= 4 ? 'translateX(-85%)' : (hoveredMonthIndex <= 1 ? 'translateX(-15%)' : 'translateX(-50%)')
                }}
              >
                <div className="clone-spline-tooltip-date">{months6Data[hoveredMonthIndex].date}</div>
                <div className="clone-spline-tooltip-row">
                  <span className="clone-spline-tooltip-bar blue" />
                  <span className="clone-spline-tooltip-val">{months6Data[hoveredMonthIndex].ton} Ton</span>
                  <span className="clone-spline-tooltip-lbl">Volume</span>
                </div>
                <div className="clone-spline-tooltip-row">
                  <span className="clone-spline-tooltip-bar orange" />
                  <span className="clone-spline-tooltip-val">{months6Data[hoveredMonthIndex].trans}</span>
                  <span className="clone-spline-tooltip-lbl">Deals</span>
                </div>
              </div>

              {/* SVG Curve Canvas */}
              <svg 
                className="clone-spline-svg" 
                viewBox={`0 0 ${chartWidth} ${chartHeight + 10}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="buyerBlueGrad6" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5452f6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#5452f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="buyerOrangeGrad6" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Vertical Dotted Guideline */}
                {months6Data.map((m, i) => {
                  const x = leftPad + i * stepX;
                  const isSelected = hoveredMonthIndex === i;
                  return (
                    <g key={m.month}>
                      <line 
                        x1={x} 
                        y1={10} 
                        x2={x} 
                        y2={chartHeight} 
                        stroke={isSelected ? '#5452f6' : 'currentColor'} 
                        strokeWidth={isSelected ? 1.2 : 0.6} 
                        strokeDasharray={isSelected ? "3 3" : "2 3"} 
                        opacity={isSelected ? 0.45 : 0.1} 
                      />
                    </g>
                  );
                })}

                {/* Area Gradient Fills */}
                <path d={orangeArea} fill="url(#buyerOrangeGrad6)" />
                <path d={blueArea} fill="url(#buyerBlueGrad6)" />

                {/* Spline Lines */}
                <path 
                  d={orangePath} 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="2.4" 
                  strokeLinecap="round" 
                />
                <path 
                  d={bluePath} 
                  fill="none" 
                  stroke="#5452f6" 
                  strokeWidth="2.8" 
                  strokeLinecap="round" 
                />

                {/* Active Dots on Curves */}
                <circle 
                  cx={activeOrangePoint.x} 
                  cy={activeOrangePoint.y} 
                  r="4" 
                  fill="#f59e0b" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                />
                <circle 
                  cx={activePoint.x} 
                  cy={activePoint.y} 
                  r="5" 
                  fill="#5452f6" 
                  stroke="#ffffff" 
                  strokeWidth="2.5" 
                />
              </svg>

              {/* 6 Months Row on X-Axis */}
              <div className="clone-spline-months-row">
                {months6Data.map((m, i) => (
                  <button
                    key={m.month}
                    type="button"
                    className={`clone-spline-month-btn ${hoveredMonthIndex === i ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredMonthIndex(i)}
                    onClick={() => setHoveredMonthIndex(i)}
                  >
                    {m.month}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Penawaran Terkini */}
          <div className="clone-card" style={{ flex: 1 }}>
            <div className="clone-card-header flex-between">
              <h3 className="clone-card-title">Penawaran Terkini</h3>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('transaksi')}
                title="Buka seluruh daftar penawaran"
              >
                <Plus size={11} weight="bold" />
                <span>Lihat Semua</span>
              </button>
            </div>
            
            {/* List Transaksi: Logo profil, nama Poktan, komoditas, dan total nominal */}
            <div className="clone-members-list">
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0.4rem 0' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="agri-skeleton-pulse" style={{ height: '44px', borderRadius: '8px' }} />
                  ))}
                </div>
              ) : displayTransactions.length === 0 ? (
                <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  Belum ada transaksi pengadaan komoditas.
                </div>
              ) : (
                displayTransactions.slice(0, 3).map((trx, idx) => {
                  const avatarBgs = ['#e0e7ff', '#ecfdf5', '#fef3c7', '#f3e8ff'];
                  const avatarColors = ['#4338ca', '#047857', '#b45309', '#7e22ce'];
                  const initials = (trx.farmerGroup || 'Poktan')
                    .replace('Poktan ', '')
                    .replace('Gapoktan ', '')
                    .replace('Koperasi ', '')
                    .replace('Asosiasi ', '')
                    .split(' ')
                    .map(w => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div 
                      key={trx.id} 
                      className="clone-member-item"
                      onClick={() => onNavigate && onNavigate('transaksi')}
                      style={{ cursor: 'pointer' }}
                      title={`Detail pengadaan ${trx.farmerGroup} - Rp ${(trx.amount || 0).toLocaleString('id-ID')}`}
                    >
                      <img 
                        src={trx.farmerAvatar || DEFAULT_AVATAR} 
                        alt={trx.farmerGroup}
                        className="clone-member-avatar-box"
                        style={{ objectFit: 'cover', borderRadius: '50%' }}
                        onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                      />
                      <div className="clone-member-info">
                        <div className="clone-member-name">{trx.farmerGroup || 'Kelompok Tani'}</div>
                        <div className="clone-member-sub">{trx.productName || trx.commodityName} ({trx.volumeTon || trx.volume || '1'} Ton)</div>
                      </div>
                      <div className="clone-trx-total-badge">
                        Rp {(trx.amount || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* ================= COLUMN 2 (CENTER) ================= */}
        <div className="clone-widget-col">
          
          {/* Card 1: Compact Metric & Timeframe Overview (Total Pengeluaran Pembeli dalam format Rupiah) */}
          <div className="clone-card clone-metric-compact-card">
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.2rem' }}>
              <h3 className="clone-card-title">Total Pengeluaran</h3>
            </div>
            
            {/* Compact Metric Layout */}
            <div className="clone-metric-compact-wrap">
              <div className="clone-metric-compact-amount">
                {isLoading ? (
                  <div className="agri-skeleton-pulse" style={{ height: '28px', width: '130px', borderRadius: '4px' }} />
                ) : (
                  `Rp ${totalSpent.toLocaleString('id-ID')}`
                )}
              </div>
              
              <div className="clone-metric-compact-trend">
                <span className="clone-trend-circle-icon">
                  <ArrowUp size={8} weight="bold" />
                </span>
                <span>+Rp 45.200.000 (+2.5%)</span>
              </div>

              {/* Timeframe Filter Pills: 1d, 7d, 30d, 16m, Max */}
              <div className="clone-metric-compact-timeframes">
                {['1d', '7d', '30d', '16m', 'Max'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`clone-metric-tf-btn ${activeTimeframe === tf ? 'active' : ''}`}
                    onClick={() => setActiveTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Harga Acuan Pasar (Benchmark Komoditas Pembeli) */}
          <div className="clone-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.45rem' }}>
              <h3 className="clone-card-title">Acuan Harga Nasional</h3>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('harga-pasar')}
                title="Buka seluruh data harga pasar"
              >
                <span>Selengkapnya</span>
              </button>
            </div>

            {/* List Harga Acuan Pasar: Nama sumber dan harga dari database */}
            <div className="clone-market-benchmark-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {isLoading && displayPrices.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0.4rem 0' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="agri-skeleton-pulse" style={{ height: '36px', borderRadius: '6px' }} />
                  ))}
                </div>
              ) : displayPrices.length === 0 ? (
                <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  Belum ada data harga pasar acuan.
                </div>
              ) : (
                displayPrices.slice(0, 5).map((item, idx) => {
                  const rawSource = item.source || '';
                  const shortSource = rawSource.includes('ASPEKINDO') ? 'ASPEKINDO' :
                                      rawSource.includes('Distanbun') || rawSource.includes('Dinas Pertanian') ? 'Distanbun Mnh' :
                                      rawSource.includes('Bapanas') || rawSource.includes('Badan Pangan') ? 'Bapanas Sulut' :
                                      rawSource.includes('PIBC') ? 'PIBC Cipinang' :
                                      rawSource.includes('Kawangkoan') ? 'Pasar Kwk' :
                                      rawSource.includes('Langowan') ? 'Pasar Lgw' :
                                      rawSource.includes('Modoinding') ? 'Modoinding' :
                                      rawSource.includes('Sonder') ? 'Sonder Mnh' :
                                      rawSource.length <= 16 ? rawSource :
                                      rawSource.slice(0, 15) + '...';

                  const priceVal = item.marketPrice || 0;

                  return (
                    <div 
                      key={item.id || idx} 
                      className="clone-market-benchmark-item"
                      onClick={() => onNavigate && onNavigate('harga-pasar')}
                      style={{ cursor: 'pointer' }}
                      title={`${item.commodity} - ${shortSource}: Rp ${priceVal.toLocaleString('id-ID')}/${item.unit || 'kg'}`}
                    >
                      <div className="clone-market-source-info">
                        <span className="clone-market-source-name">{shortSource}</span>
                        <span className="clone-market-commodity-name">{item.commodity}</span>
                      </div>
                      <div className="clone-market-price-tag">
                        <span className="clone-market-price-val">Rp {priceVal.toLocaleString('id-ID')}</span>
                        <span className="clone-market-price-unit">/{item.unit || 'kg'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* ================= COLUMN 3 (RIGHT) ================= */}
        <div className="clone-widget-col">
          
          {/* Card 1: Proposal Penawaran ke Poktan - Rapi, Proporsional & Nyaman Dibaca */}
          <div className="clone-card" style={{ padding: '0.85rem 1rem', borderRadius: '16px' }}>
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.75rem' }}>
              <h3 className="clone-card-title" style={{ fontSize: '0.88rem', fontWeight: 700 }}>Proposal Penawaran</h3>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('ajukan-penawaran')}
                title="Buka halaman ajukan penawaran"
                style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px' }}
              >
                <span>Selengkapnya</span>
              </button>
            </div>

            {/* List Penawaran: Nama Komoditas & Harga */}
            <div className="clone-offers-compact-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0.4rem 0' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="agri-skeleton-pulse" style={{ height: '40px', borderRadius: '8px' }} />
                  ))}
                </div>
              ) : displayOffers.length === 0 ? (
                <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  Belum ada proposal penawaran diajukan.
                </div>
              ) : (
                displayOffers.slice(0, 5).map((offer, idx) => {
                  const logoBgs = ['#dbeafe', '#dcfce7', '#fef9c3', '#fae8ff'];
                  const logoColors = ['#1d4ed8', '#15803d', '#a16207', '#86198f'];
                  
                  const initials = (offer.commodityName || 'Komoditas')
                    .split(' ')
                    .map(w => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const isCounter = offer.status === 'Counter-Offer';
                  const isApproved = offer.status === 'Disetujui';

                  const price = offer.offeredPricePerKg || offer.pricePerKg || 0;

                  return (
                    <div 
                      key={offer.id} 
                      className="clone-offer-compact-item"
                      onClick={() => onNavigate && onNavigate('ajukan-penawaran')}
                      style={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        padding: '0.4rem 0.55rem',
                        borderRadius: '8px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f8fafc)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      title={`Proposal ${offer.commodityName} - Status: ${isApproved ? 'Aktif (A)' : (isCounter ? 'Tidak Aktif (T)' : 'Pending (P)')}`}
                    >
                      <div 
                        className="clone-offer-avatar-box"
                        style={{ 
                          background: logoBgs[idx % logoBgs.length], 
                          color: logoColors[idx % logoColors.length],
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {initials}
                      </div>
                      <div className="clone-offer-compact-name" style={{ flex: 1, minWidth: 0 }}>
                        <div 
                          style={{ 
                            fontSize: '0.82rem',
                            fontWeight: 600, 
                            color: 'var(--text-primary)', 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            lineHeight: 1.25,
                            marginBottom: '2px'
                          }} 
                          title={offer.commodityName}
                        >
                          {offer.commodityName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                          {offer.requestedTon} Ton • Rp {price.toLocaleString('id-ID')} / kg
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginLeft: '4px' }}>
                        {isApproved && (
                          <span 
                            style={{ 
                              width: '22px', 
                              height: '22px', 
                              borderRadius: '50%', 
                              background: '#dcfce7', 
                              color: '#15803d', 
                              fontWeight: 700, 
                              fontSize: '0.68rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              border: '1px solid #bbf7d0'
                            }}
                            title="Status: Aktif (A)"
                          >
                            A
                          </span>
                        )}
                        {isCounter && (
                          <span 
                            style={{ 
                              width: '22px', 
                              height: '22px', 
                              borderRadius: '50%', 
                              background: '#fee2e2', 
                              color: '#dc2626', 
                              fontWeight: 700, 
                              fontSize: '0.68rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              border: '1px solid #fecaca'
                            }}
                            title="Status: Tidak Aktif (T)"
                          >
                            T
                          </span>
                        )}
                        {!isCounter && !isApproved && (
                          <span 
                            style={{ 
                              width: '22px', 
                              height: '22px', 
                              borderRadius: '50%', 
                              background: '#e0e7ff', 
                              color: '#4338ca', 
                              fontWeight: 700, 
                              fontSize: '0.68rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              border: '1px solid #c7d2fe'
                            }}
                            title="Status: Pending (P)"
                          >
                            P
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 2: Jam Operasional Logistik (WIB - UTC+7) - Compact Card */}
          <div className="clone-card widget-time-tracker" style={{ padding: '0.75rem 1rem', borderRadius: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="time-tracker-glow-bg" style={{ width: '100px', height: '100px', bottom: '-25px', right: '-20px' }} />
            <div className="time-tracker-content">
              <div className="time-tracker-title flex-between" style={{ marginBottom: '0.2rem', fontSize: '0.76rem' }}>
                <span style={{ fontWeight: 700 }}>Operasional Logistik</span>
                <span className="wita-live-indicator" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                  <span className="wita-live-dot" style={{ width: '5px', height: '5px' }} />
                  <span>WIB</span>
                </span>
              </div>
              <div className="time-tracker-digits" style={{ fontSize: '1.25rem', margin: '0.15rem 0 0.35rem 0', letterSpacing: '0.03em' }}>
                {currentTimeWIB.time}
              </div>
              <div className="wita-subinfo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.66rem' }}>
                <span className="wita-badge" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>Gudang Sentral</span>
                <span className="wita-date-text" style={{ fontSize: '0.66rem' }}>{currentTimeWIB.date}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
