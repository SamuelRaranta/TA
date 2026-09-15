import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  DownloadSimple, 
  Printer, 
  ShieldCheck, 
  Buildings, 
  X,
  Truck,
  WarningCircle,
  CurrencyCircleDollar
} from '@phosphor-icons/react';

export default function FarmerBinding({
  bindingAgreements,
  onUpdateBindingStatus
}) {
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);

  const handleOpenContractModal = (agreement) => {
    setSelectedAgreement(agreement);
    setContractModalOpen(true);
  };

  return (
    <div className="farmer-binding-view">
      
      {/* Section Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Digital Binding Agreement</h1>
          <p className="farmer-page-sub">
            Kesepakatan digital mengikat yang mengunci kuantitas, harga acuan, dan jadwal pengambilan sebelum transaksi fisik.
          </p>
        </div>
      </div>

      {/* Binding Agreement List */}
      <div className="farmer-binding-list">
        {bindingAgreements.map((agreement) => (
          <div key={agreement.id} className="farmer-binding-card">
            
            {/* Top Bar */}
            <div className="farmer-binding-card-top">
              <div className="farmer-binding-meta-left">
                <div className="farmer-binding-icon-circle">
                  <FileText size={22} weight="duotone" />
                </div>
                <div>
                  <div className="farmer-contract-code-row">
                    <span className="farmer-contract-code">{agreement.contractCode}</span>
                    <span className={`farmer-badge-status ${agreement.status === 'Terikat' ? 'emerald' : agreement.status === 'Barang Siap Diambil' ? 'blue' : 'gray'}`}>
                      {agreement.status === 'Terikat' && <CheckCircle size={13} weight="fill" />}
                      {agreement.status === 'Barang Siap Diambil' && <Truck size={13} weight="bold" />}
                      <span>{agreement.status}</span>
                    </span>
                  </div>
                  <span className="farmer-binding-date">Ditandatangani pada {agreement.signedDate}</span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => handleOpenContractModal(agreement)}
                className="btn-view-contract"
              >
                <FileText size={16} weight="bold" />
                <span>Lihat Dokumen Kontrak</span>
              </button>
            </div>

            {/* Core Info Grid */}
            <div className="farmer-binding-details-grid">
              <div className="farmer-binding-detail-box">
                <span className="farmer-binding-lbl">Komoditas Terikat</span>
                <span className="farmer-binding-val bold">{agreement.productName}</span>
              </div>

              <div className="farmer-binding-detail-box">
                <span className="farmer-binding-lbl">Pihak Pembeli</span>
                <span className="farmer-binding-val bold">
                  <Buildings size={14} /> {agreement.buyerName}
                </span>
              </div>

              <div className="farmer-binding-detail-box">
                <span className="farmer-binding-lbl">Tonase & Nilai Kesepakatan</span>
                <span className="farmer-binding-val highlight">
                  {agreement.tonnage} Ton • Rp {agreement.totalValue.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="farmer-binding-detail-box">
                <span className="farmer-binding-lbl">Tanda Jadi (Booking Fee)</span>
                <span className="farmer-binding-val green-tag">
                  <ShieldCheck size={14} weight="fill" /> Rp {agreement.bookingFee.toLocaleString('id-ID')} (5%) — Terkunci
                </span>
              </div>
            </div>

            {/* Schedule & Pickup Point */}
            <div className="farmer-pickup-info-banner">
              <div className="farmer-pickup-item">
                <Calendar size={16} weight="bold" color="var(--accent-primary)" />
                <div>
                  <span className="farmer-pickup-lbl">Jadwal Pengambilan / Uji Timbang:</span>
                  <span className="farmer-pickup-val">{agreement.pickupSchedule}</span>
                </div>
              </div>

              <div className="farmer-pickup-item">
                <MapPin size={16} weight="bold" color="var(--accent-primary)" />
                <div>
                  <span className="farmer-pickup-lbl">Titik Gudang / Lokasi Muat:</span>
                  <span className="farmer-pickup-val">{agreement.pickupLocation}</span>
                </div>
              </div>
            </div>

            {/* Timeline Stepper */}
            <div className="farmer-stepper-wrap">
              <span className="farmer-stepper-title">Progres Siklus Transaksi:</span>
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

            {/* Actions for Farmer */}
            {agreement.status !== 'Selesai' && (
              <div className="farmer-binding-card-footer">
                <div className="farmer-binding-status-msg">
                  <WarningCircle size={16} weight="bold" color="var(--accent-primary)" />
                  <span>
                    {agreement.status === 'Terikat'
                      ? 'Harap pastikan komoditas siap dikemas dan diuji kadar air saat armada pembeli tiba.'
                      : 'Armada pembeli sedang dalam perjalanan atau proses penimbangan di lokasi gudang.'}
                  </span>
                </div>

                <div className="farmer-binding-actions-right">
                  {agreement.status === 'Terikat' && (
                    <button 
                      type="button" 
                      onClick={() => onUpdateBindingStatus(agreement.id, 'Barang Siap Diambil')}
                      className="btn btn-primary-sm"
                    >
                      <Truck size={15} weight="bold" />
                      <span>Tandai Barang Siap Diambil</span>
                    </button>
                  )}

                  {agreement.status === 'Barang Siap Diambil' && (
                    <button 
                      type="button" 
                      onClick={() => onUpdateBindingStatus(agreement.id, 'Selesai')}
                      className="btn btn-success-sm"
                    >
                      <CheckCircle size={15} weight="bold" />
                      <span>Konfirmasi Transaksi Selesai</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {agreement.status === 'Selesai' && (
              <div className="farmer-binding-card-footer completed">
                <div className="farmer-binding-status-msg success">
                  <CheckCircle size={17} weight="fill" color="#10b981" />
                  <span>Kesepakatan dan transaksi fisik telah selesai. Pembayaran lunas telah diserahkan antar pihak.</span>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* MODAL: Surat Perjanjian Digital (Binding Agreement Contract) */}
      {contractModalOpen && selectedAgreement && (
        <div className="farmer-modal-overlay" onClick={() => setContractModalOpen(false)}>
          <div className="farmer-contract-modal-paper" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Top Bar (Print / Close) */}
            <div className="farmer-contract-toolbar no-print">
              <span className="farmer-contract-toolbar-title">
                Dokumen Resmi Kesepakatan Terikat (Binding Agreement)
              </span>
              <div className="farmer-toolbar-actions">
                <button 
                  type="button" 
                  onClick={() => window.print()}
                  className="btn-toolbar-action"
                >
                  <Printer size={16} />
                  <span>Cetak</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => alert('Simulasi unduhan PDF Kontrak Resmi ' + selectedAgreement.contractCode)}
                  className="btn-toolbar-action"
                >
                  <DownloadSimple size={16} />
                  <span>Unduh PDF</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setContractModalOpen(false)}
                  className="farmer-modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Official Digital Contract Document View */}
            <div className="farmer-paper-document">
              {/* Header Letterhead */}
              <div className="farmer-paper-header">
                <div className="farmer-paper-brand">
                  <span className="farmer-paper-logo">AgriConnect</span>
                  <span className="farmer-paper-motto">Platform B2B Komoditas Pertanian Digital Indonesia</span>
                </div>
                <div className="farmer-paper-doc-meta">
                  <span className="farmer-paper-badge">SURAT KESEPAKATAN TERIKAT (BINDING)</span>
                  <span className="farmer-paper-code">Nomor: {selectedAgreement.contractCode}</span>
                  <span className="farmer-paper-date">Tanggal: {selectedAgreement.signedDate}</span>
                </div>
              </div>

              <div className="farmer-paper-divider" />

              {/* Preamble */}
              <p className="farmer-paper-text">
                Pada hari ini, telah disepakati komitmen transaksi perdagangan komoditas pertanian skala besar melalui platform <strong>AgriConnect</strong> antara pihak-pihak sebagai berikut:
              </p>

              {/* Parties Block */}
              <div className="farmer-paper-parties">
                <div className="farmer-party-col">
                  <span className="farmer-party-role">PIHAK PERTAMA (PENJUAL / PRODUSEN):</span>
                  <strong className="farmer-party-name">{selectedAgreement.farmerName}</strong>
                  <span className="farmer-party-sub">Kec. Langowan Timur, Kab. Minahasa, Sulawesi Utara</span>
                  <span className="farmer-party-sub">Status: Terverifikasi Resmi KYC Platform</span>
                </div>
                <div className="farmer-party-col">
                  <span className="farmer-party-role">PIHAK KEDUA (PEMBELI / DISTRIBUTOR):</span>
                  <strong className="farmer-party-name">{selectedAgreement.buyerName}</strong>
                  <span className="farmer-party-sub">Perusahaan / Distributor Berbadan Hukum</span>
                  <span className="farmer-party-sub">Status: Terverifikasi NIB Platform</span>
                </div>
              </div>

              {/* Clause Table */}
              <table className="farmer-paper-table">
                <thead>
                  <tr>
                    <th>Deskripsi Kesepakatan</th>
                    <th>Spesifikasi & Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nama Komoditas</td>
                    <td><strong>{selectedAgreement.productName}</strong></td>
                  </tr>
                  <tr>
                    <td>Volume / Tonase Disepakati</td>
                    <td><strong>{selectedAgreement.tonnage} Ton ({selectedAgreement.tonnage * 1000} Kg)</strong></td>
                  </tr>
                  <tr>
                    <td>Harga Per Kilogram</td>
                    <td><strong>Rp {selectedAgreement.pricePerKg.toLocaleString('id-ID')} / kg</strong> (Nett di Lokasi Gudang)</td>
                  </tr>
                  <tr>
                    <td>Total Nilai Transaksi</td>
                    <td><strong className="text-primary-blue">Rp {selectedAgreement.totalValue.toLocaleString('id-ID')}</strong></td>
                  </tr>
                  <tr>
                    <td>Tanda Jadi Komitmen (Booking Fee 5%)</td>
                    <td><strong>Rp {selectedAgreement.bookingFee.toLocaleString('id-ID')}</strong> (Terkunci Aman di Platform)</td>
                  </tr>
                  <tr>
                    <td>Jadwal Pengambilan & Uji Kualitas</td>
                    <td>{selectedAgreement.pickupSchedule}</td>
                  </tr>
                  <tr>
                    <td>Lokasi Titik Muat</td>
                    <td>{selectedAgreement.pickupLocation}</td>
                  </tr>
                  <tr>
                    <td>Metode Pelunasan Sisa Pembayaran</td>
                    <td>{selectedAgreement.paymentMethod}</td>
                  </tr>
                </tbody>
              </table>

              {/* Terms and Signatures */}
              <div className="farmer-paper-terms">
                <h4>Klausul Komitmen & Kebijakan:</h4>
                <ol>
                  <li>Kedua belah pihak sepakat mengunci volume dan harga yang tertera di atas tanpa perubahan sepihak.</li>
                  <li>Pihak Pertama menjamin kualitas komoditas bebas dari hama berbahaya dan sesuai standar kadar air yang disepakati.</li>
                  <li>Pihak Kedua berkewajiban mengirimkan armada transportasi sesuai jadwal yang telah disepakati.</li>
                  <li>Tanda jadi (booking fee) akan dicairkan/diperhitungkan setelah serah terima fisik barang tuntas.</li>
                </ol>
              </div>

              {/* Digital Signatures */}
              <div className="farmer-paper-signatures">
                <div className="farmer-sig-box">
                  <span>Pihak Pertama (Petani Produsen),</span>
                  <div className="farmer-sig-seal">
                    <ShieldCheck size={28} weight="fill" color="#2563eb" />
                    <span>DIGITALLY SIGNED & VERIFIED</span>
                    <small>AgriConnect Trust Network</small>
                  </div>
                  <strong>{selectedAgreement.farmerName}</strong>
                </div>

                <div className="farmer-sig-box">
                  <span>Pihak Kedua (Pembeli),</span>
                  <div className="farmer-sig-seal">
                    <ShieldCheck size={28} weight="fill" color="#2563eb" />
                    <span>DIGITALLY SIGNED & VERIFIED</span>
                    <small>AgriConnect Trust Network</small>
                  </div>
                  <strong>{selectedAgreement.buyerName}</strong>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
