import React, { useState, useMemo, useEffect } from 'react';
import {
  Handshake,
  MagnifyingGlass,
  ArrowRight,
  DownloadSimple,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Buildings,
  Calendar,
  Printer,
  FileText,
  ShieldCheck,
  Truck,
  CreditCard,
  Package,
  Eye,
  ArrowCounterClockwise,
  Bank,
  QrCode,
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  Trash,
  ArrowsClockwise,
  Check,
  Info
} from '@phosphor-icons/react';
import { supabase } from '../../lib/supabaseClient';
import PillSearchBar from '../common/PillSearchBar';

export default function BuyerOfferList({ 
  transactions = [], 
  offers = [],
  proposals = [],
  onNavigate,
  onCancelOffer,
  isLoading = false
}) {
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOffer, setDeleteConfirmOffer] = useState(null);
  const [selectedOfferIds, setSelectedOfferIds] = useState(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedOfferIds, setDeletedOfferIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleDeleteOffer = async () => {
    if (!deleteConfirmOffer) return;
    setIsDeleting(true);
    try {
      const offerId = deleteConfirmOffer.id;
      await supabase.from('offers').delete().eq('id', offerId);
      await supabase.from('procurement_proposals').delete().eq('id', offerId);
      if (deleteConfirmOffer.code) {
        await supabase.from('procurement_proposals').delete().eq('code', deleteConfirmOffer.code);
      }

      setDeletedOfferIds(prev => new Set([...prev, offerId]));
      setSelectedOfferIds(prev => {
        const next = new Set(prev);
        next.delete(offerId);
        return next;
      });
      showToast(`Riwayat penawaran ${deleteConfirmOffer.commodityName} berhasil dihapus permanen.`);
      setDeleteConfirmOffer(null);
      if (selectedOffer?.id === offerId) {
        setSelectedOffer(null);
        setDetailModalOpen(false);
      }

      window.dispatchEvent(new CustomEvent('agriconnect:refresh-transactions'));
      window.dispatchEvent(new CustomEvent('agriconnect:refresh-offers'));
    } catch (err) {
      console.error('[RiwayatPengadaanPembeli] Gagal menghapus penawaran:', err);
      showToast(`Gagal menghapus penawaran: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Hapus massal penawaran yang dipilih
  const handleConfirmBulkDelete = async () => {
    if (selectedOfferIds.size === 0) return;
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedOfferIds);
    try {
      await supabase.from('offers').delete().in('id', idsToDelete);
      await supabase.from('procurement_proposals').delete().in('id', idsToDelete);

      setDeletedOfferIds(prev => new Set([...prev, ...idsToDelete]));
      showToast(`${idsToDelete.length} riwayat penawaran berhasil dihapus permanen.`);
      setSelectedOfferIds(new Set());
      setBulkDeleteModalOpen(false);
      if (selectedOffer && selectedOfferIds.has(selectedOffer.id)) {
        setSelectedOffer(null);
        setDetailModalOpen(false);
      }
      window.dispatchEvent(new CustomEvent('agriconnect:refresh-transactions'));
      window.dispatchEvent(new CustomEvent('agriconnect:refresh-offers'));
    } catch (err) {
      console.error('[RiwayatPengadaanPembeli] Gagal hapus massal penawaran:', err);
      showToast(`Gagal menghapus penawaran: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Status options for filter pills
  const statusOptions = ['Semua', 'Menunggu', 'Diterima', 'Dibatalkan', 'Ditolak'];

  // Normalize all offers & accepted proposals into a unified offer list
  const allOffers = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Process active and historical offers
    if (Array.isArray(offers) && offers.length > 0) {
      offers.forEach(o => {
        if (!o || !o.id || seenIds.has(o.id) || deletedOfferIds.has(o.id)) return;
        seenIds.add(o.id);

        const rawStatus = (o.status || '').toLowerCase();

        // Cek apakah penawaran sudah kedaluwarsa (selaras halaman Penawaran Petani)
        const checkIsExpired = () => {
          if (['kedaluwarsa', 'kadaluarsa', 'expired'].includes(rawStatus)) return true;
          if (rawStatus !== 'disetujui' && rawStatus !== 'diterima' && rawStatus !== 'selesai' && rawStatus !== 'aktif') {
            const vDate = o.rawValidUntil || o.validUntil;
            if (vDate) {
              try {
                let expDate = new Date(vDate);
                if (isNaN(expDate.getTime())) {
                  const months = {
                    jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2, apr: 3, april: 3,
                    mei: 4, may: 4, jun: 5, juni: 5, jul: 6, juli: 6, agu: 7, agustus: 7, aug: 7,
                    sep: 8, september: 8, okt: 9, oktober: 9, oct: 9, nop: 10, nov: 10, november: 10,
                    des: 11, desember: 11, dec: 11
                  };
                  const parts = String(vDate).trim().split(/\s+/);
                  if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const mStr = parts[1].toLowerCase().replace(/[^a-z]/g, '');
                    const year = parseInt(parts[2], 10);
                    if (!isNaN(day) && !isNaN(year) && months[mStr] !== undefined) {
                      expDate = new Date(year, months[mStr], day);
                    }
                  }
                }
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (!isNaN(expDate.getTime()) && expDate < today) return true;
              } catch (e) {}
            }
          }
          return false;
        };

        const isExpired = checkIsExpired();

        let normalizedStatus = 'Menunggu';
        if (rawStatus === 'disetujui' || rawStatus === 'diterima' || rawStatus === 'selesai' || rawStatus === 'aktif') {
          normalizedStatus = 'Diterima';
        } else if (isExpired || rawStatus === 'dibatalkan' || rawStatus === 'cancelled') {
          // Status kedaluwarsa di halaman petani diubah menjadi Dibatalkan di halaman daftar penawaran pembeli
          normalizedStatus = 'Dibatalkan';
        } else if (rawStatus === 'ditolak' || rawStatus === 'rejected') {
          normalizedStatus = 'Ditolak';
        } else {
          normalizedStatus = 'Menunggu';
        }

        const volTon = Number(o.requestedTon || (o.requestedKg ? o.requestedKg / 1000 : 2));
        const volKg = Number(o.requestedKg || volTon * 1000);
        const pricePerKg = Number(o.offeredPricePerKg || o.pricePerKg || 110000);
        const total = Number(o.totalOffer || (volKg * pricePerKg));

        list.push({
          id: o.id,
          date: o.submittedDate || '26 Sep 2026',
          validUntil: o.validUntil || '28 Sep 2026',
          commodityName: o.commodityName || o.productName || 'Komoditas Pertanian',
          category: o.category || 'Perkebunan',
          commodityImage: o.image || o.commodityImage || 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&auto=format&fit=crop&q=80',
          farmerGroup: o.farmerGroup || 'Poktan Ranowangko Langowan',
          farmerLeader: o.farmerLeader || 'Hengky Mandagi, S.P.',
          farmerAvatar: o.farmerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
          location: o.location || 'Minahasa, Sulawesi Utara',
          volumeTon: volTon,
          volumeKg: volKg,
          offeredPricePerKg: pricePerKg,
          listingPricePerKg: Number(o.listingPricePerKg || pricePerKg),
          totalOffer: total,
          paymentMethod: o.paymentMethod || 'Transfer Bank (VA Escrow)',
          notes: o.notes || 'Saya berminat membeli dalam jumlah besar dan berharap dapat memperoleh harga grosir.',
          rejectionReason: o.rejectionReason || (normalizedStatus === 'Ditolak' ? 'Kapasitas gudang dan armada pengangkutan telah penuh untuk periode panen ini.' : null),
          status: normalizedStatus
        });
      });
    }

    return list;
  }, [offers, transactions]);

  // Filter & Search
  const filteredOffers = useMemo(() => {
    return allOffers.filter((item) => {
      const matchStatus = statusFilter === 'Semua' ? true : item.status === statusFilter;
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        (item.commodityName || '').toLowerCase().includes(q) ||
        (item.farmerGroup || '').toLowerCase().includes(q) ||
        (item.id || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [allOffers, statusFilter, searchTerm]);

  // KPI Computations
  const totalOfferAmount = useMemo(() => {
    return allOffers.reduce((sum, item) => sum + (Number(item.totalOffer) || 0), 0);
  }, [allOffers]);

  const countMenunggu = useMemo(() => allOffers.filter(i => i.status === 'Menunggu').length, [allOffers]);
  const countDiterima = useMemo(() => allOffers.filter(i => i.status === 'Diterima').length, [allOffers]);
  const countDibatalkan = useMemo(() => allOffers.filter(i => i.status === 'Dibatalkan').length, [allOffers]);
  const countDitolak = useMemo(() => allOffers.filter(i => i.status === 'Ditolak').length, [allOffers]);

  // Pagination ala referensi (5 baris per halaman)
  const ROWS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, offers]);
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

  // Penawaran berstatus Dibatalkan atau Ditolak yang dapat dipilih untuk dihapus
  const deletableOffers = useMemo(() => {
    return filteredOffers.filter(o => o.status === 'Dibatalkan' || o.status === 'Ditolak');
  }, [filteredOffers]);

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

  useEffect(() => {
    setSelectedOfferIds(new Set());
  }, [statusFilter, searchTerm]);

  // Badge metode pembayaran: QRIS / Bank / Langsung
  const paymentBadge = (method) => {
    const m = String(method || '');
    if (/qris/i.test(m)) return { label: 'QRIS', bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' };
    if (/transfer|bank|va|escrow/i.test(m)) return { label: 'Bank', bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' };
    return { label: 'Langsung', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' };
  };

  const handleOpenDetail = (offer) => {
    setSelectedOffer(offer);
    setDetailModalOpen(true);
  };

  const handleCancel = (offerId) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan penawaran ini?')) {
      if (onCancelOffer) {
        onCancelOffer(offerId);
      }
      setDetailModalOpen(false);
    }
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

  return (
    <div className="farmer-transactions-view">
      
      {/* Page Header */}
      <div className="farmer-section-header" style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <h1 className="farmer-page-title" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)', letterSpacing: '-0.02em', margin: '0 0 0.65rem 0' }}>
          Daftar Penawaran Komoditas
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
            Pantau status pengajuan penawaran harga dan tonase komoditas Anda ke kelompok tani produsen, mulai dari peninjauan hingga persetujuan resmi dan proses transaksi.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <PillSearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Cari komoditas, poktan produsen, atau kode penawaran..."
          filterOptions={statusOptions}
          activeFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          filterTitle="Status Penawaran"
          style={{ width: '100%' }}
        />
        {statusFilter !== 'Semua' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter Status:</span>
            <span className="pill-active-filter-badge" style={{ marginTop: 0 }}>
              {statusFilter}
              <button
                type="button"
                className="pill-active-filter-remove"
                onClick={() => setStatusFilter('Semua')}
                title="Hapus filter"
              >
                <X size={12} weight="bold" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Tabel Daftar Penawaran */}
      <div style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-subtle, #e8ecf1)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '1rem 1.25rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Daftar Pengajuan Penawaran</h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Petani mitra, komoditas, harga, volume, total, pembayaran, serta status persetujuan.
            </p>
          </div>
          <span className="table-mobile-scroll-hint">↔ Geser tabel ke samping</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '960px' }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1.4fr 1.3fr 0.95fr 0.75fr 1fr 0.8fr 0.75fr 0.65fr',
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
                      ? "Tidak ada penawaran yang dibatalkan/ditolak untuk dipilih"
                      : isAllSelected
                      ? "Batalkan pilihan semua"
                      : "Pilih semua penawaran yang dibatalkan/ditolak"
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
              <span>Petani</span>
              <span>Komoditas</span>
              <span style={{ textAlign: 'right' }}>Harga / kg</span>
              <span>Volume</span>
              <span style={{ textAlign: 'right' }}>Total</span>
              <span>Pembayaran</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span style={{ textAlign: 'center' }}>Aksi</span>
            </div>

            {/* Body */}
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem 1.35rem' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="agri-skeleton-pulse" style={{ height: '52px', borderRadius: '8px' }} />
                ))}
              </div>
            ) : pagedOffers.length > 0 ? (
              pagedOffers.map((item) => {
                const isMenunggu = item.status === 'Menunggu';
                const isDiterima = item.status === 'Diterima';
                const isDibatalkan = item.status === 'Dibatalkan';
                const isDitolak = item.status === 'Ditolak';
                const pay = paymentBadge(item.paymentMethod);
                const isSelected = selectedOfferIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1.4fr 1.3fr 0.95fr 0.75fr 1fr 0.8fr 0.75fr 0.65fr',
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
                    title={`Lihat rincian ${item.commodityName}`}
                  >
                    {/* Tombol Bulat Seleksi */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {(isDibatalkan || isDitolak) ? (
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(item.id, e)}
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
                        <span style={{ color: 'var(--text-muted, #cbd5e1)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </div>
                    {/* Petani: profil + nama saja */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <img
                        src={item.farmerAvatar}
                        alt={item.farmerLeader}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                      />
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.farmerLeader}
                      </div>
                    </div>

                    {/* Komoditas */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <img
                        src={item.commodityImage}
                        alt={item.commodityName}
                        style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.commodityName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {item.category}
                        </div>
                      </div>
                    </div>

                    {/* Harga / kg */}
                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      Rp {item.offeredPricePerKg.toLocaleString('id-ID')}
                    </div>

                    {/* Volume */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {item.volumeTon} Ton
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {item.volumeKg.toLocaleString('id-ID')} kg
                      </div>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      Rp {item.totalOffer.toLocaleString('id-ID')}
                    </div>

                    {/* Pembayaran */}
                    <div>
                      <span
                        title={item.paymentMethod}
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
                          background: isDiterima
                            ? 'rgba(16, 185, 129, 0.12)'
                            : isMenunggu
                            ? 'rgba(245, 158, 11, 0.14)'
                            : isDibatalkan
                            ? 'rgba(100, 116, 139, 0.12)'
                            : 'rgba(239, 68, 68, 0.10)',
                          color: isDiterima
                            ? '#059669'
                            : isMenunggu
                            ? '#b45309'
                            : isDibatalkan
                            ? '#64748b'
                            : '#dc2626',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isDiterima && <CheckCircle size={12} weight="fill" />}
                        {isMenunggu && <Clock size={12} weight="bold" />}
                        {isDibatalkan && <X size={12} weight="bold" />}
                        {isDitolak && <XCircle size={12} weight="fill" />}
                        <span>{item.status}</span>
                      </span>
                    </div>

                    {/* Aksi */}
                    <div style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      {(isDibatalkan || isDitolak) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmOffer(item);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #fee2e2',
                            background: '#fff1f2',
                            color: '#e11d48',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ffe4e6';
                            e.currentTarget.style.borderColor = '#fca5a5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff1f2';
                            e.currentTarget.style.borderColor = '#fee2e2';
                          }}
                          title="Hapus riwayat penawaran ini secara permanen"
                        >
                          <Trash size={13} weight="bold" />
                          <span>Hapus</span>
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Handshake size={38} color="#94a3b8" weight="duotone" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '1rem' }}>
                  Belum Ada Penawaran
                </div>
                <div style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                  Anda belum mengajukan penawaran untuk kategori status ini. Temukan komoditas di katalog dan ajukan penawaran harga Anda.
                </div>
                <button
                  type="button"
                  className="clone-btn-primary"
                  onClick={() => onNavigate && onNavigate('katalog')}
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Jelajahi Katalog Komoditas
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && filteredOffers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '1rem 1.35rem' }}>
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

      {/* Floating Action Bar Seleksi Hapus Massal */}
      {selectedOfferIds.size > 0 && (
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
              {selectedOfferIds.size}
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
              {selectedOfferIds.size} penawaran dipilih
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
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
              }}
            >
              <Trash size={14} weight="bold" />
              <span>Hapus Semua Terpilih</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= DETAIL MODAL PENAWARAN ================= */}
      {detailModalOpen && selectedOffer && (
        <div className="clone-modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '580px', borderRadius: '16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header Modal */}
            <div className="clone-modal-header" style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-canvas)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5452f6' }}>
                  <Handshake size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.12rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Rincian Proposal Penawaran
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Kode Penawaran: {selectedOffer.id} • {selectedOffer.date}
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setDetailModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.25rem 1.45rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Status Header Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: selectedOffer.status === 'Diterima'
                  ? 'rgba(16, 185, 129, 0.08)'
                  : selectedOffer.status === 'Menunggu'
                  ? 'rgba(245, 158, 11, 0.08)'
                  : selectedOffer.status === 'Dibatalkan'
                  ? 'rgba(100, 116, 139, 0.08)'
                  : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${
                  selectedOffer.status === 'Diterima'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : selectedOffer.status === 'Menunggu'
                    ? 'rgba(245, 158, 11, 0.25)'
                    : selectedOffer.status === 'Dibatalkan'
                    ? 'rgba(100, 116, 139, 0.25)'
                    : 'rgba(239, 68, 68, 0.25)'
                }`
              }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status Saat Ini:</span>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: selectedOffer.status === 'Diterima'
                      ? '#059669'
                      : selectedOffer.status === 'Menunggu'
                      ? '#b45309'
                      : selectedOffer.status === 'Dibatalkan'
                      ? '#64748b'
                      : '#dc2626'
                  }}>
                    {selectedOffer.status === 'Diterima' && 'Penawaran Telah Diterima Petani'}
                    {selectedOffer.status === 'Menunggu' && 'Sedang Ditinjau oleh Kelompok Tani'}
                    {selectedOffer.status === 'Ditolak' && 'Penawaran Ditolak oleh Petani'}
                    {selectedOffer.status === 'Dibatalkan' && 'Penawaran Dibatalkan (Masa Berlaku Telah Kedaluwarsa)'}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Batas Berlaku: <strong>{selectedOffer.validUntil}</strong>
                </div>
              </div>

              {/* Entity Snapshot (Komoditas & Kelompok Tani) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <img 
                    src={selectedOffer.commodityImage} 
                    alt={selectedOffer.commodityName} 
                    style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {selectedOffer.commodityName}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {selectedOffer.category}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px', minWidth: 0 }}>
                  <img 
                    src={selectedOffer.farmerAvatar} 
                    alt={selectedOffer.farmerGroup} 
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {selectedOffer.farmerGroup}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {selectedOffer.farmerLeader}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation & Pricing Card */}
              <div style={{
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(84, 82, 246, 0.05)',
                border: '1px solid rgba(84, 82, 246, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Volume Kebutuhan:</span>
                  <strong>{selectedOffer.volumeTon} Ton ({selectedOffer.volumeKg.toLocaleString('id-ID')} kg)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Harga Penawaran Anda:</span>
                  <strong style={{ color: '#059669' }}>Rp {selectedOffer.offeredPricePerKg.toLocaleString('id-ID')} / kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Metode Pembayaran:</span>
                  <strong>{selectedOffer.paymentMethod}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px dashed rgba(84, 82, 246, 0.25)',
                  paddingTop: '8px',
                  marginTop: '4px'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Nilai Penawaran:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5452f6' }}>
                    Rp {selectedOffer.totalOffer.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Catatan Pembeli */}
              {selectedOffer.notes && (
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                    Catatan Anda untuk Petani:
                  </span>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                    "{selectedOffer.notes}"
                  </p>
                </div>
              )}

              {/* Alasan Penolakan (Jika ditolak) */}
              {selectedOffer.status === 'Ditolak' && selectedOffer.rejectionReason && (
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: '#dc2626', fontWeight: 600, marginBottom: '4px' }}>
                    Alasan dari Kelompok Tani:
                  </span>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                    {selectedOffer.rejectionReason}
                  </p>
                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div className="clone-modal-footer" style={{ padding: '1rem 1.4rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', background: 'var(--bg-canvas)' }}>
              <button 
                type="button" 
                className="clone-btn-secondary" 
                onClick={() => setDetailModalOpen(false)}
                style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem' }}
              >
                Tutup
              </button>

              {/* Aksi jika Menunggu */}
              {selectedOffer.status === 'Menunggu' && (
                <button 
                  type="button" 
                  onClick={() => handleCancel(selectedOffer.id)}
                  style={{
                    padding: '0.55rem 1.2rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    background: '#fff1f2',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Batalkan Penawaran
                </button>
              )}

              {/* Aksi jika Diterima */}
              {selectedOffer.status === 'Diterima' && onNavigate && (
                <button 
                  type="button" 
                  className="clone-btn-primary"
                  onClick={() => {
                    setDetailModalOpen(false);
                    onNavigate('pembayaran');
                  }}
                  style={{ padding: '0.55rem 1.35rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <CreditCard size={16} weight="bold" />
                  <span>Lanjut ke Pembayaran Escrow</span>
                </button>
              )}

              {/* Tombol Hapus jika Ditolak atau Dibatalkan */}
              {(selectedOffer.status === 'Ditolak' || selectedOffer.status === 'Dibatalkan') && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmOffer(selectedOffer);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '0.55rem 1rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #fee2e2',
                    background: '#fff1f2',
                    color: '#e11d48',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  <Trash size={15} weight="bold" />
                  <span>Hapus Riwayat</span>
                </button>
              )}

              {/* Aksi jika Ditolak atau Dibatalkan */}
              {(selectedOffer.status === 'Ditolak' || selectedOffer.status === 'Dibatalkan') && onNavigate && (
                <button 
                  type="button" 
                  className="clone-btn-primary"
                  onClick={() => {
                    setDetailModalOpen(false);
                    onNavigate('katalog');
                  }}
                  style={{ padding: '0.55rem 1.35rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>Tawar Ulang di Katalog</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS PENAWARAN (SATUAN) ================= */}
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
                  Hapus Riwayat Penawaran?
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#b91c1c' }}>
                  Tindakan ini menghapus permanen dari database.
                </span>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                Apakah Anda yakin ingin menghapus data penawaran untuk <strong>{deleteConfirmOffer.commodityName}</strong> ({deleteConfirmOffer.volumeTon} Ton — Rp {Number(deleteConfirmOffer.totalOffer || 0).toLocaleString('id-ID')}) secara permanen?
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
                  Hapus {selectedOfferIds.size} Penawaran Terpilih?
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#b91c1c' }}>
                  Tindakan ini menghapus permanen dari database.
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
                    <span>Ya, Hapus Semua Terpilih</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
          gap: '8px'
        }}>
          <CheckCircle size={18} color="#10b981" weight="bold" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
