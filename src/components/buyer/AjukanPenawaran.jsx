import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Users,
  MapPin,
  CalendarBlank,
  CurrencyCircleDollar,
  PencilSimple,
  Eye,
  X,
  ShieldCheck,
  WarningCircle,
  Info,
  Package,
  Sparkle,
  Globe,
  SlidersHorizontal,
  ArrowClockwise,
  UploadSimple,
  Trash,
  CreditCard,
  Bank,
  QrCode,
  Money,
  CaretDown
} from '@phosphor-icons/react';
import {
  fetchProcurementProposalsFromSupabase,
  createProcurementProposalInSupabase,
  updateProcurementInSupabase,
  updateProcurementStatusInSupabase,
  deleteProcurementInSupabase,
  subscribeProcurementProposals
} from '../../lib/procurementService';

export default function BuyerSubmitOffer({
  proposals = [],
  buyerProfile = null,
  currentBuyerId = null,
  commodities = [],
  initialCommodity = null,
  onAddProposal,
  onEditProposal,
  onCancelProposal,
  onDeleteProposal,
  onNavigate,
  isLoading = false
}) {
  // State for proposals — authoritative sync from props
  const [proposalList, setProposalList] = useState(proposals || []);

  React.useEffect(() => {
    if (Array.isArray(proposals)) {
      setProposalList(proposals);
    }
  }, [proposals]);

  // Pesan error aksi (edit/batal/hapus) agar kegagalan DB terlihat user, bukan diam.
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [busyProposalId, setBusyProposalId] = useState(null);

  // Search, Filter & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua'); // 'Semua' | 'Menunggu Persetujuan' | 'Aktif' | 'Tidak Aktif'
  const [sortBy, setSortBy] = useState('Terbaru'); // 'Terbaru' | 'Terlama' | 'Kebutuhan Tertinggi' | 'Anggaran Tertinggi'

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProposalForEdit, setSelectedProposalForEdit] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProposalForDetail, setSelectedProposalForDetail] = useState(null);

  // Form states for Create & Edit
  const [formCommodityName, setFormCommodityName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formRequestedKg, setFormRequestedKg] = useState('');
  const [formPricePerKg, setFormPricePerKg] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formSpecifications, setFormSpecifications] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Transfer Bank');
  const [formImage, setFormImage] = useState('');

  // Normalisasi opsi metode pembayaran ke 3 pilihan standar (Transfer Bank, QRIS, Pembayaran Langsung)
  const normalizePaymentMethod = (method) => {
    const m = String(method || '');
    if (/qris/i.test(m)) return 'QRIS';
    if (/langsung|tunai|cash|cod/i.test(m)) return 'Pembayaran Langsung';
    return 'Transfer Bank';
  };

  // Helper render badge metode pembayaran (compact micro-badge, label pendek)
  const renderPaymentBadge = (method) => {
    const m = String(method || 'Transfer Bank');
    let icon = <Bank size={11} weight="bold" />;
    let label = 'Bank';
    let badgeClass = 'bank';

    if (/qris/i.test(m)) {
      icon = <QrCode size={11} weight="bold" />;
      label = 'QRIS';
      badgeClass = 'qris';
    } else if (/langsung|tunai|cash|cod/i.test(m)) {
      icon = <Money size={11} weight="bold" />;
      label = 'Langsung';
      badgeClass = 'direct';
    } else {
      icon = <Bank size={11} weight="bold" />;
      label = 'Bank';
      badgeClass = 'bank';
    }

    return (
      <span className={`proposal-payment-badge ${badgeClass}`} title={`Metode Pembayaran: ${label}`}>
        {icon}
        <span>{label}</span>
      </span>
    );
  };

  // Refs for image file inputs
  const createFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Handle image upload from computer
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Mohon pilih file gambar yang valid (JPG, PNG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file gambar maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormImage(event.target?.result || '');
      };
      reader.readAsDataURL(file);
    }
  };

  // Pre-fill form if initialCommodity is passed
  React.useEffect(() => {
    if (initialCommodity) {
      setFormCommodityName(initialCommodity.name || '');
      setFormCategory(initialCommodity.category || '');
      setFormRequestedKg(initialCommodity.minOrderTon ? initialCommodity.minOrderTon * 1000 : '');
      setFormPricePerKg(initialCommodity.pricePerKg || '');
      setFormLocation(initialCommodity.location || '');
      setFormImage(initialCommodity.image || '');
      setCreateModalOpen(true);
    }
  }, [initialCommodity]);

  // Load proposals from Supabase on mount and subscribe to realtime updates
  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        let activeBuyerId = currentBuyerId;
        if (!activeBuyerId) {
          try {
            const roleStored = localStorage.getItem('agriconnect_auth_user_pembeli');
            const genericStored = localStorage.getItem('agriconnect_auth_user');
            const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
            if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'pembeli')) activeBuyerId = parsed.id;
          } catch (e) {}
          if (!activeBuyerId) {
            const { data: { user } } = await supabase.auth.getUser();
            activeBuyerId = user?.id || null;
          }
        }

        if (!activeBuyerId) {
          if (isMounted) setProposalList([]);
          return;
        }
        const { data } = await fetchProcurementProposalsFromSupabase({ buyerId: activeBuyerId });
        if (isMounted) {
          // Source of truth = hasil query milik sendiri. Kosong = kosong (jangan fallback ke semua).
          setProposalList(data || []);
        }
      } catch (err) {
        console.warn('[AjukanPenawaran] Error loading proposals from Supabase:', err);
      }
    };

    loadData();

    const unsubscribe = subscribeProcurementProposals(() => {
      loadData();
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [currentBuyerId]);

  // 4 Summary Metrics
  const totalCount = proposalList.length;
  const pendingCount = proposalList.filter(p => p.status === 'Menunggu Persetujuan').length;
  const activeCount = proposalList.filter(p => p.status === 'Aktif').length;
  const inactiveCount = proposalList.filter(p => p.status === 'Tidak Aktif').length;

  // Filter & Sort Logic
  const filteredProposals = useMemo(() => {
    let list = proposalList.filter((item) => {
      // Status filter
      if (statusFilter !== 'Semua' && item.status !== statusFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = item.commodityName.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchId) return false;
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'Kebutuhan Tertinggi') {
        return b.requestedKg - a.requestedKg;
      }
      if (sortBy === 'Anggaran Tertinggi') {
        return b.totalBudget - a.totalBudget;
      }
      if (sortBy === 'Terlama') {
        return a.id.localeCompare(b.id);
      }
      // Default: 'Terbaru'
      return b.id.localeCompare(a.id);
    });

    return list;
  }, [proposalList, searchTerm, statusFilter, sortBy]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormCommodityName('');
    setFormCategory('');
    setFormRequestedKg('');
    setFormPricePerKg('');
    setFormLocation('');
    setFormValidUntil('');
    setFormSpecifications('');
    setFormPaymentMethod('Transfer Bank');
    setFormImage('');
    setCreateModalOpen(true);
  };

  // Submit New Proposal (Simpan ke Supabase)
  const handleCreateProposalSubmit = async (e) => {
    e.preventDefault();
    const numericKg = Math.max(1, Number(formRequestedKg) || 1);
    const numericPrice = Math.max(100, Number(formPricePerKg) || 0);
    const calculatedBudget = numericKg * numericPrice;

    let activeBuyerId = currentBuyerId;
    let activeBuyerName = buyerProfile?.companyName || buyerProfile?.name || 'Perusahaan Pembeli';
    let activeBuyerPic = buyerProfile?.name || 'Hendra Pratama, S.T.';

    try {
      const stored = localStorage.getItem('agriconnect_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!activeBuyerId && parsed?.id) activeBuyerId = parsed.id;
        if (!buyerProfile?.name && (parsed?.fullName || parsed?.full_name || parsed?.name)) {
          activeBuyerPic = parsed.fullName || parsed.full_name || parsed.name;
        }
      }
    } catch (err) {}

    const newProposal = {
      id: `PRP-2026-${Date.now().toString().slice(-4)}`,
      commodityName: formCommodityName,
      category: formCategory,
      buyerId: activeBuyerId,
      buyerName: activeBuyerName,
      buyerPic: activeBuyerPic,
      image: formImage || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      status: 'Menunggu Persetujuan',
      statusDetail: 'Menunggu Persetujuan Admin',
      requestedKg: numericKg,
      offeredPricePerKg: numericPrice,
      totalBudget: calculatedBudget,
      target: 'Semua Petani',
      location: formLocation || 'Minahasa',
      createdAt: 'Hari Ini',
      validUntil: formValidUntil || '2026-10-30',
      rawValidUntil: formValidUntil || '2026-10-30',
      paymentMethod: normalizePaymentMethod(formPaymentMethod),
      specifications: formSpecifications || 'Sesuai standar mutu komoditas pasar Minahasa.',
      rejectionReason: null
    };

    // Optimistic local state update
    setProposalList(prev => [newProposal, ...prev]);
    if (onAddProposal) {
      onAddProposal(newProposal);
    }
    setCreateModalOpen(false);

    // Save to Supabase + rekonsiliasi id/code real dari DB (tanpa ini edit/hapus berikutnya gagal).
    try {
      const { data: created, error } = await createProcurementProposalInSupabase(newProposal, activeBuyerId);
      if (error) throw error;
      if (created && (created.dbId || created.id !== newProposal.id)) {
        const reconciled = { ...newProposal, ...created };
        setProposalList(prev => prev.map(p => p.id === newProposal.id ? reconciled : p));
        // Parent sudah optimistis via onAddProposal(newProposal): update entrinya (hindari duplikat).
        if (onEditProposal) {
          onEditProposal(reconciled);
        }
      }
    } catch (err) {
      console.warn('[AjukanPenawaran] Error saving to Supabase:', err);
      setActionErrorMsg('Proposal tersimpan lokal, tetapi gagal tersimpan ke database. Muat ulang lalu coba lagi.');
      setTimeout(() => setActionErrorMsg(''), 5000);
    }
  };

  // Open Edit Modal (Available for all proposals)
  const handleOpenEditModal = (proposal) => {
    setActionErrorMsg('');
    setSelectedProposalForEdit(proposal);
    setFormCommodityName(proposal.commodityName);
    setFormCategory(proposal.category || 'Hortikultura & Sayur');
    setFormRequestedKg(proposal.requestedKg);
    setFormPricePerKg(proposal.offeredPricePerKg);
    setFormLocation(proposal.location);
    // Input date butuh YYYY-MM-DD: pakai rawValidUntil (bukan label tampilan).
    setFormValidUntil(proposal.rawValidUntil || proposal.validUntil);
    setFormSpecifications(proposal.specifications || '');
    setFormPaymentMethod(normalizePaymentMethod(proposal.paymentMethod));
    setFormImage(proposal.image);
    setEditModalOpen(true);
  };

  // Submit Edit Proposal — persist ke Supabase (sebelumnya hanya state lokal!).
  const handleEditProposalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProposalForEdit || isSavingEdit) return;

    const numericKg = Math.max(1, Number(formRequestedKg) || 1);
    const numericPrice = Math.max(100, Number(formPricePerKg) || 0);
    const calculatedBudget = numericKg * numericPrice;

    const previous = selectedProposalForEdit;
    const updated = {
      ...previous,
      commodityName: formCommodityName,
      category: formCategory,
      requestedKg: numericKg,
      requestedTon: numericKg / 1000,
      offeredPricePerKg: numericPrice,
      totalBudget: calculatedBudget,
      location: formLocation,
      validUntil: formValidUntil,
      rawValidUntil: formValidUntil,
      paymentMethod: normalizePaymentMethod(formPaymentMethod || previous.paymentMethod),
      specifications: formSpecifications,
      image: formImage
    };

    // Optimistic
    setProposalList(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (onEditProposal) {
      onEditProposal(updated);
    }

    setIsSavingEdit(true);
    try {
      const { success, data, error } = await updateProcurementInSupabase(previous, updated);
      if (!success) throw error || new Error('Gagal menyimpan ke database.');
      const reconciled = { ...updated, ...(data || {}) };
      setProposalList(prev => prev.map(p => p.id === updated.id ? reconciled : p));
      if (onEditProposal) {
        onEditProposal(reconciled);
      }
      setEditModalOpen(false);
      setSelectedProposalForEdit(null);
    } catch (err) {
      console.warn('[AjukanPenawaran] Error updating proposal in Supabase:', err);
      // Rollback tampilan + beri pesan jelas (sebelumnya gagal diam-diam lalu balik sendiri).
      setProposalList(prev => prev.map(p => p.id === updated.id ? previous : p));
      if (onEditProposal) {
        onEditProposal(previous);
      }
      setActionErrorMsg(`Gagal menyimpan perubahan ke database: ${err?.message || err}. Perubahan dibatalkan.`);
      setTimeout(() => setActionErrorMsg(''), 6000);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Cancel Proposal (Changes status to 'Tidak Aktif' in Supabase)
  const handleCancelProposal = async (proposalId) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan proposal penawaran ini? Status proposal akan diubah menjadi Tidak Aktif.')) {
      setActionErrorMsg('');
      const previousList = proposalList;
      const cancelledState = {
        status: 'Tidak Aktif',
        statusDetail: 'Dibatalkan Pembeli',
        rejectionReason: 'Dibatalkan oleh pembeli sebelum diverifikasi atau diproses oleh admin.'
      };
      setProposalList(prev => prev.map(p => (p.id === proposalId ? { ...p, ...cancelledState } : p)));
      if (onCancelProposal) {
        onCancelProposal(proposalId);
      }

      setBusyProposalId(proposalId);
      try {
        const { success, error } = await updateProcurementStatusInSupabase(proposalId, 'Tidak Aktif', 'Dibatalkan oleh pembeli.');
        if (!success) throw error || new Error('Gagal membatalkan di database.');
      } catch (err) {
        console.warn('[AjukanPenawaran] Error updating cancel status in Supabase:', err);
        // Rollback: kembalikan status semula agar tidak menipu user.
        setProposalList(previousList);
        setActionErrorMsg(`Gagal membatalkan di database: ${err?.message || err}. Status dikembalikan.`);
        setTimeout(() => setActionErrorMsg(''), 6000);
      } finally {
        setBusyProposalId(null);
      }
    }
  };

  // Hapus permanen proposal 'Tidak Aktif' dari database (tombol Hapus sebelumnya hanya update ulang!).
  const handleDeleteProposal = async (proposalId) => {
    if (window.confirm('Hapus permanen proposal ini dari database? Tindakan ini tidak dapat dibatalkan.')) {
      setActionErrorMsg('');
      const previousList = proposalList;
      setProposalList(prev => prev.filter(p => p.id !== proposalId));
      if (onDeleteProposal) {
        onDeleteProposal(proposalId);
      }

      setBusyProposalId(proposalId);
      try {
        const { success, error } = await deleteProcurementInSupabase(proposalId);
        if (!success) throw error || new Error('Gagal menghapus di database.');
      } catch (err) {
        console.warn('[AjukanPenawaran] Error deleting proposal in Supabase:', err);
        setProposalList(previousList);
        setActionErrorMsg(`Gagal menghapus di database: ${err?.message || err}. Data dikembalikan.`);
        setTimeout(() => setActionErrorMsg(''), 6000);
      } finally {
        setBusyProposalId(null);
      }
    }
  };

  // Open Detail Modal
  const handleOpenDetailModal = (proposal) => {
    setSelectedProposalForDetail(proposal);
    setDetailModalOpen(true);
  };

  return (
    <div className="farmer-products-view" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* ================= 1. HEADER ================= */}
      <div className="farmer-section-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="farmer-page-title" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
            Ajukan Penawaran
          </h1>
          <p className="farmer-page-sub" style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Kelola proposal kebutuhan komoditas yang Anda ajukan kepada petani.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="clone-btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.55rem 1.15rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(84, 82, 246, 0.25)'
          }}
          title="Buat proposal penawaran kebutuhan komoditas"
        >
          <Plus size={16} weight="bold" />
          <span>Ajukan Penawaran</span>
        </button>
      </div>

      {actionErrorMsg && (
        <div role="alert" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#b91c1c', marginBottom: '1rem' }}>
          {actionErrorMsg}
        </div>
      )}

      {/* ================= 2. 4 SUMMARY CARDS ================= */}
      <div className="proposal-summary-grid">
        
        {/* Total Proposal */}
        <button
          type="button"
          className={`proposal-summary-card ${statusFilter === 'Semua' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Semua')}
          title="Tampilkan seluruh proposal"
        >
          <div className="proposal-summary-icon" style={{ background: 'rgba(84, 82, 246, 0.12)', color: '#5452f6' }}>
            <FileText size={18} weight={statusFilter === 'Semua' ? 'fill' : 'bold'} />
          </div>
          <div className="proposal-summary-content">
            <span className="proposal-summary-count">
              {isLoading ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '2.5rem', height: '1.4rem', borderRadius: '4px' }} />
              ) : (
                totalCount
              )}
            </span>
            <span className="proposal-summary-label">Total Proposal</span>
          </div>
        </button>

        {/* Menunggu Persetujuan */}
        <button
          type="button"
          className={`proposal-summary-card ${statusFilter === 'Menunggu Persetujuan' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Menunggu Persetujuan' ? 'Semua' : 'Menunggu Persetujuan')}
          title="Proposal yang masih menunggu pemeriksaan dan persetujuan admin"
        >
          <div className="proposal-summary-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <Clock size={18} weight={statusFilter === 'Menunggu Persetujuan' ? 'fill' : 'bold'} />
          </div>
          <div className="proposal-summary-content">
            <span className="proposal-summary-count" style={{ color: '#d97706' }}>
              {isLoading ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '2.5rem', height: '1.4rem', borderRadius: '4px' }} />
              ) : (
                pendingCount
              )}
            </span>
            <span className="proposal-summary-label">Menunggu Persetujuan</span>
          </div>
        </button>

        {/* Proposal Aktif */}
        <button
          type="button"
          className={`proposal-summary-card ${statusFilter === 'Aktif' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Aktif' ? 'Semua' : 'Aktif')}
          title="Proposal yang sudah disetujui admin dan sedang dipublikasikan kepada petani"
        >
          <div className="proposal-summary-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <CheckCircle size={18} weight={statusFilter === 'Aktif' ? 'fill' : 'bold'} />
          </div>
          <div className="proposal-summary-content">
            <span className="proposal-summary-count" style={{ color: '#059669' }}>
              {isLoading ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '2.5rem', height: '1.4rem', borderRadius: '4px' }} />
              ) : (
                activeCount
              )}
            </span>
            <span className="proposal-summary-label">Proposal Aktif</span>
          </div>
        </button>

        {/* Tidak Aktif */}
        <button
          type="button"
          className={`proposal-summary-card ${statusFilter === 'Tidak Aktif' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'Tidak Aktif' ? 'Semua' : 'Tidak Aktif')}
          title="Proposal yang ditolak, dibatalkan, atau sudah berakhir"
        >
          <div className="proposal-summary-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <XCircle size={18} weight={statusFilter === 'Tidak Aktif' ? 'fill' : 'bold'} />
          </div>
          <div className="proposal-summary-content">
            <span className="proposal-summary-count" style={{ color: '#dc2626' }}>
              {isLoading ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '2.5rem', height: '1.4rem', borderRadius: '4px' }} />
              ) : (
                inactiveCount
              )}
            </span>
            <span className="proposal-summary-label">Tidak Aktif</span>
          </div>
        </button>

      </div>

      {/* ================= 3. SEARCH DAN FILTER ================= */}
      <div className="proposal-filter-bar">
        
        {/* Search Bar */}
        <div className="proposal-search-wrap">
          <MagnifyingGlass size={18} className="proposal-search-icon" />
          <input
            type="text"
            className="proposal-search-input"
            placeholder="Cari nama komoditas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Status:
          </span>
          <select
            className="proposal-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Urutkan:
          </span>
          <select
            className="proposal-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Terbaru">Terbaru</option>
            <option value="Terlama">Terlama</option>
            <option value="Kebutuhan Tertinggi">Kebutuhan Tertinggi</option>
            <option value="Anggaran Tertinggi">Anggaran Tertinggi</option>
          </select>
        </div>

      </div>

      {/* ================= 4. PROPOSAL CARDS GRID ================= */}
      {isLoading ? (
        <div className="proposal-cards-grid">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="proposal-card agri-skeleton-pulse"
              style={{ minHeight: '380px', borderRadius: '16px', background: 'var(--bg-canvas)' }}
            />
          ))}
        </div>
      ) : filteredProposals.length > 0 ? (
        <div className="proposal-cards-grid">
          {filteredProposals.map((proposal) => {
            return (
              <div key={proposal.id} className="proposal-card">
                
                {/* Foto Komoditas (Clean without overlay badges) */}
                <div 
                  className="proposal-card-media"
                  onClick={() => handleOpenDetailModal(proposal)}
                  style={{ cursor: 'pointer' }}
                  title={`Klik untuk lihat rincian ${proposal.commodityName}`}
                >
                  <img 
                    src={proposal.image} 
                    alt={proposal.commodityName} 
                    className="proposal-card-img" 
                  />
                </div>

                {/* Card Body */}
                <div className="proposal-card-body">
                  
                  {/* Status Badge (Jelas di dalam body) */}
                  <div className="proposal-status-row">
                    {proposal.status === 'Menunggu Persetujuan' && (
                      <span className="proposal-status-badge pending" title="Proposal sedang diperiksa oleh admin sebelum dipublikasikan">
                        <Clock size={14} weight="fill" />
                        <span>Menunggu Persetujuan Admin</span>
                      </span>
                    )}
                    {proposal.status === 'Aktif' && (
                      <span className="proposal-status-badge active" title="Disetujui admin & dipublikasikan ke seluruh petani">
                        <CheckCircle size={14} weight="fill" />
                        <span>Aktif</span>
                      </span>
                    )}
                    {proposal.status === 'Tidak Aktif' && (
                      <span className="proposal-status-badge inactive" title="Proposal tidak aktif / ditolak / dibatalkan">
                        <XCircle size={14} weight="fill" />
                        <span>Tidak Aktif</span>
                      </span>
                    )}
                  </div>

                  {/* 1. Nama Komoditas (Judul Utama) */}
                  <h3 
                    className="proposal-card-title" 
                    title={proposal.commodityName}
                    onClick={() => handleOpenDetailModal(proposal)}
                    style={{ cursor: 'pointer' }}
                  >
                    {proposal.commodityName}
                  </h3>

                  {/* 2, 3, 4. Jumlah Dibutuhkan, Harga Penawaran, Total Nilai Penawaran */}
                  <div className="proposal-metrics-box">
                    <div className="proposal-metric-row main">
                      <div className="proposal-metric-item">
                        <span className="proposal-metric-label">Dibutuhkan</span>
                        <span className="proposal-metric-val highlight">
                          {proposal.requestedKg.toLocaleString('id-ID')} kg
                        </span>
                      </div>
                      <div className="proposal-metric-item">
                        <span className="proposal-metric-label">Harga Penawaran</span>
                        <span className="proposal-metric-val price">
                          Rp{proposal.offeredPricePerKg.toLocaleString('id-ID')} / kg
                        </span>
                      </div>
                    </div>
                    <div className="proposal-budget-row">
                      <span className="proposal-budget-label">Total Anggaran:</span>
                      <span className="proposal-budget-val">
                        Rp{proposal.totalBudget.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* 5 & 6. Target Proposal ("Semua Petani") & Lokasi Kebutuhan */}
                  <div className="proposal-info-row">
                    <div className="proposal-info-item">
                      <Users size={13} color="var(--accent-primary, #5452f6)" weight="bold" />
                      <span>Target: <strong>{proposal.target || 'Semua Petani'}</strong></span>
                    </div>
                    <span className="proposal-dot-divider">•</span>
                    <div className="proposal-info-item">
                      <MapPin size={13} color="#64748b" weight="bold" />
                      <span>{proposal.location}</span>
                    </div>
                  </div>

                  {/* Bagian Metode Pembayaran pada Card (Hapus label Metode Bayar, micro badge rapi) */}
                  <div className="proposal-payment-row">
                    {renderPaymentBadge(proposal.paymentMethod)}
                  </div>

                  {/* 7 & 8. Tanggal Dibuat & Masa Berlaku Proposal */}
                  <div className="proposal-date-row">
                    <div className="proposal-date-item" title={`Diajukan pada ${proposal.createdAt}`}>
                      <CalendarBlank size={12} />
                      <span>{proposal.createdAt.replace('Hari Ini, ', '')}</span>
                    </div>
                    <div className="proposal-date-item expiry" title={`Berlaku sampai ${proposal.validUntil}`}>
                      <Clock size={12} />
                      <span>s/d {proposal.validUntil}</span>
                    </div>
                  </div>

                  {/* 5. ACTION BUTTONS: Edit dan Batalkan/Hapus (Lihat Detail dihapus sesuai instruksi) */}
                  <div className="proposal-card-actions">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(proposal)}
                      className="proposal-btn-edit"
                      title="Edit data proposal ini"
                    >
                      <PencilSimple size={12} weight="bold" />
                      <span>Edit</span>
                    </button>
                    {proposal.status !== 'Tidak Aktif' ? (
                      <button
                        type="button"
                        onClick={() => handleCancelProposal(proposal.id)}
                        className="proposal-btn-cancel"
                        title="Batalkan proposal penawaran ini"
                        disabled={busyProposalId === proposal.id}
                        style={busyProposalId === proposal.id ? { opacity: 0.6, cursor: 'wait' } : undefined}
                      >
                        <X size={12} weight="bold" />
                        <span>{busyProposalId === proposal.id ? 'Membatalkan...' : 'Batalkan'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteProposal(proposal.id)}
                        className="proposal-btn-cancel"
                        title="Hapus permanen proposal dari database"
                        disabled={busyProposalId === proposal.id}
                        style={busyProposalId === proposal.id ? { opacity: 0.6, cursor: 'wait' } : undefined}
                      >
                        <X size={12} weight="bold" />
                        <span>{busyProposalId === proposal.id ? 'Menghapus...' : 'Hapus'}</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* ================= 9. EMPTY STATE ================= */
        <div className="farmer-empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-canvas)', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(84, 82, 246, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <FileText size={32} color="#5452f6" weight="duotone" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
            Belum Ada Proposal Penawaran
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Ajukan kebutuhan komoditas kepada petani melalui proposal penawaran.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="clone-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.35rem', borderRadius: '10px' }}
          >
            <Plus size={16} weight="bold" />
            <span>Ajukan Penawaran</span>
          </button>
        </div>
      )}

      {/* ================= MODAL: PENGAJUAN PROPOSAL (BARU) ================= */}
      {createModalOpen && (
        <div className="clone-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '580px', borderRadius: '16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="clone-modal-header" style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5452f6' }}>
                  <Plus size={20} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Pengajuan Proposal
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Lengkapi data kebutuhan komoditas untuk diajukan ke petani
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProposalSubmit}>
              <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Upload Foto Komoditas */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Foto Komoditas
                  </label>
                  <input
                    type="file"
                    ref={createFileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />

                  {formImage ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-canvas-subtle)'
                    }}>
                      <img
                        src={formImage}
                        alt="Preview Komoditas"
                        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Foto Berhasil Dipilih
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Format gambar aktif untuk proposal ini
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => createFileInputRef.current?.click()}
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-canvas)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          style={{
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.76rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Hapus Foto"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => createFileInputRef.current?.click()}
                      style={{
                        border: '1.5px dashed var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '1rem',
                        textAlign: 'center',
                        background: 'var(--bg-canvas-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary, #5452f6)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(84, 82, 246, 0.08)',
                        color: '#5452f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UploadSimple size={20} weight="bold" />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Unggah Foto Komoditas
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Klik untuk memilih file gambar (JPG, PNG maks. 5MB)
                      </div>
                    </div>
                  )}
                </div>

                {/* Komoditas & Kategori */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Nama Komoditas *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Tomat Roma"
                      value={formCommodityName}
                      onChange={(e) => setFormCommodityName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Kategori *
                    </label>
                    <select
                      required
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    >
                      <option value="" disabled>-- Pilih Kategori --</option>
                      <option value="Hortikultura & Sayur">Hortikultura & Sayur</option>
                      <option value="Perkebunan">Perkebunan</option>
                      <option value="Padi & Beras">Padi & Beras</option>
                      <option value="Biji-Bijian & Palawija">Biji-Bijian & Palawija</option>
                    </select>
                  </div>
                </div>

                {/* Jumlah Kebutuhan & Target Harga */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Kebutuhan (kg) *
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      placeholder="Contoh: 2000"
                      value={formRequestedKg}
                      onChange={(e) => setFormRequestedKg(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Target Harga / kg (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      placeholder="Contoh: 8500"
                      value={formPricePerKg}
                      onChange={(e) => setFormPricePerKg(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                {/* Ringkasan Anggaran Minimalis */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.95rem',
                  borderRadius: '8px',
                  background: 'rgba(84, 82, 246, 0.05)',
                  border: '1px solid rgba(84, 82, 246, 0.15)'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Estimasi Total Anggaran:
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary, #5452f6)' }}>
                    Rp{(Math.max(0, Number(formRequestedKg) || 0) * Math.max(0, Number(formPricePerKg) || 0)).toLocaleString('id-ID')}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>
                      ({(Number(formRequestedKg) / 1000 || 0).toFixed(1)} Ton)
                    </span>
                  </span>
                </div>

                {/* Lokasi & Batas Waktu */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Lokasi Pengiriman *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Minahasa"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Batas Waktu Proposal *
                    </label>
                    <input
                      type="date"
                      required
                      value={formValidUntil}
                      onChange={(e) => setFormValidUntil(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                {/* Pilihan Metode Pembayaran (Dropdown) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Metode Pembayaran *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      required
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 2.2rem 0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-canvas-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.86rem',
                        fontFamily: 'inherit',
                        fontWeight: 600,
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Transfer Bank" style={{ fontFamily: 'inherit', color: 'var(--text-primary)' }}>Transfer Bank</option>
                      <option value="QRIS" style={{ fontFamily: 'inherit', color: 'var(--text-primary)' }}>QRIS</option>
                      <option value="Pembayaran Langsung" style={{ fontFamily: 'inherit', color: 'var(--text-primary)' }}>Pembayaran Langsung</option>
                    </select>
                    <CaretDown size={14} weight="bold" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                  </div>
                </div>

                {/* Catatan / Spesifikasi */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Spesifikasi & Catatan <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Grade A, kadar air maksimal 14%, kemasan karung..."
                    value={formSpecifications}
                    onChange={(e) => setFormSpecifications(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.84rem', resize: 'vertical' }}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="clone-modal-footer" style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="clone-btn-secondary"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clone-btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={15} weight="bold" />
                  <span>Kirim Proposal</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PROPOSAL ================= */}
      {editModalOpen && selectedProposalForEdit && (
        <div className="clone-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '520px', borderRadius: '16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="clone-modal-header" style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <PencilSimple size={18} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Edit Proposal
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Perbarui data kebutuhan komoditas ({selectedProposalForEdit.id})
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditProposalSubmit}>
              <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.15rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                
                {/* Upload / Ganti Foto Komoditas */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Foto Komoditas
                  </label>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />

                  {formImage ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-canvas-subtle)'
                    }}>
                      <img
                        src={formImage}
                        alt="Preview Komoditas"
                        style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Foto Komoditas
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Klik ganti untuk memperbarui gambar
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          style={{
                            padding: '0.35rem 0.7rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-canvas)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          style={{
                            padding: '0.35rem 0.55rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Hapus Foto"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      style={{
                        border: '1.5px dashed var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '0.9rem',
                        textAlign: 'center',
                        background: 'var(--bg-canvas-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary, #5452f6)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    >
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(84, 82, 246, 0.08)',
                        color: '#5452f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UploadSimple size={18} weight="bold" />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Unggah Foto Komoditas
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Klik untuk memilih gambar baru (JPG, PNG maks. 5MB)
                      </div>
                    </div>
                  )}
                </div>

                {/* Komoditas & Kategori */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Nama Komoditas *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCommodityName}
                      onChange={(e) => setFormCommodityName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Kategori
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    >
                      <option value="Hortikultura & Sayur">Hortikultura & Sayur</option>
                      <option value="Perkebunan">Perkebunan</option>
                      <option value="Padi & Beras">Padi & Beras</option>
                      <option value="Biji-Bijian & Palawija">Biji-Bijian & Palawija</option>
                    </select>
                  </div>
                </div>

                {/* Jumlah Kebutuhan & Target Harga */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Kebutuhan (kg) *
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      value={formRequestedKg}
                      onChange={(e) => setFormRequestedKg(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Target Harga / kg (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={formPricePerKg}
                      onChange={(e) => setFormPricePerKg(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                {/* Lokasi & Batas Waktu */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Lokasi Pengiriman *
                    </label>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Batas Waktu Proposal *
                    </label>
                    <input
                      type="date"
                      required
                      value={formValidUntil}
                      onChange={(e) => setFormValidUntil(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                {/* Pilihan Metode Pembayaran (Dropdown) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Metode Pembayaran *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      required
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 2.2rem 0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-canvas-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.86rem',
                        fontFamily: 'inherit',
                        fontWeight: 600,
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Transfer Bank" style={{ fontFamily: 'inherit', color: 'var(--text-primary)' }}>Transfer Bank</option>
                      <option value="QRIS" style={{ fontFamily: 'inherit', color: 'var(--text-primary)' }}>QRIS</option>
                      <option value="Pembayaran Langsung" style={{ fontFamily: 'inherit', color: 'var(--text-primary)' }}>Pembayaran Langsung</option>
                    </select>
                    <CaretDown size={14} weight="bold" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                  </div>
                </div>

                {/* Catatan / Spesifikasi */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Spesifikasi & Catatan <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formSpecifications}
                    onChange={(e) => setFormSpecifications(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.84rem', resize: 'vertical' }}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="clone-modal-footer" style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="clone-btn-secondary"
                  style={{ padding: '0.5rem 0.95rem', fontSize: '0.84rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clone-btn-primary"
                  style={{ padding: '0.5rem 1.2rem', fontSize: '0.84rem', opacity: isSavingEdit ? 0.65 : 1 }}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: DETAIL PROPOSAL PENAWARAN ================= */}
      {detailModalOpen && selectedProposalForDetail && (
        <div className="clone-modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} color="#5452f6" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                    {selectedProposalForDetail.status === 'Aktif' ? 'Proposal Kebutuhan Aktif' : 'Detail Proposal Penawaran'}
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.82rem' }}>
                    {selectedProposalForDetail.id} • Target: Seluruh Petani
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setDetailModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* Product Header */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '0.9rem', background: 'var(--bg-canvas-subtle)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <img 
                  src={selectedProposalForDetail.image} 
                  alt={selectedProposalForDetail.commodityName} 
                  style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {selectedProposalForDetail.status === 'Menunggu Persetujuan' && (
                      <span className="proposal-status-badge pending">
                        <Clock size={12} weight="fill" />
                        <span>Menunggu Persetujuan Admin</span>
                      </span>
                    )}
                    {selectedProposalForDetail.status === 'Aktif' && (
                      <span className="proposal-status-badge active">
                        <CheckCircle size={12} weight="fill" />
                        <span>Aktif (Dipublikasikan ke Seluruh Petani)</span>
                      </span>
                    )}
                    {selectedProposalForDetail.status === 'Tidak Aktif' && (
                      <span className="proposal-status-badge inactive">
                        <XCircle size={12} weight="fill" />
                        <span>Tidak Aktif</span>
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedProposalForDetail.commodityName}
                  </h2>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Kategori: {selectedProposalForDetail.category || 'Pertanian'}
                  </span>
                </div>
              </div>

              {/* Rejection Reason Alert if Inactive */}
              {selectedProposalForDetail.status === 'Tidak Aktif' && selectedProposalForDetail.rejectionReason && (
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                    <WarningCircle size={16} weight="bold" />
                    <span>Alasan Tidak Aktif / Penolakan Admin:</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedProposalForDetail.rejectionReason}
                  </p>
                </div>
              )}

              {/* Status Explanation Banner */}
              {selectedProposalForDetail.status === 'Aktif' && (
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                    <CheckCircle size={16} weight="fill" />
                    <span>Proposal Telah Dipublikasikan Secara Luas</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Proposal ini telah disetujui oleh admin dan dapat dilihat oleh seluruh petani terdaftar di marketplace melalui halaman "Lihat Proposal". Petani yang memiliki pasokan dapat langsung merespons dan mengajukan penawaran.
                  </p>
                </div>
              )}

              {selectedProposalForDetail.status === 'Menunggu Persetujuan' && (
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                    <Clock size={16} weight="fill" />
                    <span>Pemeriksaan Tim Admin Sedang Berlangsung</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Admin sedang memverifikasi rincian kebutuhan dan batas harga proposal Anda. Setelah disetujui, proposal akan langsung aktif dan dipublikasikan kepada seluruh petani.
                  </p>
                </div>
              )}

              {/* Key Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.9rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Jumlah Kebutuhan</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    {selectedProposalForDetail.requestedKg.toLocaleString('id-ID')} kg
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ({(selectedProposalForDetail.requestedKg / 1000).toFixed(1)} Ton)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Harga Tawaran / kg</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-primary, #5452f6)', marginTop: '2px' }}>
                    Rp{selectedProposalForDetail.offeredPricePerKg.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Standar Pembeli</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Anggaran</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    Rp{selectedProposalForDetail.totalBudget.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Maksimal Alokasi</div>
                </div>
              </div>

              {/* Target & Schedule Details */}
              <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Target Penerima:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedProposalForDetail.target || 'Semua Petani'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Lokasi Kebutuhan / Pengiriman:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedProposalForDetail.location}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Tanggal Diajukan:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{selectedProposalForDetail.createdAt}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Masa Berlaku Proposal:</span>
                    <strong style={{ color: '#d97706' }}>Sampai {selectedProposalForDetail.validUntil}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)', marginTop: '2px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Metode Pembayaran:</span>
                    {renderPaymentBadge(selectedProposalForDetail.paymentMethod)}
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Spesifikasi Mutu & Catatan Teknis
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {selectedProposalForDetail.specifications || 'Tidak ada catatan spesifikasi tambahan.'}
                </p>
              </div>

            </div>

            <div className="clone-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="clone-btn-secondary"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
