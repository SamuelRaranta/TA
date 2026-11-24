import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  ShieldCheck, 
  Camera, 
  Eye, 
  EyeSlash, 
  CheckCircle, 
  SignOut, 
  Trash, 
  DeviceMobile, 
  EnvelopeSimple, 
  Phone, 
  MapPin, 
  Buildings, 
  Plant, 
  FloppyDisk,
  Warning,
  Check,
  CircleNotch,
  Star,
  Package,
  CalendarBlank,
  MagnifyingGlass,
  Sparkle,
  Quotes,
  Clock,
  XCircle,
  ArrowClockwise
} from '@phosphor-icons/react';
import { supabase } from '../../lib/supabaseClient';
import { DEFAULT_AVATAR } from '../../lib/constants';
import { fetchFarmerReviews, subscribeFarmerReviews } from '../../lib/reviewService';

export default function PengaturanPengguna({ 
  role = 'petani', // 'petani' | 'pembeli' | 'admin'
  profile: rawProfile,
  initialTab = 'edit-profile',
  onUpdateProfile,
  onLogout
}) {
  // Tab State: 'edit-profile' | 'security' | 'notifications' | 'account' | 'review' (review hanya untuk petani)
  const isReviewAllowed = role === 'petani';
  const resolvedInitialTab = (initialTab === 'review' && !isReviewAllowed) ? 'edit-profile' : (initialTab || 'edit-profile');
  const [activeTab, setActiveTab] = useState(resolvedInitialTab);

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'review' && role !== 'petani') {
        setActiveTab('edit-profile');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab, role]);

  // Loading state for initial profile retrieval from Supabase
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [activeUserId, setActiveUserId] = useState(rawProfile?.id || null);

  // Initial Data (snapshot from Supabase DB to detect changes)
  const [initialData, setInitialData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    kabupaten: 'Kabupaten Minahasa',
    avatar: ''
  });

  // Active Form State (what user types in UI)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    kabupaten: 'Kabupaten Minahasa',
    avatar: ''
  });

  const fileInputRef = useRef(null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // 2. PASSWORD & SECURITY STATE
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState('');
  const [securityErrorMsg, setSecurityErrorMsg] = useState('');

  // 3. NOTIFICATION PREFERENCES STATE
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(`agriconnect_notif_prefs_${role}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      proposalApproved: true,
      proposalRejected: true,
      proposalExpiring: true,
      farmerResponse: true,
      orderStatus: true,
      marketPrices: true,
      systemAnnouncements: true
    };
  });
  const [notifSuccessMsg, setNotifSuccessMsg] = useState('');

  // 4. ACCOUNT STATE (Data Dinamis dari Supabase: Tanggal Bergabung, KYC Status, dsb.)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [accountActionMsg, setAccountActionMsg] = useState('');
  const [accountMeta, setAccountMeta] = useState({
    createdAt: rawProfile?.createdAt || null,
    kycStatus: rawProfile?.kycStatus || rawProfile?.kyc_status || (role === 'admin' ? 'verified' : 'pending'),
    role: role || 'petani',
    location: rawProfile?.location || rawProfile?.address || '',
    updatedAt: null
  });

  // State untuk Pembaruan Aplikasi Realtime
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState('');

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateSuccessMsg('');
    try {
      if ('caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map(k => window.caches.delete(k)));
        } catch (e) {}
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUpdateSuccessMsg('Aplikasi Anda sudah terhubung ke versi terbaru (v1.2.0). Memuat ulang aset...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.warn('Update check failed:', err);
      window.location.reload();
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Helper memformat tanggal bergabung dinamis ke format Bahasa Indonesia (misal: "19 September 2026")
  const formatJoinDate = (dateVal) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return String(dateVal);
    }
  };

  // 5. REVIEW & RATING STATE
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    average: 5.0,
    totalCount: 0,
    isDefault: true,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [starFilter, setStarFilter] = useState('all');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');

  // Check if form has unsaved edits
  const isDirty = 
    formData.name.trim() !== initialData.name.trim() ||
    formData.phone.trim() !== initialData.phone.trim() ||
    (role !== 'admin' && formData.address.trim() !== initialData.address.trim()) ||
    formData.avatar !== initialData.avatar;

  // Fetch real profile from Supabase on mount or activeTab switch
  useEffect(() => {
    let isMounted = true;

    const fetchProfileFromSupabase = async () => {
      setIsLoadingProfile(true);
      setProfileErrorMsg('');

      try {
        // 1. Get authenticated user from Supabase Auth
        const { data: { user } } = await supabase.auth.getUser();

        // 2. Resolve active user ID — ISOLASI KETAT per-user & per-role.
        // Prioritas: Supabase Auth > localStorage per-role > localStorage generik (hanya jika role cocok) > prop.
        // TIDAK ada fallback ke seed UUID bersama — itu penyebab 1 edit bocor ke semua user.
        let currentUserId = user?.id;
        let authEmail = user?.email;

        const isRoleMatch = (parsedRole) => {
          if (!parsedRole) return true; // data lama tanpa role tetap diterima
          return String(parsedRole).toLowerCase() === String(role).toLowerCase();
        };

        if (!currentUserId) {
          try {
            const roleStored = localStorage.getItem(`agriconnect_auth_user_${role}`);
            if (roleStored) {
              const parsed = JSON.parse(roleStored);
              if (parsed?.id && isRoleMatch(parsed?.role)) {
                currentUserId = parsed.id;
                authEmail = authEmail || parsed.email;
              }
            }
          } catch (e) {}
        }

        if (!currentUserId) {
          try {
            const stored = localStorage.getItem('agriconnect_auth_user');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.id && isRoleMatch(parsed?.role)) {
                currentUserId = parsed.id;
                authEmail = authEmail || parsed.email;
              }
            }
          } catch (e) {}
        }

        // Fallback to prop ID if provided (parent dashboard sudah validasi role)
        if (!currentUserId && rawProfile?.id) {
          currentUserId = rawProfile.id;
          authEmail = authEmail || rawProfile.email;
        }

        if (!currentUserId) {
          if (isMounted) {
            setActiveUserId(null);
            setIsLoadingProfile(false);
            setProfileErrorMsg('Identitas pengguna tidak ditemukan. Silakan login kembali.');
          }
          return;
        }

        if (isMounted) {
          setActiveUserId(currentUserId);
        }

        if (currentUserId) {
          // 3. Fetch record directly from public.profiles in Supabase
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUserId)
            .maybeSingle();

          if (error) {
            console.error('[PengaturanPengguna] Supabase select error:', error);
          }

          if (isMounted && data) {
            const resolvedName = data.full_name || '';
            const resolvedEmail = data.email || authEmail || (role === 'admin' ? 'admin@taniniaga.id' : role === 'pembeli' ? 'pembeli@taniniaga.id' : 'petani@taniniaga.id');
            const resolvedPhone = data.phone || (role === 'admin' ? '0812-0000-9999' : '0812-4321-8765');
            const resolvedAddress = role === 'admin' ? '' : (data.location || 'Minahasa, Sulawesi Utara');
            const resolvedKabupaten = 'Minahasa';
            const resolvedAvatar = data.avatar_url || DEFAULT_AVATAR;

            const profileSnapshot = {
              name: resolvedName,
              email: resolvedEmail,
              phone: resolvedPhone,
              address: resolvedAddress,
              kabupaten: resolvedKabupaten,
              avatar: resolvedAvatar
            };

            setInitialData(profileSnapshot);
            setFormData(profileSnapshot);
            setAccountMeta({
              createdAt: data.created_at || user?.created_at || rawProfile?.createdAt || null,
              kycStatus: data.kyc_status || (role === 'admin' ? 'verified' : 'pending'),
              role: data.role || role || 'petani',
              location: resolvedAddress,
              updatedAt: data.updated_at || null
            });

            if (data.notification_preferences) {
              setNotifications(data.notification_preferences);
            }

            // Muat data review dan rating dinamis khusus untuk petani
            if (role === 'petani') {
              const revRes = await fetchFarmerReviews(currentUserId, resolvedName);
              if (isMounted) {
                setReviewsData(revRes);
              }
            }
          } else if (isMounted) {
            // New user without profile row yet - isi nilai default untuk user baru
            const defaultSnapshot = {
              name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
              email: authEmail || user?.email || '',
              phone: user?.user_metadata?.phone || (role === 'admin' ? '0812-0000-9999' : '0812-4321-8765'),
              address: role === 'admin' ? '' : 'Minahasa, Sulawesi Utara',
              kabupaten: 'Minahasa',
              avatar: DEFAULT_AVATAR
            };
            setInitialData(defaultSnapshot);
            setFormData(defaultSnapshot);
            setAccountMeta({
              createdAt: user?.created_at || rawProfile?.createdAt || new Date().toISOString(),
              kycStatus: role === 'admin' ? 'verified' : 'pending',
              role: role || 'petani',
              location: role === 'admin' ? '' : 'Minahasa, Sulawesi Utara',
              updatedAt: null
            });

            if (role === 'petani') {
              const revRes = await fetchFarmerReviews(currentUserId, defaultSnapshot.name);
              if (isMounted) {
                setReviewsData(revRes);
              }
            }
          }
        }
      } catch (err) {
        console.error('[PengaturanPengguna] Gagal memuat profil dari Supabase:', err);
        if (isMounted) {
          setProfileErrorMsg('Gagal memuat data profil dari database Supabase.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    fetchProfileFromSupabase();

    let unsubReviews = () => {};
    let unsubProfile = () => {};
    const effectiveUserId = activeUserId || rawProfile?.id;
    if (effectiveUserId) {
      if (role === 'petani') {
        unsubReviews = subscribeFarmerReviews(effectiveUserId, (updated) => {
          if (isMounted) {
            setReviewsData(updated);
          }
        });
      }

      // Realtime subscription profil: pembaruan KYC, lokasi, atau info akun otomatis tersinkron
      const profileChannel = supabase
        .channel(`pengaturan_profile_${effectiveUserId}_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${effectiveUserId}` },
          (payload) => {
            if (!isMounted) return;
            const updated = payload.new;
            if (updated) {
              setAccountMeta(prev => ({
                ...prev,
                createdAt: updated.created_at || prev.createdAt,
                kycStatus: updated.kyc_status || prev.kycStatus,
                role: updated.role || prev.role,
                location: role === 'admin' ? '' : (updated.location || prev.location),
                updatedAt: updated.updated_at || prev.updatedAt
              }));
              if (updated.full_name || updated.location || updated.avatar_url || updated.phone) {
                setFormData(prev => ({
                  ...prev,
                  name: updated.full_name !== undefined ? updated.full_name : prev.name,
                  phone: updated.phone !== undefined ? updated.phone : prev.phone,
                  address: role === 'admin' ? '' : (updated.location !== undefined ? updated.location : prev.address),
                  avatar: updated.avatar_url !== undefined ? updated.avatar_url : prev.avatar
                }));
                setInitialData(prev => ({
                  ...prev,
                  name: updated.full_name !== undefined ? updated.full_name : prev.name,
                  phone: updated.phone !== undefined ? updated.phone : prev.phone,
                  address: role === 'admin' ? '' : (updated.location !== undefined ? updated.location : prev.address),
                  avatar: updated.avatar_url !== undefined ? updated.avatar_url : prev.avatar
                }));
              }
            }
          }
        )
        .subscribe();

      unsubProfile = () => {
        supabase.removeChannel(profileChannel);
      };
    }

    return () => {
      isMounted = false;
      unsubReviews();
      unsubProfile();
    };
  }, [role, activeTab]);

  // Sync if rawProfile prop changes externally and initialData is empty
  useEffect(() => {
    if (rawProfile && typeof rawProfile === 'object' && !initialData.name && !isLoadingProfile) {
      const snap = {
        name: rawProfile.name || rawProfile.fullName || '',
        email: rawProfile.email || initialData.email || '',
        phone: rawProfile.phone || '',
        address: rawProfile.address || rawProfile.location || '',
        kabupaten: 'Minahasa',
        avatar: rawProfile.avatar || initialData.avatar
      };
      setInitialData(snap);
      setFormData(snap);
      if (rawProfile.createdAt || rawProfile.kycStatus) {
        setAccountMeta(prev => ({
          ...prev,
          createdAt: rawProfile.createdAt || prev.createdAt,
          kycStatus: rawProfile.kycStatus || prev.kycStatus,
          location: snap.address || prev.location
        }));
      }
    }
  }, [rawProfile, isLoadingProfile]);

  // Handle Avatar Change with validation
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileErrorMsg('');

    // 1. Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileErrorMsg('Format file tidak didukung. Mohon pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    // 2. Validate file size (max 2.5 MB)
    const maxBytes = 2.5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setProfileErrorMsg('Ukuran file foto terlalu besar. Maksimal ukuran foto adalah 2.5 MB.');
      return;
    }

    // 3. Read image as data URL
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const resultUrl = uploadEvent.target?.result;
      if (resultUrl) {
        setFormData(prev => ({ ...prev, avatar: resultUrl }));
      }
    };
    reader.onerror = () => {
      setProfileErrorMsg('Gagal membaca file gambar. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  // Form input validation
  const validateProfileForm = () => {
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();

    // 1. Validate Full Name
    if (!trimmedName) {
      return 'Nama lengkap tidak boleh kosong.';
    }
    if (trimmedName.length < 2) {
      return 'Nama lengkap minimal 2 karakter.';
    }

    // 2. Validate Phone Number
    if (!trimmedPhone) {
      return 'Nomor telepon tidak boleh kosong.';
    }
    const cleanDigits = trimmedPhone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 9 || cleanDigits.length > 15) {
      return 'Nomor telepon tidak valid. Masukkan 9 hingga 15 digit angka (contoh: 0812-4321-8765).';
    }
    if (/[^0-9+\-\s()]/.test(trimmedPhone)) {
      return 'Nomor telepon mengandung karakter yang tidak valid.';
    }

    // 3. Validate Address (hanya untuk Petani dan Pembeli; Admin tidak memerlukan alamat/wilayah operasional)
    if (role !== 'admin') {
      if (!trimmedAddress) {
        return 'Alamat tidak boleh kosong.';
      }
      if (trimmedAddress.length < 3) {
        return 'Alamat minimal 3 karakter.';
      }
    }

    return null;
  };

  // Handle Save Profile with true Supabase Persistence
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    // 1. Validate Form Inputs
    const validationError = validateProfileForm();
    if (validationError) {
      setProfileErrorMsg(validationError);
      return;
    }

    // 2. Check if dirty
    if (!isDirty) {
      setProfileSuccessMsg('Tidak ada perubahan data yang perlu disimpan.');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
      return;
    }

    setIsSavingProfile(true);

    try {
      // 3. Resolve Authenticated User ID — harus user ini sendiri, tanpa fallback silang.
      const { data: { user } } = await supabase.auth.getUser();
      let currentUserId = user?.id || activeUserId;

      if (!currentUserId) {
        try {
          const roleStored = localStorage.getItem(`agriconnect_auth_user_${role}`);
          if (roleStored) {
            const parsed = JSON.parse(roleStored);
            if (parsed?.id && String(parsed?.role || role).toLowerCase() === String(role).toLowerCase()) {
              currentUserId = parsed.id;
            }
          }
        } catch (e) {}
      }

      if (!currentUserId) {
        try {
          const stored = localStorage.getItem('agriconnect_auth_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.id && String(parsed?.role || role).toLowerCase() === String(role).toLowerCase()) {
              currentUserId = parsed.id;
            }
          }
        } catch (e) {}
      }

      if (currentUserId && activeUserId && currentUserId !== activeUserId) {
        setProfileErrorMsg('Sesi profil tidak cocok. Silakan muat ulang dan login kembali.');
        setIsSavingProfile(false);
        return;
      }

      if (!currentUserId) {
        setProfileErrorMsg('Identitas pengguna tidak ditemukan. Silakan login kembali.');
        setIsSavingProfile(false);
        return;
      }

      // 4. Construct Safe Payload (Task 35: Prevent Accidental Data Loss)
      const updatePayload = {
        full_name: formData.name.trim(),
        phone: formData.phone.trim(),
        location: role === 'admin' ? null : (formData.address.trim() || 'Minahasa, Sulawesi Utara'),
        updated_at: new Date().toISOString()
      };

      if (formData.avatar) {
        updatePayload.avatar_url = formData.avatar;
      }

      // 5. Execute Update to Supabase profiles table
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', currentUserId)
        .select();

      if (updateError) {
        console.error('[PengaturanPengguna] Supabase profile update error:', updateError);
        setProfileErrorMsg(`Gagal menyimpan perubahan. Silakan coba lagi.`);
        setIsSavingProfile(false);
        return;
      }

      // If no row was affected (row not yet created), upsert profile record
      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: currentUserId,
            role: role || 'petani',
            email: formData.email,
            ...updatePayload
          });

        if (insertError) {
          console.error('[PengaturanPengguna] Supabase profile upsert error:', insertError);
          setProfileErrorMsg(`Gagal menyimpan data ke database. Silakan coba lagi.`);
          setIsSavingProfile(false);
          return;
        }
      }

      // 6. Re-fetch fresh record from Supabase to guarantee source of truth
      const { data: latestDbProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      const resolvedSavedData = latestDbProfile || {
        full_name: formData.name.trim(),
        phone: formData.phone.trim(),
        location: formData.address.trim(),
        avatar_url: formData.avatar,
        email: formData.email
      };

      // 7. Update Initial and Form states with confirmed database record
      const confirmedSnapshot = {
        name: resolvedSavedData.full_name || formData.name.trim(),
        email: resolvedSavedData.email || formData.email,
        phone: resolvedSavedData.phone || formData.phone.trim(),
        address: role === 'admin' ? '' : (resolvedSavedData.location || formData.address.trim() || 'Minahasa, Sulawesi Utara'),
        kabupaten: 'Minahasa',
        avatar: resolvedSavedData.avatar_url || formData.avatar
      };

      setInitialData(confirmedSnapshot);
      setFormData(confirmedSnapshot);
      setAccountMeta(prev => ({
        ...prev,
        location: confirmedSnapshot.address,
        updatedAt: resolvedSavedData.updated_at || new Date().toISOString()
      }));

      // 8. Update Supabase Auth user metadata if session active
      if (user) {
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: confirmedSnapshot.name,
              phone: confirmedSnapshot.phone,
              role: role
            }
          });
        } catch (metaErr) {
          console.warn('[PengaturanPengguna] Metadata update notice:', metaErr);
        }
      }

      // 9. Update local storage session cache — tulis per-role + generik (dengan role) agar tidak bocor antar peran.
      try {
        const sessionPayload = {
          id: currentUserId,
          role,
          name: confirmedSnapshot.name,
          fullName: confirmedSnapshot.name,
          email: confirmedSnapshot.email,
          phone: confirmedSnapshot.phone,
          location: confirmedSnapshot.address,
          avatar: confirmedSnapshot.avatar
        };
        try {
          const roleStored = localStorage.getItem(`agriconnect_auth_user_${role}`);
          const roleParsed = roleStored ? JSON.parse(roleStored) : {};
          localStorage.setItem(`agriconnect_auth_user_${role}`, JSON.stringify({ ...roleParsed, ...sessionPayload }));
        } catch (e) {}
        try {
          const stored = localStorage.getItem('agriconnect_auth_user');
          const parsed = stored ? JSON.parse(stored) : {};
          // Hanya timpa cache generik jika role-nya sama (cegah petani menimpa cache admin/pembeli).
          if (!parsed?.role || String(parsed.role).toLowerCase() === String(role).toLowerCase()) {
            localStorage.setItem('agriconnect_auth_user', JSON.stringify({ ...parsed, ...sessionPayload }));
          }
        } catch (e) {}
      } catch (storageErr) {}

      // 10. Update parent dashboard state (Navbar, Topbar, Profile Menu)
      if (onUpdateProfile) {
        onUpdateProfile({
          ...(rawProfile || {}),
          id: currentUserId,
          name: confirmedSnapshot.name,
          fullName: confirmedSnapshot.name,
          email: confirmedSnapshot.email,
          phone: confirmedSnapshot.phone,
          location: confirmedSnapshot.address,
          address: confirmedSnapshot.address,
          avatar: confirmedSnapshot.avatar
        });
      }

      // 10b. Synchronize farmer_leader on commodities in Supabase
      if (currentUserId && confirmedSnapshot.name) {
        try {
          await supabase
            .from('commodities')
            .update({ farmer_leader: confirmedSnapshot.name })
            .eq('farmer_id', currentUserId);
        } catch (commSyncErr) {
          console.warn('[PengaturanPengguna] Notice syncing commodities farmer_leader:', commSyncErr);
        }
      }

      // Broadcast profile update event across active components
      window.dispatchEvent(new CustomEvent('agriconnect:profile_updated', {
        detail: {
          id: currentUserId,
          role: role,
          name: confirmedSnapshot.name,
          fullName: confirmedSnapshot.name,
          avatar: confirmedSnapshot.avatar,
          location: confirmedSnapshot.address,
          phone: confirmedSnapshot.phone
        }
      }));

      // 11. Clean success message
      setProfileSuccessMsg('Perubahan profil berhasil disimpan.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);

    } catch (err) {
      console.error('[PengaturanPengguna] Profile save exception:', err);
      setProfileErrorMsg('Gagal menyimpan perubahan. Silakan coba lagi.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password (Supabase Auth)
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setSecuritySuccessMsg('');
    setSecurityErrorMsg('');

    if (!currentPassword) {
      setSecurityErrorMsg('Silakan masukkan password saat ini.');
      return;
    }
    if (newPassword.length < 6) {
      setSecurityErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityErrorMsg('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
        });
        if (verifyErr) {
          setSecurityErrorMsg('Password saat ini tidak sesuai.');
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        setSecurityErrorMsg(`Gagal memperbarui password di Supabase: ${error.message}`);
        return;
      }
      setSecuritySuccessMsg('Password berhasil diperbarui dengan aman di Supabase Auth!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecuritySuccessMsg(''), 3500);
    } catch (err) {
      setSecurityErrorMsg(`Gagal memperbarui password: ${err.message || err}`);
    }
  };

  // Handle Logout All Devices
  const handleLogoutAllDevices = async () => {
    if (window.confirm('Keluar dari semua sesi perangkat lain? Anda akan tetap masuk di perangkat ini.')) {
      try {
        await supabase.auth.signOut({ scope: 'others' });
      } catch (e) {}
      setSecuritySuccessMsg('Berhasil keluar dari semua sesi perangkat lainnya.');
      setTimeout(() => setSecuritySuccessMsg(''), 3500);
    }
  };

  // Handle Toggle Notification (Persisted to profiles.notification_preferences)
  const handleToggleNotif = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      localStorage.setItem(`agriconnect_notif_prefs_${role}`, JSON.stringify(updated));
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || activeUserId;
      if (currentUserId) {
        await supabase.from('profiles').update({
          notification_preferences: updated
        }).eq('id', currentUserId);
      }
    } catch (e) {}
    setNotifSuccessMsg('Preferensi notifikasi otomatis disimpan.');
    setTimeout(() => setNotifSuccessMsg(''), 2500);
  };

  // Handle Global Logout
  const handleTriggerLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun?')) {
      if (onLogout) {
        onLogout();
      } else {
        supabase.auth.signOut().catch(() => {});
        localStorage.removeItem('agriconnect_auth_user');
        window.location.hash = '';
        window.location.reload();
      }
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'hapus akun') {
      alert('Ketik "HAPUS AKUN" dengan tepat untuk mengonfirmasi.');
      return;
    }

    try {
      if (activeUserId) {
        await supabase.from('profiles').delete().eq('id', activeUserId);
      }
      await supabase.auth.signOut();
    } catch (e) {}

    localStorage.removeItem('agriconnect_auth_user');
    alert('Akun Anda telah dinonaktifkan dan dihapus dari sistem TaniNiaga.');
    window.location.hash = '';
    window.location.reload();
  };

  return (
    <div className="settings-page-wrapper">
      
      {/* 1. TOP TAB NAVIGATION */}
      <div className="settings-tab-nav">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'edit-profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit-profile')}
        >
          Edit Profile
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Password & Keamanan
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifikasi
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Akun
        </button>
        {role === 'petani' && (
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Review
          </button>
        )}
      </div>

      {/* 2. MAIN SETTINGS CARD CONTAINER */}
      <div className="settings-main-card">
        
        {/* ======================================================== */}
        {/* TAB 1: EDIT PROFIL                                       */}
        {/* ======================================================== */}
        {activeTab === 'edit-profile' && (
          <div className="settings-tab-content">
            
            {profileSuccessMsg && (
              <div className="settings-alert-banner success">
                <CheckCircle size={18} weight="fill" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="settings-alert-banner error">
                <Warning size={18} weight="fill" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {/* SKELETON LOADING STATE: Tampil saat data profil sedang di-load dari Supabase */}
            {isLoadingProfile ? (
              <div className="settings-profile-layout">
                {/* Sisi Kiri: Skeleton Avatar */}
                <div className="settings-avatar-section">
                  <div className="settings-skeleton-avatar" />
                  <span className="settings-avatar-hint">Memuat foto profil...</span>
                </div>

                {/* Sisi Kanan: Skeleton Form Inputs */}
                <div className="settings-fields-grid">
                  <div className="settings-form-group full-width">
                    <label className="settings-form-label">Nama Lengkap</label>
                    <div className="settings-skeleton-input" />
                  </div>

                  <div className="settings-form-group full-width">
                    <label className="settings-form-label">Email</label>
                    <div className="settings-skeleton-input" />
                  </div>

                  <div className="settings-form-group full-width">
                    <label className="settings-form-label">Nomor Telepon</label>
                    <div className="settings-skeleton-input" />
                  </div>

                  {role !== 'admin' && (
                    <>
                      <div className="settings-section-divider">
                        <span className="settings-section-title">Alamat & Wilayah Operasional</span>
                      </div>

                      <div className="settings-form-group full-width">
                        <label className="settings-form-label">Alamat</label>
                        <div className="settings-skeleton-input" />
                      </div>

                      <div className="settings-form-group full-width">
                        <label className="settings-form-label">Kabupaten</label>
                        <div className="settings-skeleton-input" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* ACTUAL EDIT PROFILE FORM */
              <form onSubmit={handleSaveProfile}>
                <div className="settings-profile-layout">
                  
                  {/* SISI KIRI: Foto Profil dengan Ikon Kamera Overlay */}
                  <div className="settings-avatar-section">
                    <div className="settings-avatar-wrapper">
                      <img 
                        src={formData.avatar || (role === 'admin' 
                          ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80'
                          : role === 'pembeli'
                          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
                          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
                        )} 
                        alt={formData.name || 'Foto Profil'} 
                        className="settings-avatar-img"
                      />
                      <button
                        type="button"
                        className="settings-avatar-camera-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Ganti Foto Profil"
                      >
                        <Camera size={16} weight="fill" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/jpeg,image/png,image/webp,image/jpg" 
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <span className="settings-avatar-hint">Klik kamera untuk mengubah foto</span>
                  </div>

                  {/* SISI KANAN: Form Input */}
                  <div className="settings-fields-grid">
                    
                    {/* Baris 1: Nama Lengkap */}
                    <div className="settings-form-group full-width">
                      <label className="settings-form-label">Nama Lengkap</label>
                      <input 
                        type="text"
                        className="settings-form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>

                    {/* Baris 2: Email Address (Terkunci / Read Only Sesuai Desain Existing) */}
                    <div className="settings-form-group full-width">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="settings-form-label">Email</label>
                        <span className="settings-locked-badge">
                          <Lock size={12} weight="bold" /> Terkunci (Identitas Akun)
                        </span>
                      </div>
                      <input 
                        type="email"
                        className="settings-form-input locked"
                        value={formData.email}
                        readOnly
                        disabled
                        title="Alamat email terdaftar sebagai identitas akun dan tidak dapat diubah"
                      />
                    </div>

                    {/* Baris 3: Nomor Telepon */}
                    <div className="settings-form-group full-width">
                      <label className="settings-form-label">Nomor Telepon</label>
                      <input 
                        type="tel"
                        className="settings-form-input"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0812-4321-8765"
                        required
                      />
                    </div>

                    {/* Alamat & Wilayah Operasional (Khusus Petani & Pembeli, Admin tidak membutuhkan alamat operasional) */}
                    {role !== 'admin' && (
                      <>
                        {/* Section Header: Alamat & Wilayah */}
                        <div className="settings-section-divider">
                          <span className="settings-section-title">Alamat & Wilayah Operasional</span>
                        </div>

                        {/* Baris 4: Alamat Domisili */}
                        <div className="settings-form-group full-width">
                          <label className="settings-form-label">Alamat</label>
                          <input 
                            type="text"
                            className="settings-form-input"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Masukkan alamat domisili / operasional lengkap"
                            required
                          />
                        </div>

                        {/* Baris 5: Kabupaten (Minahasa - Wilayah Operasional Terkunci) */}
                        <div className="settings-form-group full-width">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="settings-form-label">Kabupaten</label>
                            <span className="settings-locked-badge">
                              <Lock size={12} weight="bold" /> Wilayah Operasional Terkunci
                            </span>
                          </div>
                          <input 
                            type="text"
                            className="settings-form-input locked"
                            value={formData.kabupaten || 'Minahasa'}
                            readOnly
                            disabled
                            title="Wilayah operasional terkunci pada Kabupaten Minahasa"
                          />
                        </div>
                      </>
                    )}

                  </div>

                </div>

                {/* Bottom Actions: Save Changes */}
                <div className="settings-form-footer">
                  <button 
                    type="submit" 
                    className="settings-btn-save"
                    disabled={isSavingProfile || !isDirty}
                    style={{ 
                      opacity: (isSavingProfile || !isDirty) ? 0.65 : 1, 
                      cursor: (isSavingProfile || !isDirty) ? 'not-allowed' : 'pointer' 
                    }}
                    title={!isDirty ? 'Tidak ada perubahan data' : 'Simpan perubahan profil ke database Supabase'}
                  >
                    {isSavingProfile ? (
                      <>
                        <CircleNotch size={18} weight="bold" className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <FloppyDisk size={18} weight="bold" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PASSWORD & KEAMANAN                               */}
        {/* ======================================================== */}
        {activeTab === 'security' && (
          <div className="settings-tab-content">
            
            {securitySuccessMsg && (
              <div className="settings-alert-banner success">
                <CheckCircle size={18} weight="fill" />
                <span>{securitySuccessMsg}</span>
              </div>
            )}

            {securityErrorMsg && (
              <div className="settings-alert-banner error">
                <Warning size={18} weight="fill" />
                <span>{securityErrorMsg}</span>
              </div>
            )}

            {/* Sub-section 1: Form Ganti Password */}
            <div className="settings-card-block">
              <h3 className="settings-block-title">Ubah Password Akun</h3>
              <p className="settings-block-sub">
                Pastikan Anda menggunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk keamanan maksimal.
              </p>

              <form onSubmit={handleSavePassword} style={{ marginTop: '1.25rem' }}>
                <div className="settings-form-grid-pw">
                  
                  {/* Password Saat Ini */}
                  <div className="settings-form-group">
                    <label className="settings-form-label">Password Saat Ini</label>
                    <div className="settings-input-icon-wrap">
                      <input 
                        type={showCurrentPw ? 'text' : 'password'}
                        className="settings-form-input with-action"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan password lama"
                        required
                      />
                      <button
                        type="button"
                        className="settings-eye-btn"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        tabIndex={-1}
                      >
                        {showCurrentPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Baru */}
                  <div className="settings-form-group">
                    <label className="settings-form-label">Password Baru</label>
                    <div className="settings-input-icon-wrap">
                      <input 
                        type={showNewPw ? 'text' : 'password'}
                        className="settings-form-input with-action"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        required
                      />
                      <button
                        type="button"
                        className="settings-eye-btn"
                        onClick={() => setShowNewPw(!showNewPw)}
                        tabIndex={-1}
                      >
                        {showNewPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Password */}
                  <div className="settings-form-group">
                    <label className="settings-form-label">Konfirmasi Password Baru</label>
                    <div className="settings-input-icon-wrap">
                      <input 
                        type={showConfirmPw ? 'text' : 'password'}
                        className="settings-form-input with-action"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang password baru"
                        required
                      />
                      <button
                        type="button"
                        className="settings-eye-btn"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        tabIndex={-1}
                      >
                        {showConfirmPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button type="submit" className="settings-btn-save">
                    <Lock size={16} weight="bold" />
                    <span>Perbarui Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Sub-section 2: Status Verifikasi Email & Nomor Telepon */}
            <div className="settings-card-block" style={{ marginTop: '2rem' }}>
              <h3 className="settings-block-title">Status Verifikasi Kontak</h3>
              <p className="settings-block-sub">
                Keabsahan email dan nomor telepon terdaftar untuk keamanan transaksi dan notifikasi resmi.
              </p>

              <div className="settings-verification-list">
                
                {/* Email Verification */}
                <div className="settings-verification-item">
                  <div className="settings-verification-left">
                    <div className="settings-vicon-wrap verified">
                      <EnvelopeSimple size={20} weight="bold" />
                    </div>
                    <div>
                      <div className="settings-v-title">Email: {formData.email || 'Terdaftar'}</div>
                      <div className="settings-v-desc">Digunakan untuk menerima salinan kontrak, kode OTP, dan notifikasi transaksi.</div>
                    </div>
                  </div>
                  <div className="settings-v-badge verified">
                    <CheckCircle size={15} weight="fill" />
                    <span>Terverifikasi</span>
                  </div>
                </div>

                {/* Phone Verification */}
                <div className="settings-verification-item">
                  <div className="settings-verification-left">
                    <div className="settings-vicon-wrap verified">
                      <Phone size={20} weight="bold" />
                    </div>
                    <div>
                      <div className="settings-v-title">Nomor Telepon: {formData.phone || 'Terdaftar'}</div>
                      <div className="settings-v-desc">Nomor WhatsApp dan panggilan resmi untuk konfirmasi jadwal angkut panen mandiri.</div>
                    </div>
                  </div>
                  <div className="settings-v-badge verified">
                    <CheckCircle size={15} weight="fill" />
                    <span>Terverifikasi</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Sub-section 3: Manajemen Sesi & Keluar dari Semua Perangkat */}
            <div className="settings-card-block" style={{ marginTop: '2rem' }}>
              <h3 className="settings-block-title">Manajemen Sesi Perangkat</h3>
              <p className="settings-block-sub">
                Kontrol sesi login aktif akun Anda di seluruh perangkat dan browser.
              </p>

              <div className="settings-session-box">
                <div className="settings-session-info">
                  <DeviceMobile size={24} weight="duotone" color="#5452f6" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      Perangkat Saat Ini (Browser Web • Minahasa, Indonesia)
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                      ● Sesi Aktif Sekarang
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="settings-btn-secondary danger-outline"
                >
                  <SignOut size={16} weight="bold" />
                  <span>Keluar dari Semua Perangkat Lain</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: NOTIFIKASI                                        */}
        {/* ======================================================== */}
        {activeTab === 'notifications' && (
          <div className="settings-tab-content">
            
            {notifSuccessMsg && (
              <div className="settings-alert-banner success">
                <CheckCircle size={18} weight="fill" />
                <span>{notifSuccessMsg}</span>
              </div>
            )}

            <div className="settings-card-block">
              <h3 className="settings-block-title">Pengaturan Preferensi Notifikasi</h3>
              <p className="settings-block-sub">
                Pilih jenis informasi dan pemberitahuan yang ingin Anda terima secara langsung di platform.
              </p>

              <div className="settings-toggle-list">
                
                {/* 1. Proposal disetujui */}
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <strong className="settings-toggle-title">Proposal Disetujui</strong>
                    <p className="settings-toggle-desc">
                      Pemberitahuan saat proposal penawaran atau kesepakatan komoditas telah diterima dan ditandatangani.
                    </p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox"
                      checked={notifications.proposalApproved}
                      onChange={() => handleToggleNotif('proposalApproved')}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>

                {/* 2. Proposal ditolak */}
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <strong className="settings-toggle-title">Proposal Ditolak</strong>
                    <p className="settings-toggle-desc">
                      Pemberitahuan jika proposal penawaran memerlukan penyesuaian atau tidak dapat diproses.
                    </p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox"
                      checked={notifications.proposalRejected}
                      onChange={() => handleToggleNotif('proposalRejected')}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>

                {/* 3. Proposal akan berakhir */}
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <strong className="settings-toggle-title">Proposal Akan Berakhir</strong>
                    <p className="settings-toggle-desc">
                      Peringatan batas waktu sebelum masa berlaku penawaran harga atau kontrak pengadaan habis.
                    </p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox"
                      checked={notifications.proposalExpiring}
                      onChange={() => handleToggleNotif('proposalExpiring')}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>

                {/* 4. Respons petani */}
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <strong className="settings-toggle-title">Respons Petani</strong>
                    <p className="settings-toggle-desc">
                      Notifikasi langsung ketika petani mengirimkan penawaran balik, jadwal panen terbaru, atau pesan chat.
                    </p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox"
                      checked={notifications.farmerResponse}
                      onChange={() => handleToggleNotif('farmerResponse')}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>

                {/* 5. Status pesanan/transaksi */}
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <strong className="settings-toggle-title">Status Pesanan / Transaksi</strong>
                    <p className="settings-toggle-desc">
                      Pembaruan status pembayaran escrow, jadwal pengambilan mandiri di gudang, dan rilis tanda jadi.
                    </p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox"
                      checked={notifications.orderStatus}
                      onChange={() => handleToggleNotif('orderStatus')}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>

                {/* 6. Informasi harga pasar */}
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <strong className="settings-toggle-title">Informasi Harga Pasar</strong>
                    <p className="settings-toggle-desc">
                      Pemberitahuan tren kenaikan dan penurunan harga pasar komoditas sentra pertanian Minahasa harian.
                    </p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox"
                      checked={notifications.marketPrices}
                      onChange={() => handleToggleNotif('marketPrices')}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>

                {/* 7. Pengumuman sistem */}
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <strong className="settings-toggle-title">Pengumuman Sistem</strong>
                    <p className="settings-toggle-desc">
                      Informasi pemeliharaan platform, pembaruan regulasi pertanian Minahasa, dan fitur baru TaniNiaga.
                    </p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox"
                      checked={notifications.systemAnnouncements}
                      onChange={() => handleToggleNotif('systemAnnouncements')}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: AKUN                                              */}
        {/* ======================================================== */}
        {activeTab === 'account' && (
          <div className="settings-tab-content">
            
            {accountActionMsg && (
              <div className="settings-alert-banner success">
                <CheckCircle size={18} weight="fill" />
                <span>{accountActionMsg}</span>
              </div>
            )}

            {/* Status Akun & Tanggal Bergabung */}
            <div className="settings-card-block">
              <h3 className="settings-block-title">Status Akun & Keanggotaan</h3>
              <p className="settings-block-sub">
                Informasi status verifikasi dan rekam jejak akun Anda di ekosistem resmi TaniNiaga.
              </p>

              <div className="settings-account-meta-grid">
                
                {/* 1. Status Akun (Dinamis dari Supabase kyc_status) */}
                <div className="settings-meta-item">
                  <span className="settings-meta-label">Status Akun</span>
                  <div className="settings-meta-val">
                    {isLoadingProfile ? (
                      <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '130px', height: '22px', borderRadius: '9999px' }} />
                    ) : (
                      (() => {
                        const isAdm = role?.toLowerCase() === 'admin' || accountMeta.role?.toLowerCase() === 'admin';
                        const kyc = String(accountMeta.kycStatus || '').toLowerCase();

                        if (isAdm) {
                          return (
                            <span 
                              className="settings-status-pill"
                              style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}
                            >
                              <ShieldCheck size={15} weight="fill" />
                              <span>Administrator Resmi</span>
                            </span>
                          );
                        }

                        if (kyc === 'verified' || kyc === 'aktif' || kyc === 'active') {
                          return (
                            <span className="settings-status-pill active">
                              <CheckCircle size={15} weight="fill" />
                              <span>Aktif & Terverifikasi KYC</span>
                            </span>
                          );
                        }

                        if (kyc === 'pending' || kyc === 'menunggu persetujuan') {
                          return (
                            <span 
                              className="settings-status-pill"
                              style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
                            >
                              <Clock size={15} weight="bold" />
                              <span>Menunggu Verifikasi KYC</span>
                            </span>
                          );
                        }

                        if (kyc === 'rejected' || kyc === 'ditolak') {
                          return (
                            <span 
                              className="settings-status-pill"
                              style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                            >
                              <XCircle size={15} weight="fill" />
                              <span>Verifikasi KYC Ditolak</span>
                            </span>
                          );
                        }

                        return (
                          <span 
                            className="settings-status-pill"
                            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                          >
                            <ShieldCheck size={15} weight="bold" />
                            <span>Belum Terverifikasi</span>
                          </span>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* 2. Tanggal Bergabung (Dinamis dari Supabase created_at) */}
                <div className="settings-meta-item">
                  <span className="settings-meta-label">Tanggal Bergabung</span>
                  <div className="settings-meta-val">
                    {isLoadingProfile ? (
                      <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '120px', height: '18px', borderRadius: '4px' }} />
                    ) : (
                      <strong>{formatJoinDate(accountMeta.createdAt)}</strong>
                    )}
                  </div>
                </div>

                {/* 3. Peran Akun (Role) */}
                <div className="settings-meta-item">
                  <span className="settings-meta-label">Peran Akun (Role)</span>
                  <div className="settings-meta-val">
                    <span style={{ 
                      textTransform: 'capitalize', 
                      fontWeight: 700, 
                      color: role?.toLowerCase() === 'admin' ? '#7c3aed' : role?.toLowerCase() === 'pembeli' ? '#2563eb' : '#059669',
                      background: role?.toLowerCase() === 'admin' ? 'rgba(124, 58, 237, 0.08)' : role?.toLowerCase() === 'pembeli' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {role?.toLowerCase() === 'admin' ? 'Admin' : role?.toLowerCase() === 'pembeli' ? 'Pembeli' : 'Petani'}
                    </span>
                  </div>
                </div>

                {/* 4. Wilayah Domisili (Dinamis dari Supabase location) - Khusus Petani & Pembeli */}
                {role !== 'admin' && (
                  <div className="settings-meta-item">
                    <span className="settings-meta-label">Wilayah Domisili</span>
                    <div className="settings-meta-val">
                      {isLoadingProfile ? (
                        <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '180px', height: '18px', borderRadius: '4px' }} />
                      ) : (
                        <span>{accountMeta.location || formData.address || 'Kabupaten Minahasa, Sulawesi Utara'}</span>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Pembaruan Aplikasi (Otomatis & Realtime via Cloud) */}
            <div className="settings-card-block" style={{ marginTop: '2rem' }}>
              {updateSuccessMsg && (
                <div className="settings-alert-banner success" style={{ marginBottom: '1.25rem' }}>
                  <CheckCircle size={18} weight="fill" />
                  <span>{updateSuccessMsg}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                <div style={{ maxWidth: '580px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h3 className="settings-block-title" style={{ margin: 0 }}>Versi & Pembaruan Aplikasi</h3>
                    <span style={{ 
                      fontSize: '0.74rem', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '9999px', 
                      background: '#dcfce7', 
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                      Versi Terbaru v1.2.0
                    </span>
                  </div>
                  <p className="settings-block-sub" style={{ margin: 0, lineHeight: 1.5 }}>
                    Aplikasi mobile Anda terhubung langsung secara real-time ke Vercel Cloud. Setiap perbaikan dan fitur baru otomatis sinkron tanpa perlu kompilasi ulang di Android Studio atau instal ulang file APK.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="settings-btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    background: '#5452f6',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: isCheckingUpdate ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(84, 82, 246, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ArrowClockwise size={17} weight="bold" className={isCheckingUpdate ? 'animate-spin' : ''} />
                  <span>{isCheckingUpdate ? 'Memeriksa...' : 'Periksa & Muat Pembaruan'}</span>
                </button>
              </div>
            </div>

            {/* Logout Section */}
            <div className="settings-card-block" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 className="settings-block-title" style={{ margin: 0 }}>Keluar dari Akun</h3>
                  <p className="settings-block-sub" style={{ margin: '0.25rem 0 0 0' }}>
                    Akhiri sesi masuk Anda saat ini di browser ini dengan aman.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerLogout}
                  className="settings-btn-logout"
                >
                  <SignOut size={16} weight="bold" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            {/* Danger Zone: Hapus Akun */}
            <div className="settings-card-block danger-zone" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 className="settings-block-title danger" style={{ margin: 0 }}>Hapus Akun</h3>
                  <p className="settings-block-sub" style={{ margin: '0.25rem 0 0 0' }}>
                    Menghapus akun Anda secara permanen beserta data komoditas, riwayat transaksi, dan kontrak. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="settings-btn-danger"
                >
                  <Trash size={16} weight="bold" />
                  <span>Hapus Akun</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: REVIEW / ULASAN & RATING (KHUSUS PETANI)          */}
        {/* ======================================================== */}
        {role === 'petani' && activeTab === 'review' && (
          <div className="settings-tab-content">
            
            {/* Header Judul */}
            <div className="settings-review-header">
              <h3 className="settings-review-title">Review & Rating Pembeli</h3>
              <p className="settings-review-sub">
                Daftar penilaian kepuasan dan reputasi komoditas Anda dari mitra pembeli yang terverifikasi di TaniNiaga.
              </p>
            </div>

            {/* Rangkuman Skor & Distribusi Bintang (Sesuai Permintaan: Misal rating 5 dan 4 -> 4.5. Belum ada rating -> default 5.0) */}
            <div className="settings-rating-summary-grid">
              {/* Kolom Kiri: Angka Rating Besar & Bintang */}
              <div className="settings-rating-hero">
                <div className="settings-rating-big-number">
                  {reviewsData.average.toFixed(1)}
                </div>
                <div className="settings-rating-stars-row">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= Math.round(reviewsData.average);
                    return (
                      <Star 
                        key={starVal} 
                        size={22} 
                        weight={isFilled ? 'fill' : 'regular'} 
                        color={isFilled ? '#f59e0b' : '#cbd5e1'} 
                      />
                    );
                  })}
                </div>
                <div className="settings-rating-count-label">
                  {reviewsData.totalCount > 0 
                    ? `Berdasarkan ${reviewsData.totalCount} ulasan pembeli` 
                    : 'Belum ada ulasan (Nilai awal default: 5.0)'}
                </div>
                <div className="settings-rating-trust-badge">
                  <ShieldCheck size={14} weight="bold" />
                  <span>Ulasan Pembeli Terverifikasi</span>
                </div>
              </div>

              {/* Kolom Kanan: Distribusi Persentase Bintang (5 hingga 1) */}
              <div className="settings-rating-bars-col">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewsData.distribution[stars] || 0;
                  const pct = reviewsData.percentages[stars] || 0;
                  const isCurrentFilter = starFilter === String(stars);

                  return (
                    <div 
                      key={stars} 
                      className={`settings-rating-bar-row ${isCurrentFilter ? 'active' : ''}`}
                      onClick={() => setStarFilter(starFilter === String(stars) ? 'all' : String(stars))}
                      title={`Filter ${stars} Bintang (${count} ulasan)`}
                    >
                      <span className="settings-rating-bar-label">
                        <span>{stars}</span>
                        <Star size={12} weight="fill" color="#f59e0b" />
                      </span>
                      <div className="settings-rating-bar-track">
                        <div 
                          className="settings-rating-bar-fill" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="settings-rating-bar-count">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Toolbar Filter & Pencarian Ulasan */}
            <div className="settings-reviews-toolbar">
              <div className="settings-reviews-pills">
                <button
                  type="button"
                  className={`settings-review-pill-btn ${starFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStarFilter('all')}
                >
                  Semua ({reviewsData.totalCount})
                </button>
                {[5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`settings-review-pill-btn ${starFilter === String(s) ? 'active' : ''}`}
                    onClick={() => setStarFilter(String(s))}
                  >
                    ★ {s} ({reviewsData.distribution[s] || 0})
                  </button>
                ))}
              </div>

              <div className="settings-reviews-search">
                <MagnifyingGlass size={15} className="settings-reviews-search-icon" />
                <input 
                  type="text"
                  className="settings-reviews-search-input"
                  placeholder="Cari pembeli, komoditas..."
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Daftar Kartu Review */}
            {(() => {
              const filteredReviews = reviewsData.reviews.filter((r) => {
                const score = Math.round(Number(r.rating) || 5);
                const matchStar = starFilter === 'all' || score === Number(starFilter);
                const q = reviewSearchQuery.trim().toLowerCase();
                const matchSearch = !q ||
                  (r.buyer_name || '').toLowerCase().includes(q) ||
                  (r.commodity_name || '').toLowerCase().includes(q) ||
                  (r.comment || '').toLowerCase().includes(q);
                return matchStar && matchSearch;
              });

              if (filteredReviews.length === 0) {
                if (reviewsData.totalCount === 0) {
                  return (
                    <div className="settings-review-empty-state">
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Star size={24} weight="fill" />
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                        Belum Ada Ulasan Masuk
                      </h4>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.55 }}>
                        Rating reputasi akun Anda saat ini bernilai <strong>default 5.0</strong>. Setelah mitra pembeli menyelesaikan transaksi dan memberi rating pada komoditas yang dibeli, ulasan mereka akan otomatis tampil di sini.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="settings-review-empty-state">
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                      Tidak Ada Ulasan yang Sesuai
                    </h4>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                      Coba ganti filter bintang atau kata kunci pencarian Anda.
                    </p>
                    <button 
                      type="button" 
                      className="settings-review-pill-btn active"
                      onClick={() => { setStarFilter('all'); setReviewSearchQuery(''); }}
                    >
                      Reset Filter
                    </button>
                  </div>
                );
              }

              return (
                <div className="settings-reviews-list">
                  {filteredReviews.map((r, idx) => (
                    <div key={r.id || idx} className="settings-review-card">
                      {/* Baris Atas: Info Pembeli & Tanggal */}
                      <div className="settings-review-card-top">
                        <div className="settings-review-buyer-info">
                          <img 
                            src={r.buyer_avatar || DEFAULT_AVATAR} 
                            alt={r.buyer_name} 
                            className="settings-review-buyer-avatar"
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                          />
                          <div>
                            <div className="settings-review-buyer-name">{r.buyer_name}</div>
                            <div className="settings-review-verified-pill">
                              <ShieldCheck size={12} weight="bold" />
                              <span>Pembeli Terverifikasi</span>
                            </div>
                          </div>
                        </div>

                        <span className="settings-review-date">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Baru saja'}
                        </span>
                      </div>

                      {/* Baris Tengah: Bintang Rating, Tag Komoditas & Kode Transaksi */}
                      <div className="settings-review-middle-row">
                        <div className="settings-review-stars-score">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              size={15} 
                              weight={s <= Math.round(Number(r.rating) || 5) ? 'fill' : 'regular'} 
                              color="#f59e0b" 
                            />
                          ))}
                          <span className="settings-review-score-text">
                            {Number(r.rating || 5).toFixed(1)} / 5.0
                          </span>
                        </div>

                        {r.commodity_name && (
                          <span className="settings-review-commodity-badge" title="Komoditas yang dibeli">
                            <Package size={13} weight="bold" />
                            <span>{r.commodity_name}</span>
                          </span>
                        )}
                      </div>

                      {/* Baris Bawah: Komentar Ulasan */}
                      {r.comment && (
                        <p className="settings-review-comment">
                          "{r.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL KONFIRMASI HAPUS AKUN                              */}
      {/* ======================================================== */}
      {deleteModalOpen && (
        <div className="settings-modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="settings-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <div className="settings-modal-icon danger">
                <Warning size={28} weight="fill" />
              </div>
              <div>
                <h3 className="settings-modal-title">Konfirmasi Hapus Akun Permanen</h3>
                <p className="settings-modal-sub">
                  Perhatian: Seluruh data legalitas, komoditas, dan histori transaksi akun Anda akan dihapus secara permanen dari server TaniNiaga.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Ketik <strong>HAPUS AKUN</strong> untuk melanjutkan:
              </label>
              <input 
                type="text"
                className="settings-form-input"
                placeholder="HAPUS AKUN"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>

            <div className="settings-modal-actions">
              <button
                type="button"
                className="settings-btn-cancel"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
              >
                Batal
              </button>
              <button
                type="button"
                className="settings-btn-danger-confirm"
                disabled={deleteConfirmText.toLowerCase() !== 'hapus akun'}
                onClick={handleDeleteAccount}
              >
                Hapus Akun Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
