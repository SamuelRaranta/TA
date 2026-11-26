import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  TrendUp,
  Plus,
  Users,
  CreditCard,
  Eye,
  Package,
  Plant,
  ChartBar,
  ChartPieSlice,
  X
} from '@phosphor-icons/react';
const USER_GROWTH_7DAYS = [
  { day: 'Sen', date: '9 Sep', users: 18, farmers: 11, buyers: 7 },
  { day: 'Sel', date: '10 Sep', users: 24, farmers: 15, buyers: 9 },
  { day: 'Rab', date: '11 Sep', users: 21, farmers: 13, buyers: 8 },
  { day: 'Kam', date: '12 Sep', users: 32, farmers: 20, buyers: 12 },
  { day: 'Jum', date: '13 Sep', users: 28, farmers: 17, buyers: 11 },
  { day: 'Sab', date: '14 Sep', users: 39, farmers: 24, buyers: 15 },
  { day: 'Min', date: '15 Sep', users: 45, farmers: 28, buyers: 17, isToday: true }
];

const USER_RATIO_PIE = {
  totalUsers: 1248,
  farmers: {
    count: 748,
    percentage: 60.0,
    label: 'Petani (Poktan Minahasa)',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
    subtext: '748 Petani (60%)'
  },
  buyers: {
    count: 454,
    percentage: 36.4,
    label: 'Industri & Distributor Pembeli',
    color: '#5452f6',
    gradient: ['#5452f6', '#4338ca'],
    subtext: '454 Pembeli (36.4%)'
  },
  admins: {
    count: 46,
    percentage: 3.6,
    label: 'Tim Operasional & Verifikator',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
    subtext: '46 Tim Pengawas (3.6%)'
  }
};
import { supabase } from '../../lib/supabaseClient';
import { fetchMarketPricesFromSupabase, subscribeMarketPrices } from '../../lib/marketPriceService';
import { fetchCommoditiesFromSupabase, subscribeCommodities } from '../../lib/commodityService';

function CommodityIconOrThumbnail({ image, name, theme }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!image || imgFailed) {
    return (
      <div 
        className="clone-pending-kmd-icon"
        style={{ background: theme.bg, color: theme.color }}
      >
        <Plant size={16} weight="bold" />
      </div>
    );
  }

  return (
    <div 
      className="clone-pending-kmd-icon"
      style={{
        background: '#f8fafc',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img 
        src={image} 
        alt={name || 'Komoditas'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}

function LiveCommodityIconOrThumbnail({ image, name }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!image || imgFailed) {
    return (
      <div
        className="clone-live-icon-box"
        style={{ background: '#faf5ff', borderColor: '#f3e8ff', color: '#9333ea' }}
      >
        <Package size={16} weight="bold" />
      </div>
    );
  }

  return (
    <div
      className="clone-live-icon-box"
      style={{
        background: '#f8fafc',
        borderColor: 'var(--border-subtle, #e2e8f0)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img
        src={image}
        alt={name || 'Komoditas'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}

export default function AdminCloneOverview({ onNavigate, marketPrices: initialPrices }) {
  const [marketPrices, setMarketPrices] = useState(initialPrices || []);

  // Sinkron props harga (jangan kunci ke snapshot lama saat parent memuat data baru).
  useEffect(() => {
    if (Array.isArray(initialPrices) && initialPrices.length > 0) {
      setMarketPrices(initialPrices);
    }
  }, [initialPrices]);

  // Fetch real market prices from Supabase on mount and listen to realtime updates
  useEffect(() => {
    let isMounted = true;
    const loadMarketPrices = async () => {
      try {
        const { data } = await fetchMarketPricesFromSupabase();
        if (isMounted && data) {
          setMarketPrices(data);
        }
      } catch (err) {
        console.warn('[AdminDashboard] Gagal memuat harga pasar dari Supabase:', err);
      }
    };

    loadMarketPrices();

    // Subscribe to realtime changes in market_prices table
    const unsubscribe = subscribeMarketPrices(() => {
      loadMarketPrices();
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load real market prices
  const displayPrices = marketPrices || [];

  // Dynamic commodities from Supabase / Kelola Komoditas
  const [commodities, setCommodities] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadCommodities = async () => {
      try {
        const { data } = await fetchCommoditiesFromSupabase();
        if (isMounted && data && data.length > 0) {
          setCommodities(data);
        }
      } catch (err) {
        console.warn('[RingkasanAdmin] Gagal memuat komoditas dari Supabase:', err);
      }
    };

    loadCommodities();

    const unsubscribe = subscribeCommodities(() => {
      loadCommodities();
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Map latest 5 commodities — kosong = kosong (tanpa mock basi).
  const displayPendingCommodities = (commodities.length > 0 ? commodities.slice(0, 5) : []).map(item => {
    // Normalisasi status menjadi HANYA: 'Menunggu', 'Disetujui', atau 'Ditolak'
    let normStatus = 'Menunggu';
    let statusColor = 'amber';

    const s = (item.status || '').toLowerCase();
    if (s.includes('aktif') || s.includes('setuju') || s.includes('terbit')) {
      normStatus = 'Disetujui';
      statusColor = 'emerald';
    } else if (s.includes('tidak') || s.includes('tolak') || s.includes('revisi')) {
      normStatus = 'Ditolak';
      statusColor = 'rose';
    } else {
      normStatus = 'Menunggu';
      statusColor = 'amber';
    }

    return {
      id: item.id,
      name: item.name || item.commodityName || 'Komoditas',
      farmer: item.farmerLeader || item.farmerName || item.farmer || (item.farmerGroup && !item.farmerGroup.toLowerCase().startsWith('poktan') ? item.farmerGroup : 'Hengky Mandagi, S.P.'),
      volumeTon: item.stockTon || item.stock || item.volumeTon || item.totalStockTon || 0,
      proposedPrice: item.pricePerKg || item.proposedPrice || 0,
      unit: item.unit || 'Kg',
      status: normStatus,
      statusColor: statusColor
    };
  });
  
  // Dynamic counts from Supabase
  const [totalUsersCount, setTotalUsersCount] = useState(null);
  const [farmerCount, setFarmerCount] = useState(null);
  const [buyerCount, setBuyerCount] = useState(null);
  const [pendingKycCount, setPendingKycCount] = useState(null);
  const [commoditiesCount, setCommoditiesCount] = useState(null);
  const [offersCount, setOffersCount] = useState(null);
  const [transactionsCount, setTransactionsCount] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // State for 7-Day User Growth Bar Chart (Gambar 3)
  const [hoveredBarIndex, setHoveredBarIndex] = useState(6); // Default to today (Min)
  
  // State for Petani vs Pembeli Pie Chart (Gambar 4)
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // State for Live Activity (Gambar 2 / Gambar 1)
  const [allActivitiesModalOpen, setAllActivitiesModalOpen] = useState(false);

  // Fetch real counts from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchPlatformStats = async () => {
      try {
        const [
          { data: profilesData, count: profCount },
          { count: commCount },
          { count: offerCount },
          { count: trxCount }
        ] = await Promise.all([
          supabase.from('profiles').select('id, role, kyc_status', { count: 'exact' }),
          supabase.from('commodities').select('id', { count: 'exact', head: true }),
          supabase.from('procurement_proposals').select('id', { count: 'exact', head: true }),
          supabase.from('transactions').select('id', { count: 'exact', head: true })
        ]);

        if (isMounted) {
          if (profilesData) {
            const total = profCount !== null ? profCount : profilesData.length;
            setTotalUsersCount(total);
            const farmers = profilesData.filter(u => u.role === 'petani').length;
            const buyers = profilesData.filter(u => u.role === 'pembeli').length;
            const pendingKyc = profilesData.filter(u => u.kyc_status === 'pending').length;
            setFarmerCount(farmers);
            setBuyerCount(buyers);
            setPendingKycCount(pendingKyc);
          }
          if (commCount !== null) setCommoditiesCount(commCount);
          if (offerCount !== null) setOffersCount(offerCount);
          if (trxCount !== null) setTransactionsCount(trxCount);
        }
      } catch (err) {
        console.warn('Error fetching platform stats in overview:', err);
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    };

    fetchPlatformStats();

    // Subscribe to realtime changes in all relevant tables
    const channelName = `realtime_admin_overview_stats_${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchPlatformStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commodities' }, () => fetchPlatformStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'procurement_proposals' }, () => fetchPlatformStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchPlatformStats())
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

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
  const activeTotal = totalUsersCount ?? 0;
  const activeFarmers = farmerCount ?? 0;
  const activeBuyers = buyerCount ?? 0;
  const farmerPercent = activeTotal > 0 ? (activeFarmers / activeTotal) : 0;
  const buyerPercent = activeTotal > 0 ? (activeBuyers / activeTotal) : 0;
  const farmerDash = farmerPercent * pieCircumference;
  const buyerDash = buyerPercent * pieCircumference;

  return (
    <div className="clone-dashboard-content">
      
      {/* Header Section with Greeting */}
      <div className="clone-dash-header">
        <div>
          <h1 className="clone-dash-title clone-greeting-title">
            <span className="clone-greeting-blue">{greeting},</span> Tim Admin! 👋
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
            <span>Verifikasi User {pendingKycCount !== null ? `(${pendingKycCount})` : ''}</span>
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
            <span className="clone-kpi-num">
              {isLoadingStats ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '3.5rem', height: '1.8rem', borderRadius: '4px' }} />
              ) : (
                (totalUsersCount ?? 0).toLocaleString('id-ID')
              )}
            </span>
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
            <span className="clone-kpi-num">
              {isLoadingStats ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '3.5rem', height: '1.8rem', borderRadius: '4px' }} />
              ) : (
                (commoditiesCount ?? 0).toLocaleString('id-ID')
              )}
            </span>
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
            <span className="clone-kpi-num">
              {isLoadingStats ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '3.5rem', height: '1.8rem', borderRadius: '4px' }} />
              ) : (
                (offersCount ?? 0).toLocaleString('id-ID')
              )}
            </span>
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
            <span className="clone-kpi-num">
              {isLoadingStats ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '3.5rem', height: '1.8rem', borderRadius: '4px' }} />
              ) : (
                (transactionsCount ?? 0).toLocaleString('id-ID')
              )}
            </span>
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
                        <div 
                          className="clone-barchart-tooltip"
                          style={{
                            left: idx >= 5 ? 'auto' : (idx === 0 ? '0' : '50%'),
                            right: idx >= 5 ? '0' : 'auto',
                            transform: idx >= 5 || idx === 0 ? 'none' : 'translateX(-50%)'
                          }}
                        >
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

            {/* List 5 Komoditas dari Data Asli Kelola Komoditas */}
            <div className="clone-pending-commodities-list">
              {displayPendingCommodities.length === 0 && (
                <div style={{ padding: '0.75rem 0.25rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Belum ada komoditas menunggu moderasi.
                </div>
              )}
              {displayPendingCommodities.map((item) => {
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

                    {/* Status Pill Badge (Hanya: Menunggu, Disetujui, atau Ditolak) */}
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
                Total {activeTotal.toLocaleString('id-ID')}
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
                    {hoveredSegment === 'farmers' 
                      ? activeFarmers.toLocaleString('id-ID') 
                      : hoveredSegment === 'buyers' 
                        ? activeBuyers.toLocaleString('id-ID') 
                        : activeTotal.toLocaleString('id-ID')}
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
                  title={`${activeFarmers} Petani (Poktan & Gapoktan Mandiri)`}
                >
                  <div className="clone-pie-legend-left">
                    <span className="clone-pie-dot emerald" />
                    <div>
                      <div className="clone-pie-legend-name">Petani</div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>Poktan & Gapoktan</div>
                    </div>
                  </div>
                  <div>
                    <span className="clone-pie-legend-count">{activeFarmers}</span>
                    <span className="clone-pie-legend-pct">({Math.round(farmerPercent * 100)}%)</span>
                  </div>
                </div>

                {/* Pembeli */}
                <div 
                  className={`clone-pie-legend-item ${hoveredSegment === 'buyers' ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredSegment('buyers')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  title={`${activeBuyers} Pembeli (Korporat Industri & Pedagang Besar)`}
                >
                  <div className="clone-pie-legend-left">
                    <span className="clone-pie-dot indigo" />
                    <div>
                      <div className="clone-pie-legend-name">Pembeli</div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>Industri & Korporat</div>
                    </div>
                  </div>
                  <div>
                    <span className="clone-pie-legend-count">{activeBuyers}</span>
                    <span className="clone-pie-legend-pct">({Math.round(buyerPercent * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Acuan Harga Pasar Nasional (Bapanas / PIBC / Supabase) */}
          <div className="clone-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="clone-card-header flex-between" style={{ marginBottom: '0.45rem' }}>
              <div>
                <h3 className="clone-card-title">Acuan Harga Nasional</h3>
                <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                  Bapanas & PIBC Cipinang
                </div>
              </div>
              <button 
                type="button" 
                className="clone-tag-btn"
                onClick={() => onNavigate && onNavigate('hargapasar')}
                title="Lihat seluruh acuan harga pasar di database"
              >
                <span>Selengkapnya</span>
              </button>
            </div>

            <div className="clone-market-benchmark-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {displayPrices.slice(0, 5).map((item, idx) => {
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
                    onClick={() => onNavigate && onNavigate('hargapasar')}
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

            {/* List aktivitas real dari database (komoditas terbaru); kosong = kosong, bukan template asing basi. */}
            <div className="clone-live-list">
              {(commodities || []).slice(0, 4).map((c, idx) => (
                <div key={c.id || idx} className="clone-live-item">
                  <div
                    className="clone-live-icon-box"
                    style={{ background: '#faf5ff', borderColor: '#f3e8ff', color: '#9333ea' }}
                  >
                    <Package size={16} weight="bold" />
                  </div>
                  <div className="clone-live-content">
                    <div className="clone-live-desc">
                      <span className="clone-live-user">{c.farmerGroup || c.farmerName || 'Kelompok Tani'}</span>{' '}
                      <span className="clone-live-action">mendaftarkan {c.name || c.commodityName || 'komoditas'}</span>
                    </div>
                    <div className="clone-live-amount">Rp {Number(c.pricePerKg || 0).toLocaleString('id-ID')}/kg • {Number(c.stockTon || c.stock || 0)} Ton</div>
                    <div className="clone-live-time">{c.createdAt || c.date || 'Terbaru'}</div>
                  </div>
                </div>
              ))}
              {(!commodities || commodities.length === 0) && (
                <div style={{ padding: '0.75rem 0.25rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Belum ada aktivitas — tidak ada data komoditas di database.
                </div>
              )}
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
                {(commodities || []).slice(0, 10).map((c, idx) => (
                  <div key={c.id || idx} className="clone-live-item">
                    <div
                      className="clone-live-icon-box"
                      style={{ background: '#faf5ff', color: '#9333ea' }}
                    >
                      <Package size={16} weight="bold" />
                    </div>
                    <div className="clone-live-content">
                      <div className="clone-live-desc">
                        <span className="clone-live-user">{c.farmerGroup || c.farmerName || 'Kelompok Tani'}</span>{' '}
                        <span className="clone-live-action">mendaftarkan {c.name || c.commodityName || 'komoditas'}</span>
                      </div>
                      <div className="clone-live-amount">Rp {Number(c.pricePerKg || 0).toLocaleString('id-ID')}/kg</div>
                      <div className="clone-live-time">{c.createdAt || c.date || 'Terbaru'}</div>
                    </div>
                  </div>
                ))}
                {(!commodities || commodities.length === 0) && (
                  <div style={{ padding: '0.75rem 0.25rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Belum ada aktivitas — tidak ada data di database.
                  </div>
                )}
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
