import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SquaresFour, 
  Plant, 
  Package, 
  Plus, 
  PlusCircle, 
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
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  DeviceMobile,
  Lifebuoy,
  FileText,
  Sun,
  Moon,
  Receipt,
  User
} from '@phosphor-icons/react';

import { 
  INITIAL_FARMER_PROFILE, 
  INITIAL_PRODUCTS, 
  INITIAL_OFFERS, 
  INITIAL_BINDING_AGREEMENTS, 
  INITIAL_MARKET_PRICES 
} from './mockData';

import FarmerCloneOverview from './FarmerCloneOverview';
import FarmerProducts from './FarmerProducts';
import FarmerOffers from './FarmerOffers';
import FarmerBinding from './FarmerBinding';
import FarmerMarketPrice from './FarmerMarketPrice';
import FarmerProfile from './FarmerProfile';
import FarmerTransactions from './FarmerTransactions';
import FarmerChatView from './FarmerChatView';

export default function FarmerDashboard({ 
  onBackToHome, 
  theme, 
  onToggleTheme 
}) {
  // Navigation active tab
  // 'dashboard' | 'lihat-komoditas' | 'komoditas-saya' | 'penawaran' | 'harga-pasar' | 'pesan' | 'pengaturan'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Accordion state for 'Komoditas' dropdown in sidebar
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
  const [farmerProfile, setFarmerProfile] = useState(INITIAL_FARMER_PROFILE);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [offers, setOffers] = useState(INITIAL_OFFERS);
  const [bindingAgreements, setBindingAgreements] = useState(INITIAL_BINDING_AGREEMENTS);
  const [marketPrices, setMarketPrices] = useState(INITIAL_MARKET_PRICES);

  // Add Product modal trigger state (when user clicks 'Tambah Komoditas')
  const [addProductModalRequested, setAddProductModalRequested] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications mock
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Penawaran baru dari CV Minahasa Cengkeh: 10 Ton Cengkeh', time: '10 menit lalu', unread: true },
    { id: 2, text: 'Harga acuan Cengkeh Zanzibar naik Rp 3.000/kg di Langowan', time: '1 jam lalu', unread: true },
    { id: 3, text: 'Verifikasi dokumen legalitas Poktan Minahasa berhasil disetujui', time: 'Kemarin', unread: false }
  ]);

  // Product CRUD
  const handleAddProduct = (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
    setAddProductModalRequested(false);
  };

  const handleUpdateProduct = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Offer Actions
  const handleAcceptOffer = (offerId) => {
    const targetOffer = offers.find(o => o.id === offerId);
    if (!targetOffer) return;

    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Diterima' } : o));

    const totalVal = (targetOffer.requestedTon * 1000) * targetOffer.offeredPricePerKg;
    const newBinding = {
      id: `BND-2026-0${bindingAgreements.length + 50}`,
      contractCode: `AC-AGR/2026/IX/00${bindingAgreements.length + 50}`,
      offerId: targetOffer.id,
      productName: targetOffer.productName,
      buyerName: targetOffer.buyerName,
      farmerName: farmerProfile.groupName,
      tonnage: targetOffer.requestedTon,
      pricePerKg: targetOffer.offeredPricePerKg,
      totalValue: totalVal,
      bookingFee: totalVal * 0.05,
      bookingFeeStatus: 'Terkunci di Platform (5%)',
      signedDate: '12 September 2026',
      pickupSchedule: '18 September 2026 s/d 20 September 2026',
      pickupLocation: farmerProfile.location,
      paymentMethod: 'Pelunasan Transfer Langsung Saat Muat Barang',
      status: 'Terikat',
      timeline: [
        { label: 'Penawaran Disepakati', date: 'Hari Ini, 12 Sep 2026', completed: true },
        { label: 'Binding Agreement Diterbitkan', date: 'Hari Ini, 12 Sep 2026', completed: true },
        { label: 'Booking Fee Terverifikasi', date: 'Otomatis Terkunci di Platform', completed: true },
        { label: 'Verifikasi Barang & Armada Muat', date: 'Dijadwalkan 18 Sep 2026', completed: false },
        { label: 'Serah Terima & Selesai', date: 'Estimasi 20 Sep 2026', completed: false }
      ],
      clauses: [
        'Petani menjamin mutu hasil panen sesuai spesifikasi yang disepakati.',
        'Pembeli wajib mengirimkan armada sesuai jadwal pengambilan.',
        'Pembatalan sepihak berakibat pada penahanan tanda jadi.'
      ]
    };

    setBindingAgreements(prev => [newBinding, ...prev]);
    setActiveTab('binding');
  };

  const handleRejectOffer = (offerId) => {
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Ditolak' } : o));
  };

  const handleSubmitCounterOffer = ({ offerId, counterPrice, counterTon, counterNotes }) => {
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          status: 'Menunggu Respon',
          offeredPricePerKg: counterPrice,
          requestedTon: counterTon,
          note: `Negosiasi Ulang Petani: ${counterNotes} (Harga diajukan: Rp ${counterPrice.toLocaleString('id-ID')}/kg)`
        };
      }
      return o;
    }));
  };

  const handleUpdateBindingStatus = (bindingId, newStatus) => {
    setBindingAgreements(prev => prev.map(b => b.id === bindingId ? { ...b, status: newStatus } : b));
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

  const pendingOffersCount = offers.filter(o => o.status === 'Menunggu Respon').length;

  // Dynamic page title mapping based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'lihat-komoditas':
        return 'Lihat Komoditas';
      case 'komoditas-saya':
        return 'Komoditas Saya';
      case 'penawaran':
        return 'Penawaran';
      case 'binding':
        return 'Binding Agreement';
      case 'harga-pasar':
        return 'Harga Pasar';
      case 'pesan':
        return 'Pesan';
      case 'pengaturan':
        return 'Pengaturan';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="clone-dashboard-wrapper">
      
      {/* ================= LEFT SIDEBAR ================= */}
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
            title="AgriConnect Dashboard"
          >
            <div className="clone-brand-icon-box">
              <Plant size={17} weight="fill" color="#ffffff" />
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
            <div className="clone-section-title">MENU</div>
            <div className="clone-nav-list">
              
              {/* 1. Dashboard */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
                title="Dashboard"
              >
                {activeTab === 'dashboard' && <span className="clone-active-indicator" />}
                <SquaresFour size={18} weight={activeTab === 'dashboard' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Dashboard</span>
              </button>

              {/* 2. Komoditas (Dropdown Accordion) */}
              <div className="clone-nav-dropdown-group">
                <button
                  type="button"
                  className={`clone-nav-item clone-dropdown-toggle ${(activeTab === 'lihat-komoditas' || activeTab === 'komoditas-saya') ? 'active-parent' : ''}`}
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
                  <Plant size={18} weight="regular" className="clone-nav-icon" />
                  <span className="clone-nav-label">Komoditas</span>
                  <span className="clone-dropdown-caret">
                    {komoditasDropdownOpen ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
                  </span>
                </button>

                {/* Sub-items */}
                <AnimatePresence>
                  {komoditasDropdownOpen && !isCollapsed && (
                    <motion.div 
                      className="clone-nav-submenu"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <button
                        type="button"
                        className={`clone-subnav-item ${activeTab === 'lihat-komoditas' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('lihat-komoditas'); setMobileSidebarOpen(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Eye size={13} />
                          <span>Lihat Komoditas</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`clone-subnav-item ${activeTab === 'komoditas-saya' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('komoditas-saya'); setMobileSidebarOpen(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Package size={13} />
                          <span>Komoditas Saya</span>
                        </div>
                        <span className="clone-nav-badge">{products.length}</span>
                      </button>

                      <button
                        type="button"
                        className="clone-subnav-item"
                        onClick={() => {
                          setActiveTab('komoditas-saya');
                          setAddProductModalRequested(true);
                          setMobileSidebarOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <PlusCircle size={13} color="#5452f6" weight="bold" />
                          <span style={{ color: '#5452f6', fontWeight: 600 }}>Tambah Komoditas</span>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Penawaran */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'penawaran' ? 'active' : ''}`}
                onClick={() => { setActiveTab('penawaran'); setMobileSidebarOpen(false); }}
                title="Penawaran"
              >
                {activeTab === 'penawaran' && <span className="clone-active-indicator" />}
                <Handshake size={18} weight={activeTab === 'penawaran' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Penawaran</span>
                {pendingOffersCount > 0 && (
                  <span className="clone-nav-badge">{pendingOffersCount}</span>
                )}
              </button>

              {/* 4. Riwayat Transaksi */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'transaksi' ? 'active' : ''}`}
                onClick={() => { setActiveTab('transaksi'); setMobileSidebarOpen(false); }}
                title="Riwayat Transaksi"
              >
                {activeTab === 'transaksi' && <span className="clone-active-indicator" />}
                <Receipt size={18} weight={activeTab === 'transaksi' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Riwayat Transaksi</span>
              </button>

              {/* 5. Harga Pasar */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'harga-pasar' ? 'active' : ''}`}
                onClick={() => { setActiveTab('harga-pasar'); setMobileSidebarOpen(false); }}
                title="Harga Pasar"
              >
                {activeTab === 'harga-pasar' && <span className="clone-active-indicator" />}
                <TrendUp size={18} weight={activeTab === 'harga-pasar' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Harga Pasar</span>
              </button>

              {/* 6. Pesan */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'pesan' ? 'active' : ''}`}
                onClick={() => { setActiveTab('pesan'); setMobileSidebarOpen(false); }}
                title="Pesan"
              >
                {activeTab === 'pesan' && <span className="clone-active-indicator" />}
                <ChatCircleText size={18} weight={activeTab === 'pesan' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Pesan</span>
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

        {/* Bottom Promo Card: "Download our Mobile app" with Sky Blue & Web Logo */}
        {/* Dynamic size: Compact saat dropdown komoditas terbuka/ditekan, Spacious saat dropdown komoditas tertutup */}
        <div className={`clone-sidebar-promo-card sky-blue-card ${komoditasDropdownOpen ? 'compact' : 'spacious'}`}>
          <div className="clone-promo-sky-glow" />
          <div className="clone-promo-icon-badge sky-badge" title="AgriConnect Mobile App">
            <Plant size={komoditasDropdownOpen ? 13 : 16} weight="fill" color="#0284c7" />
          </div>
          <h4 className="clone-promo-title">Download our<br />Mobile app</h4>
          <p className="clone-promo-subtitle">Get easy in another way</p>
          <button 
            type="button" 
            className="clone-promo-btn sky-btn"
            onClick={() => alert('Aplikasi AgriConnect Mobile segera hadir di Google Play Store & App Store!')}
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
            {/* Mobile hamburger / Desktop collapse toggle */}
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
                    <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>Pemberitahuan</span>
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
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" 
                  alt="Kim Jiwon" 
                  className="clone-user-avatar"
                />
                <div className="clone-user-meta">
                  <div className="clone-user-name">Kim Jiwon</div>
                  <div className="clone-user-role">Petani</div>
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
                      <div className="clone-dropdown-name">{farmerProfile?.name || 'Kim Jiwon'}</div>
                      <span className="clone-dropdown-role">Petani</span>
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

                    {/* 2. Komoditas Saya (khusus petani) */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item"
                      onClick={() => {
                        setActiveTab('komoditas-saya');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <Package size={16} weight="regular" className="clone-dropdown-item-icon" />
                      <span>Komoditas Saya</span>
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
          
          {/* TAB 1: CLONE DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <FarmerCloneOverview 
              onAddProduct={() => {
                setActiveTab('komoditas-saya');
                setAddProductModalRequested(true);
              }}
              onNavigate={(tab) => setActiveTab(tab)}
              marketPrices={marketPrices}
              offers={offers}
            />
          )}

          {/* TAB 2 & 3: LIHAT KOMODITAS & KOMODITAS SAYA */}
          {(activeTab === 'lihat-komoditas' || activeTab === 'komoditas-saya') && (
            <FarmerProducts 
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              initialModalOpen={addProductModalRequested}
              onModalClose={() => setAddProductModalRequested(false)}
            />
          )}

          {/* TAB 4: PENAWARAN */}
          {activeTab === 'penawaran' && (
            <FarmerOffers 
              offers={offers}
              onAcceptOffer={handleAcceptOffer}
              onRejectOffer={handleRejectOffer}
              onSubmitCounterOffer={handleSubmitCounterOffer}
            />
          )}

          {/* BINDING AGREEMENT VIEW */}
          {activeTab === 'binding' && (
            <FarmerBinding 
              bindingAgreements={bindingAgreements}
              onUpdateStatus={handleUpdateBindingStatus}
            />
          )}

          {/* TAB 5: HARGA PASAR */}
          {activeTab === 'harga-pasar' && (
            <FarmerMarketPrice 
              marketPrices={marketPrices}
            />
          )}

          {/* TAB 6: PESAN */}
          {activeTab === 'pesan' && (
            <FarmerChatView />
          )}

          {/* TAB 7: PENGATURAN */}
          {activeTab === 'pengaturan' && (
            <FarmerProfile 
              profile={farmerProfile}
              onUpdateProfile={(updated) => setFarmerProfile(updated)}
            />
          )}

          {/* TAB 8: RIWAYAT TRANSAKSI */}
          {activeTab === 'transaksi' && (
            <FarmerTransactions 
              onNavigate={(tab) => setActiveTab(tab)}
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
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.85rem' }}>Bantu kami menyempurnakan aplikasi ini</p>
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
                      placeholder="Contoh: Tombol simpan komoditas tidak merespon"
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
                      placeholder="Jelaskan langkah-langkah terjadinya kendala..."
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
