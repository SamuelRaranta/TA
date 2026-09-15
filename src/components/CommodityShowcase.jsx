import React, { useState } from 'react';
import { 
  MapPin, 
  CheckCircle, 
  ArrowRight, 
  Sparkle,
  Plant,
  ShieldCheck
} from '@phosphor-icons/react';

const COMMODITIES = [
  {
    id: 1,
    name: 'Cengkeh Zanzibar Kering Sikotok',
    category: 'Perkebunan',
    stock: 25,
    unit: 'Ton',
    minOrder: '1 Ton',
    price: 125000,
    priceUnit: 'kg',
    farmer: 'Poktan Ranowangko Langowan',
    location: 'Langowan, Minahasa',
    status: 'Ready Gudang',
    grade: 'Grade A Kering Sikotok',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Kopra Putih Kering Standar Ekspor (KA 6%)',
    category: 'Perkebunan',
    stock: 60,
    unit: 'Ton',
    minOrder: '5 Ton',
    price: 13800,
    priceUnit: 'kg',
    farmer: 'Koperasi Kelapa Pesisir Kombi',
    location: 'Kombi, Minahasa',
    status: 'Ready Gudang',
    grade: 'Oven Ekspor Bebas Jamur',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Beras Superwin Sentra Danau Tondano',
    category: 'Pangan Pokok',
    stock: 45,
    unit: 'Ton',
    minOrder: '3 Ton',
    price: 15200,
    priceUnit: 'kg',
    farmer: 'Poktan Danau Tondano',
    location: 'Tondano, Minahasa',
    status: 'Ready Gudang',
    grade: 'Premium Pulen Minahasa',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 4,
    name: 'Jagung Pipil Kering Hibrida (KA 14%)',
    category: 'Palawija',
    stock: 80,
    unit: 'Ton',
    minOrder: '10 Ton',
    price: 5400,
    priceUnit: 'kg',
    farmer: 'Poktan Tou Kakas Mandiri',
    location: 'Kakas, Minahasa',
    status: 'Siap Panen (3 Hari)',
    grade: 'Standar Industri Pakan',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    name: 'Cabai Rawit Merah (Rica Minahasa) Segar',
    category: 'Hortikultura',
    stock: 10,
    unit: 'Ton',
    minOrder: '500 kg',
    price: 48000,
    priceUnit: 'kg',
    farmer: 'Poktan Horti Sinisir Modoinding',
    location: 'Modoinding, Minahasa',
    status: 'Petik Segar',
    grade: 'Super Pedas Alami',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    name: 'Kentang Granola Modoinding Super',
    category: 'Hortikultura',
    stock: 35,
    unit: 'Ton',
    minOrder: '2 Ton',
    price: 14500,
    priceUnit: 'kg',
    farmer: 'Gapoktan Modoinding Sejahtera',
    location: 'Modoinding, Minahasa',
    status: 'Ready Gudang',
    grade: 'Grade AB Pilihan',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 7,
    name: 'Biji Pala Kupas ABCD & Fuli Sonder',
    category: 'Perkebunan',
    stock: 15,
    unit: 'Ton',
    minOrder: '500 kg',
    price: 105000,
    priceUnit: 'kg',
    farmer: 'Poktan Pala Rindang Sonder',
    location: 'Sonder, Minahasa',
    status: 'Ready Gudang',
    grade: 'Kupas Bersih ABCD',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 8,
    name: 'Kacang Kawangkoan Sangrai Pilihan',
    category: 'Palawija',
    stock: 20,
    unit: 'Ton',
    minOrder: '1 Ton',
    price: 32000,
    priceUnit: 'kg',
    farmer: 'Poktan Kanonang Bersatu',
    location: 'Kawangkoan, Minahasa',
    status: 'Ready Gudang',
    grade: 'Kacang Renyah Khas Minahasa',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80'
  }
];

const CATEGORIES = ['Semua', 'Perkebunan', 'Pangan Pokok', 'Palawija', 'Hortikultura'];

export default function CommodityShowcase({ onSelectCommodity }) {
  const [activeCategory, setActiveCategory] = useState('Semua');

  const filtered = activeCategory === 'Semua' 
    ? COMMODITIES 
    : COMMODITIES.filter(c => c.category === activeCategory);

  return (
    <section id="komoditas" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-canvas-subtle)', transition: 'background-color 0.3s ease' }}>
      <div className="container">
        {/* Section Header matching Reference: Pill + Headline with blue highlight + Subtext */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span className="pill-badge" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              KATALOG PASOKAN
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            letterSpacing: '-0.03em'
          }}>
            Pasokan Panen Komoditas Siap{' '}
            <span style={{ color: 'var(--accent-primary)' }}>
              Kontrak Binding
            </span>
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Seluruh komoditas berasal langsung dari kelompok tani terverifikasi (KYC lahan). Ajukan penawaran untuk mengunci alokasi panen.
          </p>

          {/* Category Filter Pills */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-surface-card)',
            padding: '5px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-subtle)',
            marginTop: '1.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  border: 'none',
                  background: activeCategory === cat ? 'var(--accent-primary)' : 'transparent',
                  color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: activeCategory === cat ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 6-Card Grid matching Reference 3x2 Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.75rem'
        }}>
          {filtered.map(item => (
            <div
              key={item.id}
              className="saas-card"
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 0
              }}
            >
              {/* Photo Banner with Badges */}
              <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
                <img 
                  src={item.image} 
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.7) 0%, transparent 60%)'
                }} />

                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    background: 'var(--bg-surface-card)',
                    backdropFilter: 'blur(8px)',
                    color: 'var(--text-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {item.grade}
                  </span>

                  <span style={{
                    background: 'var(--accent-primary-light)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--accent-primary-border)'
                  }}>
                    {item.status}
                  </span>
                </div>

                <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700 }}>
                    {item.name}
                  </h3>
                </div>
              </div>

              {/* Card Body matching Reference */}
              <div style={{ padding: '1.25rem 1.4rem' }}>
                {/* Farmer & Location */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <CheckCircle size={15} color="var(--accent-primary)" weight="fill" />
                    {item.farmer}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
                    <MapPin size={14} color="#f59e0b" weight="fill" />
                    {item.location}
                  </div>
                </div>

                {/* Metrics Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--bg-canvas)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.25rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stok Tersedia:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }} className="tabular-data">
                      {item.stock} {item.unit}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Min: {item.minOrder}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Harga Acuan:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }} className="tabular-data">
                      Rp {item.price.toLocaleString('id-ID')}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>/{item.priceUnit}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                      Bisa Nego Binding
                    </div>
                  </div>
                </div>

                {/* Learn more link / CTA button matching Reference "Learn more ->" */}
                <button
                  type="button"
                  onClick={() => onSelectCommodity(item)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: 0,
                    transition: 'gap 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.gap = '10px'}
                  onMouseLeave={(e) => e.currentTarget.style.gap = '6px'}
                >
                  <span>Ajukan Penawaran Terikat</span>
                  <ArrowRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
