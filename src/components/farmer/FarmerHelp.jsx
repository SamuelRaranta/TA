import React, { useState } from 'react';
import { 
  Question, 
  MagnifyingGlass, 
  ShieldCheck, 
  Phone, 
  EnvelopeSimple, 
  Truck, 
  FileText, 
  CurrencyCircleDollar, 
  CaretDown,
  CaretUp,
  CheckCircle,
  Clock
} from '@phosphor-icons/react';

export default function FarmerHelp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(0);

  const faqs = [
    {
      q: 'Bagaimana alur Digital Binding Agreement bekerja?',
      a: 'Saat calon pembeli mengajukan penawaran dan Anda menerimanya, sistem AgriConnect secara otomatis menerbitkan dokumen Digital Binding Agreement. Dokumen ini mengunci kuantitas, harga acuan, dan rentang jadwal pengambilan serta mewajibkan pembeli menyetor Tanda Jadi (Booking Fee 5-10%) ke rekening penjamin resmi platform sebelum pengambilan fisik.'
    },
    {
      q: 'Apakah harga di AgriConnect mengikuti harga acuan pasar resmi?',
      a: 'Ya. Admin platform secara berkala memperbarui harga acuan pasar komoditas harian dari Pusat Informasi Harga Pangan Strategis (PIHPS) dan Badan Pangan Nasional (Bapanas). Anda dapat menggunakan data ini sebagai patokan saat menentukan harga listing produk maupun melakukan negosiasi (counter-offer).'
    },
    {
      q: 'Siapa yang bertanggung jawab menyediakan armada angkutan dan logistik?',
      a: 'Sesuai model bisnis AgriConnect, platform TIDAK menyediakan layanan pengiriman maupun armada truk. Seluruh proses pengangkutan dilakukan secara Self-Pickup (ambil mandiri di gudang petani) oleh pihak pembeli. Pembeli menanggung armada serta biaya pengangkutan secara mandiri.'
    },
    {
      q: 'Bagaimana jaminan jika pembeli membatalkan kesepakatan secara sepihak?',
      a: 'Tanda jadi (Booking Fee) yang telah dikunci di rekening penjamin platform akan dikompensasikan kepada kelompok tani sebagai ganti rugi pembatalan sepihak, serta akun pembeli akan dikenakan penalti reputasi atau pembekuan akun oleh admin.'
    },
    {
      q: 'Kapan pelunasan sisa pembayaran 90-95% dilakukan?',
      a: 'Pelunasan sisa nilai transaksi dilakukan oleh pembeli saat armada pembeli tiba di titik gudang sentra tani, setelah dilakukan pemeriksaan mutu (uji kadar air/sortir) dan penimbangan bersama sebelum muat barang.'
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="farmer-help-view">
      
      {/* Header */}
      <div className="farmer-section-header">
        <div>
          <h1 className="farmer-page-title">Pusat Bantuan & Panduan Poktan</h1>
          <p className="farmer-page-sub">
            Panduan lengkap mekanisme komitmen digital, perlindungan tanda jadi, dan operasional serah terima komoditas.
          </p>
        </div>
      </div>

      {/* Quick Search */}
      <div style={{ position: 'relative', maxWidth: '500px', marginBottom: '1.5rem' }}>
        <MagnifyingGlass size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Ketik pertanyaan atau kata kunci bantuan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="farmer-form-input"
          style={{ paddingLeft: '40px', height: '42px', borderRadius: '9999px', fontSize: '0.88rem' }}
        />
      </div>

      {/* FAQ Accordion List */}
      <div className="clone-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Pertanyaan Umum (FAQ)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredFaqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div 
                key={faq.q}
                style={{
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? -1 : idx)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.15rem',
                    background: isOpen ? 'var(--bg-surface-secondary, #f8fafc)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #0f172a)'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0.85rem 1.15rem 1.15rem 1.15rem', fontSize: '0.86rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.55, borderTop: '1px solid var(--border-subtle, #f1f5f9)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Bottom Card: Pusat Layanan Cepat */}
      <div className="clone-compact-card">
        <div className="clone-compact-header">
          <div className="clone-compact-header-left">
            <div className="clone-compact-icon-badge purple">
              <Question size={18} weight="bold" />
            </div>
            <div>
              <h4 className="clone-compact-title">Pusat Layanan Cepat & Hotline Pendampingan Poktan</h4>
              <p className="clone-compact-subtitle">Saluran resmi penanganan kendala dan konsultasi teknis kelompok tani</p>
            </div>
          </div>
          <span className="clone-compact-tag">Siaga 08:00 - 18:00 WIB</span>
        </div>

        <div className="clone-compact-grid">
          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">💬</span>
            <div>
              <div className="clone-compact-item-title">WhatsApp Care: 0812-9900-8800</div>
              <p className="clone-compact-item-desc">
                Konsultasi instan dengan tim pendamping agri untuk validasi harga acuan dan kendala muat armada.
              </p>
            </div>
          </div>

          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">✉️</span>
            <div>
              <div className="clone-compact-item-title">Email: bantuan@agriconnect.id</div>
              <p className="clone-compact-item-desc">
                Layanan pengaduan tertulis, klarifikasi penagihan booking fee, dan penyerahan bukti tanda terima timbang.
              </p>
            </div>
          </div>

          <div className="clone-compact-item">
            <span className="clone-compact-item-icon">🚜</span>
            <div>
              <div className="clone-compact-item-title">Pendamping Lapangan Gapoktan</div>
              <p className="clone-compact-item-desc">
                Fasilitasi mediasi fisik dan uji mutu kadar air langsung di sentra Pare Kediri, Nganjuk, dan Brebes.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
