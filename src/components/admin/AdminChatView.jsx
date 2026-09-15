import React, { useState } from 'react';
import { 
  PaperPlaneTilt, 
  MagnifyingGlass, 
  CheckCircle, 
  Buildings, 
  Plant, 
  Paperclip, 
  Smiley, 
  Phone, 
  VideoCamera,
  DotsThreeVertical,
  Check,
  Checks
} from '@phosphor-icons/react';

const ADMIN_CHATS = [
  {
    id: 'c-1',
    name: 'Hengky Mandagi, S.P.',
    organization: 'Poktan Ranowangko Langowan',
    type: 'petani',
    typeLabel: 'Poktan Tani Minahasa',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Dokumen SK Distanbun Minahasa dan sertifikat panen cengkeh sudah kami unggah pak admin.',
    time: '10:45 WITA',
    unread: 2,
    online: true,
    messages: [
      { id: 1, sender: 'them', text: 'Selamat pagi Admin AgriConnect, kami dari Poktan Ranowangko Langowan ingin menanyakan verifikasi legalitas akun.', time: '10:30 WITA' },
      { id: 2, sender: 'me', text: 'Selamat pagi Pak Hengky. Tim admin sedang memvalidasi data lahan cengkeh 52.5 Hektar dan SK Distanbun Minahasa Anda.', time: '10:38 WITA' },
      { id: 3, sender: 'them', text: 'Dokumen SK Distanbun Minahasa dan sertifikat panen cengkeh sudah kami unggah pak admin.', time: '10:45 WITA' }
    ]
  },
  {
    id: 'c-2',
    name: 'Ir. Raditya Pratama',
    organization: 'PT Royal Coconut Minahasa',
    type: 'pembeli',
    typeLabel: 'Buyer Industri Kelapa',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'DP 5% senilai Rp 17.250.000 untuk kopra Kombi sudah kami transfer ke rekening escrow Mandiri.',
    time: '09:20 WITA',
    unread: 1,
    online: true,
    messages: [
      { id: 1, sender: 'them', text: 'Halo admin, kontrak pengadaan Kopra Putih dengan Koperasi Kombi sudah kami tanda tangani digital.', time: '09:15 WITA' },
      { id: 2, sender: 'them', text: 'DP 5% senilai Rp 17.250.000 untuk kopra Kombi sudah kami transfer ke rekening escrow Mandiri.', time: '09:20 WITA' }
    ]
  },
  {
    id: 'c-3',
    name: 'Frits Rumagit',
    organization: 'Poktan Danau Tondano',
    type: 'petani',
    typeLabel: 'Poktan Tani Minahasa',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Baik terima kasih atas konfirmasinya.',
    time: 'Kemarin',
    unread: 0,
    online: false,
    messages: [
      { id: 1, sender: 'them', text: 'Apakah batas toleransi susut timbang beras Superwin di gudang Tondano bisa disesuaikan ke 0.5%?', time: 'Kemarin, 14:20' },
      { id: 2, sender: 'me', text: 'Bisa Pak Frits, sesuai SOP pasal 4 kontrak binding dengan persetujuan pihak pembeli.', time: 'Kemarin, 15:10' },
      { id: 3, sender: 'them', text: 'Baik terima kasih atas konfirmasinya.', time: 'Kemarin, 15:12' }
    ]
  },
  {
    id: 'c-4',
    name: 'Bambang Kusuma, S.Pt.',
    organization: 'PT Celebes Feedmill Minahasa',
    type: 'pembeli',
    typeLabel: 'Buyer Industri Pakan',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Kami butuh pasokan 200 Ton Jagung Pipil Kakas bulan depan.',
    time: '13 Sep',
    unread: 0,
    online: false,
    messages: [
      { id: 1, sender: 'them', text: 'Kami butuh pasokan 200 Ton Jagung Pipil Kakas bulan depan.', time: '13 Sep, 11:00' }
    ]
  }
];

export default function AdminChatView() {
  const [chats, setChats] = useState(ADMIN_CHATS);
  const [activeChatId, setActiveChatId] = useState('c-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: inputMessage.trim(),
      time: 'Baru saja'
    };

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessage: `You: ${newMsg.text}`,
          time: 'Baru saja',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    setInputMessage('');
  };

  const filteredChats = chats.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="clone-card" style={{ padding: 0, display: 'flex', height: 'calc(100vh - 180px)', minHeight: '520px', overflow: 'hidden' }}>
      
      {/* Sidebar List Chats */}
      <div style={{
        width: '320px',
        borderRight: '1px solid var(--border-subtle, #e2e8f0)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface-card, #ffffff)'
      }}>
        {/* Search header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.65rem 0', color: 'var(--text-primary)' }}>
            Pesan & Bantuan Pengguna
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-surface-subtle, #f1f5f9)',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px'
          }}>
            <MagnifyingGlass size={15} color="#64748b" />
            <input 
              type="text" 
              placeholder="Cari pesan atau kontak..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.82rem', width: '100%' }}
            />
          </div>
        </div>

        {/* List Conversations */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredChats.map(c => {
            const isActive = c.id === activeChatId;

            return (
              <div
                key={c.id}
                onClick={() => {
                  setActiveChatId(c.id);
                  setChats(prev => prev.map(item => item.id === c.id ? { ...item, unread: 0 } : item));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-subtle, #f8fafc)',
                  background: isActive ? 'rgba(84, 82, 246, 0.08)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                {/* Avatar with status dot */}
                <div style={{ position: 'relative' }}>
                  <img 
                    src={c.avatar} 
                    alt={c.name} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  {c.online && (
                    <span style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '2px solid #ffffff'
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{c.time}</span>
                  </div>

                  <div style={{ fontSize: '0.70rem', color: c.type === 'petani' ? '#047857' : '#1d4ed8', fontWeight: 600 }}>
                    {c.organization}
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {c.lastMessage}
                  </div>
                </div>

                {c.unread > 0 && (
                  <span style={{
                    background: '#5452f6',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {c.unread}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface-subtle, #f8fafc)' }}>
        {/* Active Contact Header */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          background: 'var(--bg-surface-card, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={activeChat.avatar} 
              alt={activeChat.name} 
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeChat.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{activeChat.organization}</span> • 
                <span style={{ color: activeChat.online ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                  {activeChat.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.70rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '9999px',
              background: activeChat.type === 'petani' ? '#ecfdf5' : '#eff6ff',
              color: activeChat.type === 'petani' ? '#047857' : '#1d4ed8'
            }}>
              {activeChat.typeLabel}
            </span>
          </div>
        </div>

        {/* Message History Bubble Area */}
        <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {activeChat.messages.map((m) => {
            const isMe = m.sender === 'me';

            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  background: isMe ? '#5452f6' : '#ffffff',
                  color: isMe ? '#ffffff' : '#1e293b',
                  padding: '0.65rem 0.95rem',
                  borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  fontSize: '0.86rem',
                  lineHeight: 1.45,
                  border: isMe ? 'none' : '1px solid #e2e8f0'
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '3px', padding: '0 4px' }}>
                  {m.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={handleSendMessage}
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
            background: 'var(--bg-surface-card, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <input 
            type="text" 
            placeholder={`Ketik pesan untuk ${activeChat.name}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={{
              flex: 1,
              padding: '0.6rem 0.95rem',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              outline: 'none',
              fontSize: '0.86rem',
              color: 'var(--text-primary)',
              background: '#f8fafc'
            }}
          />

          <button 
            type="submit" 
            className="clone-btn-primary"
            style={{ padding: '0.6rem 1.15rem' }}
          >
            <PaperPlaneTilt size={16} weight="fill" />
            <span>Kirim</span>
          </button>
        </form>
      </div>

    </div>
  );
}
