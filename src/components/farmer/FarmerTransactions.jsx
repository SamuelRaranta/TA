import React, { useState } from 'react';
import { 
  Receipt, 
  MagnifyingGlass, 
  CheckCircle, 
  Clock, 
  CaretDown, 
  ArrowRight,
  ShieldCheck,
  Building,
  CalendarBlank,
  Bank,
  FileText
} from '@phosphor-icons/react';
import { INITIAL_TRANSACTIONS } from './mockData';

export default function FarmerTransactions({ transactions = INITIAL_TRANSACTIONS, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedTrx, setSelectedTrx] = useState(null);

  const statuses = ['Semua', 'DP Terkunci', 'Terikat', 'Selesai'];

  const filteredTransactions = transactions.filter((trx) => {
    const matchesSearch = 
      trx.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' ? true : trx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalValue = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalBookingFee = transactions.reduce((acc, curr) => acc + (curr.bookingFee || 0), 0);

  return (
    <div className="farmer-transactions-view">
      
      {/* Page Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Riwayat Transaksi Panen & Kontrak</h1>
          <p className="farmer-page-sub">
            Catatan historis seluruh kesepakatan komoditas, verifikasi booking fee 5%, dan jadwal muat mandiri armada pembeli.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="clone-kpi-card white-card" style={{ padding: '1.15rem 1.35rem' }}>
          <span className="clone-kpi-label">Total Realisasi Panen</span>
          <div className="clone-kpi-value" style={{ fontSize: '1.45rem', marginTop: '4px' }}>
            Rp {totalValue.toLocaleString('id-ID')}
          </div>
          <div className="clone-kpi-badge emerald-badge" style={{ marginTop: '6px' }}>
            <span>6 Transaksi Terdaftar</span>
          </div>
        </div>

        <div className="clone-kpi-card white-card" style={{ padding: '1.15rem 1.35rem' }}>
          <span className="clone-kpi-label">Tanda Jadi (Booking Fee) Terkunci</span>
          <div className="clone-kpi-value" style={{ fontSize: '1.45rem', marginTop: '4px' }}>
            Rp {totalBookingFee.toLocaleString('id-ID')}
          </div>
          <div className="clone-kpi-badge emerald-badge" style={{ marginTop: '6px' }}>
            <span>100% Dijamin Sistem</span>
          </div>
        </div>

        <div className="clone-kpi-card white-card" style={{ padding: '1.15rem 1.35rem' }}>
          <span className="clone-kpi-label">Status Binding Aktif</span>
          <div className="clone-kpi-value" style={{ fontSize: '1.45rem', marginTop: '4px' }}>
            2 Kontrak
          </div>
          <div className="clone-kpi-badge" style={{ background: '#eff6ff', color: '#2563eb', marginTop: '6px' }}>
            <span>Menunggu Muat Truk</span>
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
            placeholder="Cari pembeli / komoditas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="farmer-form-input"
            style={{ paddingLeft: '36px', height: '38px', borderRadius: '9999px', fontSize: '0.84rem' }}
          />
        </div>
      </div>

      {/* Main Table Card Matching Image */}
      <div className="clone-table-card">
        <div className="clone-table-header">
          <div className="clone-table-title-group">
            <h3 className="clone-table-title">Daftar Transaksi Lengkap</h3>
            <p className="clone-table-subtitle">
              Format ringkas transaksi dengan rincian pembeli, produk, status lencana, dan nominal.
            </p>
          </div>
          <button 
            type="button" 
            className="clone-table-head-action"
            onClick={() => onNavigate && onNavigate('binding')}
            title="Lihat Dokumen Binding Agreement"
          >
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>

        {/* Table Header Row */}
        <div className="clone-table-thead full-table">
          <span>Tanggal</span>
          <span>Nama Pembeli</span>
          <span>Komoditas & Tonase</span>
          <span>Status</span>
          <span className="th-right">Total Transaksi</span>
          <span />
        </div>

        <div className="clone-table-body">
          {filteredTransactions.map((trx) => (
            <div 
              key={trx.id} 
              className="clone-table-row"
              onClick={() => setSelectedTrx(trx)}
              title={`Klik untuk melihat rincian transaksi ${trx.buyerName}`}
            >
              <div className="clone-table-col-date">{trx.date}</div>
              <div className="clone-table-col-name">{trx.buyerName}</div>
              <div className="clone-table-col-desc">{trx.productName} ({trx.volume})</div>
              <div>
                <span className={`clone-table-col-badge ${trx.badgeClass}`}>
                  <span className="clone-badge-dot" />
                  <span>{trx.status}</span>
                </span>
              </div>
              <div className="clone-table-col-amount income">
                + Rp {trx.amount.toLocaleString('id-ID')}
              </div>
              <div className="clone-table-col-chevron">
                <CaretDown size={14} weight="bold" />
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
              Tidak ditemukan transaksi dengan kriteria pencarian ini.
            </div>
          )}
        </div>
      </div>

      {/* Compact Bottom Card: Kebijakan Pembayaran & Rekening */}
      <div className="clone-compact-card">
        <div className="clone-compact-header">
          <div className="clone-compact-header-left">
            <div className="clone-compact-icon-badge emerald">
              <ShieldCheck size={18} weight="bold" />
            </div>
            <div>
              <h4 className="clone-compact-title">Kebijakan Jaminan Pembayaran & Escrow Poktan</h4>
              <p className="clone-compact-subtitle">Standard Operating Procedure pencairan dana komitmen platform</p>
            </div>
          </div>
          <span className="clone-compact-tag">AgriConnect Secure</span>
        </div>

        <div className="clone-compact-grid">
          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">🔒</span>
            <div>
              <div className="clone-compact-item-title">Booking Fee 5% Terkunci</div>
              <p className="clone-compact-item-desc">
                Tanda jadi 5% diamankan di rekening penjamin platform saat penandatanganan binding agreement.
              </p>
            </div>
          </div>

          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">🏦</span>
            <div>
              <div className="clone-compact-item-title">Rekening Bank Resmi Poktan</div>
              <p className="clone-compact-item-desc">
                Pencairan otomatis disalurkan langsung ke rekening BRI terdaftar atas nama Kelompok Tani Makmur.
              </p>
            </div>
          </div>

          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">🚛</span>
            <div>
              <div className="clone-compact-item-title">Pelunasan Saat Muat Armada</div>
              <p className="clone-compact-item-desc">
                Sisa 95% dilunasi pembeli saat inspeksi timbang dan muat barang mandiri di gudang sentra.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTrx && (
        <div className="clone-modal-overlay" onClick={() => setSelectedTrx(null)}>
          <div className="clone-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={22} color="#059669" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Rincian Transaksi Panen</h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.8rem' }}>ID: {selectedTrx.id} • {selectedTrx.fullDate}</p>
                </div>
              </div>
            </div>

            <div className="clone-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Mitra Pembeli:</span>
                <strong style={{ fontSize: '0.9rem' }}>{selectedTrx.buyerName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Komoditas & Volume:</span>
                <strong style={{ fontSize: '0.9rem' }}>{selectedTrx.productName} ({selectedTrx.volume})</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Nilai Transaksi:</span>
                <strong style={{ fontSize: '1.05rem', color: '#059669' }}>Rp {selectedTrx.amount.toLocaleString('id-ID')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Booking Fee (5%):</span>
                <strong style={{ fontSize: '0.9rem' }}>Rp {selectedTrx.bookingFee.toLocaleString('id-ID')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Jadwal Muat Mandiri:</span>
                <strong style={{ fontSize: '0.9rem' }}>{selectedTrx.pickupSchedule}</strong>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0', lineHeight: 1.45 }}>
                ℹ️ <em>{selectedTrx.notes}</em>
              </p>
            </div>

            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-primary" onClick={() => setSelectedTrx(null)}>
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
