import React, { useState, useEffect, useRef } from 'react';
import { 
  Bug, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  X, 
  UploadSimple, 
  FileText, 
  Image, 
  Trash, 
  Eye, 
  ArrowLeft, 
  Info, 
  WarningCircle, 
  ListChecks, 
  PlusCircle, 
  User, 
  Envelope, 
  ChatCircleDots,
  CaretDown,
  Check,
  Tag,
  SquaresFour
} from '@phosphor-icons/react';
import { 
  BUG_CATEGORIES, 
  BUG_PAGES, 
  BUG_IMPACTS, 
  BUG_STATUSES,
  getCategoryLabel, 
  getPageLabel, 
  getImpactLabel, 
  getStatusLabel,
  fetchBugReportsFromSupabase, 
  createBugReportInSupabase,
  subscribeBugReports
} from '../../lib/bugReportService';
import { supabase } from '../../lib/supabaseClient';

/**
 * Custom Soft Dropdown component:
 * Eliminates harsh OS browser default select popups, providing smooth rounded corners,
 * elegant hover highlights, and perfect design system consistency.
 */
function SoftSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih opsi...',
  hasError = false,
  ariaLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: '44px',
          padding: '0 1rem',
          borderRadius: '12px',
          border: isOpen
            ? '1.5px solid var(--accent-primary, #2563eb)'
            : hasError
            ? '1.5px solid #ef4444'
            : '1px solid var(--border-subtle, #e2e8f0)',
          background: 'var(--bg-surface-card, #ffffff)',
          color: selectedOption ? 'var(--text-primary, #0f172a)' : 'var(--text-muted, #94a3b8)',
          fontSize: '0.86rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3.5px rgba(37, 99, 235, 0.12)' : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
          textAlign: 'left'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <CaretDown
          size={16}
          weight="bold"
          style={{
            color: 'var(--text-muted, #94a3b8)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '8px'
          }}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--bg-surface-card, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '14px',
            boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
            padding: '6px',
            maxHeight: '260px',
            overflowY: 'auto'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--accent-primary, #2563eb)' : 'var(--text-primary, #0f172a)',
                  background: isSelected ? 'var(--accent-primary-light, #eff6ff)' : 'transparent',
                  transition: 'background 0.15s ease, color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f8fafc)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={16} weight="bold" color="var(--accent-primary, #2563eb)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LaporkanMasalah({ 
  userRole = 'pembeli',
  onBack 
}) {
  // Active Tab: 'form' | 'riwayat'
  const [activeTab, setActiveTab] = useState('form');

  // Authenticated User State — tanpa seed ID bersama (itu sumber laporan basi milik orang lain).
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const roleStored = localStorage.getItem(`agriconnect_auth_user_${userRole}`);
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
      if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === String(userRole).toLowerCase())) {
        return parsed;
      }
    } catch (e) {}
    return {
      id: null,
      fullName: '',
      email: '',
      role: userRole
    };
  });

  // Resolve Real Supabase Auth Session
  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted && user) {
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const role = user.user_metadata?.role || userRole;
        setCurrentUser(prev => ({
          ...prev,
          id: user.id,
          email: user.email || prev.email,
          fullName: metaName || prev.fullName,
          role: role
        }));
      }
    }).catch(err => console.warn('[LaporkanMasalah] Auth check:', err));

    return () => { isMounted = false; };
  }, [userRole]);

  // Form States
  const [category, setCategory] = useState('bug');
  const [title, setTitle] = useState('');
  const [page, setPage] = useState('home');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('medium');

  // Screenshots state (files & local preview URLs)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  // Form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReport, setSubmittedReport] = useState(null);

  // Validation errors
  const [errors, setErrors] = useState({});

  // User Reports History
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Load user's bug reports
  const loadReports = async () => {
    if (!currentUser?.id) {
      // Tanpa sesi: kosongkan agar riwayat user sebelumnya tidak tampil (stale).
      setMyReports([]);
      return;
    }
    setLoadingReports(true);
    try {
      const { data } = await fetchBugReportsFromSupabase({
        userId: currentUser.id,
        role: currentUser.role
      });
      if (data) {
        setMyReports(data);
      }
    } catch (err) {
      console.warn('Gagal memuat laporan pengguna:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const lastReportUserRef = useRef(currentUser?.id);
  useEffect(() => {
    // Ganti user: kosongkan riwayat lama dulu (jangan tampil data basi).
    if (lastReportUserRef.current !== currentUser?.id) {
      lastReportUserRef.current = currentUser?.id;
      setMyReports([]);
      setSelectedReportDetail(null);
    }
    loadReports();
    const unsubscribe = subscribeBugReports(() => {
      loadReports();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.id]);

  // Handle File Selection
  const handleFileChange = (e) => {
    setFileError('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedFiles.length + files.length > 3) {
      setFileError('Maksimal lampiran adalah 3 gambar screenshot.');
      return;
    }

    const validNewFiles = [];
    for (const file of files) {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowed.includes(file.type.toLowerCase())) {
        setFileError(`Format "${file.name}" tidak didukung. Harap gunakan format JPG, JPEG, atau PNG.`);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setFileError(`Ukuran file "${file.name}" melebihi 2 MB.`);
        return;
      }
      validNewFiles.push({
        file,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        preview: URL.createObjectURL(file)
      });
    }

    setSelectedFiles(prev => [...prev, ...validNewFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Judul masalah wajib diisi.';
    } else if (title.trim().length < 5) {
      errs.title = 'Judul masalah minimal 5 karakter.';
    } else if (title.trim().length > 100) {
      errs.title = 'Judul masalah maksimal 100 karakter.';
    }

    if (!page) {
      errs.page = 'Halaman terjadinya masalah wajib dipilih.';
    }

    if (!description.trim()) {
      errs.description = 'Deskripsi masalah wajib diisi.';
    } else if (description.trim().length < 10) {
      errs.description = 'Deskripsi masalah minimal 10 karakter.';
    } else if (description.trim().length > 2000) {
      errs.description = 'Deskripsi masalah maksimal 2000 karakter.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    if (!currentUser?.id) {
      setSubmitError('Identitas pengguna tidak ditemukan. Silakan login kembali sebelum mengirim laporan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: currentUser.id,
        userName: currentUser.fullName || currentUser.name || (userRole === 'petani' ? 'Petani Minahasa' : 'Pembeli Grosir'),
        userEmail: currentUser.email || `${userRole}@agriconnect.id`,
        userRole: currentUser.role || userRole,
        category,
        title,
        page,
        description,
        impact
      };

      const rawFiles = selectedFiles.map(f => f.file);
      const created = await createBugReportInSupabase(payload, rawFiles);

      setSubmittedReport(created);
      // Refresh list
      loadReports();
    } catch (err) {
      console.error('Error submitting bug report:', err);
      setSubmitError(err.message || 'Laporan gagal dikirim. Silakan periksa kembali isian form Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('bug');
    setPage('home');
    setImpact('medium');
    setSelectedFiles([]);
    setErrors({});
    setSubmitError('');
    setSubmittedReport(null);
  };

  // Copy to clipboard helper
  const [copiedNumber, setCopiedNumber] = useState(false);
  const handleCopyReportNumber = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  return (
    <div className="clone-dashboard-content" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* ================= HEADER SECTION WITH SOFT-SKILL & REASSURANCE ================= */}
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <h1 style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-primary, #0f172a)',
            letterSpacing: '-0.025em',
            margin: '0 0 0.4rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
              color: 'var(--accent-primary, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)'
            }}>
              <Bug size={22} weight="bold" />
            </div>
            <span>Laporkan Masalah</span>
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary, #475569)',
            margin: 0,
            lineHeight: 1.55
          }}>
            Sampaikan kendala yang Anda temukan agar tim kami dapat segera menanganinya.
          </p>
        </div>

        {/* Soft Segmented Control Tabs */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-canvas-muted, #f1f5f9)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          gap: '4px',
          alignSelf: 'flex-start'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('form'); setSubmittedReport(null); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              borderRadius: '9px',
              padding: '0.5rem 1rem',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'form' ? 700 : 500,
              background: activeTab === 'form' ? 'var(--bg-surface-card, #ffffff)' : 'transparent',
              color: activeTab === 'form' ? 'var(--accent-primary, #2563eb)' : 'var(--text-secondary, #64748b)',
              boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <PlusCircle size={15} weight={activeTab === 'form' ? 'bold' : 'regular'} />
            <span>Buat Laporan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              borderRadius: '9px',
              padding: '0.5rem 1rem',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'riwayat' ? 700 : 500,
              background: activeTab === 'riwayat' ? 'var(--bg-surface-card, #ffffff)' : 'transparent',
              color: activeTab === 'riwayat' ? 'var(--accent-primary, #2563eb)' : 'var(--text-secondary, #64748b)',
              boxShadow: activeTab === 'riwayat' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ListChecks size={15} weight={activeTab === 'riwayat' ? 'bold' : 'regular'} />
            <span>Laporan Saya</span>
            {myReports.length > 0 && (
              <span style={{
                background: activeTab === 'riwayat' ? 'var(--accent-primary, #2563eb)' : '#cbd5e1',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '9999px',
                marginLeft: '2px'
              }}>
                {myReports.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= TAB 1: FORM LAPORAN MASALAH ================= */}
      {activeTab === 'form' && (
        <>
          {submittedReport ? (
            /* ================= SUCCESS STATE WITH SOFT-SKILL REASSURANCE ================= */
            <div style={{
              background: 'var(--bg-surface-card, #ffffff)',
              border: '1px solid var(--border-card, #eef2f6)',
              borderRadius: '20px',
              padding: '3rem 2rem',
              textAlign: 'center',
              maxWidth: '560px',
              margin: '1rem auto',
              boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.05)'
            }}>
              {/* Soft Pulse Circle Checkmark */}
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#ecfdf5',
                border: '4px solid #f0fdf4',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.2)'
              }}>
                <CheckCircle size={40} weight="fill" />
              </div>

              <h2 style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--text-primary, #0f172a)',
                letterSpacing: '-0.02em',
                margin: '0 0 0.5rem 0'
              }}>
                Laporan Berhasil Dikirim
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary, #475569)',
                maxWidth: '430px',
                margin: '0 auto 1.75rem',
                lineHeight: 1.6
              }}>
                Terima kasih. Laporan Anda telah diterima dan akan ditinjau oleh Admin.
              </p>

              {/* Minimalist Summary Pill Card */}
              <div style={{
                background: 'var(--bg-canvas-subtle, #f8fafc)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                borderRadius: '14px',
                padding: '1.25rem 1.4rem',
                textAlign: 'left',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>
                    Nomor Laporan:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      color: 'var(--accent-primary, #2563eb)',
                      background: 'var(--accent-primary-light, #eff6ff)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--accent-primary-border, #bfdbfe)'
                    }}>
                      {submittedReport.report_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReportNumber(submittedReport.report_number)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        color: copiedNumber ? '#10b981' : 'var(--text-muted, #94a3b8)',
                        padding: '2px 4px',
                        fontWeight: 600
                      }}
                      title="Salin Nomor Laporan"
                    >
                      {copiedNumber ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>
                    Status Awal:
                  </span>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0284c7' }} />
                    <span>Baru</span>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600, flexShrink: 0 }}>
                    Judul Masalah:
                  </span>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '260px'
                  }}>
                    {submittedReport.title}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="clone-btn-secondary"
                  onClick={handleResetForm}
                  style={{
                    padding: '0.65rem 1.35rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}
                >
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  className="clone-btn-primary"
                  onClick={() => setActiveTab('riwayat')}
                  style={{
                    padding: '0.65rem 1.45rem',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ListChecks size={16} weight="bold" />
                  <span>Lihat Laporan</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= BUG REPORT FORM ================= */
            <form onSubmit={handleSubmit} style={{
              background: 'var(--bg-surface-card, #ffffff)',
              border: '1px solid var(--border-card, #eef2f6)',
              borderRadius: '20px',
              padding: '2rem 2.25rem',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)'
            }}>
              
              {/* ================= SECTION 1: KLASIFIKASI KENDALA ================= */}
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'var(--accent-primary-light, #eff6ff)',
                      color: 'var(--accent-primary, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Tag size={16} weight="bold" />
                    </div>
                    <span>Klasifikasi Kendala</span>
                  </div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary, #64748b)',
                    margin: '4px 0 0 36px',
                    lineHeight: 1.45
                  }}>
                    Pilih kategori dan lokasi halaman di mana Anda menemukan kendala.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  {/* Jenis Masalah */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '0.45rem' }}>
                      Jenis Masalah <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <SoftSelect
                      value={category}
                      onChange={(newVal) => setCategory(newVal)}
                      options={BUG_CATEGORIES}
                      placeholder="Pilih jenis kendala..."
                      ariaLabel="Jenis Masalah"
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '5px', display: 'block' }}>
                      Kategori utama area yang mengalami kendala
                    </span>
                  </div>

                  {/* Halaman Terjadinya Masalah */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '0.45rem' }}>
                      Halaman Terjadinya Masalah <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <SoftSelect
                      value={page}
                      onChange={(newVal) => {
                        setPage(newVal);
                        if (errors.page) setErrors(prev => ({ ...prev, page: null }));
                      }}
                      options={BUG_PAGES}
                      placeholder="Pilih lokasi halaman..."
                      hasError={Boolean(errors.page)}
                      ariaLabel="Halaman Terjadinya Masalah"
                    />
                    {errors.page ? (
                      <span style={{ fontSize: '0.74rem', color: '#ef4444', marginTop: '5px', display: 'block', fontWeight: 500 }}>
                        {errors.page}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '5px', display: 'block' }}>
                        Lokasi antarmuka saat Anda menemukan error
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtle Section Divider */}
              <div style={{ height: '1px', background: 'var(--border-subtle, #f1f5f9)', margin: '1.85rem 0' }} />

              {/* ================= SECTION 2: RINCIAN KENDALA ================= */}
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'var(--accent-primary-light, #eff6ff)',
                      color: 'var(--accent-primary, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={16} weight="bold" />
                    </div>
                    <span>Rincian Masalah</span>
                  </div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary, #64748b)',
                    margin: '4px 0 0 36px',
                    lineHeight: 1.45
                  }}>
                    Berikan judul ringkas dan penjelasan kronologi masalah yang dialami.
                  </p>
                </div>

                {/* Judul Masalah */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '0.45rem' }}>
                    Judul Masalah <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="clone-input"
                    placeholder="Contoh: Tombol konfirmasi pembayaran tidak merespons saat ditekan"
                    value={title}
                    maxLength={100}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                    }}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '12px',
                      fontSize: '0.86rem',
                      padding: '0 1rem',
                      borderColor: errors.title ? '#ef4444' : undefined
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    {errors.title ? (
                      <span style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 500 }}>{errors.title}</span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                        Tuliskan ringkasan inti kendala secara singkat dan jelas (5–100 karakter).
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      background: title.trim().length >= 5 ? '#ecfdf5' : 'var(--bg-canvas-subtle, #f8fafc)',
                      color: title.trim().length >= 5 ? '#059669' : 'var(--text-muted, #94a3b8)',
                      border: `1px solid ${title.trim().length >= 5 ? '#a7f3d0' : 'var(--border-subtle, #e2e8f0)'}`
                    }}>
                      {title.length}/100
                    </span>
                  </div>
                </div>

                {/* Deskripsi Masalah */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: '0.45rem' }}>
                    Deskripsi Masalah <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    className="clone-input"
                    rows={4}
                    placeholder="Contoh: Saya sudah mengunggah bukti transfer, namun saat tombol Konfirmasi Pembayaran ditekan, halaman tidak merespons dan tidak muncul notifikasi."
                    value={description}
                    maxLength={2000}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                    }}
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      fontSize: '0.86rem',
                      lineHeight: 1.6,
                      resize: 'vertical',
                      padding: '0.85rem 1rem',
                      borderColor: errors.description ? '#ef4444' : undefined
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '6px' }}>
                    {errors.description ? (
                      <span style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 500 }}>{errors.description}</span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                        Jelaskan apa yang terjadi dan langkah yang Anda lakukan sebelum masalah muncul.
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      background: description.trim().length >= 10 ? '#ecfdf5' : 'var(--bg-canvas-subtle, #f8fafc)',
                      color: description.trim().length >= 10 ? '#059669' : 'var(--text-muted, #94a3b8)',
                      border: `1px solid ${description.trim().length >= 10 ? '#a7f3d0' : 'var(--border-subtle, #e2e8f0)'}`
                    }}>
                      {description.length}/2000
                    </span>
                  </div>
                </div>
              </div>

              {/* Subtle Section Divider */}
              <div style={{ height: '1px', background: 'var(--border-subtle, #f1f5f9)', margin: '1.85rem 0' }} />

              {/* ================= SECTION 3: DAMPAK MASALAH ================= */}
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'var(--accent-primary-light, #eff6ff)',
                      color: 'var(--accent-primary, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <WarningCircle size={16} weight="bold" />
                    </div>
                    <span>Dampak Masalah Terhadap Aktivitas Anda</span>
                  </div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary, #64748b)',
                    margin: '4px 0 0 36px',
                    lineHeight: 1.45
                  }}>
                    Bantu tim kami menentukan skala prioritas penanganan kendala ini.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  {BUG_IMPACTS.map((imp) => {
                    const isSelected = impact === imp.value;
                    const isLow = imp.value === 'low';
                    const isMedium = imp.value === 'medium';
                    const isHigh = imp.value === 'high';

                    const activeBorder = isHigh ? '#f97316' : isMedium ? '#f59e0b' : '#10b981';
                    const activeBg = isHigh ? 'rgba(249, 115, 22, 0.05)' : isMedium ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)';
                    const activeTagColor = isHigh ? '#ea580c' : isMedium ? '#d97706' : '#059669';

                    return (
                      <div
                        key={imp.value}
                        onClick={() => setImpact(imp.value)}
                        style={{
                          border: isSelected ? `1.5px solid ${activeBorder}` : '1px solid var(--border-subtle, #e2e8f0)',
                          background: isSelected ? activeBg : 'var(--bg-surface-card, #ffffff)',
                          borderRadius: '14px',
                          padding: '1.05rem 1.15rem',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.03)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = 'var(--border-subtle, #e2e8f0)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            color: isSelected ? activeTagColor : 'var(--text-primary, #0f172a)'
                          }}>
                            {imp.label}
                          </span>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? activeBorder : '#cbd5e1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isSelected ? activeBorder : 'transparent'
                          }}>
                            {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />}
                          </div>
                        </div>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #64748b)', margin: 0, lineHeight: 1.45 }}>
                          {imp.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subtle Section Divider */}
              <div style={{ height: '1px', background: 'var(--border-subtle, #f1f5f9)', margin: '1.85rem 0' }} />

              {/* ================= SECTION 4: LAMPIRAN SCREENSHOT ================= */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      color: 'var(--text-primary, #0f172a)',
                      letterSpacing: '-0.01em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'var(--accent-primary-light, #eff6ff)',
                        color: 'var(--accent-primary, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Image size={16} weight="bold" />
                      </div>
                      <span>Lampiran Screenshot <span style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>(Opsional)</span></span>
                    </div>
                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary, #64748b)',
                      margin: '4px 0 0 36px',
                      lineHeight: 1.45
                    }}>
                      Sertakan tangkapan layar untuk mempermudah identifikasi kendala.
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    color: selectedFiles.length > 0 ? 'var(--accent-primary, #2563eb)' : 'var(--text-muted, #94a3b8)',
                    fontWeight: 700,
                    background: 'var(--bg-canvas-subtle, #f8fafc)',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-subtle, #e2e8f0)'
                  }}>
                    {selectedFiles.length} dari 3 gambar
                  </span>
                </div>

                {/* Modern Soft Dropzone */}
                {selectedFiles.length < 3 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '1.5px dashed var(--border-subtle, #cbd5e1)',
                      borderRadius: '16px',
                      padding: '1.85rem 1.5rem',
                      textAlign: 'center',
                      background: 'var(--bg-canvas-subtle, #f8fafc)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease, background 0.2s ease',
                      marginBottom: selectedFiles.length > 0 ? '1rem' : 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary, #2563eb)';
                      e.currentTarget.style.background = 'var(--accent-primary-light, #eff6ff)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle, #cbd5e1)';
                      e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f8fafc)';
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileChange({ target: { files: e.dataTransfer.files } });
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'var(--accent-primary-light, #eff6ff)',
                      color: 'var(--accent-primary, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                      border: '1px solid var(--accent-primary-border, #bfdbfe)'
                    }}>
                      <UploadSimple size={22} weight="bold" />
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                      Pilih atau Seret Gambar Screenshot ke Sini
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                      Format file JPG, JPEG, atau PNG (Maksimal 2 MB per file)
                    </div>
                  </div>
                )}

                {fileError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.76rem',
                    color: '#ef4444',
                    marginTop: '8px',
                    background: '#fef2f2',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <WarningCircle size={15} weight="bold" />
                    <span>{fileError}</span>
                  </div>
                )}

                {/* Previews with Image Thumbnails */}
                {selectedFiles.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem', marginTop: '0.75rem' }}>
                    {selectedFiles.map((f, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--border-subtle, #e2e8f0)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: 'var(--bg-surface-card, #ffffff)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ height: '120px', background: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
                          <img
                            src={f.preview}
                            alt={f.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>{f.size}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            style={{
                              background: '#fee2e2',
                              border: 'none',
                              color: '#ef4444',
                              width: '26px',
                              height: '26px',
                              borderRadius: '7px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                            title="Hapus gambar ini"
                          >
                            <Trash size={13} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && (
                <div style={{
                  padding: '0.85rem 1.15rem',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.84rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <WarningCircle size={18} weight="fill" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* 6. TOMBOL SUBMIT DENGAN FEEDBACK RAMAH */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderTop: '1px solid var(--border-card, #eef2f6)',
                paddingTop: '1.25rem'
              }}>
                <button
                  type="button"
                  onClick={handleResetForm}
                  disabled={isSubmitting}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary, #64748b)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.5rem 0.75rem'
                  }}
                >
                  Bersihkan Form
                </button>

                <button
                  type="submit"
                  className="clone-btn-primary"
                  disabled={isSubmitting}
                  style={{
                    minWidth: '160px',
                    height: '44px',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="clone-spinner" style={{ width: '16px', height: '16px' }} />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Bug size={17} weight="bold" />
                      <span>Kirim Laporan</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </>
      )}

      {/* ================= TAB 2: LAPORAN SAYA (RIWAYAT PENGGUNA) ================= */}
      {activeTab === 'riwayat' && (
        <div style={{
          background: 'var(--bg-surface-card, #ffffff)',
          border: '1px solid var(--border-card, #eef2f6)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)'
        }}>
          {/* Header Riwayat */}
          <div style={{
            padding: '1.4rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'var(--bg-canvas-subtle, #f8fafc)'
          }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0 }}>
                Riwayat Laporan Masalah Saya
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', margin: '3px 0 0 0' }}>
                Pantau progres tindak lanjut kendala yang telah Anda laporkan kepada tim Admin.
              </p>
            </div>
            <div style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--accent-primary, #2563eb)',
              background: 'var(--accent-primary-light, #eff6ff)',
              padding: '4px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--accent-primary-border, #bfdbfe)'
            }}>
              {myReports.length} Laporan Diajukan
            </div>
          </div>

          {loadingReports ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
              <div className="clone-spinner" style={{ margin: '0 auto 0.75rem', width: '28px', height: '28px' }} />
              <p style={{ fontSize: '0.85rem' }}>Memuat riwayat laporan...</p>
            </div>
          ) : myReports.length === 0 ? (
            /* Friendly Empty State with Soft-Skill Reassurance */
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-canvas-muted, #f1f5f9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--text-muted, #94a3b8)'
              }}>
                <Bug size={30} weight="duotone" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 6px 0' }}>
                Belum Ada Laporan
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)', maxWidth: '400px', margin: '0 auto 1.75rem', lineHeight: 1.55 }}>
                Anda belum mengirim laporan masalah. Jika sewaktu-waktu Anda menemukan kendala saat bertransaksi, kami siap membantu menanganinya.
              </p>
              <button
                type="button"
                className="clone-btn-primary"
                onClick={() => { setActiveTab('form'); handleResetForm(); }}
                style={{
                  padding: '0.65rem 1.4rem',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700
                }}
              >
                <PlusCircle size={16} weight="bold" />
                <span>Buat Laporan Baru</span>
              </button>
            </div>
          ) : (
            <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {myReports.map((item) => {
                const isNew = item.status === 'new';
                const isProgress = item.status === 'in_progress';
                const isResolved = item.status === 'resolved';
                const isRejected = item.status === 'rejected';

                const statusColor = isResolved ? '#059669' : isProgress ? '#4f46e5' : isRejected ? '#e11d48' : '#0284c7';
                const statusBg = isResolved ? '#ecfdf5' : isProgress ? '#eef2ff' : isRejected ? '#fff1f2' : '#f0f9ff';
                const statusBorder = isResolved ? '#a7f3d0' : isProgress ? '#c7d2fe' : isRejected ? '#fecdd3' : '#bae6fd';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReportDetail(item)}
                    style={{
                      padding: '1.15rem 1.35rem',
                      background: 'var(--bg-surface-card, #ffffff)',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary-border, #bfdbfe)';
                      e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(15, 23, 42, 0.06)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle, #e2e8f0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px', flex: '1 1 340px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: statusBg,
                        color: statusColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: `1px solid ${statusBorder}`
                      }}>
                        <Bug size={22} weight="bold" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: 'var(--accent-primary, #2563eb)',
                            background: 'var(--accent-primary-light, #eff6ff)',
                            padding: '1px 7px',
                            borderRadius: '5px'
                          }}>
                            {item.report_number}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 9px',
                            borderRadius: '9999px',
                            background: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusBorder}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor }} />
                            <span>{getStatusLabel(item.status)}</span>
                          </span>

                          {item.admin_note && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: '#059669',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              padding: '1px 8px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <ChatCircleDots size={12} weight="bold" />
                              <span>Ada Tanggapan Admin</span>
                            </span>
                          )}
                        </div>

                        <h4 style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: 'var(--text-primary, #0f172a)',
                          margin: '3px 0'
                        }}>
                          {item.title}
                        </h4>

                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #64748b)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <span>Kategori: <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{getCategoryLabel(item.category)}</strong></span>
                          <span>•</span>
                          <span>Halaman: <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{getPageLabel(item.page)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)' }}>
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <button
                        type="button"
                        className="clone-btn-secondary"
                        style={{
                          padding: '0.45rem 0.95rem',
                          fontSize: '0.78rem',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReportDetail(item);
                        }}
                      >
                        <Eye size={14} weight="bold" />
                        <span>Lihat Detail</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL DETAIL LAPORAN PENGGUNA (ELEVATED & SOFT) ================= */}
      {selectedReportDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            background: 'var(--bg-surface-card, #ffffff)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
            border: '1px solid var(--border-card, #eef2f6)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.4rem 1.6rem',
              borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-canvas-subtle, #f8fafc)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 800,
                    fontSize: '0.98rem',
                    color: 'var(--accent-primary, #2563eb)'
                  }}>
                    {selectedReportDetail.report_number}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: '9999px',
                    background: selectedReportDetail.status === 'resolved' ? '#ecfdf5' : selectedReportDetail.status === 'in_progress' ? '#eef2ff' : selectedReportDetail.status === 'rejected' ? '#fff1f2' : '#f0f9ff',
                    color: selectedReportDetail.status === 'resolved' ? '#059669' : selectedReportDetail.status === 'in_progress' ? '#4f46e5' : selectedReportDetail.status === 'rejected' ? '#e11d48' : '#0284c7',
                    border: `1px solid ${selectedReportDetail.status === 'resolved' ? '#a7f3d0' : selectedReportDetail.status === 'in_progress' ? '#c7d2fe' : selectedReportDetail.status === 'rejected' ? '#fecdd3' : '#bae6fd'}`
                  }}>
                    {getStatusLabel(selectedReportDetail.status)}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                  Dilaporkan pada {new Date(selectedReportDetail.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportDetail(null)}
                style={{
                  background: 'var(--bg-canvas-muted, #f1f5f9)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary, #64748b)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={17} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.6rem' }}>
              
              {/* Meta Grid 3 Columns */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.85rem',
                marginBottom: '1.5rem',
                background: 'var(--bg-canvas-subtle, #f8fafc)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                fontSize: '0.78rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Jenis</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '2px' }}>
                    {getCategoryLabel(selectedReportDetail.category)}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Halaman</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '2px' }}>
                    {getPageLabel(selectedReportDetail.page)}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Dampak</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '2px' }}>
                    {getImpactLabel(selectedReportDetail.impact)}
                  </div>
                </div>
              </div>

              {/* Judul Masalah */}
              <div style={{ marginBottom: '1.15rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Judul Masalah
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '4px 0 0 0' }}>
                  {selectedReportDetail.title}
                </h4>
              </div>

              {/* Deskripsi Masalah */}
              <div style={{ marginBottom: '1.4rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Deskripsi Kendala
                </span>
                <p style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-primary, #0f172a)',
                  margin: '6px 0 0 0',
                  lineHeight: 1.6,
                  background: 'var(--bg-canvas-subtle, #f8fafc)',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedReportDetail.description}
                </p>
              </div>

              {/* Screenshots Gallery */}
              {selectedReportDetail.attachments && selectedReportDetail.attachments.length > 0 && (
                <div style={{ marginBottom: '1.4rem' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Lampiran Screenshot ({selectedReportDetail.attachments.length})
                  </span>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '8px', flexWrap: 'wrap' }}>
                    {selectedReportDetail.attachments.map((att, aIdx) => (
                      <div
                        key={aIdx}
                        onClick={() => setLightboxImage(att.file_path)}
                        style={{
                          width: '100px',
                          height: '75px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          cursor: 'pointer',
                          background: '#f1f5f9',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                        }}
                        title="Klik untuk memperbesar"
                      >
                        <img
                          src={att.file_path}
                          alt={att.file_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan Admin dengan Gaya Reassuring */}
              {selectedReportDetail.admin_note ? (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: 800, fontSize: '0.82rem', marginBottom: '4px' }}>
                    <ChatCircleDots size={18} weight="bold" />
                    <span>Catatan Tindak Lanjut dari Tim Admin:</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#047857', margin: 0, lineHeight: 1.55 }}>
                    {selectedReportDetail.admin_note}
                  </p>
                </div>
              ) : (
                <div style={{
                  background: 'var(--bg-canvas-subtle, #f8fafc)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary, #64748b)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Clock size={16} weight="regular" color="var(--text-muted, #94a3b8)" />
                  <span>Tim kami sedang mengkaji laporan ini. Catatan admin akan tampil di sini saat ada pembaruan status.</span>
                </div>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="clone-btn-primary"
                  onClick={() => setSelectedReportDetail(null)}
                  style={{ width: '100%', height: '42px', justifyContent: 'center', borderRadius: '10px', fontWeight: 700 }}
                >
                  Tutup Detail
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX IMAGE MODAL ================= */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={lightboxImage}
            alt="Screenshot Preview"
            style={{ maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}

    </div>
  );
}
