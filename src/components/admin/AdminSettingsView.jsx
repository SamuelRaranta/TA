import React, { useState } from 'react';
import { 
  Gear, 
  ShieldCheck, 
  FloppyDisk
} from '@phosphor-icons/react';
import { SYSTEM_AUDIT_LOGS } from './adminMockData';

export default function AdminSettingsView() {
  const [platformFee, setPlatformFee] = useState('1.0');
  const [dpPercentage, setDpPercentage] = useState('5.0');
  const [escrowBank, setEscrowBank] = useState('Bank Mandiri (Persero) Tbk');
  const [escrowAccount, setEscrowAccount] = useState('122-00-881920-1');
  const [escrowHolder, setEscrowHolder] = useState('PT AGRICONNECT PENJAMIN INDONESIA');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div className="clone-card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Pengaturan Platform & Audit Log
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
          Konfigurasi rekening penampung escrow, tarif jasa platform, dan jejak aktivitas admin.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Left: Configuration Form */}
        <div className="clone-card">
          <h3 className="clone-card-title" style={{ marginBottom: '1rem' }}>
            Parameter Keuangan & Escrow
          </h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Tarif Jasa Platform Escrow (%):
              </label>
              <input 
                type="number"
                step="0.1"
                className="clone-modal-input"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                * Dipotong otomatis saat pencairan dana escrow ke rekening Poktan.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Standar DP Booking Fee Kontrak (%):
              </label>
              <input 
                type="number"
                step="0.5"
                className="clone-modal-input"
                value={dpPercentage}
                onChange={(e) => setDpPercentage(e.target.value)}
              />
            </div>

            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#5452f6', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Rekening Penampung Resmi Escrow
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Nama Bank:</label>
                <input 
                  type="text"
                  className="clone-modal-input"
                  value={escrowBank}
                  onChange={(e) => setEscrowBank(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Nomor Rekening:</label>
                <input 
                  type="text"
                  className="clone-modal-input"
                  value={escrowAccount}
                  onChange={(e) => setEscrowAccount(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Pemilik Rekening:</label>
                <input 
                  type="text"
                  className="clone-modal-input"
                  value={escrowHolder}
                  onChange={(e) => setEscrowHolder(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="clone-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              <FloppyDisk size={16} weight="bold" />
              <span>{savedSuccess ? 'Tersimpan Berhasil!' : 'Simpan Parameter'}</span>
            </button>
          </form>
        </div>

        {/* Right: Security Audit Logs */}
        <div className="clone-card">
          <h3 className="clone-card-title" style={{ marginBottom: '1rem' }}>
            Audit Log Aktivitas Admin
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {SYSTEM_AUDIT_LOGS.map((log) => (
              <div 
                key={log.id}
                style={{
                  background: 'var(--bg-canvas-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#5452f6' }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {log.timestamp}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {log.detail}
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Eksekutor: <strong style={{ color: 'var(--text-primary)' }}>{log.executor}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
