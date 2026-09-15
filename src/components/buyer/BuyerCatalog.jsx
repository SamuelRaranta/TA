import React, { useState } from 'react';
import { 
  MagnifyingGlass, 
  MapPin, 
  Package, 
  Handshake, 
  BookmarkSimple, 
  CheckCircle, 
  Sparkle, 
  Truck, 
  Scales, 
  X, 
  Plus, 
  Info,
  BuildingOffice,
  CalendarCheck,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  CurrencyCircleDollar
} from '@phosphor-icons/react';
import { INITIAL_CATALOG_COMMODITIES, INITIAL_BUYER_WATCHLIST } from './buyerMockData';

export default function BuyerCatalog({ 
  commodities = INITIAL_CATALOG_COMMODITIES, 
  watchlist = INITIAL_BUYER_WATCHLIST,
  onSubmitOffer,
  initialModalCommodity = null,
  initialModalOpen = false,
  onModalClose
}) {
  const [activeMainTab, setActiveMainTab] = useState('katalog'); // 'katalog' | 'watchlist' | 'rfq'
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state for submitting offer
  const [selectedCommodityForOffer, setSelectedCommodityForOffer] = useState(initialModalCommodity);
  const [offerModalOpen, setOfferModalOpen] = useState(!!initialModalCommodity || initialModalOpen);
  
  // Offer form inputs
  const [offerTon, setOfferTon] = useState(25);
  const [offerPrice, setOfferPrice] = useState(5800);
  const [fleetType, setFleetType] = useState('Truk Tronton (Kapasitas 30 Ton)');
  const [pickupDate, setPickupDate] = useState('2026-09-22');
  const [offerNotes, setOfferNotes] = useState('');
  const [offerSubmittedSuccess, setOfferSubmittedSuccess] = useState(false);

  // RFQ Form state
  const [rfqName, setRfqName] = useState('');
  const [rfqCategory, setRfqCategory] = useState('Biji-Bijian & Palawija');
  const [rfqVolume, setRfqVolume] = useState(100);
  const [rfqTargetPrice, setRfqTargetPrice] = useState('');
  const [rfqLocation, setRfqLocation] = useState('Gudang Sentral Agro Kawangkoan, Minahasa');
  const [rfqSpecs, setRfqSpecs] = useState('');
  const [rfqSuccess, setRfqSuccess] = useState(false);

  // Watchlist local state
  const [localWatchlist, setLocalWatchlist] = useState(watchlist);

  const categories = ['Semua', 'Biji-Bijian & Palawija', 'Padi & Beras', 'Hortikultura & Sayur', 'Perkebunan'];

  const filteredCommodities = commodities.filter((item) => {
    const matchesCategory = selectedCategory === 'Semua' ? true : item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.farmerGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenOfferModal = (commodity) => {
    setSelectedCommodityForOffer(commodity);
    setOfferTon(commodity.minOrderTon || 10);
    setOfferPrice(commodity.pricePerKg || 5000);
    setOfferNotes('');
    setOfferSubmittedSuccess(false);
    setOfferModalOpen(true);
  };

  // Trigger modal when requested from sidebar 'Ajukan Penawaran'
  React.useEffect(() => {
    if (initialModalOpen) {
      if (commodities && commodities.length > 0) {
        handleOpenOfferModal(commodities[0]);
      }
    }
  }, [initialModalOpen, commodities]);

  const handleCloseOfferModal = () => {
    setOfferModalOpen(false);
    setSelectedCommodityForOffer(null);
    setOfferSubmittedSuccess(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  const handleSubmitOfferForm = (e) => {
    e.preventDefault();
    if (!selectedCommodityForOffer) return;

    const newOffer = {
      id: `OFR-BYR-2026-0${Math.floor(Math.random() * 900) + 100}`,
      commodityId: selectedCommodityForOffer.id,
      commodityName: selectedCommodityForOffer.name,
      farmerGroup: selectedCommodityForOffer.farmerGroup,
      farmerLeader: selectedCommodityForOffer.farmerLeader,
      location: selectedCommodityForOffer.location,
      requestedTon: Number(offerTon),
      offeredPricePerKg: Number(offerPrice),
      listingPricePerKg: selectedCommodityForOffer.pricePerKg,
      notes: `${offerNotes ? offerNotes + '. ' : ''}Armada: ${fleetType}. Rencana muat: ${pickupDate}`,
      submittedDate: 'Baru Saja',
      status: 'Menunggu Respon',
      counterPricePerKg: null,
      counterTon: null,
      counterNotes: null
    };

    if (onSubmitOffer) {
      onSubmitOffer(newOffer);
    }

    setOfferSubmittedSuccess(true);
    setTimeout(() => {
      handleCloseOfferModal();
    }, 1800);
  };

  const handleToggleWatchlist = (commodity) => {
    const exists = localWatchlist.some(w => w.commodityName === commodity.name);
    if (exists) {
      setLocalWatchlist(prev => prev.filter(w => w.commodityName !== commodity.name));
    } else {
      setLocalWatchlist(prev => [
        ...prev,
        {
          id: `WCH-0${prev.length + 1}`,
          commodityName: commodity.name,
          farmerGroup: commodity.farmerGroup,
          region: commodity.location,
          currentPrice: commodity.pricePerKg,
          targetPrice: Math.round(commodity.pricePerKg * 0.96),
          trend: 'stable',
          notes: 'Dipantau langsung dari katalog pengadaan'
        }
      ]);
    }
  };

  const handleRfqSubmit = (e) => {
    e.preventDefault();
    setRfqSuccess(true);
    setTimeout(() => {
      setRfqSuccess(false);
      setRfqName('');
      setRfqSpecs('');
      setRfqTargetPrice('');
      setActiveMainTab('katalog');
    }, 2000);
  };

  // Calculations inside modal
  const calcTotalValue = selectedCommodityForOffer 
    ? (Number(offerTon) * 1000) * Number(offerPrice) 
    : 0;
  const calcBookingFee = calcTotalValue * 0.05; // 5%
  const calcRemainingPelunasan = calcTotalValue * 0.95; // 95%

  return (
    <div className="farmer-products-view">
      
      {/* Header Bar */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Eksplorasi Komoditas Pertanian</h1>
          <p className="farmer-page-sub">
            Temukan hasil panen komoditas terverifikasi langsung dari kelompok tani produsen tanpa perantara tengkulak.
          </p>
        </div>

        {/* Action Toggle Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            type="button" 
            onClick={() => setActiveMainTab('katalog')}
            className={`clone-tag-btn ${activeMainTab === 'katalog' ? 'active' : ''}`}
            style={{ 
              padding: '0.6rem 1.1rem', 
              borderRadius: '20px', 
              fontSize: '0.86rem',
              fontWeight: 600,
              background: activeMainTab === 'katalog' ? '#5452f6' : 'var(--bg-surface)',
              color: activeMainTab === 'katalog' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Package size={16} weight={activeMainTab === 'katalog' ? 'fill' : 'regular'} />
            <span>Cari Komoditas ({commodities.length})</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveMainTab('watchlist')}
            className={`clone-tag-btn ${activeMainTab === 'watchlist' ? 'active' : ''}`}
            style={{ 
              padding: '0.6rem 1.1rem', 
              borderRadius: '20px', 
              fontSize: '0.86rem',
              fontWeight: 600,
              background: activeMainTab === 'watchlist' ? '#5452f6' : 'var(--bg-surface)',
              color: activeMainTab === 'watchlist' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <BookmarkSimple size={16} weight={activeMainTab === 'watchlist' ? 'fill' : 'regular'} />
            <span>Dipantau ({localWatchlist.length})</span>
          </button>

          <button 
            type="button" 
            onClick={() => setActiveMainTab('rfq')}
            className={`clone-tag-btn ${activeMainTab === 'rfq' ? 'active' : ''}`}
            style={{ 
              padding: '0.6rem 1.1rem', 
              borderRadius: '20px', 
              fontSize: '0.86rem',
              fontWeight: 600,
              background: activeMainTab === 'rfq' ? '#5452f6' : 'var(--bg-surface)',
              color: activeMainTab === 'rfq' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Plus size={15} weight="bold" />
            <span>Ajukan Pasokan (RFQ)</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: KATALOG KOMODITAS ================= */}
      {activeMainTab === 'katalog' && (
        <>
          {/* Search & Category Filter Bar */}
          <div className="farmer-filter-bar">
            <div className="farmer-search-input-wrap">
              <MagnifyingGlass size={17} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Cari nama komoditas, poktan produsen, atau sentra panen..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="farmer-search-input"
              />
              {searchTerm && (
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')} 
                  className="farmer-clear-search-btn"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="farmer-filter-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`farmer-filter-tab ${selectedCategory === cat ? 'active' : ''}`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="farmer-products-grid">
            {filteredCommodities.map((commodity) => {
              const isWatchlisted = localWatchlist.some(w => w.commodityName === commodity.name);

              return (
                <div key={commodity.id} className="farmer-product-card">
                  
                  {/* Image with Badges */}
                  <div className="farmer-product-img-box">
                    <img 
                      src={commodity.image} 
                      alt={commodity.name} 
                      className="farmer-product-img" 
                    />
                    <div className="farmer-product-badges">
                      <span className="farmer-badge-category">{commodity.category}</span>
                      <span className={`farmer-badge-status ${commodity.status === 'Tersedia' ? 'tersedia' : 'preorder'}`}>
                        {commodity.harvestType}
                      </span>
                    </div>

                    {/* Bookmark / Watchlist Quick Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleWatchlist(commodity)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isWatchlisted ? '#5452f6' : 'rgba(255, 255, 255, 0.9)',
                        color: isWatchlisted ? '#ffffff' : '#475569',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease'
                      }}
                      title={isWatchlisted ? "Hapus dari Daftar Pantau" : "Simpan ke Daftar Pantau"}
                    >
                      <BookmarkSimple size={16} weight={isWatchlisted ? 'fill' : 'bold'} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="farmer-product-body">
                    <h3 className="farmer-product-title" title={commodity.name}>
                      {commodity.name}
                    </h3>
                    
                    {/* Poktan & Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#5452f6', fontWeight: 600, marginTop: '2px', marginBottom: '8px' }}>
                      <BuildingOffice size={14} weight="bold" />
                      <span>{commodity.farmerGroup}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <MapPin size={13} color="var(--text-muted)" />
                      <span>{commodity.location} ({commodity.distance})</span>
                    </div>

                    {/* Quality Grade Highlight */}
                    <div style={{ 
                      padding: '0.5rem 0.65rem', 
                      background: 'var(--bg-canvas)', 
                      borderRadius: '8px', 
                      fontSize: '0.75rem', 
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '0.85rem'
                    }}>
                      <div style={{ fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <ShieldCheck size={14} weight="bold" />
                        <span>Spesifikasi Mutu Terjamin:</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{commodity.qualityGrade}</div>
                    </div>

                    {/* Meta Info: Stock & Min Order */}
                    <div className="farmer-product-meta-row">
                      <div className="farmer-meta-item">
                        <span className="farmer-meta-lbl">Stok Tersedia:</span>
                        <span className="farmer-meta-val" style={{ color: '#5452f6', fontWeight: 700 }}>
                          {commodity.stockTon} Ton
                        </span>
                      </div>
                      <div className="farmer-meta-item">
                        <span className="farmer-meta-lbl">Min. Order:</span>
                        <span className="farmer-meta-val">
                          {commodity.minOrderTon} Ton
                        </span>
                      </div>
                    </div>

                    {/* Price and Action Row */}
                    <div className="farmer-product-footer">
                      <div className="farmer-price-box">
                        <span className="farmer-price-currency">Rp</span>
                        <span className="farmer-price-amount">{commodity.pricePerKg.toLocaleString('id-ID')}</span>
                        <span className="farmer-price-unit">/kg</span>
                      </div>

                      <button 
                        type="button" 
                        onClick={() => handleOpenOfferModal(commodity)}
                        className="clone-btn-primary"
                        style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}
                        title="Ajukan Penawaran Harga & Kuantitas"
                      >
                        <Handshake size={15} weight="bold" />
                        <span>Tawar & Beli</span>
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

          {filteredCommodities.length === 0 && (
            <div className="farmer-empty-state">
              <Package size={48} weight="duotone" color="var(--text-muted)" />
              <h3 className="farmer-empty-title">Komoditas Tidak Ditemukan</h3>
              <p className="farmer-empty-sub">
                Tidak ada stok hasil panen yang cocok dengan kata kunci "{searchTerm}". Silakan gunakan pencarian lain atau ajukan Request for Quotation (RFQ).
              </p>
            </div>
          )}
        </>
      )}

      {/* ================= TAB 2: KOMODITAS DIPANTAU (WATCHLIST) ================= */}
      {activeMainTab === 'watchlist' && (
        <div className="farmer-table-card">
          <div className="farmer-table-card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Komoditas dalam Daftar Pantau Anda</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Pantau tren pergerakan harga komoditas dan pasokan panen sebelum mengajukan kesepakatan pengadaan.
            </p>
          </div>

          <div className="farmer-table-responsive">
            <table className="farmer-data-table">
              <thead>
                <tr>
                  <th>Komoditas</th>
                  <th>Kelompok Tani & Wilayah</th>
                  <th>Harga Saat Ini</th>
                  <th>Target Beli Anda</th>
                  <th>Tren</th>
                  <th>Catatan Pantauan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {localWatchlist.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.commodityName}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{item.farmerGroup}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.region}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#5452f6' }}>Rp {item.currentPrice.toLocaleString('id-ID')}/kg</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>Rp {item.targetPrice.toLocaleString('id-ID')}/kg</span>
                    </td>
                    <td>
                      <span className={`farmer-trend-pill ${item.trend}`}>
                        {item.trend === 'up' ? 'Naik' : 'Stabil'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                      {item.notes}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          const matchedComm = commodities.find(c => c.name.includes(item.commodityName.split(' ')[0]));
                          if (matchedComm) handleOpenOfferModal(matchedComm);
                        }}
                        className="clone-tag-btn"
                        style={{ background: '#5452f6', color: '#ffffff' }}
                      >
                        <Handshake size={13} weight="bold" />
                        <span>Ajukan Tawaran</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {localWatchlist.length === 0 && (
            <div className="farmer-empty-state" style={{ padding: '3rem' }}>
              <BookmarkSimple size={44} color="var(--text-muted)" />
              <p>Belum ada komoditas yang Anda pantau. Klik ikon bookmark pada katalog komoditas.</p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: REQUEST FOR QUOTATION (RFQ) ================= */}
      {activeMainTab === 'rfq' && (
        <div className="farmer-table-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '1.75rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Ajukan Kebutuhan Pasokan Khusus (RFQ)</h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
              Jika komoditas atau volume tonase yang Anda butuhkan belum tercantum di katalog, kirimkan permintaan pasokan ini. Tim AgriConnect akan mencocokkan dengan sentra kelompok tani mitra resmi.
            </p>
          </div>

          {rfqSuccess ? (
            <div style={{ padding: '2.5rem', textAlign: 'center' }}>
              <CheckCircle size={52} color="#10b981" weight="fill" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Permintaan Pasokan Terkirim!</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                RFQ Anda telah dipublikasikan ke jaringan kelompok tani terverifikasi. Anda akan menerima notifikasi saat ada respon penawaran.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRfqSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="farmer-form-label">Nama Komoditas yang Dibutuhkan *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: Jagung Pipil KA 14% atau Beras IR64"
                    value={rfqName}
                    onChange={(e) => setRfqName(e.target.value)}
                    className="farmer-form-input"
                  />
                </div>
                <div>
                  <label className="farmer-form-label">Kategori Komoditas *</label>
                  <select 
                    value={rfqCategory}
                    onChange={(e) => setRfqCategory(e.target.value)}
                    className="farmer-form-input"
                  >
                    {categories.filter(c => c !== 'Semua').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="farmer-form-label">Target Volume Kebutuhan (Ton) *</label>
                  <input 
                    type="number" 
                    required 
                    min="5"
                    placeholder="Minimal 5 Ton"
                    value={rfqVolume}
                    onChange={(e) => setRfqVolume(e.target.value)}
                    className="farmer-form-input"
                  />
                </div>
                <div>
                  <label className="farmer-form-label">Target Harga Pembelian (Rp/Kg)</label>
                  <input 
                    type="number" 
                    placeholder="Contoh: 5800"
                    value={rfqTargetPrice}
                    onChange={(e) => setRfqTargetPrice(e.target.value)}
                    className="farmer-form-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="farmer-form-label">Titik Pabrik / Gudang Tujuan Pengiriman Mandiri</label>
                <input 
                  type="text" 
                  value={rfqLocation}
                  onChange={(e) => setRfqLocation(e.target.value)}
                  className="farmer-form-input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="farmer-form-label">Spesifikasi Kualitas & Catatan Teknis</label>
                <textarea 
                  rows={4}
                  placeholder="Sebutkan standar kadar air, kebersihan, kemasan karung, jadwal kedatangan armada muat..."
                  value={rfqSpecs}
                  onChange={(e) => setRfqSpecs(e.target.value)}
                  className="farmer-form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setActiveMainTab('katalog')} className="clone-btn-secondary">
                  Batal
                </button>
                <button type="submit" className="clone-btn-primary">
                  Publikasikan RFQ Pasokan
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ================= MODAL: AJUKAN PENAWARAN PEMBELIAN ================= */}
      {offerModalOpen && selectedCommodityForOffer && (
        <div className="clone-modal-overlay" onClick={handleCloseOfferModal}>
          <div className="clone-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Handshake size={22} color="#5452f6" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                    Ajukan Penawaran Pembelian
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.85rem' }}>
                    Proposal penawaran resmi ke {selectedCommodityForOffer.farmerGroup}
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={handleCloseOfferModal}>
                <X size={18} />
              </button>
            </div>

            {offerSubmittedSuccess ? (
              <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                <CheckCircle size={52} color="#10b981" weight="fill" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Proposal Penawaran Berhasil Dikirim!</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Proposal Anda telah diteruskan ke Ketua Kelompok Tani ({selectedCommodityForOffer.farmerLeader}). Anda dapat memantau status responnya di menu Penawaran Saya.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitOfferForm}>
                <div className="clone-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  
                  {/* Summary Box */}
                  <div style={{ 
                    padding: '0.9rem', 
                    borderRadius: '10px', 
                    background: 'var(--bg-canvas)', 
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <img 
                      src={selectedCommodityForOffer.image} 
                      alt="" 
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedCommodityForOffer.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {selectedCommodityForOffer.farmerGroup} • {selectedCommodityForOffer.location}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#5452f6', fontWeight: 600, marginTop: '2px' }}>
                        Harga Listing: Rp {selectedCommodityForOffer.pricePerKg.toLocaleString('id-ID')}/kg (Stok: {selectedCommodityForOffer.stockTon} Ton)
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs: Tonase & Harga Tawaran */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="farmer-form-label">
                        Kuantitas Tonase (Ton) *
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          (Min: {selectedCommodityForOffer.minOrderTon} Ton)
                        </span>
                      </label>
                      <input 
                        type="number" 
                        required
                        min={selectedCommodityForOffer.minOrderTon}
                        max={selectedCommodityForOffer.stockTon}
                        value={offerTon}
                        onChange={(e) => setOfferTon(e.target.value)}
                        className="farmer-form-input"
                      />
                    </div>

                    <div>
                      <label className="farmer-form-label">Harga Tawaran per Kg (Rp) *</label>
                      <input 
                        type="number" 
                        required
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        className="farmer-form-input"
                      />
                    </div>
                  </div>

                  {/* Armada & Jadwal Pengambilan Mandiri */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="farmer-form-label">Rencana Armada Self-Pickup *</label>
                      <select 
                        value={fleetType}
                        onChange={(e) => setFleetType(e.target.value)}
                        className="farmer-form-input"
                      >
                        <option value="Truk Tronton (Kapasitas 30 Ton)">Truk Tronton (Kapasitas 30 Ton)</option>
                        <option value="Truk Fuso Engkel (Kapasitas 15 Ton)">Truk Fuso Engkel (Kapasitas 15 Ton)</option>
                        <option value="Colt Diesel Double (Kapasitas 8 Ton)">Colt Diesel Double (Kapasitas 8 Ton)</option>
                        <option value="Truk Kontainer / Wingbox">Truk Kontainer / Wingbox</option>
                      </select>
                    </div>

                    <div>
                      <label className="farmer-form-label">Estimasi Tanggal Muat *</label>
                      <input 
                        type="date" 
                        required
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="farmer-form-input"
                      />
                    </div>
                  </div>

                  {/* Financial Breakdown Calculation Preview */}
                  <div style={{ 
                    padding: '1rem', 
                    borderRadius: '10px', 
                    background: 'rgba(84, 82, 246, 0.05)', 
                    border: '1px dashed rgba(84, 82, 246, 0.3)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Estimasi Total Nilai Transaksi:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Rp {calcTotalValue.toLocaleString('id-ID')}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ color: '#5452f6', fontWeight: 600 }}>Tanda Jadi / Booking Fee (5%):</span>
                      <strong style={{ color: '#5452f6' }}>Rp {calcBookingFee.toLocaleString('id-ID')}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Sisa Pelunasan (95% saat muat di gudang):</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Rp {calcRemainingPelunasan.toLocaleString('id-ID')}</span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid rgba(84, 82, 246, 0.15)', paddingTop: '6px' }}>
                      * Booking Fee 5% hanya akan ditagihkan dan terkunci di rekening penjamin platform jika kelompok tani telah menerima tawaran Anda.
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="farmer-form-label">Catatan Tambahan untuk Petani (Opsional)</label>
                    <textarea 
                      rows={3}
                      placeholder="Jelaskan kebutuhan uji kadar air di tempat, kemasan sak, atau kontak PIC supir armada..."
                      value={offerNotes}
                      onChange={(e) => setOfferNotes(e.target.value)}
                      className="farmer-form-input"
                    />
                  </div>

                </div>

                <div className="clone-modal-footer">
                  <button type="button" className="clone-btn-secondary" onClick={handleCloseOfferModal}>
                    Batal
                  </button>
                  <button type="submit" className="clone-btn-primary">
                    Kirim Proposal Penawaran
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
