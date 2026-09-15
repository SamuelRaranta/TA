import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  FileText, 
  ArrowRight, 
  LockKey, 
  Receipt, 
  X, 
  HandCoins
} from '@phosphor-icons/react';
import { INITIAL_ESCROW_TRANSACTIONS } from './adminMockData';

export default function AdminEscrowView() {
  const [escrowList, setEscrowList] = useState(INITIAL_ESCROW_TRANSACTIONS);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [releaseSuccess, setReleaseSuccess] = useState(false);

  const filteredList = escrowList.filter(item => {
    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Siap Dicairkan') return item.status === 'Siap Dicairkan';
    if (activeFilter === 'Terkunci') return item.status === 'Dana Terkunci di Escrow';
    if (activeFilter === 'Selesai') return item.status === 'Selesai Dicairkan';
    return true;
  });

  const handleOpenRelease = (item) => {
    setSelectedEscrow(item);
    setShowReleaseModal(true);
    setAdminPin('');
    setReleaseSuccess(false);
  };

  const handleConfirmRelease = () => {
    if (!adminPin || adminPin.length < 4) {
      alert('Masukkan minimal 4 digit PIN Otorisasi Admin');
      return;
    }

    setEscrowList(prev => prev.map(esc => {
      if (esc.id === selectedEscrow.id) {
        return {
          ...esc,
          status: 'Selesai Dicairkan',
          holdingAmount: 0,
          disbursementDue: `Telah Ditransfer Hari Ini (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB)`
        };
      }
      return esc;
    }));

    setReleaseSuccess(true);
    setTimeout(() => {
      setShowReleaseModal(false);
      setSelectedEscrow(null);
    }, 1800);
  };

  const totalHolding = escrowList.reduce((acc, curr) => acc + curr.holdingAmount, 0);
  const readyToRelease = escrowList.filter(e => e.status === 'Siap Dicairkan').reduce((acc, curr) => acc + curr.netPayableToFarmer, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 3 KPI Summary Cards matching Farmer/Buyer */}
      <div className="clone-kpi-grid">
        <div className="clone-kpi-card white-card">
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">ESCROW TERTAHAN (AMAN)</span>
            <div className="clone-kpi-arrow-btn">
              <ShieldCheck size={16} weight="fill" color="#5452f6" />
            </div>
          </div>
          <div className="clone-kpi-value">Rp {totalHolding.toLocaleString('id-ID')}</div>
          <div className="clone-kpi-footer-text">
            <span>Rekening Penjamin Resmi Platform</span>
          </div>
        </div>

        <div className="clone-kpi-card white-card">
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">SIAP DICAIRKAN KE PETANI</span>
            <div className="clone-kpi-arrow-btn">
              <CreditCard size={16} weight="fill" color="#10b981" />
            </div>
          </div>
          <div className="clone-kpi-value" style={{ color: '#10b981' }}>
            Rp {readyToRelease.toLocaleString('id-ID')}
          </div>
          <div className="clone-kpi-badge emerald-badge">
            <span className="clone-badge-dot emerald" />
            <span>{escrowList.filter(e => e.status === 'Siap Dicairkan').length} Transaksi Siap Cair</span>
          </div>
        </div>

        <div className="clone-kpi-card white-card">
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">PLATFORM FEE ESCROW (1%)</span>
            <div className="clone-kpi-arrow-btn">
              <Receipt size={16} weight="fill" color="#3b82f6" />
            </div>
          </div>
          <div className="clone-kpi-value">Rp 29.700.000</div>
          <div className="clone-kpi-badge blue-badge">
            <span>Akumulasi Fee Jasa Penjamin</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.45rem' }}>
          {['Semua', 'Siap Dicairkan', 'Terkunci', 'Selesai'].map((tab) => (
            <button
              key={tab}
              type="button"
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

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Rekening Penampung: <strong style={{ color: 'var(--text-primary)' }}>Bank Mandiri Escrow (122-00-881920-1)</strong>
        </div>
      </div>

      {/* Escrow Table */}
      <div className="clone-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas-subtle, #f8fafc)', borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>ID Escrow</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Kelompok Tani</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Komoditas</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Nilai Total</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Fee 1%</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Net Petani</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((esc) => (
                <tr key={esc.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <div style={{ fontWeight: 700, color: '#5452f6' }}>{esc.id}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{esc.contractId}</div>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{esc.farmerName}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Buyer: {esc.buyerName}</div>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <div style={{ fontWeight: 600 }}>{esc.commodity}</div>
                    <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}>{esc.volumeTon} Ton</div>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem', fontWeight: 700 }}>
                    Rp {esc.totalValue.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                    - Rp {esc.platformFeeAmount.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem', fontWeight: 800, color: '#10b981' }}>
                    Rp {esc.netPayableToFarmer.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: esc.status === 'Siap Dicairkan' ? 'rgba(245, 158, 11, 0.12)' : esc.status === 'Selesai Dicairkan' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(84, 82, 246, 0.12)',
                      color: esc.status === 'Siap Dicairkan' ? '#f59e0b' : esc.status === 'Selesai Dicairkan' ? '#10b981' : '#5452f6'
                    }}>
                      {esc.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    {esc.status === 'Siap Dicairkan' ? (
                      <button
                        type="button"
                        className="clone-btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => handleOpenRelease(esc)}
                      >
                        <CreditCard size={13} weight="bold" />
                        <span>Rilis Dana</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="clone-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => { setSelectedEscrow(esc); setShowReleaseModal(true); }}
                      >
                        <Receipt size={13} weight="bold" />
                        <span>Rincian</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Modal */}
      {showReleaseModal && selectedEscrow && (
        <div className="clone-modal-overlay" onClick={() => setShowReleaseModal(false)}>
          <div className="clone-modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <h3 className="clone-modal-title">
                {selectedEscrow.status === 'Siap Dicairkan' ? 'Otorisasi Pencairan Escrow' : 'Rincian Escrow'}
              </h3>
              <button type="button" className="clone-modal-close" onClick={() => setShowReleaseModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {releaseSuccess ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <CheckCircle size={48} color="#10b981" weight="fill" />
                  <h4 style={{ margin: '0.75rem 0 0.35rem', color: 'var(--text-primary)' }}>Pencairan Berhasil!</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                    Dana <strong>Rp {selectedEscrow.netPayableToFarmer.toLocaleString('id-ID')}</strong> telah ditransfer ke {selectedEscrow.bankTujuan}.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ background: 'var(--bg-canvas-subtle)', padding: '1rem', borderRadius: '10px', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div>Kontrak: <strong>{selectedEscrow.contractId}</strong></div>
                    <div>Penyedia: <strong>{selectedEscrow.farmerName}</strong></div>
                    <div>Timbangan: <strong style={{ color: '#10b981' }}>{selectedEscrow.suratTimbangGudang}</strong></div>
                    <div>Rekening Tujuan: <strong>{selectedEscrow.bankTujuan}</strong></div>
                  </div>

                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Nilai:</span>
                      <strong>Rp {selectedEscrow.totalValue.toLocaleString('id-ID')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', color: '#ef4444' }}>
                      <span>Fee Platform (1%):</span>
                      <strong>- Rp {selectedEscrow.platformFeeAmount.toLocaleString('id-ID')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.6rem', fontSize: '1rem', color: '#10b981', fontWeight: 800 }}>
                      <span>Net Cair ke Petani:</span>
                      <span>Rp {selectedEscrow.netPayableToFarmer.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {selectedEscrow.status === 'Siap Dicairkan' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        PIN Otorisasi Admin (6 Digit):
                      </label>
                      <input 
                        type="password"
                        maxLength={6}
                        className="clone-modal-input"
                        style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.1rem' }}
                        placeholder="••••••"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-secondary" onClick={() => setShowReleaseModal(false)}>
                Tutup
              </button>
              {selectedEscrow.status === 'Siap Dicairkan' && !releaseSuccess && (
                <button type="button" className="clone-btn-primary" onClick={handleConfirmRelease}>
                  Konfirmasi Transfer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
