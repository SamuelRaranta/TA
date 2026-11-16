import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle,
  Star,
  Receipt,
  DownloadSimple,
  MagnifyingGlass,
  X,
  CreditCard,
  ShieldCheck,
  Package,
  Buildings,
  PencilSimple,
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  Eye,
  ChatCircleText,
  Printer,
  Sparkle
} from '@phosphor-icons/react';
import { supabase } from '../../lib/supabaseClient';
import { DEFAULT_AVATAR } from '../../lib/constants';
import { fetchBuyerReviews, upsertFarmerReview } from '../../lib/reviewService';
import PillSearchBar from '../common/PillSearchBar';

const QUICK_REVIEW_TAGS = [
  'Kualitas Sesuai Deskripsi',
  'Pengiriman Tepat Waktu',
  'Petani Sangat Komunikatif',
  'Timbangan & Kadar Air Akurat',
  'Kemasan Higienis & Rapi'
];

export default function RiwayatTransaksiPembeli({
  payments = [],
  transactions = [],
  buyerProfile = null,
  currentBuyerId = null,
  isLoading = false,
  onNavigate
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Review & Rating State
  const [reviewsMap, setReviewsMap] = useState({});
  const [reviewModalTrx, setReviewModalTrx] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Detail / Nota Modal State
  const [detailModalTrx, setDetailModalTrx] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Ambil seluruh transaksi yang sudah berhasil (status === 'Selesai' atau goodsStatus === 'diterima')
  const completedList = useMemo(() => {
    const sanitizeDisplayInvoice = (val) => {
      if (!val) return '';
      return String(val)
        .replace(/dummy[-_ ]?/gi, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '');
    };

    const map = new Map();

    // Dari array payments (sudah termap lengkap)
    (payments || []).forEach(p => {
      const isSelesai = p.status === 'Selesai' || p.goodsStatus === 'diterima' || Boolean(p.receivedAt);
      if (isSelesai && p.id) {
        const rawInv = p.invoiceNumber || `INV-${String(p.id).slice(0, 10)}`;
        map.set(p.id, {
          id: p.id,
          contractId: p.contractId || null,
          invoiceNumber: sanitizeDisplayInvoice(rawInv),
          commodity: p.commodity || p.productName || 'Komoditas Pertanian',
          category: p.category || 'Perkebunan',
          farmerName: p.farmerName || p.farmerGroup || 'Kelompok Tani',
          farmerGroup: p.farmerGroup || p.farmerName || 'Kelompok Tani',
          farmerAvatar: p.farmerAvatar || null,
          farmerId: p.farmerId || null,
          volume: p.volume || `${p.volumeTon || 1} Ton`,
          amount: Number(p.amount) || 0,
          method: p.method || 'Transfer Bank',
          status: 'Selesai',
          goodsStatus: 'diterima',
          receivedAt: p.receivedAt || p.paidDate || p.createdAt || 'Baru Saja',
          date: p.date || p.createdAt || 'Hari Ini',
          proofUrl: p.proofUrl || null
        });
      }
    });

    // Dari array transactions (jika ada yang belum masuk payments)
    (transactions || []).forEach(t => {
      const isSelesai = t.status === 'Selesai' || t.goodsStatus === 'diterima' || Boolean(t.receivedAt);
      if (isSelesai && t.id && !map.has(t.id)) {
        const rawInv = t.invoiceNumber || `INV-${String(t.id).replace(/[^A-Z0-9]/gi, '').slice(0, 10)}`;
        map.set(t.id, {
          id: t.id,
          contractId: t.contractId || null,
          invoiceNumber: sanitizeDisplayInvoice(rawInv),
          commodity: t.productName || t.commodityName || 'Komoditas Pertanian',
          category: t.category || 'Perkebunan',
          farmerName: t.farmerName || t.farmerGroup || 'Kelompok Tani',
          farmerGroup: t.farmerGroup || t.farmerName || 'Kelompok Tani',
          farmerAvatar: t.farmerAvatar || null,
          farmerId: t.farmerId || null,
          volume: `${t.volumeTon || 1} Ton`,
          amount: Number(t.amount) || 0,
          method: t.paymentMethod || 'Transfer Bank',
          status: 'Selesai',
          goodsStatus: 'diterima',
          receivedAt: t.receivedAt || t.createdAt || 'Baru Saja',
          date: t.date || 'Hari Ini',
          proofUrl: null
        });
      }
    });

    return Array.from(map.values());
  }, [payments, transactions]);

  // 2. Muat Review Mitra Petani
  const loadReviews = async () => {
    try {
      const { data } = await fetchBuyerReviews(currentBuyerId);
      if (Array.isArray(data)) {
        const rMap = {};
        data.forEach(r => {
          if (r.transaction_code) {
            rMap[r.transaction_code] = r;
          }
        });
        setReviewsMap(rMap);
      }
    } catch (err) {
      console.warn('[RiwayatTransaksiPembeli] Gagal muat reviews:', err);
    }
  };

  useEffect(() => {
    loadReviews();

    // Subscribe realtime ulasan farmer_reviews
    const channel = supabase
      .channel('riwayat_pembeli_reviews_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'farmer_reviews' }, () => {
        loadReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBuyerId]);

  // 3. Filter & Pencarian
  const filteredList = useMemo(() => {
    return completedList.filter(item => {
      if (methodFilter !== 'Semua') {
        const m = String(item.method || '').toLowerCase();
        if (methodFilter === 'QRIS' && !m.includes('qris')) return false;
        if (methodFilter === 'Transfer Bank' && !m.includes('transfer') && !m.includes('bank') && !m.includes('va')) return false;
        if (methodFilter === 'Pembayaran Langsung' && !m.includes('langsung')) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInv = (item.invoiceNumber || '').toLowerCase().includes(q);
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchCom = (item.commodity || '').toLowerCase().includes(q);
        const matchFarmer = (item.farmerName || '').toLowerCase().includes(q);
        if (!matchInv && !matchId && !matchCom && !matchFarmer) return false;
      }

      return true;
    });
  }, [completedList, methodFilter, searchQuery]);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedList = filteredList.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Badge metode pembayaran
  const payBadge = (method) => {
    const m = String(method || '');
    if (/qris/i.test(m)) return { label: 'QRIS', bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' };
    if (/transfer|bank|va|escrow/i.test(m)) return { label: 'Bank', bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' };
    return { label: 'Langsung', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' };
  };


  // Handle Buka Modal Review
  const handleOpenReviewModal = (trx) => {
    setReviewModalTrx(trx);
    const existing = reviewsMap[trx.id] || reviewsMap[trx.invoiceNumber];
    if (existing) {
      setRatingInput(Number(existing.rating) || 5);
      setCommentInput(existing.comment || '');
    } else {
      setRatingInput(5);
      setCommentInput('');
    }
  };

  // Handle Simpan Review Mitra Petani
  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!reviewModalTrx) return;
    setIsSubmittingReview(true);

    try {
      const existing = reviewsMap[reviewModalTrx.id] || reviewsMap[reviewModalTrx.invoiceNumber];
      const payload = {
        id: existing?.id || undefined,
        farmer_id: reviewModalTrx.farmerId,
        buyer_id: currentBuyerId || buyerProfile?.id,
        buyer_name: buyerProfile?.name || buyerProfile?.companyName || 'Pembeli Terverifikasi',
        buyer_avatar: buyerProfile?.avatar || DEFAULT_AVATAR,
        commodity_name: reviewModalTrx.commodity,
        transaction_code: reviewModalTrx.id,
        rating: Number(ratingInput) || 5.0,
        comment: commentInput.trim() || 'Kualitas hasil panen sangat baik dan transaksi berjalan lancar.'
      };

      const { data, error } = await upsertFarmerReview(payload);
      if (error) throw new Error(error);

      // Perbarui map ulasan lokal seketika
      setReviewsMap(prev => ({
        ...prev,
        [reviewModalTrx.id]: data || payload
      }));

      showToast(`Ulasan bintang ${ratingInput} untuk ${reviewModalTrx.farmerName} berhasil disimpan!`);
      setReviewModalTrx(null);
    } catch (err) {
      console.warn('Gagal menyimpan ulasan:', err);
      showToast(`Gagal menyimpan ulasan: ${err?.message || err}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Rating label teks
  const getRatingLabel = (score) => {
    if (score === 5) return '5.0 - Sangat Memuaskan';
    if (score === 4) return '4.0 - Memuaskan';
    if (score === 3) return '3.0 - Cukup Baik';
    if (score === 2) return '2.0 - Kurang Sesuai';
    return '1.0 - Tidak Memuaskan';
  };

  return (
    <div className="clone-dashboard-content" style={{ padding: '0 0 2rem' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={18} color="#10b981" weight="fill" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="clone-dash-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="clone-dash-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            Riwayat Transaksi
          </h1>
          <p className="clone-dash-subtitle" style={{ margin: '4px 0 0', fontSize: '0.86rem' }}>
            Daftar pengadaan komoditas yang telah selesai & diterima. Berikan ulasan bintang untuk membangun reputasi mitra petani.
          </p>
        </div>
      </div>

      {/* Search & Method Filter Bar (Pill Search + Purple Filter Button) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <PillSearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Cari komoditas, poktan produsen, atau kode penawaran..."
          filterOptions={['Semua', 'QRIS', 'Transfer Bank', 'Pembayaran Langsung']}
          activeFilter={methodFilter}
          onSelectFilter={setMethodFilter}
          filterTitle="Metode Pembayaran"
          style={{ width: '100%' }}
        />
        {methodFilter !== 'Semua' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Metode Aktif:</span>
            <span className="pill-active-filter-badge" style={{ marginTop: 0 }}>
              {methodFilter}
              <button
                type="button"
                onClick={() => setMethodFilter('Semua')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '4px', color: 'inherit', display: 'inline-flex' }}
                title="Hapus filter"
              >
                <X size={12} weight="bold" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ padding: '1rem 1.25rem 0.8rem', borderBottom: '1px solid var(--border-subtle, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Daftar Riwayat Transaksi Selesai
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Transaksi yang telah lunas dan barang diterima resmi, dengan kolom ulasan untuk mitra petani.
            </p>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 10px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#059669',
            borderRadius: '999px'
          }}>
            {filteredList.length} Transaksi Selesai
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '1040px' }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1.3fr 0.9fr 0.8fr 0.9fr 0.8fr 1.5fr 0.9fr',
              gap: '0.75rem',
              alignItems: 'center',
              padding: '0.7rem 1.25rem',
              background: 'var(--bg-canvas-subtle, #f8fafc)',
              borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-secondary, #64748b)'
            }}>
              <span>Mitra Petani</span>
              <span>Komoditas</span>
              <span style={{ textAlign: 'right' }}>Total Transaksi</span>
              <span>Pembayaran</span>
              <span>Waktu Selesai</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span>Ulasan Petani</span>
              <span style={{ textAlign: 'center' }}>Aksi</span>
            </div>

            {/* Table Body */}
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem 1.25rem' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="agri-skeleton-pulse" style={{ height: '56px', borderRadius: '8px' }} />
                ))}
              </div>
            ) : pagedList.length > 0 ? (
              pagedList.map((item) => {
                const pay = payBadge(item.method);
                const review = reviewsMap[item.id] || reviewsMap[item.invoiceNumber];

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1.3fr 0.9fr 0.8fr 0.9fr 0.8fr 1.5fr 0.9fr',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                      fontSize: '0.82rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-canvas-subtle, #fbfcfe)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* 1. Mitra Petani */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e2e8f0' }}>
                        {item.farmerAvatar ? (
                          <img
                            src={item.farmerAvatar}
                            alt={item.farmerName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.78rem'
                          }}>
                            {(item.farmerName || 'P').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.farmerName}>
                          {item.farmerName}
                        </div>
                      </div>
                    </div>

                    {/* 2. Komoditas */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.commodity}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.volume} • {item.category}
                      </div>
                    </div>

                    {/* 3. Total Transaksi */}
                    <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      Rp {item.amount.toLocaleString('id-ID')}
                    </div>

                    {/* 4. Pembayaran */}
                    <div>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.22rem 0.6rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        background: pay.bg,
                        color: pay.color,
                        whiteSpace: 'nowrap'
                      }}>
                        {pay.label}
                      </span>
                    </div>

                    {/* 5. Waktu Selesai */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #475569)', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{item.date || 'Telah Selesai'}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Barang Diterima</div>
                    </div>

                    {/* 6. Status */}
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.24rem 0.65rem',
                        borderRadius: '7px',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#059669',
                        whiteSpace: 'nowrap'
                      }}>
                        <CheckCircle size={13} weight="fill" />
                        <span>Selesai</span>
                      </span>
                    </div>

                    {/* 7. REVIEW / ULASAN KOLOM */}
                    <div>
                      {review ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: '#fef3c7',
                              color: '#b45309',
                              fontSize: '0.72rem',
                              fontWeight: 800
                            }}>
                              <Star size={11} weight="fill" color="#f59e0b" />
                              {Number(review.rating).toFixed(1)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenReviewModal(item)}
                              title="Ubah Ulasan"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#5452f6',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              <PencilSimple size={12} weight="bold" />
                              <span>Ubah</span>
                            </button>
                          </div>
                          {review.comment && (
                            <div style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-secondary, #475569)',
                              maxWidth: '220px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontStyle: 'italic'
                            }} title={review.comment}>
                              "{review.comment}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.34rem 0.75rem',
                            borderRadius: '7px',
                            border: '1px solid #f59e0b',
                            background: 'rgba(245, 158, 11, 0.08)',
                            color: '#b45309',
                            fontSize: '0.73rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)'; e.currentTarget.style.color = '#b45309'; }}
                        >
                          <span>Beri Ulasan</span>
                        </button>
                      )}
                    </div>

                    {/* 8. Aksi: Lihat Nota */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setDetailModalTrx(item)}
                        title="Lihat Nota & Bukti Transaksi"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0.32rem 0.68rem',
                          borderRadius: '7px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          background: 'var(--card-bg, #ffffff)',
                          color: 'var(--text-primary, #334155)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Receipt size={13} weight="bold" />
                        <span>Nota</span>
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                <Receipt size={48} weight="duotone" color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '4px' }}>
                  Belum Ada Transaksi Selesai
                </div>
                <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 1.25rem', color: '#64748b' }}>
                  {searchQuery || methodFilter !== 'Semua'
                    ? 'Tidak ditemukan riwayat transaksi dengan filter yang Anda gunakan.'
                    : 'Transaksi yang telah Anda bayar dan dikonfirmasi penerimaan barangnya di menu Pembayaran akan otomatis dipindahkan ke halaman ini.'}
                </p>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('pembayaran')}
                    style={{
                      padding: '0.5rem 1.2rem',
                      background: '#5452f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Buka Tagihan Pembayaran
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {filteredList.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}>
            <div>
              Menampilkan {Math.min((safePage - 1) * pageSize + 1, filteredList.length)} - {Math.min(safePage * pageSize, filteredList.length)} dari {filteredList.length} transaksi
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  background: 'var(--card-bg, #ffffff)',
                  cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: safePage <= 1 ? 0.5 : 1
                }}
              >
                <CaretDoubleLeft size={13} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(safePage - 1)}
                disabled={safePage <= 1}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  background: 'var(--card-bg, #ffffff)',
                  cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: safePage <= 1 ? 0.5 : 1
                }}
              >
                <CaretLeft size={13} weight="bold" />
              </button>
              <span style={{ padding: '0 8px', fontWeight: 700 }}>
                Halaman {safePage} dari {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(safePage + 1)}
                disabled={safePage >= totalPages}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  background: 'var(--card-bg, #ffffff)',
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: safePage >= totalPages ? 0.5 : 1
                }}
              >
                <CaretRight size={13} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  background: 'var(--card-bg, #ffffff)',
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: safePage >= totalPages ? 0.5 : 1
                }}
              >
                <CaretDoubleRight size={13} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL BERI / UBAH REVIEW ================= */}
      {reviewModalTrx && (
        <div
          className="clone-modal-overlay"
          onClick={() => setReviewModalTrx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}
        >
          <div
            className="clone-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: '14px',
              maxWidth: '430px',
              maxHeight: '92vh',
              width: '100%',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '0.85rem 1.15rem',
              borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                  flexShrink: 0
                }}>
                  <ChatCircleText size={18} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Beri Ulasan Petani
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Ulasan ini akan memengaruhi rating publik mitra petani.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalTrx(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveReview} style={{ padding: '0.85rem 1.15rem', overflowY: 'auto' }}>
              
              {/* Info Transaksi */}
              <div style={{
                background: 'var(--bg-canvas-subtle, #f8fafc)',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                marginBottom: '0.75rem',
                border: '1px solid var(--border-subtle, #e2e8f0)'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>TRANSAKSI SELESAI</div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a', marginTop: '1px' }}>
                  {reviewModalTrx.commodity} ({reviewModalTrx.volume})
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '1px' }}>
                  Mitra: <strong>{reviewModalTrx.farmerName}</strong>
                </div>
              </div>

              {/* Bintang Rating Interaktif */}
              <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Pilih Rating Kepuasan Anda:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeScore = hoverRating || ratingInput;
                    const isFilled = star <= activeScore;

                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          transform: isFilled ? 'scale(1.12)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <Star
                          size={28}
                          weight={isFilled ? 'fill' : 'regular'}
                          color={isFilled ? '#f59e0b' : '#cbd5e1'}
                        />
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.76rem', fontWeight: 700, color: '#d97706' }}>
                  {getRatingLabel(hoverRating || ratingInput)}
                </div>
              </div>

              {/* Quick Tags */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Pilih Catatan Cepat (Opsional):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {QUICK_REVIEW_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!commentInput.includes(tag)) {
                          setCommentInput(prev => prev ? `${prev}, ${tag}` : tag);
                        }
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        borderRadius: '5px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Komentar & Testimoni */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Ulasan Rinci untuk Petani:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ceritakan pengalaman Anda terkait mutu komoditas, ketepatan waktu pengiriman, dan pelayanan poktan..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8rem',
                    borderRadius: '7px',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    background: 'var(--card-bg, #ffffff)',
                    outline: 'none',
                    resize: 'vertical',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setReviewModalTrx(null)}
                  disabled={isSubmittingReview}
                  style={{
                    padding: '0.42rem 0.95rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    background: 'transparent',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  style={{
                    padding: '0.42rem 1.15rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    borderRadius: '7px',
                    border: 'none',
                    background: '#f59e0b',
                    color: '#ffffff',
                    cursor: isSubmittingReview ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
                  }}
                >
                  <span>{isSubmittingReview ? 'Menyimpan...' : 'Kirim Ulasan'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL NOTA / DETAIL TRANSAKSI ================= */}
      {detailModalTrx && (
        <div
          className="clone-modal-overlay"
          onClick={() => setDetailModalTrx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}
        >
          <div
            className="clone-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={22} color="#5452f6" weight="bold" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Nota Pengadaan Resmi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalTrx(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 12px',
                  background: '#dcfce7',
                  color: '#15803d',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}>
                  <CheckCircle size={15} weight="fill" />
                  TRANSAKSI SELESAI (ESCROW CLEARED)
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
                  Rp {detailModalTrx.amount.toLocaleString('id-ID')}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  No. Invoice: <strong>{detailModalTrx.invoiceNumber}</strong>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Komoditas:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{detailModalTrx.commodity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Volume Muat:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{detailModalTrx.volume}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Mitra Petani / Poktan:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{detailModalTrx.farmerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Metode Pembayaran:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{detailModalTrx.method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status Barang:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>Sudah Diterima Pembeli</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Tanggal Penyelesaian:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{detailModalTrx.date || 'Selesai'}</span>
                </div>
              </div>

              {/* Status Review yang sudah ada */}
              {reviewsMap[detailModalTrx.id] && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#b45309' }}>ULASAN ANDA UNTUK MITRA</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b45309' }}>
                      ⭐ {Number(reviewsMap[detailModalTrx.id].rating).toFixed(1)} / 5.0
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350f', fontStyle: 'italic' }}>
                    "{reviewsMap[detailModalTrx.id].comment}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#334155'
                }}
              >
                <Printer size={15} weight="bold" />
                <span>Cetak Nota</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailModalTrx(null)}
                style={{
                  padding: '0.5rem 1.2rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
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
