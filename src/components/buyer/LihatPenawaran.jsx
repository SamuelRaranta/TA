import React, { useState } from 'react';
import { 
  Handshake, 
  CheckCircle, 
  XCircle, 
  ArrowClockwise, 
  BuildingOffice, 
  ShieldCheck, 
  Info, 
  FileText, 
  CurrencyCircleDollar, 
  MapPin, 
  Truck, 
  ChatCircleText,
  CaretRight,
  X,
  Receipt,
  Clock,
  Package,
  Plant,
  CookingPot,
  Carrot,
  CoffeeBean,
  ArrowsClockwise,
  ArrowCounterClockwise,
  Star,
  Users,
  CalendarBlank,
  CreditCard,
  Bank,
  QrCode,
  Money
} from '@phosphor-icons/react';
import PillSearchBar from '../common/PillSearchBar';
import AdvanceSearchPanel from '../common/AdvanceSearchPanel';
import { 
  fetchProcurementProposalsFromSupabase, 
  subscribeProcurementProposals, 
  mapProposalToOfferItem 
} from '../../lib/procurementService';

export default function BuyerOffers({ 
  offers = [], 
  onAcceptCounterOffer, 
  onSubmitBuyerCounter,
  onProceedToBinding,
  onCancelOffer,
  title = "Daftar Proposal Penawaran",
  subtitle = "Pantau status seluruh proposal penawaran harga dan tonase yang Anda ajukan ke kelompok tani produsen.",
  isFarmerView = false,
  isLoading = false
}) {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOfferForDetail, setSelectedOfferForDetail] = useState(null);

  // Internal state holding the real Supabase proposal offers
  const [offerList, setOfferList] = useState(() => {
    return Array.isArray(offers) ? offers : [];
  });

  // Sync prop offers directly from authoritative source of truth
  React.useEffect(() => {
    if (!Array.isArray(offers)) return;
    setOfferList(offers);
  }, [offers]);

  // Marketplace petani: ambil semua proposal Aktif global (by design).
  // Halaman pembeli: JANGAN fetch global (bocor antar buyer) — andalkan props yang sudah di-scope parent.
  React.useEffect(() => {
    if (!isFarmerView) return;
    let isMounted = true;

    const loadRealData = async () => {
      try {
        const { data } = await fetchProcurementProposalsFromSupabase({ statusFilter: 'Aktif' });
        if (isMounted) {
          setOfferList((data || []).map(mapProposalToOfferItem));
        }
      } catch (err) {
        console.warn('[LihatPenawaran] Gagal memuat data dari Supabase:', err);
      }
    };

    loadRealData();

    const unsubscribe = subscribeProcurementProposals(() => {
      loadRealData();
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isFarmerView]);

  const handleOpenDetailModal = (offer) => {
    setSelectedOfferForDetail(offer);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedOfferForDetail(null);
  };

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua'); // 'Semua' | 'Menunggu Respon' | 'Counter-Offer' | 'Disetujui' | 'Ditolak'
  const [searchTerm, setSearchTerm] = useState('');

  // Advance Search state
  const [advCommodity, setAdvCommodity] = useState('');
  const [advMinTon, setAdvMinTon] = useState('');
  const [advMaxPrice, setAdvMaxPrice] = useState('');
  const [advStatusKeyword, setAdvStatusKeyword] = useState('');

  // Modal state for negotiating counter offer
  const [reNegotiateModalOpen, setReNegotiateModalOpen] = useState(false);
  const [selectedOfferForNego, setSelectedOfferForNego] = useState(null);
  const [newOfferedPrice, setNewOfferedPrice] = useState('');
  const [newOfferedTon, setNewOfferedTon] = useState('');
  const [newNegoNotes, setNewNegoNotes] = useState('');

  // Helper render badge metode pembayaran (compact micro-badge, label pendek)
  const renderPaymentBadge = (method) => {
    const m = String(method || 'Transfer Bank');
    let icon = <Bank size={11} weight="bold" />;
    let label = 'Bank';
    let badgeClass = 'bank';

    if (/qris/i.test(m)) {
      icon = <QrCode size={11} weight="bold" />;
      label = 'QRIS';
      badgeClass = 'qris';
    } else if (/langsung|tunai|cash|cod/i.test(m)) {
      icon = <Money size={11} weight="bold" />;
      label = 'Langsung';
      badgeClass = 'direct';
    } else {
      icon = <Bank size={11} weight="bold" />;
      label = 'Bank';
      badgeClass = 'bank';
    }

    return (
      <span className={`proposal-payment-badge ${badgeClass}`} title={`Metode Pembayaran: ${label}`}>
        {icon}
        <span>{label}</span>
      </span>
    );
  };

  // Modal state for verifying and confirming offer acceptance (Farmer view)
  const [confirmAcceptModalOpen, setConfirmAcceptModalOpen] = useState(false);
  const [selectedOfferForAccept, setSelectedOfferForAccept] = useState(null);
  const [isAcceptingOffer, setIsAcceptingOffer] = useState(false);
  const [acceptOfferSuccess, setAcceptOfferSuccess] = useState(false);

  const handleOpenConfirmAccept = (offer) => {
    setSelectedOfferForAccept(offer);
    setAcceptOfferSuccess(false);
    setIsAcceptingOffer(false);
    setConfirmAcceptModalOpen(true);
  };

  const handleCloseConfirmAccept = () => {
    if (isAcceptingOffer) return;
    setConfirmAcceptModalOpen(false);
    setSelectedOfferForAccept(null);
    setAcceptOfferSuccess(false);
  };

  const handleExecuteAcceptOffer = async () => {
    if (!selectedOfferForAccept) return;
    setIsAcceptingOffer(true);

    try {
      // 1. Optimistic UI update on offerList
      setOfferList(prev => prev.map(item => {
        if (item.id === selectedOfferForAccept.id) {
          return { ...item, status: 'Disetujui' };
        }
        return item;
      }));

      // 2. Notify parent handler
      if (onAcceptCounterOffer) {
        await onAcceptCounterOffer(selectedOfferForAccept.id, {
          ...selectedOfferForAccept,
          status: 'Disetujui'
        });
      }

      setAcceptOfferSuccess(true);

      // 3. Smooth transition to Binding Agreement
      setTimeout(() => {
        setIsAcceptingOffer(false);
        setConfirmAcceptModalOpen(false);
        setSelectedOfferForAccept(null);
        setAcceptOfferSuccess(false);
        if (onProceedToBinding) {
          onProceedToBinding();
        }
      }, 1200);
    } catch (err) {
      console.error('[LihatPenawaran] Gagal menerima penawaran:', err);
      setIsAcceptingOffer(false);
    }
  };

  const statusOptions = ['Semua', 'Menunggu Respon', 'Counter-Offer', 'Disetujui', 'Ditolak'];

  // 5 Category Button Cards configuration between Header and Search Bar (matching BuyerCatalog)
  const categoryCards = [
    {
      id: 'semua',
      name: 'Jumlah Penawaran',
      categoryValue: 'Semua',
      count: offerList.length,
      icon: Package,
      iconColor: '#5452f6',
      iconBg: 'rgba(84, 82, 246, 0.12)',
      itemsPreview: 'Semua proposal penawaran diajukan'
    },
    {
      id: 'palawija',
      name: 'Biji-Bijian & Palawija',
      categoryValue: 'Biji-Bijian & Palawija',
      count: offerList.filter(o => o.category === 'Biji-Bijian & Palawija').length,
      icon: Plant,
      iconColor: '#f59e0b',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      itemsPreview: offerList.filter(o => o.category === 'Biji-Bijian & Palawija').map(o => o.commodityName.split(' ')[0]).join(', ') || 'Belum ada penawaran'
    },
    {
      id: 'padi',
      name: 'Padi & Beras',
      categoryValue: 'Padi & Beras',
      count: offerList.filter(o => o.category === 'Padi & Beras').length,
      icon: CookingPot,
      iconColor: '#10b981',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      itemsPreview: offerList.filter(o => o.category === 'Padi & Beras').map(o => o.commodityName.split(' ')[0]).join(', ') || 'Belum ada penawaran'
    },
    {
      id: 'hortikultura',
      name: 'Hortikultura & Sayur',
      categoryValue: 'Hortikultura & Sayur',
      count: offerList.filter(o => o.category === 'Hortikultura & Sayur').length,
      icon: Carrot,
      iconColor: '#ef4444',
      iconBg: 'rgba(239, 68, 68, 0.12)',
      itemsPreview: offerList.filter(o => o.category === 'Hortikultura & Sayur').map(o => o.commodityName.split(' ')[0]).join(', ') || 'Belum ada penawaran'
    },
    {
      id: 'perkebunan',
      name: 'Perkebunan',
      categoryValue: 'Perkebunan',
      count: offerList.filter(o => o.category === 'Perkebunan').length,
      icon: CoffeeBean,
      iconColor: '#8b5cf6',
      iconBg: 'rgba(139, 92, 246, 0.12)',
      itemsPreview: offerList.filter(o => o.category === 'Perkebunan').map(o => o.commodityName.split(' ')[0]).join(', ') || 'Belum ada penawaran'
    }
  ];

  const [appliedAdvCriteria, setAppliedAdvCriteria] = useState(null);

  const handleApplyAdvance = (criteria) => {
    const valid = criteria || {
      commodity: advCommodity,
      minStock: advMinTon,
      maxPrice: advMaxPrice,
      minReview: advStatusKeyword
    };
    setAppliedAdvCriteria(valid);
  };

  const handleResetAdvance = () => {
    setAdvCommodity('');
    setAdvMinTon('');
    setAdvMaxPrice('');
    setAdvStatusKeyword('');
    setAppliedAdvCriteria(null);
  };

  const filteredOffers = offerList.filter((offer) => {
    // 1. Category filter from 5 cards
    const matchesCategory = selectedCategory === 'Semua' ? true : offer.category === selectedCategory;

    // 2. Status filter
    const matchesStatus = statusFilter === 'Semua' ? true : (
      offer.status === statusFilter ||
      (statusFilter === 'Disetujui' && (offer.status === 'Aktif' || offer.status === 'Diterima')) ||
      (statusFilter === 'Menunggu Respon' && (offer.status === 'Menunggu Persetujuan' || offer.status === 'pending'))
    );

    // 3. Search Bar query
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || (
      (offer.id || '').toLowerCase().includes(q) ||
      (offer.commodityName || '').toLowerCase().includes(q) ||
      (offer.farmerGroup || offer.target || '').toLowerCase().includes(q) ||
      (offer.location || '').toLowerCase().includes(q)
    );

    // 4. Advance search conditions (HANYA dieksekusi setelah menekan Apply)
    let matchesAdv = true;
    if (appliedAdvCriteria) {
      const targetComm = appliedAdvCriteria.commodity?.toLowerCase().trim();
      const matchesAdvCommodity = !targetComm || (offer.commodityName || '').toLowerCase().includes(targetComm);

      const bTon = appliedAdvCriteria.minStock !== '' && appliedAdvCriteria.minStock !== null && appliedAdvCriteria.minStock !== undefined
        ? Number(appliedAdvCriteria.minStock)
        : null;
      const matchesAdvTon = bTon === null || Number(offer.requestedTon || (offer.requestedKg ? offer.requestedKg / 1000 : 1)) >= bTon;

      const bPrice = appliedAdvCriteria.maxPrice !== '' && appliedAdvCriteria.maxPrice !== null && appliedAdvCriteria.maxPrice !== undefined
        ? Number(appliedAdvCriteria.maxPrice)
        : null;
      const matchesAdvPrice = bPrice === null || Number(offer.offeredPricePerKg || 0) <= bPrice;

      matchesAdv = matchesAdvCommodity && matchesAdvTon && matchesAdvPrice;
    }

    return matchesCategory && matchesStatus && matchesSearch && matchesAdv;
  });

  const handleOpenNegoModal = (offer) => {
    setSelectedOfferForNego(offer);
    setNewOfferedPrice(offer.counterPricePerKg || offer.offeredPricePerKg);
    setNewOfferedTon(offer.counterTon || offer.requestedTon);
    setNewNegoNotes('');
    setReNegotiateModalOpen(true);
  };

  const handleSendNego = (e) => {
    e.preventDefault();
    if (!selectedOfferForNego) return;
    const priceNum = Number(newOfferedPrice);
    const tonNum = Number(newOfferedTon);

    setOfferList(prev => prev.map(item => {
      if (item.id === selectedOfferForNego.id) {
        return {
          ...item,
          status: 'Counter-Offer',
          counterPricePerKg: priceNum,
          counterTon: tonNum,
          counterNotes: newNegoNotes,
          counterBy: isFarmerView ? 'petani' : 'pembeli'
        };
      }
      return item;
    }));

    if (onSubmitBuyerCounter) {
      onSubmitBuyerCounter({
        offerId: selectedOfferForNego.id,
        newPrice: priceNum,
        newTon: tonNum,
        notes: newNegoNotes
      });
    }

    alert(isFarmerView 
      ? `Penawaran pasokan untuk ${selectedOfferForNego.commodityName} sebesar ${tonNum} Ton (Rp${priceNum.toLocaleString('id-ID')}/kg) berhasil diajukan!`
      : `Tawaran balik untuk ${selectedOfferForNego.commodityName} sebesar ${tonNum} Ton (Rp${priceNum.toLocaleString('id-ID')}/kg) berhasil dikirim ke kelompok tani!`
    );
    setReNegotiateModalOpen(false);
    setSelectedOfferForNego(null);
  };

  return (
    <div className="farmer-products-view">
      
      {/* ================= HEADER BAR ================= */}
      <div className="farmer-section-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="farmer-page-title">{title}</h1>
          <p className="farmer-page-sub">
            {subtitle}
          </p>
        </div>
      </div>

      {/* ================= 5 BUTTON CARDS BETWEEN HEADER & SEARCH BAR ================= */}
      <div className="category-summary-cards-grid">
        {categoryCards.map((card) => {
          const IconComponent = card.icon;
          const isActive = selectedCategory !== 'Semua' && selectedCategory === card.categoryValue;

          return (
            <button
              key={card.id}
              type="button"
              className={`category-summary-card ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (card.categoryValue === 'Semua') {
                  setSelectedCategory('Semua');
                } else {
                  setSelectedCategory(selectedCategory === card.categoryValue ? 'Semua' : card.categoryValue);
                }
              }}
              title={`Filter berdasarkan ${card.name}`}
            >
              <div 
                className="category-card-icon-wrap"
                style={{ background: card.iconBg, color: card.iconColor }}
              >
                <IconComponent size={18} weight={isActive ? 'fill' : 'bold'} />
              </div>
              <div className="category-card-text-wrap">
                <div className="category-card-count">
                  {isLoading ? (
                    <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '28px', height: '18px', borderRadius: '4px' }} />
                  ) : (
                    <span>{card.count}</span>
                  )}
                  <span className="category-card-count-unit">Penawaran</span>
                </div>
                <div className="category-card-name" title={card.name}>
                  {card.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ================= SEARCH & STATUS FILTER BAR ================= */}
      <div className="farmer-filter-bar" style={{ marginBottom: '1.25rem' }}>
        <PillSearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nomor penawaran, nama komoditas, atau kelompok tani produsen..."
          filterOptions={isFarmerView ? statusOptions : null}
          showFilter={isFarmerView}
          activeFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          filterTitle="Status Penawaran"
          style={{ width: '100%' }}
        />
        {selectedCategory !== 'Semua' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Kategori:</span>
            <span className="pill-active-filter-badge" style={{ marginTop: 0 }}>
              {selectedCategory}
              <button
                type="button"
                className="pill-active-filter-remove"
                onClick={() => setSelectedCategory('Semua')}
                title="Hapus filter kategori"
              >
                <X size={12} weight="bold" />
              </button>
            </span>
          </div>
        )}
        {isFarmerView && statusFilter !== 'Semua' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
            <span className="pill-active-filter-badge" style={{ marginTop: 0 }}>
              {statusFilter}
              <button
                type="button"
                className="pill-active-filter-remove"
                onClick={() => setStatusFilter('Semua')}
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
          minStock={advMinTon}
          onMinStockChange={setAdvMinTon}
          maxPrice={advMaxPrice}
          onMaxPriceChange={setAdvMaxPrice}
          minReview={advStatusKeyword}
          onMinReviewChange={setAdvStatusKeyword}
          onReset={handleResetAdvance}
          onApply={handleApplyAdvance}
          totalResults={filteredOffers.length}
          isRecommendationActive={Boolean(appliedAdvCriteria)}
        />
      </div>

      {/* ================= OFFERS CARDS GRID (DESAIN GAMBAR 1) ================= */}
      {isLoading ? (
        <div className="proposal-cards-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="agri-skeleton-card" style={{ height: '320px', borderRadius: '14px' }} />
          ))}
        </div>
      ) : (
        <div className="proposal-cards-grid">
          {filteredOffers.map((offer) => {
          const reqKg = offer.requestedKg || (offer.requestedTon ? offer.requestedTon * 1000 : 1000);
          const price = offer.offeredPricePerKg || 0;
          const totalBudget = offer.totalBudget || (reqKg * price);
          const statusText = offer.status || 'Aktif';

          return (
            <div key={offer.id} className="proposal-card">
              
              {/* Foto Komoditas */}
              <div 
                className="proposal-card-media" 
                onClick={() => handleOpenDetailModal(offer)}
                style={{ cursor: 'pointer' }}
                title={`Klik untuk lihat rincian ${offer.commodityName}`}
              >
                <img 
                  src={offer.image || offer.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'} 
                  alt={offer.commodityName} 
                  className="proposal-card-img" 
                />
              </div>

              {/* Card Body Content */}
              <div className="proposal-card-body">
                
                {/* Status Badge: Tampilkan jika bukan status default Aktif */}
                {statusText !== 'Aktif' && (
                  <div className="proposal-status-row">
                    {(statusText === 'Menunggu Persetujuan' || statusText === 'Menunggu Respon') && (
                      <span className="proposal-status-badge pending" title="Proposal sedang menunggu persetujuan / respon">
                        <Clock size={14} weight="fill" />
                        <span>Menunggu Respon</span>
                      </span>
                    )}
                    {(statusText === 'Tidak Aktif' || statusText === 'Ditolak') && (
                      <span className="proposal-status-badge inactive" title="Proposal ditolak">
                        <XCircle size={14} weight="fill" />
                        <span>Ditolak</span>
                      </span>
                    )}
                    {statusText === 'Counter-Offer' && (
                      <span
                        className="proposal-status-badge pending"
                        style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                        title={offer.counterBy === 'pembeli' ? 'Menunggu tanggapan petani atas tawaran balik Anda' : 'Petani mengajukan tawaran balik'}
                      >
                        <ArrowsClockwise size={14} weight="bold" />
                        <span>{offer.counterBy === 'pembeli' ? 'Tawar Balik (Terkirim)' : 'Tawaran Balik dari Petani'}</span>
                      </span>
                    )}
                    {statusText === 'Disetujui' && (
                      <span
                        className="proposal-status-badge"
                        style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                        title="Penawaran disetujui"
                      >
                        <CheckCircle size={14} weight="fill" />
                        <span>Disetujui</span>
                      </span>
                    )}
                  </div>
                )}

                {/* 1. Nama Komoditas (Judul Utama Card) */}
                <h3 
                  className="proposal-card-title" 
                  title={offer.commodityName}
                  onClick={() => handleOpenDetailModal(offer)}
                  style={{ cursor: 'pointer' }}
                >
                  {offer.commodityName}
                </h3>

                {/* 2, 3, 4. Metrics Box (Persis Gambar 1: Dibutuhkan, Harga Penawaran, Total Anggaran) */}
                <div className="proposal-metrics-box">
                  <div className="proposal-metric-row main">
                    <div className="proposal-metric-item">
                      <span className="proposal-metric-label">Dibutuhkan</span>
                      <span className="proposal-metric-val highlight">
                        {reqKg.toLocaleString('id-ID')} kg
                      </span>
                    </div>
                    <div className="proposal-metric-item">
                      <span className="proposal-metric-label">Harga Penawaran</span>
                      <span className="proposal-metric-val price">
                        Rp{price.toLocaleString('id-ID')} / kg
                      </span>
                    </div>
                  </div>
                  <div className="proposal-budget-row">
                    <span className="proposal-budget-label">Total Anggaran:</span>
                    <span className="proposal-budget-val">
                      Rp{totalBudget.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* 5 & 6. Target & Lokasi (Persis Gambar 1) */}
                <div className="proposal-info-row">
                  <div className="proposal-info-item">
                    <Users size={13} color="var(--accent-primary, #5452f6)" weight="bold" />
                    <span>Target: <strong>{offer.target || offer.farmerGroup || 'Semua Petani'}</strong></span>
                  </div>
                  <span className="proposal-dot-divider">•</span>
                  <div className="proposal-info-item">
                    <MapPin size={13} color="#64748b" weight="bold" />
                    <span>{offer.location || 'Minahasa'}</span>
                  </div>
                </div>

                {/* Bagian Metode Pembayaran pada Card */}
                <div className="proposal-payment-row">
                  {renderPaymentBadge(offer.paymentMethod)}
                </div>

                {/* Box Detail Tawaran Balik jika berstatus Counter-Offer */}
                {statusText === 'Counter-Offer' && (
                  <div style={{
                    margin: '0.45rem 0',
                    padding: '0.6rem 0.75rem',
                    background: '#fffbeb',
                    borderRadius: '8px',
                    border: '1px solid #fde68a',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ fontWeight: 800, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                      <Handshake size={14} weight="bold" />
                      <span>{offer.counterBy === 'pembeli' ? 'Tawaran Balik Anda Diajukan' : 'Tawaran Balik dari Petani:'}</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      Harga: <strong style={{ color: '#b45309' }}>Rp {Number(offer.counterPricePerKg || price).toLocaleString('id-ID')}/kg</strong> • Vol: <strong style={{ color: '#b45309' }}>{offer.counterTon || offer.requestedTon} Ton</strong>
                    </div>
                    {offer.counterNotes && (
                      <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px', fontSize: '0.73rem' }}>
                        "{offer.counterNotes}"
                      </div>
                    )}
                  </div>
                )}

                {/* 7 & 8. Tanggal Diajukan & Masa Berlaku */}
                <div className="proposal-date-row">
                  <div className="proposal-date-item" title={`Diajukan pada ${offer.createdAt || offer.submittedDate || 'Hari Ini'}`}>
                    <CalendarBlank size={12} />
                    <span>{(offer.createdAt || offer.submittedDate || 'Hari Ini').replace('Hari Ini, ', '')}</span>
                  </div>
                  <div className="proposal-date-item expiry" title={`Berlaku sampai ${offer.validUntil || '30 Sep 2026'}`}>
                    <Clock size={12} />
                    <span>s/d {offer.validUntil || '30 Sep 2026'}</span>
                  </div>
                </div>

                {/* Tombol Aksi Petani ("Terima Penawaran") */}
                {isFarmerView && (
                  <div className="procurement-card-actions-vertical" style={{ marginTop: 'auto', paddingTop: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenConfirmAccept(offer)}
                      className="procurement-btn-accept is-active"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        borderColor: '#2563eb',
                        color: '#ffffff',
                        padding: '0.38rem 0.65rem',
                        fontSize: '0.71rem',
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.28)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      title={`Terima penawaran pengadaan untuk ${offer.commodityName}`}
                    >
                      <CheckCircle size={14} weight="bold" />
                      <span>Terima Penawaran</span>
                    </button>
                  </div>
                )}

                {/* Tombol Aksi Pembeli */}
                {!isFarmerView && (
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {statusText === 'Counter-Offer' && (offer.counterBy === 'petani' || !offer.counterBy) ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          type="button"
                          onClick={() => onCancelOffer && onCancelOffer(offer.id)}
                          style={{
                            flex: 1,
                            padding: '0.38rem 0.45rem',
                            borderRadius: '7px',
                            border: '1px solid #fecaca',
                            background: '#fff1f2',
                            color: '#dc2626',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          title="Tolak tawaran balik dari petani"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenNegoModal(offer)}
                          style={{
                            flex: 1.2,
                            padding: '0.38rem 0.45rem',
                            borderRadius: '7px',
                            border: '1px solid #f59e0b',
                            background: '#fffbeb',
                            color: '#b45309',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          title="Tawar balik lagi ke petani"
                        >
                          <Handshake size={13} weight="bold" />
                          <span>Tawar Lagi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onAcceptCounterOffer && onAcceptCounterOffer(offer.id)}
                          style={{
                            flex: 1.3,
                            padding: '0.38rem 0.55rem',
                            borderRadius: '7px',
                            border: '1px solid #10b981',
                            background: '#10b981',
                            color: '#ffffff',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          title="Terima tawaran balik dan lanjutkan ke pembayaran"
                        >
                          <CheckCircle size={13} weight="bold" />
                          <span>Terima</span>
                        </button>
                      </div>
                    ) : statusText === 'Counter-Offer' && offer.counterBy === 'pembeli' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.28rem 0.65rem',
                        borderRadius: '7px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: '#fffbeb',
                        color: '#b45309',
                        border: '1px solid #fde68a'
                      }}>
                        <Clock size={13} weight="bold" />
                        <span>Menunggu Respon Petani</span>
                      </span>
                    ) : (statusText === 'Disetujui' || statusText === 'Aktif') ? (
                      <button
                        type="button"
                        onClick={() => onProceedToBinding && onProceedToBinding()}
                        style={{
                          width: '100%',
                          padding: '0.38rem 0.65rem',
                          borderRadius: '7px',
                          border: '1px solid #10b981',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          fontSize: '0.73rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <CheckCircle size={14} weight="fill" />
                        <span>Disetujui • Buka Pembayaran</span>
                      </button>
                    ) : null}
                  </div>
                )}

              </div>

            </div>
          );
        })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredOffers.length === 0 && (
        <div className="farmer-empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <Package size={48} weight="duotone" color="var(--text-muted)" />
          <h3 className="farmer-empty-title">Penawaran Tidak Ditemukan</h3>
          <p className="farmer-empty-sub">
            Tidak ada proposal penawaran yang cocok dengan kriteria pencarian atau filter status "{statusFilter}".
          </p>
          {appliedAdvCriteria && (
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

      {/* ================= MODAL: DETAIL PROPOSAL PENAWARAN (UNTUK PEMBELI) ================= */}
      {detailModalOpen && selectedOfferForDetail && (
        <div className="clone-modal-overlay" onClick={handleCloseDetailModal}>
          <div className="clone-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} color="#5452f6" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                    Detail Proposal Penawaran
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.84rem' }}>
                    {selectedOfferForDetail.id} • Diajukan: {selectedOfferForDetail.submittedDate}
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={handleCloseDetailModal}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Product Header */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '0.9rem', background: 'var(--bg-canvas-subtle)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <img 
                  src={selectedOfferForDetail.image} 
                  alt="" 
                  style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }} 
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedOfferForDetail.commodityName}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#5452f6', fontWeight: 600 }}>
                    {selectedOfferForDetail.farmerGroup}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {selectedOfferForDetail.location}
                  </div>
                </div>
                <div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    background: selectedOfferForDetail.status === 'Disetujui' ? 'rgba(16, 185, 129, 0.15)' : selectedOfferForDetail.status === 'Counter-Offer' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(84, 82, 246, 0.15)',
                    color: selectedOfferForDetail.status === 'Disetujui' ? '#059669' : selectedOfferForDetail.status === 'Counter-Offer' ? '#d97706' : '#5452f6'
                  }}>
                    {selectedOfferForDetail.status}
                  </span>
                </div>
              </div>

              {/* Offer Financial Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.9rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Tonase Pengadaan</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#5452f6', marginTop: '2px' }}>
                    {selectedOfferForDetail.requestedTon} Ton
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Harga Ditawarkan</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    Rp {selectedOfferForDetail.offeredPricePerKg.toLocaleString('id-ID')}/kg
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Nilai Kontrak</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    Rp {((selectedOfferForDetail.requestedTon * 1000) * selectedOfferForDetail.offeredPricePerKg).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Payment Method in Detail Modal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.95rem', background: 'var(--bg-canvas)', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={15} weight="bold" color="#5452f6" />
                  <span>Metode Pembayaran:</span>
                </span>
                {renderPaymentBadge(selectedOfferForDetail.paymentMethod)}
              </div>

              {/* Escrow Booking Fee Box */}
              <div style={{ padding: '0.85rem 1rem', background: 'rgba(84, 82, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(84, 82, 246, 0.2)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#5452f6' }}>Tanda Jadi / Booking Fee (5% Rekening Bersama Escrow):</span>
                  <strong style={{ fontSize: '0.95rem', color: '#5452f6' }}>
                    Rp {(((selectedOfferForDetail.requestedTon * 1000) * selectedOfferForDetail.offeredPricePerKg) * 0.05).toLocaleString('id-ID')}
                  </strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Sisa pelunasan 95% (Rp {(((selectedOfferForDetail.requestedTon * 1000) * selectedOfferForDetail.offeredPricePerKg) * 0.95).toLocaleString('id-ID')}) dilakukan saat armada menimbang muatan di gudang.
                </div>
              </div>

              {/* Counter details if any */}
              {selectedOfferForDetail.status === 'Counter-Offer' && (
                <div style={{ padding: '0.85rem 1rem', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.84rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Handshake size={15} weight="bold" />
                    <span>{selectedOfferForDetail.counterBy === 'pembeli' ? 'Tawaran Balik Anda ke Petani:' : 'Tawaran Balik dari Petani:'}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Harga: <strong style={{ color: '#b45309' }}>Rp {selectedOfferForDetail.counterPricePerKg?.toLocaleString('id-ID')}/kg</strong> • Volume: <strong style={{ color: '#b45309' }}>{selectedOfferForDetail.counterTon || selectedOfferForDetail.requestedTon} Ton</strong> (Total: Rp {((Number(selectedOfferForDetail.counterTon || selectedOfferForDetail.requestedTon) * 1000) * Number(selectedOfferForDetail.counterPricePerKg || selectedOfferForDetail.offeredPricePerKg || 0)).toLocaleString('id-ID')})
                  </div>
                  {selectedOfferForDetail.counterNotes && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                      "{selectedOfferForDetail.counterNotes}"
                    </div>
                  )}
                  {(!isFarmerView && (selectedOfferForDetail.counterBy === 'petani' || !selectedOfferForDetail.counterBy)) ? (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const off = selectedOfferForDetail;
                          handleCloseDetailModal();
                          handleOpenNegoModal(off);
                        }}
                        style={{
                          padding: '0.45rem 0.9rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: '1px solid #f59e0b',
                          background: '#fffbeb',
                          color: '#b45309',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Handshake size={14} weight="bold" />
                        <span>Tawar Balik Lagi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onAcceptCounterOffer) onAcceptCounterOffer(selectedOfferForDetail.id);
                          handleCloseDetailModal();
                        }}
                        className="clone-btn-primary"
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                      >
                        <CheckCircle size={14} weight="bold" />
                        <span>Terima Tawaran Balik</span>
                      </button>
                    </div>
                  ) : selectedOfferForDetail.counterBy === 'pembeli' ? (
                    <div style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '6px', fontWeight: 600 }}>
                      ⏳ Menunggu konfirmasi penerimaan atau tawar balik dari pihak petani.
                    </div>
                  ) : null}
                </div>
              )}

              {/* Notes */}
              {selectedOfferForDetail.notes && (
                <div style={{ padding: '0.8rem 1rem', background: 'var(--bg-canvas)', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Catatan Pengadaan & Armada</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{selectedOfferForDetail.notes}</div>
                </div>
              )}
            </div>

            <div className="clone-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={handleCloseDetailModal} className="clone-btn-secondary">
                Tutup
              </button>
              {isFarmerView && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const offer = selectedOfferForDetail;
                      handleCloseDetailModal();
                      handleOpenConfirmAccept(offer);
                    }}
                    className="clone-btn-primary"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Terima dan sepakati penawaran sesuai harga dan kuota pembeli"
                  >
                    <CheckCircle size={15} weight="bold" />
                    <span>Terima Penawaran</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseDetailModal();
                      handleOpenNegoModal(selectedOfferForDetail);
                    }}
                    className="clone-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Tawar dan ajukan pasokan komoditas untuk kebutuhan proposal ini"
                  >
                    <Handshake size={15} weight="bold" />
                    <span>Tawar & Ajukan</span>
                  </button>
                </>
              )}
              {selectedOfferForDetail.status === 'Disetujui' && (
                <button
                  type="button"
                  onClick={() => {
                    handleCloseDetailModal();
                    if (onProceedToBinding) onProceedToBinding();
                  }}
                  className="clone-btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <Handshake size={15} weight="bold" />
                  <span>Lanjut ke Binding Agreement</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAWAR & AJUKAN PENAWARAN (UNTUK PETANI) ================= */}
      {reNegotiateModalOpen && selectedOfferForNego && (
        <div className="clone-modal-overlay" onClick={() => setReNegotiateModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Handshake size={22} color="#059669" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    {isFarmerView ? 'Tawar & Ajukan Penawaran Pasokan' : 'Tawar Balik ke Petani (Counter Offer)'}
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {selectedOfferForNego.commodityName} • {isFarmerView ? `Target: ${selectedOfferForNego.buyerName || 'Pembeli Mitra'}` : `Petani: ${selectedOfferForNego.farmerGroup || selectedOfferForNego.farmerName || 'Kelompok Tani'}`}
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setReNegotiateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendNego}>
              <div className="clone-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
                
                {/* Info Ringkasan Penawaran Sebelumnya */}
                <div style={{ padding: '0.75rem 0.9rem', background: 'var(--bg-canvas-subtle)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {isFarmerView ? 'Permintaan Pembeli' : 'Penawaran Petani Saat Ini'}
                    </span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedOfferForNego.counterTon || selectedOfferForNego.requestedTon} Ton ({Number((selectedOfferForNego.counterTon || selectedOfferForNego.requestedTon) * 1000).toLocaleString('id-ID')} kg)
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {isFarmerView ? 'Harga Acuan Pembeli' : 'Harga Petani Saat Ini'}
                    </span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                      Rp {Number(selectedOfferForNego.counterPricePerKg || selectedOfferForNego.offeredPricePerKg || 0).toLocaleString('id-ID')} / kg
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed var(--border-subtle)', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Metode Pembayaran</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedOfferForNego.paymentMethod || 'Transfer Bank'}
                    </span>
                  </div>
                </div>

                {/* Input Harga Penawaran */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {isFarmerView ? 'Harga yang Anda Tawarkan (Rp / kg)' : 'Harga Tawar Balik yang Anda Ajukan (Rp / kg)'}
                  </label>
                  <input
                    type="number"
                    className="clone-modal-input"
                    value={newOfferedPrice}
                    onChange={(e) => setNewOfferedPrice(e.target.value)}
                    placeholder="Masukkan harga per kg..."
                    min="500"
                    required
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px', display: 'block' }}>
                    {isFarmerView ? 'Bisa disamakan dengan harga pembeli atau ditawar sesuai kesepakatan.' : 'Ajukan harga baru yang Anda inginkan kepada petani produsen.'}
                  </span>
                </div>

                {/* Input Tonase */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {isFarmerView ? 'Kapasitas Tonase yang Disanggupi (Ton)' : 'Volume yang Anda Butuhkan (Ton)'}
                  </label>
                  <input
                    type="number"
                    className="clone-modal-input"
                    value={newOfferedTon}
                    onChange={(e) => setNewOfferedTon(e.target.value)}
                    placeholder="Contoh: 2"
                    step="0.1"
                    min="0.1"
                    required
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px', display: 'block' }}>
                    Setara dengan {Number(Number(newOfferedTon || 0) * 1000).toLocaleString('id-ID')} kg komoditas.
                  </span>
                </div>

                {/* Estimasi Nilai Kontrak */}
                <div style={{ padding: '0.75rem 0.9rem', background: 'rgba(84, 82, 246, 0.05)', borderRadius: '10px', border: '1px solid rgba(84, 82, 246, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5452f6' }}>Total Estimasi Nilai:</span>
                    <strong style={{ fontSize: '1.05rem', color: '#059669' }}>
                      Rp {((Number(newOfferedTon || 0) * 1000) * Number(newOfferedPrice || 0)).toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>

                {/* Catatan Pasokan */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    Catatan Negosiasi (Opsional)
                  </label>
                  <textarea
                    className="clone-modal-textarea"
                    rows={2}
                    value={newNegoNotes}
                    onChange={(e) => setNewNegoNotes(e.target.value)}
                    placeholder={isFarmerView ? "Contoh: Stok panen siap kirim minggu depan, kualitas grade A sortir gudang..." : "Contoh: Penyesuaian volume dan kesepakatan harga untuk kontrak panen bulan ini..."}
                    style={{ width: '100%' }}
                  />
                </div>

              </div>

              <div className="clone-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setReNegotiateModalOpen(false)}
                  className="clone-btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clone-btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Handshake size={16} weight="bold" />
                  <span>{isFarmerView ? 'Kirim Penawaran Pasokan' : 'Kirim Tawaran Balik'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI TERIMA PENAWARAN (UNTUK PETANI) ================= */}
      {confirmAcceptModalOpen && selectedOfferForAccept && (
        <div className="clone-modal-overlay" onClick={handleCloseConfirmAccept} style={{ zIndex: 1100 }}>
          <div 
            className="clone-modal-card" 
            style={{ maxWidth: '480px', width: '92%', borderRadius: '16px', overflow: 'hidden' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="clone-modal-header" style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: 'rgba(59, 130, 246, 0.12)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={22} color="#2563eb" weight="fill" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Konfirmasi Penerimaan Penawaran
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Verifikasi kesepakatan pemenuhan pasokan komoditas
                  </p>
                </div>
              </div>
              {!isAcceptingOffer && !acceptOfferSuccess && (
                <button type="button" className="clone-modal-close" onClick={handleCloseConfirmAccept}>
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="clone-modal-body" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.18)',
                borderRadius: '12px',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '0.96rem', 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  lineHeight: 1.45
                }}>
                  Apakah Anda benar-benar yakin ingin menerima penawaran ini?
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.84rem', 
                  color: 'var(--text-secondary)', 
                  lineHeight: 1.6 
                }}>
                  Anda akan menyepakati penawaran pasokan untuk komoditas{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedOfferForAccept.commodityName}</strong>
                  {' '}dari mitra{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {selectedOfferForAccept.buyer?.full_name || 
                     (selectedOfferForAccept.buyerName && !selectedOfferForAccept.buyerName.includes('PT Royal Agro') 
                       ? selectedOfferForAccept.buyerName 
                       : 'ikon')}
                  </strong>.
                </p>
              </div>

              {/* Success Notification Banner */}
              {acceptOfferSuccess && (
                <div style={{
                  padding: '0.8rem 1rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid #10b981',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#065f46',
                  fontWeight: 600,
                  fontSize: '0.84rem'
                }}>
                  <CheckCircle size={20} color="#059669" weight="fill" />
                  <span>Penawaran berhasil diterima. Mengalihkan ke dokumen Binding Agreement...</span>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="clone-modal-footer" style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '10px', 
              padding: '0.95rem 1.4rem', 
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-canvas)'
            }}>
              <button
                type="button"
                onClick={handleCloseConfirmAccept}
                className="clone-btn-secondary"
                disabled={isAcceptingOffer || acceptOfferSuccess}
                style={{ fontSize: '0.84rem', padding: '0.55rem 1.15rem', borderRadius: '8px' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteAcceptOffer}
                className="clone-btn-primary"
                disabled={isAcceptingOffer || acceptOfferSuccess}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderColor: '#2563eb',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  padding: '0.55rem 1.35rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                  cursor: 'pointer'
                }}
              >
                {isAcceptingOffer ? (
                  <>
                    <ArrowClockwise size={16} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} weight="bold" />
                    <span>Terima</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
