import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plant, BuildingOffice, ShieldCheck, ArrowRight } from '@phosphor-icons/react';

export default function AuthModal({ isOpen, onClose, initialRole = 'petani' }) {
  const [role, setRole] = useState(initialRole);
  const [isLogin, setIsLogin] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              width: '100%',
              maxWidth: '480px',
              position: 'relative',
              zIndex: 1,
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-surface-card)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'var(--bg-canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={18} weight="bold" />
            </button>

            {!success ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'var(--accent-primary-light)',
                    color: 'var(--accent-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.75rem',
                    border: '1px solid var(--accent-primary-border)'
                  }}>
                    <Plant size={24} weight="fill" />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.35rem' }}>
                    {isLogin ? 'Masuk ke Akun Anda' : 'Registrasi Akun Baru'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Akses ekosistem komoditas pertanian skala besar
                  </p>
                </div>

                {/* Role Switcher Tabs */}
                {!isLogin && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    background: 'var(--bg-canvas-subtle)',
                    padding: '4px',
                    borderRadius: '10px',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setRole('petani')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: role === 'petani' ? 'var(--bg-surface-card)' : 'transparent',
                        color: role === 'petani' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: role === 'petani' ? 'var(--shadow-sm)' : 'none',
                        fontWeight: role === 'petani' ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plant size={18} weight={role === 'petani' ? "fill" : "regular"} />
                      Akun Petani
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('pembeli')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: role === 'pembeli' ? 'var(--bg-surface-card)' : 'transparent',
                        color: role === 'pembeli' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: role === 'pembeli' ? 'var(--shadow-sm)' : 'none',
                        fontWeight: role === 'pembeli' ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <BuildingOffice size={18} weight={role === 'pembeli' ? "fill" : "regular"} />
                      Akun Pembeli
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {!isLogin && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        {role === 'petani' ? 'Nama Lengkap / Kelompok Tani' : 'Nama Perusahaan / Distributor'}
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder={role === 'petani' ? 'Contoh: Kelompok Tani Sri Rejeki' : 'Contoh: PT Agro Sukses Mandiri'}
                        className="saas-input" 
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      Alamat Email Aktif
                    </label>
                    <input 
                      type="email" 
                      required 
                      placeholder="nama@domain.com"
                      className="saas-input" 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      Nomor WhatsApp / HP
                    </label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="081234567890"
                      className="saas-input" 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      Kata Sandi
                    </label>
                    <input 
                      type="password" 
                      required 
                      placeholder="Minimal 8 karakter"
                      className="saas-input" 
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                  >
                    <span>{isLogin ? 'Masuk Sekarang' : `Daftar sebagai ${role === 'petani' ? 'Petani' : 'Pembeli'}`}</span>
                    <span className="btn-circle-icon">
                      <ArrowRight size={14} weight="bold" />
                    </span>
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary-light)',
                  color: 'var(--accent-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  border: '1px solid var(--accent-primary-border)'
                }}>
                  <ShieldCheck size={32} weight="fill" />
                </div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {isLogin ? 'Berhasil Masuk!' : 'Pendaftaran Berhasil!'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Menyiapkan dashboard {role}...
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
