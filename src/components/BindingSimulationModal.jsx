import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Handshake, 
  CheckCircle, 
  FileLock, 
  Sparkle,
  ArrowRight
} from '@phosphor-icons/react';

export default function BindingSimulationModal({ isOpen, onClose, commodity }) {
  const selected = commodity || {
    name: 'Cengkeh Zanzibar Kering Sikotok',
    stock: 25,
    price: 125000,
    farmer: 'Poktan Ranowangko Langowan',
    location: 'Langowan, Minahasa'
  };

  const [quantity, setQuantity] = useState(25); // default 25 Ton
  const [offerPrice, setOfferPrice] = useState(selected.price);
  const [pickupDate, setPickupDate] = useState('2026-09-20');
  const [submitted, setSubmitted] = useState(false);

  // Calculations
  const totalKg = quantity * 1000;
  const totalValue = totalKg * offerPrice;
  const bookingFee = Math.round(totalValue * 0.05); // 5% komitmen tanda jadi

  const handleSimulate = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal Container in Reference White Card Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              width: '100%',
              maxWidth: '620px',
              position: 'relative',
              zIndex: 1,
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-surface-card)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-canvas-muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'var(--bg-canvas-subtle)';
              }}
            >
              <X size={18} weight="bold" />
            </button>

            {!submitted ? (
              /* Simulation Form */
              <div>
                <div style={{ marginBottom: '0.85rem' }}>
                  <span className="pill-badge">
                    SIMULASI PENAWARAN BINDING
                  </span>
                </div>

                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Ajukan Komitmen Penawaran
                </h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
                  Komoditas: <strong style={{ color: 'var(--text-primary)' }}>{selected.name}</strong> • Produsen: {selected.farmer} ({selected.location})
                </p>

                <form onSubmit={handleSimulate}>
                  {/* Quantity Slider / Input */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Volume yang Diajukan (Ton):
                      </label>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }} className="tabular-data">
                        {quantity} Ton ({totalKg.toLocaleString('id-ID')} kg)
                      </span>
                    </div>

                    <input 
                      type="range"
                      min="1"
                      max={selected.stock || 100}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      style={{
                        width: '100%',
                        accentColor: 'var(--accent-primary)',
                        cursor: 'pointer',
                        height: '6px'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>Min: 1 Ton</span>
                      <span>Maks Stok Petani: {selected.stock} Ton</span>
                    </div>
                  </div>

                  {/* Price Input */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      Tawaran Harga per Kilogram (Rp):
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Rp
                      </span>
                      <input 
                        type="number"
                        step="50"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(Number(e.target.value))}
                        className="saas-input tabular-data"
                        style={{ paddingLeft: '3rem', fontSize: '1.05rem', fontWeight: 700 }}
                        required
                      />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Harga acuan petani: Rp {selected.price.toLocaleString('id-ID')}/kg
                    </div>
                  </div>

                  {/* Pickup / Inspection Date */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      Target Jadwal Pengecekan Fisik ke Gudang Petani:
                    </label>
                    <input 
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="saas-input"
                      required
                    />
                  </div>

                  {/* Calculation Summary Box */}
                  <div style={{
                    background: 'var(--bg-canvas-subtle)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.92rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Estimasi Total Transaksi:</span>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem' }} className="tabular-data">
                        Rp {totalValue.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tanda Jadi Komitmen (5% Opsional):</span>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }} className="tabular-data">
                        Rp {bookingFee.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', marginTop: '0.65rem' }}>
                      * Sisa pembayaran 95% dilunasi langsung ke rekening petani setelah pengecekan fisik barang disetujui.
                    </div>
                  </div>

                  {/* Submit Simulation CTA matching Reference Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}
                  >
                    <span>Kunci Penawaran & Terbitkan Binding</span>
                    <span className="btn-circle-icon">
                      <ArrowRight size={14} weight="bold" />
                    </span>
                  </button>
                </form>
              </div>
            ) : (
              /* Simulation Generated Result (Digital Contract) */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary-light)',
                    color: 'var(--accent-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    border: '1px solid var(--accent-primary-border)'
                  }}>
                    <FileLock size={32} weight="fill" />
                  </div>

                  <span className="pill-badge" style={{ marginBottom: '0.5rem' }}>
                    KESEPAKATAN RESMI TERIKAT
                  </span>
                  <h3 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    Binding Agreement Berhasil Diterbitkan!
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Kedua belah pihak menerima salinan perjanjian digital terenkripsi.
                  </p>
                </div>

                {/* Digital Certificate Box */}
                <div style={{
                  background: 'var(--bg-canvas-subtle)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nomor Registrasi Binding:</span>
                    <span className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      AGRI-BIND-2026-X9928
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Komoditas:</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selected.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Volume Terikat:</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }} className="tabular-data">{quantity} Ton ({totalKg.toLocaleString('id-ID')} kg)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Harga Disepakati:</div>
                      <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }} className="tabular-data">Rp {offerPrice.toLocaleString('id-ID')}/kg</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Jadwal Pengecekan:</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pickupDate}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Nilai Kontrak:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }} className="tabular-data">
                      Rp {totalValue.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Uji Penawaran Lain
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Tutup Simulasi
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
