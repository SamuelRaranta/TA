import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SquaresFour, 
  Users, 
  FileText, 
  Package, 
  Scales, 
  Gear, 
  SignOut, 
  List, 
  Bell, 
  ShieldCheck, 
  CaretDown,
  User,
  CreditCard,
  Question,
  Bug,
  X,
  Sun,
  Moon,
  CheckCircle,
  TrendUp,
  ChatCircleText,
  Handshake
} from '@phosphor-icons/react';

import { INITIAL_ADMIN_PROFILE, PLATFORM_OVERVIEW_METRICS } from './adminMockData';

import AdminCloneOverview from './AdminCloneOverview';
import AdminVerificationView from './AdminVerificationView';
import AdminEscrowView from './AdminEscrowView';
import AdminBindingView from './AdminBindingView';
import AdminCommodityModeration from './AdminCommodityModeration';
import AdminDisputeView from './AdminDisputeView';
import AdminSettingsView from './AdminSettingsView';
import AdminProcurementView from './AdminProcurementView';
import AdminMarketPriceView from './AdminMarketPriceView';
import AdminChatView from './AdminChatView';

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Admin Dashboard caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--card-bg, #ffffff)', borderRadius: '16px', margin: '2rem', border: '1px solid var(--border-subtle, #e2e8f0)' }}>
          <ShieldCheck size={48} color="#5452f6" weight="fill" />
          <h3 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Terjadi Kendala Memuat Modul Admin</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '460px', margin: '0.5rem auto 1.5rem' }}>
            {this.state.error?.message || 'Terjadi kesalahan sistem saat memproses komponen.'}
          </p>
          <button 
            type="button" 
            className="clone-btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Coba Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminDashboard({ 
  onBackToHome, 
  theme, 
  onToggleTheme 
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Modal for Bug Report
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugTitle, setBugTitle] = useState('');

  const adminProfile = INITIAL_ADMIN_PROFILE;

  // Dynamic page title mapping based on active tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'pengguna':
      case 'kyc':
        return 'Kelola Pengguna';
      case 'komoditas':
      case 'moderasi':
        return 'Kelola Komoditas';
      case 'pengadaan':
        return 'Kelola Pengadaan';
      case 'hargapasar':
        return 'Kelola Harga Pasar';
      case 'pesan':
        return 'Pesan';
      case 'escrow':
        return 'Rekening Bersama Escrow';
      case 'binding':
        return 'Pengawasan Kontrak Binding';
      case 'sengketa':
        return 'Resolusi Sengketa Transaksi';
      case 'pengaturan':
        return 'Pengaturan Platform';
      default:
        return 'Dashboard';
    }
  };

  const handleBugSubmit = (e) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugDescription.trim()) return;
    setBugSubmitted(true);
    setTimeout(() => {
      setBugSubmitted(false);
      setBugModalOpen(false);
      setBugTitle('');
      setBugDescription('');
    }, 2000);
  };

  return (
    <div className="clone-dashboard-wrapper">
      
      {/* ================= LEFT SIDEBAR (EXACT SAME DESIGN & CLASSES) ================= */}
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
            title="AgriConnect Dashboard Admin"
          >
            <div className="clone-brand-icon-box" style={{ background: 'linear-gradient(135deg, #5452f6 0%, #3b82f6 100%)' }}>
              <ShieldCheck size={18} weight="fill" color="#ffffff" />
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

        {/* Sidebar Nav Items in Container */}
        <div className="clone-sidebar-nav-container">
          
          {/* SECTION 1: MENU OPERASIONAL */}
          <div className="clone-nav-section">
            <div className="clone-section-title">MENU OPERASIONAL</div>
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

              {/* 2. Kelola Pengguna */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'pengguna' || activeTab === 'kyc' ? 'active' : ''}`}
                onClick={() => { setActiveTab('pengguna'); setMobileSidebarOpen(false); }}
                title="Kelola Pengguna"
              >
                {(activeTab === 'pengguna' || activeTab === 'kyc') && <span className="clone-active-indicator" />}
                <Users size={18} weight={activeTab === 'pengguna' || activeTab === 'kyc' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Kelola Pengguna</span>
                <span className="clone-nav-badge">{PLATFORM_OVERVIEW_METRICS.pendingVerifications}</span>
              </button>

              {/* 3. Kelola Komoditas */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'komoditas' || activeTab === 'moderasi' ? 'active' : ''}`}
                onClick={() => { setActiveTab('komoditas'); setMobileSidebarOpen(false); }}
                title="Kelola Komoditas"
              >
                {(activeTab === 'komoditas' || activeTab === 'moderasi') && <span className="clone-active-indicator" />}
                <Package size={18} weight={activeTab === 'komoditas' || activeTab === 'moderasi' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Kelola Komoditas</span>
                <span className="clone-nav-badge">5</span>
              </button>

              {/* 4. Kelola Pengadaan (Pengajuan penawaran dari pembeli ke petani) */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'pengadaan' ? 'active' : ''}`}
                onClick={() => { setActiveTab('pengadaan'); setMobileSidebarOpen(false); }}
                title="Kelola Pengadaan (Pengajuan Penawaran Pembeli: Komoditas, Volume & Target Harga)"
              >
                {activeTab === 'pengadaan' && <span className="clone-active-indicator" />}
                <Handshake size={18} weight={activeTab === 'pengadaan' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Kelola Pengadaan</span>
                <span className="clone-nav-badge">5</span>
              </button>

              {/* 5. Kelola Harga Pasar */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'hargapasar' ? 'active' : ''}`}
                onClick={() => { setActiveTab('hargapasar'); setMobileSidebarOpen(false); }}
                title="Kelola Harga Pasar"
              >
                {activeTab === 'hargapasar' && <span className="clone-active-indicator" />}
                <TrendUp size={18} weight={activeTab === 'hargapasar' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Kelola Harga Pasar</span>
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
                <span className="clone-nav-badge">3</span>
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
                title="Keluar ke Beranda"
              >
                <SignOut size={18} weight="bold" className="clone-nav-icon" />
                <span className="clone-nav-label">Logout</span>
              </button>

            </div>
          </div>

        </div>

        {/* Bottom Promo Card: Exact Sky Blue Theme matching Farmer & Buyer */}
        <div className="clone-sidebar-promo-card sky-blue-card spacious">
          <div className="clone-promo-sky-glow" />
          <div className="clone-promo-icon-badge sky-badge" title="AgriConnect Operations">
            <ShieldCheck size={16} weight="fill" color="#0284c7" />
          </div>
          <h4 className="clone-promo-title">Portal Operasional<br />Admin</h4>
          <p className="clone-promo-subtitle">Uptime Gateway 99.98%</p>
          <button 
            type="button" 
            className="clone-promo-btn sky-btn"
            onClick={() => setActiveTab('escrow')}
          >
            Escrow
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
              onClick={onToggleTheme}
              className="clone-icon-btn"
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? (
                <Sun size={18} weight="fill" color="#fbbf24" />
              ) : (
                <Moon size={18} weight="bold" color="#64748b" />
              )}
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button" 
                className="clone-icon-btn" 
                title="Notifikasi Operasional"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              >
                <Bell size={18} weight="regular" />
                <span className="clone-notif-dot" />
              </button>

              {/* Notification Popover */}
              {notifDropdownOpen && (
                <>
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 49 }} 
                    onClick={() => setNotifDropdownOpen(false)} 
                  />
                  <div className="clone-notif-popover">
                    <div className="clone-popover-header">
                      <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>Notifikasi Operasional</span>
                      <span style={{ fontSize: '0.72rem', color: '#5452f6', cursor: 'pointer' }}>2 Baru</span>
                    </div>
                    <div className="clone-popover-list">
                      <div className="clone-popover-item">
                        <div style={{ fontSize: '0.78rem', color: '#1e293b' }}>2 Dana Escrow siap dicairkan (Kontrak Langowan & Kombi).</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>10 menit lalu</div>
                      </div>
                      <div className="clone-popover-item">
                        <div style={{ fontSize: '0.78rem', color: '#1e293b' }}>PT Royal Coconut Minahasa mengajukan verifikasi KYC baru.</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>1 jam lalu</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Pill with Role Subtitle & Dropdown */}
            <div style={{ position: 'relative' }}>
              <div 
                className="clone-user-pill" 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                title="Menu Profil Admin"
              >
                <img 
                  src={adminProfile.avatar} 
                  alt={adminProfile.name} 
                  className="clone-user-avatar"
                />
                <div className="clone-user-meta">
                  <span className="clone-user-name">{adminProfile.name}</span>
                  <span className="clone-user-role">Admin</span>
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
                      <div className="clone-dropdown-name">{adminProfile.name}</div>
                      <span className="clone-dropdown-role">Admin</span>
                    </div>

                    <div className="clone-profile-dropdown-divider" />

                    {/* 1. Profil Admin */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item"
                      onClick={() => {
                        setActiveTab('pengaturan');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <User size={16} weight="regular" className="clone-dropdown-item-icon" />
                      <span>Profil Admin</span>
                    </button>

                    {/* 2. Rekening Escrow */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item"
                      onClick={() => {
                        setActiveTab('escrow');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <CreditCard size={16} weight="regular" className="clone-dropdown-item-icon" />
                      <span>Rekening Escrow</span>
                    </button>

                    <div className="clone-profile-dropdown-divider" />

                    {/* 3. Keluar */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item clone-profile-dropdown-danger"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onBackToHome();
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

        {/* Dynamic Body Content */}
        <div className="clone-page-body">
          <AdminErrorBoundary key={activeTab}>
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <AdminCloneOverview 
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* TAB 2: KELOLA PENGGUNA */}
            {(activeTab === 'pengguna' || activeTab === 'kyc') && (
              <AdminVerificationView 
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* TAB 3: KELOLA KOMODITAS */}
            {(activeTab === 'komoditas' || activeTab === 'moderasi') && (
              <AdminCommodityModeration />
            )}

            {/* TAB 4: KELOLA PENGADAAN (Permintaan Beli Pembeli ke Petani) */}
            {activeTab === 'pengadaan' && (
              <AdminProcurementView />
            )}

            {/* TAB 5: KELOLA HARGA PASAR */}
            {activeTab === 'hargapasar' && (
              <AdminMarketPriceView />
            )}

            {/* TAB 6: PESAN */}
            {activeTab === 'pesan' && (
              <AdminChatView />
            )}

            {/* TAB 7: ESCROW & KEUANGAN */}
            {activeTab === 'escrow' && (
              <AdminEscrowView />
            )}

            {/* TAB 8: KONTRAK & BINDING */}
            {activeTab === 'binding' && (
              <AdminBindingView />
            )}

            {/* TAB 9: RESOLUSI SENGKETA */}
            {activeTab === 'sengketa' && (
              <AdminDisputeView />
            )}

            {/* TAB 10: PENGATURAN PLATFORM */}
            {activeTab === 'pengaturan' && (
              <AdminSettingsView />
            )}
          </AdminErrorBoundary>
        </div>

      </div>

      {/* ================= BUG REPORT MODAL ================= */}
      {bugModalOpen && (
        <div className="clone-modal-overlay" onClick={() => setBugModalOpen(false)}>
          <div className="clone-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <h3 className="clone-modal-title">Laporkan Kendala Sistem</h3>
              <button type="button" className="clone-modal-close" onClick={() => setBugModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            {bugSubmitted ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <CheckCircle size={48} color="#10b981" weight="fill" />
                <h4 style={{ margin: '1rem 0 0.5rem', color: 'var(--text-primary)' }}>Laporan Terkirim</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Tim devops segera menindaklanjuti tiket ini.</p>
              </div>
            ) : (
              <form onSubmit={handleBugSubmit}>
                <div className="clone-modal-body">
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                      Judul Kendala
                    </label>
                    <input 
                      type="text" 
                      className="clone-modal-input" 
                      placeholder="Contoh: Kesalahan sinkronisasi saldo escrow..."
                      value={bugTitle}
                      onChange={(e) => setBugTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                      Deskripsi Masalah
                    </label>
                    <textarea 
                      className="clone-modal-textarea" 
                      rows={4}
                      placeholder="Jelaskan detail error atau kronologi kendala..."
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      required
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
