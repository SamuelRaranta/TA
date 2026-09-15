import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight,
  TrendUp, 
  Plus, 
  Users, 
  CreditCard, 
  Eye,
  ShoppingBag,
  User,
  Package,
  Star,
  CheckCircle,
  Plant,
  ChartBar,
  ChartPieSlice,
  X
} from '@phosphor-icons/react';
import { 
  PLATFORM_OVERVIEW_METRICS,
  INITIAL_LIVE_ACTIVITIES,
  USER_GROWTH_7DAYS,
  USER_RATIO_PIE,
  PENDING_COMMODITIES_5
} from './adminMockData';
import { INITIAL_MARKET_PRICES } from '../farmer/mockData';

export default function AdminCloneOverview({ onNavigate }) {
  const displayPrices = INITIAL_MARKET_PRICES || [];
  
  // State for 7-Day User Growth Bar Chart (Gambar 3)
  const [hoveredBarIndex, setHoveredBarIndex] = useState(6); // Default to today (Min)
  
  // State for Petani vs Pembeli Pie Chart (Gambar 4)
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // State for Live Activity (Gambar 2 / Gambar 1)
  const [allActivitiesModalOpen, setAllActivitiesModalOpen] = useState(false);

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

  // SVG Pie Chart Geometry for Donut (Radius = 40, Circumference = 251.33)
  const pieRadius = 40;
  const pieCircumference = 2 * Math.PI * pieRadius;
  const farmerPercent = USER_RATIO_PIE.farmers.percentage / 100;
  const buyerPercent = USER_RATIO_PIE.buyers.percentage / 100;
  const farmerDash = farmerPercent * pieCircumference;
  const buyerDash = buyerPercent * pieCircumference;

  return (
    <div className="clone-dashboard-content">
      
      {/* Header Section with Greeting */}
      <div className="clone-dash-header">
        <div>
          <h1 className="clone-dash-title clone-greeting-title">
            <span className="clone-greeting-blue">{greeting}</span>, Tim Admin! 👋
          </h1>
          <p className="clone-dash-subtitle">
            Ringkasan pengawasan operasional, aktivitas waktu nyata platform, dan moderasi komoditas hasil panen.
          </p>
        </div>
        <div className="clone-dash-header-actions">
          <button 
            type="button" 
            className="clone-btn-primary"
            onClick={() => onNavigate && onNavigate('pengguna')}
            title="Verifikasi Pengguna (Petani & Pembeli)"
          >
            <Users size={14} weight="bold" />
            <span>Verifikasi User ({PLATFORM_OVERVIEW_METRICS.pendingVerifications})</span>
          </button>
          <button 
            type="button" 
            className="clone-btn-secondary"
            onClick={() => onNavigate && onNavigate('komoditas')}
            title="Lihat & Kelola Katalog Komoditas"
          >
            <Package size={14} weight="bold" />
            <span>Lihat Komoditas</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards (Title Case, Clean Without Badges, Proper Spacing) */}
      <div className="clone-kpi-grid">
        
        {/* KPI 1: Total Pengguna (Solid Purple Accent Card) */}
        <div 
          className="clone-kpi-card solid-purple compact-kpi"
          onClick={() => onNavigate && onNavigate('kyc')}
          title="Total Pengguna Terdaftar (Petani & Pembeli)"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Total Pengguna</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn white-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('kyc'); }}
              aria-label="Lihat Total Pengguna"
            >
              <ArrowUpRight size={12} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            <span className="clone-kpi-num">{PLATFORM_OVERVIEW_METRICS.totalUsersText}</span>
            <span className="clone-kpi-unit">Pengguna</span>
          </div>
        </div>

        {/* KPI 2: Jumlah Komoditas (White Card) */}
        <div 
          className="clone-kpi-card white-card compact-kpi"
          onClick={() => onNavigate && onNavigate('moderasi')}
          title="Total Komoditas Terdaftar Siap Transaksi"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Jumlah Komoditas</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('moderasi'); }}
              aria-label="Buka Katalog Komoditas"
            >
              <ArrowUpRight size={12} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            <span className="clone-kpi-num">{PLATFORM_OVERVIEW_METRICS.totalCommoditiesText}</span>
            <span className="clone-kpi-unit">Komoditas</span>
          </div>
        </div>

        {/* KPI 3: Pengajuan Penawaran (White Card) */}
        <div 
          className="clone-kpi-card white-card compact-kpi"
          onClick={() => onNavigate && onNavigate('moderasi')}
          title="Total Proposal Penawaran Pengadaan"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Pengajuan Penawaran</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('moderasi'); }}
              aria-label="Buka Penawaran"
            >
              <ArrowUpRight size={12} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            <span className="clone-kpi-num">{PLATFORM_OVERVIEW_METRICS.totalOffersSubmittedText}</span>
            <span className="clone-kpi-unit">Penawaran</span>
          </div>
        </div>

        {/* KPI 4: Jumlah Transaksi (White Card) */}
        <div 
          className="clone-kpi-card white-card compact-kpi"
          onClick={() => onNavigate && onNavigate('escrow')}
          title="Total Transaksi Pengadaan Selesai & Berjalan"
        >
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Jumlah Transaksi</span>
            <button 
              type="button" 
              className="clone-kpi-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('escrow'); }}
              aria-label="Buka Riwayat Transaksi"
            >
              <ArrowUpRight size={12} weight="bold" />
            </button>
          </div>
          <div className="clone-kpi-value">
            <span className="clone-kpi-num">{PLATFORM_OVERVIEW_METRICS.totalTransactionsCountText}</span>
            <span className="clone-kpi-unit">Transaksi</span>
          </div>
        </div>

      </div>

      {/* 3-Column × 2-Row Grid Layout */}
      <div className="clone-widgets-grid">
        
        {/* ================= COLUMN 1 (LEFT) ================= */}
        <div className="clone-widget-col">
          
          {/* Card 1: Peningkatan User 7 Hari (Diagram Batang - Ganti Gambar 3) */}
          <div className="clone-card">
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.35rem' }}>
              <div>
                <h3 className="clone-card-title">Peningkatan User (7 Hari)</h3>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                  Kenaikan harian petani & pembeli
                </div>
              </div>
              <span className="clone-status-pill emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendUp size={11} weight="bold" />
                <span>+207 Total</span>
              </span>
            </div>

            {/* Interactive Bar Chart */}
            <div className="clone-barchart-wrap">
              <div 
                className="clone-barchart-bars-container"
                onMouseLeave={() => setHoveredBarIndex(6)}
              >
                {USER_GROWTH_7DAYS.map((item, idx) => {
                  const maxVal = 50;
                  const heightPercent = Math.min(100, Math.round((item.users / maxVal) * 100));
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div 
                      key={item.day}
                      className={`clone-barchart-col ${item.isToday ? 'today' : ''}`}
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onClick={() => setHoveredBarIndex(idx)}
                      title={`${item.day} (${item.date}): +${item.users} User`}
                    >
                      {/* Floating Tooltip */}
                      {isHovered && (
                        <div className="clone-barchart-tooltip">
                          +{item.users} ({item.farmers} Petani, {item.buyers} Pembeli)
                        </div>
                      )}

                      {/* Bar Track & Filled Bar */}
                      <div className="clone-barchart-track">
                        <div 
                          className="clone-barchart-fill"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* Day Label */}
                      <span className="clone-barchart-day-lbl">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary Metrics Row below Bar Chart */}
              <div className="clone-barchart-footer-summary">
                <span>Rata-rata: <strong>29 user/hari</strong></span>
                <span>Puncak: <strong style={{ color: '#5452f6' }}>Minggu (+45)</strong></span>
              </div>
            </div>
          </div>

          {/* Card 2: 5 Komoditas yang Ingin Didaftarkan (Ganti Gambar 5) */}
          <div className="clone-card" style={{ flex: 1 }}>
            <div className="clone-card-header flex-between">
              <div>
                <h3 className="clone-card-title">5 Komoditas Pengajuan Baru</h3>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                  Menunggu moderasi & validasi admin
                </div>
              </div>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('moderasi')}
                title="Buka seluruh antrean moderasi komoditas"
              >
                <Plus size={11} weight="bold" />
                <span>Review</span>
              </button>
            </div>

            {/* List 5 Komoditas */}
            <div className="clone-pending-commodities-list">
              {PENDING_COMMODITIES_5.map((item) => {
                const iconBgs = {
                  amber: { bg: '#fef3c7', color: '#b45309' },
                  blue: { bg: '#eff6ff', color: '#1d4ed8' },
                  emerald: { bg: '#ecfdf5', color: '#047857' },
                  rose: { bg: '#fef2f2', color: '#dc2626' }
                };
                const theme = iconBgs[item.statusColor] || iconBgs.amber;

                return (
                  <div 
                    key={item.id}
                    className="clone-pending-kmd-item"
                    onClick={() => onNavigate && onNavigate('moderasi')}
                    title={`Klik untuk moderasi ${item.name} dari ${item.farmer}`}
                  >
                    <div className="clone-pending-kmd-left">
                      <div 
                        className="clone-pending-kmd-icon"
                        style={{ background: theme.bg, color: theme.color }}
                      >
                        <Plant size={16} weight="bold" />
                      </div>
                      <div className="clone-pending-kmd-info">
                        <div className="clone-pending-kmd-name">{item.name}</div>
                        <div className="clone-pending-kmd-sub">
                          {item.farmer} • {item.volumeTon} Ton • Rp {item.proposedPrice.toLocaleString('id-ID')}/{item.unit}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <span className={`clone-status-pill ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ================= COLUMN 2 (CENTER) ================= */}
        <div className="clone-widget-col">
          
          {/* Card 1: Pie Chart Perbandingan User Petani dan Pembeli (Ganti Gambar 4) */}
          <div className="clone-card">
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.2rem' }}>
              <div>
                <h3 className="clone-card-title">Perbandingan User</h3>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                  Petani vs Pembeli terverifikasi
                </div>
              </div>
              <span className="clone-status-pill blue">
                Total 1.248
              </span>
            </div>

            {/* Donut / Pie Chart Layout */}
            <div className="clone-pie-wrap">
              {/* SVG Donut */}
              <div className="clone-pie-svg-box">
                <svg viewBox="0 0 100 100" width="116" height="116" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Track Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={pieRadius}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="13"
                  />

                  {/* Segment 1: Petani (Emerald, 60%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={pieRadius}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth={hoveredSegment === 'farmers' ? "15" : "13"}
                    strokeDasharray={`${farmerDash} ${pieCircumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{ transition: 'all 0.25s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredSegment('farmers')}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />

                  {/* Segment 2: Pembeli (Indigo, 40%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={pieRadius}
                    fill="transparent"
                    stroke="#5452f6"
                    strokeWidth={hoveredSegment === 'buyers' ? "15" : "13"}
                    strokeDasharray={`${buyerDash} ${pieCircumference}`}
                    strokeDashoffset={`-${farmerDash}`}
                    strokeLinecap="round"
                    style={{ transition: 'all 0.25s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredSegment('buyers')}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                </svg>

                {/* Center Badge in Donut */}
                <div className="clone-pie-center-content">
                  <span className="clone-pie-center-val">
                    {hoveredSegment === 'farmers' ? '748' : hoveredSegment === 'buyers' ? '500' : '1.248'}
                  </span>
                  <span className="clone-pie-center-lbl">
                    {hoveredSegment === 'farmers' ? 'Petani' : hoveredSegment === 'buyers' ? 'Pembeli' : 'Pengguna'}
                  </span>
                </div>
              </div>

              {/* Legend with interactive highlight */}
              <div className="clone-pie-legend">
                {/* Petani */}
                <div 
                  className={`clone-pie-legend-item ${hoveredSegment === 'farmers' ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredSegment('farmers')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  title="748 Petani (Poktan & Gapoktan Mandiri)"
                >
                  <div className="clone-pie-legend-left">
                    <span className="clone-pie-dot emerald" />
                    <div>
                      <div className="clone-pie-legend-name">Petani</div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>Poktan & Gapoktan</div>
                    </div>
                  </div>
                  <div>
                    <span className="clone-pie-legend-count">748</span>
                    <span className="clone-pie-legend-pct">(60%)</span>
                  </div>
                </div>

                {/* Pembeli */}
                <div 
                  className={`clone-pie-legend-item ${hoveredSegment === 'buyers' ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredSegment('buyers')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  title="500 Pembeli (Korporat Industri & Pedagang Besar)"
                >
                  <div className="clone-pie-legend-left">
                    <span className="clone-pie-dot indigo" />
                    <div>
                      <div className="clone-pie-legend-name">Pembeli</div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>Industri & Korporat</div>
                    </div>
                  </div>
                  <div>
                    <span className="clone-pie-legend-count">500</span>
                    <span className="clone-pie-legend-pct">(40%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Acuan Harga Pasar Nasional (Bapanas / PIBC) */}
          <div className="clone-card" style={{ flex: 1 }}>
            <div className="clone-card-header flex-between">
              <div>
                <h3 className="clone-card-title">Acuan Harga Nasional</h3>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                  Bapanas & PIBC Cipinang
                </div>
              </div>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('moderasi')}
                title="Cek kewajaran harga panen"
              >
                <span>Cek Wajar</span>
              </button>
            </div>

            <div className="clone-market-benchmark-list">
              {displayPrices.slice(0, 3).map((item, idx) => {
                const shortSource = (item.source || '').includes('ASPEKINDO') ? 'ASPEKINDO' :
                                    (item.source || '').includes('Distanbun') ? 'Distanbun Mnh' :
                                    (item.source || '').includes('Kawangkoan') ? 'Pasar Kwk' :
                                    (item.source || '').includes('Langowan') ? 'Pasar Lgw' :
                                    (item.source || '').includes('Bapanas') ? 'Bapanas Sulut' : 'Pasar Minahasa';

                const priceVal = item.marketPrice || 0;

                return (
                  <div 
                    key={item.id || idx} 
                    className="clone-market-benchmark-item"
                    onClick={() => onNavigate && onNavigate('moderasi')}
                    style={{ cursor: 'pointer' }}
                    title={`${item.commodity} - ${shortSource}: Rp ${priceVal.toLocaleString('id-ID')}/${item.unit || 'Kg'}`}
                  >
                    <div className="clone-market-source-info">
                      <span className="clone-market-source-name">{shortSource}</span>
                      <span className="clone-market-commodity-name">{item.commodity}</span>
                    </div>
                    <div className="clone-market-price-tag">
                      <span className="clone-market-price-val">Rp {priceVal.toLocaleString('id-ID')}</span>
                      <span className="clone-market-price-unit">/{item.unit || 'Kg'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ================= COLUMN 3 (RIGHT) ================= */}
        <div className="clone-widget-col">
          
          {/* Card 1: Live Activity (Kloning Persis Gambar 2 - Menggantikan Gambar 1) */}
          <div className="clone-card clone-live-activity-card">
            
            {/* Header: Live Activity + Live Pill */}
            <div className="clone-live-header">
              <h3 className="clone-card-title">Live Activity</h3>
              <div className="clone-live-pill">
                <span className="clone-live-pulse-dot" />
                <span>Live</span>
              </div>
            </div>
            <div className="clone-live-subtitle">Real-time updates</div>

            {/* List 4 Aktivitas Sesuai Gambar 2 */}
            <div className="clone-live-list">
              
              {/* Item 1: Ahmad Sharif placed a new order (Blue Shopping Bag) */}
              <div className="clone-live-item">
                <div 
                  className="clone-live-icon-box"
                  style={{ background: '#eff6ff', borderColor: '#dbeafe', color: '#2563eb' }}
                >
                  <ShoppingBag size={16} weight="bold" />
                </div>
                <div className="clone-live-content">
                  <div className="clone-live-desc">
                    <span className="clone-live-user">Ahmad Sharif</span>{' '}
                    <span className="clone-live-action">placed a new order</span>
                  </div>
                  <div className="clone-live-amount">PKR 4,500</div>
                  <div className="clone-live-time">2 minutes ago</div>
                </div>
              </div>

              {/* Item 2: Fatima Nazari registered as a seller (Green User) */}
              <div className="clone-live-item">
                <div 
                  className="clone-live-icon-box"
                  style={{ background: '#f0fdf4', borderColor: '#dcfce7', color: '#16a34a' }}
                >
                  <User size={16} weight="bold" />
                </div>
                <div className="clone-live-content">
                  <div className="clone-live-desc">
                    <span className="clone-live-user">Fatima Nazari</span>{' '}
                    <span className="clone-live-action">registered as a seller</span>
                  </div>
                  <div className="clone-live-time">15 minutes ago</div>
                </div>
              </div>

              {/* Item 3: Hamid Karimi added a new product listing (Purple Package) */}
              <div className="clone-live-item">
                <div 
                  className="clone-live-icon-box"
                  style={{ background: '#faf5ff', borderColor: '#f3e8ff', color: '#9333ea' }}
                >
                  <Package size={16} weight="bold" />
                </div>
                <div className="clone-live-content">
                  <div className="clone-live-desc">
                    <span className="clone-live-user">Hamid Karimi</span>{' '}
                    <span className="clone-live-action">added a new product listing</span>
                  </div>
                  <div className="clone-live-time">32 minutes ago</div>
                </div>
              </div>

              {/* Item 4: Sara Ahmadi left a 5-star review (Amber Star) */}
              <div className="clone-live-item">
                <div 
                  className="clone-live-icon-box"
                  style={{ background: '#fffbeb', borderColor: '#fef3c7', color: '#d97706' }}
                >
                  <Star size={16} weight="fill" />
                </div>
                <div className="clone-live-content">
                  <div className="clone-live-desc">
                    <span className="clone-live-user">Sara Ahmadi</span>{' '}
                    <span className="clone-live-action">left a 5-star review</span>
                  </div>
                  <div className="clone-live-time">1 hour ago</div>
                </div>
              </div>

            </div>

            {/* Footer: View All Activities Button */}
            <button 
              type="button" 
              className="clone-live-footer-btn"
              onClick={() => setAllActivitiesModalOpen(true)}
              title="Lihat seluruh log aktivitas sistem"
            >
              View All Activities
            </button>
          </div>

          {/* Card 2: Jam Hari Ini (WIB - UTC+7 Live) */}
          <div className="clone-card widget-time-tracker" style={{ flex: 1 }}>
            <div className="time-tracker-glow-bg" />
            <div className="time-tracker-content">
              <div className="time-tracker-title flex-between">
                <span>Jam Hari Ini</span>
                <span className="wita-live-indicator">
                  <span className="wita-live-dot" />
                  <span>WIB</span>
                </span>
              </div>
              <div className="time-tracker-digits">
                {currentTimeWIB.time}
              </div>
              <div className="wita-subinfo">
                <span className="wita-badge">UTC+7</span>
                <span className="wita-date-text">{currentTimeWIB.date}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Modal: View All Activities */}
      {allActivitiesModalOpen && (
        <div className="clone-modal-overlay" onClick={() => setAllActivitiesModalOpen(false)}>
          <div className="clone-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 className="clone-modal-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  Semua Aktivitas Live Platform
                </h3>
                <span className="clone-live-pill">
                  <span className="clone-live-pulse-dot" /> Live
                </span>
              </div>
              <button 
                type="button" 
                className="clone-modal-close" 
                onClick={() => setAllActivitiesModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1rem 1.25rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="clone-live-list">
                {/* 4 item utama */}
                {INITIAL_LIVE_ACTIVITIES.map((act) => (
                  <div key={act.id} className="clone-live-item">
                    <div 
                      className="clone-live-icon-box"
                      style={{ background: act.bgColor, color: act.iconColor }}
                    >
                      {act.type === 'order' && <ShoppingBag size={16} weight="bold" />}
                      {act.type === 'seller' && <User size={16} weight="bold" />}
                      {act.type === 'product' && <Package size={16} weight="bold" />}
                      {act.type === 'review' && <Star size={16} weight="fill" />}
                    </div>
                    <div className="clone-live-content">
                      <div className="clone-live-desc">
                        <span className="clone-live-user">{act.user}</span>{' '}
                        <span className="clone-live-action">{act.action}</span>
                      </div>
                      {act.detail && (
                        <div className="clone-live-amount">{act.detail}</div>
                      )}
                      <div className="clone-live-time">{act.timeAgo}</div>
                    </div>
                  </div>
                ))}

                {/* Additional activities in modal */}
                <div className="clone-live-item">
                  <div 
                    className="clone-live-icon-box"
                    style={{ background: '#ecfdf5', color: '#059669' }}
                  >
                    <CheckCircle size={16} weight="bold" />
                  </div>
                  <div className="clone-live-content">
                    <div className="clone-live-desc">
                      <span className="clone-live-user">PT Charoen Pokphand</span>{' '}
                      <span className="clone-live-action">disbursed escrow payment</span>
                    </div>
                    <div className="clone-live-amount">Rp 420.000.000</div>
                    <div className="clone-live-time">2 hours ago</div>
                  </div>
                </div>

                <div className="clone-live-item">
                  <div 
                    className="clone-live-icon-box"
                    style={{ background: '#eff6ff', color: '#2563eb' }}
                  >
                    <Plant size={16} weight="bold" />
                  </div>
                  <div className="clone-live-content">
                    <div className="clone-live-desc">
                      <span className="clone-live-user">Poktan Ranowangko Langowan</span>{' '}
                      <span className="clone-live-action">completed harvest verification</span>
                    </div>
                    <div className="clone-live-time">3 hours ago</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="clone-btn-primary" 
                onClick={() => setAllActivitiesModalOpen(false)}
                style={{ padding: '0.45rem 1rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
