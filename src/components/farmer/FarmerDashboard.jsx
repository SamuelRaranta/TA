import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  User,
  Star
} from '@phosphor-icons/react';
import { fetchFarmerReviews, subscribeFarmerReviews } from '../../lib/reviewService';
import { DEFAULT_AVATAR } from '../../lib/constants';

import {
  fetchOffersFromSupabase,
  updateOfferInSupabase,
  fetchContractsFromSupabase,
  createContractInSupabase,
  createTransactionInSupabase,
  ensureStockReserved,
  ensureStockRestored,
  fetchTransactionsFromSupabase,
  subscribeOffers,
  subscribeContracts,
  subscribeTransactions
} from '../../lib/dealService';
import { fetchMarketPricesFromSupabase, subscribeMarketPrices } from '../../lib/marketPriceService';
import { 
  fetchCommoditiesFromSupabase, 
  createCommodityInSupabase, 
  updateCommodityInSupabase, 
  deleteCommodityInSupabase, 
  subscribeCommodities 
} from '../../lib/commodityService';
import {
  fetchActiveProcurementProposalsFromSupabase,
  fetchProcurementProposalsFromSupabase,
  updateProcurementStatusInSupabase,
  subscribeProcurementProposals,
  mapProposalToOfferItem
} from '../../lib/procurementService';
import { supabase } from '../../lib/supabaseClient';

import RingkasanPetani from './RingkasanPetani';
import KomoditasSaya from './KomoditasSaya';
import PenawaranPetani from './PenawaranPetani';
import HargaPasarPetani from './HargaPasarPetani';
import PengaturanPetani from './PengaturanPetani';
import RiwayatTransaksiPetani from './RiwayatTransaksiPetani';
import PesanPetani from './PesanPetani';
import CariKomoditas from '../buyer/CariKomoditas';
import LihatPenawaran from '../buyer/LihatPenawaran';
import LaporkanMasalah from '../common/LaporkanMasalah';
import NotificationDropdown from '../common/NotificationDropdown';
import NotificationPage from '../common/NotificationPage';
import { useNotifications } from '../../lib/useNotifications';
import { 
  notifyOfferAccepted, 
  notifyOfferRejected, 
  notifyOfferCountered 
} from '../../lib/notificationService';

// Route mapping for Farmer sub-pages
const FARMER_TAB_TO_ROUTE = {
  dashboard: '#/petani/dashboard',
  'lihat-komoditas': '#/petani/lihat-komoditas',
  'cari-penawaran': '#/petani/cari-penawaran',
  'komoditas-saya': '#/petani/komoditas-saya',
  penawaran: '#/petani/penawaran',
  binding: '#/petani/binding',
  transaksi: '#/petani/transaksi',
  'harga-pasar': '#/petani/harga-pasar',
  pesan: '#/petani/pesan',
  'laporkan-masalah': '#/petani/laporkan-masalah',
  pengaturan: '#/petani/pengaturan',
  notifikasi: '#/petani/notifikasi'
};

const getFarmerTabFromHash = () => {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('notifikasi') || hash.includes('notifications')) return 'notifikasi';
  if (hash.includes('lihat-komoditas')) return 'lihat-komoditas';
  if (hash.includes('cari-penawaran')) return 'cari-penawaran';
  if (hash.includes('komoditas-saya') || hash.includes('produk-saya')) return 'komoditas-saya';
  if (hash.includes('binding')) return 'transaksi';
  if (hash.includes('transaksi') || hash.includes('riwayat-transaksi')) return 'transaksi';
  if (hash.includes('penawaran')) return 'penawaran';
  if (hash.includes('harga-pasar') || hash.includes('hargapasar')) return 'harga-pasar';
  if (hash.includes('pesan') || hash.includes('chat')) return 'pesan';
  if (hash.includes('laporkan-masalah') || hash.includes('laporan-bug') || hash.includes('laporan') || hash.includes('masalah')) return 'laporkan-masalah';
  if (hash.includes('pengaturan') || hash.includes('settings')) return 'pengaturan';
  return 'dashboard';
};

export default function FarmerDashboard({ 
  onBackToHome, 
  theme, 
  onToggleTheme 
}) {
  // Navigation active tab with deep-linking support
  const [activeTab, setActiveTab] = useState(() => getFarmerTabFromHash());
  
  // Switch tab AND update browser URL hash for deep linking
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const targetRoute = FARMER_TAB_TO_ROUTE[newTab] || `#/petani/${newTab}`;
    if (window.location.hash !== targetRoute) {
      window.location.hash = targetRoute;
    }
  };

  // Sync with browser back/forward buttons or direct URL change
  useEffect(() => {
    const onHashChange = () => {
      const tab = getFarmerTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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

  // Loading States to prevent Stale Data Flash
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Core Data States
  const [farmerProfile, setFarmerProfile] = useState(() => {
    try {
      const roleStored = localStorage.getItem('agriconnect_auth_user_petani');
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
      if (parsed?.role === 'petani' && parsed?.id) {
        return {
          id: parsed.id,
          name: parsed.fullName || parsed.full_name || parsed.name || '',
          email: parsed.email || '',
          groupName: parsed.groupName || 'Kelompok Tani',
          phone: parsed.phone || '',
          location: parsed.location || 'Minahasa, Sulawesi Utara',
          address: parsed.location || 'Minahasa, Sulawesi Utara',
          avatar: parsed.avatar || parsed.avatar_url || '',
          role: 'petani',
          kycStatus: parsed.kyc_status || parsed.kycStatus || 'verified',
          createdAt: parsed.created_at || parsed.createdAt || null
        };
      }
    } catch (err) {}
    return {
      id: null,
      name: '',
      email: '',
      groupName: 'Kelompok Tani',
      phone: '',
      location: 'Minahasa, Sulawesi Utara',
      address: 'Minahasa, Sulawesi Utara',
      avatar: '',
      role: 'petani',
      kycStatus: 'verified',
      createdAt: null
    };
  });
  const [currentFarmerId, setCurrentFarmerId] = useState(() => {
    try {
      const roleStored = localStorage.getItem('agriconnect_auth_user_petani');
      if (roleStored) {
        const parsed = JSON.parse(roleStored);
        if (parsed?.role === 'petani' && parsed?.id) return parsed.id;
      }
      const stored = localStorage.getItem('agriconnect_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role === 'petani' && parsed?.id) return parsed.id;
      }
    } catch (err) {}
    // ISOLASI: jangan fallback ke seed UUID bersama. null = belum login, query DB dilewati.
    return null;
  });
  const [myProducts, setMyProducts] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const products = myProducts; // Safety alias
  const [offers, setOffers] = useState([]);
  const [buyerOffers, setBuyerOffers] = useState([]);
  const [bindingAgreements, setBindingAgreements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [settingsInitialTab, setSettingsInitialTab] = useState('edit-profile');
  const [farmerRating, setFarmerRating] = useState({
    average: 5.0,
    totalCount: 0,
    isDefault: true
  });

  // Load Farmer Rating & Total Buyers Count from Supabase
  useEffect(() => {
    let isMounted = true;
    const loadRating = async () => {
      const targetId = currentFarmerId || farmerProfile?.id;
      const res = await fetchFarmerReviews(targetId, farmerProfile?.name);
      if (isMounted) {
        setFarmerRating({
          average: res.average,
          totalCount: res.totalCount,
          isDefault: res.isDefault
        });
      }
    };
    loadRating();

    const targetId = currentFarmerId || farmerProfile?.id;
    const unsub = subscribeFarmerReviews(targetId, (updated) => {
      if (isMounted) {
        setFarmerRating({
          average: updated.average,
          totalCount: updated.totalCount,
          isDefault: updated.isDefault
        });
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentFarmerId, farmerProfile?.id, farmerProfile?.name]);

  // Ganti user -> kosongkan daftar milik user lama DULU agar tidak tampil data basi
  // (kosong + loading lebih benar daripada daftar orang lain).
  const lastFarmerRef = useRef(currentFarmerId);
  useEffect(() => {
    if (lastFarmerRef.current !== currentFarmerId) {
      lastFarmerRef.current = currentFarmerId;
      setMyProducts([]);
      setOffers([]);
      setBindingAgreements([]);
      setTransactions([]);
      setBuyerOffers([]);
    }
  }, [currentFarmerId]);

  // Load real deals (offers, binding agreements, transactions) from Supabase
  const loadDeals = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const roleStored = localStorage.getItem('agriconnect_auth_user_petani');
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      let authUser = null;
      try {
        authUser = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
        if (authUser && authUser.role && String(authUser.role).toLowerCase() !== 'petani') authUser = null;
      } catch (e) { authUser = null; }
      const { data: { user } } = await supabase.auth.getUser();
      const activeUserId = user?.id || authUser?.id || currentFarmerId;
      if (!activeUserId) {
        setIsLoadingData(false);
        return;
      }

      if (activeUserId) {
        const [offersRes, contractsRes, trxsRes] = await Promise.all([
          fetchOffersFromSupabase({ farmerId: activeUserId }),
          fetchContractsFromSupabase({ farmerId: activeUserId }),
          fetchTransactionsFromSupabase({ farmerId: activeUserId })
        ]);

        setOffers(offersRes?.data || []);
        setBindingAgreements(contractsRes?.data || []);
        // Enrichment: nama + foto pembeli dari profiles (transactions hanya simpan buyer_id).
        const rawTrxs = trxsRes?.data || [];
        const buyerIds = [...new Set(rawTrxs.map(t => t.buyerId).filter(Boolean))];
        let buyerMap = {};
        if (buyerIds.length > 0) {
          try {
            const { data: buyers } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', buyerIds);
            (buyers || []).forEach(b => { buyerMap[b.id] = b; });
          } catch (e) {
            console.warn('[FarmerDashboard] Gagal memuat profil pembeli:', e);
          }
        }
        setTransactions(rawTrxs.map(t => ({
          ...t,
          buyerName: buyerMap[t.buyerId]?.full_name || t.buyerName,
          buyerAvatar: buyerMap[t.buyerId]?.avatar_url || null
        })));
      }
    } catch (err) {
      console.warn('[FarmerDashboard] Gagal memuat data transaksi dari Supabase:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentFarmerId]);

  useEffect(() => {
    loadDeals();

    const unsubOffers = subscribeOffers(() => loadDeals());
    const unsubContracts = subscribeContracts(() => loadDeals());
    const unsubTransactions = subscribeTransactions(() => loadDeals());

    const handleOffersDeleted = (e) => {
      const deletedIds = e.detail?.ids || [];
      const set = new Set((Array.isArray(deletedIds) ? deletedIds : [deletedIds]).map(String));
      setOffers(prev => prev.filter(o => !set.has(String(o.id))));
    };
    window.addEventListener('agriconnect:delete-offers', handleOffersDeleted);

    return () => {
      if (unsubOffers) unsubOffers();
      if (unsubContracts) unsubContracts();
      if (unsubTransactions) unsubTransactions();
      window.removeEventListener('agriconnect:delete-offers', handleOffersDeleted);
    };
  }, [loadDeals]);

  // Load real market prices from Supabase and subscribe to realtime changes
  useEffect(() => {
    let isMounted = true;
    const loadPrices = async () => {
      try {
        const { data } = await fetchMarketPricesFromSupabase();
        if (isMounted && data && data.length > 0) {
          setMarketPrices(data);
        }
      } catch (err) {
        console.warn('[FarmerDashboard] Gagal memuat harga pasar dari Supabase:', err);
      }
    };

    loadPrices();

    const unsubscribe = subscribeMarketPrices(() => {
      loadPrices();
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Helper function to load commodities (catalog for marketplace, my products for farmer inventory)
  const loadFarmerCommodities = async (targetFarmerId) => {
    try {
      // 1. Load catalog commodities for public marketplace (all farmers)
      const catalogRes = await fetchCommoditiesFromSupabase();
      if (catalogRes?.data && catalogRes.data.length > 0) {
        setCatalogProducts(catalogRes.data);
      } else {
        setCatalogProducts([]);
      }

      // 2. Load MY commodities (data mandiri khusus akun petani yang sedang login)
      // Tanpa ID valid -> kosongkan, jangan pakai seed bersama.
      if (!targetFarmerId) {
        setMyProducts([]);
        return;
      }
      const farmerIdToQuery = targetFarmerId;
      const myRes = await fetchCommoditiesFromSupabase({ farmerId: farmerIdToQuery });
      if (myRes?.data) {
        setMyProducts(myRes.data);
      } else {
        setMyProducts([]);
      }
    } catch (err) {
      console.warn('[FarmerDashboard] Gagal memuat komoditas:', err);
    }
  };

  // Load commodities from Supabase and subscribe to realtime changes
  useEffect(() => {
    let isMounted = true;
    const resolveAndLoad = async () => {
      try {
        const roleStored = localStorage.getItem('agriconnect_auth_user_petani');
        const genericStored = localStorage.getItem('agriconnect_auth_user');
        let authUser = null;
        try {
          const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
          if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'petani')) authUser = parsed;
        } catch (e) {}
        const { data: { user } } = await supabase.auth.getUser();
        const activeUserId = user?.id || authUser?.id || null;

        if (isMounted) {
          setCurrentFarmerId(activeUserId);
          await loadFarmerCommodities(activeUserId);
        }
      } catch (err) {
        console.warn('[FarmerDashboard] Gagal memuat komoditas dari Supabase:', err);
      }
    };

    resolveAndLoad();

    const unsubscribe = subscribeCommodities(() => {
      resolveAndLoad();
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load active procurement proposals for "Cari Penawaran" from Supabase & subscribe realtime
  useEffect(() => {
    let isMounted = true;
    const loadActiveProposals = async () => {
      try {
        const { data } = await fetchActiveProcurementProposalsFromSupabase();
        if (isMounted && data && data.length > 0) {
          const mappedOffers = data.map(mapProposalToOfferItem);
          setBuyerOffers(mappedOffers);
        } else if (isMounted) {
          const { data: allData } = await fetchProcurementProposalsFromSupabase();
          if (allData && allData.length > 0) {
            setBuyerOffers(allData.map(mapProposalToOfferItem));
          }
        }
      } catch (err) {
        console.warn('[FarmerDashboard] Gagal memuat proposal pengadaan aktif dari Supabase:', err);
      }
    };

    loadActiveProposals();

    const unsubscribe = subscribeProcurementProposals(() => {
      loadActiveProposals();
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load real farmer profile from Supabase profiles table
  useEffect(() => {
    let isMounted = true;
    const loadFarmerProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const roleStored = localStorage.getItem('agriconnect_auth_user_petani');
        const genericStored = localStorage.getItem('agriconnect_auth_user');
        const authUser = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
        const { data: { user } } = await supabase.auth.getUser();

        let currentUserId = null;
        if (user?.id) {
          const { data: uProf } = await supabase.from('profiles').select('id, role').eq('id', user.id).maybeSingle();
          if (uProf?.role === 'petani' || user.user_metadata?.role === 'petani') {
            currentUserId = user.id;
          }
        }
        if (!currentUserId && authUser?.id && authUser?.role === 'petani') {
          currentUserId = authUser.id;
        }
        if (!currentUserId) {
          if (isMounted) setIsLoadingProfile(false);
          return;
        }

        setCurrentFarmerId(currentUserId);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();

        const resolvedName = data?.full_name || (user && currentUserId === user.id ? user.user_metadata?.full_name : null) || 'Petani';

        if (isMounted && data) {
          setFarmerProfile(prev => ({
            ...prev,
            id: currentUserId,
            name: resolvedName,
            email: data.email || (user && currentUserId === user.id ? user.email : ''),
            phone: data.phone || prev.phone,
            location: data.location || prev.location,
            address: data.location || prev.address,
            avatar: data.avatar_url || prev.avatar,
            role: 'petani',
            kycStatus: data.kyc_status || prev.kycStatus || 'verified',
            createdAt: data.created_at || (user && currentUserId === user.id ? user.created_at : prev.createdAt) || null
          }));
        }
      } catch (err) {
        console.warn('[FarmerDashboard] Gagal memuat profil petani dari Supabase:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };
    loadFarmerProfile();


    // Subscribe realtime HANYA untuk profil sendiri (filter id) agar edit user lain tidak memicu reload.
    const channelName = `realtime_farmer_profile_${currentFarmerId || 'anon'}_${Date.now()}`;
    const channelFilter = currentFarmerId ? { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${currentFarmerId}` } : { event: '*', schema: 'public', table: 'profiles', filter: 'id=eq.00000000-0000-0000-0000-000000000000' };
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelFilter, () => {
        loadFarmerProfile();
        if (currentFarmerId) {
          loadFarmerCommodities(currentFarmerId);
        }
      })
      .subscribe();

    const handleLocalProfileUpdate = (e) => {
      const updated = e.detail;
      if (updated && (!updated.id || updated.id === currentFarmerId)) {
        loadFarmerProfile();
        if (currentFarmerId) {
          loadFarmerCommodities(currentFarmerId);
        }
      }
    };
    window.addEventListener('agriconnect:profile_updated', handleLocalProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('agriconnect:profile_updated', handleLocalProfileUpdate);
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    };
  }, [currentFarmerId]);

  // Helper agar subtitle role di header HANYA Petani, Pembeli, atau Admin
  const getDisplayRole = (role) => {
    if (!role) return 'Petani';
    const r = String(role).toLowerCase().trim();
    if (r === 'admin') return 'Admin';
    if (r === 'pembeli') return 'Pembeli';
    return 'Petani';
  };

  // Helper logout tersinkronisasi
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
    }
  };

  // Add Product modal trigger state (when user clicks 'Tambah Komoditas')
  const [addProductModalRequested, setAddProductModalRequested] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Real Supabase Notifications
  const {
    notifications: realNotifications,
    unreadCount: notifUnreadCount,
    isLoading: notifLoading,
    error: notifError,
    refresh: refreshNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead
  } = useNotifications(currentFarmerId, 'petani', { limit: 50 });

  // Safe navigation when a notification item is clicked
  const handleNotificationClick = (item) => {
    if (item.related_type === 'offer') {
      handleTabChange('penawaran');
    } else if (item.related_type === 'order') {
      handleTabChange('transaksi');
    } else if (item.related_type === 'commodity') {
      handleTabChange('komoditas-saya');
    } else if (item.related_type === 'proposal') {
      handleTabChange('cari-penawaran');
    } else if (item.related_type === 'bug_report') {
      handleTabChange('laporkan-masalah');
    } else {
      handleTabChange('dashboard');
    }
  };

  // Product CRUD dengan integrasi Supabase
  const handleAddProduct = async (newProduct) => {
    // 1. Resolve active user ID and name directly
    const { data: { user } } = await supabase.auth.getUser();
    const activeUserId = user?.id || currentFarmerId || newProduct.farmerId;
    const activeUserName = farmerProfile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || newProduct.farmerLeader || 'Petani';
    const activeUserGroup = farmerProfile?.groupName || newProduct.farmerGroup || 'Kelompok Tani';

    const productWithFarmer = {
      ...newProduct,
      farmerId: activeUserId,
      farmerLeader: activeUserName,
      farmerName: activeUserName,
      farmerGroup: activeUserGroup
    };

    // Optimistic UI update
    setMyProducts(prev => [productWithFarmer, ...prev]);
    setCatalogProducts(prev => [productWithFarmer, ...prev]);
    setAddProductModalRequested(false);
    try {
      const { data, error } = await createCommodityInSupabase(productWithFarmer, activeUserId);
      if (data) {
        setMyProducts(prev => prev.map(p => p.id === newProduct.id ? data : p));
        setCatalogProducts(prev => prev.map(p => p.id === newProduct.id ? data : p));
      }
      // Re-fetch to ensure exact sync with database for this farmer
      if (activeUserId) {
        await loadFarmerCommodities(activeUserId);
      }
    } catch (err) {
      console.error('[FarmerDashboard] Error saving commodity to Supabase:', err);
    }
  };

  const handleUpdateProduct = async (updatedProduct) => {
    setMyProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setCatalogProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    try {
      await updateCommodityInSupabase(updatedProduct.id, updatedProduct);
    } catch (err) {
      console.error('[FarmerDashboard] Error updating commodity in Supabase:', err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setMyProducts(prev => prev.filter(p => p.id !== productId));
    setCatalogProducts(prev => prev.filter(p => p.id !== productId));
    try {
      await deleteCommodityInSupabase(productId);
    } catch (err) {
      console.error('[FarmerDashboard] Error deleting commodity in Supabase:', err);
    }
  };

  // Offer Actions — alur deal penuh: kunci stok -> offer Disetujui ->
  // proposal Disetujui (hilang dari Cari Penawaran) -> kontrak -> transaksi.
  const handleAcceptOffer = async (offerId, explicitOffer = null, switchTab = true) => {
    const targetOffer = explicitOffer || offers.find(o => o.id === offerId) || buyerOffers.find(o => o.id === offerId);
    if (!targetOffer) return;
    if (!currentFarmerId) {
      window.alert('Identitas petani tidak ditemukan. Silakan login kembali.');
      return;
    }
    const isRealOffer = offers.some(o => o.id === offerId);

    const reqTon = Number(targetOffer.counterTon || targetOffer.requestedTon || (targetOffer.requestedKg ? targetOffer.requestedKg / 1000 : 1));
    const priceKg = Number(targetOffer.counterPricePerKg || targetOffer.offeredPricePerKg || targetOffer.pricePerKg || 0);
    const totalVal = (reqTon * 1000) * priceKg;

    // 1. Resolve komoditas: link eksplisit (UUID) atau cocokkan nama di katalog sendiri.
    const normName = (s) => String(s || '').toLowerCase().trim();
    const isUuidLike = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v || '');
    let commodityId = isUuidLike(targetOffer.commodityId) ? targetOffer.commodityId : null;
    if (!commodityId) {
      // HANYA dari katalog sendiri (myProducts): jangan kunci stok milik petani lain.
      const match = (myProducts || []).find(c => normName(c.name) === normName(targetOffer.commodityName));
      if (match) commodityId = match.id;
    }

    // Optimistic UI
    if (isRealOffer) {
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Disetujui' } : o));
    }

    // Rollback stok idempoten (aman dipanggil walau stok tak jadi dikunci).
    let dealOfferId = offerId;
    const rollbackStock = async () => {
      await ensureStockRestored(dealOfferId);
    };

    try {
      let dealBuyerId = targetOffer.buyerId || null;

      if (isRealOffer) {
        const upd = await updateOfferInSupabase(offerId, { status: 'Disetujui', acceptedAt: new Date().toISOString() });
        if (!upd.data) throw new Error(upd.error || 'Gagal memperbarui penawaran.');
        // Kunci stok (lewati bila reservasi saat offer dibuat masih berlaku).
        const lock = await ensureStockReserved(offerId);
        if (!lock.success) throw lock.error || new Error('Gagal mengunci stok komoditas.');
      } else {
        // Proposal dari Cari Penawaran: buat baris offer real lebih dulu.
        if (!targetOffer.buyerId) {
          throw new Error('Data pembeli proposal tidak lengkap.');
        }
        const created = await createOfferInSupabase({
          buyerId: targetOffer.buyerId,
          farmerId: currentFarmerId,
          commodityId,
          commodityName: targetOffer.commodityName || targetOffer.productName || 'Komoditas',
          requestedTon: reqTon,
          offeredPricePerKg: priceKg,
          listingPricePerKg: targetOffer.listingPricePerKg || priceKg,
          paymentMethod: targetOffer.paymentMethod,
          validUntil: targetOffer.rawValidUntil || targetOffer.validUntil,
          notes: targetOffer.specifications || targetOffer.notes,
          status: 'Disetujui',
          source: 'cari_penawaran',
          isAutoAccepted: false
        });
        if (!created.data) throw new Error(created.error || 'Gagal membuat penawaran.');
        dealOfferId = created.data.id;
        dealBuyerId = created.data.buyerId || targetOffer.buyerId;
        setOffers(prev => [created.data, ...prev]);

        // Tandai proposal Disetujui (hilang dari Cari Penawaran; tampil Diterima di pembeli).
        // BUTUH SQL supabase_deal_flow_status.sql, bila belum dijalankan akan gagal di sini.
        const propKey = targetOffer.proposalDbId || targetOffer.proposalCode || targetOffer.id;
        const propRes = await updateProcurementStatusInSupabase(
          propKey, 'Disetujui', `Disetujui petani ${farmerProfile?.name || ''}.`
        );
        if (!propRes.success) {
          // Rollback: kembalikan stok (createOffer sudah mereservasi) lalu hapus baris;
          // bila DELETE dibatasi RLS, tandai Dibatalkan agar tak jadi hantu.
          await ensureStockRestored(dealOfferId);
          try {
            await supabase.from('offers').delete().eq('id', dealOfferId);
          } catch (e) {}
          setOffers(prev => prev.map(o => o.id === dealOfferId ? { ...o, status: 'Dibatalkan' } : o));
          const msg = String(propRes.error?.message || '');
          if (msg.includes('23514') || msg.toLowerCase().includes('check constraint')) {
            throw new Error("Database menolak status 'Disetujui'. Jalankan dulu SQL supabase_deal_flow_status.sql di SQL Editor.");
          }
          throw propRes.error;
        }
        setBuyerOffers(prev => prev.filter(o => o.id !== offerId));
      }

      // Trigger Notification: Penawaran Diterima ke Pembeli
      notifyOfferAccepted({
        buyerId: dealBuyerId,
        commodityName: targetOffer.commodityName || targetOffer.productName || 'Komoditas',
        offerId: dealOfferId
      }).catch(e => console.warn('Notification offer accepted error:', e));

      const newContract = await createContractInSupabase({
        offerId: dealOfferId,
        commodityId,
        commodityName: targetOffer.commodityName || targetOffer.productName,
        buyerId: dealBuyerId,
        farmerId: currentFarmerId,
        farmerName: farmerProfile.groupName,
        buyerName: targetOffer.buyerName,
        tonnage: reqTon,
        pricePerKg: priceKg,
        totalValue: targetOffer.totalOfferValue || totalVal,
        pickupSchedule: targetOffer.pickupDate,
        pickupLocation: targetOffer.pickupLocation || targetOffer.location || farmerProfile.location,
        paymentMethod: targetOffer.paymentMethod || 'Pembayaran Langsung'
      });
      if (!newContract?.data) throw new Error(newContract?.error || 'Gagal membuat kontrak binding.');
      setBindingAgreements(prev => [newContract.data, ...prev]);

      const newTrx = await createTransactionInSupabase({
        contractId: newContract.data.id,
        buyerId: dealBuyerId,
        farmerId: currentFarmerId,
        farmerGroup: farmerProfile.groupName,
        commodityName: targetOffer.commodityName || targetOffer.productName,
        volumeTon: reqTon,
        category: targetOffer.category,
        amount: targetOffer.totalOfferValue || totalVal,
        status: 'Berjalan',
        pickupSchedule: targetOffer.pickupLocation || targetOffer.location || farmerProfile.location,
        paymentMethod: targetOffer.paymentMethod || 'Pembayaran Langsung',
        notes: JSON.stringify({
          paymentMethod: targetOffer.paymentMethod || 'Pembayaran Langsung',
          notes: targetOffer.notes || ''
        })
      });
      if (!newTrx?.data) throw new Error(newTrx?.error || 'Gagal membuat transaksi.');
      setTransactions(prev => [newTrx.data, ...prev]);

      // Sinkron tampilan stok/katalog
      await loadFarmerCommodities(currentFarmerId);
    } catch (err) {
      console.warn('[FarmerDashboard] Error accepting offer in Supabase:', err);
      await rollbackStock();
      if (isRealOffer) {
        setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Menunggu Respon' } : o));
      }
      window.alert(`Gagal memproses penerimaan: ${err?.message || err}`);
      return;
    }
    if (switchTab) {
      setActiveTab('transaksi');
    }
  };

  const handleRejectOffer = async (offerId, reason = null) => {
    const targetOffer = offers.find(o => o.id === offerId);
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Ditolak', rejectionReason: reason || o.rejectionReason } : o));
    try {
      await updateOfferInSupabase(offerId, { status: 'Ditolak', rejectionReason: reason });
      // Kembalikan reservasi stok bila ada (idempoten; dilewati bila tak pernah dikunci).
      await ensureStockRestored(offerId);

      // Trigger Notification: Penawaran Ditolak ke Pembeli
      notifyOfferRejected({
        buyerId: targetOffer?.buyerId,
        commodityName: targetOffer?.commodityName || targetOffer?.productName || 'Komoditas',
        offerId
      }).catch(e => console.warn('Notification offer rejected error:', e));
    } catch (err) {
      console.warn('[FarmerDashboard] Error rejecting offer in Supabase:', err);
    }
  };

  const handleSubmitCounterOffer = async ({ offerId, counterPrice, counterTon, counterNotes }) => {
    const targetOffer = offers.find(o => o.id === offerId);
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          status: 'Counter-Offer',
          counterPricePerKg: counterPrice,
          counterTon: counterTon,
          counterNotes: counterNotes,
          counterBy: 'petani',
          notes: counterNotes ? `Tawaran Balik Petani: ${counterNotes} (Harga diajukan: Rp ${counterPrice.toLocaleString('id-ID')}/kg, Volume: ${counterTon} Ton)` : (o.notes || '')
        };
      }
      return o;
    }));

    try {
      await updateOfferInSupabase(offerId, {
        status: 'Counter-Offer',
        counterPricePerKg: counterPrice,
        counterTon: counterTon,
        counterNotes: counterNotes,
        counterBy: 'petani'
      });

      // Trigger Notification: Petani Mengajukan Harga Baru ke Pembeli
      notifyOfferCountered({
        buyerId: targetOffer?.buyerId,
        commodityName: targetOffer?.commodityName || targetOffer?.productName || 'Komoditas',
        offerId
      }).catch(e => console.warn('Notification offer countered error:', e));
    } catch (err) {
      console.warn('[FarmerDashboard] Error submitting counter offer in Supabase:', err);
    }
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
      case 'cari-penawaran':
        return 'Cari Penawaran';
      case 'komoditas-saya':
        return 'Komoditas Saya';
      case 'penawaran':
        return 'Penawaran';
      case 'transaksi':
        return 'Transaksi';
      case 'binding':
        return 'Binding Agreement';
      case 'harga-pasar':
        return 'Harga Pasar';
      case 'pesan':
        return 'Pesan';
      case 'laporkan-masalah':
        return 'Laporkan Masalah';
      case 'pengaturan':
        return 'Pengaturan';
      case 'notifikasi':
        return 'Notifikasi';
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
                onClick={() => { handleTabChange('dashboard'); setMobileSidebarOpen(false); }}
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
                  className={`clone-nav-item clone-dropdown-toggle ${(activeTab === 'lihat-komoditas' || activeTab === 'cari-penawaran' || activeTab === 'komoditas-saya') ? 'active-parent' : ''}`}
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
                        onClick={() => { handleTabChange('lihat-komoditas'); setMobileSidebarOpen(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Eye size={13} />
                          <span>Lihat Komoditas</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`clone-subnav-item ${activeTab === 'cari-penawaran' ? 'active' : ''}`}
                        onClick={() => { handleTabChange('cari-penawaran'); setMobileSidebarOpen(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Handshake size={13} />
                          <span>Cari Penawaran</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`clone-subnav-item ${activeTab === 'komoditas-saya' ? 'active' : ''}`}
                        onClick={() => { handleTabChange('komoditas-saya'); setMobileSidebarOpen(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Package size={13} />
                          <span>Komoditas Saya</span>
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
                onClick={() => { handleTabChange('penawaran'); setMobileSidebarOpen(false); }}
                title="Penawaran"
              >
                {activeTab === 'penawaran' && <span className="clone-active-indicator" />}
                <Handshake size={18} weight={activeTab === 'penawaran' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Penawaran</span>
              </button>

              {/* 4. Transaksi */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'transaksi' ? 'active' : ''}`}
                onClick={() => { handleTabChange('transaksi'); setMobileSidebarOpen(false); }}
                title="Transaksi"
              >
                {activeTab === 'transaksi' && <span className="clone-active-indicator" />}
                <Receipt size={18} weight={activeTab === 'transaksi' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Transaksi</span>
              </button>

              {/* 5. Harga Pasar */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'harga-pasar' ? 'active' : ''}`}
                onClick={() => { handleTabChange('harga-pasar'); setMobileSidebarOpen(false); }}
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
                title="Notifikasi"
              >
                {activeTab === 'notifikasi' && <span className="clone-active-indicator" />}
                <Bell size={18} weight={activeTab === 'notifikasi' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Notifikasi</span>
                {notifUnreadCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    borderRadius: '999px',
                    padding: '1px 6px',
                    lineHeight: 1.2
                  }}>
                    {notifUnreadCount}
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

              {/* 2. Laporkan Masalah */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'laporkan-masalah' ? 'active' : ''}`}
                onClick={() => { handleTabChange('laporkan-masalah'); setMobileSidebarOpen(false); }}
                title="Laporkan Masalah"
              >
                {activeTab === 'laporkan-masalah' && <span className="clone-active-indicator" />}
                <Bug size={18} weight={activeTab === 'laporkan-masalah' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Laporkan Masalah</span>
              </button>

              {/* 4. Logout */}
              <button
                type="button"
                className="clone-nav-item clone-logout-item"
                onClick={handleLogout}
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
      <div className={`clone-main-content ${activeTab === 'pesan' ? 'pesan-page-active' : ''}`}>
        
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

            {/* Notification Bell & Real-time Dropdown */}
            <NotificationDropdown 
              isOpen={notifDropdownOpen}
              onToggle={() => setNotifDropdownOpen(!notifDropdownOpen)}
              onClose={() => setNotifDropdownOpen(false)}
              role="petani"
              notifications={realNotifications}
              unreadCount={notifUnreadCount}
              isLoading={notifLoading}
              error={notifError}
              onRefresh={refreshNotifications}
              onMarkAsRead={markNotificationAsRead}
              onMarkAllAsRead={markAllNotificationsAsRead}
              onNotificationClick={handleNotificationClick}
              onViewAll={() => handleTabChange('notifikasi')}
            />

            {/* User Profile Pill with Dropdown */}
            <div style={{ position: 'relative' }}>
              <div 
                className="clone-user-pill" 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                title="Menu Akun"
              >
                <img 
                  src={farmerProfile?.avatar || DEFAULT_AVATAR} 
                  alt={farmerProfile?.name || "Petani"} 
                  className="clone-user-avatar"
                  onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                />
                <div className="clone-user-meta">
                  {isLoadingProfile && !farmerProfile?.name ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="agri-skeleton-pulse" style={{ height: '13px', width: '80px' }} />
                      <span className="agri-skeleton-pulse" style={{ height: '10px', width: '45px' }} />
                    </div>
                  ) : (
                    <>
                      <div className="clone-user-name">{farmerProfile?.name || 'Petani'}</div>
                      <div className="clone-user-role" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>{getDisplayRole(farmerProfile?.role)}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '3px', 
                            color: '#b45309', 
                            fontWeight: 700, 
                            fontSize: '0.72rem' 
                          }}
                          title={`Rating ${farmerRating.average.toFixed(1)} dari ${farmerRating.totalCount} pembeli`}
                        >
                          <Star size={11} weight="fill" color="#f59e0b" />
                          <span>{farmerRating.average.toFixed(1)}</span>
                          <span style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 500 }}>
                            ({farmerRating.totalCount})
                          </span>
                        </span>
                      </div>
                    </>
                  )}
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
                      <div className="clone-dropdown-name">{farmerProfile?.name || 'Petani'}</div>
                      <span className="clone-dropdown-role">{getDisplayRole(farmerProfile?.role)}</span>
                    </div>

                    <div className="clone-profile-dropdown-divider" />

                    {/* 1. Profil Saya */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item"
                      onClick={() => {
                        setSettingsInitialTab('edit-profile');
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

                    {/* 3. Review Saya (khusus petani, di bawah Komoditas Saya) */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item"
                      onClick={() => {
                        setSettingsInitialTab('review');
                        setActiveTab('pengaturan');
                        setProfileMenuOpen(false);
                      }}
                    >
                      <Star size={16} weight="regular" className="clone-dropdown-item-icon" />
                      <span>Review Saya</span>
                    </button>

                    <div className="clone-profile-dropdown-divider" />

                    {/* 4. Keluar */}
                    <button
                      type="button"
                      className="clone-profile-dropdown-item danger"
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

        {/* Dynamic Main Body Content */}
        <div className={`clone-page-body ${activeTab === 'pesan' ? 'pesan-active-body' : ''}`}>
          
          {/* TAB 1: CLONE DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <RingkasanPetani 
              onAddProduct={() => {
                setActiveTab('komoditas-saya');
                setAddProductModalRequested(true);
              }}
              onNavigate={(tab) => setActiveTab(tab)}
              marketPrices={marketPrices}
              offers={offers}
              transactions={transactions}
              products={myProducts}
              farmerProfile={farmerProfile}
              isLoading={isLoadingData}
              isLoadingProfile={isLoadingProfile}
            />
          )}

          {/* TAB 2: LIHAT KOMODITAS (KATALOG SEPERTI CARI KOMODITAS PEMBELI, TANPA TOMBOL TAMBAH) */}
          {activeTab === 'lihat-komoditas' && (
            <CariKomoditas 
              commodities={catalogProducts.filter(p => p.status === 'Aktif' || p.status === 'Tersedia' || p.status === 'Disetujui')}
              isFarmerView={true}
              isLoading={isLoadingData}
              title="Lihat Komoditas"
              subtitle="Jelajahi seluruh komoditas hasil panen yang terdaftar di pasar grosir Minahasa. Pantau ketersediaan pasokan komoditas pangan dari sesama kelompok tani untuk referensi harga pasar dan estimasi pasokan daerah."
            />
          )}

          {/* TAB 3: CARI PENAWARAN (MIRIP LIHAT PENAWARAN PEMBELI) */}
          {activeTab === 'cari-penawaran' && (
            <LihatPenawaran 
              offers={buyerOffers}
              isFarmerView={true}
              isLoading={isLoadingData}
              title="Cari Penawaran"
              subtitle="Telusuri seluruh proposal penawaran kebutuhan komoditas yang diajukan oleh pembeli grosir kepada kelompok tani di Minahasa. Tanggapi tawaran dengan menyetujui, menolak, atau mengajukan negosiasi harga dan tonase alternatif."
              onAcceptCounterOffer={(offerId, offerData) => {
                setBuyerOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Disetujui' } : o));
                handleAcceptOffer(offerId, offerData);
              }}
              onCancelOffer={(offerId) => {
                setBuyerOffers(prev => prev.filter(o => o.id !== offerId));
              }}
              onProceedToBinding={() => setActiveTab('transaksi')}
            />
          )}

          {/* TAB 4: KOMODITAS SAYA (DATA MANDIRI KHUSUS PETANI INI) */}
          {activeTab === 'komoditas-saya' && (
            <KomoditasSaya 
              products={myProducts}
              farmerProfile={farmerProfile}
              isLoading={isLoadingData}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              initialModalOpen={addProductModalRequested}
              onModalClose={() => setAddProductModalRequested(false)}
            />
          )}

          {/* TAB 4: PENAWARAN */}
          {activeTab === 'penawaran' && (
            <PenawaranPetani 
              offers={offers}
              isLoading={isLoadingData}
              onAcceptOffer={(id, data) => handleAcceptOffer(id, data, true)}
              onRejectOffer={handleRejectOffer}
              onCounterOffer={handleSubmitCounterOffer}
              onDeleteOffer={(deletedIds) => {
                const idSet = new Set((Array.isArray(deletedIds) ? deletedIds : [deletedIds]).map(String));
                setOffers(prev => prev.filter(o => !idSet.has(String(o.id))));
              }}
              currentFarmerId={currentFarmerId}
              farmerProfile={farmerProfile}
              commodities={myProducts}
              onProceedToBinding={() => setActiveTab('transaksi')}
              onRefreshOffers={loadDeals}
            />
          )}

          {/* TAB 5: HARGA PASAR */}
          {activeTab === 'harga-pasar' && (
            <HargaPasarPetani 
              marketPrices={marketPrices}
            />
          )}

          {/* TAB 6: PESAN */}
          {activeTab === 'pesan' && (
            <PesanPetani 
              currentUserId={currentFarmerId}
              currentUserProfile={farmerProfile}
            />
          )}

          {/* TAB 7: PENGATURAN */}
          {activeTab === 'pengaturan' && (
            <PengaturanPetani 
              profile={farmerProfile}
              initialTab={settingsInitialTab}
              onUpdateProfile={(updated) => setFarmerProfile(updated)}
              onLogout={handleLogout}
            />
          )}

          {/* TAB 8: TRANSAKSI */}
          {activeTab === 'transaksi' && (
            <RiwayatTransaksiPetani 
              transactions={transactions}
              isLoading={isLoadingData}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB 9: LAPORKAN MASALAH */}
          {activeTab === 'laporkan-masalah' && (
            <LaporkanMasalah 
              userRole="petani"
              onBack={() => handleTabChange('dashboard')}
            />
          )}

          {/* TAB 10: SEMUA NOTIFIKASI REAL-TIME */}
          {activeTab === 'notifikasi' && (
            <NotificationPage 
              role="petani"
              notifications={realNotifications}
              isLoading={notifLoading}
              error={notifError}
              unreadCount={notifUnreadCount}
              onRefresh={refreshNotifications}
              onMarkAsRead={markNotificationAsRead}
              onMarkAllAsRead={markAllNotificationsAsRead}
              onNotificationClick={handleNotificationClick}
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
