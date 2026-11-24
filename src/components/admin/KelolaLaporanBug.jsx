import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bug, 
  CheckCircle, 
  Clock, 
  X, 
  Eye, 
  MagnifyingGlass, 
  Funnel, 
  ArrowsClockwise, 
  ShieldCheck, 
  Image, 
  ChatCircleDots, 
  WarningCircle, 
  User, 
  Envelope, 
  ArrowUpRight,
  ArrowsDownUp,
  XCircle,
  FileText
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
  updateBugReportStatusInSupabase,
  subscribeBugReports
} from '../../lib/bugReportService';
import { supabase } from '../../lib/supabaseClient';

export default function KelolaLaporanBug() {
  // Reports State
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Admin User Profile — hanya jika role=admin, tanpa seed (cegah identitas basi).
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const roleStored = localStorage.getItem('agriconnect_auth_user_admin');
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
      if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'admin')) return parsed;
    } catch (e) {}
    return {
      id: null,
      fullName: 'Admin Utama TaniNiaga',
      email: 'admin@taniniaga.id',
      role: 'admin'
    };
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAdminUser(prev => ({
          ...prev,
          id: user.id,
          email: user.email || prev.email,
          fullName: user.user_metadata?.full_name || prev.fullName
        }));
      }
    }).catch(err => console.warn('[KelolaLaporanBug] Auth check:', err));
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [impactFilter, setImpactFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'

  // Modals State
  const [selectedReport, setSelectedReport] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // Status Update & Admin Note State inside detail modal
  const [pendingStatus, setPendingStatus] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Load all reports
  const loadReports = async () => {
    try {
      const { data } = await fetchBugReportsFromSupabase({ role: 'admin' });
      if (data) {
        setReports(data);
      }
    } catch (err) {
      console.warn('Gagal memuat laporan bug:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    const unsub = subscribeBugReports(() => {
      loadReports();
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Summary KPI Metrics (Dynamic)
  const metrics = useMemo(() => {
    const total = reports.length;
    const newCount = reports.filter(r => r.status === 'new').length;
    const inProgressCount = reports.filter(r => r.status === 'in_progress').length;
    const resolvedCount = reports.filter(r => r.status === 'resolved').length;
    const rejectedCount = reports.filter(r => r.status === 'rejected').length;

    return { total, newCount, inProgressCount, resolvedCount, rejectedCount };
  }, [reports]);

  // Filtered & Sorted Reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // 1. Status Filter
      if (statusFilter !== 'Semua' && r.status !== statusFilter) return false;

      // 2. Category Filter
      if (categoryFilter !== 'Semua' && r.category !== categoryFilter) return false;

      // 3. Impact Filter
      if (impactFilter !== 'Semua' && r.impact !== impactFilter) return false;

      // 4. Search Filter
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchNum = (r.report_number || '').toLowerCase().includes(q);
        const matchTitle = (r.title || '').toLowerCase().includes(q);
        const matchDesc = (r.description || '').toLowerCase().includes(q);
        const matchUser = (r.user_name || '').toLowerCase().includes(q);
        if (!matchNum && !matchTitle && !matchDesc && !matchUser) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [reports, statusFilter, categoryFilter, impactFilter, searchQuery, sortBy]);

  // Open Detail Modal
  const handleOpenDetail = (report) => {
    setSelectedReport(report);
    setPendingStatus(report.status);
    setAdminNoteInput(report.admin_note || '');
  };

  // Trigger Confirmation Modal for Status Change
  const handleInitiateStatusChange = (newSt) => {
    setPendingStatus(newSt);
    setConfirmModalOpen(true);
  };

  // Confirm Status & Note Update
  const handleConfirmUpdate = async () => {
    if (!selectedReport) return;
    setIsUpdating(true);

    try {
      const { data } = await updateBugReportStatusInSupabase(
        selectedReport.id,
        pendingStatus,
        adminNoteInput,
        adminUser.id
      );

      if (data) {
        setSelectedReport(data);
        setReports(prev => prev.map(r => r.id === data.id ? data : r));
      }

      setConfirmModalOpen(false);
      showToast('Status laporan berhasil diperbarui.');
      loadReports();
    } catch (err) {
      console.error('Error updating report status:', err);
      alert('Gagal memperbarui status: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Save Note Only without status change
  const handleSaveNoteOnly = async () => {
    if (!selectedReport) return;
    setIsUpdating(true);
    try {
      const { data } = await updateBugReportStatusInSupabase(
        selectedReport.id,
        selectedReport.status,
        adminNoteInput,
        adminUser.id
      );
      if (data) {
        setSelectedReport(data);
        setReports(prev => prev.map(r => r.id === data.id ? data : r));
      }
      showToast('Catatan admin berhasil disimpan.');
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="clone-dashboard-content">

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#065f46',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '12px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          fontWeight: 700,
          border: '1px solid #059669'
        }}>
          <CheckCircle size={20} weight="fill" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
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
            <span>Laporan Bug</span>
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary, #475569)',
            margin: 0,
            lineHeight: 1.55
          }}>
            Kelola dan tindak lanjuti laporan masalah yang dikirim oleh pengguna.
          </p>
        </div>

        <button
          type="button"
          className="clone-btn-secondary"
          onClick={loadReports}
          title="Segarkan Data"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '10px',
            padding: '0.55rem 1rem',
            fontSize: '0.82rem',
            fontWeight: 600
          }}
        >
          <ArrowsClockwise size={16} weight="bold" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* ================= 1. STATISTIK LAPORAN (SUMMARY CARDS ELEGAN & SOFT) ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.15rem',
        marginBottom: '1.75rem'
      }}>
        {/* Total Laporan */}
        <div style={{
          background: 'var(--bg-surface-card, #ffffff)',
          border: '1px solid var(--border-card, #eef2f6)',
          borderRadius: '16px',
          padding: '1.25rem 1.4rem',
          boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Laporan
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-canvas-muted, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary, #64748b)' }}>
              <FileText size={17} weight="bold" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '8px', letterSpacing: '-0.02em' }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
            Semua kendala masuk
          </div>
        </div>

        {/* Baru */}
        <div style={{
          background: 'var(--bg-surface-card, #ffffff)',
          border: '1px solid #bae6fd',
          borderRadius: '16px',
          padding: '1.25rem 1.4rem',
          boxShadow: '0 2px 10px -2px rgba(2, 132, 199, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Baru
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '9999px' }}>
              Perlu Review
            </span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7', marginTop: '8px', letterSpacing: '-0.02em' }}>
            {metrics.newCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #64748b)', marginTop: '4px' }}>
            Menunggu pemeriksaan
          </div>
        </div>

        {/* Diproses */}
        <div style={{
          background: 'var(--bg-surface-card, #ffffff)',
          border: '1px solid #c7d2fe',
          borderRadius: '16px',
          padding: '1.25rem 1.4rem',
          boxShadow: '0 2px 10px -2px rgba(79, 70, 229, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Diproses
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '2px 8px', borderRadius: '9999px' }}>
              Dalam Pengerjaan
            </span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4f46e5', marginTop: '8px', letterSpacing: '-0.02em' }}>
            {metrics.inProgressCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #64748b)', marginTop: '4px' }}>
            Dalam investigasi/fix
          </div>
        </div>

        {/* Selesai */}
        <div style={{
          background: 'var(--bg-surface-card, #ffffff)',
          border: '1px solid #a7f3d0',
          borderRadius: '16px',
          padding: '1.25rem 1.4rem',
          boxShadow: '0 2px 10px -2px rgba(16, 185, 129, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Selesai
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '9999px' }}>
              Tuntas
            </span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', marginTop: '8px', letterSpacing: '-0.02em' }}>
            {metrics.resolvedCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #64748b)', marginTop: '4px' }}>
            Berhasil ditangani
          </div>
        </div>
      </div>

      {/* ================= 2. FILTER & PENCARIAN LAPORAN ================= */}
      <div style={{
        background: 'var(--bg-surface-card, #ffffff)',
        border: '1px solid var(--border-card, #eef2f6)',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.02)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <MagnifyingGlass size={16} color="var(--text-muted, #94a3b8)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="clone-input"
              placeholder="Cari nomor laporan, pelapor, atau judul masalah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.3rem',
                height: '42px',
                fontSize: '0.84rem',
                borderRadius: '10px'
              }}
            />
          </div>

          {/* Filter Status */}
          <div>
            <select
              className="clone-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', height: '42px', fontSize: '0.82rem', borderRadius: '10px', padding: '0 0.85rem', cursor: 'pointer' }}
            >
              <option value="Semua">Status: Semua</option>
              {BUG_STATUSES.map(s => (
                <option key={s.value} value={s.value}>Status: {s.label}</option>
              ))}
            </select>
          </div>

          {/* Filter Jenis */}
          <div>
            <select
              className="clone-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '100%', height: '42px', fontSize: '0.82rem', borderRadius: '10px', padding: '0 0.85rem', cursor: 'pointer' }}
            >
              <option value="Semua">Jenis: Semua</option>
              {BUG_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>Jenis: {c.label}</option>
              ))}
            </select>
          </div>

          {/* Filter Dampak */}
          <div>
            <select
              className="clone-input"
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
              style={{ width: '100%', height: '42px', fontSize: '0.82rem', borderRadius: '10px', padding: '0 0.85rem', cursor: 'pointer' }}
            >
              <option value="Semua">Dampak: Semua</option>
              {BUG_IMPACTS.map(i => (
                <option key={i.value} value={i.value}>Dampak: {i.label}</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              className="clone-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%', height: '42px', fontSize: '0.82rem', borderRadius: '10px', padding: '0 0.85rem', cursor: 'pointer' }}
            >
              <option value="newest">Urutan: Terbaru</option>
              <option value="oldest">Urutan: Terlama</option>
            </select>
          </div>

        </div>
      </div>

      {/* ================= 3. TABLE LAPORAN BUG ================= */}
      <div style={{
        background: 'var(--bg-surface-card, #ffffff)',
        border: '1px solid var(--border-card, #eef2f6)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{
          padding: '1.25rem 1.6rem',
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
              Daftar Laporan Masalah
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', margin: '3px 0 0 0' }}>
              Klik tombol "Lihat Detail" untuk memeriksa kendala, screenshot, dan mengubah status penanganan.
            </p>
          </div>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
            Menampilkan {filteredReports.length} Laporan
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
            <div className="clone-spinner" style={{ margin: '0 auto 0.75rem', width: '28px', height: '28px' }} />
            <p style={{ fontSize: '0.85rem' }}>Memuat daftar laporan bug...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#94a3b8' }}>
              <Bug size={28} weight="bold" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
              Belum Ada Laporan
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
              Belum ada laporan bug yang dikirim oleh pengguna sesuai filter yang dipilih.
            </p>
            {(statusFilter !== 'Semua' || categoryFilter !== 'Semua' || impactFilter !== 'Semua' || searchQuery) && (
              <button
                type="button"
                className="clone-btn-secondary"
                onClick={() => { setStatusFilter('Semua'); setCategoryFilter('Semua'); setImpactFilter('Semua'); setSearchQuery(''); }}
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{
                  background: 'var(--bg-canvas-subtle, #f8fafc)',
                  borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                  color: 'var(--text-secondary, #64748b)',
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '0.95rem 1.4rem' }}>No. Laporan</th>
                  <th style={{ padding: '0.95rem 1rem' }}>Pelapor</th>
                  <th style={{ padding: '0.95rem 1rem' }}>Peran</th>
                  <th style={{ padding: '0.95rem 1rem' }}>Jenis</th>
                  <th style={{ padding: '0.95rem 1rem' }}>Judul</th>
                  <th style={{ padding: '0.95rem 1rem' }}>Halaman</th>
                  <th style={{ padding: '0.95rem 1rem' }}>Dampak</th>
                  <th style={{ padding: '0.95rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.95rem 1rem' }}>Tanggal</th>
                  <th style={{ padding: '0.95rem 1.4rem', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((item, idx) => {
                  const isNew = item.status === 'new';
                  const isProgress = item.status === 'in_progress';
                  const isResolved = item.status === 'resolved';
                  const isRejected = item.status === 'rejected';

                  const statusColor = isResolved ? '#059669' : isProgress ? '#4f46e5' : isRejected ? '#e11d48' : '#0284c7';
                  const statusBg = isResolved ? '#ecfdf5' : isProgress ? '#eef2ff' : isRejected ? '#fff1f2' : '#f0f9ff';
                  const statusBorder = isResolved ? '#a7f3d0' : isProgress ? '#c7d2fe' : isRejected ? '#fecdd3' : '#bae6fd';

                  const isHigh = item.impact === 'high';
                  const isLow = item.impact === 'low';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: idx < filteredReports.length - 1 ? '1px solid var(--border-subtle, #f1f5f9)' : 'none',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f8fafc)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.4rem' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: 'var(--accent-primary, #2563eb)',
                          background: 'var(--accent-primary-light, #eff6ff)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--accent-primary-border, #bfdbfe)'
                        }}>
                          {item.report_number}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                        {item.user_name}
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: item.user_role === 'petani' ? '#ecfdf5' : '#eff6ff',
                          color: item.user_role === 'petani' ? '#059669' : '#2563eb',
                          border: `1px solid ${item.user_role === 'petani' ? '#a7f3d0' : '#bfdbfe'}`,
                          textTransform: 'capitalize'
                        }}>
                          {item.user_role === 'petani' ? '🌾 Petani' : '🏢 Pembeli'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary, #475569)', fontWeight: 600 }}>
                        {getCategoryLabel(item.category)}
                      </td>

                      <td style={{ padding: '1rem 1rem', maxWidth: '240px' }}>
                        <div style={{
                          fontWeight: 700,
                          color: 'var(--text-primary, #0f172a)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={item.title}>
                          {item.title}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1rem', color: 'var(--text-secondary, #64748b)' }}>
                        {getPageLabel(item.page)}
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isHigh ? '#fff7ed' : isLow ? '#f8fafc' : '#fffbeb',
                          color: isHigh ? '#ea580c' : isLow ? '#64748b' : '#d97706',
                          border: `1px solid ${isHigh ? '#ffedd5' : isLow ? '#e2e8f0' : '#fde68a'}`
                        }}>
                          {getImpactLabel(item.impact)}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1rem' }}>
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
                      </td>

                      <td style={{ padding: '1rem 1rem', color: 'var(--text-muted, #94a3b8)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      <td style={{ padding: '1rem 1.4rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="clone-btn-secondary"
                          style={{
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.76rem',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onClick={() => handleOpenDetail(item)}
                        >
                          <Eye size={14} weight="bold" />
                          <span>Lihat Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= 5. DETAIL LAPORAN ADMIN MODAL (ELEVATED & SOFT) ================= */}
      {selectedReport && (
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
            maxWidth: '720px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
            border: '1px solid var(--border-card, #eef2f6)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.4rem 1.75rem',
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
                    fontSize: '1.1rem',
                    color: 'var(--accent-primary, #2563eb)'
                  }}>
                    {selectedReport.report_number}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: '9999px',
                    background: selectedReport.status === 'resolved' ? '#ecfdf5' : selectedReport.status === 'in_progress' ? '#eef2ff' : selectedReport.status === 'rejected' ? '#fff1f2' : '#f0f9ff',
                    color: selectedReport.status === 'resolved' ? '#059669' : selectedReport.status === 'in_progress' ? '#4f46e5' : selectedReport.status === 'rejected' ? '#e11d48' : '#0284c7',
                    border: `1px solid ${selectedReport.status === 'resolved' ? '#a7f3d0' : selectedReport.status === 'in_progress' ? '#c7d2fe' : selectedReport.status === 'rejected' ? '#fecdd3' : '#bae6fd'}`
                  }}>
                    {getStatusLabel(selectedReport.status)}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                  Laporan diterima: {new Date(selectedReport.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WITA
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
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
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem' }}>

              {/* INFORMASI PELAPOR (READ-ONLY WITH REASSURING CARD) */}
              <div style={{
                background: 'linear-gradient(135deg, var(--bg-canvas-subtle, #f8fafc) 0%, #f1f5f9 100%)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                borderRadius: '14px',
                padding: '1.15rem 1.4rem',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Nama Pelapor
                  </span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '2px' }}>
                    {selectedReport.user_name}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Email Kontak
                  </span>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginTop: '2px' }}>
                    {selectedReport.user_email}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Peran Akun
                  </span>
                  <div style={{ marginTop: '2px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: selectedReport.user_role === 'petani' ? '#ecfdf5' : '#eff6ff',
                      color: selectedReport.user_role === 'petani' ? '#059669' : '#2563eb',
                      border: `1px solid ${selectedReport.user_role === 'petani' ? '#a7f3d0' : '#bfdbfe'}`
                    }}>
                      {selectedReport.user_role === 'petani' ? '🌾 Petani' : '🏢 Pembeli'}
                    </span>
                  </div>
                </div>
              </div>

              {/* DETAIL MASALAH META GRID */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.85rem',
                marginBottom: '1.4rem',
                background: 'var(--bg-canvas-subtle, #f8fafc)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                padding: '0.95rem',
                borderRadius: '12px',
                fontSize: '0.78rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Jenis Masalah</span>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '2px' }}>
                    {getCategoryLabel(selectedReport.category)}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Halaman Terjadinya</span>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginTop: '2px' }}>
                    {getPageLabel(selectedReport.page)}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Tingkat Dampak</span>
                  <div style={{ fontWeight: 800, color: selectedReport.impact === 'high' ? '#ea580c' : 'var(--text-primary, #0f172a)', marginTop: '2px' }}>
                    {getImpactLabel(selectedReport.impact)}
                  </div>
                </div>
              </div>

              {/* Judul & Deskripsi Masalah */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Judul Masalah
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '4px 0 0 0' }}>
                  {selectedReport.title}
                </h3>
              </div>

              <div style={{ marginBottom: '1.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Deskripsi Kendala yang Dialami Pengguna
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
                  {selectedReport.description}
                </p>
              </div>

              {/* SCREENSHOT GALLERY */}
              <div style={{ marginBottom: '1.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Lampiran Screenshot
                </span>
                {selectedReport.attachments && selectedReport.attachments.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.85rem', marginTop: '8px', flexWrap: 'wrap' }}>
                    {selectedReport.attachments.map((att, aIdx) => (
                      <div
                        key={aIdx}
                        onClick={() => setLightboxImage(att.file_path)}
                        style={{
                          width: '120px',
                          height: '85px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          cursor: 'pointer',
                          background: '#f1f5f9',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title={`Klik untuk memperbesar: ${att.file_name}`}
                      >
                        <img
                          src={att.file_path}
                          alt={att.file_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic', margin: '6px 0 0 0' }}>
                    Tidak ada screenshot yang dilampirkan oleh pelapor.
                  </p>
                )}
              </div>

              {/* ================= 6. CATATAN ADMIN DENGAN QUICK SNIPPETS ================= */}
              <div style={{
                background: 'var(--bg-canvas-subtle, #f8fafc)',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', textTransform: 'uppercase' }}>
                    Catatan & Penanganan Admin
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveNoteOnly}
                    disabled={isUpdating}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary, #2563eb)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Simpan Catatan Saja
                  </button>
                </div>

                {/* Quick Soft-Skill Snippet Helpers */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {[
                    'Kendala telah diverifikasi dan sedang ditangani oleh tim teknis.',
                    'Perbaikan telah dirilis, silakan muat ulang halaman.',
                    'Mohon kirimkan detail informasi transaksi terkait.'
                  ].map((snip, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setAdminNoteInput(snip)}
                      style={{
                        background: 'var(--bg-surface-card, #ffffff)',
                        border: '1px solid var(--border-subtle, #e2e8f0)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary, #64748b)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary-border, #bfdbfe)';
                        e.currentTarget.style.color = 'var(--accent-primary, #2563eb)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle, #e2e8f0)';
                        e.currentTarget.style.color = 'var(--text-secondary, #64748b)';
                      }}
                    >
                      + {snip.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                <textarea
                  className="clone-input"
                  rows={3}
                  placeholder="Tambahkan catatan terkait penanganan laporan..."
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    fontSize: '0.84rem',
                    borderRadius: '10px',
                    lineHeight: 1.5,
                    padding: '0.75rem 1rem'
                  }}
                />
              </div>

              {/* ================= 7. PERUBAHAN STATUS (SEGMENTED BUTTONS) ================= */}
              <div style={{
                background: 'var(--bg-canvas-subtle, #f8fafc)',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle, #e2e8f0)'
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
                  Perbarui Status Laporan:
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                  {[
                    { key: 'new', label: 'Baru', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
                    { key: 'in_progress', label: 'Diproses', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
                    { key: 'resolved', label: 'Selesai', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
                    { key: 'rejected', label: 'Ditolak', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' }
                  ].map((st) => {
                    const isCurrent = selectedReport.status === st.key;
                    return (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => handleInitiateStatusChange(st.key)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: isCurrent ? `2px solid ${st.color}` : '1px solid var(--border-subtle, #e2e8f0)',
                          background: isCurrent ? st.bg : 'var(--bg-surface-card, #ffffff)',
                          color: isCurrent ? st.color : 'var(--text-secondary, #64748b)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isCurrent ? st.color : '#cbd5e1' }} />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.15rem 1.75rem',
              borderTop: '1px solid var(--border-subtle, #f1f5f9)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'var(--bg-canvas-subtle, #f8fafc)'
            }}>
              <button
                type="button"
                className="clone-btn-secondary"
                onClick={() => setSelectedReport(null)}
                style={{ borderRadius: '10px', padding: '0.55rem 1.25rem', fontWeight: 600 }}
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= 8. VALIDASI STATUS: CONFIRMATION MODAL ================= */}
      {confirmModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            background: 'var(--bg-surface-card, #ffffff)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '440px',
            padding: '2rem 1.75rem',
            textAlign: 'center',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-card, #eef2f6)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: pendingStatus === 'resolved' ? '#ecfdf5' : pendingStatus === 'rejected' ? '#fff1f2' : '#eff6ff',
              color: pendingStatus === 'resolved' ? '#10b981' : pendingStatus === 'rejected' ? '#ef4444' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <WarningCircle size={30} weight="fill" />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 6px 0' }}>
              Ubah Status Laporan?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #475569)', margin: '0 0 1.75rem 0', lineHeight: 1.55 }}>
              Status laporan <strong style={{ color: 'var(--accent-primary, #2563eb)' }}>{selectedReport?.report_number}</strong> akan diubah menjadi{' '}
              <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{getStatusLabel(pendingStatus)}</strong>.
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="clone-btn-secondary"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isUpdating}
                style={{ flex: 1, height: '42px', borderRadius: '10px', fontWeight: 600 }}
              >
                Batal
              </button>
              <button
                type="button"
                className="clone-btn-primary"
                onClick={handleConfirmUpdate}
                disabled={isUpdating}
                style={{ flex: 1, height: '42px', borderRadius: '10px', fontWeight: 700, justifyContent: 'center' }}
              >
                {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
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
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={lightboxImage}
            alt="Screenshot Zoom"
            style={{ maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}

    </div>
  );
}
