import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plant, 
  Eye, 
  EyeSlash, 
  ArrowLeft, 
  Sun, 
  Moon, 
  CheckCircle,
  BuildingOffice,
  ShieldCheck,
  Check,
  Key,
  LockKey,
  WarningCircle,
  CircleNotch,
  Sparkle,
  X,
  Clock,
  MagnifyingGlass,
  WhatsappLogo,
  EnvelopeSimple,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabaseClient';
import { notifyNewUserRegistered } from '../lib/notificationService';

// Helper to extract auth tokens and codes from any URL format
export const extractAuthParamsFromUrl = (url = window.location.href) => {
  const result = {};

  // 1. Search in query string (?...)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, val] of searchParams.entries()) {
      result[key] = val;
    }
  } catch (e) {}

  // 2. Search in hash fragments (#...)
  const hashParts = (url || '').split('#').slice(1);
  for (const part of hashParts) {
    const subParts = part.split('?');
    for (const sub of subParts) {
      if (sub.includes('=')) {
        const pairs = sub.split('&');
        for (const pair of pairs) {
          const [rawKey, ...valParts] = pair.split('=');
          const key = decodeURIComponent(rawKey).trim();
          const val = decodeURIComponent(valParts.join('=')).trim();
          if (key && val) {
            result[key] = val;
          }
        }
      }
    }
  }

  // 3. Fallback regex patterns
  if (!result.access_token) {
    const m = url.match(/access_token=([^&]+)/);
    if (m) result.access_token = decodeURIComponent(m[1]);
  }
  if (!result.refresh_token) {
    const m = url.match(/refresh_token=([^&]+)/);
    if (m) result.refresh_token = decodeURIComponent(m[1]);
  }
  if (!result.code) {
    const m = url.match(/[?&]code=([^&#]+)/);
    if (m) result.code = decodeURIComponent(m[1]);
  }
  if (!result.type) {
    const m = url.match(/[?&#]type=([^&#]+)/);
    if (m) result.type = decodeURIComponent(m[1]);
  }

  return result;
};

const isRecoveryPending = () => {
  try {
    return sessionStorage.getItem('agriconnect_recovery_pending') === '1';
  } catch (e) {
    return false;
  }
};

const clearRecoveryPending = () => {
  try {
    sessionStorage.removeItem('agriconnect_recovery_pending');
  } catch (e) {}
};

export default function AuthPage({
  initialMode = 'login',
  initialRole = 'petani',
  onBackToHome,
  theme,
  onToggleTheme,
  onNavigateToDashboard,
  onNavigateToBuyerDashboard,
  onNavigateToAdminDashboard
}) {
  // Jika mendarat dari link email recovery, langsung buka form ganti-password
  // (jangan flash login dulu).
  const [mode, setMode] = useState(() => (isRecoveryPending() ? 'update_password' : initialMode)); // 'login' | 'signup' | 'forgot'
  const [role, setRole] = useState(initialRole); // 'petani' | 'pembeli' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [signupSent, setSignupSent] = useState(false);

  // Menu Bantuan Header (2 garis vertikal): Cek Status Akun & Hubungi Admin
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckStatusOpen, setIsCheckStatusOpen] = useState(false);
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false);
  const [checkEmail, setCheckEmail] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [checkError, setCheckError] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleCheckAccountStatus = async (e) => {
    if (e) e.preventDefault();
    const queryEmail = checkEmail.trim().toLowerCase();
    if (!queryEmail) {
      setCheckError('Silakan masukkan alamat email yang terdaftar.');
      return;
    }
    setCheckLoading(true);
    setCheckError('');
    setCheckResult(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, kyc_status, created_at, email')
        .ilike('email', queryEmail)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCheckResult({ found: true, ...data });
      } else {
        setCheckResult({ found: false, email: queryEmail });
      }
    } catch (err) {
      console.error('Cek status akun error:', err);
      setCheckError('Gagal memeriksa status akun. Pastikan koneksi internet aktif.');
    } finally {
      setCheckLoading(false);
    }
  };

  useEffect(() => {
    // Jangan timpa form ganti-password yang sedang dibuka dari link email.
    if (isRecoveryPending()) {
      setMode('update_password');
    } else {
      setMode(initialMode);
    }
    setRole(initialRole);
    setErrorMessage('');

    let cancelled = false;

    // Alur recovery deterministik: JANGAN hanya andalkan event
    // PASSWORD_RECOVERY (bisa tiba sebelum subscribe, lalu hilang).
    // Flag ditangkap di main.jsx sebelum client menghapus token dari URL.
    const bootRecovery = async () => {
      const pending = isRecoveryPending();
      const params = extractAuthParamsFromUrl();
      const isOAuthReturn = Boolean(
        localStorage.getItem('agriconnect_oauth_in_progress') ||
        params.type === 'bearer' ||
        window.location.hash.includes('provider_token=') ||
        window.location.hash.includes('provider_refresh_token=')
      );

      // Jangan jalankan alur pemulihan jika ini adalah OAuth return
      if (isOAuthReturn && !pending && params.type !== 'recovery') {
        clearRecoveryPending();
        return;
      }

      const hasParams = Boolean(
        params.code ||
        (params.access_token && params.refresh_token) ||
        params.token_hash
      );

      // 1. Sesi sudah ada (mis. client init otomatis dari URL) -> langsung form jika recovery.
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          if (pending || params.type === 'recovery') {
            setMode('update_password');
            return;
          }
          // Jika mendarat dengan sesi OAuth aktif
          if (isOAuthReturn || session.user?.app_metadata?.provider !== 'email') {
            const chosenRole = localStorage.getItem('agriconnect_oauth_role') || role || 'petani';
            setIsSuccess(true);
            setTimeout(() => {
              if (chosenRole === 'admin') {
                if (onNavigateToAdminDashboard) onNavigateToAdminDashboard();
                else window.location.hash = '#/dashboard/admin';
              } else if (chosenRole === 'pembeli') {
                if (onNavigateToBuyerDashboard) onNavigateToBuyerDashboard();
                else window.location.hash = '#/dashboard/pembeli';
              } else {
                if (onNavigateToDashboard) onNavigateToDashboard();
                else window.location.hash = '#/dashboard/petani';
              }
            }, 600);
            return;
          }
          return;
        }
      } catch (e) {}

      // 2. Tukar parameter URL menjadi sesi pemulihan (hanya jika ada indikator recovery).
      if (hasParams && (pending || params.type === 'recovery')) {
        try {
          if (params.code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
            if (!error && data?.session) {
              console.log('[AuthPage] PKCE recovery session established');
              if (!cancelled) setMode('update_password');
              return;
            }
          } else if (params.access_token && params.refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token
            });
            if (!error && data?.session) {
              console.log('[AuthPage] Recovery session established from URL tokens');
              if (!cancelled) setMode('update_password');
              return;
            }
          } else if (params.token_hash) {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: params.token_hash,
              type: 'recovery'
            });
            if (!error && data?.session) {
              console.log('[AuthPage] Recovery session established via token_hash');
              if (!cancelled) setMode('update_password');
              return;
            }
          }
        } catch (e) {
          console.warn('[AuthPage] recovery session warning:', e);
        }
        if (!cancelled) {
          // Parameter ada tapi sesi gagal dibentuk (kedaluwarsa/terpakai):
          // tampilkan form + pesan, jangan lempar diam-diam ke login.
          setMode('update_password');
          setErrorMessage('Tautan pemulihan tidak valid atau sudah dipakai. Silakan minta tautan baru lewat Lupa Kata Sandi.');
        }
        return;
      }

      // 3. Flag ada tapi tanpa sesi/parameter: arahkan minta tautan baru.
      if (pending && !cancelled && params.type === 'recovery') {
        setMode('update_password');
        setErrorMessage('Sesi pemulihan tidak ditemukan. Silakan minta tautan baru lewat Lupa Kata Sandi.');
      }
    };

    bootRecovery();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && window.location.hash.includes('type=recovery'))) {
        setMode('update_password');
      }
    });

    return () => {
      cancelled = true;
      authListener?.subscription?.unsubscribe();
    };
  }, [initialMode, initialRole]);

  const handleSocialAuth = async (provider = 'google') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Catat peran yang dipilih (petani / pembeli)
      localStorage.setItem('agriconnect_oauth_role', role);
      localStorage.setItem('agriconnect_oauth_in_progress', provider);

      const redirectUrl = `${window.location.origin}/`;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xvazeoftqsmyysfmhdiq.supabase.co';

      // Uji apakah provider sudah diaktifkan di dashboard Supabase
      try {
        const testRes = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUrl)}`, {
          method: 'GET'
        });
        if (testRes.status === 400) {
          const errJson = await testRes.json().catch(() => ({}));
          if (errJson?.msg?.includes('not enabled') || errJson?.error_code === 'validation_failed') {
            setErrorMessage(`Login & Daftar via Google belum diaktifkan di Dashboard Supabase. Silakan aktifkan provider "Google" di Supabase Console > Authentication > Providers atau masuk menggunakan Email & Password.`);
            localStorage.removeItem('agriconnect_oauth_in_progress');
            setIsLoading(false);
            return;
          }
        }
      } catch (preCheckErr) {
        console.warn('OAuth pre-check notice:', preCheckErr);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(`OAuth error [${provider}]:`, err);
      setErrorMessage(err.message || `Gagal memulai autentikasi dengan Google.`);
      localStorage.removeItem('agriconnect_oauth_in_progress');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) {
          console.warn('Login error:', error.message);
          if (error.message.includes('Email not confirmed')) {
            setErrorMessage('Email Anda belum dikonfirmasi. Silakan periksa inbox/spam email Anda dan klik tautan konfirmasi terlebih dahulu.');
          } else if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('Email atau password salah.');
          } else {
            setErrorMessage('Gagal masuk. Silakan periksa kembali data Anda.');
          }
          setIsLoading(false);
          return;
        }

        // Determine user role and check admin approval
        let userRole = null;
        let kycStatus = 'pending';
        let profileData = null;

        try {
          const { data: prof, error: profileError } = await supabase
            .from('profiles')
            .select('role, full_name, kyc_status')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profileError || !prof) {
            await supabase.auth.signOut();
            setErrorMessage('Profil akun tidak dapat diverifikasi. Coba lagi atau hubungi admin.');
            return;
          }

          if (prof) {
            profileData = prof;
            if (prof.role) userRole = prof.role;
            if (prof.kyc_status) kycStatus = prof.kyc_status;
          }
        } catch (profErr) {
          console.warn('Profile read warning:', profErr);
        }

        // Non-admin users must be approved by Admin
        if (userRole !== 'admin') {
          if (kycStatus === 'pending') {
            await supabase.auth.signOut();
            setErrorMessage('Akun Anda sedang menunggu verifikasi oleh Admin. Anda baru dapat masuk setelah akun disetujui.');
            setIsLoading(false);
            return;
          }

          if (kycStatus === 'rejected') {
            await supabase.auth.signOut();
            setErrorMessage('Pendaftaran akun Anda ditolak oleh Admin. Silakan hubungi dukungan platform.');
            setIsLoading(false);
            return;
          }
        }

        const resolvedUserName = profileData?.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || '';
        const normalizedRole = (userRole || data.user.user_metadata?.role || '').toLowerCase().trim();
        const authPayload = {
          id: data.user.id,
          email: data.user.email,
          role: normalizedRole,
          fullName: resolvedUserName,
          name: resolvedUserName
        };

        localStorage.setItem('agriconnect_auth_user', JSON.stringify(authPayload));
        if (normalizedRole) {
          localStorage.setItem(`agriconnect_auth_user_${normalizedRole}`, JSON.stringify(authPayload));
        }

        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          if (normalizedRole === 'admin') {
            if (onNavigateToAdminDashboard) onNavigateToAdminDashboard();
            else window.location.hash = '#/dashboard/admin';
          } else if (normalizedRole === 'pembeli') {
            if (onNavigateToBuyerDashboard) onNavigateToBuyerDashboard();
            else window.location.hash = '#/dashboard/pembeli';
          } else {
            if (onNavigateToDashboard) onNavigateToDashboard();
            else window.location.hash = '#/dashboard/petani';
          }
        }, 800);

      } else if (mode === 'signup') {
        const userFullName = fullName.trim() || (role === 'pembeli' ? 'Hendra Pratama' : 'Hengky Mandagi');
        const defaultPhone = '0812-4321-8765';
        const defaultLocation = role === 'admin' ? null : 'Minahasa, Sulawesi Utara';
        const defaultAvatar = role === 'admin'
          ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80'
          : role === 'pembeli'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80';
        
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              role: role,
              full_name: userFullName,
              phone: defaultPhone,
              location: defaultLocation,
              avatar_url: defaultAvatar
            },
            emailRedirectTo: window.location.origin
          }
        });

        if (error) {
          setErrorMessage(
            error.message.includes('already registered')
              ? 'Email ini sudah terdaftar. Silakan gunakan email lain atau pilih Masuk.'
              : `Pendaftaran gagal: ${error.message}`
          );
          setIsLoading(false);
          return;
        }

        // With email confirmation enabled there is no authenticated browser session yet.
        // The database auth.users trigger creates the pending profile in that case.
        if (data?.user && data.session) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            role,
            full_name: userFullName,
            email: email.trim(),
            phone: defaultPhone,
            location: defaultLocation,
            avatar_url: defaultAvatar,
            kyc_status: role === 'admin' ? 'verified' : 'pending'
          });

          if (profileError) {
            await supabase.auth.signOut();
            setErrorMessage('Akun dibuat, tetapi profil belum berhasil disimpan. Silakan coba masuk kembali beberapa saat lagi.');
            return;
          }
        }

        setSignupSent(true);
        setMode('signup_sent');
      }
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setErrorMessage(err?.message || 'Terjadi kendala saat memproses permintaan. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const targetEmail = (forgotEmail || email).trim();
    if (!targetEmail) {
      setErrorMessage('Mohon masukkan email Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Mengirimkan URL bersih (tanpa '#') agar Supabase dapat menyematkan token hash dengan standar OAuth2
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl
      });

      if (error) {
        setErrorMessage(`Gagal mengirim tautan reset: ${error.message}`);
        setIsLoading(false);
        return;
      }

      setForgotSent(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setErrorMessage('Terjadi kendala saat mengirim email pemulihan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Pastikan sesi pemulihan aktif
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const params = extractAuthParamsFromUrl();
        if (params.code) {
          try {
            const { data: codeData } = await supabase.auth.exchangeCodeForSession(params.code);
            session = codeData?.session;
          } catch (e) {}
        } else if (params.access_token && params.refresh_token) {
          try {
            const { data: tokenData } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token
            });
            session = tokenData?.session;
          } catch (e) {}
        } else if (params.token_hash) {
          try {
            const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
              token_hash: params.token_hash,
              type: 'recovery'
            });
            if (!otpError) session = otpData?.session;
          } catch (e) {}
        }
      }

      if (!session) {
        setErrorMessage('Sesi pemulihan telah kedaluwarsa atau tidak valid. Silakan ajukan tautan reset kata sandi baru melalui menu Lupa Kata Sandi.');
        setIsLoading(false);
        return;
      }

      // 2. Perbarui kata sandi pengguna
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        if (error.message?.includes('Auth session missing') || error.message?.includes('session')) {
          setErrorMessage('Sesi pemulihan telah kedaluwarsa atau tidak valid. Silakan ajukan tautan reset kata sandi baru melalui menu Lupa Kata Sandi.');
        } else {
          setErrorMessage(`Gagal memperbarui kata sandi: ${error.message}`);
        }
        setIsLoading(false);
        return;
      }

      alert('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.');
      setNewPassword('');
      setConfirmPassword('');
      // Bersihkan flag recovery + keluar dari sesi pemulihan agar state bersih.
      clearRecoveryPending();
      await supabase.auth.signOut().catch(() => {});
      setMode('login');
      window.location.hash = '#/login';
      if (window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + '#/login');
      }
    } catch (err) {
      console.error('Update password exception:', err);
      setErrorMessage('Terjadi kendala saat memperbarui kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Latar Belakang Biru Laut yang Mengalir (Flowing Ocean Currents & Streams) */}
      <div className="auth-ocean-flow-bg">
        <div className="auth-ocean-stream stream-1" />
        <div className="auth-ocean-stream stream-2" />
        <div className="auth-ocean-stream stream-3" />
      </div>

      {/* Layer Ombak Biru Laut Mengalir di Bagian Bawah */}
      <div className="auth-ocean-waves-container">
        {/* Layer 1: Deep Ocean Tide */}
        <svg 
          className="auth-ocean-wave-svg wave-deep" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="url(#oceanWaveDeepGrad)" 
            d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,165.3C672,160,768,192,864,208C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <defs>
            <linearGradient id="oceanWaveDeepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.45" />
            </linearGradient>
          </defs>
        </svg>

        {/* Layer 2: Mid Aqua Wave */}
        <svg 
          className="auth-ocean-wave-svg wave-mid" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="url(#oceanWaveMidGrad)" 
            d="M0,96L48,117.3C96,139,192,181,288,176C384,171,480,117,576,112C672,107,768,149,864,170.7C960,192,1056,192,1152,176C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <defs>
            <linearGradient id="oceanWaveMidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>

        {/* Layer 3: Surface Luminous Wave Crest */}
        <svg 
          className="auth-ocean-wave-svg wave-front" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="url(#oceanWaveFrontGrad)" 
            d="M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,218.7C672,224,768,192,864,170.7C960,149,1056,139,1152,149.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <defs>
            <linearGradient id="oceanWaveFrontGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.25" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Dot Grid Pattern in Top Right corner */}
      <div className="auth-dot-grid" />

      {/* Top Bar: Back to Home + Dark/Light Mode Toggle */}
      <div className="auth-top-bar">
        <button 
          type="button"
          onClick={onBackToHome}
          className="auth-back-btn"
        >
          <ArrowLeft size={18} weight="bold" />
          <span>Kembali ke Beranda</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} weight="bold" color="#fbbf24" />
            ) : (
              <Moon size={20} weight="bold" color="#475569" />
            )}
          </button>

          {/* Tombol 2 Garis Vertikal Kecil */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="auth-menu-btn"
            title="Menu Bantuan & Status Akun"
            aria-label="Menu Bantuan & Status Akun"
            aria-expanded={isMenuOpen}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isMenuOpen ? 'var(--accent-primary-light, #eff6ff)' : 'var(--bg-surface-card, #ffffff)',
              border: isMenuOpen ? '1px solid var(--accent-primary, #5452f6)' : '1px solid var(--border-subtle, #e2e8f0)',
              color: isMenuOpen ? 'var(--accent-primary, #5452f6)' : 'var(--text-secondary, #64748b)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="7" y="4" width="3" height="16" rx="1.5" />
              <rect x="14" y="4" width="3" height="16" rx="1.5" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                width: '210px',
                background: 'var(--bg-surface-card, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
                padding: '6px',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsCheckStatusOpen(true);
                  setCheckResult(null);
                  setCheckError('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 12px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #1e293b)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f8fafc)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <MagnifyingGlass size={16} weight="bold" color="#5452f6" />
                <span>Cek Status Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsContactAdminOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 12px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #1e293b)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f8fafc)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <WhatsappLogo size={16} weight="fill" color="#16a34a" />
                <span>Hubungi Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Dual-Column Card Container matching Reference */}
      <div className="auth-card-container">
        
        {/* ================= SISI KIRI: Isometric KYC & Brand Showcase ================= */}
        <div className="auth-left-col">
          {/* Brand Logo & Name matching "FOCUS" position in Reference */}
          <div className="auth-brand-badge">
            <div className="auth-logo-icon">
              <Plant size={20} weight="fill" color="#ffffff" />
            </div>
            <span className="auth-brand-name">
              Tani<span style={{ color: 'var(--accent-primary)' }}>Niaga</span>
            </span>
          </div>

          {/* 3D Isometric KYC Illustration matching Reference */}
          <div className="auth-isometric-wrapper">
            <svg 
              viewBox="0 0 420 380" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="auth-isometric-svg"
            >
              {/* Isometric Base Grid Platform */}
              <polygon 
                points="210,130 380,220 210,310 40,220" 
                fill="url(#platformGradient)" 
                opacity="0.85" 
              />
              <polygon 
                points="210,140 360,220 210,300 60,220" 
                stroke="#bfdbfe" 
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
                fill="none" 
                opacity="0.75" 
              />

              {/* Floating Diamonds / Tiles on isometric grid */}
              <polygon points="120,285 140,295 120,305 100,295" fill="#93c5fd" opacity="0.6" />
              <polygon points="280,265 305,278 280,290 255,278" fill="#93c5fd" opacity="0.5" />
              <polygon points="345,190 365,200 345,210 325,200" fill="#60a5fa" opacity="0.55" />
              <polygon points="90,165 110,175 90,185 70,175" fill="#bfdbfe" opacity="0.5" />

              {/* ISOMETRIC CLIPBOARD (Backplate & Shadow) */}
              <g transform="translate(10, -5)">
                {/* Shadow */}
                <polygon 
                  points="145,130 200,95 200,240 145,275" 
                  fill="#0f172a" 
                  opacity="0.1" 
                />

                {/* Left Spine / Depth of Clipboard */}
                <polygon 
                  points="130,135 140,130 140,265 130,270" 
                  fill="#1d4ed8" 
                />

                {/* Clipboard Face (Royal Blue frame) */}
                <polygon 
                  points="140,130 220,85 220,220 140,265" 
                  fill="#2563eb" 
                />
                <polygon 
                  points="143,132 217,89 217,217 143,260" 
                  fill="#3b82f6" 
                />

                {/* Sheet of Paper on Clipboard */}
                <polygon 
                  points="148,136 212,98 212,212 148,250" 
                  fill="#ffffff" 
                />

                {/* Top Clip Hook */}
                <circle cx="180" cy="98" r="8" fill="#60a5fa" />
                <circle cx="180" cy="98" r="4" fill="#ffffff" />
                <polygon points="170,104 190,92 190,102 170,114" fill="#1d4ed8" />

                {/* Paper Content: Profile Silhouette Box */}
                <polygon points="155,142 175,130 175,152 155,164" fill="#eff6ff" />
                <circle cx="165" cy="143" r="3.5" fill="#2563eb" />
                <ellipse cx="165" cy="151" rx="5" ry="3" fill="#2563eb" />

                {/* Paper Text Lines */}
                <polygon points="180,126 205,112 205,115 180,129" fill="#60a5fa" />
                <polygon points="180,133 200,122 200,125 180,136" fill="#bfdbfe" />
                <polygon points="155,172 205,143 205,146 155,175" fill="#cbd5e1" />
                <polygon points="155,180 205,151 205,154 155,183" fill="#cbd5e1" />
                <polygon points="155,188 195,165 195,168 155,191" fill="#cbd5e1" />
                <polygon points="155,196 202,169 202,172 155,199" fill="#cbd5e1" />
                <polygon points="155,204 185,187 185,190 155,207" fill="#cbd5e1" />

                {/* Verified Green Stamp / Check on Paper */}
                <circle cx="195" cy="195" r="7" fill="#10b981" />
                <path d="M192 195 L194 197 L198 193" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* ISOMETRIC PENCIL (Tilted pink/coral pencil matching reference) */}
              <g transform="translate(25, 30)">
                {/* Pencil Body */}
                <polygon points="120,230 165,205 170,209 125,234" fill="#f43f5e" />
                <polygon points="125,234 170,209 172,213 127,238" fill="#e11d48" />
                {/* Pencil Tip */}
                <polygon points="113,234 120,230 125,234" fill="#fde047" />
                <polygon points="113,234 116,232 115,235" fill="#1e1b4b" />
                {/* Pencil Eraser */}
                <polygon points="165,205 175,199 180,203 170,209" fill="#fda4af" />
                <polygon points="163,206 166,204 171,208 168,210" fill="#e2e8f0" />
              </g>

              {/* ISOMETRIC STANDING ID CARD (Cyan / Blue Card matching Reference) */}
              <g transform="translate(10, 0)">
                {/* Card Shadow */}
                <polygon points="265,200 295,182 295,220 265,238" fill="#1e1b4b" opacity="0.1" />
                {/* Card Thickness */}
                <polygon points="255,182 260,179 260,232 255,235" fill="#0284c7" />
                {/* Card Face */}
                <polygon points="260,179 295,158 295,211 260,232" fill="#0ea5e9" />
                {/* White avatar on cyan card */}
                <circle cx="277" cy="186" r="5" fill="#ffffff" />
                <ellipse cx="277" cy="198" rx="8" ry="4.5" fill="#ffffff" />
                <polygon points="265,206 288,193 288,195 265,208" fill="#e0f2fe" opacity="0.8" />
              </g>

              {/* ISOMETRIC FLOATING ID BADGE ON GROUND (White badge with blue avatar) */}
              <g transform="translate(10, 20)">
                <polygon points="215,230 250,210 270,222 235,242" fill="#ffffff" />
                <polygon points="215,230 235,242 235,245 215,233" fill="#e2e8f0" />
                <circle cx="238" cy="226" r="3.5" fill="#38bdf8" />
                <polygon points="248,222 260,215 260,217 248,224" fill="#cbd5e1" />
                <polygon points="248,226 256,221 256,223 248,228" fill="#cbd5e1" />
              </g>

              {/* Gradients */}
              <defs>
                <linearGradient id="platformGradient" x1="40" y1="130" x2="380" y2="310" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#dbeafe" stopOpacity="0.75" />
                  <stop offset="0.5" stopColor="#bfdbfe" stopOpacity="0.45" />
                  <stop offset="1" stopColor="#eff6ff" stopOpacity="0.85" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Value Badges Bottom Left */}
          <div className="auth-trust-list">
            <div className="auth-trust-item">
              <CheckCircle size={16} weight="fill" color="var(--accent-primary)" />
              <span>Verifikasi Legalitas & KYC Lahan</span>
            </div>
            <div className="auth-trust-item">
              <CheckCircle size={16} weight="fill" color="var(--accent-primary)" />
              <span>Digital Binding Agreement Resmi</span>
            </div>
            <div className="auth-trust-item">
              <CheckCircle size={16} weight="fill" color="var(--accent-primary)" />
              <span>Transaksi Langsung Bebas Makelar</span>
            </div>
          </div>
        </div>

        {/* ================= SISI KANAN: Form Login / Signup ================= */}
        <div className="auth-right-col">
          
          {/* Top Right Toggle: "Don't you have an account? [ SIGN UP ]" matching Reference */}
          <div className="auth-mode-switch-header">
            <span className="auth-switch-prompt">
              {mode === 'login' 
                ? "Don't you have an account?" 
                : mode === 'signup' 
                  ? "Already have an account?" 
                  : "Remember your password?"}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.04 }}
              onClick={() => {
                if (mode === 'login') {
                  setMode('signup');
                } else {
                  if (mode === 'update_password') clearRecoveryPending();
                  setMode('login');
                }
                setIsSuccess(false);
                setForgotSent(false);
              }}
              className="auth-switch-action-btn"
            >
              {mode === 'login' ? 'SIGN UP' : 'SIGN IN'}
            </motion.button>
          </div>

          {/* Form Content with Smooth Mode Transition */}
          <div className="auth-form-body" style={{ position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait" initial={false}>
              {!isSuccess ? (
                mode === 'forgot' ? (
                  !forgotSent ? (
                    /* ====== FORGOT PASSWORD FORM ====== */
                    <motion.div
                      key="forgot"
                      initial={{ opacity: 0, x: 26, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: -26, filter: 'blur(3px)' }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="auth-mode-badge">
                        <Key size={14} weight="bold" />
                        <span>Pemulihan Akun</span>
                      </div>
                      <h1 className="auth-heading">Reset Password</h1>
                      <p className="auth-subheading">
                        Masukkan email akun Anda untuk menerima instruksi pemulihan kata sandi.
                      </p>

                      {errorMessage && (
                        <div style={{ 
                          margin: '0.6rem 0', 
                          padding: '0.55rem 0.75rem', 
                          background: '#fef2f2', 
                          border: '1px solid #fecaca', 
                          borderRadius: '8px', 
                          fontSize: '0.74rem', 
                          color: '#991b1b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <WarningCircle size={16} color="#dc2626" weight="bold" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <form onSubmit={handleForgotSubmit} className="auth-form-fields">
                        <div className="auth-field-group">
                          <label className="auth-label">Email Terdaftar</label>
                          <input 
                            type="email" 
                            required 
                            value={forgotEmail || email}
                            onChange={(e) => {
                              setForgotEmail(e.target.value);
                              setEmail(e.target.value);
                            }}
                            placeholder="nama@email.com"
                            className="auth-input" 
                          />
                          <p className="auth-forgot-hint">
                            Tautan aman untuk membuat kata sandi baru akan dikirimkan ke email ini.
                          </p>
                        </div>

                        <motion.button
                          type="submit"
                          disabled={isLoading}
                          whileHover={{ scale: isLoading ? 1 : 1.01 }}
                          whileTap={{ scale: isLoading ? 1 : 0.98 }}
                          className="auth-submit-btn"
                          style={{ marginTop: '0.4rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          {isLoading && <CircleNotch size={18} className="animate-spin" weight="bold" />}
                          <span>{isLoading ? 'Mengirim...' : 'Kirim Link Pemulihan'}</span>
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage('');
                            setMode('login');
                          }}
                          className="auth-back-to-login-btn"
                        >
                          <ArrowLeft size={16} weight="bold" />
                          <span>Kembali ke Halaman Masuk</span>
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    /* ====== FORGOT PASSWORD SUCCESS NOTIFICATION ====== */
                    <motion.div
                      key="forgot-sent"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.28 }}
                      className="auth-forgot-success-box"
                    >
                      <div className="auth-forgot-success-icon">
                        <CheckCircle size={34} weight="fill" />
                      </div>
                      <h2 className="auth-heading" style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>
                        Link Pemulihan Terkirim!
                      </h2>
                      <p className="auth-subheading" style={{ marginBottom: '1.35rem', textAlign: 'center' }}>
                        Instruksi reset kata sandi telah dikirim ke <strong>{forgotEmail || email}</strong>. Silakan periksa inbox atau folder spam email Anda.
                      </p>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setForgotSent(false);
                          setMode('login');
                        }}
                        className="auth-submit-btn"
                      >
                        Kembali ke Halaman Masuk
                      </motion.button>

                      <button
                        type="button"
                        onClick={handleForgotSubmit}
                        className="auth-resend-link"
                      >
                        Belum menerima email? Kirim ulang
                      </button>
                    </motion.div>
                  )
                ) : mode === 'signup_sent' ? (
                  /* ====== SIGNUP EMAIL CONFIRMATION NOTIFICATION ====== */
                  <motion.div
                    key="signup-sent"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.28 }}
                    className="auth-forgot-success-box"
                  >
                    <div className="auth-forgot-success-icon">
                      <CheckCircle size={34} weight="fill" />
                    </div>
                    <h2 className="auth-heading" style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>
                      Pendaftaran Berhasil!
                    </h2>
                    <p className="auth-subheading" style={{ marginBottom: '1.35rem', textAlign: 'center', lineHeight: 1.55 }}>
                      Tautan konfirmasi telah dikirim ke <strong>{email}</strong>. Silakan periksa kotak masuk atau spam email Anda dan klik tautan tersebut untuk memverifikasi keaslian email Anda.<br/><br/>
                      Setelah email diverifikasi, akun Anda akan <strong>diverifikasi oleh Admin</strong> sebelum dapat digunakan untuk masuk.
                    </p>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setMode('login');
                        setErrorMessage('');
                      }}
                      className="auth-submit-btn"
                    >
                      Kembali ke Halaman Masuk
                    </motion.button>
                  </motion.div>
                ) : mode === 'update_password' ? (
                  /* ====== UPDATE PASSWORD FORM ====== */
                  <motion.div
                    key="update-password"
                    initial={{ opacity: 0, x: 26, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -26, filter: 'blur(3px)' }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="auth-mode-badge">
                      <Key size={14} weight="bold" />
                      <span>Kata Sandi Baru</span>
                    </div>
                    <h1 className="auth-heading">Atur Ulang Kata Sandi</h1>
                    <p className="auth-subheading">
                      Masukkan kata sandi baru untuk akun Anda.
                    </p>

                    {errorMessage && (
                      <div style={{ 
                        margin: '0.6rem 0', 
                        padding: '0.55rem 0.75rem', 
                        background: '#fef2f2', 
                        border: '1px solid #fecaca', 
                        borderRadius: '8px', 
                        fontSize: '0.74rem', 
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <WarningCircle size={16} color="#dc2626" weight="bold" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleUpdatePasswordSubmit} className="auth-form-fields">
                      <div className="auth-field-group">
                        <label className="auth-label">Kata Sandi Baru</label>
                        <input 
                          type="password" 
                          required 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="auth-input" 
                        />
                      </div>

                      <div className="auth-field-group">
                        <label className="auth-label">Konfirmasi Kata Sandi</label>
                        <input 
                          type="password" 
                          required 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className="auth-input" 
                        />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: isLoading ? 1 : 1.01 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        className="auth-submit-btn"
                        style={{ marginTop: '0.4rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        {isLoading && <CircleNotch size={18} className="animate-spin" weight="bold" />}
                        <span>{isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</span>
                      </motion.button>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          clearRecoveryPending();
                          setMode('login');
                        }}
                        className="auth-back-to-login-btn"
                      >
                        <ArrowLeft size={16} weight="bold" />
                        <span>Kembali ke Halaman Masuk</span>
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  /* ====== LOGIN / SIGNUP FORM ====== */
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, x: mode === 'signup' ? 26 : -26, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: mode === 'signup' ? -26 : 26, filter: 'blur(3px)' }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h1 className="auth-heading">
                      {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
                    </h1>
                    <p className="auth-subheading">
                      {mode === 'login' 
                        ? 'Login your account' 
                        : 'Mulai transaksi komoditas pertanian skala besar'}
                    </p>

                    {/* Role Switcher (Petani vs Pembeli) */}
                    <div className="auth-role-tabs">
                      <button
                        type="button"
                        onClick={() => { setRole('petani'); setErrorMessage(''); }}
                        className={`auth-role-tab ${role === 'petani' ? 'active' : ''}`}
                      >
                        <Plant size={17} weight={role === 'petani' ? 'fill' : 'bold'} />
                        <span>Akun Petani Produsen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setRole('pembeli'); setErrorMessage(''); }}
                        className={`auth-role-tab ${role === 'pembeli' ? 'active' : ''}`}
                      >
                        <BuildingOffice size={17} weight={role === 'pembeli' ? 'fill' : 'bold'} />
                        <span>Akun Pembeli / Distributor</span>
                      </button>
                    </div>

                    {/* Quick Demo Credentials Info Box */}
                    {mode === 'login' && (
                      <div style={{
                        margin: '0.65rem 0 0.85rem 0',
                        padding: '0.55rem 0.85rem',
                        background: 'rgba(84, 82, 246, 0.05)',
                        border: '1px dashed rgba(84, 82, 246, 0.3)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)', display: 'block' }}>
                            {role === 'petani' ? '💡 Akun Demo Petani: Hengky Mandagi' : '💡 Akun Demo Pembeli: Hendra Pratama'}
                          </span>
                          <span style={{ fontSize: '0.72rem' }}>
                            {role === 'petani' ? 'petani@taniniaga.id' : 'pembeli@taniniaga.id'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (role === 'petani') {
                              setEmail('petani@taniniaga.id');
                              setPassword('petani123');
                            } else {
                              setEmail('pembeli@taniniaga.id');
                              setPassword('pembeli123');
                            }
                            setErrorMessage('');
                          }}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            background: 'var(--accent-primary)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Isi Otomatis
                        </button>
                      </div>
                    )}

                    {/* Error Feedback Alert */}
                    {errorMessage && (
                      <div style={{ 
                        margin: '0.6rem 0', 
                        padding: '0.55rem 0.75rem', 
                        background: '#fef2f2', 
                        border: '1px solid #fecaca', 
                        borderRadius: '8px', 
                        fontSize: '0.74rem', 
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <WarningCircle size={16} color="#dc2626" weight="bold" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form-fields">
                      {/* Full Name Field (Only on Sign Up) */}
                      {mode === 'signup' && (
                        <div className="auth-field-group">
                          <label className="auth-label">Nama Lengkap</label>
                          <input 
                            type="text" 
                            required 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Contoh: Hengky Mandagi"
                            className="auth-input" 
                          />
                        </div>
                      )}

                      {/* Username / Email Field matching Reference */}
                      <div className="auth-field-group">
                        <label className="auth-label">Email</label>
                        <input 
                          type="email" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Your email"
                          className="auth-input" 
                        />
                      </div>

                      {/* Password Field with Eye Toggle matching Reference */}
                      <div className="auth-field-group">
                        <label className="auth-label">Password</label>
                        <div className="auth-password-wrapper">
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            className="auth-input password-input" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="auth-eye-btn"
                            title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? (
                              <EyeSlash size={19} color="#94a3b8" />
                            ) : (
                              <Eye size={19} color="#94a3b8" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Forgot Password Link (Login mode) */}
                      {mode === 'login' && (
                        <div className="auth-forgot-wrapper">
                          <button 
                            type="button" 
                            onClick={() => {
                              setMode('forgot');
                              setForgotSent(false);
                            }} 
                            className="auth-forgot-btn"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      {/* Submit Button matching Reference Purple Pill */}
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: isLoading ? 1 : 1.01 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        className="auth-submit-btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        {isLoading && (
                          <CircleNotch size={18} className="animate-spin" weight="bold" />
                        )}
                        <span>
                          {isLoading ? 'Memproses...' : (mode === 'login' ? 'Login' : 'Sign Up')}
                        </span>
                      </motion.button>
                    </form>

                    {/* Social Login Footer (Google) */}
                    <div className="auth-social-footer">
                      <span className="auth-social-label">
                        {mode === 'login' ? 'Login with' : 'Daftar dengan'}
                      </span>
                      <div className="auth-social-icons">
                        {/* Google */}
                        <button 
                          type="button" 
                          onClick={() => handleSocialAuth('google')} 
                          disabled={isLoading}
                          className="auth-social-btn google"
                          aria-label={mode === 'login' ? 'Login with Google' : 'Daftar dengan Google'}
                          title="Google"
                          style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              ) : (
                /* Success Confirmation with Animation */
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.3 }}
                  className="auth-success-box"
                >
                  <div className="auth-success-circle">
                    <ShieldCheck size={38} weight="fill" />
                  </div>
                  <h2 className="auth-success-title">
                    {mode === 'login' ? 'Berhasil Masuk!' : 'Registrasi Berhasil!'}
                  </h2>
                  <p className="auth-success-sub">
                    Selamat datang di platform TaniNiaga. Mengarahkan ke dashboard {role}...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* ================= MODAL CEK STATUS AKUN ================= */}
      <AnimatePresence>
        {isCheckStatusOpen && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setIsCheckStatusOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--bg-surface-card, #ffffff)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '460px',
                padding: '1.75rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsCheckStatusOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1.1rem',
                  right: '1.1rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #64748b)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} weight="bold" />
              </button>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '12px', 
                  background: 'rgba(84, 82, 246, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#5452f6'
                }}>
                  <MagnifyingGlass size={22} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)' }}>
                    Cek Status Akun
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                    Periksa status verifikasi & KYC akun Anda
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCheckAccountStatus} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    required
                    value={checkEmail}
                    onChange={(e) => setCheckEmail(e.target.value)}
                    placeholder="Masukkan email Anda..."
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.9rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                      background: 'var(--bg-canvas, #f8fafc)',
                      color: 'var(--text-primary, #1e293b)',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={checkLoading}
                    style={{
                      padding: '0.65rem 1.15rem',
                      borderRadius: '10px',
                      background: '#5452f6',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: checkLoading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {checkLoading ? <CircleNotch size={16} className="animate-spin" weight="bold" /> : 'Periksa'}
                  </button>
                </div>
                {checkError && (
                  <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 500 }}>
                    {checkError}
                  </div>
                )}
              </form>

              {/* Result Display */}
              {checkResult && (
                <div style={{
                  padding: '1.1rem',
                  borderRadius: '14px',
                  background: checkResult.found 
                    ? (checkResult.kyc_status === 'verified' ? '#f0fdf4' : checkResult.kyc_status === 'rejected' ? '#fef2f2' : '#fffbeb')
                    : '#f8fafc',
                  border: `1px solid ${
                    checkResult.found
                      ? (checkResult.kyc_status === 'verified' ? '#bbf7d0' : checkResult.kyc_status === 'rejected' ? '#fecaca' : '#fde68a')
                      : '#e2e8f0'
                  }`
                }}>
                  {checkResult.found ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                          {checkResult.full_name || 'Pengguna TaniNiaga'}
                        </span>
                        <span style={{ 
                          textTransform: 'uppercase', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          padding: '2px 8px', 
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.06)'
                        }}>
                          {checkResult.role || 'Petani'}
                        </span>
                      </div>

                      {checkResult.kyc_status === 'verified' ? (
                        <div style={{ color: '#166534', fontSize: '0.84rem', lineHeight: 1.5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                            <CheckCircle size={18} weight="fill" color="#16a34a" />
                            Akun Anda Telah Terverifikasi (Aktif)
                          </div>
                          Akun sudah disetujui oleh Admin. Anda dapat langsung login menggunakan email dan password Anda.
                        </div>
                      ) : checkResult.kyc_status === 'rejected' ? (
                        <div style={{ color: '#991b1b', fontSize: '0.84rem', lineHeight: 1.5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                            <WarningCircle size={18} weight="fill" color="#dc2626" />
                            Pendaftaran Akun Ditolak
                          </div>
                          Pendaftaran akun Anda ditolak oleh Admin. Silakan hubungi admin untuk konfirmasi kelengkapan data.
                        </div>
                      ) : (
                        <div style={{ color: '#92400e', fontSize: '0.84rem', lineHeight: 1.5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                            <Clock size={18} weight="bold" color="#d97706" />
                            Menunggu Persetujuan Admin (Pending)
                          </div>
                          Akun Anda sedang dalam antrean verifikasi KYC. Hubungi admin untuk mempercepat proses persetujuan.
                          <div style={{ marginTop: '10px' }}>
                            <a
                              href="https://wa.me/6281243218765?text=Halo%20Admin%20TaniNiaga,%20saya%20sudah%20mendaftar%20dengan%20email%20ini.%20Mohon%20bantu%20verifikasi%20akun%20saya."
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: '#16a34a',
                                color: '#ffffff',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.78rem'
                              }}
                            >
                              <WhatsappLogo size={16} weight="fill" />
                              Verifikasi Cepat via WhatsApp
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.5, textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Email Belum Terdaftar</div>
                      Email <strong>{checkResult.email}</strong> belum terdaftar di sistem. Silakan pilih menu <strong>Sign Up</strong> untuk mendaftar akun baru.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL HUBUNGI ADMIN ================= */}
      <AnimatePresence>
        {isContactAdminOpen && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setIsContactAdminOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--bg-surface-card, #ffffff)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '440px',
                padding: '1.75rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsContactAdminOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1.1rem',
                  right: '1.1rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #64748b)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} weight="bold" />
              </button>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '12px', 
                  background: 'rgba(22, 163, 74, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#16a34a'
                }}>
                  <WhatsappLogo size={24} weight="fill" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)' }}>
                    Hubungi Admin
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                    Bantuan verifikasi akun & kendala teknis
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* WhatsApp Card */}
                <a
                  href="https://wa.me/6281243218765?text=Halo%20Admin%20TaniNiaga,%20saya%20membutuhkan%20bantuan%20terkait%20akun%20saya."
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <WhatsappLogo size={22} weight="fill" color="#16a34a" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>WhatsApp Customer Care</div>
                      <div style={{ fontSize: '0.78rem', color: '#15803d' }}>0812-4321-8765 (Resmi)</div>
                    </div>
                  </div>
                  <ArrowSquareOut size={16} weight="bold" />
                </a>

                {/* Email Card */}
                <a
                  href="mailto:admin@taniniaga.id?subject=Bantuan%20Akun%20TaniNiaga"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <EnvelopeSimple size={22} weight="bold" color="#5452f6" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Email Resmi Support</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>admin@taniniaga.id</div>
                    </div>
                  </div>
                  <ArrowSquareOut size={16} weight="bold" />
                </a>

                {/* Jam Operasional */}
                <div style={{ 
                  padding: '0.75rem 0.9rem', 
                  borderRadius: '10px', 
                  background: 'rgba(0,0,0,0.02)', 
                  fontSize: '0.76rem', 
                  color: 'var(--text-secondary, #64748b)',
                  lineHeight: 1.4,
                  marginTop: '4px'
                }}>
                  ⏰ <strong>Jam Layanan:</strong> Senin – Sabtu (08.00 – 17.00 WITA). Administrator berdomisili di Kabupaten Minahasa, Sulawesi Utara.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
