import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  MagnifyingGlass, 
  Funnel, 
  PencilSimple, 
  Trash, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Clock, 
  X,
  Sparkle
} from '@phosphor-icons/react';

export default function FarmerProducts({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Biji-Bijian & Palawija',
    stock: 20,
    unit: 'Ton',
    pricePerKg: 6000,
    minOrderTon: 5,
    qualityGrade: 'Grade 1 Standar Pabrik',
    harvestType: 'Siap Diambil di Gudang',
    harvestDate: 'Panen September 2026',
    location: 'Gudang Walantakan, Langowan Timur, Minahasa',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
    description: ''
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Biji-Bijian & Palawija',
      stock: 20,
      unit: 'Ton',
      pricePerKg: 6000,
      minOrderTon: 5,
      qualityGrade: 'Grade Super Industri (KA 14%)',
      harvestType: 'Siap Diambil di Gudang',
      harvestDate: 'Panen September 2026',
      location: 'Gudang Walantakan, Langowan Timur, Minahasa',
      status: 'Tersedia',
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80',
      description: 'Hasil panen pilihan petani mitra dengan penanganan pasca panen terstandarisasi.'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({ ...prod });
    setModalOpen(true);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...formData });
    } else {
      const newProduct = {
        ...formData,
        id: `PRD-00${products.length + 1}`
      };
      onAddProduct(newProduct);
    }
    setModalOpen(false);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' ? true : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="farmer-products-view">
      
      {/* Top Header & Search / Filter Controls */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Kelola Listing Produk Panen</h1>
          <p className="farmer-page-sub">
            Atur ketersediaan stok hasil panen, harga per kilogram, dan spesifikasi mutu untuk pembeli skala besar.
          </p>
        </div>

        <button 
          type="button" 
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ borderRadius: 'var(--radius-pill)', padding: '0.65rem 1.4rem' }}
        >
          <Plus size={16} weight="bold" />
          <span>Tambah Produk Panen</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="farmer-filter-bar">
        <div className="farmer-search-input-wrap">
          <MagnifyingGlass size={17} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Cari komoditas, kategori, atau lokasi gudang..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="farmer-search-input"
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => setSearchTerm('')} 
              className="farmer-clear-search-btn"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="farmer-filter-tabs">
          {['Semua', 'Tersedia', 'Pre-Order', 'Habis'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`farmer-filter-tab ${statusFilter === tab ? 'active' : ''}`}
            >
              <span>{tab}</span>
              <span className="farmer-filter-count">
                {tab === 'Semua' ? products.length : products.filter(p => p.status === tab).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="farmer-products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="farmer-product-card">
            
            {/* Image & Status Badge */}
            <div className="farmer-product-img-wrap">
              <img src={product.image} alt={product.name} className="farmer-product-img" />
              <span className={`farmer-prod-status-badge ${product.status === 'Tersedia' ? 'emerald' : product.status === 'Pre-Order' ? 'blue' : 'gray'}`}>
                {product.status === 'Tersedia' && <CheckCircle size={13} weight="fill" />}
                {product.status === 'Pre-Order' && <Clock size={13} weight="bold" />}
                <span>{product.status}</span>
              </span>
              <span className="farmer-prod-category-pill">{product.category}</span>
            </div>

            {/* Content Body */}
            <div className="farmer-product-body">
              <h2 className="farmer-product-name">{product.name}</h2>
              <p className="farmer-product-desc">{product.description}</p>

              {/* Quality Grade Tag */}
              <div className="farmer-product-grade">
                <Sparkle size={13} weight="fill" color="var(--accent-primary)" />
                <span>{product.qualityGrade}</span>
              </div>

              {/* Metric Rows */}
              <div className="farmer-product-metrics">
                <div className="farmer-metric-item">
                  <span className="farmer-metric-lbl">Stok Tersedia:</span>
                  <span className="farmer-metric-val">{product.stock} {product.unit}</span>
                </div>
                <div className="farmer-metric-item">
                  <span className="farmer-metric-lbl">Harga Penawaran:</span>
                  <span className="farmer-metric-val price">Rp {product.pricePerKg.toLocaleString('id-ID')}/kg</span>
                </div>
                <div className="farmer-metric-item">
                  <span className="farmer-metric-lbl">Min. Order:</span>
                  <span className="farmer-metric-val">{product.minOrderTon} Ton</span>
                </div>
                <div className="farmer-metric-item">
                  <span className="farmer-metric-lbl">Lokasi Gudang:</span>
                  <span className="farmer-metric-val location">
                    <MapPin size={12} /> {product.location}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="farmer-product-card-footer">
                <button 
                  type="button" 
                  onClick={() => handleOpenEdit(product)}
                  className="btn-card-action edit"
                  title="Edit data listing"
                >
                  <PencilSimple size={15} weight="bold" />
                  <span>Edit Produk</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    if (window.confirm(`Yakin ingin menghapus listing "${product.name}"?`)) {
                      onDeleteProduct(product.id);
                    }
                  }}
                  className="btn-card-action delete"
                  title="Hapus listing"
                >
                  <Trash size={15} weight="bold" />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="farmer-empty-state">
          <Package size={48} weight="duotone" color="var(--text-muted)" />
          <h3>Tidak ada produk yang cocok</h3>
          <p>Coba sesuaikan kata kunci pencarian atau ubah filter status.</p>
        </div>
      )}

      {/* MODAL: Tambah / Edit Listing Produk */}
      {modalOpen && (
        <div className="farmer-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="farmer-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="farmer-modal-header">
              <div>
                <h2 className="farmer-modal-title">
                  {editingProduct ? 'Edit Listing Hasil Panen' : 'Tambah Listing Panen Baru'}
                </h2>
                <p className="farmer-modal-sub">
                  Lengkapi spesifikasi komoditas agar pembeli dapat mengajukan penawaran binding.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)} 
                className="farmer-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="farmer-modal-form">
              <div className="farmer-form-row two-cols">
                <div className="farmer-form-group">
                  <label className="farmer-form-label">Nama Komoditas / Varietas</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Jagung Pipil Kering Hibrida Super"
                    className="farmer-form-input"
                  />
                </div>

                <div className="farmer-form-group">
                  <label className="farmer-form-label">Kategori Komoditas</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="farmer-form-select"
                  >
                    <option value="Biji-Bijian & Palawija">Biji-Bijian & Palawija</option>
                    <option value="Padi & Beras">Padi & Beras</option>
                    <option value="Hortikultura & Sayur">Hortikultura & Sayur</option>
                    <option value="Perkebunan">Perkebunan</option>
                    <option value="Umbi-Umbian">Umbi-Umbian</option>
                  </select>
                </div>
              </div>

              <div className="farmer-form-row three-cols">
                <div className="farmer-form-group">
                  <label className="farmer-form-label">Stok Tersedia</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="farmer-form-input"
                  />
                </div>

                <div className="farmer-form-group">
                  <label className="farmer-form-label">Satuan</label>
                  <select 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="farmer-form-select"
                  >
                    <option value="Ton">Ton</option>
                    <option value="Kg">Kg</option>
                    <option value="Karung 50kg">Karung 50kg</option>
                  </select>
                </div>

                <div className="farmer-form-group">
                  <label className="farmer-form-label">Harga Satuan (Rp / kg)</label>
                  <input 
                    type="number" 
                    required 
                    min="100"
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({ ...formData, pricePerKg: Number(e.target.value) })}
                    className="farmer-form-input"
                  />
                </div>
              </div>

              <div className="farmer-form-row two-cols">
                <div className="farmer-form-group">
                  <label className="farmer-form-label">Standar Mutu / Kualitas</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.qualityGrade}
                    onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                    placeholder="Misal: Kadar Air < 14%, Butir Patah < 5%"
                    className="farmer-form-input"
                  />
                </div>

                <div className="farmer-form-group">
                  <label className="farmer-form-label">Status Ketersediaan</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="farmer-form-select"
                  >
                    <option value="Tersedia">Tersedia (Siap Diambil di Gudang)</option>
                    <option value="Pre-Order">Pre-Order (Menjelang Panen)</option>
                    <option value="Habis">Habis</option>
                  </select>
                </div>
              </div>

              <div className="farmer-form-row two-cols">
                <div className="farmer-form-group">
                  <label className="farmer-form-label">Lokasi Gudang / Titik Muat</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Contoh: Gudang Walantakan Langowan / Sentra Kakas"
                    className="farmer-form-input"
                  />
                </div>

                <div className="farmer-form-group">
                  <label className="farmer-form-label">Estimasi Waktu Panen / Ketersediaan</label>
                  <input 
                    type="text" 
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                    placeholder="Contoh: Siap muat hari ini / 20 Sep 2026"
                    className="farmer-form-input"
                  />
                </div>
              </div>

              <div className="farmer-form-group">
                <label className="farmer-form-label">Deskripsi Lengkap Produk</label>
                <textarea 
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan kondisi penyimpanan, pengeringan, atau fasilitas timbangan di gudang..."
                  className="farmer-form-textarea"
                />
              </div>

              <div className="farmer-modal-actions">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ borderRadius: 'var(--radius-pill)', padding: '0.65rem 1.6rem' }}
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Terbitkan Listing Panen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
