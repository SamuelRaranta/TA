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
  UserList,
  CaretDown,
  X,
  ArrowRight,
  CheckCircle
} from '@phosphor-icons/react';

// Initial Mock Conversations
const INITIAL_CHATS = [
  {
    id: 'chat-1',
    name: 'Alexandra Smith',
    company: 'CV Minahasa Cengkeh Abadi',
    role: 'pembeli',
    roleLabel: 'Eksportir Rempah Minahasa',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Thank you for your information',
    time: '24 min',
    unreadCount: 0,
    isFavorite: true,
    isOnline: true,
    email: 'a.smith@minahasacengkeh.co.id',
    phone: '0812-9922-3344',
    commodityInterest: 'Cengkeh Zanzibar Kering (10 Ton)'
  },
  {
    id: 'chat-2',
    name: 'Tommie Garner',
    company: 'PT Royal Coconut Minahasa',
    role: 'pembeli',
    roleLabel: 'Industri Kelapa Terpadu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'You: You\'re welcome!',
    time: '26 min',
    unreadCount: 0,
    isFavorite: false,
    isOnline: true,
    email: 'tommie.garner@royalcoconut.co.id',
    phone: '0813-4455-6677',
    commodityInterest: 'Kopra Putih Kering Kombi (25 Ton)'
  },
  {
    id: 'chat-3',
    name: 'Frits Rumagit',
    company: 'Poktan Danau Tondano',
    role: 'petani',
    roleLabel: 'Ketua Poktan Minahasa',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Nah, that\'s fine. I just wanted to...',
    time: '34 min',
    unreadCount: 3,
    isFavorite: true,
    isOnline: false,
    email: 'frits.tondano@agriconnect.id',
    phone: '0811-2233-4455',
    commodityInterest: 'Sharing Mesin Dryer & RMU Tondano'
  },
  {
    id: 'chat-4',
    name: 'Pamela Pennington',
    company: 'PT Celebes Feedmill Minahasa',
    role: 'pembeli',
    roleLabel: 'Pabrik Pakan Minahasa',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'You: Really? Let me check it',
    time: '2h ago',
    unreadCount: 0,
    isFavorite: false,
    isOnline: true,
    email: 'pamela.p@celebesfeed.co.id',
    phone: '0812-7788-9900',
    commodityInterest: 'Jagung Hibrida Kakas (40 Ton)'
  },
  {
    id: 'chat-5',
    name: 'Rafael Fox',
    company: 'Distributor Pangan Beriman',
    role: 'pembeli',
    roleLabel: 'Distributor Beras Minahasa',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Dialog ended',
    time: '1d ago',
    unreadCount: 12,
    isFavorite: false,
    isOnline: false,
    email: 'rafael.fox@panganberiman.id',
    phone: '0815-6677-8899',
    commodityInterest: 'Beras Superwin Minahasa (20 Ton)'
  },
  {
    id: 'chat-6',
    name: 'Arnold Lumempow',
    company: 'Gapoktan Modoinding Sejahtera',
    role: 'petani',
    roleLabel: 'Sentra Hortikultura Modoinding',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Awesome, that worked!',
    time: '2d ago',
    unreadCount: 0,
    isFavorite: false,
    isOnline: true,
    email: 'arnold.modoinding@agriconnect.id',
    phone: '0819-3344-5566',
    commodityInterest: 'Kentang Granola & Bawang Daun'
  },
  {
    id: 'chat-7',
    name: 'Mary Lester',
    company: 'CV Bumbu Segar Minahasa',
    role: 'pembeli',
    roleLabel: 'Industri Bumbu Olahan',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'You: Sorry to hear that, I\'m here...',
    time: '3d ago',
    unreadCount: 0,
    isFavorite: false,
    isOnline: false,
    email: 'mary.l@bumbusegar.id',
    phone: '0818-5566-7788',
    commodityInterest: 'Cabai Rawit / Rica Minahasa (10 Ton)'
  }
];

// Initial Messages Dictionary
const INITIAL_MESSAGES = {
  'chat-1': [
    {
      id: 'msg-1',
      sender: 'me',
      text: 'For information on how to configure smart applications, please refer to another help section: https://support.mysite.com/help/en-us',
      time: '2:14 PM',
      status: 'read'
    },
    {
      id: 'msg-2',
      sender: 'me',
      text: 'Please leave your contact information and we\'ll call you back.',
      time: '2:15 PM',
      status: 'read'
    },
    {
      id: 'msg-3',
      sender: 'contact_card',
      title: 'Contact Information',
      name: 'Alexandra Smith',
      company: 'PT Indofood Sukses Makmur Tbk',
      email: 'a.smith@google.com',
      phone: '(999) 999-95-98',
      comment: 'Please call me back at 11 AM'
    },
    {
      id: 'msg-4',
      sender: 'partner',
      text: 'Thank you for your information',
      time: '2:18 PM'
    }
  ],
  'chat-2': [
    {
      id: 'msg-201',
      sender: 'partner',
      text: 'Halo Pak Hengky, kami dari PT Royal Coconut ingin konfirmasi tanda jadi booking fee 5% untuk 25 Ton Kopra Putih sudah masuk di sistem penjamin.',
      time: '10:00 AM'
    },
    {
      id: 'msg-202',
      sender: 'me',
      text: 'Baik terima kasih Pak Tommie. Barang sudah siap disortir di gudang Kombi Minahasa, siap muat sesuai jadwal armada Anda.',
      time: '10:05 AM',
      status: 'read'
    },
    {
      id: 'msg-203',
      sender: 'me',
      text: 'You\'re welcome!',
      time: '10:06 AM',
      status: 'read'
    }
  ]
};

// Initial Directory of Potential Contacts for Searching
const INITIAL_DIRECTORY_USERS = [
  {
    id: 'user-101',
    name: 'Hendra Wijaya',
    company: 'PT Celebes Feedmill Minahasa',
    role: 'pembeli',
    roleLabel: 'Pembeli Industri Pakan',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    location: 'Tompaso Barat, Minahasa',
    commodity: 'Jagung Pipil Kering Hibrida',
    status: 'none' // 'none' | 'pending' | 'connected'
  },
  {
    id: 'user-102',
    name: 'Siti Rahmawati',
    company: 'Poktan Danau Tondano',
    role: 'petani',
    roleLabel: 'Petani Produsen Beras',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    location: 'Tondano Barat, Minahasa',
    commodity: 'Beras Premium Superwin Minahasa',
    status: 'none'
  },
  {
    id: 'user-103',
    name: 'Budi Santoso',
    company: 'Distributor Pangan Beriman',
    role: 'pembeli',
    roleLabel: 'Distributor Sembako Minahasa',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    location: 'Pasar Beriman, Tondano, Minahasa',
    commodity: 'Beras Superwin & Jagung Kakas',
    status: 'none'
  },
  {
    id: 'user-104',
    name: 'Dian Kusuma Wardani',
    company: 'Gapoktan Modoinding Sejahtera',
    role: 'petani',
    roleLabel: 'Petani Hortikultura Modoinding',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    location: 'Sinisir, Modoinding, Minahasa',
    commodity: 'Kentang Granola & Rica Minahasa',
    status: 'none'
  },
  {
    id: 'user-105',
    name: 'David Pratama',
    company: 'CV Minahasa Cengkeh Abadi',
    role: 'pembeli',
    roleLabel: 'Eksportir Cengkeh Minahasa',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    location: 'Kawangkoan, Minahasa',
    commodity: 'Cengkeh Zanzibar & Minyak Atsiri',
    status: 'none'
  },
  {
    id: 'user-106',
    name: 'Agus Supriyanto',
    company: 'Poktan Tou Kakas Mandiri',
    role: 'petani',
    roleLabel: 'Petani Jagung Hibrida',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    location: 'Kakas Barat, Minahasa',
    commodity: 'Jagung Hibrida Siap Panen',
    status: 'none'
  }
];

// Initial Incoming Requests (Permintaan Obrolan Masuk)
const INITIAL_INCOMING_REQUESTS = [
  {
    id: 'req-1',
    name: 'Jessica Tan',
    company: 'PT Wilmar Nabati Indonesia',
    role: 'pembeli',
    roleLabel: 'Procurement Manager',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80',
    message: 'Halo Pak Sudirman, kami tertarik pasokan Jagung Pipil Kering 50 Ton untuk kebutuhan fasilitas produksi Gresik. Ingin menghubungkan chat untuk mendiskusikan spesifikasi teknis.',
    time: '15 menit yang lalu',
    email: 'jessica.tan@wilmar.co.id',
    phone: '0812-3344-8899',
    commodityInterest: 'Jagung Pipil KA 14%'
  },
  {
    id: 'req-2',
    name: 'Bambang Sutrisno',
    company: 'Ketua Gapoktan Sari Tani Ngawi',
    role: 'petani',
    roleLabel: 'Kelompok Tani Padi',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    message: 'Salam Tani, kami ingin sharing info mengenai jadwal panen raya gabah kering giling dan pemesanan armada truk kontainer bersama.',
    time: '2 jam yang lalu',
    email: 'bambang.ngawi@gmail.com',
    phone: '0813-8899-0011',
    commodityInterest: 'Sinergi Armada Angkut Padi'
  }
];

export default function FarmerChatView() {
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState('chat-1');
  const [activeFilter, setActiveFilter] = useState('semua'); // 'semua' | 'belum_dibaca' | 'favorit'
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  // Add Friend Modal State
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendSearchQuery, setAddFriendSearchQuery] = useState('');
  const [addFriendRoleFilter, setAddFriendRoleFilter] = useState('semua'); // 'semua' | 'pembeli' | 'petani'
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState(INITIAL_DIRECTORY_USERS);

  // Incoming Requests Modal State
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState(INITIAL_INCOMING_REQUESTS);
  const [toastMessage, setToastMessage] = useState(null);

  // Helper trigger toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active chat object
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const activeMessages = (activeChat && messages[activeChat.id]) || [];

  // Filter chats list
  const filteredChats = chats.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                        c.company.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                        c.lastMessage.toLowerCase().includes(chatSearchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (activeFilter === 'belum_dibaca') {
      return c.unreadCount > 0;
    }
    if (activeFilter === 'favorit') {
      return c.isFavorite;
    }
    return true;
  });

  // Toggle favorite
  const handleToggleFavorite = (e, chatId) => {
    e.stopPropagation();
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  // Send message
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg]
    }));

    // Update last message in chats
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, lastMessage: `You: ${inputText.trim()}`, time: 'Baru saja' }
          : c
      )
    );

    setInputText('');
  };

  // Send friend request in Add Friend Modal
  const handleSendFriendRequest = (userId) => {
    setDirectoryUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'pending' } : u))
    );
    const targetUser = directoryUsers.find((u) => u.id === userId);
    triggerToast(`Permintaan pertemanan terkirim ke ${targetUser?.name || 'Pengguna'}`);
  };

  // Accept incoming request (SETUJU)
  const handleAcceptRequest = (req) => {
    // 1. Remove from incoming requests
    setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));

    // 2. Create new chat item
    const newChatId = `chat-req-${req.id}`;
    const newChat = {
      id: newChatId,
      name: req.name,
      company: req.company,
      role: req.role,
      roleLabel: req.roleLabel,
      avatar: req.avatar,
      lastMessage: req.message,
      time: 'Baru saja',
      unreadCount: 1,
      isFavorite: false,
      isOnline: true,
      email: req.email,
      phone: req.phone,
      commodityInterest: req.commodityInterest
    };

    // 3. Set welcome messages
    const newMsgs = [
      {
        id: `msg-acc-${Date.now()}-1`,
        sender: 'partner',
        text: req.message,
        time: 'Baru saja'
      },
      {
        id: `msg-acc-${Date.now()}-2`,
        sender: 'contact_card',
        title: 'Informasi Mitra Terhubung',
        name: req.name,
        company: req.company,
        email: req.email,
        phone: req.phone,
        comment: `Permintaan diterima. Komoditas diminati: ${req.commodityInterest}`
      }
    ];

    setChats((prev) => [newChat, ...prev]);
    setMessages((prev) => ({
      ...prev,
      [newChatId]: newMsgs
    }));

    // Switch to new chat
    setActiveChatId(newChatId);
    setShowRequestsModal(false);
    triggerToast(`Permintaan disetujui! Anda sekarang terhubung dengan ${req.name}.`);
  };

  // Reject incoming request (TOLAK)
  const handleRejectRequest = (reqId) => {
    const req = incomingRequests.find((r) => r.id === reqId);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== reqId));
    triggerToast(`Permintaan dari ${req?.name || 'Pengguna'} telah ditolak.`);
  };

  // Filter directory users
  const filteredDirectoryUsers = directoryUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(addFriendSearchQuery.toLowerCase()) ||
                        u.company.toLowerCase().includes(addFriendSearchQuery.toLowerCase()) ||
                        u.commodity.toLowerCase().includes(addFriendSearchQuery.toLowerCase()) ||
                        u.location.toLowerCase().includes(addFriendSearchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (addFriendRoleFilter !== 'semua') {
      return u.role === addFriendRoleFilter;
    }
    return true;
  });

  return (
    <div className="clone-chat-page-wrap">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="clone-chat-toast">
          <CheckCircle size={18} weight="fill" color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Dribbble-Style Chat Container */}
      <div className="clone-chat-app-container">
        {/* ================= LEFT COLUMN: CHATS LIST ================= */}
        <div className="clone-chat-sidebar">
          {/* Frozen Top Section in Sidebar */}
          <div className="clone-chat-sidebar-freeze-header">
            {/* Header */}
            <div className="clone-chat-sidebar-header">
              <h2 className="clone-chat-heading">Chats</h2>
              <div className="clone-chat-header-actions">
                {/* Incoming Requests Button: distinct from global notification bell */}
                <button
                  type="button"
                  className={`clone-chat-req-btn ${incomingRequests.length > 0 ? 'has-badge' : ''}`}
                  onClick={() => setShowRequestsModal(true)}
                  title={`Permintaan Obrolan Masuk (${incomingRequests.length})`}
                >
                  <UserList size={16} weight="bold" />
                  <span className="clone-chat-req-label">Permintaan</span>
                  {incomingRequests.length > 0 && (
                    <span className="clone-chat-notif-dot">{incomingRequests.length}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Search bar inside chats list */}
            <div className="clone-chat-search-wrap">
              <MagnifyingGlass size={13} className="clone-chat-search-icon" />
              <input
                type="text"
                className="clone-chat-search-input"
                placeholder="Cari percakapan..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
              />
              {chatSearchQuery && (
                <button
                  type="button"
                  className="clone-chat-search-clear"
                  onClick={() => setChatSearchQuery('')}
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>

            {/* Filter Pills (Semua, Belum dibaca, Favorit, +) */}
            <div className="clone-chat-filter-pills-row">
              <button
                type="button"
                className={`clone-chat-pill-btn ${activeFilter === 'semua' ? 'active' : ''}`}
                onClick={() => setActiveFilter('semua')}
              >
                Semua
              </button>
              <button
                type="button"
                className={`clone-chat-pill-btn ${activeFilter === 'belum_dibaca' ? 'active' : ''}`}
                onClick={() => setActiveFilter('belum_dibaca')}
              >
                Belum dibaca
                {chats.filter((c) => c.unreadCount > 0).length > 0 && (
                  <span className="clone-chat-pill-num">
                    {chats.filter((c) => c.unreadCount > 0).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`clone-chat-pill-btn ${activeFilter === 'favorit' ? 'active' : ''}`}
                onClick={() => setActiveFilter('favorit')}
              >
                Favorit
              </button>
              {/* Tombol + Tambah Teman */}
              <button
                type="button"
                className="clone-chat-pill-btn plus"
                onClick={() => setShowAddFriendModal(true)}
                title="Cari & Tambah Teman Baru"
              >
                <Plus size={11} weight="bold" />
              </button>
            </div>
          </div>

          {/* Chat List Items */}
          <div className="clone-chat-items-list">
            {filteredChats.map((c) => {
              const isActive = c.id === activeChatId;
              return (
                <div
                  key={c.id}
                  className={`clone-chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveChatId(c.id)}
                >
                  <div className="clone-chat-avatar-wrap">
                    <img src={c.avatar} alt={c.name} className="clone-chat-avatar-img" />
                    {c.isOnline && <span className="clone-chat-online-badge" />}
                  </div>

                  <div className="clone-chat-item-content">
                    <div className="clone-chat-item-top">
                      <span className="clone-chat-item-name">{c.name}</span>
                      <span className="clone-chat-item-time">{c.time}</span>
                    </div>

                    <div className="clone-chat-item-bottom">
                      <span className="clone-chat-item-msg">{c.lastMessage}</span>
                      {isActive ? (
                        <Checks size={15} weight="bold" className="clone-chat-active-tick" />
                      ) : c.unreadCount > 0 ? (
                        <span className="clone-chat-unread-count">{c.unreadCount}</span>
                      ) : (
                        <Check size={14} className="clone-chat-sent-tick" />
                      )}
                    </div>
                  </div>

                  {/* Favorite star toggle on hover */}
                  <button
                    type="button"
                    className={`clone-chat-star-btn ${c.isFavorite ? 'starred' : ''}`}
                    onClick={(e) => handleToggleFavorite(e, c.id)}
                    title={c.isFavorite ? 'Hapus dari favorit' : 'Tandai sebagai favorit'}
                  >
                    <Star size={13} weight={c.isFavorite ? 'fill' : 'regular'} />
                  </button>
                </div>
              );
            })}

            {filteredChats.length === 0 && (
              <div className="clone-chat-empty-state">
                <p>Tidak ada percakapan ditemukan.</p>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: CONVERSATION VIEW ================= */}
        <div className="clone-chat-main">
          {activeChat ? (
            <>
              {/* Conversation Top Header */}
              <div className="clone-chat-main-header">
                <div className="clone-chat-partner-info">
                  <div className="clone-chat-avatar-wrap header">
                    <img src={activeChat.avatar} alt={activeChat.name} className="clone-chat-avatar-img" />
                    {activeChat.isOnline && <span className="clone-chat-online-badge" />}
                  </div>
                  <div className="clone-chat-partner-meta-block">
                    <h3 className="clone-chat-partner-name">{activeChat.name}</h3>
                    <span className="clone-chat-partner-role-text">
                      {activeChat.role === 'petani' ? 'Petani' : 'Pembeli'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Stream Area */}
              <div className="clone-chat-stream">
                {activeMessages.map((msg) => {
                  if (msg.sender === 'contact_card') {
                    return (
                      <div key={msg.id} className="clone-chat-info-card">
                        <h4 className="clone-chat-info-title">{msg.title}</h4>
                        <div className="clone-chat-info-grid">
                          <div className="clone-chat-info-item">
                            <span className="clone-chat-info-label">Name:</span>
                            <span className="clone-chat-info-val highlight">{msg.name}</span>
                          </div>
                          <div className="clone-chat-info-item">
                            <span className="clone-chat-info-label">Email:</span>
                            <span className="clone-chat-info-val link">{msg.email}</span>
                          </div>
                          <div className="clone-chat-info-item">
                            <span className="clone-chat-info-label">Phone:</span>
                            <span className="clone-chat-info-val">{msg.phone}</span>
                          </div>
                          <div className="clone-chat-info-item">
                            <span className="clone-chat-info-label">Comment:</span>
                            <span className="clone-chat-info-val">{msg.comment}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const isMe = msg.sender === 'me';
                  return (
                    <div
                      key={msg.id}
                      className={`clone-chat-bubble-row ${isMe ? 'sent' : 'received'}`}
                    >
                      <div className={`clone-chat-bubble ${isMe ? 'sent' : 'received'}`}>
                        <p className="clone-chat-bubble-text">{msg.text}</p>
                        <div className="clone-chat-bubble-meta">
                          <span>{msg.time}</span>
                          {isMe && <Checks size={13} weight="bold" className="clone-bubble-tick" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Box (Matching Image 1 - Ultra Compact) */}
              <div className="clone-chat-input-area">
                <form onSubmit={handleSendMessage} className="clone-chat-input-form">
                  <textarea
                    className="clone-chat-textarea"
                    placeholder="We'll contact you..."
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value.slice(0, 1200))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  <div className="clone-chat-input-bottom-bar">
                    <div className="clone-chat-input-tools">
                      <button type="button" className="clone-chat-tool-btn" title="Lampirkan Dokumen">
                        <FileText size={14} />
                      </button>
                      <button type="button" className="clone-chat-tool-btn" title="Kirim Foto/Gambar">
                        <ImageIcon size={14} />
                      </button>
                      <button type="button" className="clone-chat-tool-btn" title="Sisipkan Berkas">
                        <Paperclip size={14} />
                      </button>
                      <button type="button" className="clone-chat-tool-btn" title="Pilih Emoji">
                        <Smiley size={14} />
                      </button>
                    </div>

                    <div className="clone-chat-input-right">
                      <span className="clone-chat-char-count">{inputText.length}/1200</span>
                      <button
                        type="submit"
                        className="clone-chat-send-btn"
                        disabled={!inputText.trim()}
                      >
                        <span>Send message</span>
                        <ArrowRight size={11} weight="bold" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="clone-chat-no-active">
              <p>Pilih percakapan dari daftar di sebelah kiri.</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL 1: TAMBAH TEMAN & SEARCH PENGGUNA (TOMBOL +) ================= */}
      {showAddFriendModal && (
        <div className="clone-chat-modal-backdrop" onClick={() => setShowAddFriendModal(false)}>
          <div className="clone-chat-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="clone-chat-modal-header">
              <div>
                <h3 className="clone-chat-modal-title">Tambah Kontak & Teman Baru</h3>
                <p className="clone-chat-modal-subtitle">
                  Cari sesama petani produsen atau perwakilan pembeli terverifikasi
                </p>
              </div>
              <button
                type="button"
                className="clone-chat-modal-close"
                onClick={() => setShowAddFriendModal(false)}
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Search Input */}
            <div className="clone-chat-modal-search">
              <MagnifyingGlass size={16} className="clone-chat-search-icon" />
              <input
                type="text"
                placeholder="Cari nama pengguna, perusahaan, komoditas, atau kota..."
                value={addFriendSearchQuery}
                onChange={(e) => setAddFriendSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Dropdown dengan Segitiga / Caret */}
            <div className="clone-chat-filter-dropdown-container">
              <span className="clone-filter-label">Filter Pengguna:</span>
              <div className="clone-dropdown-rel-box">
                <button
                  type="button"
                  className="clone-dropdown-trigger-btn"
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                >
                  <span>
                    {addFriendRoleFilter === 'semua'
                      ? 'Semua Pengguna'
                      : addFriendRoleFilter === 'pembeli'
                      ? 'Pembeli'
                      : 'Petani'}
                  </span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`clone-dropdown-caret ${filterDropdownOpen ? 'open' : ''}`}
                  />
                </button>

                {filterDropdownOpen && (
                  <div className="clone-dropdown-menu-list">
                    <button
                      type="button"
                      className={`clone-dropdown-item ${addFriendRoleFilter === 'semua' ? 'active' : ''}`}
                      onClick={() => {
                        setAddFriendRoleFilter('semua');
                        setFilterDropdownOpen(false);
                      }}
                    >
                      Semua Pengguna
                    </button>
                    <button
                      type="button"
                      className={`clone-dropdown-item ${addFriendRoleFilter === 'pembeli' ? 'active' : ''}`}
                      onClick={() => {
                        setAddFriendRoleFilter('pembeli');
                        setFilterDropdownOpen(false);
                      }}
                    >
                      Pembeli
                    </button>
                    <button
                      type="button"
                      className={`clone-dropdown-item ${addFriendRoleFilter === 'petani' ? 'active' : ''}`}
                      onClick={() => {
                        setAddFriendRoleFilter('petani');
                        setFilterDropdownOpen(false);
                      }}
                    >
                      Petani
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Results List */}
            <div className="clone-chat-modal-results">
              {filteredDirectoryUsers.map((user) => (
                <div key={user.id} className="clone-modal-user-card">
                  <img src={user.avatar} alt={user.name} className="clone-modal-user-avatar" />
                  <div className="clone-modal-user-info">
                    <span className="clone-modal-user-name">{user.name}</span>
                    <span className="clone-modal-user-role-text">
                      {user.role === 'petani' ? 'Petani' : 'Pembeli'}
                    </span>
                  </div>

                  {user.status === 'pending' ? (
                    <span className="clone-modal-btn-pending">
                      <span>Terkirim</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="clone-modal-btn-add"
                      onClick={() => handleSendFriendRequest(user.id)}
                      title={`Hubungkan dengan ${user.name}`}
                    >
                      <Plus size={13} weight="bold" />
                      <span>Tambah</span>
                    </button>
                  )}
                </div>
              ))}

              {filteredDirectoryUsers.length === 0 && (
                <div className="clone-modal-empty">
                  <p>Tidak ada pengguna ditemukan dengan kriteria tersebut.</p>
                </div>
              )}
            </div>

            <div className="clone-chat-modal-footer">
              <button
                type="button"
                className="clone-chat-modal-done-btn"
                onClick={() => setShowAddFriendModal(false)}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: PERMINTAAN OBROLAN MASUK (SETUJU / TOLAK) ================= */}
      {showRequestsModal && (
        <div className="clone-chat-modal-backdrop" onClick={() => setShowRequestsModal(false)}>
          <div className="clone-chat-modal-box requests" onClick={(e) => e.stopPropagation()}>
            <div className="clone-chat-modal-header">
              <div>
                <h3 className="clone-chat-modal-title">Permintaan Obrolan Masuk</h3>
                <p className="clone-chat-modal-subtitle">
                  Pihak yang ingin memulai percakapan transaksi dengan Anda
                </p>
              </div>
              <button
                type="button"
                className="clone-chat-modal-close"
                onClick={() => setShowRequestsModal(false)}
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="clone-chat-requests-list">
              {incomingRequests.map((req) => (
                <div key={req.id} className="clone-request-card">
                  <div className="clone-request-top">
                    <img src={req.avatar} alt={req.name} className="clone-request-avatar" />
                    <div className="clone-request-info">
                      <span className="clone-request-name">{req.name}</span>
                      <span className="clone-request-role-text">
                        {req.role === 'petani' ? 'Petani' : 'Pembeli'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: SETUJU or TOLAK */}
                  <div className="clone-request-actions">
                    <button
                      type="button"
                      className="clone-request-btn-reject"
                      onClick={() => handleRejectRequest(req.id)}
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      className="clone-request-btn-accept"
                      onClick={() => handleAcceptRequest(req)}
                    >
                      Setuju
                    </button>
                  </div>
                </div>
              ))}

              {incomingRequests.length === 0 && (
                <div className="clone-modal-empty">
                  <CheckCircle size={32} color="#10b981" weight="fill" style={{ marginBottom: '8px' }} />
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Semua permintaan telah diproses</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Belum ada permintaan obrolan baru saat ini.</p>
                </div>
              )}
            </div>

            <div className="clone-chat-modal-footer">
              <button
                type="button"
                className="clone-chat-modal-done-btn"
                onClick={() => setShowRequestsModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
