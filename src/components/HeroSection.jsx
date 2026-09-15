import React, { useState } from 'react';
import { 
  CheckCircle, 
  ArrowRight, 
  PlayCircle,
  MagnifyingGlass,
  Bell,
  SlidersHorizontal,
  LockKey,
  Sparkle,
  TrendUp,
  Plant,
  Calendar,
  ChatCircleDots,
  House,
  Briefcase
} from '@phosphor-icons/react';

const PRESET_DEALS = [
  {
    id: 'clove',
    commodity: 'Cengkeh Zanzibar Kering Sikotok',
    farmer: 'Poktan Ranowangko Langowan',
    location: 'Langowan, Minahasa',
    pricePerKg: 125000,
    defaultTon: 10,
    maxTon: 30,
    minTon: 1,
    grade: 'Grade A Kering Sikotok'
  },
  {
    id: 'corn',
    commodity: 'Jagung Pipil Kering Hibrida',
    farmer: 'Poktan Tou Kakas Mandiri',
    location: 'Kakas, Minahasa',
    pricePerKg: 5400,
    defaultTon: 50,
    maxTon: 120,
    minTon: 10,
    grade: 'Kadar Air 14% Super'
  },
  {
    id: 'rice',
    commodity: 'Beras Superwin Sentra Tondano',
    farmer: 'Poktan Danau Tondano',
    location: 'Tondano, Minahasa',
    pricePerKg: 15200,
    defaultTon: 30,
    maxTon: 60,
    minTon: 5,
    grade: 'Premium Pulen Minahasa'
  }
];

export default function HeroSection({ onOpenSimulation, onRoleSelect }) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_DEALS[0]);
  const [tonnage, setTonnage] = useState(50);
  const [isLocked, setIsLocked] = useState(false);

  // Dynamic calculations
  const totalKg = tonnage * 1000;
  const contractValue = totalKg * selectedPreset.pricePerKg;

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setTonnage(preset.defaultTon);
    setIsLocked(false);
  };

  return (
    <section style={{ padding: '4.5rem 0 5rem 0', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-canvas)' }}>
      
      {/* Background Soft Blue Ambient Mesh */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: 'var(--hero-mesh)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.25fr',
          gap: '3.5rem',
          alignItems: 'center'
        }} className="hero-grid-split">
          
          {/* SISI KIRI: Headline, Subtext, CTAs, Checkmarks */}
          <div>
            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(2.5rem, 4vw, 3.75rem)',
              lineHeight: 1.12,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              marginBottom: '1.5rem'
            }}>
              Jual Beli Hasil Pertanian Skala Besar dengan{' '}
              <span style={{ color: 'var(--accent-primary)' }}>
                Penawaran Terikat
              </span>
            </h1>

            {/* Sub-headline */}
            <p style={{
              fontSize: '1.12rem',
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              marginBottom: '2.25rem',
              maxWidth: '520px'
            }}>
              AgriConnect menghubungkan petani skala besar langsung ke distributor dan pabrik. Kunci harga, volume, dan jadwal pengambilan via kesepakatan digital yang mengikat.
            </p>

            {/* Button Row matching Reference Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.25rem' }}>
              {/* Primary Pill Button with Circular Arrow Badge */}
              <button
                onClick={() => onRoleSelect('petani')}
                className="btn btn-primary"
                style={{
                  fontSize: '0.96rem',
                  padding: '0.75rem 1.6rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                }}
              >
                <span>Mulai Jual Panen (Petani)</span>
                <span className="btn-circle-icon">
                  <ArrowRight size={13} weight="bold" />
                </span>
              </button>

              {/* Ghost Demo Button */}
              <button
                onClick={() => onOpenSimulation()}
                className="btn-ghost-demo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.96rem',
                  padding: '0.75rem 1.25rem',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent'
                }}
              >
                <PlayCircle size={22} color="var(--accent-primary)" weight="fill" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Lihat Demo Alur</span>
              </button>
            </div>

            {/* Trust Checkmarks Row */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              alignItems: 'center',
              fontSize: '0.86rem',
              color: 'var(--text-secondary)',
              fontWeight: 500
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} color="var(--accent-primary)" weight="fill" />
                <span>14.800+ Ton Terikat</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} color="var(--accent-primary)" weight="fill" />
                <span>Rp 86.4 M Transaksi Disepakati</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} color="var(--accent-primary)" weight="fill" />
                <span>1.240+ Petani Terverifikasi</span>
              </div>
            </div>
          </div>

          {/* SISI KANAN: Floating 3D Tilted Dashboard Tablet with 3D Crystal and Orbs */}
          <div style={{ position: 'relative' }}>
            
            {/* Glowing Deep Blue Planet/Sphere behind top right */}
            <div style={{
              position: 'absolute',
              top: '-45px',
              right: '-30px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #3b82f6 0%, #1d4ed8 50%, #0f172a 90%)',
              boxShadow: '0 0 50px rgba(37, 99, 235, 0.4)',
              zIndex: 0,
              opacity: 0.85
            }} />

            {/* Small floating orb */}
            <div style={{
              position: 'absolute',
              top: '40px',
              right: '-60px',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #60a5fa 0%, #2563eb 60%, #1e3a8a 100%)',
              boxShadow: '0 0 25px rgba(37, 99, 235, 0.35)',
              zIndex: 0
            }} />

            {/* Faceted Blue 3D Crystal at bottom-left */}
            <div style={{
              position: 'absolute',
              bottom: '-35px',
              left: '-25px',
              width: '75px',
              height: '85px',
              zIndex: 3,
              filter: 'drop-shadow(0 15px 25px rgba(37, 99, 235, 0.45))'
            }}>
              <svg viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <polygon points="50,5 95,35 50,75 5,35" fill="#60a5fa" opacity="0.9" />
                <polygon points="5,35 50,75 50,110 5,70" fill="#2563eb" />
                <polygon points="95,35 50,75 50,110 95,70" fill="#1d4ed8" />
                <polygon points="50,5 50,75 5,35" fill="#93c5fd" opacity="0.75" />
              </svg>
            </div>

            {/* The 3D-Tilted Dashboard Tablet Mockup */}
            <div 
              className="floating-dashboard"
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '1.25rem',
                transform: 'perspective(1400px) rotateY(-5deg) rotateX(2deg)',
                transition: 'transform 0.4s ease, background-color 0.3s ease, border-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'perspective(1400px) rotateY(-2deg) rotateX(1deg)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'perspective(1400px) rotateY(-5deg) rotateX(2deg)'}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '170px 1fr',
                gap: '1.25rem',
                minHeight: '480px'
              }} className="tablet-inner-grid">
                
                {/* Left Mini Sidebar inside Tablet */}
                <div style={{
                  borderRight: '1px solid var(--border-subtle)',
                  paddingRight: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    {/* Mini Brand Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.5rem' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Plant size={14} color="#ffffff" weight="fill" />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>AgriConnect</span>
                    </div>

                    {/* Sidebar Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'var(--accent-primary)',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        <House size={14} weight="fill" />
                        <span>Dashboard</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                        <Briefcase size={14} />
                        <span>Komoditas</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                        <LockKey size={14} />
                        <span>Binding</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                        <TrendUp size={14} />
                        <span>Harga Pasar</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                        <Calendar size={14} />
                        <span>Jadwal Cek</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                        <ChatCircleDots size={14} />
                        <span>Pesan Nego</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Verification Status Badge */}
                  <div style={{
                    background: 'var(--bg-canvas-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>Akun Petani KYC</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Status Terverifikasi</div>
                    <div style={{ background: 'var(--accent-primary)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, padding: '4px', borderRadius: '6px' }}>
                      Aktif Siap Jual
                    </div>
                  </div>
                </div>

                {/* Right Content Area inside Tablet Mockup */}
                <div>
                  
                  {/* Topbar: Title + Search + User */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Dashboard</h4>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Welcome back, Mitra Tani! 👋</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'var(--bg-canvas-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '20px',
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)'
                      }}>
                        <MagnifyingGlass size={12} />
                        <span>Search anything...</span>
                      </div>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-canvas-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={12} color="var(--text-muted)" />
                      </div>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        PT
                      </div>
                    </div>
                  </div>

                  {/* 4 Stat Cards Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', padding: '0.6rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Tonase Terikat</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }} className="tabular-data">14.800 T</div>
                      <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>+12.5%</div>
                    </div>

                    <div style={{ background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', padding: '0.6rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Kontrak Aktif</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }} className="tabular-data">128 Deal</div>
                      <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>+5.2%</div>
                    </div>

                    <div style={{ background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', padding: '0.6rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Petani Mitra</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }} className="tabular-data">1.245</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', fontWeight: 700 }}>+18.7%</div>
                    </div>

                    <div style={{ background: 'var(--bg-canvas-subtle)', border: '1px solid var(--border-subtle)', padding: '0.6rem', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Realisasi Selesai</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }} className="tabular-data">8.430 T</div>
                      <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>+10.1%</div>
                    </div>
                  </div>

                  {/* Middle Area: Revenue Curve Chart + Live Tonnage Slider */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    {/* Left: Wave Curve Chart & Contract Valuation */}
                    <div style={{
                      background: 'var(--bg-canvas-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>Revenue Overview (Binding)</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-surface-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>This Month ▾</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }} className="tabular-data">Rp {contractValue.toLocaleString('id-ID')}</span>
                        <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>+18.2%</span>
                      </div>

                      {/* Smooth SVG Wave Line Chart */}
                      <div style={{ height: '70px', width: '100%', position: 'relative' }}>
                        <svg viewBox="0 0 300 70" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                          <defs>
                            <linearGradient id="heroBlueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 0,55 Q 50,15 100,45 T 200,20 T 300,30 L 300,70 L 0,70 Z"
                            fill="url(#heroBlueGrad)"
                          />
                          <path
                            d="M 0,55 Q 50,15 100,45 T 200,20 T 300,30"
                            fill="none"
                            stroke="var(--accent-primary)"
                            strokeWidth="2.5"
                          />
                          <circle cx="200" cy="20" r="4" fill="var(--accent-primary)" stroke="var(--bg-surface-card)" strokeWidth="2" />
                        </svg>
                      </div>

                      {/* Preset deal selector buttons */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                        {PRESET_DEALS.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPreset(p)}
                            style={{
                              flex: 1,
                              background: selectedPreset.id === p.id ? 'var(--accent-primary)' : 'var(--bg-surface-card)',
                              color: selectedPreset.id === p.id ? '#ffffff' : 'var(--text-secondary)',
                              border: selectedPreset.id === p.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              padding: '3px 4px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {p.id === 'clove' ? 'Cengkeh 10T' : p.id === 'corn' ? 'Jagung 50T' : 'Beras 30T'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right: Interactive Deal Tonnage Slider Ticket */}
                    <div style={{
                      background: 'var(--bg-surface-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>Kunci Tonase</span>
                          <span style={{ fontSize: '0.65rem', color: isLocked ? '#10b981' : 'var(--accent-primary)', fontWeight: 700 }}>
                            {isLocked ? 'TERIKAT' : 'PENAWARAN'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '6px' }} className="tabular-data">
                          {tonnage} Ton
                        </div>

                        <input 
                          type="range"
                          min={selectedPreset.minTon}
                          max={selectedPreset.maxTon}
                          value={tonnage}
                          onChange={(e) => {
                            setTonnage(Number(e.target.value));
                            setIsLocked(false);
                          }}
                          style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer', height: '4px', marginBottom: '8px' }}
                        />

                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          @ Rp {selectedPreset.pricePerKg.toLocaleString('id-ID')}/kg
                        </div>
                      </div>

                      <button
                        onClick={() => setIsLocked(!isLocked)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '6px',
                          border: 'none',
                          background: isLocked ? '#059669' : 'var(--accent-primary)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {isLocked ? '✓ Terikat Resmi' : 'Kunci Binding'}
                      </button>
                    </div>
                  </div>

                  {/* Bottom: Top Transactions Table */}
                  <div style={{
                    background: 'var(--bg-surface-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Top Transaksi Binding Aktif</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}>View all activity</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.72rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Cengkeh Zanzibar 10 Ton (Langowan)</span>
                        <span style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>In Progress</span>
                        <span style={{ color: 'var(--text-muted)' }}>Sep 15, 2026</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Beras Superwin 30 Ton (Tondano)</span>
                        <span style={{ background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>On Track</span>
                        <span style={{ color: 'var(--text-muted)' }}>Sep 18, 2026</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Jagung Pipil 50 Ton (Kakas)</span>
                        <span style={{ background: 'var(--accent-amber-light)', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Review</span>
                        <span style={{ color: 'var(--text-muted)' }}>Sep 20, 2026</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 1040px) {
          .hero-grid-split {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .tablet-inner-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
