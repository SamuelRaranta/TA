import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Plus,
  Star,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Smiley,
  Check,
  Checks,
  UserPlus,
  CaretDown,
  X,
  ArrowRight,
  CheckCircle,
  PaperPlaneRight,
  ShieldCheck,
  Buildings,
  Plant
} from '@phosphor-icons/react';

const INITIAL_BUYER_CHATS = [
  {
    id: 'chat-b1',
    name: 'Hengky Mandagi, S.P.',
    company: 'Poktan Ranowangko (Langowan)',
    role: 'petani',
    roleLabel: 'Ketua Poktan Cengkeh & Palawija',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Kadar air cengkeh sudah kami cek rata-rata 11.5%, siap muat armada Pak Hendra.',
    time: '10 min',
    unreadCount: 2,
    isFavorite: true,
    isOnline: true,
    email: 'hengky.mandagi@agriconnect.id',
    phone: '0812-4321-8765',
    commodityInterest: 'Cengkeh Zanzibar Kering (10 Ton)'
  },
  {
    id: 'chat-b2',
    name: 'Jemmy Rondonuwu',
    company: 'Poktan Tou Kakas Mandiri',
    role: 'petani',
    roleLabel: 'Produsen Jagung Hibrida Kakas',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Tanda jadi 5% sudah terkonfirmasi di sistem. Kami siapkan buruh muat di silo Tompaso.',
    time: '1 jam',
    unreadCount: 0,
    isFavorite: true,
    isOnline: true,
    email: 'jemmy.kakas@agriconnect.id',
    phone: '0813-8821-4432',
    commodityInterest: 'Jagung Pipil Kering (40 Ton)'
  },
  {
    id: 'chat-b3',
    name: 'Frits Rumagit',
    company: 'Poktan Danau Tondano',
    role: 'petani',
    roleLabel: 'Sentra Beras Superwin Tondano',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Bagaimana Pak, apakah penawaran Rp 15.100/kg untuk beras Superwin poles bisa disetujui?',
    time: 'Kemarin',
    unreadCount: 1,
    isFavorite: false,
    isOnline: false,
    email: 'frits.tondano@agriconnect.id',
    phone: '0815-4433-2211',
    commodityInterest: 'Beras Premium Superwin (20 Ton)'
  },
  {
    id: 'chat-b4',
    name: 'Customer Support Escrow',
    company: 'AgriConnect Official',
    role: 'admin',
    roleLabel: 'Tim Penjamin Platform',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Verifikasi jaminan booking fee kontrak AC-AGR/2026/IX/0051 telah berhasil diproses.',
    time: '2 hari',
    unreadCount: 0,
    isFavorite: false,
    isOnline: true,
    email: 'support@agriconnect.id',
    phone: '0812-9900-8800',
    commodityInterest: 'Layanan Pengawalan Kontrak Legal'
  }
];

const INITIAL_MESSAGES = {
  'chat-b1': [
    { id: 1, sender: 'them', text: 'Selamat pagi Pak Hendra, kami dari Poktan Ranowangko Langowan.', time: '09:15', status: 'read' },
    { id: 2, sender: 'me', text: 'Pagi Pak Hengky. Mau tanya terkait kesiapan cengkeh 10 ton di gudang Walantakan apakah kadar air sudah di bawah 12%?', time: '09:20', status: 'read' },
    { id: 3, sender: 'them', text: 'Kadar air cengkeh sudah kami cek rata-rata 11.5%, siap muat armada Pak Hendra. Timbangan digital siap.', time: '09:28', status: 'read' }
  ],
  'chat-b2': [
    { id: 1, sender: 'me', text: 'Halo Pak Jemmy, armada truk kami siap muat tanggal 16 September pagi di Silo Tompaso.', time: 'Kemarin 14:00', status: 'read' },
    { id: 2, sender: 'them', text: 'Tanda jadi 5% sudah terkonfirmasi di sistem. Kami siapkan buruh muat di silo Tompaso.', time: 'Kemarin 14:30', status: 'read' }
  ],
  'chat-b3': [
    { id: 1, sender: 'them', text: 'Bagaimana Pak, apakah penawaran Rp 15.100/kg untuk beras Superwin poles bisa disetujui?', time: 'Kemarin', status: 'read' }
  ],
  'chat-b4': [
    { id: 1, sender: 'them', text: 'Verifikasi jaminan booking fee kontrak AC-AGR/2026/IX/0051 telah berhasil diproses.', time: '2 hari lalu', status: 'read' }
  ]
};

export default function BuyerChatView() {
  const [chats, setChats] = useState(INITIAL_BUYER_CHATS);
  const [activeChatId, setActiveChatId] = useState('chat-b1');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const currentMessages = messages[activeChatId] || [];

  const filteredChats = chats.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg]
    }));

    setInputText('');

    // Simulate auto reply after 1.5s
    setTimeout(() => {
      const replyMsg = {
        id: Date.now() + 1,
        sender: 'them',
        text: 'Baik Pak Hendra, pesan Anda kami terima dan segera dikoordinasikan dengan tim lapangan.',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };
      setMessages(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), replyMsg]
      }));
    }, 1200);
  };

  return (
    <div className="clone-chat-layout" style={{ height: 'calc(100vh - 120px)' }}>
      
      {/* ================= LEFT CONTACT LIST ================= */}
      <div className="clone-chat-sidebar">
        
        <div className="clone-chat-sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Pesan & Negosiasi</h3>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: '#5452f6', color: '#ffffff', fontWeight: 700 }}>
              {chats.length} Kontak
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <MagnifyingGlass size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari nama petani atau poktan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="farmer-search-input"
              style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="clone-chat-contacts-list" style={{ overflowY: 'auto', flex: 1 }}>
          {filteredChats.map((c) => {
            const isActive = c.id === activeChatId;
            return (
              <div 
                key={c.id} 
                className={`clone-chat-contact-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveChatId(c.id)}
              >
                <div style={{ position: 'relative' }}>
                  <img src={c.avatar} alt={c.name} className="clone-chat-avatar" />
                  {c.isOnline && <span className="clone-chat-online-dot" />}
                </div>

                <div className="clone-chat-contact-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="clone-chat-contact-name">{c.name}</span>
                    <span className="clone-chat-contact-time">{c.time}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#5452f6', fontWeight: 600 }}>
                    {c.company}
                  </div>
                  <div className="clone-chat-contact-lastmsg">
                    {c.lastMessage}
                  </div>
                </div>

                {c.unreadCount > 0 && (
                  <span className="clone-chat-unread-badge">{c.unreadCount}</span>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* ================= RIGHT ACTIVE CONVERSATION ================= */}
      <div className="clone-chat-main">
        
        {/* Chat Header */}
        <div className="clone-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <img src={activeChat.avatar} alt={activeChat.name} className="clone-chat-avatar large" />
              {activeChat.isOnline && <span className="clone-chat-online-dot" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{activeChat.name}</h4>
                <span className={`clone-chat-role-pill ${activeChat.role}`}>
                  {activeChat.role === 'petani' ? 'Kelompok Tani' : 'Admin Penjamin'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {activeChat.company} • {activeChat.phone}
              </div>
            </div>
          </div>

          {/* Quick Info Pill */}
          <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(84, 82, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(84, 82, 246, 0.2)', fontSize: '0.76rem', color: '#5452f6', fontWeight: 600 }}>
            {activeChat.commodityInterest}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="clone-chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {currentMessages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <div key={msg.id} className={`clone-chat-msg-row ${isMe ? 'outgoing' : 'incoming'}`}>
                <div className={`clone-chat-bubble ${isMe ? 'outgoing' : 'incoming'}`}>
                  <div className="clone-chat-bubble-text">{msg.text}</div>
                  <div className="clone-chat-bubble-meta">
                    <span>{msg.time}</span>
                    {isMe && <Checks size={13} weight="bold" color="#60a5fa" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Negotiate Templates */}
        <div style={{ padding: '0.4rem 1.25rem', display: 'flex', gap: '8px', overflowX: 'auto', background: 'var(--bg-canvas)', borderTop: '1px solid var(--border-subtle)' }}>
          <button 
            type="button" 
            onClick={() => setInputText('Bisa dikirimkan foto hasil uji kadar air terbaru dari gudang?')}
            className="clone-tag-btn" 
            style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
          >
            Minta Bukti Uji Kadar Air
          </button>
          <button 
            type="button" 
            onClick={() => setInputText('Armada tronton kami dijadwalkan tiba jam 08:00 pagi di lokasi gudang.')}
            className="clone-tag-btn" 
            style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
          >
            Konfirmasi Jadwal Tiba Armada
          </button>
          <button 
            type="button" 
            onClick={() => setInputText('Apakah kami bisa mengajukan penawaran harga Rp ')}
            className="clone-tag-btn" 
            style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
          >
            Nego Harga Baru
          </button>
        </div>

        {/* Input Field */}
        <form onSubmit={handleSendMessage} className="clone-chat-input-bar">
          <input 
            type="text" 
            placeholder={`Ketik pesan ke ${activeChat.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="clone-chat-text-input"
          />
          <button type="submit" className="clone-chat-send-btn">
            <PaperPlaneRight size={17} weight="fill" />
          </button>
        </form>

      </div>

    </div>
  );
}
