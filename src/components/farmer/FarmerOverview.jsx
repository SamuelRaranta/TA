import React from 'react';
import { 
  Package, 
  Handshake, 
  FileText, 
  TrendUp, 
  TrendDown,
  ArrowRight, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Buildings, 
  Tag, 
  WarningCircle,
  Plus,
  ArrowUpRight
} from '@phosphor-icons/react';

export default function FarmerOverview({
  products,
  offers,
  bindingAgreements,
  marketPrices,
  onNavigateTab,
  onOpenAddProduct,
  onAcceptOffer,
  onOpenCounterOffer,
  onViewBinding
}) {
  // Calculations
  const activeProductsCount = products.filter(p => p.status === 'Tersedia' || p.status === 'Pre-Order').length;
  const pendingOffers = offers.filter(o => o.status === 'Menunggu Respon');
  const activeBindings = bindingAgreements.filter(b => b.status === 'Terikat' || b.status === 'Barang Siap Diambil');
  const completedBindings = bindingAgreements.filter(b => b.status === 'Selesai');
  const totalCompletedValue = completedBindings.reduce((acc, curr) => acc + curr.totalValue, 0);

  // Active ton bound
  const totalBoundTons = activeBindings.reduce((acc, curr) => acc + curr.tonnage, 0);

  return (
    <div className="farmer-overview-container">
      
      {/* Welcome Banner */}
      <div className="farmer-welcome-banner">
        <div className="farmer-welcome-text">
          <div className="farmer-welcome-badge">
            <CheckCircle size={15} weight="fill" color="#10b981" />
            <span>Kelompok Tani Terverifikasi Resmi</span>
          </div>
          <h1 className="farmer-welcome-title">
            Selamat Datang, Poktan Makmur Mandiri
          </h1>
          <p className="farmer-welcome-sub">
            Kelola panen, pantau harga pasar harian, dan kaji penawaran masuk untuk mengunci kesepakatan digital yang aman.
          </p>
        </div>

        <div className="farmer-welcome-actions">
          <button 
            type="button" 
            onClick={onOpenAddProduct}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-pill)', padding: '0.65rem 1.35rem', fontSize: '0.88rem' }}
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Listing Panen</span>
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="farmer-kpi-grid">
        {/* Card 1 */}
        <div className="farmer-kpi-card" onClick={() => onNavigateTab('products')}>
          <div className="farmer-kpi-header">
            <span className="farmer-kpi-label">Listing Panen Aktif</span>
            <div className="farmer-kpi-icon-wrap blue">
              <Package size={22} weight="duotone" />
            </div>
          </div>
          <div className="farmer-kpi-value">{activeProductsCount} <span className="farmer-kpi-unit">Komoditas</span></div>
          <div className="farmer-kpi-meta">
            <span className="farmer-kpi-trend positive">
              <TrendUp size={14} weight="bold" /> Siap Pasok
            </span>
            <span className="farmer-kpi-desc">Total stok {products.reduce((a, c) => a + c.stock, 0)} Ton</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="farmer-kpi-card" onClick={() => onNavigateTab('offers')}>
          <div className="farmer-kpi-header">
            <span className="farmer-kpi-label">Penawaran Baru</span>
            <div className="farmer-kpi-icon-wrap amber">
              <Handshake size={22} weight="duotone" />
            </div>
          </div>
          <div className="farmer-kpi-value">{pendingOffers.length} <span className="farmer-kpi-unit">Menunggu</span></div>
          <div className="farmer-kpi-meta">
            <span className="farmer-kpi-trend neutral">
              <Clock size={14} weight="bold" /> Respon Cepat
            </span>
            <span className="farmer-kpi-desc">Dari distributor grosir & pabrik</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="farmer-kpi-card" onClick={() => onNavigateTab('binding')}>
          <div className="farmer-kpi-header">
            <span className="farmer-kpi-label">Tonase Terikat (Binding)</span>
            <div className="farmer-kpi-icon-wrap emerald">
              <FileText size={22} weight="duotone" />
            </div>
          </div>
          <div className="farmer-kpi-value">{totalBoundTons} <span className="farmer-kpi-unit">Ton</span></div>
          <div className="farmer-kpi-meta">
            <span className="farmer-kpi-trend positive">
              <CheckCircle size={14} weight="fill" /> {activeBindings.length} Kontrak Aktif
            </span>
            <span className="farmer-kpi-desc">Komitmen resmi terlindungi</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="farmer-kpi-card" onClick={() => onNavigateTab('binding')}>
          <div className="farmer-kpi-header">
            <span className="farmer-kpi-label">Total Transaksi Tuntas</span>
            <div className="farmer-kpi-icon-wrap cyan">
              <Tag size={22} weight="duotone" />
            </div>
          </div>
          <div className="farmer-kpi-value">
            Rp {(totalCompletedValue / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="farmer-kpi-unit">Juta</span>
          </div>
          <div className="farmer-kpi-meta">
            <span className="farmer-kpi-trend positive">
              <TrendUp size={14} weight="bold" /> 100% Selesai
            </span>
            <span className="farmer-kpi-desc">Bebas potongan tengkulak</span>
          </div>
        </div>
      </div>

      {/* Dual Column Layout: Pending Offers & Market Price Acuan */}
      <div className="farmer-overview-split">
        
        {/* SISI KIRI: Penawaran Masuk Menunggu Respon */}
        <div className="farmer-panel-card">
          <div className="farmer-panel-header">
            <div>
              <h2 className="farmer-panel-title">Penawaran Masuk Terbaru</h2>
              <p className="farmer-panel-subtitle">Tinjau tawaran harga dan tonase dari pembeli terverifikasi</p>
            </div>
            <button 
              type="button" 
              onClick={() => onNavigateTab('offers')}
              className="farmer-link-btn"
            >
              <span>Lihat Semua ({offers.length})</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>

          <div className="farmer-offers-preview-list">
            {offers.slice(0, 2).map((offer) => (
              <div key={offer.id} className="farmer-offer-preview-item">
                <div className="farmer-offer-preview-top">
                  <div className="farmer-offer-buyer-info">
                    <span className="farmer-offer-buyer-name">{offer.buyerName}</span>
                    <span className="farmer-offer-buyer-type">
                      <Buildings size={13} /> {offer.buyerType} • {offer.buyerLocation}
                    </span>
                  </div>
                  <span className={`farmer-badge-status ${offer.status === 'Menunggu Respon' ? 'amber' : offer.status === 'Diterima' ? 'emerald' : 'blue'}`}>
                    {offer.status}
                  </span>
                </div>

                <div className="farmer-offer-details-grid">
                  <div className="farmer-offer-detail-col">
                    <span className="farmer-detail-lbl">Komoditas:</span>
                    <span className="farmer-detail-val bold">{offer.productName}</span>
                  </div>
                  <div className="farmer-offer-detail-col">
                    <span className="farmer-detail-lbl">Tonase Diminta:</span>
                    <span className="farmer-detail-val bold">{offer.requestedTon} Ton</span>
                  </div>
                  <div className="farmer-offer-detail-col">
                    <span className="farmer-detail-lbl">Tawaran Harga:</span>
                    <span className="farmer-detail-val highlight">
                      Rp {offer.offeredPricePerKg.toLocaleString('id-ID')}/kg
                    </span>
                  </div>
                  <div className="farmer-offer-detail-col">
                    <span className="farmer-detail-lbl">Total Kesepakatan:</span>
                    <span className="farmer-detail-val total">
                      Rp {((offer.requestedTon * 1000) * offer.offeredPricePerKg).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {offer.status === 'Menunggu Respon' && (
                  <div className="farmer-offer-actions-row">
                    <button 
                      type="button"
                      onClick={() => onAcceptOffer(offer.id)}
                      className="btn-action-sm accept"
                    >
                      <CheckCircle size={15} weight="bold" />
                      <span>Terima Penawaran</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => onOpenCounterOffer(offer)}
                      className="btn-action-sm counter"
                    >
                      <span>Counter-Offer</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SISI KANAN: Widget Harga Pasar Hari Ini (Acuan Admin) */}
        <div className="farmer-panel-card">
          <div className="farmer-panel-header">
            <div>
              <h2 className="farmer-panel-title">Harga Acuan Pasar Hari Ini</h2>
              <p className="farmer-panel-subtitle">Data acuan harga nasional untuk menetapkan harga jual</p>
            </div>
            <button 
              type="button" 
              onClick={() => onNavigateTab('market')}
              className="farmer-link-btn"
            >
              <span>Selengkapnya</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>

          <div className="farmer-market-preview-list">
            {marketPrices.slice(0, 4).map((price) => (
              <div key={price.id} className="farmer-market-preview-item">
                <div className="farmer-market-info">
                  <span className="farmer-market-name">{price.commodity}</span>
                  <span className="farmer-market-region">
                    <MapPin size={12} /> {price.region}
                  </span>
                </div>

                <div className="farmer-market-price-block">
                  <div className="farmer-market-price-val">
                    Rp {price.marketPrice.toLocaleString('id-ID')} <span className="farmer-market-price-unit">/{price.unit}</span>
                  </div>
                  <div className={`farmer-market-trend-pill ${price.trend}`}>
                    {price.trend === 'up' && <TrendUp size={12} weight="bold" />}
                    {price.trend === 'down' && <TrendDown size={12} weight="bold" />}
                    <span>{price.changePercent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Binding Active Snapshot */}
          <div className="farmer-binding-snapshot-banner">
            <div className="farmer-snapshot-text">
              <span className="farmer-snapshot-title">Binding Agreement Berjalan</span>
              <span className="farmer-snapshot-sub">
                {activeBindings[0]?.productName || 'Jagung Pipil Hibrida'} ({activeBindings[0]?.tonnage || 50} Ton) • Jadwal muat {activeBindings[0]?.pickupSchedule || '15 Sep 2026'}
              </span>
            </div>
            <button 
              type="button"
              onClick={() => onViewBinding(activeBindings[0] || bindingAgreements[0])}
              className="btn-snapshot-action"
            >
              <span>Lihat Kontrak</span>
              <ArrowUpRight size={14} weight="bold" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
