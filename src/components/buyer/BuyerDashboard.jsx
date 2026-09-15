import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SquaresFour, 
  Package, 
  Eye, 
  Handshake, 
  TrendUp, 
  ChatCircleText, 
  Gear, 
  Question, 
  Bug, 
  SignOut, 
  MagnifyingGlass, 
  EnvelopeSimple, 
  Bell, 
  CaretDown, 
  CaretUp, 
  List, 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Receipt,
  FileText,
  Sun,
  Moon,
  BookmarkSimple,
  PlusCircle,
  Buildings,
  Plant,
  Truck,
  User,
  CreditCard
} from '@phosphor-icons/react';

import { 
  INITIAL_BUYER_PROFILE, 
  INITIAL_CATALOG_COMMODITIES, 
  INITIAL_BUYER_OFFERS, 
  INITIAL_BUYER_BINDINGS, 
  INITIAL_BUYER_TRANSACTIONS,
  INITIAL_BUYER_WATCHLIST,
  INITIAL_BUYER_PAYMENTS
} from './buyerMockData';
import { INITIAL_MARKET_PRICES } from '../farmer/mockData';

import BuyerCloneOverview from './BuyerCloneOverview';
import BuyerCatalog from './BuyerCatalog';
import BuyerOffers from './BuyerOffers';
import BuyerBinding from './BuyerBinding';
import BuyerTransactions from './BuyerTransactions';
import BuyerMarketPrice from './BuyerMarketPrice';
import BuyerPayment from './BuyerPayment';
import BuyerChatView from './BuyerChatView';
import BuyerProfile from './BuyerProfile';

export default function BuyerDashboard({ 
  onBackToHome, 
  theme, 
  onToggleTheme 
}) {
  // Navigation active tab
  // 'dashboard' | 'katalog' | 'watchlist' | 'rfq' | 'penawaran' | 'binding' | 'transaksi' | 'harga-pasar' | 'pesan' | 'pengaturan' | 'bantuan'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Accordion state for 'Eksplorasi Komoditas' dropdown in sidebar
  const [komoditasDropdownOpen, setKomoditasDropdownOpen] = useState(true);

  // Collapsed sidebar state (Desktop collapse)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal for Bug Report
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugTitle, setBugTitle] = useState('');

  // Topbar dropdowns
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Core Data States
  const [buyerProfile, setBuyerProfile] = useState(INITIAL_BUYER_PROFILE);
  const [commodities, setCommodities] = useState(INITIAL_CATALOG_COMMODITIES);
  const [offers, setOffers] = useState(INITIAL_BUYER_OFFERS);
  const [bindingAgreements, setBindingAgreements] = useState(INITIAL_BUYER_BINDINGS);
  const [transactions, setTransactions] = useState(INITIAL_BUYER_TRANSACTIONS);
  const [payments, setPayments] = useState(INITIAL_BUYER_PAYMENTS);
  const [watchlist, setWatchlist] = useState(INITIAL_BUYER_WATCHLIST);
  const [marketPrices, setMarketPrices] = useState(INITIAL_MARKET_PRICES);

  // Add Offer modal trigger state (when user clicks 'Ajukan Penawaran')
  const [addOfferModalRequested, setAddOfferModalRequested] = useState(false);

  // Notifications mock
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Poktan Ranowangko Langowan menyetujui penawaran 10 Ton Cengkeh Zanzibar!', time: '15 menit lalu', unread: true },
    { id: 2, text: 'Poktan Danau Tondano mengajukan counter-offer Beras Superwin', time: '1 jam lalu', unread: true },
    { id: 3, text: 'Verifikasi Booking Fee 5% kontrak AC-AGR/2026/IX/0051 telah berhasil', time: 'Kemarin', unread: false }
  ]);

  // Handle Offer Submission from Catalog
  const handleAddNewOffer = (newOffer) => {
    setOffers(prev => [newOffer, ...prev]);
    setNotifications(prev => [
      { id: Date.now(), text: `Penawaran baru terkirim ke ${newOffer.farmerGroup}`, time: 'Baru saja', unread: true },
      ...prev
    ]);
  };

  // Handle Counter Offer Acceptance
  const handleAcceptCounterOffer = (offerId) => {
    const targetOffer = offers.find(o => o.id === offerId);
    if (!targetOffer) return;

    const acceptedPrice = targetOffer.counterPricePerKg || targetOffer.offeredPricePerKg;
    const acceptedTon = targetOffer.counterTon || targetOffer.requestedTon;
    const totalVal = (acceptedTon * 1000) * acceptedPrice;

    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Disetujui', offeredPricePerKg: acceptedPrice, requestedTon: acceptedTon } : o));

    const newBinding = {
      id: `BND-BYR-2026-0${bindingAgreements.length + 60}`,
      contractCode: `AC-AGR/2026/IX/00${bindingAgreements.length + 60}`,
      offerId: targetOffer.id,
      productName: targetOffer.commodityName,
      farmerName: targetOffer.farmerGroup,
      buyerName: buyerProfile.companyName,
      tonnage: acceptedTon,
      pricePerKg: acceptedPrice,
      totalValue: totalVal,
      bookingFee: totalVal * 0.05,
      bookingFeeStatus: 'Terkunci di Penjamin Platform (Escrow)',
      signedDate: 'Hari Ini, 12 September 2026',
      pickupSchedule: '20 September 2026 s/d 23 September 2026',
      pickupLocation: targetOffer.location,
      picWarehouse: 'Pengurus Lapangan Poktan Setempat',
      paymentMethod: 'Pelunasan Transfer 95% saat Timbang Muat',
      status: 'Terikat',
      timeline: [
        { label: 'Penawaran Disepakati Pihak Poktan', date: 'Hari Ini, 12 Sep 2026', completed: true },
        { label: 'Binding Agreement Diterbitkan Sistem', date: 'Hari Ini, 12 Sep 2026', completed: true },
        { label: 'Booking Fee 5% Terverifikasi di Platform', date: 'Terkunci Aman di Escrow', completed: true },
        { label: 'Kedatangan Armada Muat Mandiri', date: 'Dijadwalkan 20 Sep 2026', completed: false },
        { label: 'Uji Kadar Air, Timbang & Pelunasan', date: 'Estimasi 23 Sep 2026', completed: false }
      ],
      clauses: [
        'Poktan menjamin mutu hasil panen sesuai standar spesifikasi yang disepakati.',
        'Pembeli PT Royal Agro Minahasa bertanggung jawab menyediakan armada muat mandiri.',
        'Pelunasan 95% dilakukan saat verifikasi timbang di lokasi gudang penyerahan.'
      ]
    };

    setBindingAgreements(prev => [newBinding, ...prev]);
    setActiveTab('transaksi');
  };

  // Handle Buyer Counter Negotiation
  const handleSubmitBuyerCounter = ({ offerId, newPrice, newTon, notes }) => {
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          status: 'Menunggu Respon',
          offeredPricePerKg: newPrice,
          requestedTon: newTon,
          notes: `Negosiasi Ulang Pembeli: ${notes} (Harga diajukan: Rp ${newPrice.toLocaleString('id-ID')}/kg)`
        };
      }
      return o;
    }));
  };

  // Cancel / Delete Offer
  const handleCancelOffer = (offerId) => {
    setOffers(prev => prev.filter(o => o.id !== offerId));
  };

  // Handle Bug Submit
  const handleSendBugReport = (e) => {
    e.preventDefault();
    setBugSubmitted(true);
    setTimeout(() => {
      setBugSubmitted(false);
      setBugModalOpen(false);
      setBugTitle('');
      setBugDescription('');
    }, 1800);
  };

  const pendingOffersCount = offers.filter(o => o.status === 'Menunggu Respon' || o.status === 'Counter-Offer').length;

  // Dynamic page title mapping based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Pengadaan';
      case 'katalog':
        return 'Cari Komoditas';
      case 'watchlist':
        return 'Komoditas Dipantau';
      case 'rfq':
        return 'Permintaan Pasokan (RFQ)';
      case 'penawaran':
        return 'Lihat Penawaran';
      case 'transaksi':
        return 'Riwayat Pengadaan';
      case 'harga-pasar':
        return 'Harga Acuan Pasar';
      case 'pembayaran':
        return 'Pembayaran & Escrow';
      case 'pesan':
        return 'Pesan & Negosiasi';
      case 'pengaturan':
        return 'Pengaturan';
      default:
        return 'Dashboard Pengadaan';
    }
  };

  return (
    <div className="clone-dashboard-wrapper">
      
      {/* ================= LEFT SIDEBAR (ADAPTED FOR BUYER) ================= */}
      <aside className={`clone-sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        
        {/* Brand Header */}
        <div className="clone-sidebar-brand">
          <div 
            className="clone-brand-logo"
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
              } else {
                setActiveTab('dashboard');
              }
            }}
            title="AgriConnect Dashboard Pembeli"
          >
            <div className="clone-brand-icon-box" style={{ background: 'linear-gradient(135deg, #5452f6 0%, #3b82f6 100%)' }}>
              <Buildings size={17} weight="fill" color="#ffffff" />
            </div>
            {!isCollapsed && (
              <span className="clone-logo-text">
                Agri<span style={{ color: '#5452f6' }}>Connect</span>
              </span>
            )}
          </div>

          <button 
            type="button" 
            className="clone-mobile-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="clone-sidebar-nav-container">
          
          {/* SECTION 1: MENU */}
          <div className="clone-nav-section">
            <div className="clone-section-title">MENU PENGADAAN</div>
            <div className="clone-nav-list">
              
              {/* 1. Dashboard */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
                title="Dashboard Pengadaan"
              >
                {activeTab === 'dashboard' && <span className="clone-active-indicator" />}
                <SquaresFour size={18} weight={activeTab === 'dashboard' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Dashboard</span>
              </button>

              {/* 2. Eksplorasi Komoditas (Dropdown Accordion) */}
              <div className="clone-nav-dropdown-group">
                <button
                  type="button"
                  className={`clone-nav-item clone-dropdown-toggle ${(activeTab === 'katalog' || activeTab === 'penawaran' || activeTab === 'watchlist' || activeTab === 'rfq') ? 'active-parent' : ''}`}
                  onClick={() => {
                    if (isCollapsed) {
                      setIsCollapsed(false);
                      setKomoditasDropdownOpen(true);
                    } else {
                      setKomoditasDropdownOpen(!komoditasDropdownOpen);
                    }
                  }}
                  title="Komoditas"
                >
                  <Package size={18} weight="regular" className="clone-nav-icon" />
                  <span className="clone-nav-label">Komoditas</span>
                  <span className="clone-dropdown-caret">
                    {komoditasDropdownOpen ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
                  </span>
                </button>

                {/* Sub-items: Cari Komoditas, Lihat Penawaran, Ajukan Penawaran */}
                <AnimatePresence>
                  {komoditasDropdownOpen && !isCollapsed && (
                    <motion.div 
                      className="clone-nav-submenu"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* 1. Cari Komoditas */}
                      <button
                        type="button"
                        className={`clone-subnav-item ${activeTab === 'katalog' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('katalog'); setMobileSidebarOpen(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Eye size={13} />
                          <span>Cari Komoditas</span>
                        </div>
                        <span className="clone-nav-badge">{commodities.length}</span>
                      </button>

                      {/* 2. Lihat Penawaran */}
                      <button
                        type="button"
                        className={`clone-subnav-item ${activeTab === 'penawaran' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('penawaran'); setMobileSidebarOpen(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BookmarkSimple size={13} />
                          <span>Lihat Penawaran</span>
                        </div>
                        <span className="clone-nav-badge">{offers.length}</span>
                      </button>

                      {/* 3. Ajukan Penawaran */}
                      <button
                        type="button"
                        className="clone-subnav-item"
                        onClick={() => {
                          setActiveTab('katalog');
                          setAddOfferModalRequested(true);
                          setMobileSidebarOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <PlusCircle size={13} color="#5452f6" weight="bold" />
                          <span style={{ color: '#5452f6', fontWeight: 600 }}>Ajukan Penawaran</span>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Riwayat Pengadaan */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'transaksi' ? 'active' : ''}`}
                onClick={() => { setActiveTab('transaksi'); setMobileSidebarOpen(false); }}
                title="Riwayat Pengadaan"
              >
                {activeTab === 'transaksi' && <span className="clone-active-indicator" />}
                <Receipt size={18} weight={activeTab === 'transaksi' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Riwayat Pengadaan</span>
              </button>

              {/* 4. Harga Pasar */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'harga-pasar' ? 'active' : ''}`}
                onClick={() => { setActiveTab('harga-pasar'); setMobileSidebarOpen(false); }}
                title="Harga Pasar Acuan"
              >
                {activeTab === 'harga-pasar' && <span className="clone-active-indicator" />}
                <TrendUp size={18} weight={activeTab === 'harga-pasar' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Harga Pasar</span>
              </button>

              {/* 5. Pembayaran (Tepat di bawah Harga Pasar) */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'pembayaran' ? 'active' : ''}`}
                onClick={() => { setActiveTab('pembayaran'); setMobileSidebarOpen(false); }}
                title="Pembayaran & Rekening Bersama Escrow"
              >
                {activeTab === 'pembayaran' && <span className="clone-active-indicator" />}
                <CreditCard size={18} weight={activeTab === 'pembayaran' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Pembayaran</span>
              </button>

              {/* 6. Pesan & Negosiasi */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'pesan' ? 'active' : ''}`}
                onClick={() => { setActiveTab('pesan'); setMobileSidebarOpen(false); }}
                title="Pesan & Negosiasi"
              >
                {activeTab === 'pesan' && <span className="clone-active-indicator" />}
                <ChatCircleText size={18} weight={activeTab === 'pesan' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Pesan & Nego</span>
                <span className="clone-nav-badge">2</span>
              </button>

            </div>
          </div>

          {/* SECTION 2: GENERAL */}
          <div className="clone-nav-section" style={{ marginTop: '0.85rem' }}>
            <div className="clone-section-title">GENERAL</div>
            <div className="clone-nav-list">
              
              {/* 1. Pengaturan */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'pengaturan' ? 'active' : ''}`}
                onClick={() => { setActiveTab('pengaturan'); setMobileSidebarOpen(false); }}
                title="Pengaturan"
              >
                {activeTab === 'pengaturan' && <span className="clone-active-indicator" />}
                <Gear size={18} weight={activeTab === 'pengaturan' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Pengaturan</span>
              </button>

              {/* 2. Laporkan Bug */}
              <button
                type="button"
                className="clone-nav-item"
                onClick={() => { setBugModalOpen(true); setMobileSidebarOpen(false); }}
                title="Laporkan Bug"
              >
                <Bug size={18} weight="regular" className="clone-nav-icon" />
                <span className="clone-nav-label">Laporkan Bug</span>
              </button>

              {/* 4. Logout */}
              <button
                type="button"
                className="clone-nav-item clone-logout-item"
                onClick={onBackToHome}
                title="Logout"
              >
                <SignOut size={18} weight="bold" className="clone-nav-icon" />
                <span className="clone-nav-label">Logout</span>
              </button>

            </div>
          </div>

        </div>

        {/* Bottom Promo Card */}
        <div className={`clone-sidebar-promo-card sky-blue-card ${komoditasDropdownOpen ? 'compact' : 'spacious'}`}>
          <div className="clone-promo-sky-glow" />
          <div className="clone-promo-icon-badge sky-badge" title="AgriConnect Procurement App">
            <Truck size={komoditasDropdownOpen ? 13 : 16} weight="fill" color="#0284c7" />
          </div>
          <h4 className="clone-promo-title">Download our<br />Buyer App</h4>
          <p className="clone-promo-subtitle">Pantau pasokan armada</p>
          <button 
            type="button" 
            className="clone-promo-btn sky-btn"
            onClick={() => alert('Aplikasi AgriConnect Buyer segera hadir di Google Play Store & App Store!')}
          >
            Download
          </button>
        </div>

      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileSidebarOpen && (
        <div 
          className="clone-sidebar-backdrop" 
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="clone-main-content">
        
        {/* Top Bar */}
        <header className="clone-topbar">
          
          <div className="clone-topbar-left">
            <button 
              type="button" 
              className="clone-topbar-toggle-btn"
              onClick={() => {
                if (window.innerWidth <= 880) {
                  setMobileSidebarOpen(true);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
              aria-label="Toggle Sidebar"
            >
              <List size={18} weight="bold" />
            </button>
            <AnimatePresence mode="wait">
              <motion.h2 
                key={activeTab}
                className="clone-topbar-title"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
              >
                {getPageTitle()}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Right Action Icons */}
          <div className="clone-topbar-actions">
            
            {/* Dark / Light Mode Toggle Button */}
            <button 
              type="button" 
              className="clone-icon-btn clone-theme-btn"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? (
                <Sun size={18} weight="fill" color="#fbbf24" />
              ) : (
                <Moon size={18} weight="bold" color="#64748b" />
              )}
            </button>

            {/* Mail Button */}
            <button 
              type="button" 
              className="clone-icon-btn"
              onClick={() => setActiveTab('pesan')}
              title="Pesan Masuk"
            >
              <EnvelopeSimple size={18} weight="regular" />
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button" 
                className="clone-icon-btn"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                title="Pemberitahuan"
              >
                <Bell size={18} weight="regular" />
                <span className="clone-notif-dot" />
              </button>

              {/* Notification Popover */}
              {notifDropdownOpen && (
                <div className="clone-notif-popover">
                  <div className="clone-popover-header">
                    <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>Pemberitahuan Pembeli</span>
                    <span style={{ fontSize: '0.72rem', color: '#5452f6', cursor: 'pointer' }}>Tandai Dibaca</span>
                  </div>
                  <div className="clone-popover-list">
                    {notifications.map(n => (
                      <div key={n.id} className="clone-popover-item">
                        <div style={{ fontSize: '0.78rem', color: '#1e293b' }}>{n.text}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{n.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill with Dropdown */}
            <div style={{ position: 'relative' }}>
              <div 
                className="clone-user-pill" 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                title="Menu Akun"
              >
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                  alt="Hendra Pratama" 
                  className="clone-user-avatar"
                />
                <div className="clone-user-meta">
                  <div className="clone-user-name">{buyerProfile.name.split(',')[0]}</div>
                  <div className="clone-user-role">Pembeli</div>
                </div>
                <CaretDown 
                  size={12} 
                  weight="bold" 
                  color="#64748b" 
                  style={{ 
                    transform: profileMenuOpen ? 'rotate(180deg)' : 'none', 
                    transition: 'transform 0.2s ease' 
                  }} 
                />
              </div>

              {/* Backdrop to close on outside click */}
              {profileMenuOpen && (
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 49 }} 
                  onClick={() => setProfileMenuOpen(false)} 
                />
              )}

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div 
                    className="clone-profile-dropdown"
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="clone-profile-dropdown-header">
                      <div className="clone-dropdown-name">{buyerProfile.name}</div>
                      <span className="clone-dropdown-role">Pembeli</span>
                    </div>

                    <div className="clone-profile-dropdown-divider" />

                    {/* 1. Profil Saya */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item"
                      onClick={() => {
                        setActiveTab('pengaturan');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <User size={16} weight="regular" className="clone-dropdown-item-icon" />
                      <span>Profil Saya</span>
                    </button>

                    {/* 2. Pesanan Saya (khusus pembeli) */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item"
                      onClick={() => {
                        setActiveTab('transaksi');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <Receipt size={16} weight="regular" className="clone-dropdown-item-icon" />
                      <span>Pesanan Saya</span>
                    </button>

                    <div className="clone-profile-dropdown-divider" />

                    {/* 3. Keluar */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item danger"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        if (onBackToHome) onBackToHome();
                      }}
                    >
                      <SignOut size={16} weight="bold" className="clone-dropdown-item-icon" />
                      <span>Keluar</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </header>

        {/* Dynamic Main Body Content */}
        <div className="clone-page-body">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'dashboard' && (
            <BuyerCloneOverview 
              onNavigate={(tab) => setActiveTab(tab)}
              marketPrices={marketPrices}
              offers={offers}
            />
          )}

          {/* TAB 2: KATALOG KOMODITAS & SUB-TABS */}
          {(activeTab === 'katalog' || activeTab === 'watchlist' || activeTab === 'rfq') && (
            <BuyerCatalog 
              commodities={commodities}
              watchlist={watchlist}
              onSubmitOffer={handleAddNewOffer}
              initialModalOpen={addOfferModalRequested}
              onModalClose={() => setAddOfferModalRequested(false)}
            />
          )}

          {/* TAB 3: PENAWARAN SAYA */}
          {activeTab === 'penawaran' && (
            <BuyerOffers 
              offers={offers}
              onAcceptCounterOffer={handleAcceptCounterOffer}
              onSubmitBuyerCounter={handleSubmitBuyerCounter}
              onProceedToBinding={() => setActiveTab('transaksi')}
              onCancelOffer={handleCancelOffer}
            />
          )}

          {/* TAB 5: RIWAYAT PENGADAAN */}
          {activeTab === 'transaksi' && (
            <BuyerTransactions 
              transactions={transactions}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB 6: HARGA PASAR */}
          {activeTab === 'harga-pasar' && (
            <BuyerMarketPrice 
              marketPrices={marketPrices}
            />
          )}

          {/* TAB 7: PEMBAYARAN & ESCROW */}
          {activeTab === 'pembayaran' && (
            <BuyerPayment 
              payments={payments}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB 8: PESAN & NEGOSIASI */}
          {activeTab === 'pesan' && (
            <BuyerChatView />
          )}

          {/* TAB 8: PROFIL PERUSAHAAN */}
          {activeTab === 'pengaturan' && (
            <BuyerProfile 
              profile={buyerProfile}
              onUpdateProfile={(updated) => setBuyerProfile(updated)}
            />
          )}



        </div>

      </div>



      {/* ================= BUG REPORT MODAL ================= */}
      {bugModalOpen && (
        <div className="clone-modal-overlay" onClick={() => setBugModalOpen(false)}>
          <div className="clone-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bug size={22} color="#ef4444" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Laporkan Kendala / Bug</h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.85rem' }}>Bantu kami menyempurnakan pengalaman procurement Anda</p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setBugModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {bugSubmitted ? (
              <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                <CheckCircle size={48} color="#10b981" weight="fill" style={{ margin: '0 auto 1rem' }} />
                <h4 className="clone-modal-heading" style={{ fontSize: '1.15rem', fontWeight: 700 }}>Laporan Berhasil Terkirim!</h4>
                <p className="clone-modal-subheading" style={{ fontSize: '0.88rem', marginTop: '6px' }}>Terima kasih atas masukan Anda. Tim teknis AgriConnect akan segera meninjau.</p>
              </div>
            ) : (
              <form onSubmit={handleSendBugReport}>
                <div className="clone-modal-body">
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="clone-modal-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Judul Kendala</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Dokumen binding agreement lambat terunduh"
                      value={bugTitle}
                      onChange={(e) => setBugTitle(e.target.value)}
                      className="clone-form-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Deskripsi Rinci</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Jelaskan kendala saat proses penawaran atau pengadaan..."
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      className="clone-form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div className="clone-modal-footer">
                  <button type="button" className="clone-btn-secondary" onClick={() => setBugModalOpen(false)}>
                    Batal
                  </button>
                  <button type="submit" className="clone-btn-primary">
                    Kirim Laporan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
