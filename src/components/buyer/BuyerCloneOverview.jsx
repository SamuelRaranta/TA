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
import { 
  INITIAL_BUYER_TRANSACTIONS, 
  INITIAL_BUYER_OFFERS, 
  INITIAL_CATALOG_COMMODITIES 
} from './buyerMockData';
import { INITIAL_MARKET_PRICES } from '../farmer/mockData';

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

export default function BuyerCloneOverview({ onNavigate, marketPrices, offers, onOpenOfferModal }) {
  const displayPrices = (marketPrices && marketPrices.length > 0 ? marketPrices : INITIAL_MARKET_PRICES);
  const displayOffers = (offers && offers.length > 0 ? offers : INITIAL_BUYER_OFFERS);
  const displayTransactions = INITIAL_BUYER_TRANSACTIONS;

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
            <span className="clone-greeting-blue">{greeting}</span>, Pak Hendra! 👋
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
        
        {/* KPI 1: Total Pengadaan Aktif (Solid Purple Accent Card) */}
        <div 
          className="clone-kpi-card solid-purple"
          onClick={() => onNavigate && onNavigate('katalog')}
          title="Klik untuk membuka katalog komoditas"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Pengadaan Berjalan</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('katalog'); }}
              aria-label="Lihat Pengadaan Berjalan"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            185 <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Ton</span>
          </div>
          <div className="clone-kpi-badge white-badge">
            <TrendUp size={12} weight="bold" />
            <span>+18.4% bln ini</span>
          </div>
        </div>

        {/* KPI 2: Penawaran Terkirim (White Card) */}
        <div 
          className="clone-kpi-card white-card"
          onClick={() => onNavigate && onNavigate('penawaran')}
          title="Klik untuk melihat penawaran aktif"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Penawaran Aktif</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('penawaran'); }}
              aria-label="Buka Penawaran"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            {displayOffers.length} <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Poktan</span>
          </div>
          <div className="clone-kpi-badge light-orange-badge">
            <div className="clone-mini-chart-icon orange">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
            </div>
            <span>2 Perlu Ditinjau (Nego)</span>
          </div>
        </div>

        {/* KPI 3: Pesanan Berjalan (White Card) */}
        <div 
          className="clone-kpi-card white-card"
          onClick={() => onNavigate && onNavigate('transaksi')}
          title="Klik untuk melihat riwayat transaksi pengadaan"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Pengadaan Terverifikasi</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('transaksi'); }}
              aria-label="Buka Transaksi"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            {displayTransactions.length} <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Transaksi</span>
          </div>
          <div className="clone-kpi-badge light-purple-badge">
            <div className="clone-mini-chart-icon purple">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
            </div>
            <span>Terjamin Escrow Platform</span>
          </div>
        </div>

        {/* KPI 4: Jadwal Armada Muat (White Card) */}
        <div 
          className="clone-kpi-card white-card"
          onClick={() => onNavigate && onNavigate('transaksi')}
          title="Klik untuk melihat riwayat armada & transaksi"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Armada Muat Mandiri</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('transaksi'); }}
              aria-label="Buka Jadwal Armada"
            >
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            2 <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Truk</span>
          </div>
          <div className="clone-kpi-footer-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Truck size={13} weight="bold" color="#5452f6" />
            <span>Muat Terdekat: 16 Sep (Langowan)</span>
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
                  top: `${Math.max(12, activePoint.y - 12)}px`
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

          {/* Card 2: Riwayat Pengadaan Terbaru (Without Table Header) */}
          <div className="clone-card" style={{ flex: 1 }}>
            <div className="clone-card-header flex-between">
              <h3 className="clone-card-title">Pengadaan Terkini</h3>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('transaksi')}
                title="Buka seluruh riwayat pengadaan"
              >
                <Plus size={11} weight="bold" />
                <span>Lihat Semua</span>
              </button>
            </div>
            
            {/* List Transaksi: Logo profil, nama Poktan, komoditas, dan total nominal */}
            <div className="clone-members-list">
              {displayTransactions.slice(0, 3).map((trx, idx) => {
                const avatarBgs = ['#e0e7ff', '#ecfdf5', '#fef3c7', '#f3e8ff'];
                const avatarColors = ['#4338ca', '#047857', '#b45309', '#7e22ce'];
                const initials = trx.farmerGroup
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
                    title={`Detail pengadaan ${trx.farmerGroup} - Rp ${trx.amount.toLocaleString('id-ID')}`}
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
                      <div className="clone-member-name">{trx.farmerGroup}</div>
                      <div className="clone-member-sub">{trx.productName} ({trx.volume})</div>
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
          
          {/* Card 1: Compact Metric & Timeframe Overview (Total Pengeluaran Pembeli dalam format Rupiah) */}
          <div className="clone-card clone-metric-compact-card">
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.2rem' }}>
              <h3 className="clone-card-title">Total Pengeluaran</h3>
            </div>
            
            {/* Compact Metric Layout */}
            <div className="clone-metric-compact-wrap">
              <div className="clone-metric-compact-amount">
                Rp 1.485.000.000
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
          <div className="clone-card" style={{ flex: 1 }}>
            <div className="clone-card-header flex-between">
              <h3 className="clone-card-title">Acuan Harga Nasional</h3>
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
          
          {/* Card 1: Tawaran Terkirim ke Poktan */}
          <div className="clone-card">
            <div className="clone-card-header flex-between">
              <h3 className="clone-card-title">Tawaran ke Poktan</h3>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('penawaran')}
                title="Buka daftar penawaran"
              >
                <Plus size={11} weight="bold" />
                <span>Lihat</span>
              </button>
            </div>

            {/* List Penawaran: Logo Profil & Nama Poktan */}
            <div className="clone-offers-compact-list">
              {displayOffers.slice(0, 4).map((offer, idx) => {
                const logoBgs = ['#dbeafe', '#dcfce7', '#fef9c3', '#fae8ff'];
                const logoColors = ['#1d4ed8', '#15803d', '#a16207', '#86198f'];
                const shortPoktanName = offer.farmerGroup;
                
                const initials = shortPoktanName
                  .replace('Poktan ', '')
                  .replace('Gapoktan ', '')
                  .replace('Koperasi ', '')
                  .split(' ')
                  .map(w => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const isCounter = offer.status === 'Counter-Offer';
                const isApproved = offer.status === 'Disetujui';

                return (
                  <div 
                    key={offer.id} 
                    className="clone-offer-compact-item"
                    onClick={() => onNavigate && onNavigate('penawaran')}
                    style={{ cursor: 'pointer' }}
                    title={`Penawaran ke ${offer.farmerGroup} - Status: ${offer.status}`}
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
                    <div className="clone-offer-compact-name" style={{ flex: 1 }}>
                      <div>{shortPoktanName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{offer.requestedTon} Ton • {offer.commodityName.split(' ')[0]}</div>
                    </div>
                    <div>
                      {isCounter && (
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', fontWeight: 600 }}>
                          Nego
                        </span>
                      )}
                      {isApproved && (
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                          Sah
                        </span>
                      )}
                      {!isCounter && !isApproved && (
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#e0e7ff', color: '#4338ca', fontWeight: 600 }}>
                          Wait
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Jam Operasional Logistik (WIB - UTC+7) */}
          <div className="clone-card widget-time-tracker" style={{ flex: 1 }}>
            <div className="time-tracker-glow-bg" />
            <div className="time-tracker-content">
              <div className="time-tracker-title flex-between">
                <span>Operasional Logistik</span>
                <span className="wita-live-indicator">
                  <span className="wita-live-dot" />
                  <span>WIB</span>
                </span>
              </div>
              <div className="time-tracker-digits">
                {currentTimeWIB.time}
              </div>
              <div className="wita-subinfo">
                <span className="wita-badge">Gudang Sentral</span>
                <span className="wita-date-text">{currentTimeWIB.date}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
