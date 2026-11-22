import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Users,
  MapPin,
  CalendarBlank,
  CurrencyCircleDollar,
  PencilSimple,
  Eye,
  X,
  ShieldCheck,
  WarningCircle,
  Info,
  Package,
  Sparkle,
  Globe,
  SlidersHorizontal,
  ArrowClockwise,
  UploadSimple,
  Trash,
  Plant,
  CookingPot,
  Carrot,
  CoffeeBean
} from '@phosphor-icons/react';
import { DEFAULT_AVATAR } from '../../lib/constants';

// Helper to normalize product status into 3 canonical values
export const normalizeProductStatus = (status) => {
  if (!status) return 'Aktif';
  const s = String(status).toLowerCase();
  if (s.includes('menunggu') || s.includes('persetujuan') || s.includes('pre-order') || s.includes('preorder') || s.includes('pending')) {
    return 'Menunggu Persetujuan';
  }
  if (s.includes('tidak') || s.includes('nonaktif') || s.includes('habis') || s.includes('inactive')) {
    return 'Tidak Aktif';
  }
  return 'Aktif';
};

export default function FarmerProducts({
  products = [],
  farmerProfile = null,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  initialModalOpen = false,
  onModalClose,
  isLoading = false
}) {
  const [productList, setProductList] = useState(products || []);

  // Search, Filter & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua'); // 'Semua' | 'Aktif' | 'Tidak Aktif' | 'Menunggu Persetujuan'
  const [sortBy, setSortBy] = useState('Terbaru'); // 'Terbaru' | 'Terlama' | 'Stok Tertinggi' | 'Harga Tertinggi'

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

  // Form states for Create & Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formUnit, setFormUnit] = useState('Ton');
  const [formPricePerKg, setFormPricePerKg] = useState('');
  const [formMinOrderTon, setFormMinOrderTon] = useState('');
  const [formQualityGrade, setFormQualityGrade] = useState('');
  const [formHarvestDate, setFormHarvestDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState('Menunggu Persetujuan');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Refs for image file inputs
  const createFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Handle image upload from computer
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Mohon pilih file gambar yang valid (JPG, PNG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file gambar maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormImage(event.target?.result || '');
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync parent products directly from authoritative source of truth
  useEffect(() => {
    if (Array.isArray(products)) {
      setProductList(products);
    }
  }, [products]);

  // Trigger modal when initialModalOpen is true
  useEffect(() => {
    if (initialModalOpen) {
      handleOpenCreateModal();
      if (onModalClose) onModalClose();
    }
  }, [initialModalOpen]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = productList.filter((item) => {
      const norm = normalizeProductStatus(item.status);
      // Status filter
      if (statusFilter !== 'Semua' && norm !== statusFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchLoc = (item.location || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        const matchId = (item.id || '').toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchCat && !matchId) return false;
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'Stok Tertinggi') {
        return (Number(b.stock) || 0) - (Number(a.stock) || 0);
      }
      if (sortBy === 'Harga Tertinggi') {
        return (Number(b.pricePerKg) || 0) - (Number(a.pricePerKg) || 0);
      }
      if (sortBy === 'Terlama') {
        return (a.id || '').localeCompare(b.id || '');
      }
      // Default: 'Terbaru'
      return (b.id || '').localeCompare(a.id || '');
    });

    return list;
  }, [productList, searchTerm, statusFilter, sortBy]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormName('');
    setFormCategory('');
    setFormStock('');
    setFormUnit('Ton');
    setFormPricePerKg('');
    setFormMinOrderTon('');
    setFormQualityGrade('');
    setFormHarvestDate('');
    setFormLocation('');
    setFormStatus('Menunggu Persetujuan');
    setFormImage('');
    setFormDescription('');
    setCreateModalOpen(true);
  };

  // Submit New Product
  const handleCreateProductSubmit = (e) => {
    e.preventDefault();
    let currentFarmerName = farmerProfile?.name;
    let currentFarmerId = farmerProfile?.id || null;
    let currentFarmerGroup = farmerProfile?.groupName || 'Kelompok Tani';

    try {
      const roleStored = localStorage.getItem('agriconnect_auth_user_petani');
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      const stored = roleStored || genericStored;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!currentFarmerId && parsed?.id) currentFarmerId = parsed.id;
        if (!currentFarmerName && (parsed?.fullName || parsed?.full_name || parsed?.name)) {
          currentFarmerName = parsed.fullName || parsed.full_name || parsed.name;
        }
      }
    } catch (err) {}

    if (!currentFarmerName) currentFarmerName = 'Petani';

    const newProduct = {
      id: `PRD-${Date.now().toString().slice(-4)}`,
      name: formName || 'Komoditas Hasil Panen',
      commodityName: formName || 'Komoditas Hasil Panen',
      category: formCategory || 'Lainnya',
      stock: Number(formStock) || 0,
      stockTon: Number(formStock) || 0,
      unit: formUnit || 'Ton',
      pricePerKg: Number(formPricePerKg) || 0,
      minOrderTon: Number(formMinOrderTon) || 0,
      qualityGrade: formQualityGrade || '',
      harvestType: formHarvestDate || '',
      harvestDate: formHarvestDate || '',
      location: formLocation || '',
      status: 'Menunggu Persetujuan',
      farmerId: currentFarmerId,
      farmerLeader: currentFarmerName,
      farmerName: currentFarmerName,
      farmerGroup: currentFarmerGroup,
      rating: 5.0,
      reviewsCount: 1,
      image: formImage || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80',
      description: formDescription || 'Hasil panen segar dan berkualitas dari kelompok tani binaan.'
    };

    setProductList(prev => [newProduct, ...prev]);
    if (onAddProduct) {
      onAddProduct(newProduct);
    }
    setCreateModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product) => {
    setSelectedProductForEdit(product);
    setFormName(product.name);
    setFormCategory(product.category || 'Biji-Bijian & Palawija');
    setFormStock(product.stock);
    setFormUnit(product.unit || 'Ton');
    setFormPricePerKg(product.pricePerKg);
    setFormMinOrderTon(product.minOrderTon || 1);
    setFormQualityGrade(product.qualityGrade || '');
    setFormHarvestDate(product.harvestDate || product.harvestType || 'Siap Diambil di Gudang');
    setFormLocation(product.location || 'Minahasa');
    setFormStatus(normalizeProductStatus(product.status));
    setFormImage(product.image || '');
    setFormDescription(product.description || '');
    setEditModalOpen(true);
  };

  // Submit Edit Product
  const handleEditProductSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductForEdit) return;

    const updated = {
      ...selectedProductForEdit,
      name: formName,
      category: formCategory,
      stock: Number(formStock) || 1,
      unit: formUnit || 'Ton',
      pricePerKg: Number(formPricePerKg) || 1000,
      minOrderTon: Number(formMinOrderTon) || 1,
      qualityGrade: formQualityGrade,
      harvestDate: formHarvestDate,
      location: formLocation,
      status: formStatus,
      image: formImage,
      description: formDescription
    };

    setProductList(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
    setEditModalOpen(false);
    setSelectedProductForEdit(null);
  };

  // Delete Product
  const handleDeleteProduct = (productId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus komoditas ini dari daftar listing?')) {
      setProductList(prev => prev.filter(p => p.id !== productId));
      if (onDeleteProduct) {
        onDeleteProduct(productId);
      }
    }
  };

  // Open Detail Modal
  const handleOpenDetailModal = (product) => {
    setSelectedProductForDetail(product);
    setDetailModalOpen(true);
  };

  return (
    <div className="farmer-products-view" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* ================= 1. HEADER ================= */}
      <div className="farmer-section-header" style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.65rem' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="farmer-page-title" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)', letterSpacing: '-0.02em', margin: 0 }}>
            Komoditas Saya
          </h1>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="clone-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.55rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(84, 82, 246, 0.25)'
            }}
            title="Tambah produk komoditas panen baru"
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Komoditas</span>
          </button>
        </div>

        {/* Kotak Card Subtitle (Bottom Card di bawah judul) */}
        <div style={{
          width: '100%',
          maxWidth: '960px',
          background: 'var(--bg-surface-card, #ffffff)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: '12px',
          padding: '0.85rem 1.15rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: 'rgba(84, 82, 246, 0.08)',
            color: '#5452f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <Info size={16} weight="bold" />
          </div>
          <p className="farmer-page-sub" style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary, #64748b)', lineHeight: 1.6, flex: 1 }}>
            Kelola seluruh komoditas dan hasil panen kelompok tani Anda. Pantau ketersediaan stok tonase, perbarui harga jual per kg, tinjau status verifikasi kurasi, dan publikasikan komoditas siap panen secara langsung ke jaringan pembeli grosir.
          </p>
        </div>
      </div>

      {/* ================= 2. SEARCH DAN FILTER ================= */}
      <div className="proposal-filter-bar">
        
        {/* Search Bar */}
        <div className="proposal-search-wrap">
          <MagnifyingGlass size={18} className="proposal-search-icon" />
          <input
            type="text"
            className="proposal-search-input"
            placeholder="Cari nama komoditas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Status:
          </span>
          <select
            className="proposal-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Urutkan:
          </span>
          <select
            className="proposal-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Terbaru">Terbaru</option>
            <option value="Terlama">Terlama</option>
            <option value="Stok Tertinggi">Stok Tertinggi</option>
            <option value="Harga Tertinggi">Harga Tertinggi</option>
          </select>
        </div>

      </div>

      {/* ================= 4. PROPOSAL CARDS GRID ================= */}
      {isLoading ? (
        <div className="proposal-cards-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="agri-skeleton-card" style={{ height: '320px', borderRadius: '14px' }} />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="proposal-cards-grid">
          {filteredProducts.map((product) => {
            const normStatus = normalizeProductStatus(product.status);
            return (
              <div key={product.id} className="proposal-card">
                
                {/* Foto Komoditas */}
                <div 
                  className="proposal-card-media"
                  onClick={() => handleOpenEditModal(product)}
                  style={{ cursor: 'pointer' }}
                  title={`Klik untuk edit ${product.name}`}
                >
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="proposal-card-img" 
                  />
                </div>

                {/* Card Body */}
                <div className="proposal-card-body">
                  
                  {/* Status Badge: Aktif | Menunggu Persetujuan | Tidak Aktif */}
                  <div className="proposal-status-row">
                    {normStatus === 'Aktif' && (
                      <span className="proposal-status-badge active" title="Komoditas Aktif">
                        <CheckCircle size={11} weight="fill" />
                        <span>Aktif</span>
                      </span>
                    )}
                    {normStatus === 'Menunggu Persetujuan' && (
                      <span className="proposal-status-badge pending" title="Menunggu Persetujuan Admin">
                        <Clock size={11} weight="fill" />
                        <span>Menunggu Persetujuan</span>
                      </span>
                    )}
                    {normStatus === 'Tidak Aktif' && (
                      <span className="proposal-status-badge inactive" title="Komoditas Tidak Aktif">
                        <XCircle size={11} weight="fill" />
                        <span>Tidak Aktif</span>
                      </span>
                    )}
                  </div>

                  {/* 1. Nama Komoditas (Judul Utama) */}
                  <h3 
                    className="proposal-card-title" 
                    title={product.name}
                    onClick={() => handleOpenEditModal(product)}
                    style={{ cursor: 'pointer' }}
                  >
                    {product.name}
                  </h3>

                  {/* 2. Metrics Box: Stok & Harga Grosir & Min Order */}
                  <div className="proposal-metrics-box">
                    <div className="proposal-metric-row main">
                      <div className="proposal-metric-item">
                        <span className="proposal-metric-label">STOK TERSEDIA</span>
                        <span className="proposal-metric-val highlight">
                          {product.stock} {product.unit || 'Ton'}
                        </span>
                      </div>
                      <div className="proposal-metric-item">
                        <span className="proposal-metric-label">HARGA GROSIR</span>
                        <span className="proposal-metric-val price">
                          Rp{product.pricePerKg.toLocaleString('id-ID')} / kg
                        </span>
                      </div>
                    </div>
                    <div className="proposal-budget-row">
                      <span className="proposal-budget-label">Min. Order:</span>
                      <span className="proposal-budget-val">
                        {product.minOrderTon || 1} Ton
                      </span>
                    </div>
                  </div>

                  {/* 3. Kategori & Lokasi (Bersih & Minimalis) */}
                  <div className="proposal-info-row">
                    <div className="proposal-info-item">
                      <Package size={11} color="var(--accent-primary, #5452f6)" weight="bold" />
                      <span>{product.category}</span>
                    </div>
                    <span className="proposal-dot-divider">•</span>
                    <div className="proposal-info-item">
                      <MapPin size={11} color="#64748b" weight="bold" />
                      <span>{product.location?.split(',')[0] || product.location}</span>
                    </div>
                  </div>

                  {/* 4. Tanggal Panen */}
                  <div className="proposal-date-row">
                    <div className="proposal-date-item" title={`Panen: ${product.harvestDate || product.harvestType || 'Siap Diambil'}`}>
                      <CalendarBlank size={11} color="#64748b" />
                      <span>{product.harvestDate || product.harvestType || 'Siap Diambil'}</span>
                    </div>
                  </div>

                  {/* 5. ACTION BUTTONS: Hanya Edit dan Hapus */}
                  <div className="proposal-card-actions">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(product)}
                      className="proposal-btn-edit"
                      title="Edit data komoditas ini"
                    >
                      <PencilSimple size={12} weight="bold" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="proposal-btn-delete"
                      title="Hapus komoditas dari daftar"
                    >
                      <Trash size={12} weight="bold" />
                      <span>Hapus</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* ================= EMPTY STATE ================= */
        <div className="farmer-empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-canvas)', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(84, 82, 246, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Package size={32} color="#5452f6" weight="duotone" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
            Belum Ada Komoditas
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Publikasikan hasil panen Anda agar dapat dilihat dan dibeli oleh pembeli skala besar.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="clone-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.35rem', borderRadius: '10px' }}
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Komoditas</span>
          </button>
        </div>
      )}

      {/* ================= MODAL: TAMBAH KOMODITAS ================= */}
      {createModalOpen && (
        <div className="clone-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '580px', borderRadius: '16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="clone-modal-header" style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5452f6' }}>
                  <Plus size={20} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Tambah Komoditas
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Lengkapi data hasil panen untuk dipublikasikan ke pembeli
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit}>
              <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Upload Foto Komoditas */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Foto Komoditas
                  </label>
                  <input
                    type="file"
                    ref={createFileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />

                  {formImage ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-canvas-subtle)'
                    }}>
                      <img
                        src={formImage}
                        alt="Preview Komoditas"
                        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Foto Berhasil Dipilih
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Format gambar aktif untuk komoditas ini
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => createFileInputRef.current?.click()}
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-canvas)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          style={{
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.76rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Hapus Foto"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => createFileInputRef.current?.click()}
                      style={{
                        border: '1.5px dashed var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '1rem',
                        textAlign: 'center',
                        background: 'var(--bg-canvas-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary, #5452f6)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(84, 82, 246, 0.08)',
                        color: '#5452f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UploadSimple size={20} weight="bold" />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Unggah Foto Komoditas
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Klik untuk memilih file gambar (JPG, PNG maks. 5MB)
                      </div>
                    </div>
                  )}
                </div>

                {/* Komoditas & Kategori */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Nama Komoditas *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Cengkeh Zanzibar Kering"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Kategori *
                    </label>
                    <select
                      required
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    >
                      <option value="" disabled>-- Pilih Kategori --</option>
                      <option value="Biji-Bijian & Palawija">Biji-Bijian & Palawija</option>
                      <option value="Padi & Beras">Padi & Beras</option>
                      <option value="Hortikultura & Sayur">Hortikultura & Sayur</option>
                      <option value="Perkebunan">Perkebunan</option>
                    </select>
                  </div>
                </div>

                {/* Jumlah Stok & Harga per kg */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Jumlah Stok (Ton) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Contoh: 20"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Harga per kg (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="500"
                      placeholder="Contoh: 125000"
                      value={formPricePerKg}
                      onChange={(e) => setFormPricePerKg(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                {/* Min. Order (Ton) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Min. Order (Ton) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    placeholder="Contoh: 2"
                    value={formMinOrderTon}
                    onChange={(e) => setFormMinOrderTon(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                  />
                </div>

                {/* Lokasi Gudang & Masa Panen */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Lokasi Gudang / Kebun *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Langowan Timur, Minahasa"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Ketersediaan / Panen *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Siap Diambil / Panen Okt 2026"
                      value={formHarvestDate}
                      onChange={(e) => setFormHarvestDate(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                {/* Spesifikasi Mutu & Catatan */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Spesifikasi Mutu & Catatan <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Panen segar, kadar air terstandarisasi, bersih..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.84rem', resize: 'vertical' }}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="clone-modal-footer" style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="clone-btn-secondary"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clone-btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={15} weight="bold" />
                  <span>Simpan Komoditas</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT KOMODITAS ================= */}
      {editModalOpen && selectedProductForEdit && (
        <div className="clone-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '520px', borderRadius: '16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="clone-modal-header" style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <PencilSimple size={18} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Edit Komoditas
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Perbarui data komoditas ({selectedProductForEdit.id})
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit}>
              <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.15rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                
                {/* Upload / Ganti Foto Komoditas */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Foto Komoditas
                  </label>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />

                  {formImage ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-canvas-subtle)'
                    }}>
                      <img
                        src={formImage}
                        alt="Preview Komoditas"
                        style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Foto Komoditas
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Klik ganti untuk memperbarui gambar
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          style={{
                            padding: '0.35rem 0.7rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-canvas)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          style={{
                            padding: '0.35rem 0.55rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Hapus Foto"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      style={{
                        border: '1.5px dashed var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '0.9rem',
                        textAlign: 'center',
                        background: 'var(--bg-canvas-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary, #5452f6)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    >
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(84, 82, 246, 0.08)',
                        color: '#5452f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UploadSimple size={18} weight="bold" />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Unggah Foto Komoditas
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Klik untuk memilih gambar baru (JPG, PNG maks. 5MB)
                      </div>
                    </div>
                  )}
                </div>

                {/* Komoditas & Kategori */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Nama Komoditas *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Kategori
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    >
                      <option value="Biji-Bijian & Palawija">Biji-Bijian & Palawija</option>
                      <option value="Padi & Beras">Padi & Beras</option>
                      <option value="Hortikultura & Sayur">Hortikultura & Sayur</option>
                      <option value="Perkebunan">Perkebunan</option>
                    </select>
                  </div>
                </div>

                {/* Jumlah Stok & Harga per kg */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Jumlah Stok (Ton) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Harga per kg (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="500"
                      value={formPricePerKg}
                      onChange={(e) => setFormPricePerKg(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                {/* Min. Order (Ton) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Min. Order (Ton) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    placeholder="Contoh: 2"
                    value={formMinOrderTon}
                    onChange={(e) => setFormMinOrderTon(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                  />
                </div>

                {/* Lokasi Gudang & Masa Panen */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Lokasi Gudang / Kebun *
                    </label>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Ketersediaan / Panen *
                    </label>
                    <input
                      type="text"
                      required
                      value={formHarvestDate}
                      onChange={(e) => setFormHarvestDate(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>

                {/* Status Komoditas Info */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Status Komoditas (Ditentukan Sistem & Moderasi Admin)
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-canvas-subtle)'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: formStatus === 'Aktif' ? '#059669' : formStatus === 'Menunggu Persetujuan' ? '#d97706' : '#dc2626'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: formStatus === 'Aktif' ? '#10b981' : formStatus === 'Menunggu Persetujuan' ? '#f59e0b' : '#ef4444'
                      }} />
                      {formStatus}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({formStatus === 'Menunggu Persetujuan' ? 'Sedang ditinjau Admin' : formStatus === 'Aktif' ? 'Terbit di Katalog' : 'Tidak dipublikasikan'})
                    </span>
                  </div>
                </div>

                {/* Spesifikasi Mutu & Catatan */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Spesifikasi Mutu & Catatan <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas-subtle)', color: 'var(--text-primary)', fontSize: '0.84rem', resize: 'vertical' }}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="clone-modal-footer" style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="clone-btn-secondary"
                  style={{ padding: '0.5rem 0.95rem', fontSize: '0.84rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clone-btn-primary"
                  style={{ padding: '0.5rem 1.2rem', fontSize: '0.84rem' }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: DETAIL KOMODITAS ================= */}
      {detailModalOpen && selectedProductForDetail && (
        <div className="clone-modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '600px', borderRadius: '16px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="clone-modal-header" style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5452f6' }}>
                  <Package size={20} weight="bold" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Rincian Komoditas
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {selectedProductForDetail.id} • Kategori: {selectedProductForDetail.category}
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setDetailModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="clone-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
              
              {/* Product Visual & Status */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '0.9rem', background: 'var(--bg-canvas-subtle)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <img
                  src={selectedProductForDetail.image}
                  alt={selectedProductForDetail.name}
                  style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {normalizeProductStatus(selectedProductForDetail.status) === 'Aktif' && (
                      <span className="proposal-status-badge active">
                        <CheckCircle size={12} weight="fill" />
                        <span>Aktif</span>
                      </span>
                    )}
                    {normalizeProductStatus(selectedProductForDetail.status) === 'Menunggu Persetujuan' && (
                      <span className="proposal-status-badge pending">
                        <Clock size={12} weight="fill" />
                        <span>Menunggu Persetujuan</span>
                      </span>
                    )}
                    {normalizeProductStatus(selectedProductForDetail.status) === 'Tidak Aktif' && (
                      <span className="proposal-status-badge inactive">
                        <XCircle size={12} weight="fill" />
                        <span>Tidak Aktif</span>
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedProductForDetail.name}
                  </h2>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.9rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Stok Tersedia</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    {selectedProductForDetail.stock} {selectedProductForDetail.unit || 'Ton'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    (Min. {selectedProductForDetail.minOrderTon || 1} Ton)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Harga Jual / kg</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-primary, #5452f6)', marginTop: '2px' }}>
                    Rp {selectedProductForDetail.pricePerKg.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Harga Grosir</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Nilai Stok</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    Rp {(selectedProductForDetail.stock * 1000 * selectedProductForDetail.pricePerKg).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estimasi Gudang</div>
                </div>
              </div>

              {/* Location & Harvest Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem 0.9rem', background: 'var(--bg-canvas-subtle)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Lokasi Gudang / Lahan</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} color="#5452f6" weight="bold" />
                    <span>{selectedProductForDetail.location}</span>
                  </div>
                </div>

                <div style={{ padding: '0.75rem 0.9rem', background: 'var(--bg-canvas-subtle)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Status Panen / Pengiriman</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} color="#f59e0b" weight="bold" />
                    <span>{selectedProductForDetail.harvestDate || selectedProductForDetail.harvestType || 'Siap Diambil'}</span>
                  </div>
                </div>
              </div>

              {/* Petani & Kelompok Tani Info */}
              <div style={{ padding: '0.75rem 0.9rem', background: 'var(--bg-canvas-subtle)', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #5452f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden' }}>
                    {(selectedProductForDetail.farmerAvatar || farmerProfile?.avatar) ? (
                      <img 
                        src={selectedProductForDetail.farmerAvatar || farmerProfile?.avatar} 
                        alt={selectedProductForDetail.farmerName || farmerProfile?.name || 'Petani'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      (selectedProductForDetail.farmerName || farmerProfile?.name || 'P').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Petani Produsen</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedProductForDetail.farmerName || selectedProductForDetail.farmerLeader || farmerProfile?.name || 'Petani'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{selectedProductForDetail.farmerGroup || farmerProfile?.groupName || 'Kelompok Tani'}</div>
                </div>
              </div>

              {/* Quality & Description */}
              {selectedProductForDetail.description && (
                <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-canvas-subtle)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Deskripsi & Standar Mutu</div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedProductForDetail.description}
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="clone-modal-footer" style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="clone-btn-secondary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenEditModal(selectedProductForDetail);
                }}
                className="clone-btn-primary"
                style={{ padding: '0.55rem 1.2rem', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PencilSimple size={14} weight="bold" />
                <span>Edit Komoditas</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
