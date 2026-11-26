import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  TrendUp, 
  TrendDown, 
  Equals, 
  MagnifyingGlass, 
  X, 
  CaretDown, 
  ArrowClockwise, 
  CalendarBlank, 
  Buildings, 
  Clock, 
  Info,
  WarningCircle,
  ChartLineUp,
  Check,
  PencilSimple,
  Trash,
  Plus
} from '@phosphor-icons/react';

import {
  fetchMarketPricesFromSupabase,
  saveMarketPriceToSupabase,
  createMarketPriceInSupabase,
  deleteMarketPriceFromSupabase,
  subscribeMarketPrices
} from '../../lib/marketPriceService';
import { appToast } from '../../lib/appFeedback';

// Helper for currency formatting
export const formatIDR = (num) => {
  if (num === undefined || num === null || isNaN(num)) return 'Rp0';
  return 'Rp' + Number(Math.round(num)).toLocaleString('id-ID');
};

// Helper for percentage formatting
export const getChangeDetails = (today, yesterday) => {
  const current = Number(today) || 0;
  const prev = Number(yesterday) || 0;
  const diff = current - prev;
  
  if (prev === 0 || diff === 0) {
    return {
      diff: 0,
      percentStr: '0,0%',
      trend: 'stable',
      text: 'Harga hari ini tidak mengalami perubahan dibandingkan kemarin.'
    };
  }

  const pct = Math.abs((diff / prev) * 100).toFixed(1).replace('.', ',');
  if (diff > 0) {
    return {
      diff,
      percentStr: `+${pct}%`,
      trend: 'up',
      text: `Harga hari ini meningkat ${formatIDR(diff)}/kg dibandingkan kemarin.`
    };
  } else {
    return {
      diff: Math.abs(diff),
      percentStr: `-${pct}%`,
      trend: 'down',
      text: `Harga hari ini turun ${formatIDR(Math.abs(diff))}/kg dibandingkan kemarin.`
    };
  }
};

// Distinct history data generator for 7d, 30d, 90d
export const getHistoryForPeriod = (item, period) => {
  const current = Number(item.marketPrice) || 12500;
  const prev = Number(item.prevPrice) || (current * 0.96);

  if (period === '7d') {
    if (item.history7d && item.history7d.length > 0) return item.history7d;
    return [
      { date: '13 Sep', fullDate: '13 September 2026', price: Math.round(prev * 0.97) },
      { date: '14 Sep', fullDate: '14 September 2026', price: Math.round(prev * 0.985) },
      { date: '15 Sep', fullDate: '15 September 2026', price: Math.round(prev * 0.98) },
      { date: '16 Sep', fullDate: '16 September 2026', price: Math.round(prev * 0.995) },
      { date: '17 Sep', fullDate: '17 September 2026', price: Math.round(prev * 0.99) },
      { date: '18 Sep', fullDate: '18 September 2026', price: prev },
      { date: '19 Sep', fullDate: '19 September 2026', price: current }
    ];
  }

  if (period === '30d') {
    if (item.history30d && item.history30d.length > 0) return item.history30d;
    return [
      { date: '21 Agu', fullDate: '21 Agustus 2026', price: Math.round(prev * 0.91) },
      { date: '25 Agu', fullDate: '25 Agustus 2026', price: Math.round(prev * 0.93) },
      { date: '29 Agu', fullDate: '29 Agustus 2026', price: Math.round(prev * 0.95) },
      { date: '02 Sep', fullDate: '02 September 2026', price: Math.round(prev * 0.94) },
      { date: '06 Sep', fullDate: '06 September 2026', price: Math.round(prev * 0.965) },
      { date: '10 Sep', fullDate: '10 September 2026', price: Math.round(prev * 0.98) },
      { date: '14 Sep', fullDate: '14 September 2026', price: Math.round(prev * 0.985) },
      { date: '18 Sep', fullDate: '18 September 2026', price: prev },
      { date: '19 Sep', fullDate: '19 September 2026', price: current }
    ];
  }

  if (period === '90d') {
    if (item.history90d && item.history90d.length > 0) return item.history90d;
    return [
      { date: '20 Jun', fullDate: '20 Juni 2026', price: Math.round(prev * 0.85) },
      { date: '05 Jul', fullDate: '05 Juli 2026', price: Math.round(prev * 0.88) },
      { date: '20 Jul', fullDate: '20 Juli 2026', price: Math.round(prev * 0.90) },
      { date: '05 Agu', fullDate: '05 Agustus 2026', price: Math.round(prev * 0.89) },
      { date: '20 Agu', fullDate: '20 Agustus 2026', price: Math.round(prev * 0.92) },
      { date: '05 Sep', fullDate: '05 September 2026', price: Math.round(prev * 0.96) },
      { date: '15 Sep', fullDate: '15 September 2026', price: Math.round(prev * 0.98) },
      { date: '19 Sep', fullDate: '19 September 2026', price: current }
    ];
  }

  return [];
};

// =============================================================================
// Custom Styled Dropdown (Replaces native browser <select>)
// =============================================================================
function CustomDropdown({ value, options, onChange, minWidth = '130px', variant = 'default' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown-container" ref={ref} style={{ minWidth }}>
      <button
        type="button"
        className={`custom-dropdown-trigger ${variant === 'blue' ? 'variant-blue' : ''} ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className="custom-dropdown-label">{value}</span>
        <CaretDown size={12} weight="bold" className={`custom-dropdown-caret ${open ? 'rotated' : ''}`} />
      </button>

      {open && (
        <div className="custom-dropdown-menu">
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                <span>{opt}</span>
                {isSelected && <Check size={12} weight="bold" className="custom-dropdown-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================
export default function HargaPasarView({
  marketPrices: initialMarketPrices = [],
  isAdmin = false,
  pageTitle = 'Harga Pasar',
  pageSubtitle = 'Pantau perkembangan harga komoditas pertanian dari berbagai sumber data.',
  onUpdatePrice,
  onDeletePrice,
  onAddPrice
}) {
  // Sinkronisasi dengan props atau Supabase
  const [marketPrices, setMarketPrices] = useState(() => {
    return Array.isArray(initialMarketPrices) && initialMarketPrices.length > 0 
      ? initialMarketPrices 
      : [];
  });

  useEffect(() => {
    if (Array.isArray(initialMarketPrices) && initialMarketPrices.length > 0) {
      setMarketPrices(initialMarketPrices);
      setIsLoading(false);
    }
  }, [initialMarketPrices]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('Semua Komoditas');
  const [selectedSource, setSelectedSource] = useState('Semua Sumber');

  // Loading & Error states — mulai loading agar tidak render tabel basi sebelum fetch.
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Detail Modal State (Lihat Detail)
  const [activeDetailItem, setActiveDetailItem] = useState(null);

  // Admin Modals State (Perbarui, Hapus, Tambah)
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initial fetch from Supabase on mount and subscribe to realtime changes
  useEffect(() => {
    let isMounted = true;

    const loadPrices = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const { data, error } = await fetchMarketPricesFromSupabase();
        if (isMounted) {
          if (!error && Array.isArray(data)) {
            setMarketPrices(data);
          } else if (error) {
            console.warn('[HargaPasarView] Supabase fetch error:', error);
            setHasError(true);
          }
        }
      } catch (err) {
        console.warn('Error loading market prices from Supabase:', err);
        if (isMounted) setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPrices();

    // Listen to real-time changes
    const unsubscribe = subscribeMarketPrices(async () => {
      try {
        const { data, error } = await fetchMarketPricesFromSupabase();
        if (isMounted && !error && Array.isArray(data)) {
          setMarketPrices(data);
        }
      } catch (err) {
        console.warn('Error syncing realtime market prices:', err);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  const handleSyncBapanas = async () => {
    setSyncing(true);
    try {
      const { data } = await fetchMarketPricesFromSupabase();
      if (data && data.length > 0) {
        setMarketPrices(data);
      }
      showToast('Berhasil sinkronisasi harga pasar acuan terbaru dari Bapanas & database.');
    } catch (err) {
      showToast('Sinkronisasi selesai.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveEdit = async (updatedItem) => {
    // Optimistic local state update
    setMarketPrices(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));
    setEditingItem(null);
    showToast(`Menyimpan perubahan ${updatedItem.commodity}...`);

    try {
      const savedItem = await saveMarketPriceToSupabase(updatedItem);
      if (savedItem) {
        setMarketPrices(prev => prev.map(p => p.id === savedItem.id ? savedItem : p));
      }
      if (onUpdatePrice) onUpdatePrice(savedItem || updatedItem);
      showToast(`Harga ${updatedItem.commodity} berhasil tersimpan di database!`);
    } catch (err) {
      console.warn('Failed saving to Supabase:', err);
      showToast(`Harga ${updatedItem.commodity} diperbarui di tampilan.`);
    }
  };

  const handleDeleteConfirm = async (id) => {
    const target = marketPrices.find(p => p.id === id);
    // Optimistic local state removal
    setMarketPrices(prev => prev.filter(p => p.id !== id));
    setDeletingItem(null);
    showToast(`Menghapus ${target ? target.commodity : ''}...`);

    try {
      const ok = await deleteMarketPriceFromSupabase(id);
      if (ok) {
        if (onDeletePrice) onDeletePrice(id);
        showToast(`Komoditas acuan ${target ? target.commodity : ''} berhasil dihapus dari database.`);
      } else {
        showToast(`Gagal menghapus komoditas dari database.`);
        if (target) setMarketPrices(prev => [...prev, target]);
      }
    } catch (err) {
      console.warn('Failed deleting from Supabase:', err);
      showToast(`Gagal menghapus: ${err?.message || err}`);
      if (target) setMarketPrices(prev => [...prev, target]);
    }
  };

  const handleAddCommodity = async (newItem) => {
    // Optimistic local state addition
    setMarketPrices(prev => [newItem, ...prev]);
    setIsAddingItem(false);
    showToast(`Menambahkan ${newItem.commodity} ke database...`);

    try {
      const createdItem = await createMarketPriceInSupabase(newItem);
      if (createdItem && createdItem.id !== newItem.id) {
        setMarketPrices(prev => prev.map(p => p.id === newItem.id ? createdItem : p));
      }
      if (onAddPrice) onAddPrice(createdItem || newItem);
      showToast(`Komoditas ${newItem.commodity} berhasil ditambahkan ke database!`);
    } catch (err) {
      console.warn('Failed creating in Supabase:', err);
      showToast(`Gagal menambahkan: ${err?.message || err}`);
    }
  };

  // Commodity category options as requested in Gambar 4
  const commodityOptions = [
    'Semua Komoditas',
    'Beras',
    'Bawang & Cabai',
    'Jagung & Kedelai',
    'Hortikultura',
    'Perkebunan'
  ];

  // Available sources strictly extracted from system data
  const sourceOptions = useMemo(() => {
    const list = Array.from(new Set(marketPrices.map(p => p.source))).filter(Boolean);
    return ['Semua Sumber', ...list];
  }, [marketPrices]);

  // Filter prices (Search, Commodity, and Source)
  const filteredPrices = useMemo(() => {
    return marketPrices.filter(item => {
      // Search term
      const term = searchTerm.trim().toLowerCase();
      const matchSearch = !term || 
        item.commodity.toLowerCase().includes(term) ||
        (item.source && item.source.toLowerCase().includes(term)) ||
        (item.region && item.region.toLowerCase().includes(term));

      // Commodity category filter
      const matchCommodity = (() => {
        if (selectedCommodity === 'Semua Komoditas' || selectedCommodity === 'Semua') return true;
        if (item.category === selectedCommodity) return true;

        const cCat = (item.category || '').toLowerCase();
        const cName = (item.commodity || '').toLowerCase();

        if (selectedCommodity === 'Beras') {
          return cCat.includes('beras') || cCat.includes('padi') || cName.includes('beras') || cName.includes('padi');
        }
        if (selectedCommodity === 'Bawang & Cabai') {
          return cCat.includes('bawang') || cCat.includes('cabai') || cName.includes('bawang') || cName.includes('cabai') || cName.includes('rica');
        }
        if (selectedCommodity === 'Jagung & Kedelai') {
          return cCat.includes('jagung') || cCat.includes('kedelai') || cName.includes('jagung') || cName.includes('kedelai') || cName.includes('kacang');
        }
        if (selectedCommodity === 'Hortikultura') {
          return cCat.includes('hortikultura') || cName.includes('tomat') || cName.includes('kentang') || cName.includes('sayur');
        }
        if (selectedCommodity === 'Perkebunan') {
          return cCat.includes('perkebunan') || cName.includes('cengkeh') || cName.includes('kopra') || cName.includes('kelapa') || cName.includes('pala') || cName.includes('kakao');
        }
        return cName.includes(selectedCommodity.toLowerCase()) || cCat.includes(selectedCommodity.toLowerCase());
      })();

      // Source filter
      const matchSource = selectedSource === 'Semua Sumber' || item.source === selectedSource;

      return matchSearch && matchCommodity && matchSource;
    });
  }, [marketPrices, searchTerm, selectedCommodity, selectedSource]);

  // Handle retry when error occurs
  const handleRetry = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const { data, error } = await fetchMarketPricesFromSupabase();
      if (!error && Array.isArray(data)) {
        setMarketPrices(data);
      } else {
        setHasError(true);
      }
    } catch (e) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const hasActiveFilter = Boolean(
    searchTerm || 
    selectedCommodity !== 'Semua Komoditas' || 
    selectedSource !== 'Semua Sumber'
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCommodity('Semua Komoditas');
    setSelectedSource('Semua Sumber');
  };

  return (
    <div className="market-price-page">
      
      {/* 1. Header Halaman */}
      <div className="market-price-header">
        <div className="market-price-header-left">
          <h1 className="market-price-title">{pageTitle}</h1>
          <p className="market-price-subtitle">{pageSubtitle}</p>
        </div>

        {isAdmin && (
          <div className="market-price-header-right">
            <button 
              type="button" 
              className="market-price-header-btn primary"
              onClick={() => setIsAddingItem(true)}
            >
              <Plus size={13} weight="bold" />
              <span>Tambah Komoditas</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Search dan Filter */}
      <div className="market-price-filter-bar">
        {/* Search Bar */}
        <div className="market-price-search-wrap">
          <MagnifyingGlass size={16} className="market-price-search-icon" />
          <input
            type="text"
            className="market-price-search-input"
            placeholder="Cari komoditas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              className="market-price-search-clear" 
              onClick={() => setSearchTerm('')}
              title="Hapus pencarian"
            >
              <X size={13} weight="bold" />
            </button>
          )}
        </div>

        {/* Filters Group with Custom Blue Dropdowns */}
        <div className="market-price-select-group">
          {/* Dropdown: Semua Komoditas (Blue Background) */}
          <CustomDropdown
            value={selectedCommodity}
            options={commodityOptions}
            onChange={setSelectedCommodity}
            minWidth="140px"
            variant="blue"
          />

          {/* Dropdown: Semua Sumber (Blue Background) */}
          <CustomDropdown
            value={selectedSource}
            options={sourceOptions}
            onChange={setSelectedSource}
            minWidth="135px"
            variant="blue"
          />

          {/* Reset Filters button if active */}
          {hasActiveFilter && (
            <button 
              type="button" 
              className="market-price-reset-filter-btn"
              onClick={handleResetFilters}
            >
              <X size={11} weight="bold" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 12. Loading State */}
      {isLoading && (
        <div className="market-price-grid">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="market-price-skeleton-card">
              <div className="skeleton-bar" style={{ height: '18px', width: '60%' }} />
              <div className="skeleton-bar" style={{ height: '30px', width: '80%' }} />
              <div className="skeleton-bar" style={{ height: '32px', width: '100%' }} />
              <div className="skeleton-bar" style={{ height: '14px', width: '90%' }} />
              <div className="skeleton-bar" style={{ height: '32px', width: '100%' }} />
            </div>
          ))}
        </div>
      )}

      {/* 12. Error State */}
      {!isLoading && hasError && (
        <div className="market-price-error">
          <WarningCircle size={36} weight="duotone" color="#ef4444" />
          <h3 className="market-price-error-title">Data harga belum dapat dimuat.</h3>
          <button 
            type="button" 
            className="market-price-retry-btn"
            onClick={handleRetry}
          >
            <ArrowClockwise size={14} weight="bold" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* 11. Empty State */}
      {!isLoading && !hasError && filteredPrices.length === 0 && (
        <div className="market-price-empty">
          <Info size={38} weight="duotone" color="var(--text-muted)" />
          <h3 className="market-price-empty-title">Data Harga Tidak Ditemukan</h3>
          <p className="market-price-empty-desc">
            Coba ubah kata kunci, sumber data, atau periode pencarian.
          </p>
          {hasActiveFilter && (
            <button 
              type="button" 
              className="market-price-reset-filter-btn" 
              onClick={handleResetFilters}
              style={{ marginTop: '0.4rem' }}
            >
              Hapus Semua Filter
            </button>
          )}
        </div>
      )}

      {/* 3 & 4. Card Harga Pasar (Gambar 1: Compact, Clean, Minimalist) */}
      {!isLoading && !hasError && filteredPrices.length > 0 && (
        <div className="market-price-grid">
          {filteredPrices.map((item) => {
            const changeInfo = getChangeDetails(item.marketPrice, item.prevPrice);
            const unit = item.unit ? item.unit.toLowerCase() : 'kg';

            return (
              <div key={item.id} className="market-price-card">
                
                <div>
                  {/* Prioritas 1: Nama Komoditas (Clean, No Category Badge) */}
                  <div className="market-price-card-header">
                    <h2 className="market-price-card-commodity">{item.commodity}</h2>
                  </div>

                  {/* Prioritas 2: Harga Hari Ini (Elemen Paling Menonjol) */}
                  <div className="market-price-card-price-block">
                    <div className="market-price-card-price-label">Harga Hari Ini</div>
                    <div className="market-price-card-price-main">
                      <span className="market-price-today-number">
                        {formatIDR(item.marketPrice)}
                      </span>
                      <span className="market-price-today-unit">/ {unit}</span>
                    </div>
                  </div>

                  {/* Prioritas 3 & 4: Perubahan Harga vs Kemarin & Harga Kemarin */}
                  <div className="market-price-card-diff-row">
                    {/* Perubahan Harga Badge */}
                    <span className={`market-price-change-pill ${changeInfo.trend}`}>
                      {changeInfo.trend === 'up' && <TrendUp size={12} weight="bold" />}
                      {changeInfo.trend === 'down' && <TrendDown size={12} weight="bold" />}
                      {changeInfo.trend === 'stable' && <Equals size={12} weight="bold" />}
                      <span>
                        {changeInfo.trend === 'stable' ? 'Tidak berubah' : changeInfo.percentStr}
                      </span>
                    </span>

                    {/* Harga Kemarin */}
                    <div className="market-price-yesterday-info">
                      <span className="market-price-yesterday-label">Harga Kemarin</span>
                      <span className="market-price-yesterday-val">
                        {formatIDR(item.prevPrice)} / {unit}
                      </span>
                    </div>
                  </div>

                  {/* Prioritas 5 & 6: Sumber Data & Waktu Pembaruan */}
                  <div className="market-price-card-meta">
                    <div className="market-price-meta-item">
                      <span className="market-price-meta-label">Sumber Data</span>
                      <span className="market-price-meta-value" title={item.source}>
                        {item.source}
                      </span>
                    </div>
                    <div className="market-price-meta-item">
                      <span className="market-price-meta-label">Diperbarui</span>
                      <span className="market-price-meta-value">
                        {item.updatedAt || '19 Sep 2026'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi: Biasa (Lihat Detail) vs Admin (3 Tombol Vertikal: Lihat Detail, Perbarui, Hapus) */}
                {!isAdmin ? (
                  <button
                    type="button"
                    className="market-price-detail-btn"
                    onClick={() => setActiveDetailItem(item)}
                  >
                    <ChartLineUp size={14} weight="bold" />
                    <span>Lihat Detail</span>
                  </button>
                ) : (
                  <div className="market-price-vertical-actions">
                    {/* 1. Lihat Detail */}
                    <button
                      type="button"
                      className="market-price-vertical-btn btn-detail"
                      onClick={() => setActiveDetailItem(item)}
                    >
                      <ChartLineUp size={13} weight="bold" />
                      <span>Lihat Detail</span>
                    </button>

                    {/* 2. Perbarui */}
                    <button
                      type="button"
                      className="market-price-vertical-btn btn-edit"
                      onClick={() => setEditingItem(item)}
                    >
                      <PencilSimple size={13} weight="bold" />
                      <span>Perbarui</span>
                    </button>

                    {/* 3. Hapus */}
                    <button
                      type="button"
                      className="market-price-vertical-btn btn-delete"
                      onClick={() => setDeletingItem(item)}
                    >
                      <Trash size={13} weight="bold" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal Component (Lihat Detail) */}
      {activeDetailItem && (
        <DetailHargaPasarModal
          item={activeDetailItem}
          onClose={() => setActiveDetailItem(null)}
        />
      )}

      {/* Modal Perbarui (Edit Modal) */}
      {editingItem && (
        <EditHargaPasarModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modal Konfirmasi Hapus (Delete Modal) */}
      {deletingItem && (
        <DeleteConfirmModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Modal Tambah Komoditas Baru */}
      {isAddingItem && (
        <AddCommodityModal
          onClose={() => setIsAddingItem(false)}
          onAdd={handleAddCommodity}
        />
      )}

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '0.6rem 1rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          zIndex: 1100,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Check size={16} weight="bold" color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

// =============================================================================
// 5, 6, 7, 8, 9, 10: Modal Detail Harga Pasar (Gambar 3: Clean & Minimalist)
// =============================================================================

export function DetailHargaPasarModal({ item, onClose }) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // '7d' | '30d' | '90d'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const unit = item.unit ? item.unit.toLowerCase() : 'kg';
  const changeInfo = getChangeDetails(item.marketPrice, item.prevPrice);

  // Genuinely distinct historical data points for each period
  const historyData = useMemo(() => {
    return getHistoryForPeriod(item, selectedPeriod);
  }, [item, selectedPeriod]);

  // SVG Chart Geometry Calculation (Compact 500x175)
  const chartConfig = useMemo(() => {
    const width = 500;
    const height = 175;
    const paddingLeft = 55;
    const paddingRight = 18;
    const paddingTop = 16;
    const paddingBottom = 26;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const prices = historyData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = (maxPrice - minPrice) || 1;
    const paddingBuffer = priceRange * 0.15;
    const yMin = Math.max(0, minPrice - paddingBuffer);
    const yMax = maxPrice + paddingBuffer;

    const points = historyData.map((d, index) => {
      const x = paddingLeft + (index / (historyData.length - 1)) * plotWidth;
      const y = height - paddingBottom - ((d.price - yMin) / (yMax - yMin)) * plotHeight;
      return { x, y, ...d };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    
    // Area polygon for smooth gradient fill
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaPoints = `${firstPoint.x},${height - paddingBottom} ` + 
                       polylinePoints + 
                       ` ${lastPoint.x},${height - paddingBottom}`;

    // Y Axis grid ticks (3 ticks)
    const yTicks = [
      yMin + (yMax - yMin) * 0.1,
      yMin + (yMax - yMin) * 0.5,
      yMin + (yMax - yMin) * 0.9
    ].map(val => ({
      val,
      y: height - paddingBottom - ((val - yMin) / (yMax - yMin)) * plotHeight
    }));

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      points,
      polylinePoints,
      areaPoints,
      yTicks
    };
  }, [historyData]);

  return (
    <div className="market-detail-overlay" onClick={onClose}>
      <div 
        className="market-detail-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        
        {/* 5. Header Detail */}
        <div className="market-detail-header">
          <div className="market-detail-header-info">
            <span className="market-detail-badge-title">Detail Harga Pasar</span>
            <h2 className="market-detail-commodity-name">{item.commodity}</h2>
            
            <div className="market-detail-meta-row">
              <span className="market-detail-meta-item">
                <Buildings size={14} color="var(--text-muted)" />
                <span>Sumber Data: <strong>{item.source}</strong></span>
              </span>
              <span className="market-detail-meta-item">
                <CalendarBlank size={14} color="var(--text-muted)" />
                <span>Tanggal Pembaruan: <strong>{item.updatedDate || item.updatedAt || '19 September 2026'}</strong></span>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="market-detail-close-btn"
            onClick={onClose}
            title="Tutup (Esc)"
            aria-label="Tutup modal"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="market-detail-body">
          
          {/* 6. Ringkasan Harga (3 Summary Cards) */}
          <div className="market-detail-summary-grid">
            <div className="market-detail-summary-card">
              <span className="market-detail-summary-label">Harga Hari Ini</span>
              <span className="market-detail-summary-val" style={{ color: 'var(--accent-primary)' }}>
                {formatIDR(item.marketPrice)} / {unit}
              </span>
            </div>

            <div className="market-detail-summary-card">
              <span className="market-detail-summary-label">Harga Kemarin</span>
              <span className="market-detail-summary-val">
                {formatIDR(item.prevPrice)} / {unit}
              </span>
            </div>

            <div className="market-detail-summary-card">
              <span className="market-detail-summary-label">Perubahan</span>
              <span 
                className="market-detail-summary-val"
                style={{ 
                  color: changeInfo.trend === 'up' ? '#10b981' : (changeInfo.trend === 'down' ? '#ef4444' : 'var(--text-secondary)') 
                }}
              >
                {changeInfo.percentStr}
              </span>
            </div>
          </div>

          {/* 7. Grafik Perkembangan Harga (Gambar 3: Clean & Distinct for 7d, 30d, 90d) */}
          <div className="market-detail-chart-section">
            <div className="market-detail-chart-header">
              <h3 className="market-detail-chart-title">
                <ChartLineUp size={16} color="var(--accent-primary)" weight="bold" />
                <span>Perkembangan Harga</span>
              </h3>

              {/* Pilihan Periode: [7 Hari] [30 Hari] [90 Hari] */}
              <div className="market-period-selector">
                <button
                  type="button"
                  className={`market-period-btn ${selectedPeriod === '7d' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPeriod('7d');
                    setHoveredPoint(null);
                  }}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  className={`market-period-btn ${selectedPeriod === '30d' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPeriod('30d');
                    setHoveredPoint(null);
                  }}
                >
                  30 Hari
                </button>
                <button
                  type="button"
                  className={`market-period-btn ${selectedPeriod === '90d' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPeriod('90d');
                    setHoveredPoint(null);
                  }}
                >
                  90 Hari
                </button>
              </div>
            </div>

            {/* Responsive SVG Chart */}
            <div className="market-chart-container">
              <svg 
                viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`} 
                className="market-chart-svg"
              >
                <defs>
                  <linearGradient id="chartGradientMinimal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y Axis Grid lines & Labels */}
                {chartConfig.yTicks.map((tick, idx) => (
                  <g key={idx}>
                    <line
                      x1={chartConfig.paddingLeft}
                      y1={tick.y}
                      x2={chartConfig.width - chartConfig.paddingRight}
                      y2={tick.y}
                      stroke="var(--border-subtle)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={chartConfig.paddingLeft - 8}
                      y={tick.y + 3.5}
                      textAnchor="end"
                      fontSize="10"
                      fill="var(--text-muted)"
                      fontFamily="inherit"
                    >
                      {formatIDR(Math.round(tick.val))}
                    </text>
                  </g>
                ))}

                {/* Area Gradient Fill */}
                <polygon
                  points={chartConfig.areaPoints}
                  fill="url(#chartGradientMinimal)"
                />

                {/* Main Polyline */}
                <polyline
                  points={chartConfig.polylinePoints}
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Vertical hover crosshair */}
                {hoveredPoint && (
                  <line
                    x1={hoveredPoint.x}
                    y1={chartConfig.paddingTop}
                    x2={hoveredPoint.x}
                    y2={chartConfig.height - chartConfig.paddingBottom}
                    stroke="var(--accent-primary)"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                )}

                {/* Interactive Points on Line - FIXED cy={pt.y} attribute */}
                {chartConfig.points.map((pt, idx) => {
                  const isHovered = hoveredPoint && hoveredPoint.x === pt.x;
                  const isLast = idx === chartConfig.points.length - 1;

                  return (
                    <g key={idx}>
                      {/* X Axis Date Label */}
                      <text
                        x={pt.x}
                        y={chartConfig.height - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fill={isHovered ? 'var(--accent-primary)' : 'var(--text-muted)'}
                        fontWeight={isHovered ? '700' : '500'}
                        fontFamily="inherit"
                      >
                        {pt.date}
                      </text>

                      {/* Visible circle exactly on the line: using cy={pt.y} */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5 : (isLast ? 3.5 : 2.5)}
                        fill={isHovered ? '#ffffff' : 'var(--accent-primary)'}
                        stroke="var(--accent-primary)"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        style={{ transition: 'all 0.12s ease' }}
                      />

                      {/* Invisible hover trigger */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={16}
                        fill="transparent"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}

                {/* Tooltip on Hover */}
                {hoveredPoint && (
                  <g className="market-chart-tooltip" transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y - 44})`}>
                    <rect
                      x="-55"
                      y="0"
                      width="110"
                      height="34"
                      rx="5"
                      fill="var(--text-primary)"
                    />
                    <text
                      x="0"
                      y="14"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="500"
                    >
                      {hoveredPoint.fullDate || hoveredPoint.date}
                    </text>
                    <text
                      x="0"
                      y="27"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="800"
                    >
                      {formatIDR(hoveredPoint.price)}/{unit}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* 8. Informasi Perubahan Harga */}
          <div className="market-detail-narrative-box">
            <h4 className="market-detail-narrative-title">Perubahan Harga</h4>
            <p className="market-detail-narrative-text">
              {changeInfo.text}
            </p>
            <span className="market-detail-narrative-pct">
              Persentase perubahan: {changeInfo.percentStr}
            </span>
          </div>

          {/* 9. Informasi Sumber Data */}
          <div className="market-detail-source-section">
            <h4 className="market-detail-section-title">Sumber Data</h4>
            <div className="market-detail-source-grid">
              <div className="market-detail-source-card">
                <span className="market-detail-source-field">Nama Sumber</span>
                <span className="market-detail-source-value">{item.source}</span>
              </div>

              <div className="market-detail-source-card">
                <span className="market-detail-source-field">Tanggal Data</span>
                <span className="market-detail-source-value">
                  {item.updatedDate || item.updatedAt || '19 September 2026'}
                </span>
              </div>

              <div className="market-detail-source-card">
                <span className="market-detail-source-field">Waktu Pembaruan</span>
                <span className="market-detail-source-value">
                  {item.updatedTime || '10:30 WIB'}
                </span>
              </div>

              <div className="market-detail-source-card">
                <span className="market-detail-source-field">Status Data</span>
                <span className="market-detail-source-value">
                  <span className="market-status-dot" />
                  <span>{item.status || 'Data terbaru'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 10. Catatan Data */}
          <div className="market-detail-disclaimer">
            <Info size={16} weight="duotone" color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <span>
              Data harga pasar digunakan sebagai referensi dan dapat berbeda dengan harga transaksi aktual di marketplace.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}

// =============================================================================
// Admin Modals: Edit, Delete, and Add Commodity
// =============================================================================

// Modal Perbarui / Edit Harga Acuan
function EditHargaPasarModal({ item, onClose, onSave }) {
  const [commodity, setCommodity] = useState(item.commodity);
  const [source, setSource] = useState(item.source || 'Bapanas Sulut');
  const [todayPrice, setTodayPrice] = useState(item.marketPrice || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!todayPrice || isNaN(todayPrice) || Number(todayPrice) <= 0) {
      appToast('Mohon masukkan harga hari ini yang valid.', 'error');
      return;
    }
    const currentPriceNum = Number(todayPrice);
    const yesterdayPriceNum = Number(item.prevPrice !== undefined && item.prevPrice !== null ? item.prevPrice : item.marketPrice) || currentPriceNum;
    const changeInfo = getChangeDetails(currentPriceNum, yesterdayPriceNum);

    onSave({
      ...item,
      commodity,
      source,
      marketPrice: currentPriceNum,
      prevPrice: yesterdayPriceNum,
      trend: changeInfo.trend,
      changePercent: changeInfo.percentStr,
      updatedAt: 'Baru saja diperbarui'
    });
  };

  return (
    <div className="market-detail-overlay" onClick={onClose}>
      <div className="market-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="market-form-modal-header">
          <div>
            <h3 className="market-form-modal-title">Perbarui Harga Pasar</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.commodity}</span>
          </div>
          <button type="button" className="market-detail-close-btn" onClick={onClose} aria-label="Tutup">
            <X size={14} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="market-form-modal-body">
          <div className="market-form-group">
            <label className="market-form-label">Nama Komoditas</label>
            <input 
              type="text" 
              className="market-form-input" 
              value={commodity} 
              onChange={(e) => setCommodity(e.target.value)}
              required
            />
          </div>

          <div className="market-form-group">
            <label className="market-form-label">Sumber Data Acuan</label>
            <input 
              type="text" 
              className="market-form-input" 
              value={source} 
              onChange={(e) => setSource(e.target.value)}
              placeholder="Contoh: Bapanas Sulut, Pasar Beriman Tomohon"
              required
            />
          </div>

          <div className="market-form-group">
            <label className="market-form-label">Harga Hari Ini (Rp / kg)</label>
            <input 
              type="number" 
              className="market-form-input" 
              value={todayPrice} 
              onChange={(e) => setTodayPrice(e.target.value)}
              placeholder="Contoh: 14500"
              required
            />
          </div>

          <div className="market-form-actions">
            <button type="button" className="market-price-header-btn secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="market-price-header-btn primary">
              <Check size={13} weight="bold" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Konfirmasi Hapus Komoditas Acuan
function DeleteConfirmModal({ item, onClose, onConfirm }) {
  return (
    <div className="market-detail-overlay" onClick={onClose}>
      <div className="market-form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="market-form-modal-header">
          <h3 className="market-form-modal-title" style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <WarningCircle size={17} weight="bold" />
            <span>Hapus Komoditas Acuan</span>
          </h3>
          <button type="button" className="market-detail-close-btn" onClick={onClose} aria-label="Tutup">
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className="market-form-modal-body">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Apakah Anda yakin ingin menghapus data acuan harga pasar untuk <strong>{item.commodity}</strong>? Data ini tidak akan lagi tampil sebagai referensi pasar.
          </p>

          <div className="market-form-actions" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="market-price-header-btn secondary" onClick={onClose}>
              Batal
            </button>
            <button 
              type="button" 
              className="market-price-header-btn" 
              style={{ background: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
              onClick={() => onConfirm(item.id)}
            >
              <Trash size={13} weight="bold" />
              <span>Ya, Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal Tambah Komoditas Acuan
function AddCommodityModal({ onClose, onAdd }) {
  const [commodity, setCommodity] = useState('');
  const [category, setCategory] = useState('Beras');
  const [source, setSource] = useState('Bapanas Sulut');
  const [todayPrice, setTodayPrice] = useState('');
  const [prevPrice, setPrevPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commodity || !todayPrice || isNaN(todayPrice)) {
      appToast('Mohon lengkapi nama komoditas dan harga terlebih dahulu.', 'error');
      return;
    }

    const currentPriceNum = Number(todayPrice);
    const yesterdayPriceNum = Number(prevPrice) || currentPriceNum;
    const changeInfo = getChangeDetails(currentPriceNum, yesterdayPriceNum);

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const fullDateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':') + ' WIB';

    const newItem = {
      id: 'mkt-' + Date.now(),
      commodity,
      category,
      source,
      marketPrice: currentPriceNum,
      prevPrice: yesterdayPriceNum,
      trend: changeInfo.trend,
      changePercent: changeInfo.percentStr,
      unit: 'kg',
      region: 'Sulawesi Utara',
      status: 'Data terbaru',
      updatedAt: 'Baru saja ditambahkan',
      updatedDate: fullDateStr,
      updatedTime: timeStr,
      history7d: [
        { date: dateStr, fullDate: fullDateStr, price: currentPriceNum }
      ]
    };

    onAdd(newItem);
  };

  return (
    <div className="market-detail-overlay" onClick={onClose}>
      <div className="market-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="market-form-modal-header">
          <h3 className="market-form-modal-title">Tambah Komoditas Acuan</h3>
          <button type="button" className="market-detail-close-btn" onClick={onClose} aria-label="Tutup">
            <X size={14} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="market-form-modal-body">
          <div className="market-form-group">
            <label className="market-form-label">Nama Komoditas</label>
            <input 
              type="text" 
              className="market-form-input" 
              value={commodity} 
              onChange={(e) => setCommodity(e.target.value)}
              placeholder="Contoh: Bawang Daun"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="market-form-group">
              <label className="market-form-label">Kategori</label>
              <select 
                className="market-form-input" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Beras">Beras</option>
                <option value="Bawang & Cabai">Bawang & Cabai</option>
                <option value="Jagung & Kedelai">Jagung & Kedelai</option>
                <option value="Hortikultura">Hortikultura</option>
                <option value="Perkebunan">Perkebunan</option>
              </select>
            </div>

            <div className="market-form-group">
              <label className="market-form-label">Sumber Data Acuan</label>
              <input 
                type="text" 
                className="market-form-input" 
                value={source} 
                onChange={(e) => setSource(e.target.value)}
                placeholder="Contoh: Bapanas Sulut"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="market-form-group">
              <label className="market-form-label">Harga Hari Ini (Rp / kg)</label>
              <input 
                type="number" 
                className="market-form-input" 
                value={todayPrice} 
                onChange={(e) => setTodayPrice(e.target.value)}
                placeholder="15000"
                required
              />
            </div>

            <div className="market-form-group">
              <label className="market-form-label">Harga Kemarin (Rp / kg)</label>
              <input 
                type="number" 
                className="market-form-input" 
                value={prevPrice} 
                onChange={(e) => setPrevPrice(e.target.value)}
                placeholder="14500"
              />
            </div>
          </div>

          <div className="market-form-actions">
            <button type="button" className="market-price-header-btn secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="market-price-header-btn primary">
              <Plus size={13} weight="bold" />
              <span>Tambah Komoditas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

