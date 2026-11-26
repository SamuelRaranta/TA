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
  Eye,
  X,
  Sparkle,
  UploadSimple,
  Bank,
  QrCode,
  Money
} from '@phosphor-icons/react';
import {
  fetchProcurementProposalsFromSupabase,
  createProcurementProposalInSupabase,
  updateProcurementStatusInSupabase,
  subscribeProcurementProposals
} from '../../lib/procurementService';
import { appToast } from '../../lib/appFeedback';

export default function AdminProcurementView() {
  const [procurements, setProcurements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua'); // 'Semua' | 'Menunggu Persetujuan' | 'Aktif' | 'Tidak Aktif'
  const [sortBy, setSortBy] = useState('Terbaru'); // 'Terbaru' | 'Terlama' | 'Kebutuhan Tertinggi' | 'Anggaran Tertinggi'
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states for creating new procurement request
  const [formBuyer, setFormBuyer] = useState('');
  const [formCommodity, setFormCommodity] = useState('');
  const [formCategory, setFormCategory] = useState('Hortikultura & Sayur');
  const [formRequestedKg, setFormRequestedKg] = useState(2000);
  const [formPricePerKg, setFormPricePerKg] = useState(8500);
  const [formLocation, setFormLocation] = useState('Minahasa');
  const [formValidUntil, setFormValidUntil] = useState('2026-10-15');
  const [formSpecifications, setFormSpecifications] = useState('');
  const [formImage, setFormImage] = useState('');
  const createFileInputRef = useRef(null);

  // Helper render badge metode pembayaran (compact micro-badge)
  const renderPaymentBadge = (method) => {
    const m = String(method || 'Transfer Bank (Escrow)');
    let icon = <Bank size={11} weight="bold" />;
    let label = 'Transfer Bank (Escrow)';
    let badgeClass = 'bank';

    if (/qris/i.test(m)) {
      icon = <QrCode size={11} weight="bold" />;
      label = 'QRIS';
      badgeClass = 'qris';
    } else if (/langsung|tunai|cash|cod/i.test(m)) {
      icon = <Money size={11} weight="bold" />;
      label = 'Pembayaran Langsung';
      badgeClass = 'direct';
    } else {
      icon = <Bank size={11} weight="bold" />;
      label = 'Transfer Bank (Escrow)';
      badgeClass = 'bank';
    }

    return (
      <span className={`proposal-payment-badge ${badgeClass}`} title={`Metode Pembayaran: ${label}`}>
        {icon}
        <span>{label}</span>
      </span>
    );
  };

  // Load procurements from Supabase on mount and subscribe to realtime updates
  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const { data } = await fetchProcurementProposalsFromSupabase();
        if (isMounted && data) {
          setProcurements(data);
        }
      } catch (err) {
        console.warn('[KelolaPengadaan] Error loading procurements from Supabase:', err);
      } finally {
        if (isMounted) setIsLoading(false);
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
  }, []);

  // Normalisasi status data proposal agar seragam lintas format Supabase
  const normalizeStatus = (status) => {
    const s = String(status || '').trim().toLowerCase();
    if (s === 'aktif' || s === 'diterima' || s === 'disetujui' || s === 'approved') return 'Aktif';
    if (s === 'tidak aktif' || s === 'ditolak' || s === 'rejected') return 'Tidak Aktif';
    return 'Menunggu Persetujuan';
  };

  // Handle Accept (Ubah ke Diterima / Aktif di Supabase)
  const handleAccept = async (id) => {
    // Optimistic local update
    setProcurements(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Aktif',
          statusDetail: 'Diterima & Dipublikasikan ke Petani'
        };
      }
      return item;
    }));

    try {
      await updateProcurementStatusInSupabase(id, 'Aktif');
    } catch (err) {
      console.warn('[KelolaPengadaan] Error updating accept status in Supabase:', err);
    }
  };

  // Handle Reject (Ubah ke Ditolak / Tidak Aktif di Supabase)
  const handleReject = async (id) => {
    // Optimistic local update
    setProcurements(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Tidak Aktif',
          statusDetail: 'Ditolak oleh Admin'
        };
      }
      return item;
    }));

    try {
      await updateProcurementStatusInSupabase(id, 'Tidak Aktif', 'Ditolak oleh Administrator.');
    } catch (err) {
      console.warn('[KelolaPengadaan] Error updating reject status in Supabase:', err);
    }
  };

  // Open Detail Modal
  const handleOpenDetail = (proposal) => {
    setSelectedProposal(proposal);
    setDetailModalOpen(true);
  };

  // Handle image upload from local computer
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        appToast('Mohon pilih file gambar yang valid (JPG, PNG, WebP).', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormImage(uploadEvent.target?.result || '');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formCommodity.trim() || !formBuyer.trim()) return;

    const numericKg = Math.max(1, Number(formRequestedKg) || 1000);
    const numericPrice = Math.max(100, Number(formPricePerKg) || 1000);

    const newItem = {
      id: `PRP-2026-0${procurements.length + 13}`,
      commodityName: formCommodity,
      category: formCategory,
      buyerName: formBuyer,
      buyerPic: 'PIC Pengadaan',
      image: formImage || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      status: 'Menunggu Persetujuan',
      statusDetail: 'Menunggu Persetujuan Admin',
      requestedKg: numericKg,
      offeredPricePerKg: numericPrice,
      totalBudget: numericKg * numericPrice,
      target: 'Semua Petani',
      location: formLocation || 'Minahasa',
      createdAt: 'Hari Ini, Baru Saja',
      validUntil: formValidUntil || '2026-10-30',
      specifications: formSpecifications || 'Spesifikasi standar mutu komoditas nasional SNI.'
    };

    setProcurements([newItem, ...procurements]);
    setCreateModalOpen(false);
    setFormCommodity('');
    setFormBuyer('');
    setFormRequestedKg(2000);
    setFormPricePerKg(8500);
    setFormSpecifications('');
    setFormImage('');

    try {
      await createProcurementProposalInSupabase(newItem);
    } catch (err) {
      console.warn('[KelolaPengadaan] Error saving new procurement to Supabase:', err);
    }
  };

  // Filter & Sort Logic
  const filteredProcurements = useMemo(() => {
    let list = procurements.filter(item => {
      // Status Filter
      if (statusFilter !== 'Semua' && normalizeStatus(item.status) !== statusFilter) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = item.commodityName.toLowerCase().includes(q);
        const matchBuyer = item.buyerName.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        if (!matchName && !matchBuyer && !matchLoc && !matchId) return false;
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
      return b.id.localeCompare(a.id);
    });

    return list;
  }, [procurements, searchTerm, statusFilter, sortBy]);

  return (
    <div className="farmer-products-view" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* ================= 1. HEADER ================= */}
      <div className="farmer-section-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="farmer-page-title" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
            Kelola Pengadaan
          </h1>
          <p className="farmer-page-sub" style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Periksa dan kelola proposal kebutuhan pengadaan komoditas dari pembeli untuk dipenuhi petani.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
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
          title="Tambah permintaan pengadaan baru"
        >
          <Plus size={16} weight="bold" />
          <span>Tambah Permintaan Beli</span>
        </button>
      </div>

      {/* ================= SEARCH DAN FILTER ================= */}
      <div className="proposal-filter-bar">
        
        {/* Search Bar */}
        <div className="proposal-search-wrap">
          <MagnifyingGlass size={18} className="proposal-search-icon" />
          <input
            type="text"
            className="proposal-search-input"
            placeholder="Cari komoditas, pembeli, atau ID..."
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
            <option value="Aktif">Diterima (Aktif)</option>
            <option value="Tidak Aktif">Ditolak</option>
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

      {/* ================= 4. PROCUREMENT CARDS GRID ================= */}
      {isLoading ? (
        <div className="proposal-cards-grid">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="proposal-card agri-skeleton-pulse"
              style={{ minHeight: '380px', borderRadius: '16px', background: 'var(--bg-canvas)' }}
            />
          ))}
        </div>
      ) : filteredProcurements.length > 0 ? (
        <div className="proposal-cards-grid">
          {filteredProcurements.map((item) => {
            const normStatus = normalizeStatus(item.status);
            const isPending = normStatus === 'Menunggu Persetujuan';
            const isAccepted = normStatus === 'Aktif';
            const isRejected = normStatus === 'Tidak Aktif';

            return (
              <div key={item.id} className="proposal-card">
                
                {/* Foto Komoditas */}
                <div 
                  className="proposal-card-media"
                  onClick={() => handleOpenDetail(item)}
                  style={{ cursor: 'pointer' }}
                  title={`Klik untuk lihat rincian ${item.commodityName}`}
                >
                  <img 
                    src={item.image} 
                    alt={item.commodityName} 
                    className="proposal-card-img" 
                  />
                </div>

                {/* Card Body */}
                <div className="proposal-card-body">
                  
                  {/* Status Badge */}
                  <div className="proposal-status-row">
                    {isPending && (
                      <span className="proposal-status-badge pending" title="Proposal sedang menunggu persetujuan admin">
                        <Clock size={12} weight="fill" />
                        <span>Menunggu Persetujuan</span>
                      </span>
                    )}
                    {isAccepted && (
                      <span className="proposal-status-badge active" title="Telah disetujui & aktif dipublikasikan ke petani">
                        <CheckCircle size={12} weight="fill" />
                        <span>Diterima (Aktif)</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="proposal-status-badge inactive" title="Proposal ditolak oleh admin">
                        <XCircle size={12} weight="fill" />
                        <span>Ditolak</span>
                      </span>
                    )}
                  </div>

                  {/* 1. Nama Komoditas */}
                  <h3 
                    className="proposal-card-title" 
                    title={item.commodityName}
                    onClick={() => handleOpenDetail(item)}
                    style={{ cursor: 'pointer', textTransform: 'capitalize' }}
                  >
                    {item.commodityName}
                  </h3>

                  {/* 2, 3, 4. Metrics Box */}
                  <div className="proposal-metrics-box">
                    <div className="proposal-metric-row main">
                      <div className="proposal-metric-item">
                        <span className="proposal-metric-label">Dibutuhkan</span>
                        <span className="proposal-metric-val highlight">
                          {item.requestedKg.toLocaleString('id-ID')} kg
                        </span>
                      </div>
                      <div className="proposal-metric-item">
                        <span className="proposal-metric-label">Harga Penawaran</span>
                        <span className="proposal-metric-val price">
                          Rp{item.offeredPricePerKg.toLocaleString('id-ID')} / kg
                        </span>
                      </div>
                    </div>
                    <div className="proposal-budget-row">
                      <span className="proposal-budget-label">Total Anggaran:</span>
                      <span className="proposal-budget-val">
                        Rp{item.totalBudget.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* 5 & 6. Target & Lokasi */}
                  <div className="proposal-info-row">
                    <div className="proposal-info-item" title={`Target: ${item.target || 'Semua Petani'}`}>
                      <Users size={12} color="var(--accent-primary, #5452f6)" weight="bold" />
                      <span>Target: <strong>{item.target || 'Semua Petani'}</strong></span>
                    </div>
                    <span className="proposal-dot-divider">•</span>
                    <div className="proposal-info-item" title={item.location}>
                      <MapPin size={12} color="#64748b" weight="bold" />
                      <span>{item.location}</span>
                    </div>
                  </div>

                  {/* Metode Pembayaran */}
                  {item.paymentMethod && (
                    <div className="proposal-payment-row">
                      {renderPaymentBadge(item.paymentMethod)}
                    </div>
                  )}

                  {/* 7 & 8. Tanggal & Masa Berlaku */}
                  <div className="proposal-date-row">
                    <div className="proposal-date-item" title={`Diajukan pada ${item.createdAt}`}>
                      <CalendarBlank size={12} />
                      <span>{item.createdAt.replace('Hari Ini, ', '')}</span>
                    </div>
                    <div className="proposal-date-item expiry" title={`Berlaku sampai ${item.validUntil}`}>
                      <Clock size={12} />
                      <span>s/d {item.validUntil}</span>
                    </div>
                  </div>

                  {/* 5. ACTION BUTTONS: Seragam di seluruh card, berdampingan (horizontal) tanpa ruang kosong */}
                  <div className="procurement-card-actions-row">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAccept(item.id)}
                          className="procurement-btn-accept"
                          title="Setujui dan publikasikan proposal pengadaan ini ke petani"
                        >
                          <CheckCircle size={13} weight="bold" />
                          <span>Diterima</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(item.id)}
                          className="procurement-btn-reject"
                          title="Tolak proposal pengadaan ini"
                        >
                          <XCircle size={13} weight="bold" />
                          <span>Ditolak</span>
                        </button>
                      </>
                    )}

                    {isAccepted && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          className="procurement-btn-detail"
                          title="Lihat rincian lengkap proposal pengadaan"
                        >
                          <Eye size={13} weight="bold" />
                          <span>Lihat Detail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(item.id)}
                          className="procurement-btn-reject outline"
                          title="Tolak / nonaktifkan proposal pengadaan ini"
                        >
                          <XCircle size={13} weight="bold" />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}

                    {isRejected && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          className="procurement-btn-detail"
                          title="Lihat rincian lengkap proposal pengadaan"
                        >
                          <Eye size={13} weight="bold" />
                          <span>Lihat Detail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccept(item.id)}
                          className="procurement-btn-accept outline"
                          title="Aktifkan kembali proposal pengadaan ini"
                        >
                          <CheckCircle size={13} weight="bold" />
                          <span>Aktifkan</span>
                        </button>
                      </>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-canvas)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
          <FileText size={48} color="var(--text-muted)" />
          <h3 style={{ margin: '1rem 0 0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
            Tidak Ada Data Pengadaan Ditemukan
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Tidak ada pengajuan kebutuhan komoditas yang sesuai dengan kriteria filter saat ini.
          </p>
        </div>
      )}

      {/* ================= MODAL DETAIL PENGADAAN ================= */}
      {detailModalOpen && selectedProposal && (
        <div className="clone-modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div className="clone-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="clone-modal-header">
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {selectedProposal.id} • {selectedProposal.category}
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedProposal.commodityName}
                </h3>
              </div>
              <button
                type="button"
                className="clone-modal-close"
                onClick={() => setDetailModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderRadius: '10px', overflow: 'hidden', height: '180px' }}>
                <img 
                  src={selectedProposal.image} 
                  alt={selectedProposal.commodityName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', background: 'var(--bg-canvas-subtle)', padding: '0.85rem', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Perusahaan Pembeli</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedProposal.buyerName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>PIC Pengadaan</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedProposal.buyerPic || 'Admin Pengadaan'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Volume</span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>{selectedProposal.requestedKg.toLocaleString('id-ID')} kg</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Harga Beli</span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary, #5452f6)' }}>Rp {selectedProposal.offeredPricePerKg.toLocaleString('id-ID')} /kg</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Spesifikasi Mutu:</span>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {selectedProposal.specifications || 'Kualitas hasil panen segar standar Minahasa, bebas hama dan kadar air sesuai SNI.'}
                </p>
              </div>

              {selectedProposal.status !== 'Aktif' && selectedProposal.status !== 'Tidak Aktif' && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleAccept(selectedProposal.id);
                      setDetailModalOpen(false);
                    }}
                    className="procurement-btn-accept"
                    style={{ padding: '0.65rem' }}
                  >
                    <CheckCircle size={16} weight="bold" />
                    <span>Diterima (Aktifkan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleReject(selectedProposal.id);
                      setDetailModalOpen(false);
                    }}
                    className="procurement-btn-reject"
                    style={{ padding: '0.65rem' }}
                  >
                    <XCircle size={16} weight="bold" />
                    <span>Ditolak</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH PERMINTAAN PENGADAAN ================= */}
      {createModalOpen && (
        <div className="clone-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="clone-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="clone-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Tambah Permintaan Beli (Pengadaan)
              </h3>
              <button
                type="button"
                className="clone-modal-close"
                onClick={() => setCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Nama Komoditas
                </label>
                <input
                  type="text"
                  className="clone-modal-input"
                  placeholder="Contoh: Cengkeh Zanzibar Kering Sikotok"
                  value={formCommodity}
                  onChange={(e) => setFormCommodity(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Perusahaan Pembeli
                </label>
                <input
                  type="text"
                  className="clone-modal-input"
                  placeholder="Contoh: Nama Perusahaan / Offtaker"
                  value={formBuyer}
                  onChange={(e) => setFormBuyer(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Volume (kg)
                  </label>
                  <input
                    type="number"
                    className="clone-modal-input"
                    value={formRequestedKg}
                    onChange={(e) => setFormRequestedKg(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Target Harga (Rp / kg)
                  </label>
                  <input
                    type="number"
                    className="clone-modal-input"
                    value={formPricePerKg}
                    onChange={(e) => setFormPricePerKg(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Foto Komoditas
                </label>
                <input
                  type="file"
                  ref={createFileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="clone-btn-secondary"
                    onClick={() => createFileInputRef.current?.click()}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  >
                    <UploadSimple size={14} weight="bold" />
                    <span>Upload Foto</span>
                  </button>
                  {formImage && <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>✓ Foto terpilih</span>}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Spesifikasi Mutu
                </label>
                <textarea
                  className="clone-modal-textarea"
                  rows={3}
                  placeholder="Kriteria kadar air, kebersihan, dan standar kemasan..."
                  value={formSpecifications}
                  onChange={(e) => setFormSpecifications(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="clone-btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clone-btn-primary"
                >
                  Simpan Pengadaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
