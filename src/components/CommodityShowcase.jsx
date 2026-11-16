import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  Clock, 
  ArrowsClockwise, 
  CaretLeft, 
  CaretRight, 
  Handshake, 
  X, 
  ArrowRight
} from '@phosphor-icons/react';
import { fetchCommoditiesFromSupabase, subscribeCommodities } from '../lib/commodityService';

export default function CommodityShowcase({ onSelectCommodity, onRequireLogin, onRegister }) {
  // Mulai kosong + skeleton (jangan render mock basi sebelum data baru tiba).
  const [commodities, setCommodities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [promptCommodity, setPromptCommodity] = useState(null);

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

  // Fetch 100% real commodity data from Supabase with realtime subscription
  // Kosong = kosong (jangan fallback ke mock basi).
  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const { data } = await fetchCommoditiesFromSupabase();
      if (data && data.length > 0) {
        const activeItems = data.filter(c => c.status === 'Aktif' || c.status === 'Tersedia' || c.status === 'Disetujui' || !c.status);
        setCommodities(activeItems.length > 0 ? activeItems : data);
      } else {
        setCommodities([]);
      }
    } catch (err) {
      console.warn('[CommodityShowcase] Gagal memuat data dari Supabase:', err);
      setCommodities([]);
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = subscribeCommodities(() => {
      loadData();
    });

    return () => {
      if (unsubscribe) unsubscribe();
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
  }, [commodities, isLoading]);

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

  // Clicking "Tawar dan Beli" triggers login requirement modal
  const handleOfferClick = (commodity) => {
    setPromptCommodity(commodity);
    setLoginPromptOpen(true);
  };

  const handleConfirmLogin = () => {
    setLoginPromptOpen(false);
    if (onRequireLogin) {
      onRequireLogin();
    } else {
      window.location.hash = '#/login';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="komoditas" 
      style={{ 
        padding: '3rem 0 4.5rem 0', 
        backgroundColor: 'var(--bg-canvas)', 
        transition: 'background-color 0.3s ease' 
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.25rem auto' }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <span className="pill-badge" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              KATALOG PASOKAN TERVERIFIKASI
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.85rem',
            letterSpacing: '-0.03em'
          }}>
            Pasokan Panen Komoditas Siap{' '}
            <span style={{ color: 'var(--accent-primary)' }}>
              Kontrak Binding
            </span>
          </h2>

          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Seluruh komoditas berasal langsung dari kelompok tani terverifikasi (KYC lahan). Ajukan penawaran untuk mengunci alokasi panen.
          </p>
        </div>

        {/* Commodity Showcase Container (Matching MarketPriceTicker design exactly) */}
        <div className="commodity-showcase-box" style={{
          background: 'var(--bg-canvas-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
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
                boxShadow: '0 0 0 3px rgba(84, 82, 246, 0.2)'
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                PASOKAN KOMODITAS SIAP KONTRAK
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                • Hasil Panen Terverifikasi Petani Minahasa
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
                <span>Update: Pasokan Aktif</span>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => loadData(true)}
                title="Perbarui Data Komoditas"
                aria-label="Perbarui Data Komoditas"
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
                  className="market-price-card commodity-carousel-card" 
                  style={{ 
                    minHeight: '340px', 
                    opacity: 0.6 
                  }}
                >
                  <div style={{ height: '135px', width: '100%', background: 'var(--border-subtle)', borderRadius: '8px', marginBottom: '10px' }} />
                  <div style={{ height: '14px', width: '70%', background: 'var(--border-subtle)', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '10px', width: '40%', background: 'var(--border-subtle)', borderRadius: '3px', marginBottom: '6px' }} />
                  <div style={{ height: '22px', width: '60%', background: 'var(--border-subtle)', borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '26px', width: '100%', background: 'var(--border-subtle)', borderRadius: '6px', marginBottom: '12px' }} />
                  <div style={{ height: '28px', width: '100%', background: 'var(--border-subtle)', borderRadius: '6px' }} />
                </div>
              ))}
            </div>
          )}

          {/* Cards Carousel (1 Baris Saja dengan Tombol < > Floating) */}
          {!isLoading && commodities.length > 0 && (
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

              {/* Kontainer 1 Baris Horizontal Carousel */}
              <div 
                ref={scrollContainerRef}
                className="market-price-carousel"
              >
                {commodities.map((item) => {
                  const pricePerKg = Number(item.pricePerKg ?? item.proposedPrice ?? item.price ?? 0);
                  const stockTon = Number(item.stockTon ?? item.stock ?? 10);
                  const minOrderTon = Number(item.minOrderTon ?? item.minOrder ?? 1);
                  const sellerDisplayName = item.farmerLeader || item.farmerName || item.farmer || (item.farmerGroup && !item.farmerGroup.toLowerCase().startsWith('poktan') ? item.farmerGroup : 'Poktan Ranowangko Langowan');
                  const locationDisplay = item.location?.split(',')[0] || item.location || 'Minahasa';
                  const itemImage = item.image || item.imageUrl || item.image_url || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80';

                  return (
                    <div 
                      key={item.id} 
                      className="market-price-card commodity-carousel-card"
                    >
                      <div>
                        {/* 0. Foto Komoditas dari Database Supabase */}
                        <div className="commodity-card-img-wrap" style={{
                          width: '100%',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          marginBottom: '0.65rem',
                          background: 'var(--bg-canvas-subtle)',
                          position: 'relative'
                        }}>
                          <img
                            src={itemImage}
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                          {item.category && (
                            <span style={{
                              position: 'absolute',
                              top: '7px',
                              left: '7px',
                              background: 'rgba(15, 23, 42, 0.72)',
                              backdropFilter: 'blur(4px)',
                              color: '#ffffff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px'
                            }}>
                              {item.category}
                            </span>
                          )}
                        </div>

                        {/* 1. Nama Komoditas */}
                        <div className="market-price-card-header">
                          <h3 className="market-price-card-commodity" title={item.name}>
                            {item.name}
                          </h3>
                        </div>

                        {/* 2. Harga Hari Ini */}
                        <div className="market-price-card-price-block">
                          <div className="market-price-card-price-label">HARGA HARI INI</div>
                          <div className="market-price-card-price-main">
                            <span className="market-price-today-number">
                              Rp{pricePerKg.toLocaleString('id-ID')}
                            </span>
                            <span className="market-price-today-unit">/kg</span>
                          </div>
                        </div>

                        {/* 3 & 4. Status Stok & Min Order */}
                        <div className="market-price-card-diff-row">
                          <span className="market-price-change-pill up">
                            <CheckCircle size={11} weight="bold" />
                            <span>Stok {stockTon} Ton</span>
                          </span>

                          <div className="market-price-yesterday-info">
                            <span className="market-price-yesterday-label">Min. Order</span>
                            <span className="market-price-yesterday-val">
                              {minOrderTon} Ton
                            </span>
                          </div>
                        </div>

                        {/* 5 & 6. Nama Tani & Lokasi */}
                        <div className="market-price-card-meta">
                          <div className="market-price-meta-item">
                            <span className="market-price-meta-label">Nama Tani:</span>
                            <span className="market-price-meta-value" title={sellerDisplayName}>
                              {sellerDisplayName}
                            </span>
                          </div>
                          <div className="market-price-meta-item">
                            <span className="market-price-meta-label">Lokasi:</span>
                            <span className="market-price-meta-value" title={locationDisplay}>
                              {locationDisplay}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Tawar dan Beli (Mengarah ke Login jika belum masuk) */}
                      <button
                        type="button"
                        onClick={() => handleOfferClick(item)}
                        className="market-price-detail-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        title={`Tawar dan beli ${item.name} (Masuk terlebih dahulu)`}
                      >
                        <Handshake size={14} weight="bold" />
                        <span>Tawar dan Beli</span>
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

          {/* Empty state: jangan tampilkan data lama/mock */}
          {!isLoading && commodities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Belum ada pasokan aktif</div>
              <div style={{ fontSize: '0.86rem' }}>Data katalog kosong dari database. Coba muat ulang atau tambah komoditas dari dashboard petani.</div>
            </div>
          )}

        </div>

      </div>

      {/* ================= MODAL: PROMPT LOGIN ================= */}
      {loginPromptOpen && (
        <div className="clone-modal-overlay" onClick={() => setLoginPromptOpen(false)}>
          <div 
            className="clone-modal-card" 
            style={{ 
              maxWidth: '440px', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-subtle)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="clone-modal-header" style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-canvas)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '10px', 
                  background: 'rgba(84, 82, 246, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#5452f6' 
                }}>
                  <Handshake size={20} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Silakan Masuk Terlebih Dahulu
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Akses fitur penawaran & pembelian grosir
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setLoginPromptOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="clone-modal-body" style={{ padding: '1.35rem 1.4rem' }}>
              {promptCommodity && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '10px',
                  background: 'var(--bg-canvas-subtle)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1rem'
                }}>
                  {(promptCommodity.image || promptCommodity.imageUrl || promptCommodity.image_url) ? (
                    <img
                      src={promptCommodity.image || promptCommodity.imageUrl || promptCommodity.image_url}
                      alt={promptCommodity.name}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid var(--border-subtle)'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: 'rgba(84, 82, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#5452f6',
                      flexShrink: 0
                    }}>
                      <Handshake size={22} weight="bold" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {promptCommodity.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#5452f6', fontWeight: 600, marginTop: '2px' }}>
                      Rp{(promptCommodity.pricePerKg ?? promptCommodity.proposedPrice ?? promptCommodity.price ?? 0).toLocaleString('id-ID')} / kg
                    </div>
                  </div>
                </div>
              )}

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 1.25rem 0' }}>
                Untuk mengajukan penawaran harga dan pembelian komoditas langsung ke kelompok tani produsen, silakan masuk ke akun <strong>Pembeli</strong> Anda terlebih dahulu.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleConfirmLogin}
                  className="clone-btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '8px'
                  }}
                >
                  <span>Masuk ke Akun Pembeli</span>
                  <ArrowRight size={16} weight="bold" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginPromptOpen(false);
                    if (onRegister) {
                      onRegister('pembeli');
                    } else {
                      window.location.hash = '#/signup';
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Belum punya akun? Daftar sebagai Pembeli
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="clone-modal-footer" style={{ padding: '0.75rem 1.4rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-canvas)' }}>
              <button 
                type="button" 
                onClick={() => setLoginPromptOpen(false)}
                className="clone-btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              >
                Nanti Saja
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
