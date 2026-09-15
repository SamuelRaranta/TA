import React, { useState } from 'react';
import { 
  Buildings, 
  MapPin, 
  ShieldCheck, 
  CheckCircle, 
  CreditCard, 
  Phone, 
  EnvelopeSimple, 
  Star, 
  PencilSimple, 
  FloppyDisk,
  FileText,
  Truck,
  IdentificationBadge
} from '@phosphor-icons/react';
import { INITIAL_BUYER_PROFILE } from './buyerMockData';

export default function BuyerProfile({ 
  profile = INITIAL_BUYER_PROFILE, 
  onUpdateProfile 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(formData);
    }
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="farmer-profile-view">
      
      {/* Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Profil Perusahaan & Legalitas Pengadaan</h1>
          <p className="farmer-page-sub">
            Informasi identitas korporasi pembeli, legalitas NIB/SIUP, titik gudang penerimaan, dan rekening operasional transaksi.
          </p>
        </div>

        {!isEditing ? (
          <button 
            type="button" 
            onClick={() => setIsEditing(true)}
            className="clone-btn-primary"
            style={{ borderRadius: '24px', padding: '0.65rem 1.4rem' }}
          >
            <PencilSimple size={16} weight="bold" />
            <span>Ubah Profil Perusahaan</span>
          </button>
        ) : (
          <button 
            type="button" 
            onClick={() => setIsEditing(false)}
            className="clone-btn-secondary"
            style={{ borderRadius: '24px' }}
          >
            Batal
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="farmer-alert-success">
          <CheckCircle size={20} weight="fill" />
          <span>Data profil perusahaan pembeli berhasil diperbarui!</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="farmer-profile-card">
        <div className="farmer-profile-banner">
          <div className="farmer-profile-avatar-wrap">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80" 
              alt="Hendra Pratama" 
              className="farmer-avatar-img"
            />
            <span className="farmer-online-badge" title="Akun Aktif" />
          </div>

          <div className="farmer-profile-title-col">
            <div className="farmer-name-row">
              <h2 className="farmer-name">{formData.companyName}</h2>
              <span className="farmer-badge-kyc verified">
                <ShieldCheck size={16} weight="fill" />
                <span>NIB Terverifikasi OSS</span>
              </span>
            </div>
            <p className="farmer-group-title">
              {formData.businessType} • PIC: <strong>{formData.name}</strong> ({formData.role})
            </p>
            <div className="farmer-meta-badges">
              <span className="farmer-meta-pill">
                <MapPin size={14} /> {formData.location}
              </span>
              <span className="farmer-meta-pill">
                <Star size={14} weight="fill" color="#fbbf24" /> {formData.rating} / 5.0 Rating Buyer
              </span>
              <span className="farmer-meta-pill">
                <Truck size={14} /> {formData.totalTonProcured.toLocaleString('id-ID')} Ton Realisasi Pengadaan
              </span>
            </div>
          </div>
        </div>

        {/* Content Form / View */}
        <form onSubmit={handleSave} className="farmer-profile-form">
          <div className="farmer-form-grid">
            
            {/* Section 1: Kontak PIC & Korporasi */}
            <div className="farmer-form-section">
              <h3 className="farmer-form-subtitle">
                <IdentificationBadge size={18} weight="bold" color="#5452f6" />
                <span>Informasi PIC & Legalitas Korporasi</span>
              </h3>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Nama PIC Procurement</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="farmer-form-input" 
                  />
                ) : (
                  <div className="farmer-val-box">{formData.name}</div>
                )}
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Nama Resmi Perusahaan</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.companyName} 
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="farmer-form-input" 
                  />
                ) : (
                  <div className="farmer-val-box">{formData.companyName}</div>
                )}
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Nomor Induk Berusaha (NIB) / Dokumen Legal</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.nib} 
                    onChange={(e) => setFormData({ ...formData, nib: e.target.value })}
                    className="farmer-form-input" 
                  />
                ) : (
                  <div className="farmer-val-box">{formData.nib}</div>
                )}
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">NPWP Perusahaan</label>
                <div className="farmer-val-box">{formData.npwp}</div>
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Email PIC / Procurement</label>
                {isEditing ? (
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="farmer-form-input" 
                  />
                ) : (
                  <div className="farmer-val-box">{formData.email}</div>
                )}
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Nomor Telepon / WhatsApp</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="farmer-form-input" 
                  />
                ) : (
                  <div className="farmer-val-box">{formData.phone}</div>
                )}
              </div>
            </div>

            {/* Section 2: Gudang Logistik & Rekening */}
            <div className="farmer-form-section">
              <h3 className="farmer-form-subtitle">
                <Truck size={18} weight="bold" color="#5452f6" />
                <span>Titik Gudang Penerima & Rekening Pembayaran</span>
              </h3>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Alamat Kantor Pusat</label>
                {isEditing ? (
                  <textarea 
                    rows={2}
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="farmer-form-input" 
                  />
                ) : (
                  <div className="farmer-val-box">{formData.location}</div>
                )}
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Titik Bongkar Gudang Logistik (Tujuan Armada)</label>
                {isEditing ? (
                  <textarea 
                    rows={3}
                    value={formData.warehouseAddress} 
                    onChange={(e) => setFormData({ ...formData, warehouseAddress: e.target.value })}
                    className="farmer-form-input" 
                  />
                ) : (
                  <div className="farmer-val-box">{formData.warehouseAddress}</div>
                )}
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Bank Operasional</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.bankAccount?.bank} 
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      bankAccount: { ...formData.bankAccount, bank: e.target.value } 
                    })}
                    className="farmer-form-input" 
                  />
                ) : (
                  <div className="farmer-val-box">{formData.bankAccount?.bank}</div>
                )}
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Nomor Rekening Perusahaan</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.bankAccount?.number} 
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      bankAccount: { ...formData.bankAccount, number: e.target.value } 
                    })}
                    className="farmer-form-input" 
                  />
                ) : (
                  <div className="farmer-val-box" style={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                    {formData.bankAccount?.number}
                  </div>
                )}
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Atas Nama Rekening</label>
                <div className="farmer-val-box">{formData.bankAccount?.holder}</div>
              </div>

              <div className="farmer-field-row">
                <label className="farmer-form-label">Sertifikasi & Standar Keamanan Pangan</label>
                <div className="farmer-val-box" style={{ color: '#10b981', fontWeight: 600 }}>
                  ✓ ISO 22000, HACCP, GMP Terverifikasi
                </div>
              </div>
            </div>

          </div>

          {isEditing && (
            <div className="farmer-form-actions">
              <button 
                type="submit" 
                className="clone-btn-primary"
                style={{ padding: '0.75rem 2rem' }}
              >
                <FloppyDisk size={18} weight="bold" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          )}
        </form>
      </div>

    </div>
  );
}
