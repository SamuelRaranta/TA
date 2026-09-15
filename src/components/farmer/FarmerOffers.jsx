import React, { useState } from 'react';
import { 
  Handshake, 
  CheckCircle, 
  XCircle, 
  ArrowClockwise, 
  Buildings, 
  Calendar, 
  ChatCircleText, 
  Tag, 
  Clock, 
  X,
  ShieldCheck,
  TrendUp
} from '@phosphor-icons/react';

export default function FarmerOffers({
  offers,
  onAcceptOffer,
  onRejectOffer,
  onSubmitCounterOffer
}) {
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  
  // Counter offer form
  const [counterPrice, setCounterPrice] = useState(0);
  const [counterTon, setCounterTon] = useState(0);
  const [counterNotes, setCounterNotes] = useState('');

  const handleOpenCounter = (offer) => {
    setSelectedOffer(offer);
    setCounterPrice(offer.listingPricePerKg);
    setCounterTon(offer.requestedTon);
    setCounterNotes(`Kami menawarkan harga penyesuaian Rp ${offer.listingPricePerKg.toLocaleString('id-ID')}/kg dengan kesiapan muat armada dari gudang kami.`);
    setCounterModalOpen(true);
  };

  const handleSendCounter = (e) => {
    e.preventDefault();
    if (!selectedOffer) return;
    onSubmitCounterOffer({
      offerId: selectedOffer.id,
      counterPrice,
      counterTon,
      counterNotes
    });
    setCounterModalOpen(false);
  };

  const filteredOffers = offers.filter(o => {
    if (statusFilter === 'Semua') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="farmer-offers-view">
      
      {/* Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Kelola Penawaran Masuk (Offers)</h1>
          <p className="farmer-page-sub">
            Tinjau proposal pembelian tonase dan negosiasikan harga terbaik sebelum mengikat kesepakatan digital.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="farmer-filter-bar">
        <div className="farmer-filter-tabs">
          {['Semua', 'Menunggu Respon', 'Counter-Offer', 'Diterima', 'Ditolak'].map((tab) => (
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
          const priceDiff = offer.offeredPricePerKg - offer.listingPricePerKg;

          return (
            <div key={offer.id} className="farmer-offer-card">
              
              {/* Top Bar Card */}
              <div className="farmer-offer-card-top">
                <div className="farmer-offer-buyer-badge">
                  <div className="farmer-buyer-avatar">
                    <Buildings size={20} weight="duotone" />
                  </div>
                  <div>
                    <div className="farmer-buyer-title-row">
                      <span className="farmer-buyer-title">{offer.buyerName}</span>
                      <span className="farmer-buyer-kyc-pill">
                        <ShieldCheck size={13} weight="fill" /> {offer.buyerKyc}
                      </span>
                    </div>
                    <span className="farmer-buyer-meta">
                      {offer.buyerType} • {offer.buyerLocation} • Masuk pada {offer.submittedDate}
                    </span>
                  </div>
                </div>

                <div className="farmer-offer-status-col">
                  <span className={`farmer-badge-status ${offer.status === 'Menunggu Respon' ? 'amber' : offer.status === 'Diterima' ? 'emerald' : offer.status === 'Ditolak' ? 'red' : 'blue'}`}>
                    {offer.status}
                  </span>
                  <span className="farmer-offer-id-code">{offer.id}</span>
                </div>
              </div>

              {/* Product & Pricing Grid */}
              <div className="farmer-offer-pricing-box">
                <div className="farmer-pricing-item">
                  <span className="farmer-pricing-lbl">Komoditas yang Diminta</span>
                  <span className="farmer-pricing-val bold">{offer.productName}</span>
                </div>

                <div className="farmer-pricing-item">
                  <span className="farmer-pricing-lbl">Volume Tonase</span>
                  <span className="farmer-pricing-val bold">{offer.requestedTon} Ton ({offer.requestedTon * 1000} Kg)</span>
                </div>

                <div className="farmer-pricing-item">
                  <span className="farmer-pricing-lbl">Harga Penawaran Pembeli</span>
                  <div className="farmer-price-flex">
                    <span className="farmer-pricing-val highlight">
                      Rp {offer.offeredPricePerKg.toLocaleString('id-ID')} /kg
                    </span>
                    <span className={`farmer-price-diff ${priceDiff >= 0 ? 'equal' : 'below'}`}>
                      {priceDiff === 0 ? '(Sesuai Listing)' : `${priceDiff.toLocaleString('id-ID')}/kg`}
                    </span>
                  </div>
                </div>

                <div className="farmer-pricing-item">
                  <span className="farmer-pricing-lbl">Total Nilai Kesepakatan</span>
                  <span className="farmer-pricing-val total-green">
                    Rp {totalValue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Notes from Buyer */}
              {offer.notes && (
                <div className="farmer-offer-notes-box">
                  <ChatCircleText size={16} weight="fill" color="var(--accent-primary)" />
                  <div className="farmer-notes-content">
                    <span className="farmer-notes-title">Catatan & Syarat Pengambilan dari Pembeli:</span>
                    <p className="farmer-notes-text">"{offer.notes}"</p>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              {offer.status === 'Menunggu Respon' && (
                <div className="farmer-offer-actions-footer">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (window.confirm(`Yakin ingin menolak penawaran dari ${offer.buyerName}?`)) {
                        onRejectOffer(offer.id);
                      }
                    }}
                    className="btn-offer-action reject"
                  >
                    <XCircle size={17} weight="bold" />
                    <span>Tolak Penawaran</span>
                  </button>

                  <div className="farmer-actions-right">
                    <button 
                      type="button" 
                      onClick={() => handleOpenCounter(offer)}
                      className="btn-offer-action counter"
                    >
                      <ArrowClockwise size={17} weight="bold" />
                      <span>Ajukan Counter-Offer</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={() => onAcceptOffer(offer.id)}
                      className="btn-offer-action accept"
                    >
                      <CheckCircle size={17} weight="bold" />
                      <span>Terima & Ikat Kesepakatan (Binding)</span>
                    </button>
                  </div>
                </div>
              )}

              {offer.status === 'Diterima' && (
                <div className="farmer-offer-status-notif success">
                  <CheckCircle size={17} weight="fill" color="#10b981" />
                  <span>Penawaran telah disepakati dan dialihkan ke dokumen <strong>Binding Agreement</strong>.</span>
                </div>
              )}

              {offer.status === 'Counter-Offer' && (
                <div className="farmer-offer-status-notif counter">
                  <Clock size={17} weight="bold" color="var(--accent-primary)" />
                  <span>Proposal counter-offer telah dikirimkan ke pembeli. Menunggu persetujuan balik.</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {filteredOffers.length === 0 && (
        <div className="farmer-empty-state">
          <Handshake size={48} weight="duotone" color="var(--text-muted)" />
          <h3>Tidak ada penawaran dengan status "{statusFilter}"</h3>
          <p>Penawaran baru dari pembeli akan muncul otomatis di halaman ini.</p>
        </div>
      )}

      {/* Compact Bottom Card: Kebijakan & Perlindungan Penawaran */}
      <div className="clone-compact-card">
        <div className="clone-compact-header">
          <div className="clone-compact-header-left">
            <div className="clone-compact-icon-badge amber">
              <ShieldCheck size={18} weight="bold" />
            </div>
            <div>
              <h4 className="clone-compact-title">Perlindungan & Ketentuan Negosiasi Penawaran Masuk</h4>
              <p className="clone-compact-subtitle">Jaminan transaksi aman sebelum penerbitan dokumen binding agreement</p>
            </div>
          </div>
          <span className="clone-compact-tag">Mitra Terverifikasi</span>
        </div>

        <div className="clone-compact-grid">
          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">🛡️</span>
            <div>
              <div className="clone-compact-item-title">Tanda Jadi 5% Dikunci Otomatis</div>
              <p className="clone-compact-item-desc">
                Saat penawaran disepakati, sistem mengunci booking fee pembeli di rekening bersama sebelum barang disiapkan.
              </p>
            </div>
          </div>

          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">⏱️</span>
            <div>
              <div className="clone-compact-item-title">Batas Waktu Respon 48 Jam</div>
              <p className="clone-compact-item-desc">
                Tanggapi penawaran (terima, tolak, atau ajukan counter-offer) sebelum kuota tonase kadaluarsa.
              </p>
            </div>
          </div>

          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">🚛</span>
            <div>
              <div className="clone-compact-item-title">Self-Pickup Armada Pembeli</div>
              <p className="clone-compact-item-desc">
                Petani tidak menanggung biaya angkut. Seluruh armada dan biaya muat disediakan mandiri oleh pembeli.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Ajukan Counter-Offer */}
      {counterModalOpen && selectedOffer && (
        <div className="farmer-modal-overlay" onClick={() => setCounterModalOpen(false)}>
          <div className="farmer-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="farmer-modal-header">
              <div>
                <h2 className="farmer-modal-title">Ajukan Negosiasi (Counter-Offer)</h2>
                <p className="farmer-modal-sub">
                  Kirimkan tawaran harga penyesuaian atau kuantitas kepada <strong>{selectedOffer.buyerName}</strong>.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setCounterModalOpen(false)} 
                className="farmer-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendCounter} className="farmer-modal-form">
              <div className="farmer-counter-summary-box">
                <div className="farmer-counter-stat">
                  <span>Komoditas:</span>
                  <strong>{selectedOffer.productName}</strong>
                </div>
                <div className="farmer-counter-stat">
                  <span>Tawaran Awal Pembeli:</span>
                  <strong>Rp {selectedOffer.offeredPricePerKg.toLocaleString('id-ID')} /kg ({selectedOffer.requestedTon} Ton)</strong>
                </div>
                <div className="farmer-counter-stat">
                  <span>Harga Listing Awal Anda:</span>
                  <strong>Rp {selectedOffer.listingPricePerKg.toLocaleString('id-ID')} /kg</strong>
                </div>
              </div>

              <div className="farmer-form-row two-cols">
                <div className="farmer-form-group">
                  <label className="farmer-form-label">Harga Penyesuaian Anda (Rp / kg)</label>
                  <input 
                    type="number" 
                    required 
                    min="500"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(Number(e.target.value))}
                    className="farmer-form-input"
                  />
                </div>

                <div className="farmer-form-group">
                  <label className="farmer-form-label">Tonase yang Dapat Disanggupi (Ton)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={counterTon}
                    onChange={(e) => setCounterTon(Number(e.target.value))}
                    className="farmer-form-input"
                  />
                </div>
              </div>

              <div className="farmer-form-group">
                <label className="farmer-form-label">Catatan Negosiasi untuk Pembeli</label>
                <textarea 
                  rows="3"
                  required
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="Jelaskan alasan harga, standar kualitas, atau kesiapan jadwal pengambilan armada..."
                  className="farmer-form-textarea"
                />
              </div>

              <div className="farmer-modal-actions">
                <button 
                  type="button" 
                  onClick={() => setCounterModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-pill)', padding: '0.65rem 1.6rem' }}
                >
                  Kirimkan Counter-Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
