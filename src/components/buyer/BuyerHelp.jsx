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

export default function BuyerHelp() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(0);

  const faqs = [
    {
      q: 'Bagaimana alur pengajuan penawaran hingga penerbitan Binding Agreement?',
      a: 'Anda dapat memilih komoditas di katalog, menentukan tonase yang dibutuhkan, dan memasukkan harga tawaran per kg. Begitu kelompok tani menyetujui (atau menyepakati hasil negosiasi counter-offer), sistem otomatis menerbitkan Digital Binding Agreement. Anda kemudian menyetor Booking Fee (5%) ke rekening escrow resmi AgriConnect untuk mengunci alokasi panen.'
    },
    {
      q: 'Bagaimana jaminan keamanan dana Booking Fee (5%) di platform?',
      a: 'Dana Booking Fee 5% 100% diamankan di rekening penjamin resmi AgriConnect (Escrow Account). Dana TIDAK akan ditransfer ke pihak petani sebelum armada Anda tiba di gudang, melakukan pengujian sampel (kadar air & kebersihan), dan menimbang muatan secara sah. Jika terjadi wanprestasi dari pihak petani, dana dikembalikan penuh kepada pembeli.'
    },
    {
      q: 'Bagaimana prosedur Self-Pickup armada pengangkutan ke gudang Poktan?',
      a: 'Pembeli bertanggung jawab penuh menyediakan armada angkutan mandiri (Truk Tronton, Fuso, atau Colt Diesel). Setelah Binding Agreement terbit, sistem menyediakan Surat Perintah Muat Armada (SPK Pickup) lengkap dengan titik koordinat gudang sentra tani dan kontak PIC gudang untuk memandu kedatangan armada Anda.'
    },
    {
      q: 'Apa yang terjadi jika mutu komoditas di gudang tani tidak sesuai spesifikasi?',
      a: 'Sesuai klausul Binding Agreement AgriConnect, pihak pembeli berhak melakukan uji laboratorium kadar air atau sortir mutu fisik sebelum muat ke bak truk. Jika mutu di bawah toleransi kontrak, pembeli berhak menolak muatan dan penjamin platform akan memproses mediasi atau pembatalan tanpa kehilangan dana booking fee.'
    },
    {
      q: 'Kapan dan bagaimana sisa pelunasan 95% diselesaikan?',
      a: 'Pelunasan sisa 95% diselesaikan langsung saat proses muat di lokasi penyerahan barang dan penimbangan tuntas (berdasarkan nota jembatan timbang resmi), baik melalui transfer langsung perbankan terverifikasi maupun lewat escrow platform.'
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
          <h1 className="farmer-page-title">Pusat Bantuan & Panduan Pengadaan Pembeli</h1>
          <p className="farmer-page-sub">
            Panduan lengkap mekanisme penawaran komoditas, jaminan perlindungan dana escrow, dan prosedur self-pickup logistik.
          </p>
        </div>
      </div>

      {/* 3 Quick Help Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="clone-kpi-card white-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(84, 82, 246, 0.1)', color: '#5452f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <ShieldCheck size={24} weight="bold" />
          </div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Jaminan Escrow 100%</h4>
          <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Dana Booking Fee 5% aman terkunci hingga inspeksi fisik mutu di gudang selesai.
          </p>
        </div>

        <div className="clone-kpi-card white-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Truck size={24} weight="bold" />
          </div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>SOP Self-Pickup Armada</h4>
          <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Surat Perintah Muat dan koordinasi langsung dengan PIC gudang kelompok tani.
          </p>
        </div>

        <div className="clone-kpi-card white-card" style={{ padding: '1.25rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Phone size={24} weight="bold" />
          </div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Bantuan CS Prioritas</h4>
          <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Layanan pendampingan pengadaan industri via WhatsApp di 0812-9900-8800.
          </p>
        </div>
      </div>

      {/* FAQ Search Bar */}
      <div style={{ position: 'relative', maxWidth: '520px', marginBottom: '1.5rem' }}>
        <MagnifyingGlass size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Ketik pertanyaan terkait pengadaan, kontrak, atau armada..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="farmer-form-input"
          style={{ paddingLeft: '40px', height: '42px', borderRadius: '24px', fontSize: '0.86rem' }}
        />
      </div>

      {/* Accordion FAQ List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        {filteredFaqs.map((faq, idx) => {
          const isExpanded = expandedFaq === idx;
          return (
            <div 
              key={idx} 
              className="farmer-table-card" 
              style={{ padding: '1.15rem 1.35rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => setExpandedFaq(isExpanded ? null : idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: isExpanded ? '#5452f6' : 'var(--text-primary)' }}>
                  {faq.q}
                </h4>
                {isExpanded ? <CaretUp size={16} weight="bold" color="#5452f6" /> : <CaretDown size={16} weight="bold" color="var(--text-muted)" />}
              </div>
              
              {isExpanded && (
                <p style={{ margin: '0.85rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
