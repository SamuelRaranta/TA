import React, { useState } from 'react';
import { 
  Scales, 
  WarningCircle, 
  CheckCircle, 
  X
} from '@phosphor-icons/react';
import { INITIAL_DISPUTE_TICKETS } from './adminMockData';

export default function AdminDisputeView() {
  const [disputes, setDisputes] = useState(INITIAL_DISPUTE_TICKETS);

  const handleResolve = (id) => {
    setDisputes(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: 'Terselesaikan', adminNote: 'Mediasi selesai: Kedua pihak menyepakati penyesuaian nominal pelunasan secara adil.' };
      }
      return d;
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div className="clone-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Pusat Mediasi Sengketa Transaksi
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
              Penanganan klaim selisih susut timbangan gudang dan mediasi penyesuaian dana escrow.
            </p>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '6px 14px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Tiket Aktif</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>
              {disputes.filter(d => d.status !== 'Terselesaikan').length} Kasus
            </div>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {disputes.map((d) => (
          <div key={d.id} className="clone-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <WarningCircle size={20} color="#ef4444" weight="fill" />
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {d.id} • Kontrak {d.contractId}
                </span>
              </div>
              <span style={{
                padding: '3px 8px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: d.status === 'Terselesaikan' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: d.status === 'Terselesaikan' ? '#10b981' : '#ef4444'
              }}>
                {d.status}
              </span>
            </div>

            <div style={{
              background: 'var(--bg-canvas-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0.85rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
              marginBottom: '0.85rem',
              fontSize: '0.84rem'
            }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>Pelapor:</div>
                <div style={{ fontWeight: 700 }}>{d.reporter}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>Terlapor:</div>
                <div style={{ fontWeight: 700 }}>{d.respondent}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>Masalah:</div>
                <div style={{ fontWeight: 700, color: '#ef4444' }}>{d.issueType}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>Nilai Sengketa:</div>
                <div style={{ fontWeight: 800 }}>Rp {d.disputedValue.toLocaleString('id-ID')} ({d.weightDiffKg} kg)</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(84, 82, 246, 0.05)',
              border: '1px solid rgba(84, 82, 246, 0.15)',
              borderRadius: '8px',
              padding: '0.75rem',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.85rem'
            }}>
              <strong>Usulan Solusi Mediasi:</strong> {d.proposedSolution}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {d.status !== 'Terselesaikan' && (
                <button
                  type="button"
                  className="clone-btn-primary"
                  onClick={() => handleResolve(d.id)}
                >
                  <CheckCircle size={15} weight="bold" />
                  <span>Selesaikan Mediasi & Terapkan Penyesuaian</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
