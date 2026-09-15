import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  TrendUp, 
  TrendDown, 
  Plus, 
  ArrowRight,
  ArrowUp,
  VideoCamera,
  Play,
  Pause,
  Stop,
  X,
  Buildings,
  CheckCircle,
  CurrencyCircleDollar,
  ChartLineUp
} from '@phosphor-icons/react';
import { INITIAL_MARKET_PRICES, INITIAL_TRANSACTIONS, INITIAL_OFFERS } from './mockData';

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

export default function FarmerCloneOverview({ onAddProduct, onNavigate, marketPrices, offers }) {
  const displayPrices = (marketPrices && marketPrices.length > 0 ? marketPrices : INITIAL_MARKET_PRICES);
  const displayOffers = (offers && offers.length > 0 ? offers : INITIAL_OFFERS);
  const displayTransactions = INITIAL_TRANSACTIONS;

  // 6-Month Sales Wave Spline Data (Mar s/d Agu) matching Gambar 1
  const months6Data = [
    { month: 'Mar', trans: 165, prod: 30, date: '12 Mar 2026', blueY: 62, orangeY: 76 },
    { month: 'Apr', trans: 150, prod: 28, date: '10 Apr 2026', blueY: 74, orangeY: 88 },
    { month: 'Mei', trans: 175, prod: 35, date: '21 Mei 2026', blueY: 54, orangeY: 96 },
    { month: 'Jun', trans: 190, prod: 38, date: '16 Jun 2026', blueY: 42, orangeY: 76 },
    { month: 'Jul', trans: 205, prod: 40, date: '24 Jul 2026', blueY: 56, orangeY: 82 },
    { month: 'Agu', trans: 222, prod: 44, date: '14 Agu 2026', blueY: 30, orangeY: 50 },
  ];

  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(5); // Default active at Agu (index 5)
  const [activeTimeframe, setActiveTimeframe] = useState('7d'); // Timeframe filter in Gambar 3

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

  // Live Real-Time Clock in WITA (Waktu Indonesia Tengah - UTC+8)
  const getWitaTimeObj = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Makassar',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\./g, ':');

    const date = now.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Makassar',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return { time, date };
  };

  const [currentTimeWITA, setCurrentTimeWITA] = useState(getWitaTimeObj);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeWITA(getWitaTimeObj());
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
      {/* Header Section with Greeting (preserved) */}
      <div className="clone-dash-header">
        <div>
          <h1 className="clone-dash-title clone-greeting-title">
            <span className="clone-greeting-blue">{greeting}</span>, Pak Budi! 👋
          </h1>
          <p className="clone-dash-subtitle">
            Ringkasan aktivitas panen, penawaran harga pasar, dan status komoditas Anda hari ini.
          </p>
        </div>
        <div className="clone-dash-header-actions">
          <button 
            type="button" 
            className="clone-btn-primary"
            onClick={() => onAddProduct ? onAddProduct() : null}
            title="Tambah Komoditas Baru"
          >
            <Plus size={14} weight="bold" />
            <span>Tambah Komoditas</span>
          </button>
          <button 
            type="button" 
            className="clone-btn-secondary"
            onClick={() => onNavigate ? onNavigate('binding') : null}
            title="Lihat Kontrak & Perjanjian"
          >
            <span>Lihat Kontrak</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards (Cloned from Gambar 1 Top Row) */}
      <div className="clone-kpi-grid">
        {/* KPI 1: Tasks Completed (Primary Accent Card) */}
        <div 
          className="clone-kpi-card solid-purple"
          onClick={() => onNavigate && onNavigate('komoditas-saya')}
          title="Klik untuk membuka kelola komoditas"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Tasks Completed</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn white-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('komoditas-saya'); }}
              aria-label="Buka Tasks Completed"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            72
          </div>
          <div className="clone-kpi-badge white-badge">
            <div className="clone-mini-chart-icon">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
            </div>
            <span>Increased from last month</span>
          </div>
        </div>

        {/* KPI 2: Tasks In Progress (White Card) */}
        <div 
          className="clone-kpi-card white-card"
          onClick={() => onNavigate && onNavigate('penawaran')}
          title="Klik untuk melihat penawaran aktif"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Tasks In Progress</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('penawaran'); }}
              aria-label="Buka Tasks In Progress"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            145
          </div>
          <div className="clone-kpi-badge light-purple-badge">
            <div className="clone-mini-chart-icon purple">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
            </div>
            <span>Increased from last month</span>
          </div>
        </div>

        {/* KPI 3: Pending Reviews (White Card) */}
        <div 
          className="clone-kpi-card white-card"
          onClick={() => onNavigate && onNavigate('binding')}
          title="Klik untuk melihat kontrak menunggu review"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Pending Reviews</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('binding'); }}
              aria-label="Buka Pending Reviews"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            32
          </div>
          <div className="clone-kpi-badge light-purple-badge">
            <div className="clone-mini-chart-icon purple">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
            </div>
            <span>Increased from last month</span>
          </div>
        </div>

        {/* KPI 4: Overdue Tasks (White Card) */}
        <div 
          className="clone-kpi-card white-card"
          onClick={() => onNavigate && onNavigate('komoditas-saya')}
          title="Klik untuk melihat tugas & diskusi komoditas"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Overdue Tasks</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('komoditas-saya'); }}
              aria-label="Buka Overdue Tasks"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            72
          </div>
          <div className="clone-kpi-footer-text">
            On Discuss
          </div>
        </div>
      </div>

      {/* 3-Column × 2-Row Grid Layout */}
      <div className="clone-widgets-grid">
        
        {/* ================= COLUMN 1 (LEFT) ================= */}
        <div className="clone-widget-col">
          
          {/* Card 1: Sales Report (6-Month Spline Wave Chart matching Gambar 1) */}
          <div className="clone-card">
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.45rem' }}>
              <h3 className="clone-card-title">Sales Report</h3>
              <span className="clone-card-period-tag">6 Bulan</span>
            </div>

            {/* Spline Wave Chart Container */}
            <div 
              className="clone-spline-container"
              onMouseLeave={() => setHoveredMonthIndex(5)}
            >
              {/* Floating Dark Tooltip Bubble matching Gambar 1 */}
              <div 
                className="clone-spline-tooltip"
                style={{
                  left: `${(activePoint.x / chartWidth) * 100}%`,
                  top: `${Math.max(12, activePoint.y - 12)}px`
                }}
              >
                <div className="clone-spline-tooltip-date">{months6Data[hoveredMonthIndex].date}</div>
                <div className="clone-spline-tooltip-row">
                  <span className="clone-spline-tooltip-bar blue" />
                  <span className="clone-spline-tooltip-val">{months6Data[hoveredMonthIndex].trans}</span>
                  <span className="clone-spline-tooltip-lbl">Transactions</span>
                </div>
                <div className="clone-spline-tooltip-row">
                  <span className="clone-spline-tooltip-bar orange" />
                  <span className="clone-spline-tooltip-val">{months6Data[hoveredMonthIndex].prod}</span>
                  <span className="clone-spline-tooltip-lbl">Product</span>
                </div>
              </div>

              {/* SVG Curve Canvas */}
              <svg 
                className="clone-spline-svg" 
                viewBox={`0 0 ${chartWidth} ${chartHeight + 10}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="salesBlueGrad6" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="salesOrangeGrad6" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Vertical Dotted Guideline at Active Month */}
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
                        stroke={isSelected ? '#3b82f6' : 'currentColor'} 
                        strokeWidth={isSelected ? 1.2 : 0.6} 
                        strokeDasharray={isSelected ? "3 3" : "2 3"} 
                        opacity={isSelected ? 0.45 : 0.1} 
                      />
                    </g>
                  );
                })}

                {/* Area Gradient Fills */}
                <path d={orangeArea} fill="url(#salesOrangeGrad6)" />
                <path d={blueArea} fill="url(#salesBlueGrad6)" />

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
                  stroke="#2563eb" 
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
                  fill="#2563eb" 
                  stroke="#ffffff" 
                  strokeWidth="2.5" 
                />
              </svg>

              {/* 6 Months Row on X-Axis matching Gambar 1 */}
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

          {/* Card 2: Riwayat Transaksi (Gambar 4 - Replaced with Riwayat Transaksi without table header) */}
          <div className="clone-card" style={{ flex: 1 }}>
            <div className="clone-card-header flex-between">
              <h3 className="clone-card-title">Riwayat Transaksi</h3>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('transaksi')}
                title="Buka seluruh riwayat transaksi"
              >
                <Plus size={11} weight="bold" />
                <span>Lihat Semua</span>
              </button>
            </div>
            
            {/* List Transaksi: Logo profil, nama, dan total saja (Tanpa Header Tabel) */}
            <div className="clone-members-list">
              {displayTransactions.slice(0, 3).map((trx, idx) => {
                const avatarBgs = ['#e0e7ff', '#ecfdf5', '#fef3c7', '#f3e8ff'];
                const avatarColors = ['#4338ca', '#047857', '#b45309', '#7e22ce'];
                const initials = trx.buyerName
                  .replace('PT ', '')
                  .replace('CV ', '')
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
                    title={`Detail transaksi ${trx.buyerName} - Rp ${trx.amount.toLocaleString('id-ID')}`}
                  >
                    <div 
                      className="clone-member-avatar-box"
                      style={{ 
                        background: avatarBgs[idx % avatarBgs.length], 
                        color: avatarColors[idx % avatarColors.length] 
                      }}
                    >
                      {initials}
                    </div>
                    <div className="clone-member-info">
                      <div className="clone-member-name">{trx.buyerName}</div>
                      <div className="clone-member-sub">{trx.productName}</div>
                    </div>
                    <div className="clone-trx-total-badge">
                      Rp {trx.amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ================= COLUMN 2 (CENTER) ================= */}
        <div className="clone-widget-col">
          
          {/* Card 1: Compact Metric & Timeframe Overview (Total Pendapatan Petani dalam format Rupiah) */}
          <div className="clone-card clone-metric-compact-card">
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.2rem' }}>
              <h3 className="clone-card-title">Total Pendapatan</h3>
            </div>
            
            {/* Compact Metric Layout matching Gambar 3 tightly spaced */}
            <div className="clone-metric-compact-wrap">
              <div className="clone-metric-compact-amount">
                Rp 443.570.000
              </div>
              
              <div className="clone-metric-compact-trend">
                <span className="clone-trend-circle-icon">
                  <ArrowUp size={8} weight="bold" />
                </span>
                <span>+Rp 23.300.000 (+2.5%)</span>
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

          {/* Card 2: Harga Acuan Pasar (Gambar 5 - Replaced with Harga Acuan Pasar: Sumber & Harga) */}
          <div className="clone-card" style={{ flex: 1 }}>
            <div className="clone-card-header flex-between">
              <h3 className="clone-card-title">Harga Acuan Pasar</h3>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('harga-pasar')}
                title="Buka seluruh data harga pasar"
              >
                <span>Lihat Pasar</span>
              </button>
            </div>

            {/* List Harga Acuan Pasar: Nama sumber dan harga */}
            <div className="clone-market-benchmark-list">
              {displayPrices.slice(0, 3).map((item, idx) => {
                const shortSource = item.source.includes('ASPEKINDO') ? 'ASPEKINDO' :
                                    item.source.includes('Distanbun') ? 'Distanbun Mnh' :
                                    item.source.includes('Kawangkoan') ? 'Pasar Kwk' :
                                    item.source.includes('Langowan') ? 'Pasar Lgw' :
                                    item.source.includes('Bapanas') ? 'Bapanas Sulut' : 'Pasar Minahasa';

                return (
                  <div 
                    key={item.id || idx} 
                    className="clone-market-benchmark-item"
                    onClick={() => onNavigate && onNavigate('harga-pasar')}
                    style={{ cursor: 'pointer' }}
                    title={`${item.commodity} - ${shortSource}: Rp ${item.marketPrice.toLocaleString('id-ID')}/${item.unit}`}
                  >
                    <div className="clone-market-source-info">
                      <span className="clone-market-source-name">{shortSource}</span>
                      <span className="clone-market-commodity-name">{item.commodity}</span>
                    </div>
                    <div className="clone-market-price-tag">
                      <span className="clone-market-price-val">Rp {item.marketPrice.toLocaleString('id-ID')}</span>
                      <span className="clone-market-price-unit">/{item.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ================= COLUMN 3 (RIGHT) ================= */}
        <div className="clone-widget-col">
          
          {/* Card 1: Penawaran Masuk (Gambar 3 - Replaced with Penawaran Masuk: Logo & Nama Saja) */}
          <div className="clone-card">
            <div className="clone-card-header flex-between">
              <h3 className="clone-card-title">Penawaran Masuk</h3>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('penawaran')}
                title="Buka daftar penawaran masuk"
              >
                <Plus size={11} weight="bold" />
                <span>New</span>
              </button>
            </div>

            {/* List Penawaran Masuk: Logo Profil & Nama Saja */}
            <div className="clone-offers-compact-list">
              {displayOffers.slice(0, 4).map((offer, idx) => {
                const logoBgs = ['#dbeafe', '#dcfce7', '#fef9c3', '#fae8ff'];
                const logoColors = ['#1d4ed8', '#15803d', '#a16207', '#86198f'];
                const shortBuyerName = offer.buyerName
                  .replace(' Indonesia Tbk', '')
                  .replace(' Nusantara', '');
                
                const initials = shortBuyerName
                  .replace('PT ', '')
                  .replace('CV ', '')
                  .replace('Koperasi ', 'Kop ')
                  .split(' ')
                  .map(w => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div 
                    key={offer.id} 
                    className="clone-offer-compact-item"
                    onClick={() => onNavigate && onNavigate('penawaran')}
                    style={{ cursor: 'pointer' }}
                    title={`Penawaran dari ${offer.buyerName}`}
                  >
                    <div 
                      className="clone-offer-avatar-box"
                      style={{ 
                        background: logoBgs[idx % logoBgs.length], 
                        color: logoColors[idx % logoColors.length] 
                      }}
                    >
                      {initials}
                    </div>
                    <div className="clone-offer-compact-name">
                      {shortBuyerName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Jam Hari Ini (WITA - UTC+8) */}
          <div className="clone-card widget-time-tracker" style={{ flex: 1 }}>
            <div className="time-tracker-glow-bg" />
            <div className="time-tracker-content">
              <div className="time-tracker-title flex-between">
                <span>Jam Hari Ini</span>
                <span className="wita-live-indicator">
                  <span className="wita-live-dot" />
                  <span>WITA</span>
                </span>
              </div>
              <div className="time-tracker-digits">
                {currentTimeWITA.time}
              </div>
              <div className="wita-subinfo">
                <span className="wita-badge">UTC+8</span>
                <span className="wita-date-text">{currentTimeWITA.date}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
