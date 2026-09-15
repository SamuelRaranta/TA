import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plant, 
  Eye, 
  EyeSlash, 
  ArrowLeft, 
  Sun, 
  Moon, 
  CheckCircle,
  BuildingOffice,
  ShieldCheck,
  Check,
  Key,
  LockKey
} from '@phosphor-icons/react';

export default function AuthPage({ 
  initialMode = 'login', 
  initialRole = 'petani',
  onBackToHome, 
  theme, 
  onToggleTheme,
  onNavigateToDashboard,
  onNavigateToBuyerDashboard
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'forgot'
  const [role, setRole] = useState(initialRole); // 'petani' | 'pembeli'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      if (role === 'petani') {
        if (onNavigateToDashboard) {
          onNavigateToDashboard();
        } else {
          window.location.hash = '#/dashboard/petani';
        }
      } else if (role === 'pembeli') {
        if (onNavigateToBuyerDashboard) {
          onNavigateToBuyerDashboard();
        } else {
          window.location.hash = '#/dashboard/pembeli';
        }
      } else {
        onBackToHome();
      }
    }, 1200);
  };

  return (
    <div className="auth-page-wrapper">
      {/* Latar Belakang Biru Laut yang Mengalir (Flowing Ocean Currents & Streams) */}
      <div className="auth-ocean-flow-bg">
        <div className="auth-ocean-stream stream-1" />
        <div className="auth-ocean-stream stream-2" />
        <div className="auth-ocean-stream stream-3" />
      </div>

      {/* Layer Ombak Biru Laut Mengalir di Bagian Bawah */}
      <div className="auth-ocean-waves-container">
        {/* Layer 1: Deep Ocean Tide */}
        <svg 
          className="auth-ocean-wave-svg wave-deep" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="url(#oceanWaveDeepGrad)" 
            d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,165.3C672,160,768,192,864,208C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <defs>
            <linearGradient id="oceanWaveDeepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.45" />
            </linearGradient>
          </defs>
        </svg>

        {/* Layer 2: Mid Aqua Wave */}
        <svg 
          className="auth-ocean-wave-svg wave-mid" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="url(#oceanWaveMidGrad)" 
            d="M0,96L48,117.3C96,139,192,181,288,176C384,171,480,117,576,112C672,107,768,149,864,170.7C960,192,1056,192,1152,176C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <defs>
            <linearGradient id="oceanWaveMidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>

        {/* Layer 3: Surface Luminous Wave Crest */}
        <svg 
          className="auth-ocean-wave-svg wave-front" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="url(#oceanWaveFrontGrad)" 
            d="M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,218.7C672,224,768,192,864,170.7C960,149,1056,139,1152,149.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <defs>
            <linearGradient id="oceanWaveFrontGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.25" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Dot Grid Pattern in Top Right corner */}
      <div className="auth-dot-grid" />

      {/* Top Bar: Back to Home + Dark/Light Mode Toggle */}
      <div className="auth-top-bar">
        <button 
          type="button"
          onClick={onBackToHome}
          className="auth-back-btn"
        >
          <ArrowLeft size={18} weight="bold" />
          <span>Kembali ke Beranda</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun size={20} weight="bold" color="#fbbf24" />
          ) : (
            <Moon size={20} weight="bold" color="#475569" />
          )}
        </button>
      </div>

      {/* Main Dual-Column Card Container matching Reference */}
      <div className="auth-card-container">
        
        {/* ================= SISI KIRI: Isometric KYC & Brand Showcase ================= */}
        <div className="auth-left-col">
          {/* Brand Logo & Name matching "FOCUS" position in Reference */}
          <div className="auth-brand-badge">
            <div className="auth-logo-icon">
              <Plant size={20} weight="fill" color="#ffffff" />
            </div>
            <span className="auth-brand-name">
              Agri<span style={{ color: 'var(--accent-primary)' }}>Connect</span>
            </span>
          </div>

          {/* 3D Isometric KYC Illustration matching Reference */}
          <div className="auth-isometric-wrapper">
            <svg 
              viewBox="0 0 420 380" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="auth-isometric-svg"
            >
              {/* Isometric Base Grid Platform */}
              <polygon 
                points="210,130 380,220 210,310 40,220" 
                fill="url(#platformGradient)" 
                opacity="0.85" 
              />
              <polygon 
                points="210,140 360,220 210,300 60,220" 
                stroke="#bfdbfe" 
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
                fill="none" 
                opacity="0.75" 
              />

              {/* Floating Diamonds / Tiles on isometric grid */}
              <polygon points="120,285 140,295 120,305 100,295" fill="#93c5fd" opacity="0.6" />
              <polygon points="280,265 305,278 280,290 255,278" fill="#93c5fd" opacity="0.5" />
              <polygon points="345,190 365,200 345,210 325,200" fill="#60a5fa" opacity="0.55" />
              <polygon points="90,165 110,175 90,185 70,175" fill="#bfdbfe" opacity="0.5" />

              {/* ISOMETRIC CLIPBOARD (Backplate & Shadow) */}
              <g transform="translate(10, -5)">
                {/* Shadow */}
                <polygon 
                  points="145,130 200,95 200,240 145,275" 
                  fill="#0f172a" 
                  opacity="0.1" 
                />

                {/* Left Spine / Depth of Clipboard */}
                <polygon 
                  points="130,135 140,130 140,265 130,270" 
                  fill="#1d4ed8" 
                />

                {/* Clipboard Face (Royal Blue frame) */}
                <polygon 
                  points="140,130 220,85 220,220 140,265" 
                  fill="#2563eb" 
                />
                <polygon 
                  points="143,132 217,89 217,217 143,260" 
                  fill="#3b82f6" 
                />

                {/* Sheet of Paper on Clipboard */}
                <polygon 
                  points="148,136 212,98 212,212 148,250" 
                  fill="#ffffff" 
                />

                {/* Top Clip Hook */}
                <circle cx="180" cy="98" r="8" fill="#60a5fa" />
                <circle cx="180" cy="98" r="4" fill="#ffffff" />
                <polygon points="170,104 190,92 190,102 170,114" fill="#1d4ed8" />

                {/* Paper Content: Profile Silhouette Box */}
                <polygon points="155,142 175,130 175,152 155,164" fill="#eff6ff" />
                <circle cx="165" cy="143" r="3.5" fill="#2563eb" />
                <ellipse cx="165" cy="151" rx="5" ry="3" fill="#2563eb" />

                {/* Paper Text Lines */}
                <polygon points="180,126 205,112 205,115 180,129" fill="#60a5fa" />
                <polygon points="180,133 200,122 200,125 180,136" fill="#bfdbfe" />
                <polygon points="155,172 205,143 205,146 155,175" fill="#cbd5e1" />
                <polygon points="155,180 205,151 205,154 155,183" fill="#cbd5e1" />
                <polygon points="155,188 195,165 195,168 155,191" fill="#cbd5e1" />
                <polygon points="155,196 202,169 202,172 155,199" fill="#cbd5e1" />
                <polygon points="155,204 185,187 185,190 155,207" fill="#cbd5e1" />

                {/* Verified Green Stamp / Check on Paper */}
                <circle cx="195" cy="195" r="7" fill="#10b981" />
                <path d="M192 195 L194 197 L198 193" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* ISOMETRIC PENCIL (Tilted pink/coral pencil matching reference) */}
              <g transform="translate(25, 30)">
                {/* Pencil Body */}
                <polygon points="120,230 165,205 170,209 125,234" fill="#f43f5e" />
                <polygon points="125,234 170,209 172,213 127,238" fill="#e11d48" />
                {/* Pencil Tip */}
                <polygon points="113,234 120,230 125,234" fill="#fde047" />
                <polygon points="113,234 116,232 115,235" fill="#1e1b4b" />
                {/* Pencil Eraser */}
                <polygon points="165,205 175,199 180,203 170,209" fill="#fda4af" />
                <polygon points="163,206 166,204 171,208 168,210" fill="#e2e8f0" />
              </g>

              {/* ISOMETRIC STANDING ID CARD (Cyan / Blue Card matching Reference) */}
              <g transform="translate(10, 0)">
                {/* Card Shadow */}
                <polygon points="265,200 295,182 295,220 265,238" fill="#1e1b4b" opacity="0.1" />
                {/* Card Thickness */}
                <polygon points="255,182 260,179 260,232 255,235" fill="#0284c7" />
                {/* Card Face */}
                <polygon points="260,179 295,158 295,211 260,232" fill="#0ea5e9" />
                {/* White avatar on cyan card */}
                <circle cx="277" cy="186" r="5" fill="#ffffff" />
                <ellipse cx="277" cy="198" rx="8" ry="4.5" fill="#ffffff" />
                <polygon points="265,206 288,193 288,195 265,208" fill="#e0f2fe" opacity="0.8" />
              </g>

              {/* ISOMETRIC FLOATING ID BADGE ON GROUND (White badge with blue avatar) */}
              <g transform="translate(10, 20)">
                <polygon points="215,230 250,210 270,222 235,242" fill="#ffffff" />
                <polygon points="215,230 235,242 235,245 215,233" fill="#e2e8f0" />
                <circle cx="238" cy="226" r="3.5" fill="#38bdf8" />
                <polygon points="248,222 260,215 260,217 248,224" fill="#cbd5e1" />
                <polygon points="248,226 256,221 256,223 248,228" fill="#cbd5e1" />
              </g>

              {/* Gradients */}
              <defs>
                <linearGradient id="platformGradient" x1="40" y1="130" x2="380" y2="310" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#dbeafe" stopOpacity="0.75" />
                  <stop offset="0.5" stopColor="#bfdbfe" stopOpacity="0.45" />
                  <stop offset="1" stopColor="#eff6ff" stopOpacity="0.85" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Value Badges Bottom Left */}
          <div className="auth-trust-list">
            <div className="auth-trust-item">
              <CheckCircle size={16} weight="fill" color="var(--accent-primary)" />
              <span>Verifikasi Legalitas & KYC Lahan</span>
            </div>
            <div className="auth-trust-item">
              <CheckCircle size={16} weight="fill" color="var(--accent-primary)" />
              <span>Digital Binding Agreement Resmi</span>
            </div>
            <div className="auth-trust-item">
              <CheckCircle size={16} weight="fill" color="var(--accent-primary)" />
              <span>Transaksi Langsung Bebas Makelar</span>
            </div>
          </div>
        </div>

        {/* ================= SISI KANAN: Form Login / Signup ================= */}
        <div className="auth-right-col">
          
          {/* Top Right Toggle: "Don't you have an account? [ SIGN UP ]" matching Reference */}
          <div className="auth-mode-switch-header">
            <span className="auth-switch-prompt">
              {mode === 'login' 
                ? "Don't you have an account?" 
                : mode === 'signup' 
                  ? "Already have an account?" 
                  : "Remember your password?"}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.04 }}
              onClick={() => {
                if (mode === 'login') {
                  setMode('signup');
                } else {
                  setMode('login');
                }
                setIsSuccess(false);
                setForgotSent(false);
              }}
              className="auth-switch-action-btn"
            >
              {mode === 'login' ? 'SIGN UP' : 'SIGN IN'}
            </motion.button>
          </div>

          {/* Form Content with Smooth Mode Transition */}
          <div className="auth-form-body" style={{ position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait" initial={false}>
              {!isSuccess ? (
                mode === 'forgot' ? (
                  !forgotSent ? (
                    /* ====== FORGOT PASSWORD FORM ====== */
                    <motion.div
                      key="forgot"
                      initial={{ opacity: 0, x: 26, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: -26, filter: 'blur(3px)' }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="auth-mode-badge">
                        <Key size={14} weight="bold" />
                        <span>Pemulihan Akun</span>
                      </div>
                      <h1 className="auth-heading">Reset Password</h1>
                      <p className="auth-subheading">
                        Masukkan email akun Anda untuk menerima instruksi pemulihan kata sandi.
                      </p>

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          setForgotSent(true);
                        }} 
                        className="auth-form-fields"
                      >
                        <div className="auth-field-group">
                          <label className="auth-label">Email Terdaftar</label>
                          <input 
                            type="email" 
                            required 
                            value={forgotEmail || email}
                            onChange={(e) => {
                              setForgotEmail(e.target.value);
                              setEmail(e.target.value);
                            }}
                            placeholder="nama@email.com"
                            className="auth-input" 
                          />
                          <p className="auth-forgot-hint">
                            Tautan aman untuk membuat kata sandi baru akan dikirimkan ke email ini.
                          </p>
                        </div>

                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="auth-submit-btn"
                          style={{ marginTop: '0.4rem', marginBottom: '0.85rem' }}
                        >
                          Kirim Link Pemulihan
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => setMode('login')}
                          className="auth-back-to-login-btn"
                        >
                          <ArrowLeft size={16} weight="bold" />
                          <span>Kembali ke Halaman Masuk</span>
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    /* ====== FORGOT PASSWORD SUCCESS NOTIFICATION ====== */
                    <motion.div
                      key="forgot-sent"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.28 }}
                      className="auth-forgot-success-box"
                    >
                      <div className="auth-forgot-success-icon">
                        <CheckCircle size={34} weight="fill" />
                      </div>
                      <h2 className="auth-heading" style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>
                        Link Pemulihan Terkirim!
                      </h2>
                      <p className="auth-subheading" style={{ marginBottom: '1.35rem', textAlign: 'center' }}>
                        Instruksi reset kata sandi telah dikirim ke <strong>{forgotEmail || email}</strong>. Silakan periksa inbox atau folder spam email Anda.
                      </p>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setForgotSent(false);
                          setMode('login');
                        }}
                        className="auth-submit-btn"
                      >
                        Kembali ke Halaman Masuk
                      </motion.button>

                      <button
                        type="button"
                        onClick={() => setForgotSent(false)}
                        className="auth-resend-link"
                      >
                        Belum menerima email? Kirim ulang
                      </button>
                    </motion.div>
                  )
                ) : (
                  /* ====== LOGIN / SIGNUP FORM ====== */
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, x: mode === 'signup' ? 26 : -26, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: mode === 'signup' ? -26 : 26, filter: 'blur(3px)' }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h1 className="auth-heading">
                      {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
                    </h1>
                    <p className="auth-subheading">
                      {mode === 'login' 
                        ? 'Login your account' 
                        : 'Mulai transaksi komoditas pertanian skala besar'}
                    </p>

                    {/* Role Switcher (Petani vs Pembeli) */}
                    <div className="auth-role-tabs">
                      <button
                        type="button"
                        onClick={() => setRole('petani')}
                        className={`auth-role-tab ${role === 'petani' ? 'active' : ''}`}
                      >
                        <Plant size={17} weight={role === 'petani' ? 'fill' : 'bold'} />
                        <span>Akun Petani Produsen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('pembeli')}
                        className={`auth-role-tab ${role === 'pembeli' ? 'active' : ''}`}
                      >
                        <BuildingOffice size={17} weight={role === 'pembeli' ? 'fill' : 'bold'} />
                        <span>Akun Pembeli / Distributor</span>
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form-fields">
                      {/* Username / Email Field matching Reference */}
                      <div className="auth-field-group">
                        <label className="auth-label">Username</label>
                        <input 
                          type="email" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Your email"
                          className="auth-input" 
                        />
                      </div>

                      {/* Password Field with Eye Toggle matching Reference */}
                      <div className="auth-field-group">
                        <label className="auth-label">Password</label>
                        <div className="auth-password-wrapper">
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            className="auth-input password-input" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="auth-eye-btn"
                            title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? (
                              <EyeSlash size={19} color="#94a3b8" />
                            ) : (
                              <Eye size={19} color="#94a3b8" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Forgot Password Link (Login mode) */}
                      {mode === 'login' && (
                        <div className="auth-forgot-wrapper">
                          <button 
                            type="button" 
                            onClick={() => {
                              setMode('forgot');
                              setForgotSent(false);
                            }} 
                            className="auth-forgot-btn"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      {/* Submit Button matching Reference Purple Pill */}
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="auth-submit-btn"
                      >
                        {mode === 'login' ? 'Login' : 'Sign Up'}
                      </motion.button>
                    </form>

                    {/* Social Login Footer matching Reference */}
                    <div className="auth-social-footer">
                      <span className="auth-social-label">Login with</span>
                      <div className="auth-social-icons">
                        {/* Facebook */}
                        <button 
                          type="button" 
                          onClick={() => alert('Simulasi Login via Facebook')} 
                          className="auth-social-btn facebook"
                          aria-label="Login with Facebook"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </button>

                        {/* LinkedIn */}
                        <button 
                          type="button" 
                          onClick={() => alert('Simulasi Login via LinkedIn')} 
                          className="auth-social-btn linkedin"
                          aria-label="Login with LinkedIn"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077b5">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </button>

                        {/* Google */}
                        <button 
                          type="button" 
                          onClick={() => alert('Simulasi Login via Google')} 
                          className="auth-social-btn google"
                          aria-label="Login with Google"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              ) : (
                /* Success Confirmation with Animation */
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.3 }}
                  className="auth-success-box"
                >
                  <div className="auth-success-circle">
                    <ShieldCheck size={38} weight="fill" />
                  </div>
                  <h2 className="auth-success-title">
                    {mode === 'login' ? 'Berhasil Masuk!' : 'Registrasi Berhasil!'}
                  </h2>
                  <p className="auth-success-sub">
                    Selamat datang di platform AgriConnect. Mengarahkan ke dashboard {role}...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
