import React, { useState } from 'react';
import { 
  TrendUp, 
  TrendDown, 
  MapPin, 
  Clock, 
  MagnifyingGlass, 
  Info, 
  X,
  ShieldCheck,
  ChartLineUp
} from '@phosphor-icons/react';
import { INITIAL_MARKET_PRICES } from '../farmer/mockData';

export default function BuyerMarketPrice({ marketPrices = INITIAL_MARKET_PRICES }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = ['Semua', 'Biji-Bijian & Palawija', 'Padi & Beras', 'Hortikultura & Sayur', 'Perkebunan'];

  const filteredPrices = marketPrices.filter((item) => {
    const matchesSearch = item.commodity.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Semua' ? true : item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="farmer-market-view">
      
      {/* Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Harga Acuan Pasar Nasional (Procurement Benchmark)</h1>
          <p className="farmer-page-sub">
            Data harga pasar komoditas harian dari Badan Pangan Nasional, PIBC Cipinang, dan PIHPS untuk dasar kalkulasi harga penawaran pengadaan.
          </p>
        </div>
      </div>

      {/* Info Notice Banner for Buyers */}
      <div className="farmer-market-notice-banner" style={{ background: 'rgba(84, 82, 246, 0.06)', borderColor: 'rgba(84, 82, 246, 0.25)' }}>
        <ChartLineUp size={22} weight="fill" color="#5452f6" />
        <div className="farmer-notice-text">
          <strong style={{ color: '#5452f6' }}>Panduan Estimasi Harga Pembelian (Procurement Guidance):</strong>
          <p style={{ marginTop: '2px', fontSize: '0.85rem' }}>
            Data di bawah merupakan agregasi harga pasar grosir terkini. Mengajukan penawaran di kisaran harga acuan pasar meningkatkan rasio penerimaan oleh kelompok tani hingga <strong>92%</strong> tanpa proses negosiasi ulang yang panjang.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="farmer-filter-bar">
        <div className="farmer-search-input-wrap">
          <MagnifyingGlass size={17} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Cari komoditas, pasar acuan, atau sumber data..." 
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
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`farmer-filter-tab ${selectedCategory === cat ? 'active' : ''}`}
            >
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Market Prices Table Card */}
      <div className="farmer-table-card">
        <div className="farmer-table-responsive">
          <table className="farmer-data-table">
            <thead>
              <tr>
                <th>Komoditas & Kategori</th>
                <th>Wilayah / Pasar Acuan</th>
                <th>Harga Acuan Hari Ini</th>
                <th>Pergerakan</th>
                <th>Sumber & Referensi</th>
                <th>Waktu Pembaruan</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrices.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="farmer-table-commodity-cell">
                      <span className="commodity-name">{item.commodity}</span>
                      <span className="commodity-cat-pill">{item.category}</span>
                    </div>
                  </td>
                  <td>
                    <div className="farmer-table-region-cell">
                      <MapPin size={14} color="#5452f6" />
                      <span>{item.region}</span>
                    </div>
                  </td>
                  <td>
                    <div className="farmer-table-price-cell">
                      <span className="price-main">Rp {item.marketPrice.toLocaleString('id-ID')}</span>
                      <span className="price-unit">/{item.unit}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`farmer-trend-pill ${item.trend}`}>
                      {item.trend === 'up' && <TrendUp size={13} weight="bold" />}
                      {item.trend === 'down' && <TrendDown size={13} weight="bold" />}
                      <span>{item.changePercent}</span>
                    </span>
                  </td>
                  <td>
                    <span className="farmer-source-text">{item.source}</span>
                  </td>
                  <td>
                    <div className="farmer-time-cell">
                      <Clock size={13} />
                      <span>{item.updatedAt}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPrices.length === 0 && (
          <div className="farmer-empty-state">
            <Info size={44} weight="duotone" color="var(--text-muted)" />
            <h3 className="farmer-empty-title">Komoditas Acuan Tidak Ditemukan</h3>
            <p className="farmer-empty-sub">
              Tidak ada data harga pasar acuan yang sesuai dengan pencarian Anda.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
