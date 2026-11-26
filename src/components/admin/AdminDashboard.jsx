import React, { useState, useEffect } from 'react';
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
  Question,
  Bug,
  X,
  Sun,
  Moon,
  CheckCircle,
  TrendUp,
  ChatCircleText,
  Handshake,
  Plant
} from '@phosphor-icons/react';


import { supabase } from '../../lib/supabaseClient';

import RingkasanAdmin from './RingkasanAdmin';
import KelolaPengguna from './KelolaPengguna';
import KelolaEscrow from './KelolaEscrow';
import KelolaKomoditas from './KelolaKomoditas';
import PengaturanAdmin from './PengaturanAdmin';
import KelolaPengadaan from './KelolaPengadaan';
import KelolaHargaPasar from './KelolaHargaPasar';
import PesanAdmin from './PesanAdmin';
import KelolaLaporanBug from './KelolaLaporanBug';
import NotificationDropdown from '../common/NotificationDropdown';
import NotificationPage from '../common/NotificationPage';
import { useNotifications } from '../../lib/useNotifications';

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

// Route mapping for Admin sub-pages
const ADMIN_TAB_TO_ROUTE = {
  dashboard: '#/admin/dashboard',
  pengguna: '#/admin/kelola-pengguna',
  komoditas: '#/admin/kelola-komoditas',
  pengadaan: '#/admin/kelola-pengadaan',
  hargapasar: '#/admin/kelola-harga-pasar',
  pesan: '#/admin/pesan',
  escrow: '#/admin/escrow',
  laporanbug: '#/admin/laporan-bug',
  pengaturan: '#/admin/pengaturan',
  notifikasi: '#/admin/notifikasi'
};

const getAdminTabFromHash = () => {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('notifikasi') || hash.includes('notifications')) return 'notifikasi';
  if (hash.includes('kelola-pengguna') || hash.includes('verifikasi') || hash.includes('kyc') || hash.includes('pengguna') || hash.includes('users')) return 'pengguna';
  if (hash.includes('kelola-komoditas') || hash.includes('moderasi') || hash.includes('komoditas') || hash.includes('commodity')) return 'komoditas';
  if (hash.includes('kelola-pengadaan') || hash.includes('procurement') || hash.includes('pengadaan')) return 'pengadaan';
  if (hash.includes('harga-pasar') || hash.includes('hargapasar') || hash.includes('market')) return 'hargapasar';
  if (hash.includes('pesan') || hash.includes('chat')) return 'pesan';
  if (hash.includes('escrow')) return 'escrow';
  if (hash.includes('laporan-bug') || hash.includes('bug') || hash.includes('laporan')) return 'laporanbug';
  if (hash.includes('pengaturan') || hash.includes('settings')) return 'pengaturan';
  return 'dashboard';
};

export default function AdminDashboard({ 
  onBackToHome, 
  theme, 
  onToggleTheme 
}) {
  const [activeTab, setActiveTab] = useState(() => getAdminTabFromHash());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Switch tab AND update browser URL hash for deep linking
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const targetRoute = ADMIN_TAB_TO_ROUTE[newTab] || `#/admin/${newTab}`;
    if (window.location.hash !== targetRoute) {
      window.location.hash = targetRoute;
    }
  };

  // Sync with browser back/forward buttons or direct URL change
  useEffect(() => {
    const onHashChange = () => {
      const tab = getAdminTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Modal for Bug Report
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugTitle, setBugTitle] = useState('');

  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const roleStored = localStorage.getItem('agriconnect_auth_user_admin');
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
      // ISOLASI: hanya terima jika role=admin. Tanpa itu id=null agar tidak menarik data petani/pembeli.
      if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'admin')) {
        return {
          id: parsed.id,
          name: parsed.fullName || parsed.name || 'Admin Utama AgriConnect',
          email: parsed.email || 'admin@agriconnect.id',
          phone: parsed.phone || '0812-0000-9999',
          location: '',
          address: '',
          avatar: parsed.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80',
          role: 'admin',
          kycStatus: 'verified',
          createdAt: parsed.created_at || parsed.createdAt || null
        };
      }
    } catch (e) {}
    return {
      id: null,
      name: 'Admin Utama AgriConnect',
      email: 'admin@agriconnect.id',
      phone: '0812-0000-9999',
      location: '',
      address: '',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80',
      role: 'admin',
      kycStatus: 'verified',
      createdAt: null
    };
  });

  const [currentAdminId, setCurrentAdminId] = useState(() => {
    try {
      const roleStored = localStorage.getItem('agriconnect_auth_user_admin');
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
      if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'admin')) return parsed.id;
      return null;
    } catch {
      return null;
    }
  });

  // Load real admin profile from Supabase profiles table — ISOLASI ketat role=admin
  useEffect(() => {
    let isMounted = true;
    const loadAdminProfile = async () => {
      try {
        const roleStored = localStorage.getItem('agriconnect_auth_user_admin');
        const genericStored = localStorage.getItem('agriconnect_auth_user');
        let authUser = null;
        try {
          const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
          if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'admin')) authUser = parsed;
        } catch (e) {}
        const { data: { user } } = await supabase.auth.getUser();
        let currentUserId = user?.id || authUser?.id || null;
        // Validasi role admin dari DB agar petani/pembeli tidak terbaca sebagai admin
        if (currentUserId) {
          try {
            const { data: uProf } = await supabase.from('profiles').select('id, role').eq('id', currentUserId).maybeSingle();
            if (uProf && uProf.role && String(uProf.role).toLowerCase() !== 'admin') return;
            if (user?.id && user.user_metadata?.role && String(user.user_metadata.role).toLowerCase() !== 'admin' && !uProf) return;
          } catch (e) {}
        } else {
          return;
        }
        if (isMounted && currentUserId) setCurrentAdminId(currentUserId);

        if (currentUserId) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUserId)
            .maybeSingle();

          if (isMounted && data) {
            setAdminProfile(prev => ({
              ...prev,
              id: currentUserId,
              name: data.full_name || prev.name,
              email: data.email || user?.email || authUser?.email || prev.email,
              phone: data.phone || prev.phone,
              address: '',
              location: '',
              avatar: data.avatar_url || prev.avatar,
              role: 'admin',
              kycStatus: 'verified',
              createdAt: data.created_at || user?.created_at || prev.createdAt || null,
              adminDepartment: data.department || prev.adminDepartment
            }));
          }
        }
      } catch (err) {
        console.warn('[AdminDashboard] Gagal memuat profil admin dari Supabase:', err);
      }
    };

    loadAdminProfile();

    // Subscribe realtime HANYA untuk profil admin sendiri.
    const channelName = `realtime_admin_profile_${currentAdminId || 'anon'}`;
    const channelFilter = currentAdminId ? { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${currentAdminId}` } : { event: '*', schema: 'public', table: 'profiles', filter: 'id=eq.00000000-0000-0000-0000-000000000000' };
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelFilter, () => {
        loadAdminProfile();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentAdminId]);

  const {
    notifications,
    unreadCount,
    isLoading: notifLoading,
    markAsRead,
    markAllAsRead,
    refresh: refreshNotifications
  } = useNotifications(currentAdminId, 'admin', { limit: 50 });

  const handleNotificationClick = (notif) => {
    if (notif.related_type === 'proposal') {
      handleTabChange('pengadaan');
    } else if (notif.related_type === 'commodity') {
      handleTabChange('komoditas');
    } else if (notif.related_type === 'bug_report') {
      handleTabChange('laporanbug');
    } else if (notif.related_type === 'user' || notif.related_type === 'profile') {
      handleTabChange('pengguna');
    } else if (notif.related_type === 'order' || notif.related_type === 'payment') {
      handleTabChange('escrow');
    } else {
      handleTabChange('notifikasi');
    }
  };

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
      case 'laporanbug':
        return 'Laporan Bug';
      case 'pengaturan':
        return 'Pengaturan Platform';
      case 'notifikasi':
        return 'Notifikasi';
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
    localStorage.removeItem('agriconnect_auth_user');
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.hash = '';
      window.location.reload();
    }
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
              <Plant size={18} weight="fill" color="#ffffff" />
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
                onClick={() => { handleTabChange('dashboard'); setMobileSidebarOpen(false); }}
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
                onClick={() => { handleTabChange('pengguna'); setMobileSidebarOpen(false); }}
                title="Kelola Pengguna"
              >
                {(activeTab === 'pengguna' || activeTab === 'kyc') && <span className="clone-active-indicator" />}
                <Users size={18} weight={activeTab === 'pengguna' || activeTab === 'kyc' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Kelola Pengguna</span>
              </button>

              {/* 3. Kelola Komoditas */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'komoditas' || activeTab === 'moderasi' ? 'active' : ''}`}
                onClick={() => { handleTabChange('komoditas'); setMobileSidebarOpen(false); }}
                title="Kelola Komoditas"
              >
                {(activeTab === 'komoditas' || activeTab === 'moderasi') && <span className="clone-active-indicator" />}
                <Package size={18} weight={activeTab === 'komoditas' || activeTab === 'moderasi' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Kelola Komoditas</span>
              </button>

              {/* 4. Kelola Pengadaan (Pengajuan penawaran dari pembeli ke petani) */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'pengadaan' ? 'active' : ''}`}
                onClick={() => { handleTabChange('pengadaan'); setMobileSidebarOpen(false); }}
                title="Kelola Pengadaan (Pengajuan Penawaran Pembeli: Komoditas, Volume & Target Harga)"
              >
                {activeTab === 'pengadaan' && <span className="clone-active-indicator" />}
                <Handshake size={18} weight={activeTab === 'pengadaan' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Kelola Pengadaan</span>
              </button>

              {/* 5. Kelola Harga Pasar */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'hargapasar' ? 'active' : ''}`}
                onClick={() => { handleTabChange('hargapasar'); setMobileSidebarOpen(false); }}
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
                onClick={() => { handleTabChange('pesan'); setMobileSidebarOpen(false); }}
                title="Pesan"
              >
                {activeTab === 'pesan' && <span className="clone-active-indicator" />}
                <ChatCircleText size={18} weight={activeTab === 'pesan' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Pesan</span>
              </button>

            </div>
          </div>

          {/* SECTION 2: GENERAL */}
          <div className="clone-nav-section" style={{ marginTop: '0.85rem' }}>
            <div className="clone-section-title">GENERAL</div>
            <div className="clone-nav-list">
              
              {/* 1. Notifikasi */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'notifikasi' ? 'active' : ''}`}
                onClick={() => { handleTabChange('notifikasi'); setMobileSidebarOpen(false); }}
                title="Notifikasi Operasional"
              >
                {activeTab === 'notifikasi' && <span className="clone-active-indicator" />}
                <Bell size={18} weight={activeTab === 'notifikasi' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Notifikasi</span>
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: '#5452f6',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '999px',
                    padding: '1px 6px',
                    lineHeight: '1.2'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 2. Pengaturan */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'pengaturan' ? 'active' : ''}`}
                onClick={() => { handleTabChange('pengaturan'); setMobileSidebarOpen(false); }}
                title="Pengaturan"
              >
                {activeTab === 'pengaturan' && <span className="clone-active-indicator" />}
                <Gear size={18} weight={activeTab === 'pengaturan' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Pengaturan</span>
              </button>

              {/* 2. Laporan Bug */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'laporanbug' ? 'active' : ''}`}
                onClick={() => { handleTabChange('laporanbug'); setMobileSidebarOpen(false); }}
                title="Kelola Laporan Bug Pengguna"
              >
                {activeTab === 'laporanbug' && <span className="clone-active-indicator" />}
                <Bug size={18} weight={activeTab === 'laporanbug' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Laporan Bug</span>
              </button>

              {/* 4. Logout */}
              <button
                type="button"
                className="clone-nav-item clone-logout-item"
                onClick={handleLogout}
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
            onClick={() => handleTabChange('escrow')}
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
      <div className={`clone-main-content ${activeTab === 'pesan' ? 'pesan-page-active' : ''}`}>
        
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

            {/* Notification Bell with Supabase Realtime Dropdown */}
            <NotificationDropdown 
              notifications={notifications}
              unreadCount={unreadCount}
              userRole="admin"
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onNotificationClick={handleNotificationClick}
              onViewAll={() => handleTabChange('notifikasi')}
            />

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

                    <div className="clone-profile-dropdown-divider" />

                    {/* 3. Keluar */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item clone-profile-dropdown-danger"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleLogout();
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
        <div className={`clone-page-body ${activeTab === 'pesan' ? 'pesan-active-body' : ''}`}>
          <AdminErrorBoundary key={activeTab}>
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <RingkasanAdmin 
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* TAB 2: KELOLA PENGGUNA */}
            {(activeTab === 'pengguna' || activeTab === 'kyc') && (
              <KelolaPengguna 
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* TAB 3: KELOLA KOMODITAS */}
            {(activeTab === 'komoditas' || activeTab === 'moderasi') && (
              <KelolaKomoditas />
            )}

            {/* TAB 4: KELOLA PENGADAAN (Permintaan Beli Pembeli ke Petani) */}
            {activeTab === 'pengadaan' && (
              <KelolaPengadaan />
            )}

            {/* TAB 5: KELOLA HARGA PASAR */}
            {activeTab === 'hargapasar' && (
              <KelolaHargaPasar />
            )}

            {/* TAB 6: PESAN */}
            {activeTab === 'pesan' && (
              <PesanAdmin
                currentUserId={adminProfile?.id || currentAdminId || null}
                currentUserProfile={adminProfile}
              />
            )}

            {/* TAB 7: ESCROW & KEUANGAN */}
            {activeTab === 'escrow' && (
              <KelolaEscrow />
            )}

            {/* TAB 8: PENGATURAN PLATFORM */}
            {activeTab === 'pengaturan' && (
              <PengaturanAdmin 
                profile={adminProfile}
                onUpdateProfile={(updated) => setAdminProfile(updated)}
                onLogout={handleLogout}
              />
            )}

            {/* TAB 11: KELOLA LAPORAN BUG DARI PENGGUNA */}
            {activeTab === 'laporanbug' && (
              <KelolaLaporanBug />
            )}

            {/* TAB 12: NOTIFIKASI OPERASIONAL & SISTEM */}
            {activeTab === 'notifikasi' && (
              <NotificationPage 
                notifications={notifications}
                unreadCount={unreadCount}
                userRole="admin"
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onNotificationClick={handleNotificationClick}
              />
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
