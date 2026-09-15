import React, { useState } from 'react';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MapPin, 
  Drop, 
  Check, 
  X
} from '@phosphor-icons/react';
import { INITIAL_COMMODITY_MODERATIONS } from './adminMockData';

export default function AdminCommodityModeration() {
  const [items, setItems] = useState(INITIAL_COMMODITY_MODERATIONS);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleApprove = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Disetujui', notes: 'Disetujui tampil di katalog utama pembeli.' };
      }
      return item;
    }));
    setSelectedItem(null);
  };

  const handleReject = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Ditolak', notes: 'Ditolak: Kualitas foto panen tidak jelas atau kadar air melebihi batas toleransi SNI.' };
      }
      return item;
    }));
    setSelectedItem(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div className="clone-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Moderasi Katalog Komoditas Panen
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
              Validasi kualitas panen, kadar air, foto asli produk, dan kewajaran harga sebelum diterbitkan ke pembeli.
            </p>
          </div>

          <div style={{
            background: 'rgba(84, 82, 246, 0.08)',
            border: '1px solid rgba(84, 82, 246, 0.2)',
            padding: '6px 14px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Menunggu Review</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5452f6' }}>
              {items.filter(i => i.status === 'Menunggu Moderasi').length} Komoditas
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Moderation Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.25rem'
      }}>
        {items.map((item) => (
          <div 
            key={item.id}
            className="clone-card"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                <img 
                  src={item.images[0]} 
                  alt={item.commodityName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span 
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: item.status === 'Disetujui' ? 'rgba(16, 185, 129, 0.9)' : item.status === 'Menunggu Moderasi' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    color: '#ffffff'
                  }}
                >
                  {item.status}
                </span>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#5452f6', fontWeight: 700, textTransform: 'uppercase' }}>
                {item.category} • ID: {item.id}
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0 0.4rem 0' }}>
                {item.commodityName}
              </h4>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Petani: <strong style={{ color: 'var(--text-primary)' }}>{item.farmerName}</strong>
              </div>

              <div style={{
                background: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.65rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                fontSize: '0.8rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Harga Pengajuan:</span>
                  <strong style={{ color: '#5452f6' }}>Rp {item.proposedPrice.toLocaleString('id-ID')}/kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Acuan Bapanas:</span>
                  <span>Rp {item.marketBenchmarkPrice.toLocaleString('id-ID')}/kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Stok Tersedia:</span>
                  <strong style={{ color: '#10b981' }}>{item.totalStockTon} Ton</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Kadar Air:</span>
                  <span>{item.moistureContent}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="clone-btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setSelectedItem(item)}
              >
                <Eye size={13} weight="bold" />
                <span>Detail</span>
              </button>

              {item.status === 'Menunggu Moderasi' && (
                <>
                  <button
                    type="button"
                    className="clone-btn-secondary"
                    style={{ color: '#ef4444', padding: '0.45rem' }}
                    onClick={() => handleReject(item.id)}
                    title="Tolak"
                  >
                    <X size={15} weight="bold" />
                  </button>
                  <button
                    type="button"
                    className="clone-btn-primary"
                    style={{ padding: '0.45rem 0.85rem' }}
                    onClick={() => handleApprove(item.id)}
                    title="Setujui"
                  >
                    <Check size={15} weight="bold" />
                    <span>Approve</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail */}
      {selectedItem && (
        <div className="clone-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="clone-modal-box" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <h3 className="clone-modal-title">Pemeriksaan Mutu Komoditas</h3>
              <button type="button" className="clone-modal-close" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="clone-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <img 
                src={selectedItem.images[0]} 
                alt={selectedItem.commodityName}
                style={{ width: '100%', height: '200px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div><strong>{selectedItem.commodityName}</strong> ({selectedItem.category})</div>
              <div>Lokasi: {selectedItem.location} • Masa Panen: {selectedItem.harvestPeriod}</div>
              <div style={{ background: 'var(--bg-canvas-subtle)', padding: '0.65rem', borderRadius: '6px' }}>
                Catatan: {selectedItem.notes}
              </div>
            </div>
            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-secondary" onClick={() => setSelectedItem(null)}>Tutup</button>
              {selectedItem.status === 'Menunggu Moderasi' && (
                <button type="button" className="clone-btn-primary" onClick={() => handleApprove(selectedItem.id)}>
                  Setujui Listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
