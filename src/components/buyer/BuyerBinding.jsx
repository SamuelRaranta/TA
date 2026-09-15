import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Truck, 
  Printer, 
  X, 
  DownloadSimple, 
  Info,
  Buildings,
  QrCode,
  LockKey
} from '@phosphor-icons/react';
import { INITIAL_BUYER_BINDINGS } from './buyerMockData';

export default function BuyerBinding({ 
  bindingAgreements = INITIAL_BUYER_BINDINGS,
  onUpdateStatus 
}) {
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [spkModalOpen, setSpkModalOpen] = useState(false);
  const [selectedForSpk, setSelectedForSpk] = useState(null);

  const handleOpenContractModal = (agreement) => {
    setSelectedContract(agreement);
    setContractModalOpen(true);
  };

  const handleOpenSpkModal = (agreement) => {
    setSelectedForSpk(agreement);
    setSpkModalOpen(true);
  };

  return (
    <div className="farmer-binding-view">
      
      {/* Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Digital Binding Agreement (Kontrak Pengadaan)</h1>
          <p className="farmer-page-sub">
            Perjanjian resmi terikat digital yang menjamin alokasi tonase panen, harga acuan tetap, dan kepastian pasokan logistik industri Anda.
          </p>
        </div>
      </div>

      {/* Escrow Guarantee Banner */}
      <div className="farmer-market-notice-banner" style={{ background: 'rgba(84, 82, 246, 0.06)', borderColor: 'rgba(84, 82, 246, 0.25)' }}>
        <ShieldCheck size={26} weight="fill" color="#5452f6" />
        <div className="farmer-notice-text">
          <strong style={{ color: '#5452f6' }}>Jaminan Perlindungan Transaksi Pembeli (Escrow Platform):</strong>
          <p style={{ marginTop: '2px', fontSize: '0.86rem' }}>
            Tanda jadi <strong>Booking Fee (5%)</strong> Anda diamankan di rekening penjamin resmi AgriConnect dan baru dilepaskan setelah armada Anda tiba di gudang dan barang diverifikasi lolos timbang. Jika petani ingkar janji, dana dikembalikan penuh dengan kompensasi penalti.
          </p>
        </div>
      </div>

      {/* Binding Contracts List */}
      <div className="farmer-bindings-list">
        {bindingAgreements.map((agreement) => (
          <div key={agreement.id} className="farmer-binding-card">
            
            {/* Header Card */}
            <div className="farmer-binding-card-header">
              <div className="farmer-binding-meta-left">
                <div className="farmer-binding-icon-circle" style={{ background: 'rgba(84, 82, 246, 0.12)', color: '#5452f6' }}>
                  <FileText size={22} weight="duotone" />
                </div>
                <div>
                  <div className="farmer-contract-code-row">
                    <span className="farmer-contract-code">{agreement.contractCode}</span>
                    <span className={`farmer-badge-status ${agreement.status === 'Terikat' ? 'emerald' : 'blue'}`}>
                      <CheckCircle size={13} weight="fill" />
                      <span>{agreement.status}</span>
                    </span>
                  </div>
                  <span className="farmer-binding-date">Ditandatangani digital pada {agreement.signedDate}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => handleOpenSpkModal(agreement)}
                  className="clone-btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                  title="Cetak Surat Perintah Muat Armada"
                >
                  <Truck size={15} weight="bold" />
                  <span>Surat Muat Armada</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => handleOpenContractModal(agreement)}
                  className="btn-view-contract"
                >
                  <FileText size={16} weight="bold" />
                  <span>Naskah Kontrak Legal</span>
                </button>
              </div>
            </div>

            {/* Core Info Grid */}
            <div className="farmer-binding-details-grid">
              <div className="farmer-binding-detail-box">
                <span className="farmer-binding-lbl">Komoditas Terikat</span>
                <span className="farmer-binding-val bold">{agreement.productName}</span>
              </div>

              <div className="farmer-binding-detail-box">
                <span className="farmer-binding-lbl">Mitra Kelompok Tani</span>
                <span className="farmer-binding-val bold" style={{ color: '#5452f6' }}>
                  <Buildings size={14} /> {agreement.farmerName}
                </span>
              </div>

              <div className="farmer-binding-detail-box">
                <span className="farmer-binding-lbl">Tonase & Nilai Kesepakatan</span>
                <span className="farmer-binding-val highlight">
                  {agreement.tonnage} Ton • Rp {agreement.totalValue.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="farmer-binding-detail-box">
                <span className="farmer-binding-lbl">Booking Fee (5%) Terkunci</span>
                <span className="farmer-binding-val green-tag">
                  <LockKey size={14} weight="fill" /> Rp {agreement.bookingFee.toLocaleString('id-ID')} — Terkunci Escrow
                </span>
              </div>
            </div>

            {/* Schedule & Pickup Point */}
            <div className="farmer-pickup-info-banner">
              <div className="farmer-pickup-item">
                <Calendar size={16} weight="bold" color="#5452f6" />
                <div>
                  <span className="farmer-pickup-lbl">Jadwal Pengambilan Armada Mandiri:</span>
                  <span className="farmer-pickup-val">{agreement.pickupSchedule}</span>
                </div>
              </div>

              <div className="farmer-pickup-item">
                <MapPin size={16} weight="bold" color="#5452f6" />
                <div>
                  <span className="farmer-pickup-lbl">Titik Gudang Muat Poktan:</span>
                  <span className="farmer-pickup-val">{agreement.pickupLocation}</span>
                </div>
              </div>

              {agreement.picWarehouse && (
                <div className="farmer-pickup-item">
                  <Info size={16} weight="bold" color="#5452f6" />
                  <div>
                    <span className="farmer-pickup-lbl">PIC Lapangan Gudang Poktan:</span>
                    <span className="farmer-pickup-val">{agreement.picWarehouse}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Stepper */}
            <div className="farmer-stepper-wrap">
              <span className="farmer-stepper-title">Progres Siklus Pengadaan:</span>
              <div className="farmer-stepper-track">
                {agreement.timeline.map((step, idx) => (
                  <div key={idx} className={`farmer-step-node ${step.completed ? 'completed' : 'pending'}`}>
                    <div className="farmer-step-circle">
                      {step.completed ? <CheckCircle size={14} weight="fill" /> : <span>{idx + 1}</span>}
                    </div>
                    <div className="farmer-step-content">
                      <span className="farmer-step-label">{step.label}</span>
                      <span className="farmer-step-date">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* ================= MODAL: LEGAL PAPER CONTRACT ================= */}
      {contractModalOpen && selectedContract && (
        <div className="clone-modal-overlay" onClick={() => setContractModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} color="#5452f6" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    Naskah Digital Binding Agreement
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.82rem' }}>
                    Nomor: {selectedContract.contractCode}
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setContractModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Contract Body Document */}
            <div className="clone-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', background: '#fafafa', padding: '1.5rem' }}>
              <div style={{ 
                background: '#ffffff', 
                padding: '2.5rem', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                fontFamily: 'serif',
                color: '#1e293b',
                lineHeight: 1.6
              }}>
                
                {/* Header Paper */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', margin: 0, textTransform: 'uppercase' }}>
                    Surat Perjanjian Pengikatan Pengadaan Komoditas
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                    Digital Binding Agreement Platform AgriConnect
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px' }}>
                    Nomor Registrasi: {selectedContract.contractCode}
                  </div>
                </div>

                {/* Opening */}
                <p style={{ fontSize: '0.88rem' }}>
                  Pada hari ini, <strong>{selectedContract.signedDate}</strong>, telah disepakati perjanjian transaksi komoditas pertanian berskala besar melalui platform resmi AgriConnect antara pihak-pihak:
                </p>

                <div style={{ fontSize: '0.86rem', margin: '1rem 0' }}>
                  <div><strong>PIHAK PERTAMA (PEMBELI):</strong> {selectedContract.buyerName}</div>
                  <div><strong>PIHAK KEDUA (PETANI / PRODUSEN):</strong> {selectedContract.farmerName}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', margin: '1rem 0', fontSize: '0.86rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>RINCIAN KESEPAKATAN PENGADAAN:</div>
                  <div>• Komoditas: <strong>{selectedContract.productName}</strong></div>
                  <div>• Volume Terikat: <strong>{selectedContract.tonnage} Ton ({selectedContract.tonnage * 1000} Kg)</strong></div>
                  <div>• Harga Per Satuan: <strong>Rp {selectedContract.pricePerKg.toLocaleString('id-ID')}/Kg</strong></div>
                  <div>• Total Nilai Transaksi: <strong>Rp {selectedContract.totalValue.toLocaleString('id-ID')}</strong></div>
                  <div>• Tanda Jadi Booking Fee (5%): <strong>Rp {selectedContract.bookingFee.toLocaleString('id-ID')} ({selectedContract.bookingFeeStatus})</strong></div>
                  <div>• Jadwal Pengambilan Armada Mandiri: <strong>{selectedContract.pickupSchedule}</strong></div>
                  <div>• Titik Gudang Penyerahan: <strong>{selectedContract.pickupLocation}</strong></div>
                </div>

                {/* Clauses */}
                <div style={{ fontSize: '0.84rem', marginTop: '1rem' }}>
                  <strong>KLAUSUL DAN KETENTUAN PENGADAAN:</strong>
                  <ol style={{ paddingLeft: '1.2rem', marginTop: '4px' }}>
                    {selectedContract.clauses.map((clause, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{clause}</li>
                    ))}
                    <li>Platform AgriConnect bertindak sebagai penjamin sah (escrow holder) atas booking fee.</li>
                    <li>Pelunasan sisa 95% diselesaikan langsung saat proses muat dan verifikasi timbang di gudang pihak kedua.</li>
                  </ol>
                </div>

                {/* Signature Box */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
                  <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                    <div>PIHAK PERTAMA (PEMBELI)</div>
                    <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ padding: '4px 10px', border: '1px solid #10b981', color: '#10b981', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                        ✓ DIGITAL SIGNED (NIB VALID)
                      </div>
                    </div>
                    <strong>{selectedContract.buyerName}</strong>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                    <div>PIHAK KEDUA (PETANI)</div>
                    <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ padding: '4px 10px', border: '1px solid #10b981', color: '#10b981', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                        ✓ DIGITAL SIGNED (POKTAN VALID)
                      </div>
                    </div>
                    <strong>{selectedContract.farmerName}</strong>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-secondary" onClick={() => setContractModalOpen(false)}>
                Tutup
              </button>
              <button 
                type="button" 
                className="clone-btn-primary"
                onClick={() => alert('Mengunduh dokumen PDF Binding Agreement resmi dengan stempel digital...')}
              >
                <DownloadSimple size={16} weight="bold" />
                <span>Unduh Kontrak PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: SURAT PERINTAH JALAN ARMADA (SPK) ================= */}
      {spkModalOpen && selectedForSpk && (
        <div className="clone-modal-overlay" onClick={() => setSpkModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={22} color="#5452f6" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    Surat Perintah Muat Armada (SPK Self-Pickup)
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.82rem' }}>
                    Tunjukkan dokumen ini saat armada tiba di gudang poktan
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setSpkModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body">
              <div style={{ padding: '1.25rem', borderRadius: '8px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Kode Otorisasi Muat:</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#5452f6', letterSpacing: '1px' }}>
                      PICKUP-{selectedForSpk.id}
                    </div>
                  </div>
                  <div style={{ width: '64px', height: '64px', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={52} color="#1e293b" />
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', display: 'grid', gap: '8px' }}>
                  <div><strong>Tujuan Gudang:</strong> {selectedForSpk.pickupLocation}</div>
                  <div><strong>Kontak Pengelola:</strong> {selectedForSpk.picWarehouse || selectedForSpk.farmerName}</div>
                  <div><strong>Komoditas:</strong> {selectedForSpk.productName} ({selectedForSpk.tonnage} Ton)</div>
                  <div><strong>Rentang Kedatangan:</strong> {selectedForSpk.pickupSchedule}</div>
                  <div><strong>Status Booking Fee:</strong> <span style={{ color: '#10b981', fontWeight: 600 }}>Telah Terkunci di Platform</span></div>
                </div>
              </div>
            </div>

            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-secondary" onClick={() => setSpkModalOpen(false)}>
                Tutup
              </button>
              <button type="button" className="clone-btn-primary" onClick={() => alert('Mencetak Surat Jalan Armada...')}>
                <Printer size={16} weight="bold" />
                <span>Cetak / Bagikan ke Supir</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
