import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MapPin, 
  CalendarBlank, 
  Clock, 
  Check, 
  X, 
  MagnifyingGlass, 
  Sparkle,
  Star 
} from '@phosphor-icons/react';
import PillSearchBar from '../common/PillSearchBar';
import { 
  fetchCommoditiesFromSupabase, 
  updateCommodityStatusInSupabase, 
  subscribeCommodities 
} from '../../lib/commodityService';
import { DEFAULT_AVATAR } from '../../lib/constants';

export default function AdminCommodityModeration() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);

  // Load commodities from Supabase and subscribe to realtime updates
  useEffect(() => {
    let isMounted = true;
    const loadCommodities = async () => {
      try {
        const { data } = await fetchCommoditiesFromSupabase();
        if (isMounted && data) {
          setItems(data);
        }
      } catch (err) {
        console.warn('[KelolaKomoditas] Gagal memuat data dari Supabase:', err);
      } finally {
        if (isMounted) setIsLoading(false);
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

  const handleApprove = async (id) => {
    const approveNotes = 'Disetujui tampil di katalog utama pembeli.';
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Aktif', notes: approveNotes, adminNotes: approveNotes };
      }
      return item;
    }));
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(prev => ({ ...prev, status: 'Aktif', notes: approveNotes, adminNotes: approveNotes }));
    }

    try {
      await updateCommodityStatusInSupabase(id, 'Aktif', approveNotes);
    } catch (err) {
      console.error('[KelolaKomoditas] Error approving commodity:', err);
    }
  };

  const handleReject = async (id) => {
    const rejectNotes = 'Ditolak: Kualitas panen atau dokumen belum memenuhi standar.';
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Tidak Aktif', notes: rejectNotes, adminNotes: rejectNotes };
      }
      return item;
    }));
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(prev => ({ ...prev, status: 'Tidak Aktif', notes: rejectNotes, adminNotes: rejectNotes }));
    }

    try {
      await updateCommodityStatusInSupabase(id, 'Tidak Aktif', rejectNotes);
    } catch (err) {
      console.error('[KelolaKomoditas] Error rejecting commodity:', err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = !searchTerm || 
      item.commodityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farmerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = (() => {
      if (selectedStatusFilter === 'Semua') return true;
      if (selectedStatusFilter === 'Aktif') return item.status === 'Aktif' || item.status === 'Disetujui';
      if (selectedStatusFilter === 'Menunggu') return item.status === 'Menunggu Persetujuan' || item.status === 'Menunggu Moderasi';
      if (selectedStatusFilter === 'Tidak Aktif') return item.status === 'Tidak Aktif' || item.status === 'Ditolak';
      return true;
    })();

    return matchSearch && matchStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* 1. Header Validasi Komoditas */}
      <div className="clone-card" style={{ padding: '1.15rem 1.35rem', borderRadius: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Kelola Komoditas & Moderasi Panen
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: '0.3rem 0 0 0' }}>
            Validasi kualitas hasil panen, ketersediaan stok, kewajaran harga, dan status penerbitan komoditas ke pembeli.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '0.5rem' }}>
        <PillSearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Cari nama komoditas, poktan produsen, atau sentra panen..."
          filterOptions={['Semua', 'Aktif', 'Menunggu Persetujuan', 'Tidak Aktif']}
          activeFilter={selectedStatusFilter === 'Menunggu' ? 'Menunggu Persetujuan' : selectedStatusFilter}
          onSelectFilter={(val) => {
            if (val === 'Menunggu Persetujuan') setSelectedStatusFilter('Menunggu');
            else setSelectedStatusFilter(val);
          }}
          filterTitle="Filter Status"
          style={{ width: '100%' }}
        />
        {(selectedStatusFilter !== 'Semua' || searchTerm) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter Aktif:</span>
            {selectedStatusFilter !== 'Semua' && (
              <span className="pill-active-filter-badge" style={{ marginTop: 0 }}>
                Status: {selectedStatusFilter}
                <button
                  type="button"
                  className="pill-active-filter-remove"
                  onClick={() => setSelectedStatusFilter('Semua')}
                  title="Hapus filter status"
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="pill-active-filter-badge" style={{ marginTop: 0 }}>
                Pencarian: "{searchTerm}"
                <button
                  type="button"
                  className="pill-active-filter-remove"
                  onClick={() => setSearchTerm('')}
                  title="Hapus pencarian"
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid of Moderation Cards (Clean, Compact, Matches Market Price Cards) */}
      <div className="commodity-cards-grid">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="commodity-moderation-card agri-skeleton-pulse"
              style={{ minHeight: '360px', borderRadius: '16px', background: 'var(--bg-canvas)' }}
            />
          ))
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => {
          const isApproved = item.status === 'Aktif' || item.status === 'Disetujui';
          const isPending = item.status === 'Menunggu Persetujuan' || item.status === 'Menunggu Moderasi';
          const isRejected = item.status === 'Tidak Aktif' || item.status === 'Ditolak';

          const imgSrc = item.images && item.images.length > 0 ? item.images[0] : (item.image || 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80');

          return (
            <div key={item.id} className="commodity-moderation-card">
              {/* Card Image */}
              <div className="commodity-moderation-media">
                <img 
                  src={imgSrc} 
                  alt={item.commodityName}
                  className="commodity-moderation-img"
                />
              </div>

              {/* Card Content Body */}
              <div className="commodity-moderation-body">
                
                {/* 1. Status Pill */}
                <div>
                  {isRejected && (
                    <span className="proposal-status-badge inactive">
                      <XCircle size={11} weight="fill" />
                      <span>Tidak Aktif</span>
                    </span>
                  )}
                  {isPending && (
                    <span className="proposal-status-badge pending">
                      <Clock size={11} weight="fill" />
                      <span>Menunggu Persetujuan</span>
                    </span>
                  )}
                  {isApproved && (
                    <span className="proposal-status-badge active">
                      <CheckCircle size={11} weight="fill" />
                      <span>Aktif</span>
                    </span>
                  )}
                </div>

                {/* 2. Judul Komoditas */}
                <h4 className="commodity-moderation-title" title={item.commodityName}>
                  {item.commodityName}
                </h4>

                {/* 3. Metrics Box: Stok & Harga Grosir & Min Order */}
                <div className="proposal-metrics-box">
                  <div className="proposal-metric-row main">
                    <div className="proposal-metric-item">
                      <span className="proposal-metric-label">STOK TERSEDIA</span>
                      <span className="proposal-metric-val highlight">
                        {item.totalStockTon || item.stockTon || 0} Ton
                      </span>
                    </div>
                    <div className="proposal-metric-item">
                      <span className="proposal-metric-label">HARGA GROSIR</span>
                      <span className="proposal-metric-val price">
                        Rp{(item.proposedPrice || item.pricePerKg || 0).toLocaleString('id-ID')} / kg
                      </span>
                    </div>
                  </div>
                  <div className="proposal-budget-row">
                    <span className="proposal-budget-label">Min. Order:</span>
                    <span className="proposal-budget-val">
                      {item.minimumOrderTon || item.minOrderTon || 1} Ton
                    </span>
                  </div>
                </div>

                {/* 4. Kategori & Lokasi */}
                <div className="proposal-info-row">
                  <div className="proposal-info-item">
                    <Package size={11} color="var(--accent-primary, #5452f6)" weight="bold" />
                    <span>{item.category}</span>
                  </div>
                  <span className="proposal-dot-divider">•</span>
                  <div className="proposal-info-item">
                    <MapPin size={11} color="#64748b" weight="bold" />
                    <span>{item.location?.split(',')[0] || item.location}</span>
                  </div>
                </div>

                {/* 5. Tanggal Panen */}
                <div className="proposal-date-row">
                  <div className="proposal-date-item">
                    <CalendarBlank size={11} color="#64748b" />
                    <span>{item.harvestPeriod || item.harvestDate || 'Panen September 2026'}</span>
                  </div>
                </div>

                {/* 5.5. Nama Asli / Username Petani Pengunggah & Rating */}
                {(() => {
                  const sellerDisplayName = item.farmerName || item.farmerLeader || (item.farmerGroup && !item.farmerGroup.toLowerCase().startsWith('poktan') ? item.farmerGroup : 'Petani');
                  const sellerAvatar = item.farmerAvatar || item.avatarUrl;
                  const avatarLetter = (sellerDisplayName.charAt(0) || 'P').toUpperCase();
                  return (
                    <div className="wholesale-seller-row" style={{ marginTop: '0.15rem' }}>
                      <div className="wholesale-seller-info" title={sellerDisplayName}>
                        <div className="wholesale-seller-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img 
                            src={sellerAvatar || DEFAULT_AVATAR} 
                            alt={sellerDisplayName} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                          />
                        </div>
                        <span className="wholesale-seller-name">{sellerDisplayName}</span>
                      </div>
                      <div className="wholesale-rating-pill" title={`Rating: ${item.rating || 4.8}`}>
                        <Star size={11} weight="fill" color="#f59e0b" />
                        <span>{item.rating || 4.8}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Action Buttons: Jika sudah diterima (Aktif), hanya ada 'Lihat Detail' */}
                <div className="commodity-moderation-actions">
                  {/* Button 1: Lihat Detail */}
                  <button
                    type="button"
                    className="commodity-moderation-btn btn-detail"
                    onClick={() => setSelectedItem(item)}
                    title="Lihat detail lengkap komoditas"
                  >
                    <Eye size={12} weight="bold" />
                    <span>Lihat Detail</span>
                  </button>

                  {/* Tombol Diterima & Ditolak HANYA muncul jika belum diterima dan belum ditolak */}
                  {!isApproved && !isRejected && (
                    <>
                      {/* Button 2: Diterima */}
                      <button
                        type="button"
                        className="commodity-moderation-btn btn-approve"
                        onClick={() => handleApprove(item.id)}
                        title="Setujui komoditas ini agar aktif"
                      >
                        <CheckCircle size={12} weight="bold" />
                        <span>Diterima</span>
                      </button>

                      {/* Button 3: Ditolak */}
                      <button
                        type="button"
                        className="commodity-moderation-btn btn-reject"
                        onClick={() => handleReject(item.id)}
                        title="Tolak komoditas ini"
                      >
                        <XCircle size={12} weight="bold" />
                        <span>Ditolak</span>
                      </button>
                    </>
                  )}
                </div>

              </div>
            </div>
          );
        })
      ) : (
        <div style={{ gridColumn: '1 / -1', padding: '3.5rem 1.5rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', color: 'var(--text-muted)' }}>
          <Package size={38} color="#94a3b8" weight="duotone" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '1rem' }}>Belum Ada Komoditas Terdaftar</div>
          <div style={{ fontSize: '0.85rem' }}>Seluruh komoditas yang didaftarkan petani akan muncul di sini untuk diperiksa dan disetujui.</div>
        </div>
      )}
    </div>

      {/* Modal Detail Komoditas */}
      {selectedItem && (
        <div className="clone-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="clone-modal-card" style={{ maxWidth: '520px', borderRadius: '16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header" style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5452f6' }}>
                  <Package size={18} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Detail Pemeriksaan Komoditas
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    ID: {selectedItem.id} • {selectedItem.category}
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ width: '100%', height: '190px', borderRadius: '10px', overflow: 'hidden' }}>
                <img 
                  src={selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images[0] : selectedItem.image} 
                  alt={selectedItem.commodityName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {selectedItem.commodityName}
                </h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Petani: <strong style={{ color: 'var(--text-primary)' }}>{selectedItem.farmerName}</strong> • {selectedItem.location}
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block' }}>Harga Pengajuan:</span>
                  <strong style={{ color: '#5452f6', fontSize: '0.92rem' }}>
                    Rp{(selectedItem.proposedPrice || selectedItem.pricePerKg || 0).toLocaleString('id-ID')}/kg
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block' }}>Stok Tersedia:</span>
                  <strong style={{ color: '#10b981', fontSize: '0.92rem' }}>
                    {selectedItem.totalStockTon || selectedItem.stockTon} Ton
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block' }}>Minimal Order:</span>
                  <strong>{selectedItem.minimumOrderTon || selectedItem.minOrderTon || 1} Ton</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block' }}>Masa Panen:</span>
                  <strong>{selectedItem.harvestPeriod || selectedItem.harvestDate}</strong>
                </div>
              </div>

              {/* Status & Catatan Mutu */}
              <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(84, 82, 246, 0.04)', border: '1px solid rgba(84, 82, 246, 0.12)', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Catatan Mutu & Audit:
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {selectedItem.notes || selectedItem.moistureContent || 'Kadar air dan fisik komoditas telah diverifikasi.'}
                </div>
              </div>
            </div>

            <div className="clone-modal-footer" style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                type="button" 
                className="clone-btn-secondary" 
                onClick={() => setSelectedItem(null)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
              >
                Tutup
              </button>
              {selectedItem.status !== 'Aktif' && selectedItem.status !== 'Disetujui' && selectedItem.status !== 'Tidak Aktif' && selectedItem.status !== 'Ditolak' && (
                <>
                  <button 
                    type="button" 
                    onClick={() => handleReject(selectedItem.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Tolak
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleApprove(selectedItem.id)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Setujui & Terbitkan
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
