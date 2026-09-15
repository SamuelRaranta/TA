import React, { useState } from 'react';
import { 
  TrendUp, 
  TrendDown, 
  Equals, 
  Plus, 
  MagnifyingGlass, 
  ArrowClockwise, 
  PencilSimple, 
  Check, 
  X,
  Clock,
  ShieldCheck
} from '@phosphor-icons/react';
import { INITIAL_MARKET_PRICES } from '../farmer/mockData';

export default function AdminMarketPriceView() {
  const [prices, setPrices] = useState(INITIAL_MARKET_PRICES || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [editingPrice, setEditingPrice] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [newPriceVal, setNewPriceVal] = useState('');

  const filteredPrices = prices.filter(item => {
    const matchesSearch = 
      item.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.source || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'Semua' ? true : item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSyncBapanas = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert('Berhasil sinkronisasi harga pasar acuan terbaru dari API Badan Pangan Nasional (Bapanas) & PIBC Cipinang.');
    }, 1200);
  };

  const handleSavePrice = () => {
    if (!editingPrice || !newPriceVal) return;
    setPrices(prev => prev.map(p => {
      if (p.id === editingPrice.id) {
        return {
          ...p,
          marketPrice: Number(newPriceVal),
          updatedAt: 'Baru saja diupdate admin'
        };
      }
      return p;
    }));
    setEditingPrice(null);
    setNewPriceVal('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="clone-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Kelola Harga Pasar Acuan Minahasa & Sulut
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0.35rem 0 0 0' }}>
              Pusat referensi harga harian Bapanas Sulut, Distanbun Minahasa, ASPEKINDO, dan Pasar Tradisional Langowan/Kawangkoan.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button 
              type="button" 
              className="clone-btn-secondary"
              onClick={handleSyncBapanas}
              disabled={syncing}
            >
              <ArrowClockwise size={15} className={syncing ? 'spin-anim' : ''} weight="bold" />
              <span>{syncing ? 'Sinkronisasi...' : 'Tarik Data Bapanas'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="clone-card" style={{ padding: '0.85rem 1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
            <MagnifyingGlass size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Cari komoditas atau sumber acuan pasar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Semua', 'Beras', 'Bawang & Cabai', 'Jagung & Kedelai'].map(cat => (
              <button
                key={cat}
                type="button"
                className={`clone-tag-btn ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  background: categoryFilter === cat ? '#5452f6' : 'transparent',
                  color: categoryFilter === cat ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${categoryFilter === cat ? '#5452f6' : 'var(--border-subtle)'}`,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Market Benchmark Prices */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filteredPrices.map((item) => {
          const isUp = (item.changePercent || 0) > 0;
          const isDown = (item.changePercent || 0) < 0;

          return (
            <div 
              key={item.id}
              className="clone-card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.15rem' }}
            >
              <div>
                {/* Top source */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {item.source || 'Badan Pangan Nasional'}
                  </span>
                  <span 
                    style={{
                      fontSize: '0.70rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      color: isUp ? '#059669' : isDown ? '#dc2626' : '#64748b'
                    }}
                  >
                    {isUp && <TrendUp size={12} weight="bold" />}
                    {isDown && <TrendDown size={12} weight="bold" />}
                    {!isUp && !isDown && <Equals size={12} weight="bold" />}
                    <span>{item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent || 0}%`}</span>
                  </span>
                </div>

                {/* Commodity name */}
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>
                  {item.commodity}
                </h3>

                {/* Price Display */}
                <div style={{ background: '#f8fafc', padding: '0.75rem 0.85rem', borderRadius: '10px', marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Harga Acuan Resmi</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                    Rp {(item.marketPrice || 0).toLocaleString('id-ID')} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>/{item.unit || 'Kg'}</span>
                  </div>
                </div>

                {/* Floor / Ceiling guide */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <span>Batas Bawah: <strong>Rp {Math.round((item.marketPrice || 0) * 0.92).toLocaleString('id-ID')}</strong></span>
                  <span>Batas Atas: <strong>Rp {Math.round((item.marketPrice || 0) * 1.08).toLocaleString('id-ID')}</strong></span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.70rem', color: 'var(--text-secondary)' }}>
                  {item.updatedAt || 'Diperbarui hari ini'}
                </span>
                <button 
                  type="button" 
                  className="clone-tag-btn"
                  onClick={() => {
                    setEditingPrice(item);
                    setNewPriceVal(item.marketPrice || '');
                  }}
                >
                  <PencilSimple size={13} weight="bold" />
                  <span>Ubah Acuan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Ubah Harga Acuan */}
      {editingPrice && (
        <div className="clone-modal-overlay" onClick={() => setEditingPrice(null)}>
          <div className="clone-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="clone-modal-header">
              <h3 className="clone-modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                Ubah Harga Acuan: {editingPrice.commodity}
              </h3>
              <button type="button" className="clone-modal-close" onClick={() => setEditingPrice(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Sumber Acuan: <strong>{editingPrice.source}</strong>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Harga Acuan Baru (Rp / {editingPrice.unit || 'Kg'}):
                </label>
                <input 
                  type="number"
                  value={newPriceVal}
                  onChange={(e) => setNewPriceVal(e.target.value)}
                  placeholder="Contoh: 14500"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="clone-btn-secondary" onClick={() => setEditingPrice(null)}>
                  Batal
                </button>
                <button type="button" className="clone-btn-primary" onClick={handleSavePrice}>
                  <Check size={14} weight="bold" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
