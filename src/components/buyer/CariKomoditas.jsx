import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  CalendarBlank, 
  ShieldCheck, 
  WarningCircle, 
  CaretDown, 
  SlidersHorizontal, 
  CurrencyCircleDollar, 
  Star, 
  ArrowCounterClockwise,
  Bank,
  QrCode,
  Money,
  Check
} from '@phosphor-icons/react';
import PillSearchBar from '../common/PillSearchBar';
import AdvanceSearchPanel from '../common/AdvanceSearchPanel';
import { rankRecommendations } from '../../lib/recommendationService';
import { DEFAULT_AVATAR } from '../../lib/constants';
import { fetchFarmerReviews } from '../../lib/reviewService';

const PAYMENT_OPTIONS = [
  {
    value: 'Transfer Bank (VA Escrow)',
    label: 'Transfer Bank',
    icon: Bank,
    iconColor: '#2563eb',
    iconBg: 'rgba(37, 99, 235, 0.1)'
  },
  {
    value: 'QRIS',
    label: 'QRIS',
    icon: QrCode,
    iconColor: '#10b981',
    iconBg: 'rgba(16, 185, 129, 0.1)'
  },
  {
    value: 'Pembayaran Langsung',
    label: 'Bayar Langsung',
    icon: Money,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.1)'
  }
];

export default function BuyerCatalog({ 
  commodities = [], 
  watchlist = [],
  onSubmitOffer,
  onStartOffer,
  initialModalCommodity = null,
  initialModalOpen = false,
  onModalClose,
  isFarmerView = false,
  title = "Eksplorasi Komoditas Pertanian",
  subtitle = "Platform pengadaan komoditas pertanian terpadu yang memudahkan pelaku usaha dan pembeli grosir terhubung langsung dengan petani di Minahasa. Temukan pasokan bahan pangan berkualitas dalam volume yang Anda butuhkan, lakukan negosiasi harga secara terbuka, dan wujudkan perdagangan yang saling menguntungkan dengan petani daerah.",
  isLoading = false
}) {
  const [activeMainTab, setActiveMainTab] = useState('katalog'); // 'katalog' | 'watchlist' | 'rfq'
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state for submitting offer
  const [selectedCommodityForOffer, setSelectedCommodityForOffer] = useState(initialModalCommodity);
  const [offerModalOpen, setOfferModalOpen] = useState(!!initialModalCommodity || initialModalOpen);

  // Modal state for viewing full commodity details
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCommodityForDetail, setSelectedCommodityForDetail] = useState(null);

  const handleOpenDetailModal = (commodity) => {
    setSelectedCommodityForDetail(commodity);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedCommodityForDetail(null);
  };

  // Modal state for viewing farmer profile, commodities & reviews
  const [farmerProfileModalOpen, setFarmerProfileModalOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerReviewsData, setFarmerReviewsData] = useState({ reviews: [], average: 5.0, totalCount: 0, distribution: {}, percentages: {} });
  const [farmerActiveCommodities, setFarmerActiveCommodities] = useState([]);
  const [activeProfileTab, setActiveProfileTab] = useState('komoditas'); // 'komoditas' | 'ulasan'
  const [isLoadingFarmerData, setIsLoadingFarmerData] = useState(false);

  const handleOpenFarmerProfile = async (commodity, initialTab = 'komoditas') => {
    if (!commodity) return;
    const fid = commodity.farmerId || commodity.farmer_id || null;
    const fname = commodity.farmerName || commodity.farmerLeader || (commodity.farmerGroup && !commodity.farmerGroup.toLowerCase().startsWith('poktan') ? commodity.farmerGroup : 'Petani');
    const favatar = commodity.farmerAvatar || commodity.avatarUrl || DEFAULT_AVATAR;
    const fgroup = commodity.farmerGroup || 'Kelompok Tani';
    const floc = commodity.location || 'Minahasa, Sulawesi Utara';

    setSelectedFarmer({
      id: fid,
      name: fname,
      avatar: favatar,
      group: fgroup,
      location: floc,
      rating: commodity.rating || 5.0,
      reviewsCount: commodity.reviewsCount || 0
    });
    setActiveProfileTab(initialTab);
    setFarmerProfileModalOpen(true);

    // Filter commodities belonging to this farmer
    let relatedProducts = (commodities || []).filter(c => {
      const cFid = c.farmerId || c.farmer_id;
      const cFname = c.farmerName || c.farmerLeader;
      if (fid && cFid && cFid === fid) return true;
      if (fname && cFname && cFname.trim().toLowerCase() === fname.trim().toLowerCase()) return true;
      return false;
    });
    if (relatedProducts.length === 0 && commodity) {
      relatedProducts = [commodity];
    }
    setFarmerActiveCommodities(relatedProducts);

    // Fetch rating & reviews
    setIsLoadingFarmerData(true);
    try {
      const res = await fetchFarmerReviews(fid, fname);
      setFarmerReviewsData(res);
    } catch (err) {
      console.warn('[CariKomoditas] Gagal load ulasan petani:', err);
    } finally {
      setIsLoadingFarmerData(false);
    }
  };

  const handleCloseFarmerProfile = () => {
    setFarmerProfileModalOpen(false);
    setSelectedFarmer(null);
  };


  
  // Offer form inputs (Ajukan Pembelian dan Penawaran)
  const [offerRequestedKg, setOfferRequestedKg] = useState('');
  const [offerPricePerKg, setOfferPricePerKg] = useState('');
  const [offerPaymentMethod, setOfferPaymentMethod] = useState('');
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
  const paymentDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target)) {
        setIsPaymentDropdownOpen(false);
      }
    };
    if (isPaymentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPaymentDropdownOpen]);

  const [offerValidUntil, setOfferValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [offerNotes, setOfferNotes] = useState('Saya berminat membeli dalam jumlah besar dan berharap dapat memperoleh harga grosir.');
  const [offerSubmittedSuccess, setOfferSubmittedSuccess] = useState(false);

  // RFQ Form state
  const [rfqName, setRfqName] = useState('');
  const [rfqCategory, setRfqCategory] = useState('Biji-Bijian & Palawija');
  const [rfqVolume, setRfqVolume] = useState('100');
  const [rfqTargetPrice, setRfqTargetPrice] = useState('');
  const [rfqLocation, setRfqLocation] = useState('Gudang Sentral Agro Kawangkoan, Minahasa');
  const [rfqSpecs, setRfqSpecs] = useState('');
  const [rfqSuccess, setRfqSuccess] = useState(false);

  // Watchlist local state
  const [localWatchlist, setLocalWatchlist] = useState(watchlist);

  // Advance Search state (Nama Komoditas, Stok, Harga, Review)
  const [advCommodity, setAdvCommodity] = useState('');
  const [advMinStock, setAdvMinStock] = useState('');
  const [advMaxPrice, setAdvMaxPrice] = useState('');
  const [advMinReview, setAdvMinReview] = useState('');

  // Recommendation & Sorting States (Weighted Scoring)
  const [isRecommendationActive, setIsRecommendationActive] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [appliedCriteria, setAppliedCriteria] = useState(null);
  const [sortBy, setSortBy] = useState('Paling Sesuai'); // 'Paling Sesuai' | 'Harga Terendah' | 'Stok Terbanyak' | 'Rating Tertinggi' | 'Terbaru'

  // Rekomendasi HANYA aktif setelah pengguna menekan tombol Apply
  const isRecoEffective = isRecommendationActive && Boolean(appliedCriteria);
  const activeCriteria = isRecoEffective ? appliedCriteria : null;

  const handleApplyAdvance = (criteria) => {
    setIsLoadingRecommendations(true);
    const validCriteria = criteria || {
      commodity: advCommodity,
      minStock: advMinStock,
      maxPrice: advMaxPrice,
      minReview: advMinReview
    };
    setAppliedCriteria(validCriteria);
    setIsRecommendationActive(true);
    setSortBy('Paling Sesuai');

    // Smooth UI transition simulation for recommendation calculation
    setTimeout(() => {
      setIsLoadingRecommendations(false);
    }, 350);
  };

  const handleResetAdvance = () => {
    setAdvCommodity('');
    setAdvMinStock('');
    setAdvMaxPrice('');
    setAdvMinReview('');
    setIsRecommendationActive(false);
    setAppliedCriteria(null);
    setSortBy('Terbaru');
  };

  const categories = ['Semua', 'Biji-Bijian & Palawija', 'Padi & Beras', 'Hortikultura & Sayur', 'Perkebunan'];

  // Only display approved/active commodities in public catalog
  const activeCommodities = useMemo(() => {
    return commodities.filter(c => c.status === 'Aktif' || c.status === 'Tersedia' || c.status === 'Disetujui');
  }, [commodities]);

  // Pre-filter kandidat komoditas berdasarkan Kategori dan Search Term
  const candidateCommodities = useMemo(() => {
    return activeCommodities.filter((item) => {
      // Jika Rekomendasi aktif dengan nama komoditas spesifik, jangan eliminasi hanya karena tab kategori yang berbeda
      const matchesCategory = (isRecoEffective && appliedCriteria?.commodity?.trim())
        ? true
        : (selectedCategory === 'Semua' ? true : item.category === selectedCategory);

      const matchesSearch = !searchTerm.trim() || (
        (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.farmerGroup && item.farmerGroup.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      return matchesCategory && matchesSearch;
    });
  }, [activeCommodities, selectedCategory, searchTerm, isRecoEffective, appliedCriteria]);

  // Content-Based Filtering via Weighted Scoring pipeline
  const displayedCommodities = useMemo(() => {
    if (isRecoEffective && activeCriteria) {
      // Hitung Weighted Scoring (threshold > 50%) dan ranking
      return rankRecommendations(candidateCommodities, activeCriteria, sortBy);
    }

    // Default katalog saat rekomendasi belum aktif
    const list = [...candidateCommodities];
    if (sortBy === 'Harga Terendah') {
      list.sort((a, b) => (Number(a.pricePerKg ?? a.proposedPrice) || 0) - (Number(b.pricePerKg ?? b.proposedPrice) || 0));
    } else if (sortBy === 'Stok Terbanyak') {
      list.sort((a, b) => (Number(b.stockTon ?? b.stock) || 0) - (Number(a.stockTon ?? a.stock) || 0));
    } else if (sortBy === 'Rating Tertinggi') {
      list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }
    return list;
  }, [candidateCommodities, isRecoEffective, activeCriteria, sortBy]);

  // Kompatibilitas alias untuk downstream code
  const filteredCommodities = displayedCommodities;

  const handleOpenOfferModal = (commodity) => {
    setSelectedCommodityForOffer(commodity);
    // Tidak ada pengisian otomatis: jumlah, harga penawaran, dan metode pembayaran wajib diisi/dipilih sendiri oleh pembeli
    setOfferRequestedKg('');
    setOfferPricePerKg('');
    setOfferPaymentMethod('');
    setIsPaymentDropdownOpen(false);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setOfferValidUntil(d.toISOString().split('T')[0]);
    setOfferNotes('Saya berminat membeli dalam jumlah besar dan berharap dapat memperoleh harga grosir.');
    setOfferSubmitError(null);
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
    setIsPaymentDropdownOpen(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  const [offerSubmitError, setOfferSubmitError] = useState(null);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const handleSubmitOfferForm = async (e) => {
    e.preventDefault();
    if (!selectedCommodityForOffer || isSubmittingOffer) return;

    const requestedKgNum = Number(offerRequestedKg);
    const priceNum = Number(offerPricePerKg);
    const currentPrice = Number(selectedCommodityForOffer.pricePerKg ?? selectedCommodityForOffer.proposedPrice ?? 0);
    const minOfferPrice = Math.round(currentPrice * 0.6);
    const minOrderKg = Number(selectedCommodityForOffer.minOrderTon ? selectedCommodityForOffer.minOrderTon * 1000 : (selectedCommodityForOffer.minOrderKg || 1000));
    const stockKg = Number(selectedCommodityForOffer.stockTon ? selectedCommodityForOffer.stockTon * 1000 : (selectedCommodityForOffer.stockKg ?? selectedCommodityForOffer.stock ?? 10000));

    // Validasi input pembeli
    if (!offerRequestedKg || isNaN(requestedKgNum) || requestedKgNum <= 0) {
      setOfferSubmitError('Silakan masukkan jumlah komoditas yang dibutuhkan.');
      return;
    }
    if (requestedKgNum < minOrderKg) {
      setOfferSubmitError(`Jumlah pembelian minimal adalah ${minOrderKg.toLocaleString('id-ID')} kg.`);
      return;
    }
    if (requestedKgNum > stockKg) {
      setOfferSubmitError(`Jumlah melebihi stok yang tersedia (${stockKg.toLocaleString('id-ID')} kg).`);
      return;
    }
    if (!offerPricePerKg || isNaN(priceNum) || priceNum <= 0) {
      setOfferSubmitError('Silakan masukkan harga penawaran Anda.');
      return;
    }
    if (currentPrice > 0 && priceNum < minOfferPrice) {
      setOfferSubmitError(`Harga penawaran tidak boleh di bawah 60% dari harga petani (Minimal Rp${minOfferPrice.toLocaleString('id-ID')} / kg).`);
      return;
    }
    if (!offerPaymentMethod) {
      setOfferSubmitError('Silakan pilih metode pembayaran terlebih dahulu.');
      return;
    }
    if (!offerValidUntil) {
      setOfferSubmitError('Silakan tentukan batas masa berlaku penawaran.');
      return;
    }

    const totalVal = requestedKgNum * priceNum;

    const newOffer = {
      id: `OFR-BYR-2026-0${Math.floor(Math.random() * 900) + 100}`,
      commodityId: selectedCommodityForOffer.id,
      commodityName: selectedCommodityForOffer.name,
      farmerId: selectedCommodityForOffer.farmerId || selectedCommodityForOffer.farmer_id || null,
      farmerGroup: selectedCommodityForOffer.farmerGroup,
      farmerLeader: selectedCommodityForOffer.farmerLeader,
      location: selectedCommodityForOffer.location,
      requestedKg: requestedKgNum,
      requestedTon: Number((requestedKgNum / 1000).toFixed(2)),
      offeredPricePerKg: priceNum,
      listingPricePerKg: currentPrice || 117800,
      totalOffer: totalVal,
      paymentMethod: offerPaymentMethod,
      validUntil: offerValidUntil,
      notes: offerNotes,
      submittedDate: 'Baru Saja',
      status: 'Menunggu Respon',
      counterPricePerKg: null,
      counterTon: null,
      counterNotes: null
    };

    setOfferSubmitError(null);
    setIsSubmittingOffer(true);
    try {
      // onSubmitOffer mereservasi stok di DB; false = gagal (mis. stok kurang).
      const ok = onSubmitOffer ? await onSubmitOffer(newOffer) : true;
      if (ok === false) {
        setOfferSubmitError('Penawaran gagal disimpan (kemungkinan stok tidak mencukupi).');
        return;
      }
    } catch (err) {
      setOfferSubmitError(`Penawaran gagal disimpan: ${err?.message || err}`);
      return;
    } finally {
      setIsSubmittingOffer(false);
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

  // Calculations inside modal (Ajukan pembelian dan penawaran)
  const calcTotalOffer = selectedCommodityForOffer 
    ? (Number(offerRequestedKg) || 0) * (Number(offerPricePerKg) || 0) 
    : 0;

  return (
    <div className="farmer-products-view">
      
      {/* Header Bar */}
      <div className="farmer-section-header" style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <h1 className="farmer-page-title" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)', letterSpacing: '-0.02em', margin: '0 0 0.65rem 0' }}>
          {title}
        </h1>
        
        {/* Kotak Card Subtitle (Bottom Card di bawah judul) */}
        <div style={{
          width: '100%',
          maxWidth: '960px',
          background: 'var(--bg-surface-card, #ffffff)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: '12px',
          padding: '0.85rem 1.15rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: 'rgba(84, 82, 246, 0.08)',
            color: '#5452f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <Info size={16} weight="bold" />
          </div>
          <p className="farmer-page-sub" style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary, #64748b)', lineHeight: 1.6, flex: 1 }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* ================= TAB 1: KATALOG KOMODITAS ================= */}
      {activeMainTab === 'katalog' && (
        <>
          {/* Search & Category Filter Bar */}
          <div className="farmer-filter-bar" style={{ marginBottom: '1.25rem' }}>
            <PillSearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              placeholder="Cari nama komoditas, poktan produsen, atau sentra panen..."
              filterOptions={categories}
              activeFilter={selectedCategory}
              onSelectFilter={setSelectedCategory}
              filterTitle="Kategori Komoditas"
              style={{ width: '100%' }}
            />
            {selectedCategory !== 'Semua' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter Aktif:</span>
                <span className="pill-active-filter-badge" style={{ marginTop: 0 }}>
                  {selectedCategory}
                  <button
                    type="button"
                    className="pill-active-filter-remove"
                    onClick={() => setSelectedCategory('Semua')}
                    title="Hapus filter"
                  >
                    <X size={12} weight="bold" />
                  </button>
                </span>
              </div>
            )}

            {/* Advance Search Panel under search bar */}
            <AdvanceSearchPanel
              commodity={advCommodity}
              onCommodityChange={setAdvCommodity}
              minStock={advMinStock}
              onMinStockChange={setAdvMinStock}
              maxPrice={advMaxPrice}
              onMaxPriceChange={setAdvMaxPrice}
              minReview={advMinReview}
              onMinReviewChange={setAdvMinReview}
              onReset={handleResetAdvance}
              onApply={handleApplyAdvance}
              totalResults={displayedCommodities.length}
              isLoading={isLoadingRecommendations}
              isRecommendationActive={isRecoEffective}
            />
          </div>

          {/* Subheader Toolbar: Summary & Sorting Dropdown */}
          <div className="wholesale-catalog-toolbar">
            <div className="wholesale-catalog-summary">
              {isRecoEffective ? (
                <div className="wholesale-recommendation-active-pill">
                  <Sparkle size={15} weight="fill" color="#5452f6" />
                  <span>
                    Ditemukan <strong>{displayedCommodities.length}</strong> komoditas sesuai kriteria. Diurutkan berdasarkan tingkat kesesuaian.
                  </span>
                </div>
              ) : (
                <span className="wholesale-catalog-count-text">
                  Menampilkan <strong>{displayedCommodities.length}</strong> komoditas hasil panen
                </span>
              )}
            </div>

            <div className="wholesale-catalog-sort-group">
              <span className="wholesale-sort-label">Urutkan:</span>
              <select
                className="proposal-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="Paling Sesuai">Paling Sesuai</option>
                <option value="Harga Terendah">Harga Terendah</option>
                <option value="Stok Terbanyak">Stok Terbanyak</option>
                <option value="Rating Tertinggi">Rating Tertinggi</option>
                <option value="Terbaru">Terbaru</option>
              </select>
            </div>
          </div>

          {/* Cards Grid with Loading State */}
          {(isLoading || isLoadingRecommendations) ? (
            <div className="farmer-products-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="agri-skeleton-card" style={{ height: '340px', borderRadius: '16px' }} />
              ))}
            </div>
          ) : (
            <div className="farmer-products-grid">
              {displayedCommodities.map((commodity) => {
                const isWatchlisted = localWatchlist.some(w => w.commodityName === commodity.name);

                return (
                  <div key={commodity.id} className="wholesale-commodity-card">
                    
                    {/* 1. Foto komoditas sebagai elemen visual utama di bagian atas card */}
                    <div
                      className="wholesale-card-media"
                      onClick={() => { if (!isFarmerView) handleOpenDetailModal(commodity); }}
                      style={isFarmerView ? undefined : { cursor: 'pointer' }}
                      title={isFarmerView ? commodity.name : `Klik untuk lihat detail ${commodity.name}`}
                    >
                      <img
                        src={commodity.image}
                        alt={commodity.name}
                        className="wholesale-card-img"
                      />
                    </div>

                    {/* Card Body */}
                    <div className="wholesale-card-body">
                      {/* 3. Nama komoditas sebagai judul utama */}
                      <h3
                        className="wholesale-card-title"
                        title={commodity.name}
                        onClick={() => { if (!isFarmerView) handleOpenDetailModal(commodity); }}
                        style={isFarmerView ? undefined : { cursor: 'pointer' }}
                      >
                        {commodity.name}
                      </h3>
                      
                      {/* 2. Metrics Box: Stok & Harga Grosir & Min Order */}
                      <div className="proposal-metrics-box">
                        <div className="proposal-metric-row main">
                          <div className="proposal-metric-item">
                            <span className="proposal-metric-label">STOK TERSEDIA</span>
                            <span className="proposal-metric-val highlight">
                              {commodity.stockTon || commodity.stock || 0} Ton
                            </span>
                          </div>
                          <div className="proposal-metric-item">
                            <span className="proposal-metric-label">HARGA GROSIR</span>
                            <span className="proposal-metric-val price">
                              Rp{commodity.pricePerKg.toLocaleString('id-ID')} / kg
                            </span>
                          </div>
                        </div>
                        <div className="proposal-budget-row">
                          <span className="proposal-budget-label">Min. Order:</span>
                          <span className="proposal-budget-val">
                            {commodity.minOrderTon || 1} Ton
                          </span>
                        </div>
                      </div>

                      {/* Recommendation Match Badge */}
                      {isRecoEffective && (commodity.scoreFormatted || commodity.similarityFormatted) && (
                        <div className="wholesale-match-badge" title={`Tingkat Kesesuaian (Weighted Scoring): ${commodity.scoreFormatted || commodity.similarityFormatted}`}>
                          <CheckCircle size={12} weight="bold" color="#059669" />
                          <span>{commodity.scoreFormatted || commodity.similarityFormatted} sesuai kebutuhan</span>
                        </div>
                      )}

                      {/* 3. Kategori & Lokasi */}
                      <div className="proposal-info-row">
                        <div className="proposal-info-item">
                          <Package size={11} color="var(--accent-primary, #5452f6)" weight="bold" />
                          <span>{commodity.category}</span>
                        </div>
                        <span className="proposal-dot-divider">•</span>
                        <div className="proposal-info-item">
                          <MapPin size={11} color="#64748b" weight="bold" />
                          <span>{commodity.location?.split(',')[0] || commodity.location}</span>
                        </div>
                      </div>

                      {/* 4. Tanggal Panen */}
                      <div className="proposal-date-row">
                        <div className="proposal-date-item" title={`Panen: ${commodity.harvestDate || commodity.harvestType || 'Siap Diambil'}`}>
                          <CalendarBlank size={11} color="#64748b" />
                          <span>{commodity.harvestDate || commodity.harvestType || 'Siap Diambil'}</span>
                        </div>
                      </div>

                      {/* 8 & 9. Nama asli/username petani penjual dengan avatar kecil & Rating penjual */}
                      {(() => {
                        const sellerDisplayName = commodity.farmerName || commodity.farmerLeader || (commodity.farmerGroup && !commodity.farmerGroup.toLowerCase().startsWith('poktan') ? commodity.farmerGroup : 'Petani');
                        const sellerAvatar = commodity.farmerAvatar || commodity.avatarUrl;
                        const avatarLetter = (sellerDisplayName.charAt(0) || 'P').toUpperCase();
                        return (
                          <div className="wholesale-seller-row">
                            <div 
                              className="wholesale-seller-info" 
                              title={`Klik untuk lihat profil & komoditas ${sellerDisplayName}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFarmerProfile(commodity, 'komoditas');
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="wholesale-seller-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {sellerAvatar ? (
                                  <img 
                                    src={sellerAvatar} 
                                    alt={sellerDisplayName} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  avatarLetter
                                )}
                              </div>
                              <span className="wholesale-seller-name">{sellerDisplayName}</span>
                            </div>
                            <div 
                              className="wholesale-rating-pill" 
                              title={`Rating: ${commodity.rating || 4.8} (${commodity.reviewsCount || 25} ulasan) - Klik untuk lihat ulasan`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFarmerProfile(commodity, 'ulasan');
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <Star size={11} weight="fill" color="#f59e0b" />
                              <span>{commodity.rating || 4.8}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 10. Tombol utama di bagian bawah card (tampilan petani: tanpa tombol) */}
                      {!isFarmerView && (
                        <div className="wholesale-card-action">
                          <button
                            type="button"
                            onClick={() => handleOpenOfferModal(commodity)}
                            className="wholesale-detail-btn"
                            title={`Tawar dan beli ${commodity.name}`}
                          >
                            <Handshake size={13} weight="bold" />
                            <span>Tawar dan Beli</span>
                          </button>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {!isLoadingRecommendations && !isLoading && displayedCommodities.length === 0 && (
            <div className="farmer-empty-state">
              <Package size={48} weight="duotone" color="var(--text-muted)" />
              <h3 className="farmer-empty-title">
                {isRecoEffective 
                  ? "Tidak ditemukan komoditas yang cukup sesuai dengan kebutuhan Anda." 
                  : "Komoditas Tidak Ditemukan"}
              </h3>
              <p className="farmer-empty-sub">
                {isRecoEffective
                  ? "Silakan ubah kriteria pencarian."
                  : searchTerm.trim()
                    ? `Tidak ada stok hasil panen yang cocok dengan kata kunci "${searchTerm}". Silakan gunakan pencarian lain atau ajukan Request for Quotation (RFQ).`
                    : "Belum ada komoditas hasil panen yang tersedia."}
              </p>
              {isRecoEffective && (
                <button
                  type="button"
                  onClick={handleResetAdvance}
                  className="advance-search-reset-btn"
                  style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  <ArrowCounterClockwise size={14} weight="bold" />
                  <span>Reset Semua</span>
                </button>
              )}
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
              Jika komoditas atau volume tonase yang Anda butuhkan belum tercantum di katalog, kirimkan permintaan pasokan ini. Tim TaniNiaga akan mencocokkan dengan sentra kelompok tani mitra resmi.
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

      {/* ================= MODAL: AJUKAN PEMBELIAN DAN PENAWARAN ================= */}
      {offerModalOpen && selectedCommodityForOffer && (() => {
        const comm = selectedCommodityForOffer;
        const currentListingPrice = Number(comm.pricePerKg ?? comm.proposedPrice ?? 117800);
        const minOfferPrice = Math.round(currentListingPrice * 0.6);
        const stockKg = Number(comm.stockTon ? comm.stockTon * 1000 : (comm.stockKg ?? comm.stock ?? 10000));
        const minOrderKg = Number(comm.minOrderTon ? comm.minOrderTon * 1000 : (comm.minOrderKg ?? 1000));
        const selectedPaymentOption = PAYMENT_OPTIONS.find(p => p.value === offerPaymentMethod);
        
        const enteredKg = Number(offerRequestedKg) || 0;
        const enteredPrice = Number(offerPricePerKg) || 0;
        const totalPenawaran = enteredKg * enteredPrice;
        
        const isPriceTooLow = offerPricePerKg !== '' && enteredPrice < minOfferPrice;
        const isKgBelowMin = offerRequestedKg !== '' && enteredKg < minOrderKg;
        const isKgAboveStock = offerRequestedKg !== '' && enteredKg > stockKg;
        
        const isFormValid = Boolean(
          offerRequestedKg !== '' &&
          offerPricePerKg !== '' &&
          offerPaymentMethod !== '' &&
          !isPriceTooLow &&
          !isKgBelowMin &&
          !isKgAboveStock &&
          enteredKg > 0 &&
          enteredPrice > 0
        );

        const farmerAvatarUrl = comm.farmerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80';
        const farmerGroupDisplay = comm.farmerGroup || 'Poktan Ranowangko Langowan';
        const farmerLeaderDisplay = comm.farmerLeader || 'Hengky Mandagi, S.P.';

        return (
          <div className="clone-modal-overlay" onClick={handleCloseOfferModal}>
            <div
              className="clone-modal-card"
              style={{
                maxWidth: '500px',
                width: '95%',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.14)',
                border: '1px solid var(--border-subtle)'
              }}
              onClick={(e) => e.stopPropagation()}
            >

              {/* Header */}
              <div
                className="clone-modal-header"
                style={{
                  padding: '0.85rem 1.1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-canvas)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(84, 82, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5452f6'
                  }}>
                    <Handshake size={16} weight="bold" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Ajukan pembelian dan penawaran
                    </h3>
                    <p style={{ margin: '1px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Proposal penawaran resmi untuk kelompok tani produsen
                    </p>
                  </div>
                </div>
                <button type="button" className="clone-modal-close" onClick={handleCloseOfferModal}>
                  <X size={16} />
                </button>
              </div>

              {offerSubmittedSuccess ? (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    color: '#10b981'
                  }}>
                    <CheckCircle size={38} weight="fill" />
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
                    Penawaran Berhasil Diajukan!
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                    Penawaran pembelian komoditas <strong>{comm.name}</strong> senilai <strong>Rp{totalPenawaran.toLocaleString('id-ID')}</strong> telah diteruskan ke <strong>{farmerGroupDisplay}</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitOfferForm}>
                  <div className="clone-modal-body" style={{ maxHeight: '74vh', overflowY: 'auto', padding: '1rem 1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                    {/* Commodity Snapshot */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '10px',
                      background: 'var(--bg-canvas-subtle)',
                      border: '1px solid var(--border-subtle)',
                      minWidth: 0
                    }}>
                      <img
                        src={comm.image}
                        alt={comm.name}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1px solid var(--border-subtle)',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: 1.35,
                          letterSpacing: '-0.01em',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }} title={comm.name}>
                          {comm.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Package size={11} color="var(--accent-primary, #5452f6)" />
                          <span>{comm.category || 'Perkebunan'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 3 Reference Metric Chips */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {/* Harga Saat Ini */}
                      <div style={{
                        padding: '0.55rem 0.5rem',
                        borderRadius: '8px',
                        background: 'var(--bg-canvas-subtle)',
                        border: '1px solid var(--border-subtle)',
                        textAlign: 'center'
                      }}>
                        <span style={{ display: 'block', fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px', letterSpacing: '0.01em' }}>
                          Harga Saat Ini
                        </span>
                        <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          Rp{currentListingPrice.toLocaleString('id-ID')} <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '1px' }}>/ kg</span>
                        </span>
                      </div>

                      {/* Stok Tersedia */}
                      <div style={{
                        padding: '0.55rem 0.5rem',
                        borderRadius: '8px',
                        background: 'var(--bg-canvas-subtle)',
                        border: '1px solid var(--border-subtle)',
                        textAlign: 'center'
                      }}>
                        <span style={{ display: 'block', fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px', letterSpacing: '0.01em' }}>
                          Stok Tersedia
                        </span>
                        <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {stockKg.toLocaleString('id-ID')} <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '1px' }}>kg</span>
                        </span>
                      </div>

                      {/* Minimal Pembelian */}
                      <div style={{
                        padding: '0.55rem 0.5rem',
                        borderRadius: '8px',
                        background: 'var(--bg-canvas-subtle)',
                        border: '1px solid var(--border-subtle)',
                        textAlign: 'center'
                      }}>
                        <span style={{ display: 'block', fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px', letterSpacing: '0.01em' }}>
                          Minimal Pembelian
                        </span>
                        <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {minOrderKg.toLocaleString('id-ID')} <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '1px' }}>kg</span>
                        </span>
                      </div>
                    </div>

                    {/* Form Inputs: Jumlah yang Dibutuhkan & Harga Penawaran Anda */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {/* Jumlah yang Dibutuhkan */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.32rem' }}>
                          <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
                            Jumlah yang Dibutuhkan *
                          </label>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {offerRequestedKg ? `≈ ${(enteredKg / 1000).toFixed(1)} Ton` : '0 Ton'}
                          </span>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number"
                            required
                            min={minOrderKg}
                            max={stockKg}
                            step="any"
                            placeholder={`Contoh: ${minOrderKg}`}
                            value={offerRequestedKg}
                            onChange={(e) => {
                              setOfferRequestedKg(e.target.value);
                              if (offerSubmitError) setOfferSubmitError(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '0.55rem 3rem 0.55rem 0.8rem',
                              borderRadius: '8px',
                              border: `1px solid ${isKgBelowMin || isKgAboveStock ? '#ef4444' : 'var(--border-subtle)'}`,
                              background: 'var(--bg-canvas-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          <span style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            pointerEvents: 'none'
                          }}>
                            kg
                          </span>
                        </div>
                        {isKgBelowMin && (
                          <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: '#dc2626', fontWeight: 600 }}>
                            Minimal pembelian {minOrderKg.toLocaleString('id-ID')} kg
                          </p>
                        )}
                        {isKgAboveStock && (
                          <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: '#dc2626', fontWeight: 600 }}>
                            Melebihi stok tersedia ({stockKg.toLocaleString('id-ID')} kg)
                          </p>
                        )}
                      </div>

                      {/* Harga Penawaran Anda */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.32rem' }}>
                          <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
                            Harga Penawaran Anda *
                          </label>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <span style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            pointerEvents: 'none'
                          }}>
                            Rp
                          </span>
                          <input
                            type="number"
                            required
                            min={minOfferPrice}
                            step="any"
                            placeholder={`Min. ${minOfferPrice.toLocaleString('id-ID')}`}
                            value={offerPricePerKg}
                            onChange={(e) => {
                              setOfferPricePerKg(e.target.value);
                              if (offerSubmitError) setOfferSubmitError(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '0.55rem 3rem 0.55rem 2.1rem',
                              borderRadius: '8px',
                              border: `1px solid ${isPriceTooLow ? '#ef4444' : 'var(--border-subtle)'}`,
                              background: 'var(--bg-canvas-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          <span style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            pointerEvents: 'none'
                          }}>
                            / kg
                          </span>
                        </div>
                        {isPriceTooLow && (
                          <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <WarningCircle size={12} weight="bold" />
                            Minimal penawaran Rp{minOfferPrice.toLocaleString('id-ID')} / kg
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pilihan Metode Pembayaran (Custom Styled Dropdown) */}
                    <div ref={paymentDropdownRef} style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.32rem', letterSpacing: '0.01em', fontFamily: 'var(--font-sans)' }}>
                        Pilihan Metode Pembayaran *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsPaymentDropdownOpen(prev => !prev)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.8rem',
                          borderRadius: '8px',
                          border: isPaymentDropdownOpen ? '1px solid var(--accent-primary, #5452f6)' : '1px solid var(--border-subtle)',
                          boxShadow: isPaymentDropdownOpen ? '0 0 0 3px rgba(84, 82, 246, 0.12)' : 'none',
                          background: 'var(--bg-canvas-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          fontFamily: 'var(--font-sans)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          {selectedPaymentOption ? (
                            <>
                              <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                background: selectedPaymentOption.iconBg,
                                color: selectedPaymentOption.iconColor,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <selectedPaymentOption.icon size={13} weight="bold" />
                              </div>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                                {selectedPaymentOption.label}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.82rem', fontFamily: 'var(--font-sans)' }}>
                              -- Pilih Metode Pembayaran --
                            </span>
                          )}
                        </div>
                        <CaretDown
                          size={14}
                          weight="bold"
                          color="var(--text-muted)"
                          style={{
                            transform: isPaymentDropdownOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease',
                            flexShrink: 0
                          }}
                        />
                      </button>

                      {/* Dropdown Menu Popup */}
                      {isPaymentDropdownOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            zIndex: 80,
                            background: 'var(--bg-surface-card, #ffffff)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '10px',
                            boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.2), 0 4px 10px rgba(0, 0, 0, 0.08)',
                            padding: '5px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            animation: 'fadeIn 0.15s ease-out',
                            fontFamily: 'var(--font-sans)'
                          }}
                        >
                          {PAYMENT_OPTIONS.map((opt) => {
                            const isSelected = offerPaymentMethod === opt.value;
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setOfferPaymentMethod(opt.value);
                                  setIsPaymentDropdownOpen(false);
                                  if (offerSubmitError) setOfferSubmitError(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.52rem 0.65rem',
                                  borderRadius: '7px',
                                  border: isSelected ? `1px solid ${opt.iconColor}` : '1px solid transparent',
                                  background: isSelected ? opt.iconBg : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  gap: '8px',
                                  transition: 'background 0.12s ease',
                                  fontFamily: 'var(--font-sans)',
                                  boxSizing: 'border-box'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-canvas-subtle)';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                  <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
                                    background: opt.iconBg,
                                    color: opt.iconColor,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <Icon size={14} weight="bold" />
                                  </div>
                                  <span style={{
                                    fontSize: '0.82rem',
                                    fontWeight: isSelected ? 700 : 600,
                                    color: 'var(--text-primary)',
                                    letterSpacing: '-0.01em',
                                    fontFamily: 'var(--font-sans)'
                                  }}>
                                    {opt.label}
                                  </span>
                                </div>
                                {isSelected && (
                                  <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    background: opt.iconColor,
                                    color: '#ffffff',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <Check size={11} weight="bold" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Total Penawaran Highlight Box */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '10px',
                      background: 'rgba(84, 82, 246, 0.05)',
                      border: '1px solid rgba(84, 82, 246, 0.16)'
                    }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.01em' }}>
                          Total Penawaran
                        </span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px', letterSpacing: '0.01em' }}>
                          {enteredKg > 0 && enteredPrice > 0
                            ? `(${enteredKg.toLocaleString('id-ID')} kg × Rp${enteredPrice.toLocaleString('id-ID')} / kg)`
                            : '(Masukkan jumlah & harga penawaran)'}
                        </span>
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary, #5452f6)', letterSpacing: '-0.02em' }}>
                        Rp{totalPenawaran.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Berlaku sampai */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.32rem', letterSpacing: '0.01em' }}>
                        Berlaku sampai *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={offerValidUntil}
                          onChange={(e) => {
                            setOfferValidUntil(e.target.value);
                            if (offerSubmitError) setOfferSubmitError(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.55rem 0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-canvas-subtle)',
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="clone-modal-footer" style={{
                    padding: '0.8rem 1.1rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    background: 'var(--bg-canvas)',
                    flexWrap: 'wrap'
                  }}>
                    {offerSubmitError && (
                      <span style={{ fontSize: '0.76rem', color: '#b91c1c', fontWeight: 600, marginRight: 'auto' }}>
                        {offerSubmitError}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleCloseOfferModal}
                      className="clone-btn-secondary"
                      style={{
                        padding: '0.5rem 1.1rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '8px'
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="clone-btn-primary"
                      disabled={isSubmittingOffer || !isFormValid}
                      style={{
                        padding: '0.5rem 1.2rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '8px',
                        opacity: (isSubmittingOffer || !isFormValid) ? 0.6 : 1,
                        cursor: (isSubmittingOffer || !isFormValid) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Handshake size={15} weight="bold" />
                      <span>{isSubmittingOffer ? 'Mengirim...' : 'Ajukan Penawaran'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: DETAIL KOMODITAS LENGKAP ================= */}
      {detailModalOpen && selectedCommodityForDetail && (
        <div className="clone-modal-overlay" onClick={handleCloseDetailModal}>
          <div className="clone-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={22} color="#5452f6" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                    Detail Komoditas Grosir
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.84rem' }}>
                    Informasi lengkap spesifikasi dan pasokan hasil panen
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={handleCloseDetailModal}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Product Image & Badges */}
              <div style={{ position: 'relative', height: '210px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
                <img 
                  src={selectedCommodityForDetail.image} 
                  alt={selectedCommodityForDetail.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <span className={`wholesale-status-badge ${selectedCommodityForDetail.status === 'Tersedia' ? 'tersedia' : 'preorder'}`} style={{ top: '12px', left: '12px' }}>
                  {selectedCommodityForDetail.status === 'Tersedia' ? 'Tersedia di Gudang' : 'Siap Panen'}
                </span>
                <span style={{ position: 'absolute', bottom: '12px', left: '12px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.7)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                  {selectedCommodityForDetail.category}
                </span>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                {selectedCommodityForDetail.name}
              </h2>

              {/* Price & Wholesale Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem', background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.9rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Harga Grosir</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5452f6', marginTop: '2px' }}>
                    Rp {selectedCommodityForDetail.pricePerKg.toLocaleString('id-ID')}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}> / kg</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Stok Tersedia</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                    {selectedCommodityForDetail.stockTon} Ton
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Min. Order</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedCommodityForDetail.minOrderTon} Ton
                  </div>
                </div>
              </div>

              {/* Quality Specification Box */}
              <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-canvas)', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.84rem', marginBottom: '4px' }}>
                  <ShieldCheck size={16} weight="bold" />
                  <span>Spesifikasi Mutu Terjamin:</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {selectedCommodityForDetail.qualityGrade}
                </p>
              </div>

              {/* Seller / Poktan Profile Box */}
              <div 
                style={{ padding: '0.85rem 1rem', background: 'var(--bg-canvas)', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '1rem', cursor: 'pointer', transition: 'border-color 0.15s ease, background-color 0.15s ease' }}
                title="Klik untuk lihat profil dan ulasan petani"
                onClick={() => {
                  const comm = selectedCommodityForDetail;
                  handleCloseDetailModal();
                  handleOpenFarmerProfile(comm, 'komoditas');
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Petani & Kelompok Tani Produsen</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #5452f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden' }}>
                      {(selectedCommodityForDetail.farmerAvatar || selectedCommodityForDetail.avatarUrl) ? (
                        <img 
                          src={selectedCommodityForDetail.farmerAvatar || selectedCommodityForDetail.avatarUrl} 
                          alt={selectedCommodityForDetail.farmerName || selectedCommodityForDetail.farmerLeader} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        (selectedCommodityForDetail.farmerName || selectedCommodityForDetail.farmerLeader || selectedCommodityForDetail.farmerGroup || 'P').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {selectedCommodityForDetail.farmerName || selectedCommodityForDetail.farmerLeader || selectedCommodityForDetail.farmerGroup}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {selectedCommodityForDetail.farmerGroup}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={12} />
                        <span>{selectedCommodityForDetail.location} ({selectedCommodityForDetail.distance || selectedCommodityForDetail.distanceInfo || 'Minahasa'})</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.8rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: '12px' }}>
                      <Star size={13} weight="fill" color="#f59e0b" />
                      <span>{selectedCommodityForDetail.rating || 4.8}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="clone-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="clone-btn-secondary"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const comm = selectedCommodityForDetail;
                  handleCloseDetailModal();
                  handleOpenOfferModal(comm);
                }}
                className="clone-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Handshake size={16} weight="bold" />
                <span>Ajukan Penawaran Harga</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PROFIL PETANI & ULASAN ================= */}
      {farmerProfileModalOpen && selectedFarmer && (
        <div className="clone-modal-overlay" onClick={handleCloseFarmerProfile} style={{ zIndex: 1100 }}>
          <div
            className="clone-modal-card"
            style={{
              maxWidth: '680px',
              width: '95%',
              borderRadius: '16px',
              overflow: 'hidden',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Profil Petani */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                {/* Avatar Petani Besar */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {selectedFarmer.avatar ? (
                    <img
                      src={selectedFarmer.avatar}
                      alt={selectedFarmer.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    (selectedFarmer.name?.charAt(0) || 'P').toUpperCase()
                  )}
                </div>

                {/* Info Text Petani */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)' }}>
                      {selectedFarmer.name}
                    </h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: '#ecfdf5',
                        color: '#059669',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid #a7f3d0'
                      }}
                    >
                      <CheckCircle size={13} weight="fill" />
                      Petani Terverifikasi
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)', marginTop: '4px' }}>
                    <BuildingOffice size={14} color="#64748b" />
                    <span>{selectedFarmer.group || 'Kelompok Tani'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#94a3b8" />
                      <span>{selectedFarmer.location || 'Minahasa, Sulawesi Utara'}</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '1px 7px', borderRadius: '8px', fontWeight: 700 }}>
                      <Star size={12} weight="fill" color="#f59e0b" />
                      <span>{Number(farmerReviewsData.average || selectedFarmer.rating || 5.0).toFixed(1)}</span>
                      <span style={{ fontWeight: 500, color: '#92400e' }}>
                        ({farmerReviewsData.totalCount || selectedFarmer.reviewsCount || 0} ulasan)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                className="clone-modal-close"
                onClick={handleCloseFarmerProfile}
                title="Tutup Modal"
                style={{ alignSelf: 'flex-start' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                padding: '0 1.5rem',
                background: 'var(--bg-canvas-subtle, #f8fafc)',
                gap: '1.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveProfileTab('komoditas')}
                style={{
                  padding: '0.8rem 0.25rem',
                  fontWeight: activeProfileTab === 'komoditas' ? 700 : 500,
                  color: activeProfileTab === 'komoditas' ? '#2563eb' : 'var(--text-secondary, #64748b)',
                  borderBottom: activeProfileTab === 'komoditas' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Package size={17} weight={activeProfileTab === 'komoditas' ? 'bold' : 'regular'} />
                <span>Komoditas yang Dijual ({farmerActiveCommodities.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab('ulasan')}
                style={{
                  padding: '0.8rem 0.25rem',
                  fontWeight: activeProfileTab === 'ulasan' ? 700 : 500,
                  color: activeProfileTab === 'ulasan' ? '#2563eb' : 'var(--text-secondary, #64748b)',
                  borderBottom: activeProfileTab === 'ulasan' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Star size={17} weight={activeProfileTab === 'ulasan' ? 'fill' : 'regular'} color={activeProfileTab === 'ulasan' ? '#f59e0b' : '#64748b'} />
                <span>Rating & Ulasan ({farmerReviewsData.totalCount || farmerReviewsData.reviews?.length || 0})</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div
              className="clone-modal-body"
              style={{
                maxHeight: '60vh',
                overflowY: 'auto',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {isLoadingFarmerData ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary, #64748b)' }}>
                  <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.5rem' }}></div>
                  <div style={{ fontSize: '0.85rem' }}>Memuat profil dan data ulasan petani...</div>
                </div>
              ) : activeProfileTab === 'komoditas' ? (
                /* TAB 1: Komoditas yang Dijual */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary, #475569)' }}>
                      Daftar komoditas siap panen & stok gudang dari {selectedFarmer.name}:
                    </div>
                  </div>

                  {farmerActiveCommodities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'var(--bg-canvas-subtle, #f8fafc)', borderRadius: '12px', border: '1px dashed var(--border-subtle, #cbd5e1)' }}>
                      <Package size={40} color="#94a3b8" weight="light" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary, #334155)', fontSize: '0.9rem' }}>
                        Belum Ada Komoditas Lain
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                        Petani saat ini belum mendaftarkan komoditas tambahan yang tersedia di katalog.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                      {farmerActiveCommodities.map((item) => {
                        const itemImg = item.image || item.imageUrl || (Array.isArray(item.images) && item.images[0]) || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80';
                        const price = Number(item.pricePerKg || item.proposedPrice || 0);
                        const stock = Number(item.stockTon ?? item.stock ?? item.totalStockTon ?? 0);
                        const minOrder = Number(item.minOrderTon ?? item.minimumOrderTon ?? 1);

                        return (
                          <div
                            key={item.id}
                            style={{
                              border: '1px solid var(--border-subtle, #e2e8f0)',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              background: 'var(--bg-canvas, #ffffff)',
                              display: 'flex',
                              flexDirection: 'column',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                          >
                            <div style={{ position: 'relative', height: '110px', background: '#f1f5f9' }}>
                              <img
                                src={itemImg}
                                alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80'; }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  left: '8px',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  background: 'rgba(0,0,0,0.65)',
                                  color: '#ffffff',
                                  backdropFilter: 'blur(4px)'
                                }}
                              >
                                {item.category || 'Komoditas'}
                              </span>
                            </div>

                            <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                                {item.name}
                              </h4>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'var(--bg-canvas-subtle, #f8fafc)', padding: '6px 8px', borderRadius: '8px', marginBottom: '0.65rem' }}>
                                <div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>Stok</div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>{stock} Ton</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>Min. Order</div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #334155)' }}>{minOrder} Ton</div>
                                </div>
                              </div>

                              <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #64748b)' }}>Harga Grosir:</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>
                                  Rp {price.toLocaleString('id-ID')}
                                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary, #64748b)' }}> / kg</span>
                                </div>
                              </div>

                              {!isFarmerView && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleCloseFarmerProfile();
                                    handleOpenOfferModal(item);
                                  }}
                                  style={{
                                    marginTop: 'auto',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '0.5rem',
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                                >
                                  <Handshake size={14} weight="bold" />
                                  <span>Tawar dan Beli</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 2: Rating & Ulasan */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Rating Summary Card */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      border: '1px solid #fde68a',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ textAlign: 'center', minWidth: '90px' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: '#b45309' }}>
                        {Number(farmerReviewsData.average || selectedFarmer.rating || 5.0).toFixed(1)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '4px 0 2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            weight={star <= Math.round(Number(farmerReviewsData.average || selectedFarmer.rating || 5.0)) ? 'fill' : 'regular'}
                            color="#f59e0b"
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600 }}>
                        {farmerReviewsData.totalCount || farmerReviewsData.reviews?.length || 0} Ulasan
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[5, 4, 3, 2, 1].map((starVal) => {
                        const pct = farmerReviewsData.percentages?.[starVal] ?? (starVal === 5 && (farmerReviewsData.totalCount === 0 || !farmerReviewsData.totalCount) ? 100 : 0);
                        return (
                          <div key={starVal} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
                            <span style={{ width: '22px', color: '#92400e', fontWeight: 600 }}>{starVal} ★</span>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.7)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: '#f59e0b',
                                  borderRadius: '3px',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                            <span style={{ width: '32px', textAlign: 'right', color: '#92400e', fontSize: '0.7rem' }}>
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ulasan List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                      Semua Ulasan Pembeli ({farmerReviewsData.reviews?.length || 0})
                    </div>

                    {(!farmerReviewsData.reviews || farmerReviewsData.reviews.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'var(--bg-canvas-subtle, #f8fafc)', borderRadius: '12px', border: '1px dashed var(--border-subtle, #cbd5e1)' }}>
                        <Star size={36} color="#cbd5e1" weight="fill" style={{ marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary, #334155)', fontSize: '0.9rem' }}>
                          Belum Ada Ulasan
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                          Petani ini belum menerima ulasan dari transaksi pengadaan komoditas.
                        </p>
                      </div>
                    ) : (
                      farmerReviewsData.reviews.map((rev, idx) => {
                        const dateFormatted = rev.created_at
                          ? new Date(rev.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Baru saja';

                        return (
                          <div
                            key={rev.id || idx}
                            style={{
                              padding: '1rem',
                              border: '1px solid var(--border-subtle, #e2e8f0)',
                              borderRadius: '12px',
                              background: 'var(--bg-canvas, #ffffff)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#e0e7ff',
                                    color: '#3730a3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {rev.buyer_avatar ? (
                                    <img
                                      src={rev.buyer_avatar}
                                      alt={rev.buyer_name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  ) : (
                                    (rev.buyer_name?.charAt(0) || 'B').toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>
                                    {rev.buyer_name}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)' }}>
                                    {dateFormatted}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#fef3c7', padding: '2px 6px', borderRadius: '6px' }}>
                                <Star size={12} weight="fill" color="#f59e0b" />
                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#b45309' }}>
                                  {Number(rev.rating || 5).toFixed(1)}
                                </span>
                              </div>
                            </div>

                            {rev.commodity_name && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '6px'
                                  }}
                                >
                                  <Package size={12} />
                                  Komoditas: {rev.commodity_name}
                                </span>
                              </div>
                            )}

                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.5, fontStyle: 'italic' }}>
                              "{rev.comment}"
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="clone-modal-footer"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border-subtle, #e2e8f0)',
                background: 'var(--bg-canvas-subtle, #f8fafc)'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="#10b981" weight="bold" />
                <span>Petani Produsen Terverifikasi TaniNiaga Minahasa</span>
              </div>
              <button
                type="button"
                onClick={handleCloseFarmerProfile}
                className="clone-btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
