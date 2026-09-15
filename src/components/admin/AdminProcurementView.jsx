import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  MagnifyingGlass, 
  CheckCircle, 
  Clock, 
  Tag, 
  Buildings, 
  Plant, 
  Eye, 
  Handshake,
  Check,
  X,
  MapPin,
  CalendarBlank,
  CurrencyCircleDollar
} from '@phosphor-icons/react';

// Data Pengajuan Penawaran Pengadaan dari Pembeli kepada Petani
// (Pembeli menentukan: Komoditas yang dibutuhkan, Jumlah tonase, dan Target Harga Beli)
export const INITIAL_PROCUREMENT_REQUESTS = [
  {
    id: 'RFQ-BUY-2026-041',
    buyerName: 'CV Minahasa Cengkeh Abadi',
    buyerPic: 'Ir. Raditya Pratama',
    buyerType: 'Eksportir Rempah & Atsiri',
    commodityNeeded: 'Cengkeh Zanzibar Kering Sikotok',
    requiredVolumeTon: 50,
    targetPricePerKg: 124000,
    totalBudgetEstimated: 6200000000,
    deliveryDestination: 'Gudang Ekspor Rempah, Minahasa',
    deadline: '28 September 2026',
    status: 'Terbuka untuk Petani', // 'Terbuka untuk Petani' | 'Dalam Negosiasi' | 'Terkunci Kontrak' | 'Selesai'
    submissionDate: '14 Sep 2026, 14:20 WITA',
    specs: 'Kadar air maks 12%, bunga utuh, aroma eugenol tinggi, bebas kotoran.',
    farmerBidsCount: 3,
    topFarmerBid: 'Poktan Ranowangko Langowan (Menawarkan 30 Ton @ Rp 124.000/kg)'
  },
  {
    id: 'RFQ-BUY-2026-042',
    buyerName: 'PT Royal Coconut Minahasa',
    buyerPic: 'Bambang Kusuma, S.Pt.',
    buyerType: 'Industri Pengolahan Kelapa Terpadu',
    commodityNeeded: 'Kopra Putih Kering (KA 6%)',
    requiredVolumeTon: 100,
    targetPricePerKg: 13500,
    totalBudgetEstimated: 1350000000,
    deliveryDestination: 'Pabrik Pengolahan Kelapa Minahasa',
    deadline: '05 Oktober 2026',
    status: 'Terbuka untuk Petani',
    submissionDate: '15 Sep 2026, 08:45 WITA',
    specs: 'Oven kering, bebas jamur hitam, kadar air maksimal 6%.',
    farmerBidsCount: 5,
    topFarmerBid: 'Koperasi Kelapa Pesisir Kombi (Menawarkan 60 Ton @ Rp 13.500/kg)'
  },
  {
    id: 'RFQ-BUY-2026-043',
    buyerName: 'PT Celebes Feedmill Minahasa',
    buyerPic: 'Dewi Lestari, S.T.',
    buyerType: 'Industri Pakan Ternak',
    commodityNeeded: 'Jagung Pipil Kering Hibrida Kakas',
    requiredVolumeTon: 150,
    targetPricePerKg: 5300,
    totalBudgetEstimated: 795000000,
    deliveryDestination: 'Silo Sentral Tompaso Barat, Minahasa',
    deadline: '25 September 2026',
    status: 'Dalam Negosiasi',
    submissionDate: '12 Sep 2026, 11:30 WITA',
    specs: 'Kadar air standar SNI 14%, butir kuning cerah, bebas aflatoksin.',
    farmerBidsCount: 4,
    topFarmerBid: 'Poktan Tou Kakas Mandiri (Menawarkan 80 Ton @ Rp 5.250/kg)'
  },
  {
    id: 'RFQ-BUY-2026-044',
    buyerName: 'Distributor Pangan Beriman',
    buyerPic: 'H. Suryadi',
    buyerType: 'Distributor Grosir Sembako Minahasa',
    commodityNeeded: 'Beras Premium Superwin Tondano',
    requiredVolumeTon: 50,
    targetPricePerKg: 15000,
    totalBudgetEstimated: 750000000,
    deliveryDestination: 'Gudang Sentral Pasar Beriman, Tondano',
    deadline: '22 September 2026',
    status: 'Terbuka untuk Petani',
    submissionDate: '15 Sep 2026, 10:10 WITA',
    specs: 'Kondisi poles bersih, butir patah maks 5%, derajat sosoh 98% alami.',
    farmerBidsCount: 3,
    topFarmerBid: 'Poktan Danau Tondano (Menawarkan 40 Ton @ Rp 14.950/kg)'
  },
  {
    id: 'RFQ-BUY-2026-045',
    buyerName: 'CV Bumbu Segar Minahasa',
    buyerPic: 'Agus Riyanto',
    buyerType: 'Industri Olahan Bumbu & Sambal',
    commodityNeeded: 'Cabai Rawit Merah (Rica Minahasa)',
    requiredVolumeTon: 15,
    targetPricePerKg: 47000,
    totalBudgetEstimated: 705000000,
    deliveryDestination: 'Pabrik Pengolahan Bumbu Minahasa',
    deadline: '20 September 2026',
    status: 'Terkunci Kontrak',
    submissionDate: '10 Sep 2026, 09:00 WITA',
    specs: 'Petik tangkai segar, warna merah menyala, tingkat kepedasan tinggi.',
    farmerBidsCount: 5,
    topFarmerBid: 'Poktan Horti Sinisir Modoinding (Telah disetujui binding 15 Ton @ Rp 47.000/kg)'
  }
];

export default function AdminProcurementView() {
  const [procurements, setProcurements] = useState(INITIAL_PROCUREMENT_REQUESTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedItem, setSelectedItem] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form state for creating new buyer procurement request
  const [formBuyer, setFormBuyer] = useState('');
  const [formCommodity, setFormCommodity] = useState('');
  const [formVolume, setFormVolume] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  const filteredProcurements = procurements.filter(item => {
    const matchesSearch = 
      item.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.commodityNeeded.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'Semua' ? true : item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formBuyer || !formCommodity || !formVolume || !formPrice) return;

    const newItem = {
      id: `RFQ-BUY-2026-0${procurements.length + 46}`,
      buyerName: formBuyer,
      buyerPic: 'PIC Pengadaan',
      buyerType: 'Industri Pembeli',
      commodityNeeded: formCommodity,
      requiredVolumeTon: Number(formVolume),
      targetPricePerKg: Number(formPrice),
      totalBudgetEstimated: Number(formVolume) * 1000 * Number(formPrice),
      deliveryDestination: formDestination || 'Gudang Pembeli',
      deadline: formDeadline || '30 September 2026',
      status: 'Terbuka untuk Petani',
      submissionDate: 'Hari ini, Baru saja',
      specs: 'Spesifikasi standar mutu komoditas nasional SNI.',
      farmerBidsCount: 0,
      topFarmerBid: 'Belum ada penawaran masuk dari petani.'
    };

    setProcurements([newItem, ...procurements]);
    setCreateModalOpen(false);
    setFormBuyer('');
    setFormCommodity('');
    setFormVolume('');
    setFormPrice('');
    setFormDestination('');
    setFormDeadline('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="clone-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Kelola Pengadaan (Permintaan Pembeli ke Petani)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0.35rem 0 0 0' }}>
              Daftar pengajuan komoditas, kuota tonase, dan target harga yang dibutuhkan industri pembeli untuk dipenuhi kelompok tani.
            </p>
          </div>

          <button 
            type="button" 
            className="clone-btn-primary"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Permintaan Beli</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="clone-card" style={{ padding: '0.85rem 1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
            <MagnifyingGlass size={16} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Cari pembeli, komoditas, atau ID RFQ..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Semua', 'Terbuka untuk Petani', 'Dalam Negosiasi', 'Terkunci Kontrak'].map(status => (
              <button
                key={status}
                type="button"
                className={`clone-tag-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
                style={{
                  background: statusFilter === status ? '#5452f6' : 'transparent',
                  color: statusFilter === status ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${statusFilter === status ? '#5452f6' : 'var(--border-subtle)'}`,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Procurement Cards List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
        {filteredProcurements.map((item) => {
          const statusColors = {
            'Terbuka untuk Petani': { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
            'Dalam Negosiasi': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
            'Terkunci Kontrak': { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
            'Selesai': { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
          };
          const badgeStyle = statusColors[item.status] || statusColors['Terbuka untuk Petani'];

          return (
            <div 
              key={item.id}
              className="clone-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setSelectedItem(item)}
            >
              <div>
                {/* Card Top: ID and Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {item.id}
                  </span>
                  <span 
                    style={{
                      fontSize: '0.70rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: badgeStyle.bg,
                      color: badgeStyle.color,
                      border: `1px solid ${badgeStyle.border}`
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Commodity Needed Title */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem 0' }}>
                  {item.commodityNeeded}
                </h3>

                {/* Buyer Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.85rem' }}>
                  <Buildings size={14} weight="bold" />
                  <span>{item.buyerName}</span>
                </div>

                {/* Metric Badges: Volume and Target Price */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  background: 'var(--bg-surface-subtle, #f8fafc)',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  marginBottom: '0.85rem',
                  border: '1px solid var(--border-subtle, #f1f5f9)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Volume Dibutuhkan</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {item.requiredVolumeTon} <span style={{ fontSize: '0.75rem' }}>Ton</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Target Harga Beli</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                      Rp {item.targetPricePerKg.toLocaleString('id-ID')} <span style={{ fontSize: '0.75rem' }}>/kg</span>
                    </div>
                  </div>
                </div>

                {/* Specs / Destination */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={13} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.deliveryDestination}</span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CalendarBlank size={13} />
                  <span>Batas Waktu: <strong>{item.deadline}</strong></span>
                </div>
              </div>

              {/* Bottom Action / Farmer Response */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#5452f6', fontWeight: 700 }}>
                  {item.farmerBidsCount} Penawaran Petani Masuk
                </div>
                <button 
                  type="button" 
                  className="clone-tag-btn"
                  onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                >
                  <Eye size={13} weight="bold" />
                  <span>Detail & Poktan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detail Pengadaan */}
      {selectedItem && (
        <div className="clone-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="clone-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="clone-modal-header">
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{selectedItem.id}</span>
                <h3 className="clone-modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {selectedItem.commodityNeeded}
                </h3>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '65vh', overflowY: 'auto' }}>
              {/* Buyer details */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>INFORMASI PEMBELI</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedItem.buyerName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PIC: {selectedItem.buyerPic} ({selectedItem.buyerType})</div>
              </div>

              {/* Volume & Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Volume Diminta</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedItem.requiredVolumeTon} Ton</div>
                </div>
                <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#047857' }}>Target Harga</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#047857' }}>Rp {selectedItem.targetPricePerKg.toLocaleString('id-ID')}/kg</div>
                </div>
                <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#1d4ed8' }}>Estimasi Anggaran</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>
                    Rp {(selectedItem.totalBudgetEstimated / 1000000).toFixed(1)} Jt
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Spesifikasi Teknis Mutu:</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  {selectedItem.specs}
                </p>
              </div>

              {/* Best Farmer Proposal */}
              <div style={{ border: '1px solid #dbeafe', background: '#eff6ff', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Plant size={14} weight="bold" />
                  <span>Proposal Penawaran Petani Teratas:</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {selectedItem.topFarmerBid}
                </div>
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="clone-btn-secondary" onClick={() => setSelectedItem(null)}>
                Tutup
              </button>
              <button 
                type="button" 
                className="clone-btn-primary"
                onClick={() => {
                  alert(`Pengadaan ${selectedItem.commodityNeeded} telah diverifikasi. Petani siap mencocokkan kontrak.`);
                  setSelectedItem(null);
                }}
              >
                <Check size={14} weight="bold" />
                <span>Validasi Pengadaan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Permintaan Pengadaan Baru */}
      {createModalOpen && (
        <div className="clone-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="clone-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="clone-modal-header">
              <h3 className="clone-modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                Tambah Permintaan Pengadaan Pembeli (RFQ)
              </h3>
              <button type="button" className="clone-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Nama Perusahaan Pembeli:
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: PT Indofood CBP Sukses Makmur Tbk"
                  value={formBuyer}
                  onChange={(e) => setFormBuyer(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Komoditas yang Dibutuhkan:
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Cengkeh Zanzibar Langowan / Kopra Kombi"
                  value={formCommodity}
                  onChange={(e) => setFormCommodity(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Jumlah / Tonase (Ton):
                  </label>
                  <input 
                    type="number" 
                    required
                    placeholder="Contoh: 100"
                    value={formVolume}
                    onChange={(e) => setFormVolume(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Target Harga Beli (/Kg):
                  </label>
                  <input 
                    type="number" 
                    required
                    placeholder="Contoh: 12500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Lokasi Gudang Tujuan:
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: Gudang Logistik Cikupa, Tangerang"
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Batas Waktu Pengadaan:
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: 30 September 2026"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="clone-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="clone-btn-primary">
                  Terbitkan Pengadaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
