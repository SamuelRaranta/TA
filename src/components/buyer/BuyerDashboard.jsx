import React, { useState, useEffect, useRef } from 'react';
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
  CreditCard,
  ClockCounterClockwise
} from '@phosphor-icons/react';

import { fetchMarketPricesFromSupabase, subscribeMarketPrices } from '../../lib/marketPriceService';
import { fetchCommoditiesFromSupabase, subscribeCommodities } from '../../lib/commodityService';
import { 
  fetchProcurementProposalsFromSupabase, 
  subscribeProcurementProposals, 
  mapProposalToOfferItem 
} from '../../lib/procurementService';
import {
  fetchOffersFromSupabase,
  fetchContractsFromSupabase,
  fetchTransactionsFromSupabase,
  createOfferInSupabase,
  createContractInSupabase,
  createTransactionInSupabase,
  ensureStockReserved,
  ensureStockRestored,
  updateOfferInSupabase,
  subscribeOffers,
  subscribeContracts,
  subscribeTransactions
} from '../../lib/dealService';
import { 
  notifyOfferCounteredByBuyer, 
  notifyOfferAcceptedToFarmer 
} from '../../lib/notificationService';
import { supabase } from '../../lib/supabaseClient';

import RingkasanPembeli from './RingkasanPembeli';
import CariKomoditas from './CariKomoditas';
import LihatPenawaran from './LihatPenawaran';
import RiwayatPengadaanPembeli from './RiwayatPengadaanPembeli';
import HargaPasarPembeli from './HargaPasarPembeli';
import PembayaranPembeli from './PembayaranPembeli';
import RiwayatTransaksiPembeli from './RiwayatTransaksiPembeli';
import PesanPembeli from './PesanPembeli';
import PengaturanPembeli from './PengaturanPembeli';
import AjukanPenawaran from './AjukanPenawaran';
import LaporkanMasalah from '../common/LaporkanMasalah';
import NotificationDropdown from '../common/NotificationDropdown';
import NotificationPage from '../common/NotificationPage';
import AppDownloadPromoCard from '../common/AppDownloadPromoCard';
import { useNotifications } from '../../lib/useNotifications';

// Route mapping for Buyer sub-pages
const BUYER_TAB_TO_ROUTE = {
  dashboard: '#/pembeli/dashboard',
  katalog: '#/pembeli/cari-komoditas',
  penawaran: '#/pembeli/lihat-penawaran',
  'ajukan-penawaran': '#/pembeli/ajukan-penawaran',
  watchlist: '#/pembeli/watchlist',
  rfq: '#/pembeli/rfq',
  transaksi: '#/pembeli/daftar-penawaran',
  binding: '#/pembeli/pembayaran',
  'harga-pasar': '#/pembeli/harga-pasar',
  pembayaran: '#/pembeli/pembayaran',
  'riwayat-transaksi': '#/pembeli/riwayat-transaksi',
  pesan: '#/pembeli/pesan',
  'laporkan-masalah': '#/pembeli/laporkan-masalah',
  pengaturan: '#/pembeli/pengaturan',
  notifikasi: '#/pembeli/notifikasi'
};

const getBuyerTabFromHash = () => {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('notifikasi') || hash.includes('notifications')) return 'notifikasi';
  if (hash.includes('cari-komoditas') || hash.includes('katalog')) return 'katalog';
  if (hash.includes('lihat-penawaran')) return 'penawaran';
  if (hash.includes('ajukan-penawaran') || hash.includes('tambah-penawaran')) return 'ajukan-penawaran';
  if (hash.includes('watchlist')) return 'watchlist';
  if (hash.includes('rfq')) return 'rfq';
  if (hash.includes('binding') || hash.includes('kontrak')) return 'pembayaran';
  if (hash.includes('riwayat-transaksi')) return 'riwayat-transaksi';
  if (hash.includes('daftar-penawaran') || hash.includes('transaksi') || hash.includes('pengadaan')) return 'transaksi';
  if (hash.includes('harga-pasar') || hash.includes('hargapasar')) return 'harga-pasar';
  if (hash.includes('pembayaran')) return 'pembayaran';
  if (hash.includes('pesan') || hash.includes('chat')) return 'pesan';
  if (hash.includes('laporkan-masalah') || hash.includes('laporan-bug') || hash.includes('laporan') || hash.includes('masalah')) return 'laporkan-masalah';
  if (hash.includes('pengaturan') || hash.includes('settings')) return 'pengaturan';
  return 'dashboard';
};

export default function BuyerDashboard({ 
  onBackToHome, 
  theme, 
  onToggleTheme 
}) {
  // Navigation active tab with deep-linking support
  const [activeTab, setActiveTab] = useState(() => getBuyerTabFromHash());
  
  // Switch tab AND update browser URL hash for deep linking
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const targetRoute = BUYER_TAB_TO_ROUTE[newTab] || `#/pembeli/${newTab}`;
    if (window.location.hash !== targetRoute) {
      window.location.hash = targetRoute;
    }
  };

  // Sync with browser back/forward buttons or direct URL change
  useEffect(() => {
    const onHashChange = () => {
      const tab = getBuyerTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Accordion state for 'Eksplorasi Komoditas' dropdown in sidebar (default tertutup saat login)
  const [komoditasDropdownOpen, setKomoditasDropdownOpen] = useState(() => {
    const initialTab = getBuyerTabFromHash();
    return ['katalog', 'penawaran', 'ajukan-penawaran', 'watchlist', 'rfq'].includes(initialTab);
  });

  // Buka accordion otomatis jika user berpindah ke salah satu sub-halaman komoditas
  useEffect(() => {
    if (['katalog', 'penawaran', 'ajukan-penawaran', 'watchlist', 'rfq'].includes(activeTab)) {
      setKomoditasDropdownOpen(true);
    }
  }, [activeTab]);

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

  // Core Data States (Real Supabase Data Only - No Mock Fallbacks)
  const [buyerProfile, setBuyerProfile] = useState(() => {
    try {
      const roleStored = localStorage.getItem('agriconnect_auth_user_pembeli');
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
      if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'pembeli')) {
        return {
          id: parsed.id,
          name: parsed.fullName || parsed.name || '',
          email: parsed.email || '',
          role: 'pembeli',
          phone: parsed.phone || '',
          location: parsed.location || 'Minahasa, Sulawesi Utara',
          address: parsed.location || 'Minahasa, Sulawesi Utara',
          avatar: parsed.avatar || '',
          kycStatus: parsed.kyc_status || parsed.kycStatus || 'verified',
          createdAt: parsed.created_at || parsed.createdAt || null
        };
      }
    } catch (e) {}
    return {
      id: null,
      name: '',
      email: '',
      role: 'pembeli',
      phone: '',
      location: 'Minahasa, Sulawesi Utara',
      address: 'Minahasa, Sulawesi Utara',
      avatar: '',
      kycStatus: 'verified',
      createdAt: null
    };
  });
  const [currentBuyerId, setCurrentBuyerId] = useState(() => {
    try {
      const roleStored = localStorage.getItem('agriconnect_auth_user_pembeli');
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
      if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'pembeli')) return parsed.id;
    } catch (err) {}
    return null;
  });
  const [commodities, setCommodities] = useState([]);
  const [offers, setOffers] = useState([]);
  const [bindingAgreements, setBindingAgreements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [proposals, setProposals] = useState([]);

  // Ganti user -> kosongkan daftar milik user lama DULU agar tidak tampil data basi.
  const lastBuyerRef = useRef(currentBuyerId);
  useEffect(() => {
    if (lastBuyerRef.current !== currentBuyerId) {
      lastBuyerRef.current = currentBuyerId;
      setProposals([]);
      setOffers([]);
      setBindingAgreements([]);
      setTransactions([]);
      setPayments([]);
    }
  }, [currentBuyerId]);

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
        console.warn('[BuyerDashboard] Gagal memuat harga pasar dari Supabase:', err);
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

  // Load commodities from Supabase and subscribe to realtime changes
  useEffect(() => {
    let isMounted = true;
    const loadCommodities = async () => {
      try {
        const { data } = await fetchCommoditiesFromSupabase();
        if (isMounted && data && data.length > 0) {
          setCommodities(data);
        }
      } catch (err) {
        console.warn('[BuyerDashboard] Gagal memuat komoditas dari Supabase:', err);
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

  // Load authoritative buyer data (proposals, offers, binding agreements, transactions, payments)
  const loadBuyerData = async (targetBuyerId) => {
    if (!targetBuyerId) {
      setProposals([]);
      setOffers([]);
      setBindingAgreements([]);
      setTransactions([]);
      setPayments([]);
      return;
    }
    try {
      const [proposalsRes, offersRes, contractsRes, trxsRes] = await Promise.all([
        fetchProcurementProposalsFromSupabase({ buyerId: targetBuyerId }),
        fetchOffersFromSupabase({ buyerId: targetBuyerId }),
        fetchContractsFromSupabase({ buyerId: targetBuyerId }),
        fetchTransactionsFromSupabase({ buyerId: targetBuyerId })
      ]);

      const freshProposals = proposalsRes?.data || [];
      setProposals(freshProposals);

      const dbOffers = offersRes?.data || [];
      const mappedProposalOffers = freshProposals
        .map(mapProposalToOfferItem)
        .filter(p => p.status === 'Aktif' || p.status === 'Disetujui');

      // Combine only fresh database offers + fresh proposal offers, avoiding duplicates
      const dbOfferIds = new Set(dbOffers.map(o => o.id));
      const nonDuplicateProposalOffers = mappedProposalOffers.filter(p => !dbOfferIds.has(p.id));
      setOffers([...dbOffers, ...nonDuplicateProposalOffers]);

      setBindingAgreements(contractsRes?.data || []);

      const freshTrxs = trxsRes?.data || [];
      setTransactions(freshTrxs);

      // Map transactions to payments format for PembayaranPembeli
      const freshContractsList = contractsRes?.data || [];
      const mappedPayments = freshTrxs.map((trx, idx) => {
        // Metode dari notes JSON bila ada, atau dari trx / kontrak terkait
        let methodFromNotes = null;
        let isMidtransPaid = false;
        let midtransPaidAt = null;
        let midtransRef = null;

        try {
          const rawNotes = trx.notes;
          const parsedNotes = typeof rawNotes === 'string' && rawNotes.trim().startsWith('{')
            ? JSON.parse(rawNotes)
            : (rawNotes && typeof rawNotes === 'object' ? rawNotes : null);
          if (parsedNotes?.paymentMethod) methodFromNotes = parsedNotes.paymentMethod;
          if (parsedNotes?.paymentStatus === 'paid') {
            isMidtransPaid = true;
            midtransPaidAt = parsedNotes.paidAt || null;
            midtransRef = parsedNotes.midtransOrderId || null;
          }
        } catch (e) {}

        const matchingContract = trx.contract || (trx.contractId ? freshContractsList.find(c => c.id === trx.contractId) : null);
        const resolvedMethod = methodFromNotes 
          || trx.paymentMethod 
          || trx.method 
          || matchingContract?.payment_method 
          || matchingContract?.paymentMethod 
          || 'Pembayaran Langsung';

        return {
          id: trx.id,
          contractId: trx.contractId || null,
          invoiceNumber: `INV-${String(trx.id).replace(/dummy[-_ ]?/gi, '').replace(/[^A-Z0-9]/gi, '').slice(0, 12)}`,
          commodity: trx.productName || trx.commodityName,
          category: trx.category || 'Perkebunan',
          farmerGroup: trx.farmerName || trx.farmerGroup || 'Kelompok Tani',
          farmerName: trx.farmerName || trx.farmerGroup || 'Kelompok Tani',
          farmerAvatar: trx.farmerAvatar || null,
          volume: `${trx.volumeTon || 1} Ton`,
          amount: trx.amount || 0,
          status: trx.status === 'Selesai' 
            ? 'Selesai' 
            : (trx.status === 'Dibatalkan' ? 'Dibatalkan' : 'Berjalan'),
          goodsStatus: trx.goodsStatus || (trx.status === 'Selesai' ? 'diterima' : 'belum_diterima'),
          receivedAt: trx.receivedAt || null,
          date: trx.date,
          createdAt: trx.createdAt || null,
          buyerId: trx.buyerId || null,
          farmerId: trx.farmerId || null,
          accountNumber: `8809-08${idx}1-2294-001`,
          bankName: 'Bank Mandiri (Platform Escrow AgriConnect)',
          method: resolvedMethod,
          paidDate: isMidtransPaid
            ? (midtransPaidAt ? new Date(midtransPaidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Terverifikasi')
            : (trx.status === 'Selesai' || trx.goodsStatus === 'diterima' ? 'Lunas' : null),
          referenceNumber: midtransRef || (['Pembayaran Berhasil', 'Selesai', 'Lunas'].includes(trx.status) ? `REF/ESC-${idx}` : null),
          paymentStatus: isMidtransPaid ? 'paid' : 'pending',
          paymentType: trx.paymentType || (['Berjalan', 'DP Terkunci'].includes(trx.status) ? 'DP Booking Fee (5%)' : 'Pelunasan Timbang Muat')
        };
      });
      setPayments(mappedPayments);
    } catch (err) {
      console.warn('[BuyerDashboard] Gagal memuat data pembeli dari Supabase:', err);
    }
  };

  // Load proposals & deals from Supabase & keep synced
  useEffect(() => {
    let isMounted = true;
    const resolveAndLoad = async () => {
      setIsLoadingData(true);
      try {
        const roleStored = localStorage.getItem('agriconnect_auth_user_pembeli');
        const genericStored = localStorage.getItem('agriconnect_auth_user');
        let authUser = null;
        try {
          const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
          if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'pembeli')) authUser = parsed;
        } catch (e) {}
        const { data: { user } } = await supabase.auth.getUser();
        const activeUserId = user?.id || authUser?.id || null;

        if (isMounted) {
          if (activeUserId) setCurrentBuyerId(activeUserId);
          if (!activeUserId) {
            setIsLoadingData(false);
            return;
          }
          await loadBuyerData(activeUserId);
        }
      } catch (err) {
        console.warn('[BuyerDashboard] Error resolving buyer user:', err);
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    resolveAndLoad();

    const unsubProposals = subscribeProcurementProposals(() => {
      if (currentBuyerId) loadBuyerData(currentBuyerId);
    });
    const unsubOffers = subscribeOffers(() => {
      if (currentBuyerId) loadBuyerData(currentBuyerId);
    });
    const unsubContracts = subscribeContracts(() => {
      if (currentBuyerId) loadBuyerData(currentBuyerId);
    });
    const unsubTrxs = subscribeTransactions(() => {
      if (currentBuyerId) loadBuyerData(currentBuyerId);
    });
    const unsubPaymentChannel = supabase
      .channel(`realtime_buyer_payment_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment' }, () => {
        if (currentBuyerId) loadBuyerData(currentBuyerId);
      })
      .subscribe();
    const unsubProfilesChannel = supabase
      .channel(`realtime_buyer_profiles_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        if (currentBuyerId) loadBuyerData(currentBuyerId);
      })
      .subscribe();

    const handleCustomRefresh = () => {
      if (currentBuyerId) loadBuyerData(currentBuyerId);
    };
    window.addEventListener('agriconnect:refresh-transactions', handleCustomRefresh);

    return () => {
      isMounted = false;
      if (unsubProposals) unsubProposals();
      if (unsubOffers) unsubOffers();
      if (unsubContracts) unsubContracts();
      if (unsubTrxs) unsubTrxs();
      try {
        supabase.removeChannel(unsubProfilesChannel);
        supabase.removeChannel(unsubPaymentChannel);
      } catch (e) {}
      window.removeEventListener('agriconnect:refresh-transactions', handleCustomRefresh);
    };
  }, [currentBuyerId]);

  // Load real buyer profile from Supabase profiles table
  useEffect(() => {
    let isMounted = true;
    const loadBuyerProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const roleStored = localStorage.getItem('agriconnect_auth_user_pembeli');
        const genericStored = localStorage.getItem('agriconnect_auth_user');
        let authUser = null;
        try {
          const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
          if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'pembeli')) authUser = parsed;
        } catch (e) {}
        const { data: { user } } = await supabase.auth.getUser();
        let currentUserId = user?.id || authUser?.id || currentBuyerId || null;
        // Validasi role dari DB: hanya lanjut jika role=pembeli (cegah petani/admin terbaca sebagai pembeli)
        if (user?.id && !authUser) {
          try {
            const { data: uProf } = await supabase.from('profiles').select('id, role').eq('id', user.id).maybeSingle();
            if (uProf && uProf.role && String(uProf.role).toLowerCase() !== 'pembeli') {
              setIsLoadingProfile(false);
              return;
            }
          } catch (e) {}
        }
        if (!currentUserId) {
          setIsLoadingProfile(false);
          return;
        }

        if (currentUserId) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUserId)
            .maybeSingle();

          if (isMounted && data) {
            setBuyerProfile(prev => ({
              ...prev,
              id: currentUserId,
              name: data.full_name || prev.name,
              email: data.email || user?.email || authUser?.email || prev.email,
              phone: data.phone || prev.phone,
              location: data.location || prev.location,
              warehouseAddress: data.location || prev.warehouseAddress,
              avatar: data.avatar_url || prev.avatar,
              role: data.role || 'pembeli',
              kycStatus: data.kyc_status || prev.kycStatus || 'verified',
              createdAt: data.created_at || user?.created_at || prev.createdAt || null
            }));
          }
        }
      } catch (err) {
        console.warn('[BuyerDashboard] Gagal memuat profil pembeli dari Supabase:', err);
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadBuyerProfile();

    // Subscribe realtime HANYA untuk profil sendiri agar edit user lain tidak bocor.
    const channelName = `realtime_buyer_profile_${currentBuyerId || 'anon'}`;
    const channelFilter = currentBuyerId ? { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${currentBuyerId}` } : { event: '*', schema: 'public', table: 'profiles', filter: 'id=eq.00000000-0000-0000-0000-000000000000' };
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelFilter, () => {
        loadBuyerProfile();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentBuyerId]);

  // Helper agar subtitle role di header HANYA Petani, Pembeli, atau Admin
  const getDisplayRole = (role) => {
    if (!role) return 'Pembeli';
    const r = String(role).toLowerCase().trim();
    if (r === 'admin') return 'Admin';
    if (r === 'petani') return 'Petani';
    return 'Pembeli';
  };

  // Helper logout tersinkronisasi
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
    localStorage.removeItem('agriconnect_auth_user');
    localStorage.removeItem('agriconnect_auth_user_pembeli');
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.hash = '';
    }
  };

  // Add Offer state (when user clicks 'Ajukan Penawaran' or 'Tawar & Beli')
  const [selectedOfferCommodity, setSelectedOfferCommodity] = useState(null);
  const [addOfferModalRequested, setAddOfferModalRequested] = useState(false);

  // Real Supabase Notifications
  const {
    notifications: realNotifications,
    unreadCount: notifUnreadCount,
    isLoading: notifLoading,
    error: notifError,
    refresh: refreshNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead
  } = useNotifications(currentBuyerId, 'pembeli', { limit: 50 });

  // Safe navigation when a notification item is clicked
  const handleNotificationClick = (item) => {
    if (item.related_type === 'order' || item.related_type === 'payment') {
      handleTabChange('pembayaran');
    } else if (item.related_type === 'offer') {
      handleTabChange('penawaran');
    } else if (item.related_type === 'proposal') {
      handleTabChange('transaksi');
    } else if (item.related_type === 'commodity') {
      handleTabChange('katalog');
    } else if (item.related_type === 'bug_report') {
      handleTabChange('laporkan-masalah');
    } else {
      handleTabChange('dashboard');
    }
  };

  // Handle Offer Submission from Catalog (Connected to Supabase)
  // Return true bila tersimpan (stok ikut terreservasi), false bila gagal.
  const handleAddNewOffer = async (newOffer) => {
    setOffers(prev => [newOffer, ...prev]);
    try {
      // farmerId wajib agar penawaran muncul di halaman Penawaran petani.
      let farmerId = newOffer.farmerId || null;
      if (!farmerId && newOffer.commodityId) {
        const match = (commodities || []).find(c => c.id === newOffer.commodityId);
        if (match) farmerId = match.farmerId || null;
      }
      const { data, error } = await createOfferInSupabase({
        buyerId: currentBuyerId,
        commodityId: newOffer.commodityId,
        commodityName: newOffer.commodityName,
        farmerId,
        farmerGroup: newOffer.farmerGroup,
        farmerLeader: newOffer.farmerLeader,
        requestedTon: newOffer.requestedTon,
        offeredPricePerKg: newOffer.offeredPricePerKg,
        listingPricePerKg: newOffer.listingPricePerKg,
        paymentMethod: newOffer.paymentMethod,
        validUntil: newOffer.validUntil,
        notes: newOffer.notes,
        status: 'Menunggu Respon'
      });
      if (!data) throw error || new Error('Gagal mengajukan penawaran.');
      setOffers(prev => prev.map(o => o.id === newOffer.id ? { ...newOffer, ...data } : o));
      return true;
    } catch (err) {
      console.warn('Gagal mengajukan penawaran ke Supabase:', err);
      setOffers(prev => prev.filter(o => o.id !== newOffer.id));
      window.alert(`Gagal mengajukan penawaran: ${err?.message || err}`);
      return false;
    }
  };

  // Handle Counter Offer Acceptance — deal ditutup: kunci stok + kontrak + transaksi.
  const handleAcceptCounterOffer = async (offerId) => {
    const targetOffer = offers.find(o => o.id === offerId);
    if (!targetOffer) return;

    const acceptedPrice = targetOffer.counterPricePerKg || targetOffer.offeredPricePerKg;
    const acceptedTon = targetOffer.counterTon || targetOffer.requestedTon;
    const totalVal = (acceptedTon * 1000) * acceptedPrice;

    // Resolve komoditas untuk kontrak (stok dikunci via ensure di bawah).
    const normName = (s) => String(s || '').toLowerCase().trim();
    const isUuidLikeLocal = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v || '');
    let commodityId = isUuidLikeLocal(targetOffer.commodityId) ? targetOffer.commodityId : null;
    if (!commodityId && targetOffer.commodityName) {
      const match = (commodities || []).find(c => normName(c.name) === normName(targetOffer.commodityName));
      if (match) commodityId = match.id;
    }

    try {
      // Simpan angka deal dulu agar penguncian memakai tonase final.
      await updateOfferInSupabase(offerId, {
        counterPricePerKg: acceptedPrice,
        counterTon: acceptedTon
      });
      // Kunci stok idempoten (lewati bila reservasi saat penawaran masih berlaku).
      const lock = await ensureStockReserved(offerId);
      if (!lock.success) {
        window.alert(lock.error?.message || 'Gagal mengunci stok komoditas.');
        return;
      }
      await updateOfferInSupabase(offerId, { status: 'Disetujui' });

      const contractPayload = {
        contractCode: `AC-AGR/2026/IX/00${bindingAgreements.length + 60}`,
        offerId: targetOffer.id,
        commodityId,
        productName: targetOffer.commodityName,
        farmerId: targetOffer.farmerId,
        farmerName: targetOffer.farmerGroup,
        buyerId: currentBuyerId,
        buyerName: buyerProfile.companyName || buyerProfile.name,
        tonnage: acceptedTon,
        pricePerKg: acceptedPrice,
        totalValue: totalVal,
        bookingFee: totalVal * 0.05,
        pickupSchedule: targetOffer.pickupDate || '7 Hari ke Depan',
        pickupLocation: targetOffer.pickupLocation || 'Minahasa',
        paymentMethod: targetOffer.paymentMethod || 'Pembayaran Langsung'
      };

      const { data: newContract, error: contractError } = await createContractInSupabase(contractPayload);
      if (!newContract) throw new Error(contractError || 'Gagal membuat kontrak binding.');
      setBindingAgreements(prev => [newContract, ...prev]);

      const newTrx = await createTransactionInSupabase({
        contractId: newContract.id,
        buyerId: currentBuyerId,
        farmerId: targetOffer.farmerId,
        farmerGroup: targetOffer.farmerGroup,
        commodityName: targetOffer.commodityName,
        volumeTon: acceptedTon,
        category: targetOffer.category,
        amount: totalVal,
        status: 'Berjalan',
        pickupSchedule: targetOffer.pickupLocation || 'Minahasa',
        paymentMethod: targetOffer.paymentMethod || 'Pembayaran Langsung',
        notes: JSON.stringify({
          paymentMethod: targetOffer.paymentMethod || 'Pembayaran Langsung',
          notes: targetOffer.notes || ''
        })
      });
      if (!newTrx?.data) throw new Error(newTrx?.error || 'Gagal membuat transaksi.');
      setTransactions(prev => [newTrx.data, ...prev]);

      notifyOfferAcceptedToFarmer({
        farmerId: targetOffer.farmerId,
        commodityName: targetOffer.commodityName || 'Komoditas',
        offerId
      }).catch(e => console.warn('notifyOfferAcceptedToFarmer error:', e));

      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Disetujui', offeredPricePerKg: acceptedPrice, requestedTon: acceptedTon, commodityId } : o));
      setActiveTab('pembayaran');
    } catch (err) {
      console.warn('Gagal memproses persetujuan penawaran:', err);
      await ensureStockRestored(offerId);
      window.alert(`Gagal memproses persetujuan: ${err?.message || err}`);
    }
  };

  // Handle Buyer Counter Negotiation (Connected to Supabase)
  const handleSubmitBuyerCounter = async ({ offerId, newPrice, newTon, notes }) => {
    const targetOffer = offers.find(o => o.id === offerId);
    try {
      await updateOfferInSupabase(offerId, {
        status: 'Counter-Offer',
        counterPricePerKg: newPrice,
        counterTon: newTon,
        counterNotes: notes || '',
        counterBy: 'pembeli'
      });
      setOffers(prev => prev.map(o => {
        if (o.id === offerId) {
          return {
            ...o,
            status: 'Counter-Offer',
            counterPricePerKg: newPrice,
            counterTon: newTon,
            counterNotes: notes || '',
            counterBy: 'pembeli',
            notes: notes ? `Tawaran Balik Pembeli: ${notes} (Harga: Rp ${Number(newPrice).toLocaleString('id-ID')}/kg, Volume: ${newTon} Ton)` : (o.notes || '')
          };
        }
        return o;
      }));

      notifyOfferCounteredByBuyer({
        farmerId: targetOffer?.farmerId,
        commodityName: targetOffer?.commodityName || 'Komoditas',
        offerId
      }).catch(e => console.warn('notifyOfferCounteredByBuyer error:', e));
    } catch (err) {
      console.warn('Gagal mengirim counter offer:', err);
    }
  };

  // Cancel / Delete Offer — batalkan transaksi terkait (kecuali lunas),
  // kembalikan reservasi stok, lalu tandai offer Dibatalkan.
  const handleCancelOffer = async (offerId) => {
    const targetOffer = offers.find(o => o.id === offerId);
    try {
      // 1. Transaksi terkait: tolak bila sudah lunas, batalkan sisanya.
      try {
        const { data: linkedContracts } = await supabase
          .from('contracts')
          .select('id')
          .eq('offer_id', offerId);
        const cIds = (linkedContracts || []).map(c => c.id);
        if (cIds.length > 0) {
          const { data: linkedTrxs } = await supabase
            .from('transactions')
            .select('id, status')
            .in('contract_id', cIds);
          if ((linkedTrxs || []).some(t => t.status === 'Selesai')) {
            window.alert('Penawaran ini sudah lunas dan tidak dapat dibatalkan.');
            return;
          }
          for (const t of (linkedTrxs || [])) {
            if (t.status !== 'Dibatalkan') {
              await supabase.from('transactions').update({ status: 'Dibatalkan' }).eq('id', t.id);
            }
          }
          try {
            await supabase.from('contracts').update({ status: 'Dibatalkan' }).in('id', cIds);
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Gagal membatalkan transaksi terkait:', e);
      }
      // 2. Offer + stok (idempoten: lewati bila tak pernah dikunci).
      await updateOfferInSupabase(offerId, { status: 'Dibatalkan' });
      if (targetOffer) await ensureStockRestored(offerId);
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Dibatalkan' } : o));
    } catch (err) {
      console.warn('Gagal membatalkan penawaran:', err);
    }
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
        return 'Transaksi';
      case 'katalog':
        return 'Cari Komoditas';
      case 'watchlist':
        return 'Komoditas Dipantau';
      case 'rfq':
        return 'Permintaan Pasokan (RFQ)';
      case 'penawaran':
        return 'Lihat Penawaran';
      case 'transaksi':
        return 'Daftar Penawaran';
      case 'riwayat-transaksi':
        return 'Transaksi';
      case 'harga-pasar':
        return 'Harga Acuan Pasar';
      case 'pembayaran':
        return 'Pembayaran';
      case 'pesan':
        return 'Pesan & Negosiasi';
      case 'laporkan-masalah':
        return 'Laporkan Masalah';
      case 'pengaturan':
        return 'Pengaturan';
      case 'notifikasi':
        return 'Notifikasi';
      default:
        return 'Transaksi';
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
                onClick={() => { handleTabChange('dashboard'); setMobileSidebarOpen(false); }}
                title="Transaksi"
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
                        onClick={() => { handleTabChange('katalog'); setMobileSidebarOpen(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Eye size={13} />
                          <span>Cari Komoditas</span>
                        </div>
                      </button>

                      {/* 2. Lihat Penawaran */}
                      <button
                        type="button"
                        className={`clone-subnav-item ${activeTab === 'penawaran' ? 'active' : ''}`}
                        onClick={() => { handleTabChange('penawaran'); setMobileSidebarOpen(false); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BookmarkSimple size={13} />
                          <span>Lihat Penawaran</span>
                        </div>
                      </button>

                      {/* 3. Ajukan Penawaran */}
                      <button
                        type="button"
                        className={`clone-subnav-item ${activeTab === 'ajukan-penawaran' ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedOfferCommodity(null);
                          handleTabChange('ajukan-penawaran');
                          setMobileSidebarOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <PlusCircle size={14} weight={activeTab === 'ajukan-penawaran' ? 'bold' : 'regular'} />
                          <span>Ajukan Penawaran</span>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Daftar Penawaran */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'transaksi' ? 'active' : ''}`}
                onClick={() => { handleTabChange('transaksi'); setMobileSidebarOpen(false); }}
                title="Daftar Penawaran Komoditas"
              >
                {activeTab === 'transaksi' && <span className="clone-active-indicator" />}
                <Receipt size={18} weight={activeTab === 'transaksi' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Daftar Penawaran</span>
              </button>

              {/* 4. Harga Pasar */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'harga-pasar' ? 'active' : ''}`}
                onClick={() => { handleTabChange('harga-pasar'); setMobileSidebarOpen(false); }}
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
                onClick={() => { handleTabChange('pembayaran'); setMobileSidebarOpen(false); }}
                title="Pembayaran & Rekening Bersama Escrow"
              >
                {activeTab === 'pembayaran' && <span className="clone-active-indicator" />}
                <CreditCard size={18} weight={activeTab === 'pembayaran' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Pembayaran</span>
              </button>

              {/* 6. Riwayat Transaksi (Tepat di bawah Pembayaran) */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'riwayat-transaksi' ? 'active' : ''}`}
                onClick={() => { handleTabChange('riwayat-transaksi'); setMobileSidebarOpen(false); }}
                title="Riwayat Transaksi Selesai & Review"
              >
                {activeTab === 'riwayat-transaksi' && <span className="clone-active-indicator" />}
                <ClockCounterClockwise size={18} weight={activeTab === 'riwayat-transaksi' ? 'bold' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Riwayat Transaksi</span>
              </button>

              {/* 6. Pesan & Negosiasi */}
              <button
                type="button"
                className={`clone-nav-item ${activeTab === 'pesan' ? 'active' : ''}`}
                onClick={() => { handleTabChange('pesan'); setMobileSidebarOpen(false); }}
                title="Pesan & Negosiasi"
              >
                {activeTab === 'pesan' && <span className="clone-active-indicator" />}
                <ChatCircleText size={18} weight={activeTab === 'pesan' ? 'fill' : 'regular'} className="clone-nav-icon" />
                <span className="clone-nav-label">Pesan & Nego</span>
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
                title="Laporkan Masalah & Kendala"
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

        {/* Bottom Promo Card: Download APK di Browser / Update Aplikasi di Mobile App */}
        <AppDownloadPromoCard role="buyer" isCompact={komoditasDropdownOpen} />

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
              role="pembeli"
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
                {isLoadingProfile && !buyerProfile?.name ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 4px' }}>
                    <div className="agri-skeleton-avatar" style={{ width: '32px', height: '32px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className="agri-skeleton-text" style={{ width: '70px', height: '12px' }} />
                      <div className="agri-skeleton-text" style={{ width: '45px', height: '10px' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <img 
                      src={buyerProfile?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"} 
                      alt={buyerProfile?.name || "Pembeli"} 
                      className="clone-user-avatar"
                    />
                    <div className="clone-user-meta">
                      <div className="clone-user-name">{buyerProfile?.name || 'Pembeli'}</div>
                      <div className="clone-user-role">{getDisplayRole(buyerProfile?.role)}</div>
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
                  </>
                )}
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
                      <div className="clone-dropdown-name">{buyerProfile?.name || 'Pembeli'}</div>
                      <span className="clone-dropdown-role">{getDisplayRole(buyerProfile?.role)}</span>
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
            <RingkasanPembeli 
              onNavigate={(tab) => setActiveTab(tab)}
              marketPrices={marketPrices}
              offers={offers}
              transactions={transactions}
              proposals={proposals}
              buyerProfile={buyerProfile}
              isLoading={isLoadingData}
            />
          )}

          {/* TAB 2: KATALOG KOMODITAS & SUB-TABS */}
          {(activeTab === 'katalog' || activeTab === 'watchlist' || activeTab === 'rfq') && (
            <CariKomoditas 
              commodities={commodities}
              watchlist={watchlist}
              onSubmitOffer={handleAddNewOffer}
              onStartOffer={(commodity) => {
                setSelectedOfferCommodity(commodity);
                setActiveTab('ajukan-penawaran');
              }}
              initialModalOpen={addOfferModalRequested}
              onModalClose={() => setAddOfferModalRequested(false)}
              isLoading={isLoadingData}
            />
          )}

          {/* TAB: AJUKAN PENAWARAN (HALAMAN AJUKAN PENAWARAN) */}
          {activeTab === 'ajukan-penawaran' && (
            <AjukanPenawaran 
              proposals={proposals}
              buyerProfile={buyerProfile}
              currentBuyerId={currentBuyerId}
              commodities={commodities}
              initialCommodity={selectedOfferCommodity}
              isLoading={isLoadingData}
              onAddProposal={(newProp) => {
                setProposals(prev => (prev.some(p => p.id === newProp.id) ? prev : [newProp, ...prev]));
              }}
              onEditProposal={(updatedProp) => {
                setProposals(prev => prev.map(p => (p.id === updatedProp.id || (updatedProp.dbId && p.dbId === updatedProp.dbId)) ? { ...p, ...updatedProp } : p));
              }}
              onCancelProposal={(propId) => {
                setProposals(prev => prev.map(p => p.id === propId ? {
                  ...p,
                  status: 'Tidak Aktif',
                  statusDetail: 'Dibatalkan Pembeli',
                  rejectionReason: 'Dibatalkan oleh pembeli sebelum diverifikasi admin.'
                } : p));
              }}
              onDeleteProposal={(propId) => {
                setProposals(prev => prev.filter(p => p.id !== propId));
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB 3: PENAWARAN SAYA */}
          {activeTab === 'penawaran' && (
            <LihatPenawaran 
              offers={offers}
              isLoading={isLoadingData}
              title="Lihat Penawaran"
              subtitle="Pantau status seluruh proposal penawaran harga dan tonase yang Anda ajukan ke kelompok tani produsen. Terima kesepakatan, tolak penawaran balik, atau lakukan negosiasi harga ulang secara langsung."
              onAcceptCounterOffer={handleAcceptCounterOffer}
              onSubmitBuyerCounter={handleSubmitBuyerCounter}
              onProceedToBinding={() => setActiveTab('pembayaran')}
              onCancelOffer={handleCancelOffer}
            />
          )}

          {/* TAB 4: DAFTAR PENAWARAN (PENGADAAN) */}
          {activeTab === 'transaksi' && (
            <RiwayatPengadaanPembeli 
              transactions={transactions}
              offers={offers}
              proposals={proposals}
              isLoading={isLoadingData}
              onNavigate={(tab) => setActiveTab(tab)}
              onCancelOffer={handleCancelOffer}
            />
          )}

          {/* TAB 6: HARGA PASAR */}
          {activeTab === 'harga-pasar' && (
            <HargaPasarPembeli 
              marketPrices={marketPrices}
              isLoading={isLoadingData}
            />
          )}

          {/* TAB 7: PEMBAYARAN & ESCROW */}
          {activeTab === 'pembayaran' && (
            <PembayaranPembeli 
              payments={payments}
              isLoading={isLoadingData}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB: RIWAYAT TRANSAKSI (SELESAI) */}
          {activeTab === 'riwayat-transaksi' && (
            <RiwayatTransaksiPembeli 
              payments={payments}
              transactions={transactions}
              buyerProfile={buyerProfile}
              currentBuyerId={currentBuyerId}
              isLoading={isLoadingData}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB 8: PESAN & NEGOSIASI */}
          {activeTab === 'pesan' && (
            <PesanPembeli 
              currentUserId={currentBuyerId}
              currentUserProfile={buyerProfile}
            />
          )}

          {/* TAB 8: PROFIL PERUSAHAAN */}
          {activeTab === 'pengaturan' && (
            <PengaturanPembeli 
              profile={buyerProfile}
              onUpdateProfile={(updated) => setBuyerProfile(updated)}
              onLogout={handleLogout}
            />
          )}

          {/* TAB 9: LAPORKAN MASALAH / BUG */}
          {activeTab === 'laporkan-masalah' && (
            <LaporkanMasalah 
              userRole="pembeli"
              onBack={() => handleTabChange('dashboard')}
            />
          )}

          {/* TAB 10: SEMUA NOTIFIKASI REAL-TIME */}
          {activeTab === 'notifikasi' && (
            <NotificationPage 
              role="pembeli"
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
