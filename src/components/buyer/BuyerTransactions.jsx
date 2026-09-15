import React, { useState } from 'react';
import { 
  Receipt, 
  MagnifyingGlass, 
  ArrowRight, 
  DownloadSimple, 
  X, 
  CheckCircle, 
  Buildings, 
  Calendar, 
  Printer, 
  FileText,
  ShieldCheck,
  Truck
} from '@phosphor-icons/react';
import { INITIAL_BUYER_TRANSACTIONS } from './buyerMockData';

export default function BuyerTransactions({ 
  transactions = INITIAL_BUYER_TRANSACTIONS, 
  onNavigate 
}) {
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const statuses = ['Semua', 'DP Terkunci', 'Terikat', 'Selesai'];

  const filteredTransactions = transactions.filter((trx) => {
    const matchesStatus = statusFilter === 'Semua' ? true : trx.status === statusFilter;
    const matchesSearch = trx.farmerGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trx.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trx.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalSpent = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalBookingFee = transactions.reduce((acc, curr) => acc + curr.bookingFee, 0);

  const handleOpenDetail = (trx) => {
    setSelectedTrx(trx);
    setModalOpen(true);
  };

  return (
    <div className="farmer-transactions-view">
      
      {/* Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Riwayat Pengadaan Komoditas</h1>
          <p className="farmer-page-sub">
            Catatan historis seluruh pengadaan tonase panen, rekapitulasi pembayaran tanda jadi 5% dan pelunasan 95%, serta dokumen faktur timbang.
          </p>
        </div>
      </div>

      {/* KPI Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="clone-kpi-card white-card" style={{ padding: '1.15rem 1.35rem' }}>
          <span className="clone-kpi-label">Total Realisasi Belanja</span>
          <div className="clone-kpi-value" style={{ fontSize: '1.45rem', marginTop: '4px' }}>
            Rp {totalSpent.toLocaleString('id-ID')}
          </div>
          <div className="clone-kpi-badge emerald-badge" style={{ marginTop: '6px' }}>
            <span>{transactions.length} Transaksi Terdata</span>
          </div>
        </div>

        <div className="clone-kpi-card white-card" style={{ padding: '1.15rem 1.35rem' }}>
          <span className="clone-kpi-label">Booking Fee (Escrow) Tersalurkan</span>
          <div className="clone-kpi-value" style={{ fontSize: '1.45rem', marginTop: '4px' }}>
            Rp {totalBookingFee.toLocaleString('id-ID')}
          </div>
          <div className="clone-kpi-badge emerald-badge" style={{ marginTop: '6px' }}>
            <span>100% Terverifikasi Platform</span>
          </div>
        </div>

        <div className="clone-kpi-card white-card" style={{ padding: '1.15rem 1.35rem' }}>
          <span className="clone-kpi-label">Total Tonase Terambil</span>
          <div className="clone-kpi-value" style={{ fontSize: '1.45rem', marginTop: '4px' }}>
            135 Ton
          </div>
          <div className="clone-kpi-badge" style={{ background: '#eff6ff', color: '#5452f6', marginTop: '6px' }}>
            <span>Self-Pickup Mandiri</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              className={`farmer-filter-chip ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <MagnifyingGlass size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Cari Poktan / komoditas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="farmer-form-input"
            style={{ paddingLeft: '36px', height: '38px', borderRadius: '9999px', fontSize: '0.84rem' }}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="clone-table-card">
        <div className="clone-table-header">
          <div className="clone-table-title-group">
            <h3 className="clone-table-title">Daftar Transaksi Pengadaan</h3>
            <p className="clone-table-subtitle">
              Format rincian transaksi pengadaan dengan nama Poktan, komoditas, volume tonase, status, dan invoice.
            </p>
          </div>
          <button 
            type="button" 
            className="clone-table-head-action"
            onClick={() => onNavigate && onNavigate('katalog')}
            title="Jelajahi Katalog Komoditas"
          >
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>

        {/* Table Header Row */}
        <div className="clone-table-thead full-table">
          <span>Tanggal</span>
          <span>Mitra Kelompok Tani</span>
          <span>Komoditas & Volume</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Total Pengadaan</span>
          <span style={{ textAlign: 'center' }}>Aksi</span>
        </div>

        {/* Table Body Rows */}
        <div className="clone-table-tbody">
          {filteredTransactions.map((trx, idx) => {
            const avatarBgs = ['#e0e7ff', '#ecfdf5', '#fef3c7', '#f3e8ff'];
            const avatarColors = ['#4338ca', '#047857', '#b45309', '#7e22ce'];
            const initials = trx.farmerGroup
              .replace('Poktan ', '')
              .replace('Gapoktan ', '')
              .replace('Koperasi ', '')
              .split(' ')
              .map(w => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div key={trx.id} className="clone-table-row full-table" onClick={() => handleOpenDetail(trx)} style={{ cursor: 'pointer' }}>
                <span className="clone-row-date">{trx.date}</span>
                
                <div className="clone-row-user">
                  <div 
                    className="clone-row-avatar-box"
                    style={{ 
                      background: avatarBgs[idx % avatarBgs.length], 
                      color: avatarColors[idx % avatarColors.length] 
                    }}
                  >
                    {initials}
                  </div>
                  <div className="clone-row-user-text">
                    <span className="clone-row-name">{trx.farmerGroup}</span>
                    <span className="clone-row-role">ID: {trx.id}</span>
                  </div>
                </div>

                <div className="clone-row-product-cell">
                  <span className="clone-row-product-title">{trx.productName}</span>
                  <span className="clone-row-product-vol">{trx.volume} • {trx.category}</span>
                </div>

                <div>
                  <span className={`clone-badge ${trx.status === 'Selesai' ? 'badge-salary' : 'badge-food'}`}>
                    {trx.status}
                  </span>
                </div>

                <span className="clone-row-amount" style={{ textAlign: 'right' }}>
                  Rp {trx.amount.toLocaleString('id-ID')}
                </span>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleOpenDetail(trx); }}
                    className="clone-tag-btn"
                  >
                    Invoice
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada data transaksi pengadaan yang sesuai.
            </div>
          )}
        </div>
      </div>

      {/* ================= INVOICE DETAIL MODAL ================= */}
      {modalOpen && selectedTrx && (
        <div className="clone-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={22} color="#5452f6" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                    Faktur Pengadaan Komoditas
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.85rem' }}>
                    Kode Transaksi: {selectedTrx.id}
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body">
              <div style={{ padding: '1.25rem', borderRadius: '8px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tanggal Transaksi:</span>
                  <strong>{selectedTrx.fullDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Mitra Kelompok Tani:</span>
                  <strong>{selectedTrx.farmerGroup}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Komoditas:</span>
                  <strong>{selectedTrx.productName} ({selectedTrx.volume})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Jadwal Muat Armada:</span>
                  <strong>{selectedTrx.pickupSchedule}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status Transaksi:</span>
                  <span className={`clone-badge ${selectedTrx.status === 'Selesai' ? 'badge-salary' : 'badge-food'}`}>
                    {selectedTrx.status}
                  </span>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(84, 82, 246, 0.05)', border: '1px dashed rgba(84, 82, 246, 0.25)', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Tanda Jadi (Booking Fee 5%):</span>
                  <strong>Rp {selectedTrx.bookingFee.toLocaleString('id-ID')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Pelunasan Muat Barang (95%):</span>
                  <strong>Rp {(selectedTrx.amount - selectedTrx.bookingFee).toLocaleString('id-ID')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(84,82,246,0.15)', paddingTop: '8px', marginTop: '6px', fontSize: '1rem', fontWeight: 800, color: '#5452f6' }}>
                  <span>Total Nilai Pengadaan:</span>
                  <span>Rp {selectedTrx.amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {selectedTrx.notes && (
                <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>Catatan Verifikasi:</strong> {selectedTrx.notes}
                </div>
              )}
            </div>

            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-secondary" onClick={() => setModalOpen(false)}>
                Tutup
              </button>
              <button type="button" className="clone-btn-primary" onClick={() => alert('Mengunduh faktur transaksi PDF...')}>
                <DownloadSimple size={16} weight="bold" />
                <span>Unduh Faktur PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
