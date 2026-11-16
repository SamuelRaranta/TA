import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  CaretDown, 
  Plant, 
  Package, 
  CurrencyCircleDollar, 
  Star, 
  X, 
  ArrowCounterClockwise,
  Check 
} from '@phosphor-icons/react';

export default function AdvanceSearchPanel({
  commodity = '',
  onCommodityChange,
  minStock = '',
  onMinStockChange,
  maxPrice = '',
  onMaxPriceChange,
  minReview = '',
  onMinReviewChange,
  onReset,
  onApply,
  totalResults,
  isLoading = false,
  isRecommendationActive = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [appliedFeedback, setAppliedFeedback] = useState(false);

  // Count active advance search filters
  const activeCount = [
    Boolean(commodity && commodity.trim()),
    Boolean(minStock !== '' && minStock !== null && minStock !== undefined),
    Boolean(maxPrice !== '' && maxPrice !== null && maxPrice !== undefined),
    Boolean(minReview !== '' && minReview !== null && minReview !== undefined)
  ].filter(Boolean).length;

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      if (onCommodityChange) onCommodityChange('');
      if (onMinStockChange) onMinStockChange('');
      if (onMaxPriceChange) onMaxPriceChange('');
      if (onMinReviewChange) onMinReviewChange('');
    }
  };

  const handleApply = () => {
    if (isLoading) return;
    if (onApply) {
      onApply({ commodity, minStock, maxPrice, minReview });
    }
    setAppliedFeedback(true);
    setTimeout(() => {
      setAppliedFeedback(false);
    }, 1800);
  };

  return (
    <div className={`advance-search-wrapper ${className}`}>
      {/* Toggle Button Under Search Bar */}
      <div className="advance-search-toggle-row">
        <button
          type="button"
          className={`advance-search-toggle-btn ${isOpen ? 'active' : ''} ${activeCount > 0 ? 'has-filter' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Buka / Tutup Pencarian Lanjutan"
        >
          <SlidersHorizontal size={15} weight="bold" />
          <span>Advance Search</span>
          {activeCount > 0 && (
            <span className="advance-search-badge">{activeCount}</span>
          )}
          <CaretDown 
            size={14} 
            weight="bold" 
            className={`advance-caret-icon ${isOpen ? 'rotated' : ''}`} 
          />
        </button>

        {activeCount > 0 && !isOpen && (
          <button 
            type="button" 
            className="advance-quick-reset-btn"
            onClick={handleReset}
            title="Reset semua filter lanjutan"
          >
            <ArrowCounterClockwise size={12} weight="bold" />
            <span>Reset Advance ({activeCount})</span>
          </button>
        )}
      </div>

      {/* Expandable Inputs Box */}
      {isOpen && (
        <div className="advance-search-panel">
          <div className="advance-search-header">
            <div className="advance-search-title-group">
              <span className="advance-search-title">Pencarian Lanjutan (Advance Search)</span>
              <span className="advance-search-sub">Ketik langsung kriteria nama komoditas, stok, harga, atau review</span>
            </div>

            {/* Header Action Buttons: Reset & Apply */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeCount > 0 && (
                <button 
                  type="button" 
                  className="advance-search-reset-btn"
                  onClick={handleReset}
                  title="Hapus semua nilai input lanjutan"
                >
                  <ArrowCounterClockwise size={13} weight="bold" />
                  <span>Reset Semua</span>
                </button>
              )}
              <button 
                type="button" 
                className="advance-search-apply-btn"
                onClick={handleApply}
                disabled={isLoading}
                title="Terapkan pencarian lanjutan dan hitung rekomendasi"
                style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer', padding: '0.42rem 0.9rem', fontSize: '0.8rem' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border-sm" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid currentColor', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}></span>
                    <span>Menghitung...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} weight="bold" />
                    <span>{appliedFeedback ? '✓ Diterapkan' : 'Apply'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="advance-search-grid">
            {/* 1. Nama Komoditas */}
            <div className="advance-search-field">
              <label className="advance-field-label">Nama Komoditas</label>
              <div className="advance-input-box">
                <Plant size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Ketik nama komoditas..."
                  value={commodity}
                  onChange={(e) => onCommodityChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                />
                {commodity && (
                  <button 
                    type="button" 
                    className="advance-clear-input"
                    onClick={() => onCommodityChange('')}
                    title="Hapus nama"
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Stok Minimum */}
            <div className="advance-search-field">
              <label className="advance-field-label">Minimal Stok (Ton)</label>
              <div className="advance-input-box">
                <Package size={16} color="#94a3b8" />
                <input
                  type="number"
                  min="0"
                  placeholder="Ketik minimal stok..."
                  value={minStock}
                  onChange={(e) => onMinStockChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                />
                {minStock !== '' && (
                  <button 
                    type="button" 
                    className="advance-clear-input"
                    onClick={() => onMinStockChange('')}
                    title="Hapus stok"
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Harga Maksimum */}
            <div className="advance-search-field">
              <label className="advance-field-label">Maks. Harga (Rp/kg)</label>
              <div className="advance-input-box">
                <CurrencyCircleDollar size={16} color="#94a3b8" />
                <input
                  type="number"
                  min="0"
                  placeholder="Ketik batas harga..."
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                />
                {maxPrice !== '' && (
                  <button 
                    type="button" 
                    className="advance-clear-input"
                    onClick={() => onMaxPriceChange('')}
                    title="Hapus harga"
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            {/* 4. Minimal Review / Rating */}
            <div className="advance-search-field">
              <label className="advance-field-label">Min. Review (Rating 1 - 5)</label>
              <div className="advance-input-box">
                <Star size={16} weight="fill" color="#fbbf24" />
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  placeholder="Ketik rating (cth: 4.5)..."
                  value={minReview}
                  onChange={(e) => onMinReviewChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                />
                {minReview !== '' && (
                  <button 
                    type="button" 
                    className="advance-clear-input"
                    onClick={() => onMinReviewChange('')}
                    title="Hapus review"
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer with Result Count */}
          <div className="advance-search-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span className="advance-results-text">
              {totalResults !== undefined ? (
                isRecommendationActive ? (
                  <>Ditemukan <strong>{totalResults}</strong> komoditas direkomendasikan sesuai kriteria.</>
                ) : (
                  <>Ditemukan <strong>{totalResults}</strong> komoditas sesuai kriteria pencarian.</>
                )
              ) : (
                <>Pencarian multi-kriteria komoditas.</>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
