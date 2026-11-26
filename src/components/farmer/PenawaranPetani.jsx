import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Handshake, 
  CheckCircle, 
  XCircle, 
  Clock, 
  X,
  ShieldCheck,
  MagnifyingGlass,
  ArrowCounterClockwise,
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  ArrowRight,
  Info,
  Check,
  Package,
  Trash,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { supabase } from '../../lib/supabaseClient';

import { 
  fetchOffersFromSupabase, 
  updateOfferInSupabase, 
  subscribeOffers 
} from '../../lib/dealService';
import { 
  notifyOfferRejected,
  notifyOfferCountered 
} from '../../lib/notificationService';
import { DEFAULT_AVATAR } from '../../lib/constants';

export default function PenawaranPetani({
  offers: propOffers = [],
  isLoading: propIsLoading = false,
  onAcceptOffer,
  onRejectOffer,
  onCounterOffer = null,
  onDeleteOffer = null,
  currentFarmerId = null,
  farmerProfile = null,
  commodities = [],
  onProceedToBinding = null,
  onRefreshOffers = null
}) {
  // Delete offer state with persistent storage to prevent zombie reappearances
  const getStoredDeletedIds = () => {
    try {
      const stored = localStorage.getItem('agriconnect_deleted_offer_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  };

  const [deletedOfferIds, setDeletedOfferIds] = useState(getStoredDeletedIds);

  const addDeletedIds = (ids) => {
    const list = Array.isArray(ids) ? ids : [ids];
    setDeletedOfferIds(prev => {
      const next = new Set(prev);
      list.forEach(id => { if (id) next.add(String(id)); });
      try {
        localStorage.setItem('agriconnect_deleted_offer_ids', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  };

  // Authoritative offers list initialized from props (selalu filter ID yang sudah dihapus)
  const [offerList, setOfferList] = useState(() => (propOffers || []).filter(o => !getStoredDeletedIds().has(String(o.id))));
  const [isLoading, setIsLoading] = useState(propIsLoading);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommodityFilter, setSelectedCommodityFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('terbaru'); // 'terbaru' | 'terlama'

  // Modals state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedOfferForAccept, setSelectedOfferForAccept] = useState(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOfferForReject, setSelectedOfferForReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Harga tidak sesuai');
  const [customRejectionText, setCustomRejectionText] = useState('');

  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOfferForCounter, setSelectedOfferForCounter] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterTon, setCounterTon] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [counterError, setCounterError] = useState('');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOfferForDetail, setSelectedOfferForDetail] = useState(null);

  // Processing & Toast feedback state
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Delete offer state
  const [deleteConfirmOffer, setDeleteConfirmOffer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedOfferIds, setSelectedOfferIds] = useState(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Helper cek apakah ID berupa UUID valid PostgreSQL
  const isUuidLike = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

  // Helper fleksibel konversi tanggal Indonesia / ISO ke Date object
  const parseDateFlexible = useCallback((dateStr) => {
    if (!dateStr) return null;
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    const indMonths = {
      januari: 'January', februari: 'February', maret: 'March', april: 'April',
      mei: 'May', juni: 'June', juli: 'July', agustus: 'August',
      september: 'September', oktober: 'October', november: 'November', desember: 'December',
      jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', jun: 'Jun', jul: 'Jul',
      agu: 'Aug', ags: 'Aug', sep: 'Sep', okt: 'Oct', nov: 'Nov', des: 'Dec'
    };
    let replaced = String(dateStr).toLowerCase();
    for (const [idm, enm] of Object.entries(indMonths)) {
      if (replaced.includes(idm)) {
        replaced = replaced.replace(idm, enm);
        break;
      }
    }
    d = new Date(replaced);
    return !isNaN(d.getTime()) ? d : null;
  }, []);

  // Helper mengecek apakah suatu penawaran sudah kedaluwarsa / kadaluarsa
  const isExpired = useCallback((offer) => {
    if (!offer) return false;
    const st = String(offer.status || '').toLowerCase();
    if (st.includes('daluarsa') || st.includes('expired')) return true;

    const dateStr = offer.rawValidUntil || offer.validUntil;
    if (dateStr) {
      const expDate = parseDateFlexible(dateStr);
      if (expDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expDate < today) return true;
      }
    }
    return false;
  }, [parseDateFlexible]);

  // Kriteria penawaran yang dapat dihapus:
  // 1. Yang bisa dihapus: kedaluwarsa / kadaluarsa (prioritas utama), dibatalkan, ditolak, diterima / disetujui
  // 2. Produk yang masih melakukan tawar balik atau menunggu respon (dan belum kedaluwarsa) TIDAK BISA dihapus
  const isDeletableOffer = useCallback((offer) => {
    if (!offer) return false;

    // Kadaluarsa / Kedaluwarsa SELALU BISA DIHAPUS
    if (isExpired(offer)) return true;

    // Diterima / Disetujui BISA DIHAPUS
    const st = String(offer.status || '').toLowerCase();
    if (st.includes('terima') || st.includes('setuju')) return true;

    // Ditolak / Dibatalkan BISA DIHAPUS
    if (st.includes('batal') || st.includes('tolak')) return true;

    // Aktif tawar balik atau menunggu respon (belum kedaluwarsa) tidak bisa dihapus
    return false;
  }, [isExpired]);

  const handleDeleteOffer = async () => {
    if (!deleteConfirmOffer || isDeleting) return;
    setIsDeleting(true);
    const offer = deleteConfirmOffer;
    const targetId = String(offer.id);
    const isUuid = isUuidLike(targetId);
    const code = offer.offerCode || offer.code;

    // 1. Update state lokal & storage SEGERA (instant UI removal)
    addDeletedIds([targetId, code]);
    setOfferList(prev => prev.filter(o => String(o.id) !== targetId && (!code || (o.offerCode !== code && o.code !== code))));
    setSelectedOfferIds(prev => {
      const next = new Set(prev);
      next.delete(targetId);
      if (code) next.delete(code);
      return next;
    });
    setDeleteConfirmOffer(null);

    if (onDeleteOffer) onDeleteOffer([targetId]);
    window.dispatchEvent(new CustomEvent('agriconnect:delete-offers', { detail: { ids: [targetId] } }));

    try {
      // 2. Hapus dari Supabase secara paralel di semua tabel terkait
      const promises = [];
      if (isUuid) {
        promises.push(supabase.from('offers').delete().eq('id', targetId));
        promises.push(supabase.from('contracts').delete().eq('offer_id', targetId));
        promises.push(supabase.from('contracts').delete().eq('id', targetId));
        promises.push(supabase.from('procurement_proposals').delete().eq('id', targetId));
      }
      if (code) {
        promises.push(supabase.from('offers').delete().eq('offer_code', code));
        promises.push(supabase.from('contracts').delete().eq('contract_code', code));
        promises.push(supabase.from('procurement_proposals').delete().eq('code', code));
      }
      await Promise.allSettled(promises);

      showToast(`Riwayat penawaran ${offer.commodityName || 'komoditas'} berhasil dihapus permanen.`, 'success');

      if (selectedOfferForDetail?.id === targetId) {
        setDetailModalOpen(false);
        setSelectedOfferForDetail(null);
      }
    } catch (err) {
      console.error('[PenawaranPetani] Gagal menghapus penawaran:', err);
      showToast(`Gagal menghapus penawaran: ${err.message || err}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete: hapus massal penawaran yang dipilih
  const handleConfirmBulkDelete = async () => {
    if (selectedOfferIds.size === 0 || isDeleting) return;
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedOfferIds).map(String);
    const uuidIds = idsToDelete.filter(isUuidLike);
    const codeIds = idsToDelete.filter(id => !isUuidLike(id));
    const deletedSet = new Set(idsToDelete);

    // 1. Update state lokal & storage SEGERA (instant UI removal)
    addDeletedIds(idsToDelete);
    setOfferList(prev => prev.filter(o => !deletedSet.has(String(o.id))));
    setSelectedOfferIds(new Set());
    setBulkDeleteModalOpen(false);

    if (onDeleteOffer) onDeleteOffer(idsToDelete);
    window.dispatchEvent(new CustomEvent('agriconnect:delete-offers', { detail: { ids: idsToDelete } }));

    if (selectedOfferForDetail && deletedSet.has(String(selectedOfferForDetail.id))) {
      setDetailModalOpen(false);
      setSelectedOfferForDetail(null);
    }

    try {
      // 2. Hapus bulk dari Supabase secara paralel
      const promises = [];
      if (uuidIds.length > 0) {
        promises.push(supabase.from('offers').delete().in('id', uuidIds));
        promises.push(supabase.from('contracts').delete().in('offer_id', uuidIds));
        promises.push(supabase.from('contracts').delete().in('id', uuidIds));
        promises.push(supabase.from('procurement_proposals').delete().in('id', uuidIds));
      }
      if (codeIds.length > 0) {
        promises.push(supabase.from('offers').delete().in('offer_code', codeIds));
        promises.push(supabase.from('contracts').delete().in('contract_code', codeIds));
        promises.push(supabase.from('procurement_proposals').delete().in('code', codeIds));
      }
      await Promise.allSettled(promises);

      showToast(`${idsToDelete.length} riwayat penawaran berhasil dihapus permanen.`, 'success');
    } catch (err) {
      console.error('[PenawaranPetani] Gagal hapus massal penawaran:', err);
      showToast(`Gagal menghapus penawaran: ${err.message || err}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sync with propOffers (selalu filter penawaran yang sudah dihapus)
  useEffect(() => {
    if (Array.isArray(propOffers)) {
      setOfferList(propOffers.filter(o => !deletedOfferIds.has(String(o.id))));
    }
  }, [propOffers, deletedOfferIds]);

  useEffect(() => {
    setIsLoading(propIsLoading);
  }, [propIsLoading]);

  // Direct Supabase fetching and Realtime Subscription
  const reloadOffersFromSupabase = useCallback(async () => {
    if (!currentFarmerId) return;
    try {
      setIsLoading(true);
      const res = await fetchOffersFromSupabase({ farmerId: currentFarmerId });
      if (res?.data) {
        setOfferList(res.data.filter(o => !deletedOfferIds.has(String(o.id))));
      }
    } catch (err) {
      console.warn('[PenawaranPetani] Gagal memuat data penawaran dari Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentFarmerId, deletedOfferIds]);

  useEffect(() => {
    if (!currentFarmerId) return;
    const unsub = subscribeOffers(() => {
      reloadOffersFromSupabase();
      if (onRefreshOffers) onRefreshOffers();
    });
    return () => {
      if (unsub) unsub();
    };
  }, [currentFarmerId, reloadOffersFromSupabase, onRefreshOffers]);

  // Compute stock comparison: ensure each offer has accurate farmer stock
  const offersWithStock = useMemo(() => {
    return (offerList || []).map((offer) => {
      // Find matching commodity in farmer inventory if stock is missing or 0
      let stockKg = Number(offer.stockKg || 0);
      let stockTon = Number(offer.stockTon || 0);

      if ((!stockKg || stockKg === 0) && Array.isArray(commodities) && commodities.length > 0) {
        const matched = commodities.find(c => 
          (offer.commodityId && c.id === offer.commodityId) ||
          (c.name && offer.commodityName && c.name.toLowerCase().trim() === offer.commodityName.toLowerCase().trim())
        );
        if (matched) {
          stockTon = Number(matched.stock_ton || matched.stockTon || 0);
          stockKg = stockTon * 1000;
        }
      }

      // Check expiry condition: if pending and validUntil is in the past
      let finalStatus = offer.status;
      if (isExpired(offer)) {
        finalStatus = 'Kedaluwarsa';
      } else {
        if (finalStatus === 'Disetujui' || finalStatus === 'accepted') finalStatus = 'Diterima';
        if (finalStatus === 'rejected') finalStatus = 'Ditolak';
      }

      return {
        ...offer,
        stockKg,
        stockTon,
        status: finalStatus
      };
    });
  }, [offerList, commodities, isExpired]);

  // Distinct commodities for filter dropdown
  const distinctCommodities = useMemo(() => {
    const set = new Set();
    offersWithStock.forEach(o => {
      if (o.commodityName) set.add(o.commodityName.trim());
    });
    return Array.from(set).sort();
  }, [offersWithStock]);

  // Filtered and Sorted Offers (Task 05)
  const filteredOffers = useMemo(() => {
    let result = [...offersWithStock];

    // Filter out deleted offers immediately
    if (deletedOfferIds.size > 0) {
      result = result.filter(o => 
        !deletedOfferIds.has(String(o.id)) && 
        (!o.offerCode || !deletedOfferIds.has(String(o.offerCode))) && 
        (!o.code || !deletedOfferIds.has(String(o.code)))
      );
    }

    // 1. Commodity Filter
    if (selectedCommodityFilter !== 'Semua') {
      result = result.filter(o => (o.commodityName || '').toLowerCase() === selectedCommodityFilter.toLowerCase());
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o => 
        (o.commodityName || '').toLowerCase().includes(q) ||
        (o.buyerName || '').toLowerCase().includes(q) ||
        (o.buyerCompany || '').toLowerCase().includes(q) ||
        (o.id || '').toLowerCase().includes(q) ||
        (o.offerCode || '').toLowerCase().includes(q)
      );
    }

    // 4. Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortBy === 'terlama' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [offersWithStock, deletedOfferIds, selectedCommodityFilter, searchQuery, sortBy]);

  // Daftar penawaran yang memenuhi syarat hapus (diterima, kedaluwarsa, ditolak/dibatalkan)
  const deletableOffers = useMemo(() => {
    return filteredOffers.filter(isDeletableOffer);
  }, [filteredOffers, isDeletableOffer]);

  const isAllSelected = deletableOffers.length > 0 && deletableOffers.every(o => selectedOfferIds.has(o.id));

  const handleToggleSelectAll = (e) => {
    e?.stopPropagation();
    if (isAllSelected) {
      setSelectedOfferIds(new Set());
    } else {
      const next = new Set();
      deletableOffers.forEach(o => next.add(o.id));
      setSelectedOfferIds(next);
    }
  };

  const handleToggleSelect = (id, e) => {
    e?.stopPropagation();
    setSelectedOfferIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCommodityFilter('Semua');
    setSortBy('terbaru');
  };

  // Pagination ala referensi (5 baris per halaman)
  const ROWS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCommodityFilter, searchQuery, sortBy, offersWithStock]);
  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ROWS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedOffers = filteredOffers.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);
  const pageNumbers = useMemo(() => {
    const total = Math.max(1, Math.ceil(filteredOffers.length / ROWS_PER_PAGE));
    const cur = Math.min(Math.max(1, currentPage), total);
    let start = Math.max(1, Math.min(cur - 2, total - 4));
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [filteredOffers.length, currentPage]);

  // Badge metode pembayaran: QRIS / Bank / Langsung
  const paymentBadge = (method) => {
    const m = String(method || '');
    if (/qris/i.test(m)) return { label: 'QRIS', bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' };
    if (/transfer|bank|va|escrow/i.test(m)) return { label: 'Bank', bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' };
    return { label: 'Langsung', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' };
  };

  const paginationBtnStyle = (disabled) => ({
    minWidth: '34px',
    height: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
    borderRadius: '9px',
    border: '1px solid var(--border-subtle, #e8ecf1)',
    background: 'var(--card-bg, #ffffff)',
    color: disabled ? 'var(--text-muted, #b6c0cf)' : 'var(--text-secondary, #64748b)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1
  });
  const paginationActiveStyle = {
    minWidth: '34px',
    height: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
    borderRadius: '9px',
    border: '1px solid #10b981',
    background: '#10b981',
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: 800,
    cursor: 'pointer'
  };

  // ==========================================
  // ACTION HANDLERS (ACCEPT & REJECT & DETAIL)
  // ==========================================

  const handleOpenAcceptModal = (offer) => {
    setSelectedOfferForAccept(offer);
    setAcceptModalOpen(true);
  };

  const handleCloseAcceptModal = () => {
    if (isProcessing) return;
    setAcceptModalOpen(false);
    setSelectedOfferForAccept(null);
  };

  const handleConfirmAccept = async () => {
    if (!selectedOfferForAccept || isProcessing) return;
    setIsProcessing(true);

    const targetOffer = selectedOfferForAccept;
    const offerId = targetOffer.id;

    // 1. Optimistic UI update: change status to 'Diterima' immediately
    setOfferList(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Diterima', isAutoAccepted: false } : o));

    try {
      const tonVal = Number(targetOffer.counterTon || targetOffer.requestedTon || 1);
      const priceVal = Number(targetOffer.counterPricePerKg || targetOffer.offeredPricePerKg || 0);
      const totalContractVal = tonVal * 1000 * priceVal;
      // Parent handler persists the status, reserves stock, and creates one contract
      // plus transaction. Do not create duplicate contracts from this component.
      if (onAcceptOffer) {
        const accepted = await onAcceptOffer(offerId, { ...targetOffer, status: 'Diterima', requestedTon: tonVal, offeredPricePerKg: priceVal, totalOfferValue: totalContractVal });
        if (accepted === false) throw new Error('Penawaran belum berhasil diproses ke database.');
      } else {
        const saved = await updateOfferInSupabase(offerId, { status: 'Disetujui', acceptedAt: new Date().toISOString() });
        if (!saved.data) throw new Error(saved.error || 'Gagal menyimpan status penawaran.');
      }
      if (onRefreshOffers) {
        onRefreshOffers();
      }
      if (onProceedToBinding) {
        onProceedToBinding();
      }

      showToast('Penawaran berhasil diterima.', 'success');
      setAcceptModalOpen(false);
      setSelectedOfferForAccept(null);
      if (detailModalOpen) setDetailModalOpen(false);
    } catch (err) {
      console.error('[PenawaranPetani] Gagal menerima penawaran:', err);
      if (onRefreshOffers) onRefreshOffers();
      showToast('Gagal memproses penerimaan penawaran. Silakan coba lagi.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRejectModal = (offer) => {
    setSelectedOfferForReject(offer);
    setRejectionReason('Harga tidak sesuai');
    setCustomRejectionText('');
    setRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    if (isProcessing) return;
    setRejectModalOpen(false);
    setSelectedOfferForReject(null);
    setCustomRejectionText('');
  };

  const handleOpenCounterModal = (offer) => {
    setSelectedOfferForCounter(offer);
    const initialPrice = offer.counterPricePerKg || offer.offeredPricePerKg || offer.listingPricePerKg || '';
    const initialTon = offer.counterTon || offer.requestedTon || '';
    setCounterPrice(initialPrice ? String(initialPrice) : '');
    setCounterTon(initialTon ? String(initialTon) : '');
    setCounterNotes(offer.counterNotes || '');
    setCounterError('');
    setCounterModalOpen(true);
  };

  const handleCloseCounterModal = () => {
    if (isProcessing) return;
    setCounterModalOpen(false);
    setSelectedOfferForCounter(null);
    setCounterError('');
  };

  const handleConfirmCounter = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOfferForCounter || isProcessing) return;

    const priceNum = Number(counterPrice);
    const tonNum = Number(counterTon);

    if (!counterPrice || isNaN(priceNum) || priceNum <= 0) {
      setCounterError('Masukkan harga penawaran baru per kg yang valid.');
      return;
    }
    if (!counterTon || isNaN(tonNum) || tonNum <= 0) {
      setCounterError('Masukkan jumlah volume tonase yang valid.');
      return;
    }

    const availableStock = selectedOfferForCounter.stockTon || 0;
    if (availableStock > 0 && tonNum > availableStock) {
      setCounterError(`Volume tawaran (${tonNum} Ton) melebihi stok yang tersedia (${availableStock} Ton).`);
      return;
    }

    setIsProcessing(true);
    const targetOffer = selectedOfferForCounter;
    const offerId = targetOffer.id;

    // 1. Optimistic UI update
    setOfferList(prev => prev.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          status: 'Counter-Offer',
          counterPricePerKg: priceNum,
          counterTon: tonNum,
          counterNotes: counterNotes.trim() || null,
          counterBy: 'petani'
        };
      }
      return o;
    }));

    try {
      // 2. Update Supabase offers table
      const saved = await updateOfferInSupabase(offerId, {
        status: 'Counter-Offer',
        counterPricePerKg: priceNum,
        counterTon: tonNum,
        counterNotes: counterNotes.trim() || null,
        counterBy: 'petani'
      });
      if (!saved.data) throw new Error(saved.error || 'Gagal menyimpan tawaran balik.');

      // 3. Trigger notification to buyer
      notifyOfferCountered({
        buyerId: targetOffer.buyerId,
        commodityName: targetOffer.commodityName || 'Komoditas',
        offerId: targetOffer.id
      }).catch(e => console.warn('[PenawaranPetani] notifyOfferCountered error:', e));

      // 4. Parent callback & dashboard refresh
      if (onCounterOffer) {
        onCounterOffer({
          offerId,
          counterPrice: priceNum,
          counterTon: tonNum,
          counterNotes: counterNotes.trim() || ''
        });
      }
      if (onRefreshOffers) {
        onRefreshOffers();
      }

      showToast('Tawaran balik berhasil dikirim ke pembeli.', 'success');
      setCounterModalOpen(false);
      setSelectedOfferForCounter(null);
      if (detailModalOpen) setDetailModalOpen(false);
    } catch (err) {
      console.error('[PenawaranPetani] Gagal mengirim tawaran balik:', err);
      showToast('Gagal mengirim tawaran balik. Silakan coba lagi.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedOfferForReject || isProcessing) return;
    setIsProcessing(true);

    const targetOffer = selectedOfferForReject;
    const offerId = targetOffer.id;
    const finalReason = rejectionReason === 'Lainnya' ? (customRejectionText.trim() || 'Lainnya') : rejectionReason;

    // 1. Optimistic UI update: change status to 'Ditolak' immediately
    setOfferList(prev => prev.map(o => o.id === offerId ? { ...o, status: 'Ditolak', rejectionReason: finalReason } : o));

    try {
      // 2. Update Supabase offers table
      const saved = await updateOfferInSupabase(offerId, {
        status: 'Ditolak',
        rejectionReason: finalReason,
        rejectedAt: new Date().toISOString()
      });
      if (!saved.data) throw new Error(saved.error || 'Gagal menyimpan penolakan.');

      // 3. Trigger notification to buyer
      notifyOfferRejected({
        buyerId: targetOffer.buyerId,
        commodityName: targetOffer.commodityName || 'Komoditas',
        offerId: targetOffer.id
      }).catch(e => console.warn('[PenawaranPetani] Notification reject error:', e));

      // 4. Parent callback & dashboard refresh
      if (onRejectOffer) {
        onRejectOffer(offerId, finalReason);
      }
      if (onRefreshOffers) {
        onRefreshOffers();
      }

      showToast('Penawaran berhasil ditolak.', 'info');
      setRejectModalOpen(false);
      setSelectedOfferForReject(null);
      if (detailModalOpen) setDetailModalOpen(false);
    } catch (err) {
      console.error('[PenawaranPetani] Gagal menolak penawaran:', err);
      showToast('Gagal memproses penolakan penawaran. Silakan coba lagi.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenDetailModal = (offer) => {
    setSelectedOfferForDetail(offer);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedOfferForDetail(null);
  };

  return (
    <div className="farmer-offers-view" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastType === 'success' ? '#059669' : toastType === 'error' ? '#dc2626' : '#2563eb',
          color: '#ffffff',
          padding: '0.85rem 1.35rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600,
          animation: 'fadeIn 0.25s ease'
        }}>
          {toastType === 'success' ? <CheckCircle size={20} weight="fill" /> : <Info size={20} weight="fill" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= TASK 03: HEADER ================= */}
      <div className="farmer-section-header" style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <h1 className="farmer-page-title" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)', letterSpacing: '-0.02em', margin: '0 0 0.65rem 0' }}>
          Penawaran
        </h1>
        
        {/* Kotak Card Subtitle (Bottom Card di bawah judul) */}
        <div style={{
          width: '100%',
          maxWidth: '960px',
          background: 'var(--bg-surface-card, #ffffff)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: '12px',
          padding: '0.85rem 1.15rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: 'rgba(84, 82, 246, 0.08)',
            color: '#5452f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <Info size={16} weight="bold" />
          </div>
          <p className="farmer-page-sub" style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary, #64748b)', lineHeight: 1.6, flex: 1 }}>
            Kelola dan pantau seluruh penawaran masuk dari pembeli atas komoditas Anda. Setujui tawaran yang cocok, tolak penawaran, atau ajukan penawaran balik (counter-offer) sesuai kesepakatan harga dan tonase.
          </p>
        </div>
      </div>

      {/* ================= TASK 05: SEARCH & FILTER BAR ================= */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap',
        background: 'var(--bg-surface-card)',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.25rem'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <MagnifyingGlass size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari komoditas, pembeli, atau ID penawaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.52rem 0.75rem 0.52rem 2.2rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem'
            }}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Commodity Filter */}
        <select
          value={selectedCommodityFilter}
          onChange={(e) => setSelectedCommodityFilter(e.target.value)}
          style={{
            padding: '0.52rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-canvas)',
            color: 'var(--text-primary)',
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <option value="Semua">Semua Komoditas</option>
          {distinctCommodities.map(comm => (
            <option key={comm} value={comm}>{comm}</option>
          ))}
        </select>

        {/* Sorting Filter */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '0.52rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-canvas)',
            color: 'var(--text-primary)',
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <option value="terbaru">Terbaru</option>
          <option value="terlama">Terlama</option>
        </select>

        {/* Reset Filter Button */}
        {(searchQuery || selectedCommodityFilter !== 'Semua' || sortBy !== 'terbaru') && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn-offer-action"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', background: 'transparent', border: '1px dashed var(--border-subtle)' }}
          >
            <ArrowCounterClockwise size={14} />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* ================= TASK 22: LOADING SKELETON ================= */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="agri-skeleton-pulse" style={{ height: '220px', borderRadius: '16px' }} />
          ))}
        </div>
      )}

      {/* ================= TASK 23: EMPTY STATES ================= */}
      {!isLoading && filteredOffers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 1.5rem',
          background: 'var(--bg-surface-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)'
        }}>
          <Handshake size={48} weight="duotone" color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          {offersWithStock.length === 0 ? (
            <>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Belum Ada Penawaran
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
                Penawaran pembelian untuk komoditas Anda akan muncul di halaman ini.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Penawaran Tidak Ditemukan
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                Tidak ada penawaran yang sesuai dengan pencarian atau filter Anda.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-offer-action"
                style={{
                  background: 'var(--accent-primary, #5452f6)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.2rem',
                  fontSize: '0.82rem'
                }}
              >
                <ArrowCounterClockwise size={14} weight="bold" />
                <span>Reset Filter</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* ================= TABEL PENAWARAN PEMBELI ================= */}
      {!isLoading && filteredOffers.length > 0 && (
        <div style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-subtle, #e8ecf1)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '1rem 1.25rem 0.8rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Daftar Penawaran Pembeli</h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Nama pembeli, komoditas, harga, volume, total, pembayaran, serta aksi terima/tolak.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '1000px' }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 1.4fr 1.3fr 1fr 0.8fr 1.1fr 0.8fr 1.6fr',
                gap: '0.75rem',
                alignItems: 'center',
                padding: '0.6rem 1.25rem',
                background: 'var(--bg-canvas-subtle, #f6f8fb)',
                borderTop: '1px solid var(--border-subtle, #e8ecf1)',
                borderBottom: '1px solid var(--border-subtle, #e8ecf1)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-secondary, #64748b)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    disabled={deletableOffers.length === 0}
                    title={
                      deletableOffers.length === 0
                        ? "Tidak ada riwayat penawaran yang dapat dipilih"
                        : isAllSelected
                        ? "Batalkan pilihan semua"
                        : "Pilih semua riwayat yang dapat dihapus (diterima, kedaluwarsa, ditolak/dibatalkan)"
                    }
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isAllSelected ? '2px solid #ef4444' : '2px solid #cbd5e1',
                      background: isAllSelected ? '#ef4444' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: deletableOffers.length === 0 ? 'not-allowed' : 'pointer',
                      padding: 0,
                      opacity: deletableOffers.length === 0 ? 0.35 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isAllSelected && <Check size={11} weight="bold" color="#ffffff" />}
                  </button>
                </div>
                <span>Pembeli</span>
                <span>Komoditas</span>
                <span style={{ textAlign: 'right' }}>Harga / kg</span>
                <span>Volume</span>
                <span style={{ textAlign: 'right' }}>Total</span>
                <span>Pembayaran</span>
                <span style={{ textAlign: 'center' }}>Aksi & Status</span>
              </div>

              {/* Body */}
              {pagedOffers.map((offer) => {
                const expired = isExpired(offer);
                const isPending = !expired && (offer.status === 'Menunggu Respon' || offer.status === 'pending' || offer.status === 'waiting_response' || offer.status === 'Diproses');
                const isCounter = !expired && (offer.status === 'Counter-Offer' || offer.status === 'counter-offer');
                const isCounterByPetani = isCounter && (offer.counterBy === 'petani' || !offer.counterBy);
                const isCounterByPembeli = isCounter && offer.counterBy === 'pembeli';
                const canAct = !expired && (isPending || isCounterByPembeli);
                const currentStatus = expired ? 'Kedaluwarsa' : (offer.status === 'Disetujui' || offer.status === 'accepted' ? 'Diterima' : offer.status);

                const pay = paymentBadge(offer.paymentMethod);
                const buyerName = offer.buyerCompany || offer.buyerName || 'Pembeli';
                const avatarLetter = (buyerName.charAt(0) || 'P').toUpperCase();
                
                // Effective price & ton reflecting active negotiation
                const effPrice = (isCounter && offer.counterPricePerKg) ? Number(offer.counterPricePerKg) : Number(offer.offeredPricePerKg || 0);
                const effTon = (isCounter && offer.counterTon) ? Number(offer.counterTon) : Number(offer.requestedTon || 1);
                const effTotal = effTon * 1000 * effPrice;
                const reqKg = effTon * 1000;

                const isSelected = selectedOfferIds.has(offer.id);
                const isDeletable = isDeletableOffer(offer);

                return (
                  <div
                    key={offer.id}
                    onClick={() => handleOpenDetailModal(offer)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1.4fr 1.3fr 1fr 0.8fr 1.1fr 0.8fr 1.6fr',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.7rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle, #eef1f6)',
                      background: isSelected ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f8fafc)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                    title={`Lihat rincian penawaran ${offer.commodityName}`}
                  >
                    {/* Tombol Bulat Seleksi di sebelah kiri */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {isDeletable ? (
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(offer.id, e)}
                          title={isSelected ? "Batalkan pilihan" : "Pilih penawaran ini untuk dihapus"}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #ef4444' : '2px solid #cbd5e1',
                            background: isSelected ? '#ef4444' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected && <Check size={11} weight="bold" color="#ffffff" />}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted, #cbd5e1)', fontSize: '0.8rem' }} title="Penawaran aktif / tawar balik tidak dapat dihapus">—</span>
                      )}
                    </div>

                    {/* Pembeli: profil + nama + tombol bulat hapus jika memenuhi syarat */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      {offer.buyerAvatar ? (
                        <img
                          src={offer.buyerAvatar}
                          alt={buyerName}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                        />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #5452f6, #7c3aed)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                          {avatarLetter}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {buyerName}
                        </span>
                        {isCounterByPembeli && (
                          <span style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 700, background: '#fffbeb', padding: '1px 5px', borderRadius: '4px', border: '1px solid #fde68a', display: 'inline-block', marginTop: '2px' }}>
                            Tawaran Balik Pembeli
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Komoditas */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      {offer.commodityImage ? (
                        <img
                          src={offer.commodityImage}
                          alt={offer.commodityName}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>
                          <Package size={16} weight="bold" />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {offer.commodityName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {offer.category}
                        </div>
                      </div>
                    </div>

                    {/* Harga / kg */}
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: isCounter ? '#b45309' : 'var(--text-primary)' }}>
                        Rp {effPrice.toLocaleString('id-ID')}
                      </div>
                      {isCounter && offer.offeredPricePerKg && Number(offer.offeredPricePerKg) !== effPrice && (
                        <div style={{ fontSize: '0.68rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                          Rp {Number(offer.offeredPricePerKg).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>

                    {/* Volume */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: isCounter ? 700 : 500, color: isCounter ? '#b45309' : 'inherit' }}>
                        {effTon} Ton
                      </span>
                      {isCounter && offer.requestedTon && Number(offer.requestedTon) !== effTon && (
                        <span style={{ fontSize: '0.68rem', textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          ({offer.requestedTon} Ton)
                        </span>
                      )}
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {reqKg.toLocaleString('id-ID')} kg
                      </div>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.84rem', color: isCounter ? '#b45309' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      Rp {effTotal.toLocaleString('id-ID')}
                    </div>

                    {/* Pembayaran */}
                    <div>
                      <span
                        title={offer.paymentMethod || 'Transfer Bank'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.24rem 0.6rem',
                          borderRadius: '7px',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          background: pay.bg,
                          color: pay.color,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {pay.label}
                      </span>
                    </div>

                    {/* Aksi: terima / tawar balik / tolak atau pill status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }} onClick={(e) => e.stopPropagation()}>
                      {canAct ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(offer)}
                            title={`Tolak penawaran ${offer.commodityName}`}
                            style={{
                              padding: '0.32rem 0.55rem',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              borderRadius: '7px',
                              border: '1px solid #fecaca',
                              background: '#fff1f2',
                              color: '#dc2626',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCounterModal(offer)}
                            title={`Tawar balik harga & kuantitas untuk ${offer.commodityName}`}
                            style={{
                              padding: '0.32rem 0.65rem',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              borderRadius: '7px',
                              border: '1px solid #f59e0b',
                              background: '#fffbeb',
                              color: '#b45309',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Handshake size={12} weight="bold" />
                            <span>Tawar Balik</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAcceptModal(offer)}
                            title={`Terima penawaran ${offer.commodityName}`}
                            style={{
                              padding: '0.32rem 0.65rem',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              borderRadius: '7px',
                              border: '1px solid #10b981',
                              background: '#10b981',
                              color: '#ffffff',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Terima
                          </button>
                        </>
                      ) : isCounterByPetani ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0.24rem 0.65rem',
                            borderRadius: '7px',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            background: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            whiteSpace: 'nowrap'
                          }}
                          title={`Tawaran Anda (Rp ${effPrice.toLocaleString('id-ID')}/kg • ${effTon} Ton) sedang menunggu tanggapan pembeli`}
                        >
                          <Clock size={12} weight="bold" />
                          <span>Menunggu Pembeli</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '0.24rem 0.65rem',
                            borderRadius: '7px',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            background: currentStatus === 'Diterima' || currentStatus === 'Disetujui'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : currentStatus === 'Kedaluwarsa'
                              ? 'rgba(100, 116, 139, 0.12)'
                              : 'rgba(239, 68, 68, 0.10)',
                            color: currentStatus === 'Diterima' || currentStatus === 'Disetujui'
                              ? '#059669'
                              : currentStatus === 'Kedaluwarsa'
                              ? '#64748b'
                              : '#dc2626',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {(currentStatus === 'Diterima' || currentStatus === 'Disetujui') && <CheckCircle size={12} weight="fill" />}
                          {currentStatus === 'Ditolak' && <XCircle size={12} weight="fill" />}
                          {currentStatus === 'Kedaluwarsa' && <Clock size={12} weight="bold" />}
                          <span>{currentStatus}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {filteredOffers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '1rem 1.25rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
                title="Halaman pertama"
                aria-label="Halaman pertama"
                style={paginationBtnStyle(safePage <= 1)}
              >
                <CaretDoubleLeft size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(safePage - 1)}
                disabled={safePage <= 1}
                title="Sebelumnya"
                aria-label="Sebelumnya"
                style={paginationBtnStyle(safePage <= 1)}
              >
                <CaretLeft size={15} weight="bold" />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCurrentPage(n)}
                  title={`Halaman ${n}`}
                  style={n === safePage ? paginationActiveStyle : paginationBtnStyle(false)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage(safePage + 1)}
                disabled={safePage >= totalPages}
                title="Berikutnya"
                aria-label="Berikutnya"
                style={paginationBtnStyle(safePage >= totalPages)}
              >
                <CaretRight size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                title="Halaman terakhir"
                aria-label="Halaman terakhir"
                style={paginationBtnStyle(safePage >= totalPages)}
              >
                <CaretDoubleRight size={15} weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TASK 14: MODAL TERIMA PENAWARAN ================= */}
      {acceptModalOpen && selectedOfferForAccept && (
        <div className="farmer-modal-overlay accept-offer-overlay" onClick={handleCloseAcceptModal}>
          <div className="farmer-modal-card accept-offer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="farmer-modal-header accept-offer-header">
              <div className="accept-offer-heading-group">
                <div className="accept-offer-icon">
                  <CheckCircle size={23} color="#059669" weight="fill" />
                </div>
                <div className="accept-offer-heading-copy">
                  <h2 className="farmer-modal-title accept-offer-title">
                    Terima Penawaran?
                  </h2>
                  <p className="farmer-modal-sub accept-offer-sub">
                    Pastikan informasi penawaran sudah sesuai sebelum Anda menerima penawaran ini.
                  </p>
                </div>
              </div>
              {!isProcessing && (
                <button type="button" onClick={handleCloseAcceptModal} className="farmer-modal-close-btn accept-offer-close" aria-label="Tutup dialog">
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="accept-offer-content">
              {/* Summary Box */}
              <div className="accept-offer-summary">
                <div className="accept-offer-product">
                  <span className="accept-offer-label">Komoditas</span>
                  <div className="accept-offer-product-name">
                    {selectedOfferForAccept.commodityName}
                  </div>
                </div>

                <div className="accept-offer-metric">
                  <span className="accept-offer-label">Jumlah Dibutuhkan</span>
                  <div className="accept-offer-value quantity">
                    {Number(selectedOfferForAccept.requestedKg || (selectedOfferForAccept.requestedTon * 1000)).toLocaleString('id-ID')} kg
                    <span className="accept-offer-unit">
                      ({selectedOfferForAccept.requestedTon} Ton)
                    </span>
                  </div>
                </div>

                <div className="accept-offer-metric">
                  <span className="accept-offer-label">Harga / kg</span>
                  <div className="accept-offer-value price">
                    Rp {Number(selectedOfferForAccept.offeredPricePerKg || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="accept-offer-metric total">
                  <span className="accept-offer-label">Total Penawaran</span>
                  <div className="accept-offer-value total-value">
                    Rp {Number(selectedOfferForAccept.totalOfferValue || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="accept-offer-metric payment">
                  <span className="accept-offer-label">Metode Pembayaran</span>
                  <div className="accept-offer-value payment-value">
                    {String(selectedOfferForAccept.paymentMethod || 'Transfer Bank').replace(/\s*\(\s*VA\s*Escrow\s*\)/i, '')}
                  </div>
                </div>
              </div>
            </div>

            <div className="accept-offer-footer">
              <button
                type="button"
                onClick={handleCloseAcceptModal}
                disabled={isProcessing}
                className="btn btn-ghost"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={isProcessing}
                className="accept-offer-confirm"
              >
                {isProcessing ? (
                  <>
                    <ArrowClockwise size={16} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} weight="bold" />
                    <span>Terima Penawaran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TASK 15: MODAL TOLAK PENAWARAN ================= */}
      {rejectModalOpen && selectedOfferForReject && (
        <div className="farmer-modal-overlay" onClick={handleCloseRejectModal} style={{ zIndex: 1100 }}>
          <div className="farmer-modal-card" style={{ maxWidth: '500px', width: '92%', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div className="farmer-modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={24} color="#dc2626" weight="fill" />
                </div>
                <div>
                  <h2 className="farmer-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                    Tolak Penawaran?
                  </h2>
                  <p className="farmer-modal-sub" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Apakah Anda yakin ingin menolak penawaran ini?
                  </p>
                </div>
              </div>
              {!isProcessing && (
                <button type="button" onClick={handleCloseRejectModal} className="farmer-modal-close-btn">
                  <X size={18} />
                </button>
              )}
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Penawaran dari <strong>{selectedOfferForReject.buyerCompany || selectedOfferForReject.buyerName}</strong> untuk <strong>{selectedOfferForReject.commodityName}</strong> akan dibatalkan.
              </div>

              {/* Pilihan Alasan Penolakan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Pilih Alasan Penolakan:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Harga tidak sesuai',
                    'Stok tidak mencukupi',
                    'Tidak tertarik',
                    'Lainnya'
                  ].map((reason) => (
                    <label 
                      key={reason} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        padding: '0.55rem 0.85rem', 
                        borderRadius: '8px', 
                        border: rejectionReason === reason ? '1px solid #5452f6' : '1px solid var(--border-subtle)',
                        background: rejectionReason === reason ? 'rgba(84, 82, 246, 0.05)' : 'var(--bg-canvas-subtle)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        value={reason}
                        checked={rejectionReason === reason}
                        onChange={() => setRejectionReason(reason)}
                        style={{ accentColor: '#5452f6' }}
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Textarea jika alasan 'Lainnya' */}
              {rejectionReason === 'Lainnya' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Alasan Lainnya:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Masukkan alasan penolakan..."
                    value={customRejectionText}
                    onChange={(e) => setCustomRejectionText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-canvas)'
            }}>
              <button
                type="button"
                onClick={handleCloseRejectModal}
                disabled={isProcessing}
                className="btn btn-ghost"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing}
                style={{
                  background: '#dc2626',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.28)'
                }}
              >
                {isProcessing ? (
                  <>
                    <ArrowClockwise size={16} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} weight="bold" />
                    <span>Tolak Penawaran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL COUNTER OFFER PETANI ================= */}
      {counterModalOpen && selectedOfferForCounter && (
        <div className="farmer-modal-overlay" onClick={handleCloseCounterModal} style={{ zIndex: 1100 }}>
          <div className="farmer-modal-card" style={{ maxWidth: '520px', width: '92%', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div className="farmer-modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fde68a' }}>
                  <Handshake size={20} color="#b45309" weight="bold" />
                </div>
                <div>
                  <h3 className="farmer-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                    Tawar Balik Penawaran (Counter Offer)
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Ajukan harga dan tonase baru kepada pembeli
                  </span>
                </div>
              </div>
              <button type="button" onClick={handleCloseCounterModal} className="farmer-modal-close-btn" disabled={isProcessing}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCounter} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Komoditas & Pembeli Info Card */}
              <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-canvas-subtle)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Komoditas</div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{selectedOfferForCounter.commodityName}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Pembeli: {selectedOfferForCounter.buyerCompany || selectedOfferForCounter.buyerName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Stok Anda</div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#5452f6' }}>{selectedOfferForCounter.stockTon} Ton</div>
                </div>
              </div>

              {/* Nilai Pengajuan Sebelumnya */}
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(84, 82, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(84, 82, 246, 0.2)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Permintaan Pembeli: </span>
                  <strong>{selectedOfferForCounter.requestedTon} Ton</strong> @ <strong>Rp {Number(selectedOfferForCounter.offeredPricePerKg || 0).toLocaleString('id-ID')}/kg</strong>
                </div>
              </div>

              {/* Error Alert */}
              {counterError && (
                <div style={{ padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}>
                  {counterError}
                </div>
              )}

              {/* Form Input: Harga Baru */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Harga Tawar Balik per kg (Rp) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={counterPrice}
                  onChange={(e) => { setCounterPrice(e.target.value); setCounterError(''); }}
                  placeholder="Misal: 28000"
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-canvas)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Form Input: Jumlah Tonase Baru */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Volume Tawar Balik (Ton) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={counterTon}
                  onChange={(e) => { setCounterTon(e.target.value); setCounterError(''); }}
                  placeholder="Misal: 5"
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-canvas)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Live Preview Kalkulasi Nilai */}
              <div style={{ padding: '0.85rem 1rem', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>Total Nilai Tawaran Baru:</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#b45309', fontFamily: 'var(--font-mono, sans-serif)' }}>
                  Rp {((Number(counterTon) || 0) * 1000 * (Number(counterPrice) || 0)).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Catatan / Alasan Tawar Balik */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  Catatan untuk Pembeli (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="Misal: Stok komoditas grade super, harga disesuaikan ongkos sortir & packing."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-canvas)',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={handleCloseCounterModal}
                  disabled={isProcessing}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.84rem', padding: '0.5rem 1.1rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    padding: '0.55rem 1.35rem',
                    borderRadius: '9px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <ArrowClockwise size={16} className="animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Handshake size={16} weight="bold" />
                      <span>Kirim Tawaran Balik</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TASK 16: MODAL DETAIL PENAWARAN ================= */}
      {detailModalOpen && selectedOfferForDetail && (
        <div className="farmer-modal-overlay" onClick={handleCloseDetailModal} style={{ zIndex: 1100 }}>
          <div className="farmer-modal-card" style={{ maxWidth: '580px', width: '92%', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div className="farmer-modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h2 className="farmer-modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Detail Penawaran
                </h2>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono, sans-serif)' }}>
                  ID: {selectedOfferForDetail.offerCode || selectedOfferForDetail.id}
                </span>
              </div>
              <button type="button" onClick={handleCloseDetailModal} className="farmer-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Commodity & Buyer Header Card */}
              <div style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                padding: '0.9rem',
                background: 'var(--bg-canvas-subtle)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}>
                <img
                  src={selectedOfferForDetail.commodityImage || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=200&q=80'}
                  alt={selectedOfferForDetail.commodityName}
                  style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#5452f6' }}>
                    {selectedOfferForDetail.category || 'Komoditas Pertanian'}
                  </div>
                  <h4 style={{ margin: '2px 0 4px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedOfferForDetail.commodityName}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Pembeli: <strong>{selectedOfferForDetail.buyerCompany || selectedOfferForDetail.buyerName}</strong>
                  </div>
                </div>
              </div>

              {/* Status & Jenis Penawaran Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  background: selectedOfferForDetail.status === 'Diterima' ? 'rgba(16, 185, 129, 0.15)' : selectedOfferForDetail.status === 'Ditolak' ? 'rgba(239, 68, 68, 0.15)' : selectedOfferForDetail.status === 'Kedaluwarsa' ? 'rgba(100, 116, 139, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: selectedOfferForDetail.status === 'Diterima' ? '#059669' : selectedOfferForDetail.status === 'Ditolak' ? '#dc2626' : selectedOfferForDetail.status === 'Kedaluwarsa' ? '#64748b' : '#d97706'
                }}>
                  Status: {selectedOfferForDetail.status === 'Menunggu Respon' ? 'Perlu Tindakan' : selectedOfferForDetail.status}
                </span>

                <span style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  background: 'var(--bg-canvas-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  Jenis: {selectedOfferForDetail.source === 'cari_penawaran' || selectedOfferForDetail.isAutoAccepted ? 'Permintaan Anda (Pencarian)' : 'Penawaran Pembeli'}
                </span>

                {(selectedOfferForDetail.source === 'cari_penawaran' || selectedOfferForDetail.isAutoAccepted) && (
                  <span style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669'
                  }}>
                    Diterima Otomatis
                  </span>
                )}
              </div>

              {/* Auto accepted note if applicable */}
              {(selectedOfferForDetail.source === 'cari_penawaran' || selectedOfferForDetail.isAutoAccepted) && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.8rem',
                  color: '#065f46',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={18} color="#059669" weight="fill" style={{ flexShrink: 0 }} />
                  <span>Penawaran ini diterima otomatis karena sesuai dengan permintaan yang Anda ajukan.</span>
                </div>
              )}

              {/* Rejection note if applicable */}
              {selectedOfferForDetail.status === 'Ditolak' && selectedOfferForDetail.rejectionReason && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.8rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <XCircle size={18} color="#dc2626" weight="fill" style={{ flexShrink: 0 }} />
                  <span>Alasan Penolakan: <strong>"{selectedOfferForDetail.rejectionReason}"</strong></span>
                </div>
              )}

              {/* Rincian Komersial 4 Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                background: 'var(--bg-canvas-subtle)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Jumlah Dibutuhkan</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {Number(selectedOfferForDetail.requestedKg || (selectedOfferForDetail.requestedTon * 1000)).toLocaleString('id-ID')} kg
                    <span style={{ fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '4px' }}>
                      ({selectedOfferForDetail.requestedTon} Ton)
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Stok Anda Saat Ini</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#5452f6', marginTop: '2px' }}>
                    {Number(selectedOfferForDetail.stockKg || 0).toLocaleString('id-ID')} kg
                    <span style={{ fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '4px' }}>
                      ({selectedOfferForDetail.stockTon} Ton)
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Harga Penawaran / kg</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    Rp {Number(selectedOfferForDetail.offeredPricePerKg || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Penawaran</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono, sans-serif)', marginTop: '2px' }}>
                    Rp {Number(selectedOfferForDetail.totalOfferValue || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Counter details banner if exists */}
              {(selectedOfferForDetail.status === 'Counter-Offer' || selectedOfferForDetail.counterPricePerKg) && (
                <div style={{
                  padding: '0.85rem 1rem',
                  background: '#fffbeb',
                  borderRadius: '12px',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 800, fontSize: '0.85rem' }}>
                    <Handshake size={16} weight="bold" />
                    <span>
                      {selectedOfferForDetail.counterBy === 'pembeli' ? 'Tawaran Balik dari Pembeli' : 'Tawaran Balik Diajukan ke Pembeli'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Harga Baru: <strong style={{ color: '#b45309' }}>Rp {Number(selectedOfferForDetail.counterPricePerKg).toLocaleString('id-ID')}/kg</strong> • Volume: <strong style={{ color: '#b45309' }}>{selectedOfferForDetail.counterTon} Ton</strong> (Total: Rp {((Number(selectedOfferForDetail.counterTon) || 0) * 1000 * (Number(selectedOfferForDetail.counterPricePerKg) || 0)).toLocaleString('id-ID')})
                  </div>
                  {selectedOfferForDetail.counterNotes && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                      Catatan: "{selectedOfferForDetail.counterNotes}"
                    </div>
                  )}
                  {selectedOfferForDetail.status === 'Counter-Offer' && selectedOfferForDetail.counterBy === 'petani' && (
                    <div style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '4px', fontWeight: 600 }}>
                      ⏳ Menunggu pembeli menyetujui, menolak, atau menawar balik.
                    </div>
                  )}
                </div>
              )}

              {/* Rincian Transaksi Tambahan */}
              <div style={{
                background: 'var(--bg-canvas)',
                borderRadius: '12px',
                padding: '0.9rem 1rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Metode Pembayaran:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedOfferForDetail.paymentMethod || 'Transfer Bank'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tanggal Penawaran Diajukan:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {selectedOfferForDetail.createdAt ? new Date(selectedOfferForDetail.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Hari Ini'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Berlaku Sampai:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedOfferForDetail.validUntil || '30 September 2026'}</strong>
                </div>

                {selectedOfferForDetail.notes && !selectedOfferForDetail.isAutoAccepted && (
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>
                      Catatan Pembeli:
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{selectedOfferForDetail.notes}"
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Detail Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-canvas)'
            }}>
              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="btn btn-ghost"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}
              >
                Tutup
              </button>

              {(selectedOfferForDetail.status === 'Menunggu Respon' || selectedOfferForDetail.status === 'pending' || (selectedOfferForDetail.status === 'Counter-Offer' && selectedOfferForDetail.counterBy === 'pembeli')) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const off = selectedOfferForDetail;
                      handleCloseDetailModal();
                      handleOpenRejectModal(off);
                    }}
                    className="btn-offer-action reject"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}
                  >
                    <XCircle size={15} weight="bold" />
                    <span>Tolak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const off = selectedOfferForDetail;
                      handleCloseDetailModal();
                      handleOpenCounterModal(off);
                    }}
                    style={{
                      padding: '0.5rem 1.1rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      border: '1px solid #f59e0b',
                      background: '#fffbeb',
                      color: '#b45309',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Handshake size={15} weight="bold" />
                    <span>Tawar Balik</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const off = selectedOfferForDetail;
                      handleCloseDetailModal();
                      handleOpenAcceptModal(off);
                    }}
                    className="btn-offer-action accept"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      padding: '0.5rem 1.25rem'
                    }}
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>Terima Penawaran</span>
                  </button>
                </>
              )}

              {(selectedOfferForDetail.status === 'Diterima' || selectedOfferForDetail.status === 'Disetujui') && onProceedToBinding && (
                <button
                  type="button"
                  onClick={() => {
                    handleCloseDetailModal();
                    onProceedToBinding();
                  }}
                  className="btn-offer-action accept"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1d4ed8 100%)',
                    fontSize: '0.82rem',
                    padding: '0.5rem 1.25rem'
                  }}
                >
                  <Handshake size={15} weight="bold" />
                  <span>Lihat Binding Agreement</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS RIWAYAT PENAWARAN ================= */}
      {deleteConfirmOffer && (
        <div
          onClick={() => !isDeleting && setDeleteConfirmOffer(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash size={18} weight="bold" color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>
                  Hapus Riwayat Penawaran?
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#b91c1c' }}>
                  Tindakan ini menghapus data secara permanen dari database.
                </span>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                Apakah Anda yakin ingin menghapus riwayat penawaran komoditas <strong>{deleteConfirmOffer.commodityName}</strong> dari pembeli <strong>{deleteConfirmOffer.buyerCompany || deleteConfirmOffer.buyerName || 'Pembeli'}</strong> (Status: <strong>{deleteConfirmOffer.status}</strong>)? Data yang telah dihapus tidak dapat dipulihkan kembali.
              </p>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmOffer(null)}
                disabled={isDeleting}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteOffer}
                disabled={isDeleting}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                }}
              >
                {isDeleting ? (
                  <>
                    <ArrowsClockwise size={14} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash size={14} weight="bold" />
                    <span>Ya, Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar Seleksi Hapus Massal (Sama persis seperti halaman Pembayaran Pembeli) */}
      {selectedOfferIds.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a',
          color: '#ffffff',
          padding: '0.65rem 1.25rem',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4), 0 8px 10px -6px rgba(15, 23, 42, 0.3)',
          zIndex: 9990,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          animation: 'slideUpBar 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#ef4444',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.74rem',
              fontWeight: 800
            }}>
              {selectedOfferIds.size}
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
              {selectedOfferIds.size} riwayat penawaran dipilih
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSelectedOfferIds(new Set())}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#e2e8f0',
                borderRadius: '9999px',
                padding: '0.38rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(true)}
              style={{
                background: '#ef4444',
                border: 'none',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '0.42rem 1.05rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)'
              }}
            >
              <Trash size={14} weight="bold" />
              <span>Hapus Semua Terpilih</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS MASSAL PENAWARAN ================= */}
      {bulkDeleteModalOpen && (
        <div
          onClick={() => !isDeleting && setBulkDeleteModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash size={18} weight="bold" color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>
                  Hapus {selectedOfferIds.size} Penawaran Terpilih?
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#b91c1c' }}>
                  Tindakan ini menghapus data secara permanen dari database.
                </span>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                Apakah Anda yakin ingin menghapus secara permanen <strong>{selectedOfferIds.size}</strong> riwayat penawaran yang dipilih? Data yang telah dihapus tidak dapat dipulihkan kembali.
              </p>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={isDeleting}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isDeleting}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                }}
              >
                {isDeleting ? (
                  <>
                    <ArrowsClockwise size={14} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash size={14} weight="bold" />
                    <span>Ya, Hapus Terpilih</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
