import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  DownloadSimple, 
  Copy, 
  Check, 
  MagnifyingGlass, 
  X, 
  Receipt,
  FileText,
  Bank,
  QrCode,
  Money,
  ArrowsClockwise,
  ChatCircleDots,
  CalendarBlank,
  WarningCircle,
  CaretLeft,
  CaretRight,
  CaretDown,
  ArrowRight,
  Storefront,
  Buildings,
  UserCheck,
  Package,
  Trash
} from '@phosphor-icons/react';
import {
  notifyPaymentSuccess,
  notifyDirectPaymentSelected,
  notifyOrderStatusChanged
} from '../../lib/notificationService';
import { 
  restoreStockForTransaction, 
  markOfferCancelledByContract,
  confirmGoodsReceivedInSupabase,
  updateGoodsStatusInSupabase
} from '../../lib/dealService';
import { supabase } from '../../lib/supabaseClient';

export default function BuyerPayment({ 
  payments = [], 
  onNavigate,
  title = "Pembayaran",
  subtitle = "Kelola tagihan, pembayaran, dan status transaksi komoditas Anda.",
  isLoading: propLoading = false
}) {
  // Batas pembayaran: 24 jam sejak transaksi dibuat (berlaku untuk QRIS, bank, & langsung).
  const PAYMENT_DEADLINE_MS = 24 * 60 * 60 * 1000;
  const parseCreatedAt = (v) => {
    if (!v) return null;
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? null : t;
  };

  // 1. Data Normalization — TANPA fallback mock (user baru = kosong, bukan tagihan orang lain).
  const initialData = useMemo(() => {
    const raw = (payments && payments.length > 0) ? payments : [];
    const now = Date.now();
    return raw.map((item, idx) => {
      const createdMs = parseCreatedAt(item.createdAt);
      // countdown dari batas 24 jam bila ada createdAt valid; selain itu perilaku lama.
      const deadlineCountdown = createdMs !== null
        ? Math.max(0, Math.floor((createdMs + PAYMENT_DEADLINE_MS - now) / 1000))
        : (item.countdownSeconds !== undefined ? item.countdownSeconds : (item.status === 'Menunggu Pembayaran' ? 29555 : 0));
      
      const rawGoodsStatus = item.goodsStatus || (item.status === 'Selesai' ? 'diterima' : 'belum_diterima');

      return {
        id: item.id || `PAY-${idx + 1}`,
        contractId: item.contractId || null,
        invoiceNumber: item.invoiceNumber || `INV/AGR/2026/09/${String(idx + 90).padStart(4, '0')}`,
        title: item.title || item.commodity || 'Pengadaan Komoditas',
        commodity: item.commodity || item.productName || item.commodityName || 'Komoditas Pertanian',
        farmerGroup: item.farmerGroup || item.farmerName || 'Kelompok Tani',
        farmerName: item.farmerName || item.farmerGroup || 'Kelompok Tani',
        farmerAvatar: item.farmerAvatar || item.avatar || null,
        farmerLeader: item.farmerLeader || 'Ketua Poktan',
        weightKg: item.weightKg || (item.volumeTon ? item.volumeTon * 1000 : 10000),
        pricePerKg: item.pricePerKg || (item.amount && item.weightKg ? Math.round(item.amount / item.weightKg) : 50000),
        amount: item.amount || (item.weightKg && item.pricePerKg ? item.weightKg * item.pricePerKg : 100000000),
        status: item.status === 'Dibatalkan' ? 'Dibatalkan' : (item.status === 'Selesai' || rawGoodsStatus === 'diterima' ? 'Selesai' : 'Berjalan'),
        goodsStatus: rawGoodsStatus,
        receivedAt: item.receivedAt || null,
        method: item.method || 'Transfer Bank',
        bankName: item.bankName || (item.method === 'QRIS' ? 'QRIS Standar Nasional' : 'Bank Mandiri'),
        vaNumber: item.vaNumber || (item.method === 'QRIS' ? 'QRIS-ID-88291049281' : `89201-15600192837${idx}`),
        accountHolder: item.accountHolder || 'PT Penjamin Transaksi Pangan Indonesia (Escrow Resmi)',
        dueDate: item.dueDate || '26 September 2026, 23:59',
        createdAt: item.createdAt || '24 September 2026, 09:15 WITA',
        createdAtISO: createdMs !== null ? new Date(createdMs).toISOString() : null,
        paidDate: item.paidDate || (item.status === 'Selesai' || rawGoodsStatus === 'diterima' || ['Pembayaran Berhasil', 'Lunas', 'Diproses', 'Pelunasan'].includes(item.status) ? '16 September 2026, 10:15 WITA' : null),
        countdownSeconds: deadlineCountdown,
        referenceNumber: item.referenceNumber || (['Pembayaran Berhasil', 'Selesai', 'Lunas'].includes(item.status) ? `REF/ESC-${20260900 + idx}` : null),
        proofUrl: item.proofUrl || null,
        buyerId: item.buyerId || null,
        farmerId: item.farmerId || null
      };
    });
  }, [payments]);

  const [localPayments, setLocalPayments] = useState(initialData);

  useEffect(() => {
    // Selalu sinkron ke source of truth (termasuk kosong) agar tidak stuck di data lama.
    setLocalPayments(initialData);
  }, [payments, initialData]);

  // Profile lookup & realtime sync untuk profil petani
  const [profileMap, setProfileMap] = useState({});

  useEffect(() => {
    const farmerIds = Array.from(new Set(localPayments.map(p => p.farmerId).filter(Boolean)));
    if (farmerIds.length === 0) return;

    let isMounted = true;
    const fetchFarmerProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', farmerIds);
        if (!error && data && isMounted) {
          const map = {};
          data.forEach(p => {
            map[p.id] = {
              fullName: p.full_name,
              avatarUrl: p.avatar_url
            };
          });
          setProfileMap(prev => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.warn('[PembayaranPembeli] Gagal memuat profil petani:', err);
      }
    };

    fetchFarmerProfiles();

    const channel = supabase
      .channel('pembayaran_farmer_profiles_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new;
          if (updated && updated.id) {
            setProfileMap(prev => ({
              ...prev,
              [updated.id]: {
                fullName: updated.full_name,
                avatarUrl: updated.avatar_url
              }
            }));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [localPayments]);

  const getFarmerInfo = (item) => {
    if (!item) return { name: 'Kelompok Tani', avatar: null, initial: 'K' };
    const prof = item.farmerId ? profileMap[item.farmerId] : null;
    const name = prof?.fullName || item.farmerName || item.farmerGroup || 'Kelompok Tani';
    const avatar = prof?.avatarUrl || item.farmerAvatar || item.avatar || null;
    const initial = (name.charAt(0) || 'P').toUpperCase();
    return { name, avatar, initial };
  };

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const isDataLoading = isLoading || propLoading;
  const [hasError, setHasError] = useState(false);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [methodFilter, setMethodFilter] = useState('Semua');
  const [sortOption, setSortOption] = useState('Terbaru');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals & Drawers State
  const [selectedDrawerItem, setSelectedDrawerItem] = useState(null);
  const [payModalItem, setPayModalItem] = useState(null);
  const [receiptModalItem, setReceiptModalItem] = useState(null);
  const [chatModalItem, setChatModalItem] = useState(null);
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [goodsReceiptModalItem, setGoodsReceiptModalItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingGoods, setIsConfirmingGoods] = useState(false);
  const [cancelReason, setCancelReason] = useState('Perubahan jadwal pengadaan');

  // Interactive feedback
  const [copiedId, setCopiedId] = useState(false);
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
  const [uploadedProof, setUploadedProof] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Live countdowns
  const [countdowns, setCountdowns] = useState(() => {
    const initialMap = {};
    initialData.forEach(p => {
      if (p.countdownSeconds !== undefined && p.countdownSeconds !== null) {
        initialMap[p.id] = p.countdownSeconds;
      }
    });
    return initialMap;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdowns(prev => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id] > 0) {
            next[id] = next[id] - 1;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds) => {
    if (seconds <= 0 || seconds == null) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // ===== Status terpadu (HANYA 3 STATUS: Selesai / Berjalan / Dibatalkan) =====
  const isPaidItem = (p) => Boolean(p.paidDate) || ['Pembayaran Berhasil', 'Selesai', 'Lunas', 'Diproses', 'Pelunasan'].includes(p.status) || p.goodsStatus === 'diterima' || (p.goodsStatus === 'belum_diterima' && Boolean(p.paidDate || p.referenceNumber));
  const isGoodsReceived = (p) => p.goodsStatus === 'diterima' || (p.status === 'Selesai' && p.goodsStatus !== 'belum_diterima');
  const isCancelledItem = (p) => p.status === 'Dibatalkan';
  const remainingSec = (p) => {
    const s = countdowns[p.id];
    if (s !== undefined && s !== null) return s;
    return p.countdownSeconds ?? null;
  };
  const isExpiredItem = (p) => {
    if (isPaidItem(p) || isCancelledItem(p)) return false;
    const s = remainingSec(p);
    return s !== null && s !== undefined && s <= 0;
  };
  const displayStatus = (p) => {
    if (isCancelledItem(p) || isExpiredItem(p)) return 'Dibatalkan';
    if (isGoodsReceived(p)) return 'Selesai';
    return 'Berjalan';
  };
  // Badge pendek metode pembayaran: QRIS / Bank / Langsung
  const payBadge = (method) => {
    const m = String(method || '');
    if (/langsung/i.test(m)) return { label: 'Langsung', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' };
    if (/qris/i.test(m)) return { label: 'QRIS', bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' };
    if (/transfer|bank|va|escrow/i.test(m)) return { label: 'Bank', bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' };
    return { label: 'Langsung', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' };
  };
  const isDirectPay = (p) => /langsung/i.test(String(p.method || ''));
  const deadlineDateLabel = (p) => {
    if (p.createdAtISO) {
      const d = new Date(new Date(p.createdAtISO).getTime() + PAYMENT_DEADLINE_MS);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
    }
    return String(p.dueDate || '-').split(',')[0];
  };
  const remainingLabel = (p) => {
    const s = remainingSec(p);
    if (s === null || s === undefined) return '1 hari';
    if (s <= 0) return 'Kedaluwarsa';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h >= 24) return `${Math.floor(h / 24)} hari`;
    if (h > 0) return `${h} jam ${m} mnt`;
    if (m > 0) return `${m} mnt`;
    return `${s} dtk`;
  };

  // Sinkron countdown untuk item yang datang belakangan (tanpa menimpa timer berjalan).
  useEffect(() => {
    setCountdowns(prev => {
      let changed = false;
      const next = { ...prev };
      localPayments.forEach(p => {
        if (next[p.id] === undefined && p.countdownSeconds !== undefined && p.countdownSeconds !== null) {
          next[p.id] = p.countdownSeconds;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [localPayments]);

  // Batal otomatis: lewat 1 hari belum selesai -> status Dibatalkan (lokal + DB).
  const autoCancelledRef = useRef(new Set());
  const isUuidLike = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v || '');
  useEffect(() => {
    const expired = localPayments.filter(p => {
      if (isPaidItem(p) || isCancelledItem(p) || autoCancelledRef.current.has(p.id)) return false;
      const s = countdowns[p.id];
      const secs = (s !== undefined && s !== null) ? s : p.countdownSeconds;
      return secs !== null && secs !== undefined && secs <= 0;
    });
    if (expired.length === 0) return;
    expired.forEach(p => autoCancelledRef.current.add(p.id));
    setLocalPayments(prev => prev.map(p => (
      autoCancelledRef.current.has(p.id) && !isPaidItem(p) && !isCancelledItem(p)
        ? { ...p, status: 'Dibatalkan' }
        : p
    )));
    expired.forEach(async (p) => {
      try {
        const q = supabase.from('transactions').update({ status: 'Dibatalkan' });
        if (isUuidLike(p.id)) await q.eq('id', p.id);
        else await q.eq('transaction_code', p.id);
        // Stok kembali ke komoditas agar bisa ditawarkan lagi (idempoten via flag offer).
        await restoreStockForTransaction(p.id);
        // Sinkron: offer terkait ikut Dibatalkan agar tidak hantu Diterima di kedua dashboard.
        if (p.contractId) await markOfferCancelledByContract(p.contractId);
      } catch (err) {
        console.warn('Gagal batal otomatis di Supabase:', err);
      }
    });
    showToast(`${expired.length} transaksi kedaluwarsa dibatalkan otomatis (melewati 1 hari).`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdowns]);

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Re-generate expired payment
  const handleRegenerate = (item) => {
    setCountdowns(prev => ({ ...prev, [item.id]: 86400 }));
    setLocalPayments(prev => prev.map(p => {
      if (p.id === item.id) {
        return { ...p, status: 'Menunggu Pembayaran', countdownSeconds: 86400 };
      }
      return p;
    }));
    showToast(`Batas waktu tagihan ${item.invoiceNumber} diperpanjang 24 jam.`);
  };

  // Cancel transaction logic
  const handleConfirmCancel = async () => {
    if (!cancelModalItem) return;
    setLocalPayments(prev => prev.map(p => {
      if (p.id === cancelModalItem.id) {
        return { ...p, status: 'Dibatalkan' };
      }
      return p;
    }));
    if (selectedDrawerItem?.id === cancelModalItem.id) {
      setSelectedDrawerItem(prev => ({ ...prev, status: 'Dibatalkan' }));
    }

    try {
      if (cancelModalItem.id) {
        // Hanya kolom yang ada (status); payment_status tidak ada di DB dan .or() UUID-vs-code bikin gagal total.
        const q = supabase.from('transactions').update({ status: 'Dibatalkan' });
        if (isUuidLike(cancelModalItem.id)) await q.eq('id', cancelModalItem.id);
        else await q.eq('transaction_code', cancelModalItem.id);
        // Stok kembali ke komoditas agar bisa ditawarkan lagi (idempoten via flag offer).
        await restoreStockForTransaction(cancelModalItem.id);
        // Sinkron: offer terkait ikut Dibatalkan.
        if (cancelModalItem.contractId) await markOfferCancelledByContract(cancelModalItem.contractId);
      }
    } catch (err) {
      console.warn('Gagal membatalkan transaksi di Supabase:', err);
    }

    // Trigger Notification: Transaksi Dibatalkan
    const buyerId = cancelModalItem.buyerId || (() => {
      try {
        const stored = localStorage.getItem('agriconnect_auth_user');
        return stored ? JSON.parse(stored)?.id : null;
      } catch (e) { return null; }
    })();

    notifyOrderStatusChanged({
      buyerId,
      farmerId: cancelModalItem.farmerId,
      commodityName: cancelModalItem.commodity || cancelModalItem.title || 'Komoditas',
      newStatus: 'cancelled',
      orderId: cancelModalItem.id
    }).catch(e => console.warn('Notification cancel error:', e));

    showToast(`Transaksi ${cancelModalItem.invoiceNumber} berhasil dibatalkan.`);
    setCancelModalItem(null);
  };

  // Integrasi Midtrans Snap Sandbox (TASK 7)
  const handlePayWithMidtrans = async (targetItem) => {
    const item = targetItem || payModalItem;
    if (!item) return;

    const itemId = item.dbId || item.id;
    setProcessingPaymentId(itemId);
    setIsProcessingPay(true);
    try {
      const trxIdentifier = itemId;
      const { data, error } = await supabase.functions.invoke('create-midtrans-transaction', {
        body: { 
          transaction_id: trxIdentifier,
          payment_method: item.method,
          bank_name: item.bankName,
          force_new: true
        }
      });

      if (error || !data?.token) {
        let detailedMsg = error?.message;
        if (error && error.context) {
          try {
            const errBody = await error.context.json();
            detailedMsg = errBody?.error || errBody?.details || errBody?.message || detailedMsg;
          } catch (_) {}
        }
        const errorMsg = data?.error || data?.details || detailedMsg || 'Gagal memulai transaksi Midtrans';
        throw new Error(errorMsg);
      }

      const snapToken = data.token;

      if (window.snap && typeof window.snap.pay === 'function') {
        window.snap.pay(snapToken, {
          onSuccess: function (result) {
            showToast(`Pembayaran ${item.invoiceNumber} berhasil diproses!`);
            setPayModalItem(null);
            setProcessingPaymentId(null);
            window.dispatchEvent(new CustomEvent('agriconnect:refresh-transactions'));
          },
          onPending: function (result) {
            showToast(`Menunggu penyelesaian pembayaran ${item.invoiceNumber}.`);
            setPayModalItem(null);
            setProcessingPaymentId(null);
            window.dispatchEvent(new CustomEvent('agriconnect:refresh-transactions'));
          },
          onError: function (result) {
            console.warn('[Midtrans] Error callback:', result);
            showToast(`Pembayaran ${item.invoiceNumber} gagal atau dibatalkan.`);
            setProcessingPaymentId(null);
            window.dispatchEvent(new CustomEvent('agriconnect:refresh-transactions'));
          },
          onClose: function () {
            setProcessingPaymentId(null);
            showToast('Jendela pembayaran Snap ditutup.');
          }
        });
      } else if (data.redirect_url) {
        setProcessingPaymentId(null);
        window.open(data.redirect_url, '_blank');
        showToast('Membuka tautan pembayaran Midtrans di tab baru...');
      } else {
        throw new Error('Snap SDK Midtrans belum siap di peramban. Silakan muat ulang halaman.');
      }
    } catch (err) {
      console.error('[PembayaranPembeli] Gagal Midtrans Pay:', err);
      showToast(`Kendala pembayaran: ${err.message || err}`);
    } finally {
      setIsProcessingPay(false);
      setProcessingPaymentId(null);
    }
  };

  // Hapus permanen riwayat transaksi dari database dan state lokal
  const handleDeletePaymentHistory = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      const targetId = deleteConfirmItem.id;
      let q = supabase.from('transactions').delete();
      if (isUuidLike(targetId)) q = q.eq('id', targetId);
      else q = q.eq('transaction_code', targetId);
      const { error } = await q;

      if (error) {
        console.warn('[PembayaranPembeli] Error delete transaction from Supabase:', error);
        throw error;
      }

      setLocalPayments(prev => prev.filter(p => p.id !== targetId));
      if (selectedDrawerItem?.id === targetId) {
        setSelectedDrawerItem(null);
      }
      setSelectedTransactionIds(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      showToast(`Riwayat transaksi ${deleteConfirmItem.invoiceNumber} berhasil dihapus permanen.`);
      setDeleteConfirmItem(null);
      window.dispatchEvent(new CustomEvent('agriconnect:refresh-transactions'));
    } catch (err) {
      console.error('[PembayaranPembeli] Gagal menghapus riwayat transaksi:', err);
      showToast(`Gagal menghapus riwayat: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Hapus massal riwayat transaksi yang dipilih
  const handleConfirmBulkDelete = async () => {
    if (selectedTransactionIds.size === 0) return;
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedTransactionIds);
    try {
      const uuidIds = idsToDelete.filter(isUuidLike);
      const codeIds = idsToDelete.filter(id => !isUuidLike(id));

      if (uuidIds.length > 0) {
        const { error } = await supabase.from('transactions').delete().in('id', uuidIds);
        if (error) {
          console.warn('[PembayaranPembeli] Error bulk delete UUIDs from Supabase:', error);
          throw error;
        }
      }
      if (codeIds.length > 0) {
        const { error } = await supabase.from('transactions').delete().in('transaction_code', codeIds);
        if (error) {
          console.warn('[PembayaranPembeli] Error bulk delete codes from Supabase:', error);
          throw error;
        }
      }

      const deletedSet = new Set(idsToDelete);
      setLocalPayments(prev => prev.filter(p => !deletedSet.has(p.id)));
      if (selectedDrawerItem && deletedSet.has(selectedDrawerItem.id)) {
        setSelectedDrawerItem(null);
      }

      showToast(`${idsToDelete.length} riwayat transaksi berhasil dihapus permanen.`);
      setSelectedTransactionIds(new Set());
      setBulkDeleteModalOpen(false);
      window.dispatchEvent(new CustomEvent('agriconnect:refresh-transactions'));
    } catch (err) {
      console.error('[PembayaranPembeli] Gagal hapus massal transaksi:', err);
      showToast(`Gagal menghapus riwayat: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Confirm payment in modal (Pembayaran berhasil, transaksi lanjut ke status Diproses / Menunggu Penerimaan Barang)
  const handleConfirmPayment = async () => {
    if (!payModalItem) return;
    setIsProcessingPay(true);

    const nowFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';

    const generatedRef = `REF/${payModalItem.method === 'QRIS' ? 'QRS' : 'MDR'}-${Date.now().toString().slice(-6)}`;

    try {
      if (payModalItem.id) {
        // Status transaksi saat pembayaran berhasil: 'Berjalan' & goods_status = 'belum_diterima'
        // (Transaksi BELUM selesai, menunggu konfirmasi penerimaan barang dari pembeli)
        let q = supabase.from('transactions').update({ 
          status: 'Berjalan',
          goods_status: 'belum_diterima'
        });
        if (isUuidLike(payModalItem.id)) await q.eq('id', payModalItem.id);
        else await q.eq('transaction_code', payModalItem.id);
        const { error } = await q;
        if (error) {
          console.warn('Fallback update Supabase status transaksi:', error.message);
          let fallbackQ = supabase.from('transactions').update({ status: 'Berjalan' });
          if (isUuidLike(payModalItem.id)) await fallbackQ.eq('id', payModalItem.id);
          else await fallbackQ.eq('transaction_code', payModalItem.id);
          await fallbackQ;
        }
      }
    } catch (err) {
      console.warn('Gagal update transaksi ke Supabase:', err);
    }

    setTimeout(() => {
      setLocalPayments(prev => prev.map(p => {
        if (p.id === payModalItem.id) {
          return {
            ...p,
            status: 'Berjalan',
            goodsStatus: 'belum_diterima',
            paidDate: nowFormatted,
            referenceNumber: generatedRef,
            proofUrl: uploadedProof || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
          };
        }
        return p;
      }));

      if (selectedDrawerItem?.id === payModalItem.id) {
        setSelectedDrawerItem(prev => ({
          ...prev,
          status: 'Berjalan',
          goodsStatus: 'belum_diterima',
          paidDate: nowFormatted,
          referenceNumber: generatedRef
        }));
      }

      // Trigger Notification: Pembayaran Berhasil (Pembeli & Petani)
      const buyerId = payModalItem.buyerId || (() => {
        try {
          const stored = localStorage.getItem('agriconnect_auth_user');
          return stored ? JSON.parse(stored)?.id : null;
        } catch (e) { return null; }
      })();

      if (payModalItem.method === 'Pembayaran Langsung') {
        notifyDirectPaymentSelected({
          farmerId: payModalItem.farmerId,
          commodityName: payModalItem.commodity || payModalItem.title || 'Komoditas',
          orderId: payModalItem.id
        }).catch(e => console.warn('Notification direct pay error:', e));
      } else {
        notifyPaymentSuccess({
          buyerId,
          farmerId: payModalItem.farmerId,
          commodityName: payModalItem.commodity || payModalItem.title || 'Komoditas',
          orderId: payModalItem.id
        }).catch(e => console.warn('Notification pay success error:', e));
      }

      setIsProcessingPay(false);
      setPayModalItem(null);
      setUploadedProof(null);
      showToast(`Pembayaran ${payModalItem.invoiceNumber} berhasil. Status transaksi: Berjalan (Barang belum diterima).`);
    }, 1100);
  };

  // Ubah status barang ('belum_diterima' vs 'diterima')
  const handleSetGoodsStatus = async (item, targetGoodsStatus) => {
    if (!item) return;

    if (targetGoodsStatus === 'diterima') {
      if (!isPaidItem(item)) {
        showToast('Selesaikan pembayaran terlebih dahulu sebelum konfirmasi barang diterima.');
        return;
      }
      setGoodsReceiptModalItem(item);
      return;
    }

    // Jika target adalah 'belum_diterima'
    if (!isGoodsReceived(item)) {
      showToast('Status barang sudah Belum Diterima (Transaksi Berjalan).');
      return;
    }

    try {
      await updateGoodsStatusInSupabase(item.id, 'belum_diterima');
      if (item.contractId) {
        try {
          await supabase.from('contracts').update({ status: 'Terikat' }).eq('id', item.contractId);
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Gagal ubah status barang di Supabase:', err);
    }

    setLocalPayments(prev => prev.map(p => {
      if (p.id === item.id) {
        return {
          ...p,
          status: 'Berjalan',
          goodsStatus: 'belum_diterima',
          receivedAt: null,
          receivedDate: null
        };
      }
      return p;
    }));

    if (selectedDrawerItem?.id === item.id) {
      setSelectedDrawerItem(prev => ({
        ...prev,
        status: 'Berjalan',
        goodsStatus: 'belum_diterima',
        receivedAt: null,
        receivedDate: null
      }));
    }

    showToast('Status barang diubah menjadi Belum Diterima. Status transaksi kembali Berjalan.');
  };

  // Konfirmasi Penerimaan Barang oleh Pembeli (Transaksi resmi menjadi Selesai)
  const handleConfirmGoodsReceipt = async (item) => {
    if (!item) return;
    setIsConfirmingGoods(true);

    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';

    try {
      await updateGoodsStatusInSupabase(item.id, 'diterima');

      if (item.contractId) {
        try {
          await supabase.from('contracts').update({ status: 'Selesai' }).eq('id', item.contractId);
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Gagal konfirmasi penerimaan barang di Supabase:', err);
    }

    setLocalPayments(prev => prev.map(p => {
      if (p.id === item.id) {
        return {
          ...p,
          status: 'Selesai',
          goodsStatus: 'diterima',
          receivedAt: nowIso,
          receivedDate: nowFormatted
        };
      }
      return p;
    }));

    if (selectedDrawerItem?.id === item.id) {
      setSelectedDrawerItem(prev => ({
        ...prev,
        status: 'Selesai',
        goodsStatus: 'diterima',
        receivedAt: nowIso,
        receivedDate: nowFormatted
      }));
    }

    try {
      notifyOrderStatusChanged({
        buyerId: item.buyerId,
        farmerId: item.farmerId,
        commodityName: item.commodity || item.title || 'Komoditas',
        newStatus: 'completed',
        orderId: item.id
      });
    } catch (e) {}

    setIsConfirmingGoods(false);
    setGoodsReceiptModalItem(null);
    showToast(`Konfirmasi berhasil! Barang telah diterima. Transaksi selesai telah dipindahkan ke halaman Riwayat Transaksi.`);
    if (onNavigate) {
      setTimeout(() => onNavigate('riwayat-transaksi'), 1200);
    }
  };

  // Summary Metrics calculations (Transaksi Selesai berada di Riwayat Transaksi)
  const summaryMetrics = useMemo(() => {
    const activeList = localPayments.filter(p => displayStatus(p) !== 'Selesai');
    const total = activeList.length;
    const berjalan = localPayments.filter(p => displayStatus(p) === 'Berjalan').length;
    const selesai = localPayments.filter(p => displayStatus(p) === 'Selesai').length;
    const dibatalkan = localPayments.filter(p => displayStatus(p) === 'Dibatalkan').length;
    return { total, waiting: berjalan, inProgress: berjalan, completed: selesai, berjalan, selesai, dibatalkan };
  }, [localPayments, countdowns]);

  // Filter & Sort Logic (Transaksi yang sudah selesai dipindahkan ke Riwayat Transaksi)
  const filteredPayments = useMemo(() => {
    return localPayments
      .filter(item => {
        // Pindahkan transaksi yang sudah selesai ke halaman Riwayat Transaksi
        if (displayStatus(item) === 'Selesai') return false;

        if (statusFilter !== 'Semua') {
          if (displayStatus(item) !== statusFilter) return false;
        }

        if (methodFilter !== 'Semua') {
          if (item.method !== methodFilter) return false;
        }

        const query = searchQuery.trim().toLowerCase();
        if (query) {
          const farmerInfo = getFarmerInfo(item);
          const matchInvoice = item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(query);
          const matchCommodity = item.commodity && item.commodity.toLowerCase().includes(query);
          const matchFarmer = (farmerInfo.name && farmerInfo.name.toLowerCase().includes(query)) ||
                              (item.farmerGroup && item.farmerGroup.toLowerCase().includes(query));
          if (!matchInvoice && !matchCommodity && !matchFarmer) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'Terbaru') return b.id.localeCompare(a.id);
        if (sortOption === 'Terlama') return a.id.localeCompare(b.id);
        if (sortOption === 'Nilai Terbesar') return b.amount - a.amount;
        if (sortOption === 'Nilai Terkecil') return a.amount - b.amount;
        return 0;
      });
  }, [localPayments, statusFilter, methodFilter, searchQuery, sortOption, countdowns, profileMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, methodFilter, sortOption]);

  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Transaksi berstatus Dibatalkan yang dapat dipilih untuk dihapus
  const deletablePayments = useMemo(() => {
    return filteredPayments.filter(p => displayStatus(p) === 'Dibatalkan');
  }, [filteredPayments, countdowns]);

  const isAllSelected = deletablePayments.length > 0 && deletablePayments.every(p => selectedTransactionIds.has(p.id));

  const handleToggleSelectAll = (e) => {
    e?.stopPropagation();
    if (isAllSelected) {
      setSelectedTransactionIds(new Set());
    } else {
      const next = new Set();
      deletablePayments.forEach(p => next.add(p.id));
      setSelectedTransactionIds(next);
    }
  };

  const handleToggleSelect = (id, e) => {
    e?.stopPropagation();
    setSelectedTransactionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setSelectedTransactionIds(new Set());
  }, [statusFilter, searchQuery]);

  // Status visual badge (3 status terpadu: Berjalan, Selesai, Dibatalkan)
  const renderStatusBadge = (status, isExpired) => {
    if (isExpired || status === 'Dibatalkan') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          fontWeight: 700,
          background: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fee2e2'
        }}>
          <X size={13} weight="bold" />
          <span>Dibatalkan</span>
        </span>
      );
    }
    if (status === 'Selesai') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          fontWeight: 700,
          background: '#f0fdf4',
          color: '#15803d',
          border: '1px solid #bbf7d0'
        }}>
          <ShieldCheck size={13} weight="fill" />
          <span>Selesai</span>
        </span>
      );
    }
    // Default: 'Berjalan'
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '0.74rem',
        fontWeight: 700,
        background: '#eff2fe',
        color: '#5452f6',
        border: '1px solid #dbe4fe'
      }}>
        <Clock size={13} weight="bold" />
        <span>Berjalan</span>
      </span>
    );
  };

  // Helper for Payment Method Badge
  const renderMethodBadge = (method) => {
    let icon = <Bank size={14} weight="bold" color="#5452f6" />;
    if (method === 'QRIS') icon = <QrCode size={14} weight="bold" color="#0284c7" />;
    if (method === 'Pembayaran Langsung') icon = <Money size={14} weight="bold" color="#10b981" />;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.78rem',
        color: '#334155',
        fontWeight: 600,
        background: '#ffffff',
        padding: '3px 8px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0'
      }}>
        {icon}
        <span>{method}</span>
      </span>
    );
  };

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '0 0.5rem 3rem 0.5rem',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#0f172a'
    }}>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 10000,
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '0.84rem',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderLeft: '4px solid #5452f6'
        }}>
          <CheckCircle size={18} weight="fill" color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      

      {/* ================= 1. HEADER HALAMAN ================= */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        paddingBottom: '0.25rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.025em'
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: '#64748b',
            margin: '4px 0 0 0',
            fontWeight: 400
          }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* ================= SEARCH & STATUS FILTER BAR ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
          <MagnifyingGlass 
            size={18} 
            weight="bold" 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID transaksi atau komoditas..."
            style={{
              width: '100%',
              height: '42px',
              padding: '0 2.2rem 0 2.6rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.84rem',
              outline: 'none',
              background: '#f8fafc',
              color: '#0f172a',
              transition: 'all 0.15s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#5452f6';
              e.target.style.background = '#ffffff';
              e.target.style.boxShadow = '0 0 0 3px rgba(84, 82, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = '#f8fafc';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                padding: '2px'
              }}
              title="Hapus pencarian"
            >
              <X size={15} weight="bold" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div style={{ position: 'relative', minWidth: '180px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              height: '42px',
              padding: '0 2.2rem 0 1rem',
              borderRadius: '8px',
              border: statusFilter !== 'Semua' ? '1.5px solid #5452f6' : '1px solid #e2e8f0',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: statusFilter !== 'Semua' ? '#eff2fe' : '#f8fafc',
              color: statusFilter !== 'Semua' ? '#5452f6' : '#334155',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <option value="Semua">Semua Tagihan</option>
            <option value="Berjalan">Berjalan</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: statusFilter !== 'Semua' ? '#5452f6' : '#94a3b8' }}>
            <CaretDown size={14} weight="bold" />
          </div>
        </div>

        {/* Reset Action */}
        {(statusFilter !== 'Semua' || searchQuery !== '') && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('Semua');
              setSearchQuery('');
            }}
            style={{
              height: '42px',
              padding: '0 0.85rem',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <ArrowsClockwise size={14} weight="bold" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ================= 4. TRANSACTION LIST (CARD-ROW YANG RAPI & BERWARNA) ================= */}
      {isDataLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="agri-skeleton-pulse" style={{ height: '140px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        /* Empty State */
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #eaedf3',
          padding: '4rem 1.5rem',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#eff2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#5452f6'
          }}>
            <Receipt size={28} weight="bold" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            {searchQuery || statusFilter !== 'Semua' || methodFilter !== 'Semua' ? 'Tidak Ada Transaksi yang Sesuai' : 'Belum Ada Transaksi'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem 0', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
            {searchQuery || statusFilter !== 'Semua' || methodFilter !== 'Semua' ? 'Ubah kata kunci pencarian atau sesuaikan filter untuk melihat transaksi.' : 'Tagihan pembayaran akan muncul setelah transaksi dibuat.'}
          </p>
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('eksplorasi');
              else { setStatusFilter('Semua'); setMethodFilter('Semua'); setSearchQuery(''); }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#5452f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Storefront size={16} weight="bold" />
            <span>Mulai Belanja</span>
          </button>
        </div>
      ) : (
        /* Tabel Pembayaran */
        <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle, #e8ecf1)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '1rem 1.25rem 0.8rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Daftar Pembayaran</h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Komoditas, total, pembayaran, batas waktu 1 hari, status, serta aksi.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '1180px' }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 1.25fr 1.25fr 0.9fr 0.75fr 0.95fr 0.8fr 1.05fr 1.7fr',
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
                    disabled={deletablePayments.length === 0}
                    title={
                      deletablePayments.length === 0
                        ? "Tidak ada riwayat yang dibatalkan untuk dipilih"
                        : isAllSelected
                        ? "Batalkan pilihan semua"
                        : "Pilih semua riwayat yang dibatalkan"
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
                      cursor: deletablePayments.length === 0 ? 'not-allowed' : 'pointer',
                      padding: 0,
                      opacity: deletablePayments.length === 0 ? 0.35 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isAllSelected && <Check size={11} weight="bold" color="#ffffff" />}
                  </button>
                </div>
                <span>Petani</span>
                <span>Komoditas</span>
                <span style={{ textAlign: 'right' }}>Total</span>
                <span>Pembayaran</span>
                <span>Batas Pembayaran</span>
                <span style={{ textAlign: 'center' }}>Status</span>
                <span style={{ textAlign: 'center' }}>Aksi</span>
                <span style={{ textAlign: 'center' }}>Status Barang</span>
              </div>

              {/* Body */}
              {paginatedPayments.map((item) => {
                const st = displayStatus(item);
                const pay = payBadge(item.method);
                const direct = isDirectPay(item);
                const secs = remainingSec(item);
                const urgent = st === 'Berjalan' && secs !== null && secs < 6 * 3600;
                const farmerInfo = getFarmerInfo(item);
                const isSelected = selectedTransactionIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedDrawerItem(item)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1.25fr 1.25fr 0.9fr 0.75fr 0.95fr 0.8fr 1.05fr 1.7fr',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.7rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle, #eef1f6)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(254, 242, 242, 0.65)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f8fafc)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                    title={`Lihat rincian ${item.commodity}`}
                  >
                    {/* Tombol Bulat Seleksi */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {st === 'Dibatalkan' ? (
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(item.id, e)}
                          title={isSelected ? "Batalkan pilihan" : "Pilih riwayat ini untuk dihapus"}
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
                        <span style={{ color: 'var(--text-muted, #cbd5e1)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </div>
                    {/* Petani: profil + nama saja */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, position: 'relative', overflow: 'hidden', background: '#f1f5f9' }}>
                        {farmerInfo.avatar ? (
                          <img
                            src={farmerInfo.avatar}
                            alt={farmerInfo.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#ffffff',
                            display: farmerInfo.avatar ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem'
                          }}
                        >
                          {farmerInfo.initial}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={farmerInfo.name}>
                        {farmerInfo.name}
                      </div>
                    </div>

                    {/* Komoditas */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.commodity}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.category}
                      </div>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      Rp{item.amount.toLocaleString('id-ID')}
                    </div>

                    {/* Pembayaran */}
                    <div>
                      <span
                        title={item.method}
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

                    {/* Batas Pembayaran (1 hari) */}
                    <div style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: st === 'Berjalan' && urgent ? '#b91c1c' : 'var(--text-primary)', fontWeight: st === 'Berjalan' && urgent ? 800 : 600 }}>
                      {isPaidItem(item) ? (
                        <span style={{ color: '#059669', fontWeight: 700 }}>Lunas</span>
                      ) : st === 'Dibatalkan' ? (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      ) : secs === null ? (
                        <span>1 hari</span>
                      ) : (
                        <span>{remainingLabel(item)}</span>
                      )}
                      {st === 'Berjalan' && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          s/d {deadlineDateLabel(item)}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '0.24rem 0.65rem',
                          borderRadius: '7px',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          background: st === 'Selesai'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : st === 'Berjalan'
                            ? 'rgba(59, 130, 246, 0.12)'
                            : 'rgba(239, 68, 68, 0.10)',
                          color: st === 'Selesai' ? '#059669' : st === 'Berjalan' ? '#2563eb' : '#dc2626',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {st === 'Selesai' && <CheckCircle size={12} weight="fill" />}
                        {st === 'Berjalan' && <Clock size={12} weight="bold" />}
                        {st === 'Dibatalkan' && <X size={12} weight="bold" />}
                        <span>{st}</span>
                      </span>
                    </div>

                    {/* Aksi: Bayar Sekarang (QRIS/bank belum bayar) -> Chat Sekarang (sesudah bayar / langsung) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {st === 'Dibatalkan' ? (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(item)}
                          title="Hapus riwayat transaksi yang dibatalkan secara permanen"
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: '7px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.borderColor = '#fca5a5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fef2f2';
                            e.currentTarget.style.borderColor = '#fecaca';
                          }}
                        >
                          <Trash size={13} weight="bold" />
                          <span>Hapus</span>
                        </button>
                      ) : !isPaidItem(item) && !direct ? (
                        <button
                          type="button"
                          onClick={() => handlePayWithMidtrans(item)}
                          disabled={processingPaymentId === (item.dbId || item.id)}
                          title={`Bayar ${item.commodity} langsung via Midtrans (${item.method})`}
                          style={{
                            padding: '0.45rem 0.95rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: 'none',
                            background: processingPaymentId === (item.dbId || item.id)
                              ? '#94a3b8'
                              : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                            color: '#ffffff',
                            cursor: processingPaymentId === (item.dbId || item.id) ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 7px rgba(79, 70, 229, 0.32)',
                            letterSpacing: '0.01em',
                            transition: 'all 0.18s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (processingPaymentId !== (item.dbId || item.id)) {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.45)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (processingPaymentId !== (item.dbId || item.id)) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 7px rgba(79, 70, 229, 0.32)';
                            }
                          }}
                        >
                          {processingPaymentId === (item.dbId || item.id) ? (
                            <>
                              <ArrowsClockwise size={13} className="animate-spin" />
                              <span>Membuka Snap...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={14} weight="bold" />
                              <span>Bayar Sekarang</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setChatModalItem(item)}
                          title={isPaidItem(item) ? `Chat petani soal ${item.commodity}` : 'Chat petani untuk pembayaran langsung'}
                          style={{
                            padding: '0.32rem 0.7rem',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            borderRadius: '7px',
                            border: '1px solid #5452f6',
                            background: '#5452f6',
                            color: '#ffffff',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Chat Sekarang
                        </button>
                      )}
                    </div>

                    {/* Status Barang (simbol saja; teks Diterima bila sudah diterima) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {(st === 'Dibatalkan' || !isPaidItem(item)) ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: '#f8fafc',
                          padding: '3px 5px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          {/* Simbol Belum Diterima */}
                          <button
                            type="button"
                            onClick={() => handleSetGoodsStatus(item, 'belum_diterima')}
                            title={!isGoodsReceived(item) ? "Status barang: Belum Diterima (Transaksi Berjalan)" : "Ubah status barang menjadi Belum Diterima"}
                            aria-label="Belum Diterima"
                            style={{
                              width: '26px',
                              height: '26px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              border: !isGoodsReceived(item) ? '1px solid #fde68a' : '1px solid #e2e8f0',
                              background: !isGoodsReceived(item) ? '#fffbeb' : '#ffffff',
                              color: !isGoodsReceived(item) ? '#b45309' : '#64748b',
                              boxShadow: !isGoodsReceived(item) ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Clock size={13} weight="bold" />
                          </button>

                          {/* Simbol Diterima / teks Diterima bila sudah diterima */}
                          {isGoodsReceived(item) ? (
                            <span
                              title="Barang telah diterima (Transaksi Selesai)"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: '1px solid #059669',
                                background: '#10b981',
                                color: '#ffffff',
                                boxShadow: '0 1px 3px rgba(16,185,129,0.3)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <CheckCircle size={12} weight="fill" />
                              <span>Diterima</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setGoodsReceiptModalItem(item)}
                              title="Konfirmasi barang sudah diterima"
                              aria-label="Diterima"
                              style={{
                                width: '26px',
                                height: '26px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px',
                                border: '1px solid #a7f3d0',
                                background: '#ecfdf5',
                                color: '#059669',
                                boxShadow: 'none',
                                cursor: 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <CheckCircle size={13} weight="bold" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= 5. PAGINATION ================= */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0.5rem',
            fontSize: '0.82rem',
            color: '#64748b'
          }}>
            <div>
              Menampilkan {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} dari {totalItems} transaksi
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: currentPage === p ? '1px solid #5452f6' : '1px solid #e2e8f0',
                    background: currentPage === p ? '#5452f6' : '#ffffff',
                    color: currentPage === p ? '#ffffff' : '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
              <CaretRight size={14} weight="bold" />
                </button>
              </div>
            </div>
        </div>
        )}

      {/* Floating Action Bar Seleksi Hapus Massal */}
      {selectedTransactionIds.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9950,
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '9999px',
          padding: '0.65rem 1.25rem 0.65rem 1.1rem',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          border: '1px solid rgba(255,255,255,0.1)'
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
              {selectedTransactionIds.size}
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
              {selectedTransactionIds.size} riwayat dipilih
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSelectedTransactionIds(new Set())}
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
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
              }}
            >
              <Trash size={14} weight="bold" />
              <span>Hapus Semua Terpilih</span>
            </button>
          </div>
        </div>
      )}

      

      {/* ================= 6. RIGHT-SIDE DETAIL DRAWER ================= */}
      {selectedDrawerItem && (
        <div 
          onClick={() => setSelectedDrawerItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 9990,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.12)'
            }}
          >
            {/* Header Drawer */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Detail Pembayaran
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#5452f6', fontWeight: 700, fontFamily: 'monospace' }}>
                  {selectedDrawerItem.invoiceNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDrawerItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Body Drawer */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 3 Box Ringkasan Kecil Berwarna */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.65rem',
                background: '#f8fafc',
                border: '1px solid #eaedf3',
                padding: '0.85rem',
                borderRadius: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Jumlah</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                    {selectedDrawerItem.weightKg.toLocaleString('id-ID')} kg
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Harga</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                    Rp{selectedDrawerItem.pricePerKg.toLocaleString('id-ID')}/kg
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Total</span>
                  <strong style={{ fontSize: '0.92rem', color: '#5452f6' }}>
                    Rp{selectedDrawerItem.amount.toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>

              {/* Rincian Transaksi */}
              <div style={{
                border: '1px solid #eaedf3',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Nama Komoditas</span>
                  <strong style={{ color: '#0f172a' }}>{selectedDrawerItem.commodity}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Petani</span>
                  {(() => {
                    const info = getFarmerInfo(selectedDrawerItem);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {info.avatar ? (
                          <img
                            src={info.avatar}
                            alt={info.name}
                            style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {info.initial}
                          </div>
                        )}
                        <strong style={{ color: '#0f172a' }}>{info.name}</strong>
                      </div>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Metode</span>
                  <strong style={{ color: '#0f172a' }}>{selectedDrawerItem.method}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Status Transaksi</span>
                  <div>{renderStatusBadge(displayStatus(selectedDrawerItem), false)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Status Barang</span>
                  <div>
                    {displayStatus(selectedDrawerItem) === 'Dibatalkan' ? (
                      <span style={{ color: '#64748b', fontSize: '0.78rem' }}>—</span>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '3px 4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <button
                          type="button"
                          onClick={() => handleSetGoodsStatus(selectedDrawerItem, 'belum_diterima')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            borderRadius: '5px',
                            border: !isGoodsReceived(selectedDrawerItem) ? '1px solid #fde68a' : '1px solid transparent',
                            background: !isGoodsReceived(selectedDrawerItem) ? '#fffbeb' : 'transparent',
                            color: !isGoodsReceived(selectedDrawerItem) ? '#b45309' : '#64748b',
                            cursor: 'pointer'
                          }}
                        >
                          Belum Diterima
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetGoodsStatus(selectedDrawerItem, 'diterima')}
                          style={{
                            padding: '3px 9px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            borderRadius: '5px',
                            border: isGoodsReceived(selectedDrawerItem) ? '1px solid #059669' : '1px solid #a7f3d0',
                            background: isGoodsReceived(selectedDrawerItem) ? '#10b981' : '#ecfdf5',
                            color: isGoodsReceived(selectedDrawerItem) ? '#ffffff' : '#059669',
                            cursor: 'pointer'
                          }}
                        >
                          Diterima
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {selectedDrawerItem.receivedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tanggal Diterima</span>
                    <span style={{ color: '#047857', fontWeight: 600 }}>
                      {selectedDrawerItem.receivedDate || new Date(selectedDrawerItem.receivedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Tanggal Transaksi</span>
                  <span style={{ color: '#334155' }}>{selectedDrawerItem.createdAt}</span>
                </div>
                {selectedDrawerItem.status === 'Menunggu Pembayaran' ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Jatuh Tempo</span>
                    <span style={{ color: '#b45309', fontWeight: 700 }}>{selectedDrawerItem.dueDate}</span>
                  </div>
                ) : selectedDrawerItem.paidDate ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Tanggal Pembayaran</span>
                      <span style={{ color: '#047857', fontWeight: 600 }}>{selectedDrawerItem.paidDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Nomor Referensi</span>
                      <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedDrawerItem.referenceNumber}</span>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Riwayat Status Timeline */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.85rem 0' }}>
                  Riwayat Status
                </h4>
                {selectedDrawerItem.status === 'Dibatalkan' ? (
                  <div style={{ padding: '0.85rem', background: '#fef2f2', borderRadius: '8px', color: '#b91c1c', fontSize: '0.8rem' }}>
                    Transaksi ini telah dibatalkan.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingLeft: '0.25rem' }}>
                    {[
                      { label: 'Transaksi dibuat', isDone: true, isCurrent: false },
                      { 
                        label: 'Menunggu pembayaran', 
                        isDone: isPaidItem(selectedDrawerItem),
                        isCurrent: !isPaidItem(selectedDrawerItem) && selectedDrawerItem.status !== 'Dibatalkan'
                      },
                      { 
                        label: 'Pembayaran berhasil', 
                        isDone: isPaidItem(selectedDrawerItem),
                        isCurrent: isPaidItem(selectedDrawerItem) && !isGoodsReceived(selectedDrawerItem)
                      },
                      { 
                        label: 'Penerimaan barang', 
                        isDone: isGoodsReceived(selectedDrawerItem),
                        isCurrent: isPaidItem(selectedDrawerItem) && !isGoodsReceived(selectedDrawerItem)
                      },
                      { 
                        label: 'Transaksi selesai', 
                        isDone: isGoodsReceived(selectedDrawerItem),
                        isCurrent: isGoodsReceived(selectedDrawerItem)
                      }
                    ].map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: step.isDone ? '#ecfdf5' : step.isCurrent ? '#eff2fe' : '#f8fafc',
                          border: step.isDone ? '1.5px solid #10b981' : step.isCurrent ? '1.5px solid #5452f6' : '1px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: step.isDone ? '#10b981' : step.isCurrent ? '#5452f6' : '#94a3b8',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {step.isDone ? <Check size={12} weight="bold" /> : idx + 1}
                        </div>
                        <span style={{
                          fontSize: '0.82rem',
                          fontWeight: step.isCurrent ? 700 : step.isDone ? 600 : 400,
                          color: step.isCurrent ? '#0f172a' : step.isDone ? '#334155' : '#94a3b8'
                        }}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Drawer */}
            <div style={{
              padding: '1.15rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              {selectedDrawerItem.status === 'Menunggu Pembayaran' && (
                <button
                  type="button"
                  onClick={() => setCancelModalItem(selectedDrawerItem)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                >
                  Batalkan Transaksi
                </button>
              )}

              {displayStatus(selectedDrawerItem) === 'Dibatalkan' && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedDrawerItem;
                    setSelectedDrawerItem(null);
                    setDeleteConfirmItem(target);
                  }}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '0.45rem 0.85rem',
                    color: '#dc2626',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Trash size={14} weight="bold" />
                  <span>Hapus Riwayat</span>
                </button>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDrawerItem(null)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>

                {selectedDrawerItem.status === 'Menunggu Pembayaran' && (
                  selectedDrawerItem.method === 'Pembayaran Langsung' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedDrawerItem;
                        setSelectedDrawerItem(null);
                        setChatModalItem(target);
                      }}
                      style={{
                        background: '#5452f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(84, 82, 246, 0.25)'
                      }}
                    >
                      Chat Sekarang
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedDrawerItem;
                        handlePayWithMidtrans(target);
                      }}
                      disabled={isProcessingPay}
                      style={{
                        background: isProcessingPay
                          ? '#94a3b8'
                          : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.55rem 1.35rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: isProcessingPay ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      {isProcessingPay ? (
                        <>
                          <ArrowsClockwise size={14} className="animate-spin" />
                          <span>Membuka Snap...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={15} weight="bold" />
                          <span>Bayar Sekarang</span>
                        </>
                      )}
                    </button>
                  )
                )}

                {isPaidItem(selectedDrawerItem) && !isGoodsReceived(selectedDrawerItem) && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedDrawerItem;
                      setGoodsReceiptModalItem(target);
                    }}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1.15rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>Konfirmasi Terima Barang</span>
                  </button>
                )}

                {(isPaidItem(selectedDrawerItem) || isGoodsReceived(selectedDrawerItem)) && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedDrawerItem;
                      setSelectedDrawerItem(null);
                      setReceiptModalItem(target);
                    }}
                    style={{
                      background: '#5452f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Lihat Bukti
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      

      {/* ================= 7. MODAL BAYAR SEKARANG (TRANSFER BANK & QRIS) ================= */}
      {payModalItem && (
        <div 
          onClick={() => setPayModalItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.85rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '430px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #eaedf3',
              boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
              overflow: 'hidden'
            }}
          >
            {/* Header Modal (Compact & Pinned) */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Pembayaran: {payModalItem.method}
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#5452f6', fontWeight: 700, fontFamily: 'monospace' }}>
                  {payModalItem.invoiceNumber}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setPayModalItem(null)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#94a3b8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '6px'
                }}
                title="Tutup"
              >
                <X size={17} weight="bold" />
              </button>
            </div>

            {/* Body Modal (Scrollable if height exceeds screen) */}
            <div style={{
              padding: '1rem 1.25rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {/* Total Box (Compact) */}
              <div style={{
                textAlign: 'center',
                padding: '0.75rem 1rem',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #eef2f6'
              }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Total Pembayaran
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 4px' }}>
                  Rp{payModalItem.amount.toLocaleString('id-ID')}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  color: '#b45309',
                  fontWeight: 700,
                  background: '#fef3c7',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  <Clock size={12} weight="bold" />
                  <span>Sisa Waktu: {formatCountdown(countdowns[payModalItem.id] || 29555)}</span>
                </div>
              </div>

              {payModalItem.method === 'Transfer Bank' ? (
                <div style={{ border: '1px solid #eaedf3', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Bank Tujuan</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    {payModalItem.bankName} (Virtual Account Escrow)
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Nomor Virtual Account</div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginTop: '3px'
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                      {payModalItem.vaNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(payModalItem.vaNumber)}
                      style={{
                        background: copiedId ? '#ecfdf5' : '#eff2fe',
                        border: 'none',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: copiedId ? '#047857' : '#5452f6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {copiedId ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
                      <span>{copiedId ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                    Atas Nama: <strong style={{ color: '#0f172a' }}>{payModalItem.accountHolder}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.6rem',
                    background: '#ffffff',
                    border: '1px solid #eaedf3',
                    borderRadius: '10px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}>
                    <svg width="115" height="115" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="200" fill="#ffffff" rx="6" />
                      <rect x="20" y="20" width="50" height="50" rx="3" fill="#0f172a" />
                      <rect x="28" y="28" width="34" height="34" rx="2" fill="#ffffff" />
                      <rect x="36" y="36" width="18" height="18" rx="1" fill="#5452f6" />
                      <rect x="130" y="20" width="50" height="50" rx="3" fill="#0f172a" />
                      <rect x="138" y="28" width="34" height="34" rx="2" fill="#ffffff" />
                      <rect x="146" y="36" width="18" height="18" rx="1" fill="#5452f6" />
                      <rect x="20" y="130" width="50" height="50" rx="3" fill="#0f172a" />
                      <rect x="28" y="138" width="34" height="34" rx="2" fill="#ffffff" />
                      <rect x="36" y="146" width="18" height="18" rx="1" fill="#5452f6" />
                      <rect x="80" y="25" width="15" height="15" fill="#0f172a" />
                      <rect x="100" y="45" width="20" height="15" fill="#0f172a" />
                      <rect x="80" y="80" width="40" height="12" fill="#0f172a" />
                      <rect x="25" y="85" width="20" height="15" fill="#0f172a" />
                      <rect x="135" y="85" width="35" height="15" fill="#0f172a" />
                      <rect x="85" y="135" width="25" height="25" fill="#0f172a" />
                      <rect x="125" y="140" width="45" height="15" fill="#0f172a" />
                      <circle cx="100" cy="100" r="14" fill="#ffffff" />
                      <circle cx="100" cy="100" r="11" fill="#5452f6" />
                      <text x="100" y="104" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">TG</text>
                    </svg>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                      NMID: ID1020293847291
                    </div>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '4px 0 0 0' }}>
                    Pindai via BCA Mobile, Livin, BRImo, BNI, GoPay, atau OVO.
                  </p>
                </div>
              )}

              {/* Upload Proof (Compact) */}
              <div>
                <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                  Lampiran Bukti Transfer (Opsional)
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setUploadedProof(e.target.files?.[0]?.name || null)}
                  style={{ fontSize: '0.74rem', color: '#64748b', width: '100%' }}
                />
              </div>

              {payModalItem.method !== 'Pembayaran Langsung' && (
                <div style={{
                  padding: '0.55rem 0.85rem',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <ShieldCheck size={16} weight="bold" color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '0.72rem', color: '#1e40af', lineHeight: 1.35 }}>
                    <strong>Simulasi Midtrans Sandbox:</strong> Klik tombol biru di bawah untuk membuka pop-up interaktif Midtrans Snap resmi (VA BCA/BRI/BNI/Mandiri & QRIS tanpa uang asli).
                  </span>
                </div>
              )}
            </div>

            {/* Actions / Bottom Bar (Pinned & Fully Visible) */}
            <div style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              gap: '0.65rem',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setPayModalItem(null)}
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (payModalItem.method === 'Pembayaran Langsung') {
                    handleConfirmPayment();
                  } else {
                    handlePayWithMidtrans(payModalItem);
                  }
                }}
                disabled={isProcessingPay}
                style={{
                  flex: 1.6,
                  background: isProcessingPay
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.62rem 1rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: isProcessingPay ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.18s ease'
                }}
              >
                {isProcessingPay ? (
                  <>
                    <ArrowsClockwise size={14} className="animate-spin" />
                    <span>Menghubungkan Midtrans...</span>
                  </>
                ) : payModalItem.method === 'Pembayaran Langsung' ? (
                  'Konfirmasi Koordinasi'
                ) : (
                  <>
                    <CreditCard size={15} weight="bold" />
                    <span>Buka Midtrans Snap Sandbox</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      

      {/* ================= 8. MODAL CHAT KOORDINASI ================= */}
      {chatModalItem && (
        <div 
          onClick={() => setChatModalItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
              width: '100%',
              maxWidth: '500px',
              border: '1px solid #eaedf3',
              boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#eff2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#5452f6' }}>
                  Chat: {getFarmerInfo(chatModalItem).name}
                </h3>
                <span style={{ fontSize: '0.76rem', color: '#475569' }}>
                  Koordinasi Waktu & Detail Pembayaran Langsung
                </span>
              </div>
              <button type="button" onClick={() => setChatModalItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} weight="bold" />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Context Tagihan */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #eaedf3',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.8rem'
              }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{chatModalItem.commodity}</div>
                <div style={{ color: '#64748b', marginTop: '2px' }}>
                  {chatModalItem.weightKg.toLocaleString('id-ID')} kg • Rp{chatModalItem.pricePerKg.toLocaleString('id-ID')}/kg • Total <strong>Rp{chatModalItem.amount.toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Pesan untuk Petani:
              </label>
              <textarea
                rows={4}
                defaultValue={`Halo, saya ingin mengatur waktu dan tempat pertemuan untuk pembayaran dan pengambilan ${chatModalItem.commodity} sebanyak ${chatModalItem.weightKg.toLocaleString('id-ID')} kg.`}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  color: '#0f172a',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setChatModalItem(null)}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const recipientName = getFarmerInfo(chatModalItem).name;
                    setChatModalItem(null);
                    if (onNavigate) onNavigate('pesan');
                    else showToast(`Pesan terkirim ke ${recipientName}.`);
                  }}
                  style={{
                    flex: 1.5,
                    background: '#5452f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(84, 82, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ChatCircleDots size={16} weight="bold" />
                  <span>Kirim Pesan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* ================= 9. MODAL BUKTI PEMBAYARAN RESMI ================= */}
      {receiptModalItem && (
        <div 
          onClick={() => setReceiptModalItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
              width: '100%',
              maxWidth: '500px',
              border: '1px solid #eaedf3',
              boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#ecfdf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={22} weight="fill" color="#047857" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#047857' }}>
                  Bukti Pembayaran Terverifikasi
                </h3>
              </div>
              <button type="button" onClick={() => setReceiptModalItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} weight="bold" />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ border: '1.5px dashed #cbd5e1', borderRadius: '12px', padding: '1.25rem', background: '#fafbfc', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ color: '#64748b' }}>ID Transaksi</span>
                  <strong style={{ fontFamily: 'monospace', color: '#5452f6' }}>{receiptModalItem.invoiceNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ color: '#64748b' }}>Status</span>
                  <span style={{ color: '#047857', fontWeight: 700, background: '#d1fae5', padding: '2px 8px', borderRadius: '6px' }}>LUNAS / ESCROW</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ color: '#64748b' }}>Metode</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{receiptModalItem.method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ color: '#64748b' }}>Komoditas</span>
                  <strong style={{ color: '#0f172a' }}>{receiptModalItem.commodity}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span style={{ color: '#64748b' }}>Penerima</span>
                  {(() => {
                    const info = getFarmerInfo(receiptModalItem);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {info.avatar ? (
                          <img
                            src={info.avatar}
                            alt={info.name}
                            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : null}
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>{info.name}</span>
                      </div>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ color: '#64748b' }}>Tanggal & Waktu</span>
                  <span style={{ color: '#0f172a' }}>{receiptModalItem.paidDate || receiptModalItem.createdAt}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Nomor Referensi</span>
                  <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{receiptModalItem.referenceNumber || 'REF/ESC-202609-0091'}</span>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Total Nominal:</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857' }}>
                    Rp{receiptModalItem.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setReceiptModalItem(null)}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Dokumen bukti bayar ${receiptModalItem.invoiceNumber} diunduh.`);
                    setReceiptModalItem(null);
                  }}
                  style={{
                    flex: 1.5,
                    background: '#5452f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(84, 82, 246, 0.25)'
                  }}
                >
                  <DownloadSimple size={15} weight="bold" />
                  <span>Unduh Bukti (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* ================= 10. DIALOG KONFIRMASI PEMBATALAN ================= */}
      {cancelModalItem && (
        <div 
          onClick={() => setCancelModalItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
              width: '100%',
              maxWidth: '420px',
              border: '1px solid #eaedf3',
              boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.65rem', color: '#dc2626' }}>
                <WarningCircle size={24} weight="fill" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Batalkan Transaksi?
                </h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                Transaksi <strong>{cancelModalItem.invoiceNumber}</strong> belum selesai. Apakah Anda yakin ingin membatalkan transaksi ini?
              </p>

              <label style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Alasan Pembatalan:
              </label>
              <select
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  color: '#334155',
                  outline: 'none',
                  marginBottom: '1.25rem'
                }}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                <option value="Perubahan jadwal pengadaan">Perubahan jadwal pengadaan</option>
                <option value="Kesalahan kuantitas atau komoditas">Kesalahan kuantitas atau komoditas</option>
                <option value="Menemukan pasokan lain">Menemukan pasokan lain</option>
                <option value="Lainnya">Lainnya</option>
              </select>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalItem(null)}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.6rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  style={{
                    flex: 1.3,
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batalkan Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* ================= 11. MODAL KONFIRMASI PENERIMAAN BARANG ================= */}
      {goodsReceiptModalItem && (
        <div 
          onClick={() => !isConfirmingGoods && setGoodsReceiptModalItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
              width: '100%',
              maxWidth: '460px',
              border: '1px solid #eaedf3',
              boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
          >
            {/* Header Modal */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              background: '#ecfdf5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={22} weight="fill" color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#065f46' }}>
                    Konfirmasi Penerimaan Barang
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#047857' }}>
                    ID: {goodsReceiptModalItem.invoiceNumber}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => !isConfirmingGoods && setGoodsReceiptModalItem(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Body Modal */}
            <div style={{ padding: '1.5rem' }}>
              {/* Box Info Komoditas & Petani */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Komoditas:</span>
                  <strong style={{ color: '#0f172a' }}>{goodsReceiptModalItem.commodity}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Total Berat:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {(goodsReceiptModalItem.weightKg / 1000).toLocaleString('id-ID')} Ton ({goodsReceiptModalItem.weightKg.toLocaleString('id-ID')} kg)
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Petani:</span>
                  <strong style={{ color: '#0f172a' }}>{getFarmerInfo(goodsReceiptModalItem).name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Total Nilai:</span>
                  <strong style={{ color: '#059669' }}>Rp{goodsReceiptModalItem.amount.toLocaleString('id-ID')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#64748b' }}>Status Pembayaran:</span>
                  <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={13} weight="fill" /> Lunas (Terverifikasi)
                  </span>
                </div>
              </div>

              {/* Tanya Konfirmasi */}
              <div style={{
                padding: '0.85rem 1rem',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                marginBottom: '1.25rem'
              }}>
                <p style={{ fontSize: '0.82rem', color: '#1e40af', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                  Apakah fisik komoditas ini sudah Anda terima dengan baik?
                </p>
                <p style={{ fontSize: '0.74rem', color: '#3b82f6', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                  ℹ️ Setelah Anda konfirmasi penerimaan barang, status transaksi ini akan resmi berubah menjadi <strong>Selesai</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  disabled={isConfirmingGoods}
                  onClick={() => setGoodsReceiptModalItem(null)}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: isConfirmingGoods ? 'not-allowed' : 'pointer'
                  }}
                >
                  Belum Diterima
                </button>
                <button
                  type="button"
                  disabled={isConfirmingGoods}
                  onClick={() => handleConfirmGoodsReceipt(goodsReceiptModalItem)}
                  style={{
                    flex: 1.5,
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: isConfirmingGoods ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>{isConfirmingGoods ? 'Menyimpan...' : 'Ya, Sudah Diterima'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* ================= MODAL KONFIRMASI HAPUS PERMANEN ================= */}
      {deleteConfirmItem && (
        <div
          onClick={() => !isDeleting && setDeleteConfirmItem(null)}
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
              width: '100%',
              maxWidth: '440px',
              border: '1px solid #eaedf3',
              boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash size={18} weight="bold" color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>
                  Hapus Riwayat Pembayaran?
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#b91c1c' }}>
                  Tindakan ini menghapus permanen dari database.
                </span>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                Apakah Anda yakin ingin menghapus data tagihan <strong>{deleteConfirmItem.invoiceNumber}</strong> ({deleteConfirmItem.commodity} — Rp {Number(deleteConfirmItem.amount || 0).toLocaleString('id-ID')}) secara permanen?
              </p>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
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
                onClick={handleDeletePaymentHistory}
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

      

    
      {/* ================= MODAL KONFIRMASI HAPUS MASSAL ================= */}
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
              width: '100%',
              maxWidth: '440px',
              border: '1px solid #eaedf3',
              boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash size={18} weight="bold" color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>
                  Hapus {selectedTransactionIds.size} Riwayat Terpilih?
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#b91c1c' }}>
                  Tindakan ini menghapus permanen dari database.
                </span>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                Apakah Anda yakin ingin menghapus secara permanen <strong>{selectedTransactionIds.size}</strong> riwayat transaksi yang dipilih? Data yang telah dihapus tidak dapat dipulihkan kembali.
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
                    <span>Ya, Hapus Semua Terpilih</span>
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
