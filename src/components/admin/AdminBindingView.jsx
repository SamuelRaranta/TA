import React, { useState } from 'react';
import { 
  FileText, 
  Truck, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  Eye, 
  X,
  FilePdf
} from '@phosphor-icons/react';

const MOCK_BINDING_SUPERVISION = [
  {
    id: 'AC-AGR/2026/IX/0051',
    farmerGroup: 'Poktan Ranowangko (Langowan)',
    buyer: 'CV Minahasa Cengkeh Abadi',
    commodity: 'Cengkeh Zanzibar Kering Sikotok',
    tonnage: 10,
    pricePerKg: 125000,
    contractValue: 1250000000,
    dpAmount: 62500000,
    dpStatus: 'Lunas di Escrow',
    spmNumber: 'SPM-2026-09-082',
    fleetType: '1x Truk Box Tertutup Rempah',
    pickupDate: '15 Sep 2026',
    status: 'Selesai Muat & Timbang',
    weighbridgeWeight: '10.05 Ton (+0.5% Toleransi)',
    moistureResult: '11.8% (Standar Ekspor < 12%)',
    qualityGrade: 'Grade A Sikotok - Lolos Uji Lab Minahasa'
  },
  {
    id: 'AC-AGR/2026/IX/0048',
    farmerGroup: 'Koperasi Kelapa Pesisir (Kombi)',
    buyer: 'PT Royal Coconut Minahasa',
    commodity: 'Kopra Putih Kering Kombi (KA 6%)',
    tonnage: 25,
    pricePerKg: 13800,
    contractValue: 345000000,
    dpAmount: 17250000,
    dpStatus: 'Lunas di Escrow',
    spmNumber: 'SPM-2026-09-077',
    fleetType: '2x Truk Bak Terpal',
    pickupDate: '14 Sep 2026',
    status: 'Selesai Muat & Timbang',
    weighbridgeWeight: '24.95 Ton (-0.2% Susut Wajar)',
    moistureResult: 'Oven Kering 6.1%',
    qualityGrade: 'Super Ekspor Bebas Jamur'
  },
  {
    id: 'AC-AGR/2026/IX/0055',
    farmerGroup: 'Poktan Tou Kakas (Kakas)',
    buyer: 'PT Celebes Feedmill Minahasa',
    commodity: 'Jagung Pipil Kering Hibrida Kakas',
    tonnage: 40,
    pricePerKg: 5400,
    contractValue: 216000000,
    dpAmount: 10800000,
    dpStatus: 'Lunas di Escrow',
    spmNumber: 'SPM-2026-09-094',
    fleetType: '2x Truk Tronton Terpal',
    pickupDate: '16 Sep 2026 (Besok)',
    status: 'Armada Menuju Silo Tompaso',
    weighbridgeWeight: 'Menunggu Timbang Lapangan',
    moistureResult: 'Estimasi 14.0%',
    qualityGrade: 'Pabrik Pakan Standar'
  }
];

export default function AdminBindingView() {
  const [bindings] = useState(MOCK_BINDING_SUPERVISION);
  const [selectedBinding, setSelectedBinding] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div className="clone-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Pengawasan Kontrak Binding & Logistik SPM
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
              Monitoring pemenuhan komitmen tonase panen, jadwal armada, dan hasil jembatan timbang digital.
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Kontrak Aktif</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5452f6' }}>34 Kontrak</div>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '6px 14px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Volume Panen</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>1.240 Ton</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="clone-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas-subtle, #f8fafc)', borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>No. Kontrak</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Pembeli</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Kelompok Tani</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Komoditas</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Nilai Kontrak</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status Logistik</th>
                <th style={{ padding: '0.85rem 1.15rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bindings.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                  <td style={{ padding: '0.9rem 1.15rem', fontWeight: 700, color: '#5452f6' }}>{b.id}</td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.buyer}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>SPM: {b.spmNumber}</div>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>{b.farmerGroup}</td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <div style={{ fontWeight: 600 }}>{b.commodity}</div>
                    <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}>{b.tonnage} Ton</div>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem', fontWeight: 700 }}>
                    Rp {b.contractValue.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: b.status.includes('Selesai') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: b.status.includes('Selesai') ? '#10b981' : '#f59e0b'
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.15rem' }}>
                    <button
                      type="button"
                      className="clone-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => setSelectedBinding(b)}
                    >
                      <Eye size={13} weight="bold" />
                      <span>Audit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBinding && (
        <div className="clone-modal-overlay" onClick={() => setSelectedBinding(null)}>
          <div className="clone-modal-box" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <h3 className="clone-modal-title">Dokumen Kontrak: {selectedBinding.id}</h3>
              <button type="button" className="clone-modal-close" onClick={() => setSelectedBinding(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'var(--bg-canvas-subtle)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div>Pembeli: <strong>{selectedBinding.buyer}</strong></div>
                <div>Kelompok Tani: <strong>{selectedBinding.farmerGroup}</strong></div>
                <div>Komoditas: <strong>{selectedBinding.commodity} ({selectedBinding.tonnage} Ton)</strong></div>
                <div>Nilai: <strong style={{ color: '#10b981' }}>Rp {selectedBinding.contractValue.toLocaleString('id-ID')}</strong></div>
              </div>

              <div style={{ border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Hasil Timbangan & Mutu:</div>
                <div>Jembatan Timbang: <strong style={{ color: '#10b981' }}>{selectedBinding.weighbridgeWeight}</strong></div>
                <div>Kadar Air: <strong>{selectedBinding.moistureResult}</strong></div>
                <div>Mutu: <strong>{selectedBinding.qualityGrade}</strong></div>
                <div>SPM Armada: <strong>{selectedBinding.spmNumber} ({selectedBinding.fleetType})</strong></div>
              </div>
            </div>

            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-secondary" onClick={() => setSelectedBinding(null)}>
                Tutup
              </button>
              <button type="button" className="clone-btn-primary" onClick={() => alert('Unduh PDF Kontrak Resmi')}>
                <FilePdf size={14} weight="bold" />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
