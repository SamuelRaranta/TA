import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle,
  Clock,
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  X
} from '@phosphor-icons/react';
import PillSearchBar from '../common/PillSearchBar';
import { supabase } from '../../lib/supabaseClient';

const PAYMENT_DEADLINE_MS = 24 * 60 * 60 * 1000;
const isUuidLike = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v || '');

export default function FarmerTransactions({ transactions = [], onNavigate, isLoading = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [confirmBusyId, setConfirmBusyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 5;

  // Tick agar hitung mundur batas bayar tetap hidup
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNowTick(v => v + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // ===== Status terpadu (selaras halaman Pembayaran pembeli & Midtrans) =====
  const isPaidTrx = (t) => {
    if (['Selesai', 'Lunas', 'Pembayaran Berhasil', 'Diproses', 'Pelunasan'].includes(t.status)) return true;
    try {
      const n = t?.notes;
      const p = typeof n === 'string' && n.trim().startsWith('{')
        ? JSON.parse(n)
        : (n && typeof n === 'object' ? n : null);
      if (p?.paymentStatus === 'paid') return true;
    } catch (e) {}
    return false;
  };
  const isReceivedTrx = (t) => t.goodsStatus === 'diterima' || (t.status === 'Selesai' && t.goodsStatus !== 'belum_diterima');
  const isCancelledTrx = (t) => t.status === 'Dibatalkan';
  const trxDeadlineMs = (t) => {
    const created = t.createdAt ? new Date(t.createdAt).getTime() : NaN;
    return Number.isNaN(created) ? null : created + PAYMENT_DEADLINE_MS;
  };
  const trxRemainingSec = (t) => {
    const dl = trxDeadlineMs(t);
    if (dl === null) return null;
    return Math.max(0, Math.floor((dl - Date.now()) / 1000));
  };
  const isExpiredTrx = (t) => {
    if (isPaidTrx(t) || isCancelledTrx(t)) return false;
    const dl = trxDeadlineMs(t);
    return dl !== null && dl <= Date.now();
  };
  const displayStatus = (t) => {
    if (isCancelledTrx(t) || isExpiredTrx(t)) return 'Dibatalkan';
    if (isReceivedTrx(t)) return 'Selesai';
    return 'Berjalan';
  };
  const trxPayMethod = (t) => {
    if (t?.paymentMethod) return t.paymentMethod;
    if (t?.method) return t.method;
    try {
      const n = t?.notes;
      const p = typeof n === 'string' && n.trim().startsWith('{')
        ? JSON.parse(n)
        : (n && typeof n === 'object' ? n : null);
      if (p?.paymentMethod) return p.paymentMethod;
    } catch (e) {}
    if (t?.contract?.payment_method) return t.contract.payment_method;
    return 'Pembayaran Langsung';
  };
  const payBadge = (method) => {
    const m = String(method || '');
    if (/langsung/i.test(m)) return { label: 'Langsung', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' };
    if (/qris/i.test(m)) return { label: 'QRIS', bg: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' };
    if (/transfer|bank|va|escrow/i.test(m)) return { label: 'Bank', bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' };
    return { label: 'Langsung', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' };
  };
  const isDirectTrx = (t) => /langsung/i.test(String(trxPayMethod(t) || ''));
  const deadlineLabel = (t) => {
    const dl = trxDeadlineMs(t);
    if (dl === null) return '1 hari';
    return new Date(dl).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const remainingLabel = (t) => {
    const s = trxRemainingSec(t);
    if (s === null) return '1 hari';
    if (s <= 0) return 'Kedaluwarsa';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h >= 24) return `${Math.floor(h / 24)} hari`;
    if (h > 0) return `${h} jam ${m} mnt`;
    if (m > 0) return `${m} mnt`;
    return `${s} dtk`;
  };

  const statuses = ['Semua', 'Berjalan', 'Selesai', 'Dibatalkan'];

  const [localTrxList, setLocalTrxList] = useState(transactions);
  useEffect(() => {
    setLocalTrxList(transactions);
  }, [transactions]);

  const [confirmDirectModalTrx, setConfirmDirectModalTrx] = useState(null);

  const filteredTransactions = localTrxList.filter((trx) => {
    const matchesSearch =
      (trx.buyerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trx.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trx.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' ? true : displayStatus(trx) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, localTrxList]);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ROWS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedTransactions = filteredTransactions.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);
  const pageNumbers = (() => {
    let start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  })();

  // Konfirmasi dana pembayaran langsung sudah diterima -> status Selesai / Lunas (tersimpan di Supabase)
  const handleExecuteConfirmReceipt = async (trx) => {
    if (!trx) return;
    setConfirmBusyId(trx.id);
    try {
      // 1. Optimistic local update
      setLocalTrxList(prev => prev.map(t => (t.id === trx.id || t.transactionCode === trx.transactionCode) ? { ...t, status: 'Selesai', goodsStatus: 'diterima' } : t));

      // 2. Simpan status Selesai di Supabase
      const q = supabase.from('transactions').update({ status: 'Selesai', goods_status: 'diterima' });
      if (isUuidLike(trx.id)) await q.eq('id', trx.id);
      else if (isUuidLike(trx.dbId)) await q.eq('id', trx.dbId);
      else await q.eq('transaction_code', trx.id);

      setConfirmDirectModalTrx(null);
    } catch (err) {
      console.warn('Gagal konfirmasi penerimaan dana:', err);
    } finally {
      setConfirmBusyId(null);
    }
  };

  const paginationBtnStyle = (disabled) => ({
    minWidth: '34px',
    height: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
    borderRadius: '9px',
    border: '1px solid var(--border-subtle, #e8ecf1)',
    background: 'var(--card-bg, #ffffff)',
    color: disabled ? 'var(--text-muted, #b6c0cf)' : 'var(--text-secondary, #64748b)',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1
  });
  const paginationActiveStyle = {
    minWidth: '34px',
    height: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
    borderRadius: '9px',
    border: '1px solid #10b981',
    background: '#10b981',
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: 800,
    cursor: 'pointer'
  };

  return (
    <div className="farmer-transactions-view">
      
      {/* Page Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Transaksi</h1>
          <p className="farmer-page-sub">
            Pantau pembayaran masuk dari pembeli, batas waktu 1 hari, dan konfirmasi penerimaan dana langsung.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <PillSearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari pembeli / komoditas..."
          filterOptions={statuses}
          activeFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          filterTitle="Status Transaksi"
          style={{ width: '100%' }}
        />
        {statusFilter !== 'Semua' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
            <span className="pill-active-filter-badge" style={{ marginTop: 0 }}>
              {statusFilter}
              <button
                type="button"
                className="pill-active-filter-remove"
                onClick={() => setStatusFilter('Semua')}
                title="Hapus filter"
              >
                <X size={12} weight="bold" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Tabel Transaksi (selaras halaman Pembayaran pembeli) */}
      <div style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-subtle, #e8ecf1)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '1rem 1.25rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Daftar Transaksi Masuk</h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Pembeli, komoditas, total, pembayaran, batas waktu 1 hari, status, serta aksi.
            </p>
          </div>
          <span className="table-mobile-scroll-hint">↔ Geser tabel ke samping</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '980px' }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1.4fr 1fr 0.8fr 1fr 0.9fr 1.1fr',
              gap: '0.75rem',
              alignItems: 'center',
              padding: '0.6rem 1.25rem',
              background: 'var(--bg-canvas-subtle, #f6f8fb)',
              borderTop: '1px solid var(--border-subtle, #e8ecf1)',
              borderBottom: '1px solid var(--border-subtle, #e8ecf1)',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-secondary, #64748b)'
            }}>
              <span>Pembeli</span>
              <span>Komoditas</span>
              <span style={{ textAlign: 'right' }}>Total</span>
              <span>Pembayaran</span>
              <span>Batas Pembayaran</span>
              <span style={{ textAlign: 'center' }}>Status</span>
              <span style={{ textAlign: 'center' }}>Aksi</span>
            </div>

            {/* Body */}
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem 1.25rem' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="agri-skeleton-pulse" style={{ height: '52px', borderRadius: '8px' }} />
                ))}
              </div>
            ) : pagedTransactions.length > 0 ? (
              pagedTransactions.map((trx) => {
                const st = displayStatus(trx);
                const pay = payBadge(trxPayMethod(trx));
                const direct = isDirectTrx(trx);
                const secs = trxRemainingSec(trx);
                const urgent = st === 'Berjalan' && secs !== null && secs < 6 * 3600;
                const buyerName = trx.buyerName || 'Perusahaan Mitra';
                const avatarLetter = (buyerName.charAt(0) || 'P').toUpperCase();
                const busy = confirmBusyId === trx.id;

                return (
                  <div
                    key={trx.id}
                    onClick={() => setSelectedTrx(trx)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1.4fr 1fr 0.8fr 1fr 0.9fr 1.1fr',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.7rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle, #eef1f6)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f8fafc)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={`Lihat rincian transaksi ${buyerName}`}
                  >
                    {/* Pembeli: profil + nama saja */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      {trx.buyerAvatar ? (
                        <img
                          src={trx.buyerAvatar}
                          alt={buyerName}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                        />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #5452f6, #7c3aed)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                          {avatarLetter}
                        </div>
                      )}
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {buyerName}
                      </div>
                    </div>

                    {/* Komoditas */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {trx.productName || trx.commodityName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {trx.category} • {trx.volumeTon} Ton
                      </div>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.84rem', color: '#059669', whiteSpace: 'nowrap' }}>
                      + Rp {(trx.amount || 0).toLocaleString('id-ID')}
                    </div>

                    {/* Pembayaran */}
                    <div>
                      <span
                        title={trxPayMethod(trx)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.24rem 0.6rem',
                          borderRadius: '7px',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          background: pay.bg,
                          color: pay.color,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {pay.label}
                      </span>
                    </div>

                    {/* Batas Pembayaran (1 hari) */}
                    <div style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: st === 'Berjalan' && urgent ? '#b91c1c' : 'var(--text-primary)', fontWeight: st === 'Berjalan' && urgent ? 800 : 600 }}>
                      {isPaidTrx(trx) ? (
                        <span style={{ color: '#059669', fontWeight: 700 }}>Lunas</span>
                      ) : st === 'Dibatalkan' ? (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <span>{remainingLabel(trx)}</span>
                      )}
                      {st === 'Berjalan' && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          s/d {deadlineLabel(trx)}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '0.24rem 0.65rem',
                          borderRadius: '7px',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          background: st === 'Selesai'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : st === 'Berjalan'
                            ? 'rgba(59, 130, 246, 0.12)'
                            : 'rgba(239, 68, 68, 0.10)',
                          color: st === 'Selesai' ? '#059669' : st === 'Berjalan' ? '#2563eb' : '#dc2626',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {st === 'Selesai' && <CheckCircle size={12} weight="fill" />}
                        {st === 'Berjalan' && <Clock size={12} weight="bold" />}
                        {st === 'Dibatalkan' && <X size={12} weight="bold" />}
                        <span>{st}</span>
                      </span>
                    </div>

                    {/* Aksi */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                      {st === 'Berjalan' && direct ? (
                        <button
                          type="button"
                          onClick={() => setConfirmDirectModalTrx(trx)}
                          disabled={busy}
                          title="Konfirmasi dana pembayaran langsung sudah diterima"
                          style={{
                            padding: '0.32rem 0.7rem',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            borderRadius: '7px',
                            border: '1px solid #10b981',
                            background: busy ? '#a7f3d0' : '#10b981',
                            color: '#ffffff',
                            cursor: busy ? 'wait' : 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {busy ? 'Menyimpan...' : 'Konfirmasi'}
                        </button>
                      ) : st === 'Berjalan' ? (
                        <button
                          type="button"
                          onClick={() => onNavigate && onNavigate('pesan')}
                          title="Chat pembeli untuk koordinasi muat"
                          style={{
                            padding: '0.32rem 0.7rem',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            borderRadius: '7px',
                            border: '1px solid #5452f6',
                            background: '#5452f6',
                            color: '#ffffff',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Chat
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <Receipt size={42} weight="duotone" color="#94a3b8" style={{ marginBottom: '0.65rem' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
                  Belum Ada Transaksi
                </div>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                  {searchTerm || statusFilter !== 'Semua'
                    ? 'Tidak ditemukan transaksi dengan filter yang dipilih.'
                    : 'Transaksi akan tercatat otomatis saat komoditas Anda disepakati bersama pembeli.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '1rem 1.25rem' }}>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safePage <= 1}
              title="Halaman pertama"
              aria-label="Halaman pertama"
              style={paginationBtnStyle(safePage <= 1)}
            >
              <CaretDoubleLeft size={15} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(safePage - 1)}
              disabled={safePage <= 1}
              title="Sebelumnya"
              aria-label="Sebelumnya"
              style={paginationBtnStyle(safePage <= 1)}
            >
              <CaretLeft size={15} weight="bold" />
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCurrentPage(n)}
                title={`Halaman ${n}`}
                style={n === safePage ? paginationActiveStyle : paginationBtnStyle(false)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage(safePage + 1)}
              disabled={safePage >= totalPages}
              title="Berikutnya"
              aria-label="Berikutnya"
              style={paginationBtnStyle(safePage >= totalPages)}
            >
              <CaretRight size={15} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              title="Halaman terakhir"
              aria-label="Halaman terakhir"
              style={paginationBtnStyle(safePage >= totalPages)}
            >
              <CaretDoubleRight size={15} weight="bold" />
            </button>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTrx && (
        <div className="clone-modal-overlay" onClick={() => setSelectedTrx(null)}>
          <div className="clone-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={22} color="#059669" weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Rincian Transaksi Panen</h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.8rem' }}>ID: {selectedTrx.id} • {selectedTrx.date}</p>
                </div>
              </div>
            </div>

            <div className="clone-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Mitra Pembeli:</span>
                <strong style={{ fontSize: '0.9rem' }}>{selectedTrx.buyerName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Komoditas & Volume:</span>
                <strong style={{ fontSize: '0.9rem' }}>{selectedTrx.productName} ({selectedTrx.volumeTon} Ton)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Metode Pembayaran:</span>
                <strong style={{ fontSize: '0.9rem' }}>{trxPayMethod(selectedTrx)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Batas Pembayaran (1 hari):</span>
                <strong style={{ fontSize: '0.9rem' }}>{displayStatus(selectedTrx) === 'Berjalan' ? `${remainingLabel(selectedTrx)} (s/d ${deadlineLabel(selectedTrx)})` : displayStatus(selectedTrx)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Status Barang:</span>
                <strong style={{ fontSize: '0.9rem', color: isReceivedTrx(selectedTrx) ? '#059669' : isPaidTrx(selectedTrx) ? '#d97706' : '#64748b' }}>
                  {isReceivedTrx(selectedTrx) ? 'Sudah Diterima Pembeli' : isPaidTrx(selectedTrx) ? 'Dalam Pengiriman / Menunggu Konfirmasi' : 'Menunggu Pembayaran'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Nilai Transaksi:</span>
                <strong style={{ fontSize: '1.05rem', color: '#059669' }}>Rp {selectedTrx.amount.toLocaleString('id-ID')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Booking Fee (5%):</span>
                <strong style={{ fontSize: '0.9rem' }}>Rp {selectedTrx.bookingFee.toLocaleString('id-ID')}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-secondary, #f8fafc)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Jadwal Muat Mandiri:</span>
                <strong style={{ fontSize: '0.9rem' }}>{selectedTrx.pickupSchedule}</strong>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0', lineHeight: 1.45 }}>
                ℹ️ <em>{selectedTrx.notes}</em>
              </p>
            </div>

            <div className="clone-modal-footer">
              <button type="button" className="clone-btn-primary" onClick={() => setSelectedTrx(null)}>
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM CARD / MODAL KONFIRMASI PEMBAYARAN LANGSUNG ================= */}
      {confirmDirectModalTrx && (
        <div 
          className="clone-modal-overlay" 
          onClick={() => !confirmBusyId && setConfirmDirectModalTrx(null)}
          style={{ zIndex: 1100 }}
        >
          <div 
            className="clone-modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '450px', 
              width: '92%', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.28)'
            }}
          >
            {/* Header */}
            <div className="clone-modal-header" style={{ padding: '1rem 1.35rem', borderBottom: '1px solid var(--border-subtle, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: 'rgba(16, 185, 129, 0.12)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle size={22} color="#059669" weight="fill" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Konfirmasi Pembayaran Langsung
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Verifikasi penerimaan dana tunai / langsung
                  </p>
                </div>
              </div>
              {!confirmBusyId && (
                <button 
                  type="button" 
                  className="clone-modal-close" 
                  onClick={() => setConfirmDirectModalTrx(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="clone-modal-body" style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                padding: '1.1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem'
              }}>
                <div style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  lineHeight: 1.5 
                }}>
                  Konfirmasi dana pembayaran langsung untuk <strong style={{ color: '#059669' }}>{confirmDirectModalTrx.productName}</strong> sudah diterima?
                </div>
                <div style={{ 
                  fontSize: '0.84rem', 
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5 
                }}>
                  Status pembayaran menjadi lunas.
                </div>
              </div>

              {/* Rincian Singkat Transaksi */}
              <div style={{
                background: 'var(--bg-canvas-subtle, #f8fafc)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                borderRadius: '10px',
                padding: '0.75rem 0.95rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Mitra Pembeli:</span>
                  <strong>{confirmDirectModalTrx.buyerName || 'Pembeli'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Nilai:</span>
                  <strong style={{ color: '#059669' }}>Rp {(confirmDirectModalTrx.amount || 0).toLocaleString('id-ID')}</strong>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="clone-modal-footer" style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '10px', 
              padding: '0.9rem 1.35rem', 
              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
              background: 'var(--bg-canvas, #ffffff)'
            }}>
              <button
                type="button"
                onClick={() => setConfirmDirectModalTrx(null)}
                disabled={confirmBusyId !== null}
                style={{
                  padding: '0.48rem 1.15rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  background: 'transparent',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleExecuteConfirmReceipt(confirmDirectModalTrx)}
                disabled={confirmBusyId !== null}
                style={{
                  padding: '0.48rem 1.35rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  cursor: confirmBusyId ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 3px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                {confirmBusyId ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <CheckCircle size={15} weight="bold" />
                    <span>Konfirmasi</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
