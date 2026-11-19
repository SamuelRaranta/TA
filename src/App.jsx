import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import GlassNavbar from './components/GlassNavbar';
import HeroSection from './components/HeroSection';
import MarketPriceTicker from './components/MarketPriceTicker';
import CommodityShowcase from './components/CommodityShowcase';
import FeaturesSection from './components/FeaturesSection';
import PortalAccessSection from './components/PortalAccessSection';
import Footer from './components/Footer';
import { supabase } from './lib/supabaseClient';
import { notifyNewUserRegistered } from './lib/notificationService';

// Code-Splitting: Lazy load modul-modul besar agar landing page mobile sangat ringan (< 250 kB)
const AuthPage = lazy(() => import('./components/AuthPage'));
const FarmerDashboard = lazy(() => import('./components/farmer/FarmerDashboard'));
const BuyerDashboard = lazy(() => import('./components/buyer/BuyerDashboard'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

// Fallback spinner saat memuat modul dashboard / autentikasi
function ViewLoadingFallback({ message = 'Memuat modul aplikasi...' }) {
  return (
    <div 
      role="status" 
      aria-live="polite" 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: 'var(--bg-canvas, #f8fafc)', 
        color: 'var(--text-primary, #1e293b)',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}
    >
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div 
          style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid rgba(84, 82, 246, 0.15)', 
            borderTopColor: '#5452f6', 
            borderRadius: '50%', 
            margin: '0 auto 1rem', 
            animation: 'agri-spin 0.75s linear infinite' 
          }} 
        />
        <style>{`
          @keyframes agri-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: '0.25rem' }}>
          AgriConnect
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)' }}>
          {message}
        </div>
      </div>
    </div>
  );
}

// Cache sesi dibersihkan total (generik + per-role) agar tidak ada identitas basi lintas peran.
const clearAllAuthCache = () => {
  try {
    localStorage.removeItem('agriconnect_auth_user');
    localStorage.removeItem('agriconnect_auth_user_petani');
    localStorage.removeItem('agriconnect_auth_user_pembeli');
    localStorage.removeItem('agriconnect_auth_user_admin');
  } catch (e) {}
};

const readCachedUserForRole = (role) => {
  try {
    const keys = role
      ? [`agriconnect_auth_user_${role}`, 'agriconnect_auth_user']
      : ['agriconnect_auth_user'];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (p?.id && (!p?.role || !role || String(p.role).toLowerCase() === String(role).toLowerCase())) return p;
    }
  } catch (e) {}
  return null;
};

const ROLE_FOR_VIEW = {
  'farmer-dashboard': 'petani',
  'buyer-dashboard': 'pembeli',
  'admin-dashboard': 'admin'
};

const VIEW_FOR_ROLE = {
  petani: 'farmer-dashboard',
  pembeli: 'buyer-dashboard',
  admin: 'admin-dashboard'
};

const HASH_FOR_VIEW = {
  'farmer-dashboard': '#/dashboard/petani',
  'buyer-dashboard': '#/dashboard/pembeli',
  'admin-dashboard': '#/dashboard/admin'
};

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>Terjadi Kendala Tampilan</h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {this.state.error?.message || 'Sistem mengalami kendala sementara saat merender tampilan.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => { window.location.hash = ''; window.location.reload(); }}
                style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', background: '#5452f6', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AppContent />
    </GlobalErrorBoundary>
  );
}

function AppContent() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('agriconnect_theme') || 'light';
  });
  const isRecoveryPending = () => {
    try {
      return sessionStorage.getItem('agriconnect_recovery_pending') === '1';
    } catch (e) {
      return false;
    }
  };
  const isRecoveryUrl = (hash, search) => {
    // Jangan anggap sebagai pemulihan kata sandi jika ini adalah alur OAuth
    if (localStorage.getItem('agriconnect_oauth_in_progress') || hash.includes('provider_token=') || hash.includes('provider_refresh_token=')) {
      return false;
    }
    return (
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      hash.includes('token_hash=') ||
      search.includes('token_hash=') ||
      hash.startsWith('#/auth') ||
      hash.startsWith('#/reset-password') ||
      hash.startsWith('#/update-password') ||
      (isRecoveryPending() && (search.includes('code=') || hash.includes('code=') || hash.includes('access_token=')))
    );
  };

  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (isRecoveryUrl(hash, search)) return 'login';
    if (hash.startsWith('#/login')) return 'login';
    if (hash.startsWith('#/signup') || hash.startsWith('#/register')) return 'signup';
    if (hash.startsWith('#/dashboard/petani') || hash.startsWith('#/petani')) return 'farmer-dashboard';
    if (hash.startsWith('#/dashboard/pembeli') || hash.startsWith('#/pembeli')) return 'buyer-dashboard';
    if (hash.startsWith('#/dashboard/admin') || hash.startsWith('#/admin')) return 'admin-dashboard';
    return 'home';
  });
  const [authVersion, setAuthVersion] = useState(0);
  // Optimistis: jika cache cocok dengan view dari URL, render dashboard langsung
  // sambil verifikasi background — tanpa kunci layar tiap refresh.
  const [dashboardAccess, setDashboardAccess] = useState(() => {
    const hash = window.location.hash || '';
    let view = null;
    if (hash.startsWith('#/dashboard/petani') || hash.startsWith('#/petani')) view = 'farmer-dashboard';
    else if (hash.startsWith('#/dashboard/pembeli') || hash.startsWith('#/pembeli')) view = 'buyer-dashboard';
    else if (hash.startsWith('#/dashboard/admin') || hash.startsWith('#/admin')) view = 'admin-dashboard';
    if (!view) return { view: null, status: 'idle' };
    const cached = readCachedUserForRole(ROLE_FOR_VIEW[view]);
    return cached?.id
      ? { view, status: 'checking', optimistic: true }
      : { view: null, status: 'checking' };
  });
  const accessRef = useRef(dashboardAccess);
  useEffect(() => { accessRef.current = dashboardAccess; }, [dashboardAccess]);
  const lastVerifiedUserRef = useRef(null);
  // Navigasi eksplisit ke beranda tidak boleh ditimpa redirect SIGNED_OUT.
  const suppressSignOutRedirectRef = useRef(false);
  // Cermin view terkini untuk listener auth (closure effect hanya jalan sekali).
  const viewRef = useRef(currentView);
  useEffect(() => { viewRef.current = currentView; }, [currentView]);
  const [selectedRole, setSelectedRole] = useState('petani');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('agriconnect_theme', theme);
  }, [theme]);

  // Sync with browser URL hash (supporting sub-routes)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (isRecoveryUrl(hash, search)) {
        setCurrentView('login');
      } else if (hash.startsWith('#/login')) {
        setCurrentView('login');
      } else if (hash.startsWith('#/signup') || hash.startsWith('#/register')) {
        setCurrentView('signup');
      } else if (hash.startsWith('#/dashboard/petani') || hash.startsWith('#/petani')) {
        setCurrentView('farmer-dashboard');
      } else if (hash.startsWith('#/dashboard/pembeli') || hash.startsWith('#/pembeli')) {
        setCurrentView('buyer-dashboard');
      } else if (hash.startsWith('#/dashboard/admin') || hash.startsWith('#/admin')) {
        setCurrentView('admin-dashboard');
      } else if (hash === '' || hash === '#/' || hash === '#home') {
        // supabase-js mengosongkan hash saat mengonsumsi token recovery
        // (GoTrueClient._getSessionFromURL). Itu BUKAN navigasi user:
        // tahan di login agar halaman ganti-password tidak hilang.
        if (isRecoveryPending()) {
          setCurrentView('login');
        } else {
          setCurrentView('home');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleOpenLogin = () => {
    setCurrentView('login');
    window.location.hash = '#/login';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSignup = (role = 'petani') => {
    setSelectedRole(role);
    setCurrentView('signup');
    window.location.hash = '#/signup';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFarmerDashboard = () => {
    setCurrentView('farmer-dashboard');
    window.location.hash = '#/dashboard/petani';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBuyerDashboard = () => {
    setCurrentView('buyer-dashboard');
    window.location.hash = '#/dashboard/pembeli';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdminDashboard = () => {
    setCurrentView('admin-dashboard');
    window.location.hash = '#/dashboard/admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Verifikasi akses dashboard: optimistis (render langsung dari cache) + validasi background.
  // Tidak lagi me-reset layar ke "Memeriksa..." tiap refresh / token refresh.
  useEffect(() => {
    const requestedRole = ROLE_FOR_VIEW[currentView];
    if (!requestedRole) {
      setDashboardAccess({ view: null, status: 'idle' });
      return undefined;
    }

    let cancelled = false;
    const currentSnapshot = accessRef.current;

    // Sudah terverifikasi untuk view ini + user yang sama -> lewati (cegah flicker).
    if (
      currentSnapshot?.view === currentView &&
      currentSnapshot?.status === 'verified' &&
      lastVerifiedUserRef.current &&
      authVersion === lastVerifiedUserRef.current.authVersion
    ) {
      return undefined;
    }

    // Optimistis: jika cache cocok, tampilkan dashboard langsung sambil cek background.
    const cached = readCachedUserForRole(requestedRole);
    if (cached?.id && currentSnapshot?.view !== currentView) {
      setDashboardAccess({ view: currentView, status: 'checking', optimistic: true });
    } else if (!cached?.id && currentSnapshot?.view !== currentView) {
      setDashboardAccess({ view: null, status: 'checking' });
    }
    // Jika view sama sudah tampil (optimistis/verified), jangan reset — validasi diam-diam.

    const denyAccess = async (hard = true) => {
      if (cancelled) return;
      if (hard) {
        await supabase.auth.signOut().catch(() => {});
        clearAllAuthCache();
        lastVerifiedUserRef.current = null;
        setDashboardAccess({ view: null, status: 'denied' });
        setCurrentView('login');
        window.location.hash = '#/login';
      } else {
        // Gangguan sementara (network/timeout): pertahankan tampilan optimistis, jangan tendang user.
        console.warn('[App] Verifikasi tertunda, pertahankan sesi lokal.');
        setDashboardAccess(prev => (prev.view === currentView ? prev : { view: null, status: 'checking' }));
      }
    };

    const withTimeout = (promise, ms) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('verify-timeout')), ms))
      ]);

    const verifyDashboardAccess = async () => {
      // Jalur cepat: sesi lokal (tanpa roundtrip server seperti getUser).
      let userId = null;
      let userEmail = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          userId = session.user.id;
          userEmail = session.user.email;
        }
      } catch (e) {}

      // Fallback: konfirmasi ke server (sekali saja, dengan timeout).
      if (!userId) {
        try {
          const { data: { user } } = await withTimeout(supabase.auth.getUser(), 8000);
          if (cancelled) return;
          if (user) {
            userId = user.id;
            userEmail = user.email;
          }
        } catch (e) {
          if (cancelled) return;
          // Timeout/network + masih ada cache optimistis -> jangan deny, biarkan tampil.
          if (readCachedUserForRole(requestedRole)?.id) {
            await denyAccess(false);
            return;
          }
        }
      }

      if (!userId) {
        // Tidak ada sesi sama sekali. Jika cache optimistis ada, beri kesempatan (mis. session belum restore),
        // coba sekali lagi via getUser sebelum menendang.
        if (readCachedUserForRole(requestedRole)?.id) {
          try {
            const { data: { user } } = await withTimeout(supabase.auth.getUser(), 8000);
            if (cancelled) return;
            if (user) {
              userId = user.id;
              userEmail = user.email;
            }
          } catch (e) {}
        }
        if (!userId) {
          if (cancelled) return;
          await denyAccess(true);
          return;
        }
      }

      let profile = null;
      try {
        const res = await withTimeout(
          supabase.from('profiles').select('role, kyc_status').eq('id', userId).maybeSingle(),
          8000
        );
        if (cancelled) return;
        profile = res?.data;
        if (res?.error) throw new Error(res.error.message);
      } catch (e) {
        if (cancelled) return;
        // Gagal baca profil karena network/timeout -> jangan tendang jika optimistis.
        if (e?.message === 'verify-timeout' && readCachedUserForRole(requestedRole)?.id) {
          await denyAccess(false);
          return;
        }
        await denyAccess(true);
        return;
      }

      // Auto-provision profil untuk pengguna OAuth baru jika belum ada di database
      if (!profile) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.id === userId) {
            const oauthRole = localStorage.getItem('agriconnect_oauth_role') || requestedRole || 'petani';
            const resolvedName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Pengguna Baru';
            const defaultAvatar = oauthRole === 'pembeli'
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80';
            const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || defaultAvatar;

            const newProf = {
              id: user.id,
              role: oauthRole,
              full_name: resolvedName,
              email: user.email,
              phone: '0812-4321-8765',
              location: 'Minahasa, Sulawesi Utara',
              avatar_url: avatarUrl,
              kyc_status: 'verified'
            };
            const { error: insErr } = await supabase.from('profiles').upsert(newProf);
            if (!insErr) {
              profile = { role: oauthRole, kyc_status: 'verified' };
              try {
                await notifyNewUserRegistered({ userId: user.id, userRole: oauthRole });
              } catch (e) {}
            }
          }
        } catch (e) {
          console.warn('Auto-provision OAuth profile notice:', e);
        }
      }

      if (!profile || !['petani', 'pembeli', 'admin'].includes(profile.role)) {
        await denyAccess(true);
        return;
      }

      const profileApproved = profile.role === 'admin' || profile.kyc_status === 'verified';
      if (!profileApproved) {
        await denyAccess(true);
        return;
      }

      if (profile.role !== requestedRole) {
        const targetView = VIEW_FOR_ROLE[profile.role];
        if (cancelled) return;
        lastVerifiedUserRef.current = { userId, authVersion };
        setDashboardAccess({ view: targetView, status: 'verified' });
        setCurrentView(targetView);
        window.location.hash = HASH_FOR_VIEW[targetView];
        return;
      }

      if (cancelled) return;
      lastVerifiedUserRef.current = { userId, authVersion };
      // Segarkan cache peran agar refresh berikutnya instan.
      try {
        const payload = { id: userId, email: userEmail, role: profile.role };
        localStorage.setItem('agriconnect_auth_user', JSON.stringify({ ...(readCachedUserForRole(null) || {}), ...payload }));
        localStorage.setItem(`agriconnect_auth_user_${profile.role}`, JSON.stringify(payload));
      } catch (e) {}
      setDashboardAccess({ view: currentView, status: 'verified' });
    };

    verifyDashboardAccess().catch(() => denyAccess(false));
    return () => { cancelled = true; };
  }, [currentView, authVersion]);

  // Sync Supabase Auth state with local storage & auto-handle OAuth callbacks.
  useEffect(() => {
    const processUserSession = async (session) => {
      if (!session?.user) return;
      try {
        const isOAuthInProgress = Boolean(
          localStorage.getItem('agriconnect_oauth_in_progress') ||
          session.user.app_metadata?.provider !== 'email'
        );

        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const savedRole = localStorage.getItem('agriconnect_oauth_role');
        const role = profile?.role || savedRole || session.user.user_metadata?.role || 'petani';
        const name = profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Pengguna Baru';

        if (!profile) {
          const defaultAvatar = role === 'pembeli'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80';
          const avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || defaultAvatar;

          await supabase.from('profiles').upsert({
            id: session.user.id,
            role: role,
            full_name: name,
            email: session.user.email,
            phone: '0812-4321-8765',
            location: 'Minahasa, Sulawesi Utara',
            avatar_url: avatarUrl,
            kyc_status: 'verified'
          });

          try {
            await notifyNewUserRegistered({ userId: session.user.id, userRole: role });
          } catch (e) {}
        } else if (profile.kyc_status === 'pending' && isOAuthInProgress) {
          await supabase.from('profiles').update({ kyc_status: 'verified' }).eq('id', session.user.id);
        }

        const payload = {
          id: session.user.id,
          email: session.user.email,
          role: role,
          fullName: name,
          name: name
        };
        localStorage.setItem('agriconnect_auth_user', JSON.stringify(payload));
        localStorage.setItem(`agriconnect_auth_user_${role}`, JSON.stringify(payload));

        if (isOAuthInProgress) {
          localStorage.removeItem('agriconnect_oauth_in_progress');
          localStorage.removeItem('agriconnect_oauth_role');
          const targetView = role === 'admin' ? 'admin-dashboard' : role === 'pembeli' ? 'buyer-dashboard' : 'farmer-dashboard';
          const targetHash = role === 'admin' ? '#/dashboard/admin' : role === 'pembeli' ? '#/dashboard/pembeli' : '#/dashboard/petani';
          setDashboardAccess({ view: targetView, status: 'verified' });
          setCurrentView(targetView);
          window.location.hash = targetHash;
        }
      } catch (err) {
        console.warn('OAuth session processing warning:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        processUserSession(session);
      }
    }).catch(err => {
      console.warn('Session check warning:', err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCurrentView('login');
      } else if (event === 'SIGNED_IN') {
        if (session?.user) {
          processUserSession(session);
        }
        if (!lastVerifiedUserRef.current || lastVerifiedUserRef.current.userId !== session?.user?.id) {
          setAuthVersion(version => version + 1);
        }
      } else if (event === 'SIGNED_OUT') {
        clearAllAuthCache();
        lastVerifiedUserRef.current = null;
        setDashboardAccess({ view: null, status: 'idle' });
        // Jangan timpa navigasi eksplisit (mis. "Kembali ke Beranda" yang juga memanggil signOut).
        if (suppressSignOutRedirectRef.current) {
          suppressSignOutRedirectRef.current = false;
          return;
        }
        // Hanya tendang ke login jika sedang di dashboard (sesi kedaluwarsa).
        const v = viewRef.current;
        if (v === 'farmer-dashboard' || v === 'buyer-dashboard' || v === 'admin-dashboard') {
          setCurrentView('login');
          window.location.hash = '#/login';
        }
      } else if (event === 'USER_UPDATED') {
        setAuthVersion(version => version + 1);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleBackToHome = () => {
    // Keluar eksplisit dari alur recovery (flag ikut dibersihkan).
    try {
      sessionStorage.removeItem('agriconnect_recovery_pending');
    } catch (e) {}
    // Tandai agar event SIGNED_OUT dari signOut ini tidak mengembalikan ke #/login.
    suppressSignOutRedirectRef.current = true;
    supabase.auth.signOut().catch(() => {}).finally(() => {
      // Pengaman: jika event tidak datang (tanpa sesi), flag dibersihkan otomatis.
      setTimeout(() => { suppressSignOutRedirectRef.current = false; }, 3000);
    });
    clearAllAuthCache();
    lastVerifiedUserRef.current = null;
    setDashboardAccess({ view: null, status: 'idle' });
    setCurrentView('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToCommodities = () => {
    const el = document.getElementById('pasar-komoditas') || document.getElementById('komoditas');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleOpenSignup('pembeli');
    }
  };

  // If user is on the Login or Signup view, render dedicated AuthPage matching reference
  if (currentView === 'login' || currentView === 'signup') {
    return (
      <Suspense fallback={<ViewLoadingFallback message="Memuat halaman autentikasi..." />}>
        <AuthPage 
          initialMode={currentView}
          initialRole={selectedRole}
          onBackToHome={handleBackToHome}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onNavigateToDashboard={() => handleOpenFarmerDashboard()}
          onNavigateToBuyerDashboard={() => handleOpenBuyerDashboard()}
          onNavigateToAdminDashboard={() => handleOpenAdminDashboard()}
        />
      </Suspense>
    );
  }

  const isDashboardView = ['farmer-dashboard', 'buyer-dashboard', 'admin-dashboard'].includes(currentView);
  if (isDashboardView && dashboardAccess.view !== currentView) {
    return (
      <div role="status" aria-live="polite" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: '0.5rem' }}>Memeriksa sesi dan hak akses...</div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #64748b)', marginBottom: '1.25rem' }}>Menunggu konfirmasi Supabase. Jika lebih dari 10 detik, coba muat ulang verifikasi.</div>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setAuthVersion(v => v + 1)}
              style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', background: '#5452f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={handleBackToHome}
              style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary, #64748b)', border: '1px solid var(--border-subtle, #e2e8f0)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is on the Farmer Dashboard view
  if (currentView === 'farmer-dashboard') {
    return (
      <Suspense fallback={<ViewLoadingFallback message="Memuat Dashboard Petani..." />}>
        <FarmerDashboard
          onBackToHome={handleBackToHome}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      </Suspense>
    );
  }

  // If user is on the Buyer Dashboard view
  if (currentView === 'buyer-dashboard') {
    return (
      <Suspense fallback={<ViewLoadingFallback message="Memuat Dashboard Pembeli..." />}>
        <BuyerDashboard
          onBackToHome={handleBackToHome}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      </Suspense>
    );
  }

  // If user is on the Admin Dashboard view
  if (currentView === 'admin-dashboard') {
    return (
      <Suspense fallback={<ViewLoadingFallback message="Memuat Dashboard Administrator..." />}>
        <AdminDashboard
          onBackToHome={handleBackToHome}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      </Suspense>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      {/* Navbar with Dark/Light Toggle */}
      <GlassNavbar 
        onOpenLogin={handleOpenLogin}
        onOpenSignup={() => handleOpenSignup('petani')}
        onOpenFarmerDashboard={handleOpenFarmerDashboard}
        onOpenBuyerDashboard={handleOpenBuyerDashboard}
        onOpenAdminDashboard={handleOpenAdminDashboard}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Landing Sections */}
      <main style={{ flex: 1 }}>
        <HeroSection 
          onOpenSimulation={handleScrollToCommodities}
          onRoleSelect={(role) => {
            if (role === 'petani') {
              handleOpenFarmerDashboard();
            } else if (role === 'pembeli') {
              handleOpenBuyerDashboard();
            } else {
              handleOpenSignup(role);
            }
          }}
        />

        <MarketPriceTicker />

        <FeaturesSection 
          onOpenSimulation={handleScrollToCommodities}
        />

        <CommodityShowcase 
          onSelectCommodity={() => handleOpenSignup('pembeli')}
          onRequireLogin={handleOpenLogin}
          onRegister={() => handleOpenSignup('pembeli')}
        />

        {/* Dedicated Portal Access Section at the bottom of the landing page */}
        <PortalAccessSection 
          onOpenFarmerDashboard={handleOpenFarmerDashboard}
          onOpenBuyerDashboard={handleOpenBuyerDashboard}
          onOpenAdminDashboard={handleOpenAdminDashboard}
        />
      </main>

      {/* Footer with portal links */}
      <Footer 
        onOpenFarmerDashboard={handleOpenFarmerDashboard}
        onOpenBuyerDashboard={handleOpenBuyerDashboard}
        onOpenAdminDashboard={handleOpenAdminDashboard}
      />
    </div>
  );
}


