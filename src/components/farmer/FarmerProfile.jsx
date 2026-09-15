import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Plant, 
  ShieldCheck, 
  CheckCircle, 
  CreditCard, 
  Buildings, 
  Phone, 
  EnvelopeSimple, 
  Star, 
  PencilSimple, 
  Check, 
  FloppyDisk
} from '@phosphor-icons/react';

export default function FarmerProfile({ profile, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="farmer-profile-view">
      
      {/* Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Profil Petani & Legalitas Lahan</h1>
          <p className="farmer-page-sub">
            Informasi identitas kelompok tani, legalitas KYC lahan, dan rekening pencairan tanda jadi (booking fee).
          </p>
        </div>

        {!isEditing ? (
          <button 
            type="button" 
            onClick={() => setIsEditing(true)}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-pill)', padding: '0.65rem 1.4rem' }}
          >
            <PencilSimple size={16} weight="bold" />
            <span>Edit Data Profil</span>
          </button>
        ) : (
          <button 
            type="button" 
            onClick={() => setIsEditing(false)}
            className="btn btn-ghost"
          >
            Batal
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="farmer-alert-banner success">
          <CheckCircle size={18} weight="fill" color="#10b981" />
          <span>Profil berhasil diperbarui dan disinkronisasi dengan sistem!</span>
        </div>
      )}

      {/* Grid: Left Profile Card, Right Detailed Data */}
      <div className="farmer-profile-grid">
        
        {/* SISI KIRI: Card Ringkasan Kelompok Tani */}
        <div className="farmer-profile-summary-card">
          <div className="farmer-profile-avatar-wrap">
            <div className="farmer-avatar-img">
              <Plant size={44} weight="fill" color="#ffffff" />
            </div>
            <span className="farmer-verified-badge-icon" title="KYC Terverifikasi">
              <ShieldCheck size={20} weight="fill" color="#10b981" />
            </span>
          </div>

          <h2 className="farmer-profile-name">{formData.groupName}</h2>
          <span className="farmer-profile-sub">{formData.role}: {formData.name}</span>
          
          <div className="farmer-kyc-status-tag verified">
            <CheckCircle size={14} weight="fill" />
            <span>Terverifikasi KYC Resmi</span>
          </div>

          <div className="farmer-profile-stats-row">
            <div className="farmer-pstat-item">
              <span className="pstat-val">{formData.totalDeals}</span>
              <span className="pstat-lbl">Transaksi</span>
            </div>
            <div className="farmer-pstat-item">
              <span className="pstat-val">{formData.totalTonDelivered} Ton</span>
              <span className="pstat-lbl">Terjual</span>
            </div>
            <div className="farmer-pstat-item">
              <span className="pstat-val rating">
                <Star size={14} weight="fill" color="#f59e0b" /> {formData.rating}
              </span>
              <span className="pstat-lbl">Rating</span>
            </div>
          </div>

          <div className="farmer-profile-contact-list">
            <div className="pcontact-item">
              <MapPin size={16} />
              <span>{formData.location}</span>
            </div>
            <div className="pcontact-item">
              <EnvelopeSimple size={16} />
              <span>{formData.email}</span>
            </div>
            <div className="pcontact-item">
              <Phone size={16} />
              <span>{formData.phone}</span>
            </div>
          </div>
        </div>

        {/* SISI KANAN: Detail Informasi Lahan, Komoditas, & Rekening */}
        <div className="farmer-profile-details-card">
          <form onSubmit={handleSave}>
            <div className="farmer-card-section-title">
              <h3>Informasi Kelompok Tani & Lahan</h3>
            </div>

            <div className="farmer-form-row two-cols">
              <div className="farmer-form-group">
                <label className="farmer-form-label">Nama Kelompok Tani / Gapoktan</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  className="farmer-form-input" 
                />
              </div>

              <div className="farmer-form-group">
                <label className="farmer-form-label">Nama Penanggung Jawab / Ketua</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="farmer-form-input" 
                />
              </div>
            </div>

            <div className="farmer-form-row two-cols">
              <div className="farmer-form-group">
                <label className="farmer-form-label">Total Luas Lahan Terkelola</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.landArea}
                  onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                  className="farmer-form-input" 
                />
              </div>

              <div className="farmer-form-group">
                <label className="farmer-form-label">Domisili & Titik Gudang Utama</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="farmer-form-input" 
                />
              </div>
            </div>

            <div className="farmer-card-section-title" style={{ marginTop: '1.5rem' }}>
              <h3>Dokumen Legalitas KYC Terverifikasi</h3>
            </div>

            <div className="farmer-kyc-doc-box">
              <div className="kyc-doc-icon">
                <ShieldCheck size={28} weight="fill" color="#10b981" />
              </div>
              <div className="kyc-doc-info">
                <strong>{formData.kycDocument}</strong>
                <p>Dokumen telah ditinjau dan disetujui oleh tim verifikasi admin AgriConnect. Memiliki hak penuh menerbitkan Binding Agreement resmi.</p>
              </div>
            </div>

            <div className="farmer-card-section-title" style={{ marginTop: '1.5rem' }}>
              <h3>Rekening Penyaluran Tanda Jadi (Booking Fee)</h3>
            </div>

            <div className="farmer-form-row two-cols">
              <div className="farmer-form-group">
                <label className="farmer-form-label">Nama Bank</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.bankAccount.bank}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount, bank: e.target.value }
                  })}
                  className="farmer-form-input" 
                />
              </div>

              <div className="farmer-form-group">
                <label className="farmer-form-label">Nomor Rekening</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.bankAccount.number}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount, number: e.target.value }
                  })}
                  className="farmer-form-input" 
                />
              </div>
            </div>

            <div className="farmer-form-group">
              <label className="farmer-form-label">Nama Pemilik Rekening</label>
              <input 
                type="text" 
                disabled={!isEditing}
                value={formData.bankAccount.holder}
                onChange={(e) => setFormData({
                  ...formData,
                  bankAccount: { ...formData.bankAccount, holder: e.target.value }
                })}
                className="farmer-form-input" 
              />
            </div>

            {isEditing && (
              <div className="farmer-profile-actions-bottom">
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-pill)', padding: '0.65rem 1.75rem' }}
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>Simpan Pembaruan Profil</span>
                </button>
              </div>
            )}
          </form>
        </div>

      </div>

      {/* Compact Bottom Card: Kepatuhan Hukum & Rekening Poktan */}
      <div className="clone-compact-card">
        <div className="clone-compact-header">
          <div className="clone-compact-header-left">
            <div className="clone-compact-icon-badge emerald">
              <ShieldCheck size={18} weight="bold" />
            </div>
            <div>
              <h4 className="clone-compact-title">Status Legalitas Poktan & Kepatuhan Rekening Bank</h4>
              <p className="clone-compact-subtitle">Verifikasi identitas resmi kelompok tani untuk kepastian pencairan dana</p>
            </div>
          </div>
          <span className="clone-compact-tag">Terverifikasi Kementan</span>
        </div>

        <div className="clone-compact-grid">
          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">📜</span>
            <div>
              <div className="clone-compact-item-title">Registrasi Poktan Resmi</div>
              <p className="clone-compact-item-desc">
                Kelompok Tani Makmur Mandiri terdaftar di database Simluhtan Kementan RI No. REG-POKTAN/2024/0912.
              </p>
            </div>
          </div>

          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">🏦</span>
            <div>
              <div className="clone-compact-item-title">Validasi Rekening BRI Poktan</div>
              <p className="clone-compact-item-desc">
                Rekening pencairan telah diverifikasi kliring otomatis untuk penerimaan tanda jadi dan pelunasan.
              </p>
            </div>
          </div>

          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">🔐</span>
            <div>
              <div className="clone-compact-item-title">Enkripsi Data 256-Bit</div>
              <p className="clone-compact-item-desc">
                Seluruh berkas identitas KTP pengurus dan sertifikat kepemilikan lahan dilindungi standar SSL perbankan.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
