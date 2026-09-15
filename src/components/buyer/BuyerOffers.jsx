import React, { useState } from 'react';
import { 
  Handshake, 
  CheckCircle, 
  XCircle, 
  ArrowClockwise, 
  Buildings, 
  ShieldCheck, 
  Info, 
  FileText, 
  CurrencyCircleDollar, 
  MapPin, 
  Truck, 
  ChatCircleText,
  CaretRight,
  X,
  Receipt
} from '@phosphor-icons/react';

export default function BuyerOffers({ 
  offers = [], 
  onAcceptCounterOffer, 
  onSubmitBuyerCounter,
  onProceedToBinding,
  onCancelOffer 
}) {
  const [statusFilter, setStatusFilter] = useState('Semua'); // 'Semua' | 'Menunggu Respon' | 'Counter-Offer' | 'Disetujui' | 'Ditolak'
  
  // Modal state for negotiating counter offer
  const [reNegotiateModalOpen, setReNegotiateModalOpen] = useState(false);
  const [selectedOfferForNego, setSelectedOfferForNego] = useState(null);
  const [newOfferedPrice, setNewOfferedPrice] = useState('');
  const [newOfferedTon, setNewOfferedTon] = useState('');
  const [newNegoNotes, setNewNegoNotes] = useState('');

  const filteredOffers = offers.filter((o) => {
    if (statusFilter === 'Semua') return true;
    return o.status === statusFilter;
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
    if (onSubmitBuyerCounter) {
      onSubmitBuyerCounter({
        offerId: selectedOfferForNego.id,
        newPrice: Number(newOfferedPrice),
        newTon: Number(newOfferedTon),
        notes: newNegoNotes
      });
    }
    setReNegotiateModalOpen(false);
    setSelectedOfferForNego(null);
  };

  return (
    <div className="farmer-offers-view">
      
      {/* Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Penawaran Saya (Purchase Offers)</h1>
          <p className="farmer-page-sub">
            Pantau status proposal penawaran harga dan tonase yang Anda ajukan ke kelompok tani produsen.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="farmer-filter-bar">
        <div className="farmer-filter-tabs">
          {['Semua', 'Menunggu Respon', 'Counter-Offer', 'Disetujui', 'Ditolak'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`farmer-filter-tab ${statusFilter === tab ? 'active' : ''}`}
            >
              <span>{tab}</span>
              <span className="farmer-filter-count">
                {tab === 'Semua' ? offers.length : offers.filter(o => o.status === tab).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Offers List */}
      <div className="farmer-offers-list">
        {filteredOffers.map((offer) => {
          const totalValue = (offer.requestedTon * 1000) * offer.offeredPricePerKg;
          const bookingFee = totalValue * 0.05;

          const isWaiting = offer.status === 'Menunggu Respon';
          const isCounter = offer.status === 'Counter-Offer';
          const isApproved = offer.status === 'Disetujui';
          const isRejected = offer.status === 'Ditolak';

          return (
            <div key={offer.id} className="farmer-offer-card">
              
              {/* Top Bar Card */}
              <div className="farmer-offer-card-top">
                <div className="farmer-offer-buyer-badge">
                  <div className="farmer-buyer-avatar" style={{ background: 'rgba(84, 82, 246, 0.12)', color: '#5452f6' }}>
                    <Buildings size={22} weight="duotone" />
                  </div>
                  <div>
                    <div className="farmer-buyer-title-row">
                      <span className="farmer-buyer-title">{offer.farmerGroup}</span>
                      <span className="farmer-buyer-kyc-pill">
                        <ShieldCheck size={13} weight="fill" /> Poktan Terverifikasi
                      </span>
                    </div>
                    <span className="farmer-buyer-meta">
                      Ketua: {offer.farmerLeader} • {offer.location} • Diajukan pada {offer.submittedDate}
                    </span>
                  </div>
                </div>

                <div className="farmer-offer-status-col">
                  <span className={`farmer-badge-status ${isWaiting ? 'amber' : isApproved ? 'emerald' : isRejected ? 'red' : 'blue'}`}>
                    {offer.status}
                  </span>
                  <span className="farmer-offer-id-code">{offer.id}</span>
                </div>
              </div>

              {/* Product & Pricing Grid */}
              <div className="farmer-offer-pricing-box">
                <div className="farmer-pricing-item">
                  <span className="farmer-pricing-lbl">Komoditas yang Ditawar</span>
                  <span className="farmer-pricing-val bold" style={{ color: '#1e293b' }}>{offer.commodityName}</span>
                </div>
                <div className="farmer-pricing-item">
                  <span className="farmer-pricing-lbl">Tonase yang Diajukan</span>
                  <span className="farmer-pricing-val bold" style={{ color: '#5452f6' }}>{offer.requestedTon} Ton</span>
                </div>
                <div className="farmer-pricing-item">
                  <span className="farmer-pricing-lbl">Harga Tawaran Anda</span>
                  <span className="farmer-pricing-val">
                    Rp {offer.offeredPricePerKg.toLocaleString('id-ID')}/kg
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                      (Listing: Rp {offer.listingPricePerKg.toLocaleString('id-ID')})
                    </span>
                  </span>
                </div>
                <div className="farmer-pricing-item">
                  <span className="farmer-pricing-lbl">Estimasi Total Nilai Transaksi</span>
                  <span className="farmer-pricing-val bold" style={{ color: '#10b981' }}>
                    Rp {totalValue.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="farmer-pricing-item">
                  <span className="farmer-pricing-lbl">Estimasi Booking Fee (5%)</span>
                  <span className="farmer-pricing-val" style={{ color: '#6366f1', fontWeight: 600 }}>
                    Rp {bookingFee.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Buyer Notes */}
              {offer.notes && (
                <div className="farmer-offer-notes-box">
                  <span className="farmer-notes-title">Catatan Pengadaan & Rencana Armada Anda:</span>
                  <p className="farmer-notes-content">{offer.notes}</p>
                </div>
              )}

              {/* ================= COUNTER-OFFER BANNER FROM POKTAN ================= */}
              {isCounter && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 700, fontSize: '0.92rem' }}>
                    <ArrowClockwise size={18} weight="bold" />
                    <span>Petani Mengajukan Negosiasi Balik (Counter-Offer):</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    {offer.counterNotes || 'Petani menawarkan penyesuaian harga atau kuantitas.'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.88rem', fontWeight: 600, marginTop: '4px' }}>
                    <span>Harga Diajukan Petani: <strong style={{ color: '#b45309' }}>Rp {offer.counterPricePerKg?.toLocaleString('id-ID')}/kg</strong></span>
                    <span>Volume Disepakati: <strong style={{ color: '#b45309' }}>{offer.counterTon || offer.requestedTon} Ton</strong></span>
                  </div>
                </div>
              )}

              {/* ================= ACTIONS ================= */}
              <div className="farmer-offer-actions-row">
                
                {/* Status: Menunggu Respon */}
                {isWaiting && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      Proposal sedang ditinjau oleh pengurus kelompok tani. Estimasi respon dalam 1x24 jam.
                    </span>
                    <button 
                      type="button" 
                      onClick={() => onCancelOffer && onCancelOffer(offer.id)}
                      className="clone-btn-secondary"
                      style={{ color: '#ef4444' }}
                    >
                      Batalkan Penawaran
                    </button>
                  </div>
                )}

                {/* Status: Counter-Offer -> Accept or Re-negotiate */}
                {isCounter && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
                    <button 
                      type="button" 
                      onClick={() => handleOpenNegoModal(offer)}
                      className="clone-btn-secondary"
                    >
                      <ArrowClockwise size={15} weight="bold" />
                      <span>Tawar Ulang (Nego Balik)</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={() => onAcceptCounterOffer && onAcceptCounterOffer(offer.id)}
                      className="clone-btn-primary"
                    >
                      <CheckCircle size={16} weight="bold" />
                      <span>Setujui Tawaran Petani & Buat Kontrak</span>
                    </button>
                  </div>
                )}

                {/* Status: Disetujui -> Proceed to Binding Agreement */}
                {isApproved && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.86rem' }}>
                      <CheckCircle size={18} weight="fill" />
                      <span>Tawaran telah disepakati oleh kedua pihak. Siap diterbitkan kontrak legal.</span>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => onProceedToBinding && onProceedToBinding(offer.id)}
                      className="clone-btn-primary"
                    >
                      <Receipt size={16} weight="bold" />
                      <span>Lihat Riwayat Pesanan</span>
                    </button>
                  </div>
                )}

                {/* Status: Ditolak */}
                {isRejected && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '0.84rem', color: '#ef4444' }}>
                      Penawaran tidak dapat dipenuhi oleh petani. Anda dapat mencari komoditas serupa dari Poktan lain di katalog.
                    </span>
                    <button 
                      type="button" 
                      onClick={() => onCancelOffer && onCancelOffer(offer.id)}
                      className="clone-btn-secondary"
                    >
                      Hapus Riwayat
                    </button>
                  </div>
                )}

              </div>

            </div>
          );
        })}

        {filteredOffers.length === 0 && (
          <div className="farmer-empty-state">
            <Handshake size={48} weight="duotone" color="var(--text-muted)" />
            <h3 className="farmer-empty-title">Tidak Ada Penawaran</h3>
            <p className="farmer-empty-sub">
              Belum ada data penawaran dengan status "{statusFilter}". Silakan jelajahi katalog komoditas untuk mengajukan penawaran baru.
            </p>
          </div>
        )}
      </div>

      {/* ================= MODAL: NEGO ULANG (COUNTER-OFFER PEMBELI) ================= */}
      {reNegotiateModalOpen && selectedOfferForNego && (
        <div className="clone-modal-overlay" onClick={() => setReNegotiateModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowClockwise size={22} color="#f59e0b" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                    Negosiasi Ulang Harga
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.85rem' }}>
                    Kirim tawaran balik ke {selectedOfferForNego.farmerGroup}
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setReNegotiateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendNego}>
              <div className="clone-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="farmer-form-label">Harga yang Anda Ajukan Kembali (Rp/Kg) *</label>
                  <input 
                    type="number" 
                    required
                    value={newOfferedPrice}
                    onChange={(e) => setNewOfferedPrice(e.target.value)}
                    className="farmer-form-input"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Tawaran petani sebelumnya: Rp {selectedOfferForNego.counterPricePerKg?.toLocaleString('id-ID') || selectedOfferForNego.offeredPricePerKg.toLocaleString('id-ID')}/kg
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="farmer-form-label">Tonase yang Diminta (Ton) *</label>
                  <input 
                    type="number" 
                    required
                    value={newOfferedTon}
                    onChange={(e) => setNewOfferedTon(e.target.value)}
                    className="farmer-form-input"
                  />
                </div>

                <div>
                  <label className="farmer-form-label">Alasan atau Catatan untuk Petani</label>
                  <textarea 
                    rows={3}
                    placeholder="Contoh: Kami sepakat volume 35 ton jika harga Rp 13.080/kg dengan armada pick-up kami..."
                    value={newNegoNotes}
                    onChange={(e) => setNewNegoNotes(e.target.value)}
                    className="farmer-form-input"
                  />
                </div>
              </div>

              <div className="clone-modal-footer">
                <button type="button" className="clone-btn-secondary" onClick={() => setReNegotiateModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="clone-btn-primary">
                  Kirim Negosiasi Balik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
