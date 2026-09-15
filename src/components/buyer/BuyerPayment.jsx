import React, { useState } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  ArrowUpRight, 
  DownloadSimple, 
  Copy, 
  Check, 
  MagnifyingGlass, 
  X, 
  Buildings, 
  Receipt,
  FileText,
  Bank,
  QrCode
} from '@phosphor-icons/react';
import { INITIAL_BUYER_PAYMENTS } from './buyerMockData';

export default function BuyerPayment({ 
  payments = INITIAL_BUYER_PAYMENTS, 
  onNavigate 
}) {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [localPayments, setLocalPayments] = useState(payments);
  
  // Modals state
  const [payModalItem, setPayModalItem] = useState(null);
  const [receiptModalItem, setReceiptModalItem] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [uploadedProof, setUploadedProof] = useState(null);

  // Summary Metrics
  const totalLunas = localPayments
    .filter(p => p.status === 'Lunas')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalEscrow = localPayments
    .filter(p => p.status === 'Terkunci di Escrow')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPending = localPayments
    .filter(p => p.status === 'Menunggu Pembayaran')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Filtered Payments
  const filteredPayments = localPayments.filter(p => {
    const matchesFilter = activeFilter === 'Semua' ? true : p.status === activeFilter;
    const matchesSearch = p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.farmerGroup.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleConfirmPay = () => {
    if (!payModalItem) return;
    setPaymentSuccess(true);
    setTimeout(() => {
      setLocalPayments(prev => prev.map(p => {
        if (p.id === payModalItem.id) {
          return {
            ...p,
            status: 'Lunas',
            paidDate: 'Hari Ini, Baru Saja'
          };
        }
        return p;
      }));
      setPaymentSuccess(false);
      setPayModalItem(null);
      setUploadedProof(null);
    }, 1500);
  };

  return (
    <div className="clone-dashboard-content">
      {/* Page Header */}
      <div className="clone-dash-header">
        <div>
          <h1 className="clone-dash-title">
            Pembayaran & Escrow Platform
          </h1>
          <p className="clone-dash-subtitle">
            Kelola setoran DP 5% yang dijamin aman di rekening escrow platform dan lakukan pelunasan saat komoditas siap muat.
          </p>
        </div>
        <div className="clone-dash-header-actions">
          <button 
            type="button" 
            className="clone-btn-secondary"
            onClick={() => onNavigate && onNavigate('transaksi')}
            title="Lihat Riwayat Pengadaan"
          >
            <Receipt size={14} weight="bold" />
            <span>Riwayat Pengadaan</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="clone-kpi-grid">
        
        {/* KPI 1: Pengeluaran Selesai (Solid Purple Card) */}
        <div className="clone-kpi-card solid-purple">
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Total Pembayaran Lunas</span>
            <div className="clone-kpi-badge white-badge">
              <span>Verified</span>
            </div>
          </div>
          <div className="clone-kpi-value" style={{ fontSize: '1.45rem' }}>
            Rp {totalLunas.toLocaleString('id-ID')}
          </div>
          <div className="clone-kpi-badge white-badge" style={{ marginTop: '0.4rem' }}>
            <span>{localPayments.filter(p => p.status === 'Lunas').length} Transaksi Terverifikasi</span>
          </div>
        </div>

        {/* KPI 2: Dana Terkunci di Escrow (White Card) */}
        <div className="clone-kpi-card white-card">
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">DP Terkunci di Escrow (5%)</span>
            <div className="clone-kpi-badge light-purple-badge">
              <ShieldCheck size={13} weight="fill" />
              <span>Aman</span>
            </div>
          </div>
          <div className="clone-kpi-value" style={{ fontSize: '1.45rem', color: '#5452f6' }}>
            Rp {totalEscrow.toLocaleString('id-ID')}
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
            Terkunci di Penjamin Resmi Platform sampai timbang muat
          </p>
        </div>

        {/* KPI 3: Menunggu Pelunasan (White Card) */}
        <div className="clone-kpi-card white-card">
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Menunggu Pelunasan</span>
            <div className="clone-kpi-badge light-orange-badge">
              <Clock size={13} weight="bold" />
              <span>Jatuh Tempo</span>
            </div>
          </div>
          <div className="clone-kpi-value" style={{ fontSize: '1.45rem', color: '#f59e0b' }}>
            Rp {totalPending.toLocaleString('id-ID')}
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.4rem 0 0 0' }}>
            Pelunasan saat verifikasi timbang di gudang Poktan
          </p>
        </div>

        {/* KPI 4: Rekening Escrow Penjamin */}
        <div className="clone-kpi-card white-card">
          <div className="clone-kpi-top">
            <span className="clone-kpi-label">Rekening Penjamin Escrow</span>
            <Bank size={18} color="#0284c7" weight="bold" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginTop: '0.2rem' }}>
            Bank Mandiri (Persero)
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
            No. Rek: <strong style={{ color: '#0f172a' }}>156-00-9988221-8</strong>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} weight="fill" />
            <span>Terdaftar & Diawasi OJK / Bappebti</span>
          </div>
        </div>

      </div>

      {/* Payment Filter & Search Bar */}
      <div className="clone-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Semua', 'Menunggu Pembayaran', 'Terkunci di Escrow', 'Lunas'].map((st) => (
              <button
                key={st}
                type="button"
                className={`clone-filter-btn ${activeFilter === st ? 'active' : ''}`}
                onClick={() => setActiveFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px' }}>
            <MagnifyingGlass size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari invoice atau Poktan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                background: 'var(--bg-canvas, #ffffff)',
                color: 'var(--text-primary, #1e293b)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Payment Transactions Table / Card List */}
      <div className="clone-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          padding: '1.15rem 1.4rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Daftar Tagihan & Pembayaran
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Seluruh arus pembayaran uang muka dan pelunasan pengadaan komoditas terhubung langsung ke penjamin escrow.
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
            Menampilkan {filteredPayments.length} Pembayaran
          </span>
        </div>

        {/* Table / List Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredPayments.map((item, index) => {
            const isPending = item.status === 'Menunggu Pembayaran';
            const isEscrow = item.status === 'Terkunci di Escrow';
            const isLunas = item.status === 'Lunas';

            return (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem 1.4rem',
                  borderBottom: index < filteredPayments.length - 1 ? '1px solid #f8fafc' : 'none',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  background: isPending ? 'rgba(245, 158, 11, 0.02)' : 'transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                {/* Left Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: isLunas ? '#ecfdf5' : isEscrow ? '#eff2fe' : '#fffbeb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLunas ? '#10b981' : isEscrow ? '#5452f6' : '#f59e0b',
                    flexShrink: 0
                  }}>
                    {isLunas ? <CheckCircle size={22} weight="fill" /> : isEscrow ? <ShieldCheck size={22} weight="fill" /> : <CreditCard size={22} weight="fill" />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#5452f6' }}>
                        {item.invoiceNumber}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        background: isLunas ? '#dcfce7' : isEscrow ? '#eff2fe' : '#fef3c7',
                        color: isLunas ? '#15803d' : isEscrow ? '#4338ca' : '#b45309'
                      }}>
                        {item.status}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', margin: '3px 0' }}>
                      {item.commodity}
                    </h4>

                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Poktan: <strong style={{ color: '#334155' }}>{item.farmerGroup}</strong> • {item.paymentType}
                    </div>
                  </div>
                </div>

                {/* Amount & Due Date */}
                <div style={{ textAlign: 'right', minWidth: '160px' }}>
                  <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#1e293b' }}>
                    Rp {item.amount.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    {item.paidDate ? `Dibayar: ${item.paidDate}` : `Jatuh Tempo: ${item.dueDate}`}
                  </div>
                </div>

                {/* Action Button */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isPending && (
                    <button
                      type="button"
                      className="clone-btn-primary"
                      style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
                      onClick={() => setPayModalItem(item)}
                    >
                      <CreditCard size={15} weight="bold" />
                      <span>Bayar Sekarang</span>
                    </button>
                  )}

                  {(isLunas || isEscrow) && (
                    <button
                      type="button"
                      className="clone-btn-secondary"
                      style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
                      onClick={() => setReceiptModalItem(item)}
                    >
                      <DownloadSimple size={15} weight="bold" />
                      <span>Bukti Bayar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL 1: BAYAR SEKARANG (VIRTUAL ACCOUNT) ================= */}
      {payModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fafbfc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  background: '#eff2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5452f6'
                }}>
                  <CreditCard size={20} weight="bold" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    Instruksi Pembayaran
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {payModalItem.invoiceNumber}
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setPayModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Amount Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                textAlign: 'center',
                marginBottom: '1.25rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Total Nominal Pelunasan
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginTop: '0.2rem' }}>
                  Rp {payModalItem.amount.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <ShieldCheck size={15} weight="fill" />
                  <span>Dijamin Rekening Escrow Platform Resmi</span>
                </div>
              </div>

              {/* Virtual Account Details */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Nomor Virtual Account Mandiri
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px'
                }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.05em', color: '#0f172a' }}>
                    {payModalItem.vaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(payModalItem.vaNumber)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: copiedId ? '#dcfce7' : '#eff2fe',
                      color: copiedId ? '#15803d' : '#5452f6',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedId ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                    <span>{copiedId ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Atas Nama: <strong>PT Penjamin Pangan Indonesia (Escrow AgriConnect)</strong>
                </p>
              </div>

              {/* Upload Proof */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Unggah Bukti Transfer / Resi (Opsional)
                </div>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={(e) => setUploadedProof(e.target.files?.[0]?.name || null)}
                  style={{ fontSize: '0.8rem', color: '#64748b' }}
                />
                {uploadedProof && (
                  <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>
                    File siap: {uploadedProof}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="clone-btn-secondary"
                  style={{ flex: 1, padding: '0.7rem' }}
                  onClick={() => setPayModalItem(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="clone-btn-primary"
                  style={{ flex: 2, padding: '0.7rem', justifyContent: 'center' }}
                  onClick={handleConfirmPay}
                  disabled={paymentSuccess}
                >
                  {paymentSuccess ? (
                    <>
                      <CheckCircle size={16} weight="bold" />
                      <span>Memverifikasi Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} weight="bold" />
                      <span>Konfirmasi Sudah Bayar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: BUKTI BAYAR / KWITANSI RESMI ================= */}
      {receiptModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={20} color="#5452f6" weight="bold" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  Bukti Pembayaran Elektronik
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setReceiptModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Receipt Preview Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{
                border: '1.5px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '1.25rem',
                background: '#fafbfc'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                      Agri<span style={{ color: '#5452f6' }}>Connect</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Platform Agribisnis Terpadu Indonesia</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px' }}>
                      LUNAS / VERIFIED
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>{receiptModalItem.invoiceNumber}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.78rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Pembayar:</span>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>PT Nusantara Pangan Abadi</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Penerima:</span>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{receiptModalItem.farmerGroup}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Komoditas:</span>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{receiptModalItem.commodity}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Tipe:</span>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{receiptModalItem.paymentType}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Total Dana Disetor:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5452f6' }}>
                    Rp {receiptModalItem.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="clone-btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setReceiptModalItem(null)}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="clone-btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    alert(`Mengunduh bukti pembayaran resmi ${receiptModalItem.invoiceNumber}...`);
                    setReceiptModalItem(null);
                  }}
                >
                  <DownloadSimple size={16} weight="bold" />
                  <span>Unduh PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
