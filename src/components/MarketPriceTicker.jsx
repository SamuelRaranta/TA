import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendUp, 
  TrendDown, 
  Equals, 
  Clock, 
  Building, 
  ChartLineUp,
  ArrowsClockwise,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';
import {
  fetchMarketPricesFromSupabase,
  subscribeMarketPrices
} from '../lib/marketPriceService';
import { 
  DetailHargaPasarModal, 
  formatIDR, 
  getChangeDetails 
} from './common/HargaPasarView';

const TRUSTED_INSTITUTIONS = [
  'Dinas Pertanian Minahasa',
  'Bapanas Sulut',
  'ASPEKINDO Minahasa',
  'Pasar Tradisional Langowan',
  'Sentra Hortikultura Modoinding'
];

export default function MarketPriceTicker() {
  const [prices, setPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Carousel ref and scroll navigation state
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll boundary to enable/disable navigation buttons
  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  // Load prices from Supabase — kosong = kosong (tanpa mock basi).
  const loadPrices = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const { data } = await fetchMarketPricesFromSupabase({
        orderBy: 'updated_at',
        ascending: false
      });

      setPrices(data || []);
    } catch (err) {
      console.warn('[MarketPriceTicker] Error fetching market prices:', err);
      setPrices([]);
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrices();

    // Subscribe to real-time database updates from Supabase
    const unsubscribe = subscribeMarketPrices(() => {
      loadPrices();
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Set up scroll listener
  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [prices, isLoading]);

  // Handle slide left/right
  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 260);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Compute latest update string from items
  const latestUpdateString = useMemo(() => {
    if (!prices || prices.length === 0) return 'Hari ini, 08:30 WIB';
    const first = prices[0];
    if (first.updatedTime) {
      return `Hari ini, ${first.updatedTime}`;
    }
    return 'Hari ini, 08:30 WIB';
  }, [prices]);

  return (
    <section 
      id="harga-pasar" 
      style={{ 
        padding: '3rem 0 4rem 0', 
        backgroundColor: 'var(--bg-canvas)', 
        transition: 'background-color 0.3s ease' 
      }}
    >
      <div className="container">
        
        {/* Trusted By / Institutional Benchmark Strip */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            marginBottom: '1.25rem'
          }}>
            SUMBER ACUAN HARGA & MITRA KOMODITAS RESMI
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '2.5rem',
            opacity: 0.85
          }}>
            {TRUSTED_INSTITUTIONS.map((inst, idx) => (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)'
                }}
              >
                <Building size={18} weight="bold" color="var(--text-muted)" />
                <span>{inst}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Benchmark Price Cards Row */}
        <div style={{
          background: 'var(--bg-canvas-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease'
        }}>
          {/* Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.15rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.2)'
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                HARGA ACUAN PASAR HARI INI
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                • Referensi Negosiasi Terverifikasi Admin
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem' 
            }}>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}>
                <Clock size={13} />
                <span>Update: {latestUpdateString}</span>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => loadPrices(true)}
                title="Perbarui Data Harga"
                aria-label="Perbarui Data Harga"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <ArrowsClockwise 
                  size={13} 
                  weight="bold" 
                  className={isRefreshing ? 'spin-animation' : ''} 
                />
              </button>

              {/* Tombol < dan > Navigasi Carousel di Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                marginLeft: '4px',
                borderLeft: '1px solid var(--border-subtle)',
                paddingLeft: '0.6rem'
              }}>
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  disabled={!canScrollLeft}
                  className="market-carousel-header-btn"
                  title="Geser ke kiri (<)"
                  aria-label="Geser ke kiri"
                >
                  <CaretLeft size={13} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  disabled={!canScrollRight}
                  className="market-carousel-header-btn"
                  title="Geser ke kanan (>)"
                  aria-label="Geser ke kanan"
                >
                  <CaretRight size={13} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading Skeletons (1 Baris Saja) */}
          {isLoading && (
            <div className="market-price-carousel">
              {[1, 2, 3, 4, 5].map((n) => (
                <div 
                  key={n} 
                  className="market-price-card" 
                  style={{ 
                    flex: '0 0 252px',
                    minWidth: '252px',
                    maxWidth: '252px',
                    minHeight: '210px', 
                    opacity: 0.6 
                  }}
                >
                  <div style={{ height: '14px', width: '70%', background: 'var(--border-subtle)', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '10px', width: '40%', background: 'var(--border-subtle)', borderRadius: '3px', marginBottom: '6px' }} />
                  <div style={{ height: '22px', width: '60%', background: 'var(--border-subtle)', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '26px', width: '100%', background: 'var(--border-subtle)', borderRadius: '6px', marginBottom: '12px' }} />
                  <div style={{ height: '28px', width: '100%', background: 'var(--border-subtle)', borderRadius: '6px' }} />
                </div>
              ))}
            </div>
          )}

          {/* Cards Carousel (1 Baris Saja dengan Tombol < >) */}
          {!isLoading && prices.length > 0 && (
            <div style={{ position: 'relative' }}>
              {/* Tombol Floating < (Kiri) jika bisa geser ke kiri */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="market-carousel-floating-arrow left"
                  title="Geser ke kiri"
                  aria-label="Geser ke kiri"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
              )}

              {/* Kontainer 1 Baris Horizontal */}
              <div 
                ref={scrollContainerRef}
                className="market-price-carousel"
              >
                {prices.map((item) => {
                  const changeInfo = getChangeDetails(item.marketPrice, item.prevPrice);
                  const unit = item.unit ? item.unit.toLowerCase() : 'kg';

                  return (
                    <div 
                      key={item.id} 
                      className="market-price-card"
                      style={{
                        flex: '0 0 252px',
                        minWidth: '252px',
                        maxWidth: '252px'
                      }}
                    >
                      <div>
                        {/* 1. Nama Komoditas */}
                        <div className="market-price-card-header">
                          <h3 className="market-price-card-commodity" title={item.commodity}>
                            {item.commodity}
                          </h3>
                        </div>

                        {/* 2. Harga Hari Ini */}
                        <div className="market-price-card-price-block">
                          <div className="market-price-card-price-label">HARGA HARI INI</div>
                          <div className="market-price-card-price-main">
                            <span className="market-price-today-number">
                              {formatIDR(item.marketPrice)}
                            </span>
                            <span className="market-price-today-unit">/{unit}</span>
                          </div>
                        </div>

                        {/* 3 & 4. Perubahan Harga Badge & Harga Kemarin */}
                        <div className="market-price-card-diff-row">
                          {/* Perubahan Harga Badge */}
                          <span className={`market-price-change-pill ${changeInfo.trend}`}>
                            {changeInfo.trend === 'up' && <TrendUp size={12} weight="bold" />}
                            {changeInfo.trend === 'down' && <TrendDown size={12} weight="bold" />}
                            {changeInfo.trend === 'stable' && <Equals size={12} weight="bold" />}
                            <span>
                              {changeInfo.trend === 'stable' ? '0,0%' : changeInfo.percentStr}
                            </span>
                          </span>

                          {/* Harga Kemarin */}
                          <div className="market-price-yesterday-info">
                            <span className="market-price-yesterday-label">Harga Kemarin</span>
                            <span className="market-price-yesterday-val">
                              {formatIDR(item.prevPrice)} /{unit}
                            </span>
                          </div>
                        </div>

                        {/* 5 & 6. Sumber Data & Waktu Pembaruan */}
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

                      {/* Tombol Lihat Detail */}
                      <button
                        type="button"
                        className="market-price-detail-btn"
                        onClick={() => setSelectedDetailItem(item)}
                      >
                        <ChartLineUp size={14} weight="bold" />
                        <span>Lihat Detail</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Tombol Floating > (Kanan) jika bisa geser ke kanan */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="market-carousel-floating-arrow right"
                  title="Geser ke kanan"
                  aria-label="Geser ke kanan"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              )}
            </div>
          )}

          {/* Empty state fallback */}
          {!isLoading && prices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Belum ada data acuan harga pasar hari ini.
            </div>
          )}
        </div>

      </div>

      {/* Modal Detail Harga Pasar (Chart Interaktif 7 Hari / 30 Hari / 90 Hari) */}
      {selectedDetailItem && (
        <DetailHargaPasarModal
          item={selectedDetailItem}
          onClose={() => setSelectedDetailItem(null)}
        />
      )}
    </section>
  );
}
