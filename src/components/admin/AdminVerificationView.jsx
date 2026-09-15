import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MagnifyingGlass, 
  FileText, 
  Clock, 
  Check, 
  X,
  Buildings,
  Plant,
  ShieldCheck
} from '@phosphor-icons/react';
import { INITIAL_KYC_VERIFICATIONS } from './adminMockData';

export default function AdminVerificationView() {
  const [kycList, setKycList] = useState(INITIAL_KYC_VERIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filteredKyc = kycList.filter((item) => {
    const matchesFilter = 
      activeFilter === 'Semua' ? true :
      activeFilter === 'Menunggu' ? item.status === 'Menunggu Verifikasi' :
      activeFilter === 'Petani' ? item.type === 'petani' :
      activeFilter === 'Pembeli' ? item.type === 'pembeli' :
      item.status === activeFilter;

    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleApprove = (id) => {
    setKycList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Terverifikasi', notes: 'Disetujui oleh Tim Admin. Akun aktif bertransaksi.' };
      }
      return item;
    }));
    setSelectedKyc(null);
  };

  const handleRejectSubmit = () => {
    if (!selectedKyc || !rejectReason) return;
    setKycList(prev => prev.map(item => {
      if (item.id === selectedKyc.id) {
        return { ...item, status: 'Ditolak', notes: `Ditolak: ${rejectReason}` };
      }
      return item;
    }));
    setShowRejectModal(false);
    setSelectedKyc(null);
    setRejectReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Card */}
      <div className="clone-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Verifikasi Identitas & Legalitas (KYC Pengguna)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
              Validasi dokumen resmi Kelompok Tani (SK Distanbun) dan Perusahaan Pembeli (NIB OSS Kemeninvestasi).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(84, 82, 246, 0.08)',
              border: '1px solid rgba(84, 82, 246, 0.2)',
              padding: '6px 14px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Menunggu</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5452f6' }}>
                {kycList.filter(k => k.status === 'Menunggu Verifikasi').length}
              </div>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '6px 14px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Terverifikasi</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                {kycList.filter(k => k.status === 'Terverifikasi').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {['Semua', 'Menunggu', 'Petani', 'Pembeli', 'Terverifikasi', 'Ditolak'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`clone-tab-btn ${activeFilter === tab ? 'active' : ''}`}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                background: activeFilter === tab ? '#5452f6' : 'var(--card-bg, #ffffff)',
                color: activeFilter === tab ? '#ffffff' : 'var(--text-secondary, #64748b)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              onClick={() => setActiveFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <MagnifyingGlass size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            className="clone-modal-input"
            style={{ paddingLeft: '2.2rem', width: '240px', margin: 0, fontSize: '0.84rem' }}
            placeholder="Cari entitas, PIC, atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="clone-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas-subtle, #f8fafc)', borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>ID KYC</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Jenis Akun</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Nama Entitas</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>PIC & Kontak</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Dokumen Legal</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredKyc.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                  <td style={{ padding: '0.9rem 1.15rem', fontWeight: 700, color: '#5452f6' }}>{item.id}</td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: item.type === 'petani' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(84, 82, 246, 0.12)',
                      color: item.type === 'petani' ? '#10b981' : '#5452f6'
                    }}>
                      {item.type === 'petani' ? <Plant size={12} weight="bold" /> : <Buildings size={12} weight="bold" />}
                      <span>{item.type === 'petani' ? 'Poktan' : 'Buyer'}</span>
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.type === 'petani' ? `Lahan: ${item.landArea} (${item.membersCount} Petani)` : item.businessType}
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.pic}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{item.phone}</div>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.legalDocs.type}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{item.legalDocs.docNumber}</div>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: item.status === 'Terverifikasi' ? 'rgba(16, 185, 129, 0.12)' : item.status === 'Menunggu Verifikasi' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: item.status === 'Terverifikasi' ? '#10b981' : item.status === 'Menunggu Verifikasi' ? '#f59e0b' : '#ef4444'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="clone-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                        onClick={() => setSelectedKyc(item)}
                      >
                        <Eye size={13} weight="bold" />
                        <span>Detail</span>
                      </button>
                      {item.status === 'Menunggu Verifikasi' && (
                        <button
                          type="button"
                          className="clone-btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          onClick={() => handleApprove(item.id)}
                          title="Setujui Verifikasi"
                        >
                          <Check size={13} weight="bold" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedKyc && (
        <div className="clone-modal-overlay" onClick={() => setSelectedKyc(null)}>
          <div className="clone-modal-box" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <h3 className="clone-modal-title">
                Berkas Verifikasi: {selectedKyc.name}
              </h3>
              <button type="button" className="clone-modal-close" onClick={() => setSelectedKyc(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-canvas-subtle)', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedKyc.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#5452f6', fontWeight: 700, marginTop: '2px' }}>
                  {selectedKyc.type === 'petani' ? 'Kelompok Tani' : 'Pembeli Industri'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  PIC: {selectedKyc.pic} ({selectedKyc.phone} • {selectedKyc.email})
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Dokumen:</span>
                  <strong>{selectedKyc.legalDocs.type}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Nomor Dokumen:</span>
                  <strong>{selectedKyc.legalDocs.docNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rekening Bank:</span>
                  <strong>{selectedKyc.bankAccount.bank} - {selectedKyc.bankAccount.accountNumber}</strong>
                </div>
              </div>

              <div style={{ background: 'rgba(84, 82, 246, 0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Catatan:</strong> {selectedKyc.notes}
              </div>
            </div>

            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-secondary" onClick={() => setSelectedKyc(null)}>
                Tutup
              </button>
              {selectedKyc.status === 'Menunggu Verifikasi' && (
                <>
                  <button type="button" className="clone-btn-secondary" style={{ color: '#ef4444' }} onClick={() => setShowRejectModal(true)}>
                    Tolak
                  </button>
                  <button type="button" className="clone-btn-primary" onClick={() => handleApprove(selectedKyc.id)}>
                    Setujui Akun
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="clone-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="clone-modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <h3 className="clone-modal-title" style={{ color: '#ef4444' }}>Alasan Penolakan</h3>
              <button type="button" className="clone-modal-close" onClick={() => setShowRejectModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="clone-modal-body">
              <textarea 
                className="clone-modal-textarea"
                rows={4}
                placeholder="Masukkan catatan penolakan..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-secondary" onClick={() => setShowRejectModal(false)}>Batal</button>
              <button type="button" className="clone-btn-primary" style={{ background: '#ef4444' }} onClick={handleRejectSubmit}>Konfirmasi Tolak</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
