import React, { useState, useEffect } from 'react';
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
  CheckCircle,
  ShieldCheck,
  Phone,
  Envelope,
  MapPin,
  Clock,
  CaretLeft
} from '@phosphor-icons/react';
import {

  fetchRealProfiles,
  fetchUserConversations,
  fetchMessagesBetween,
  sendChatMessage,
  fetchIncomingChatRequests,
  sendChatRequest,
  respondToChatRequest,
  fetchDirectoryUsers,
  subscribeChatMessages,
  subscribeChatRequests,
  subscribeProfileUpdates,
  markMessagesAsRead,
  formatUserRole
} from '../../lib/chatService';
import { supabase } from '../../lib/supabaseClient';
import { DEFAULT_AVATAR } from '../../lib/constants';


export default function BuyerChatView({ currentUserId: propUserId, currentUserProfile: propProfile }) {
  // Tanpa seed fallback: null = belum ada sesi, jangan tampilkan chat user lain.
  const [currentUserId, setCurrentUserId] = useState(() => propUserId || null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [messages, setMessages] = useState({});
  const [inputText, setInputText] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('semua'); // 'semua' | 'belum_dibaca' | 'favorit'
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [addFriendSearchQuery, setAddFriendSearchQuery] = useState('');
  const [addFriendRoleFilter, setAddFriendRoleFilter] = useState('semua');
  
  // State data for modals
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Sync propUserId or check Supabase auth
  useEffect(() => {
    if (propUserId) {
      setCurrentUserId(propUserId);
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.id) setCurrentUserId(user.id);
      });
    }
  }, [propUserId]);

  // Load all initial live chat data from Supabase
  const loadAllChatData = async () => {
    try {
      const [profiles, conversations, requests, dirUsers] = await Promise.all([
        fetchRealProfiles(),
        fetchUserConversations(currentUserId, 'pembeli'),
        fetchIncomingChatRequests(currentUserId),
        fetchDirectoryUsers(currentUserId)
      ]);

      const myProf = propProfile || profiles.find(p => p.id === currentUserId) || {
        full_name: 'Hendra Pratama, S.T.',
        company_name: 'PT Royal Agro Minahasa',
        avatar_url: DEFAULT_AVATAR,
        role: 'pembeli'
      };
      setCurrentProfile(myProf);
      setChats(conversations);
      setIncomingRequests(requests);
      setDirectoryUsers(dirUsers);

      // Pre-select first chat if activeChatId is not set
      if (conversations.length > 0) {
        setActiveChatId(prev => prev && conversations.some(c => c.id === prev) ? prev : conversations[0].id);
      }
    } catch (err) {
      console.error('[PesanPembeli] Error loading live data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      // Belum ada sesi: kosongkan agar tidak tampil chat basi milik user sebelumnya.
      setChats([]);
      setMessages({});
      setActiveChatId('');
      setIsLoading(false);
      return;
    }
    loadAllChatData();

    // Subscribe to realtime incoming chat messages
    const unsubscribeMsgs = subscribeChatMessages(currentUserId, (newMsgRow) => {
      const partnerId = newMsgRow.sender_id === currentUserId ? newMsgRow.receiver_id : newMsgRow.sender_id;
      const formatted = {
        id: newMsgRow.id,
        sender: newMsgRow.sender_id === currentUserId ? 'me' : 'them',
        text: newMsgRow.message,
        time: new Date(newMsgRow.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: newMsgRow.is_read ? 'read' : 'sent',
        createdAt: newMsgRow.created_at
      };

      setMessages(prev => ({
        ...prev,
        [partnerId]: [...(prev[partnerId] || []), formatted]
      }));

      setChats(prev => prev.map(c => {
        if (c.id === partnerId) {
          return {
            ...c,
            lastMessage: newMsgRow.sender_id === currentUserId ? `Anda: ${newMsgRow.message}` : newMsgRow.message,
            time: 'Baru saja'
          };
        }
        return c;
      }));
    });

    // Subscribe to realtime chat requests
    const unsubscribeReqs = subscribeChatRequests(currentUserId, () => {
      fetchIncomingChatRequests(currentUserId).then(setIncomingRequests);
      fetchDirectoryUsers(currentUserId).then(setDirectoryUsers);
      fetchUserConversations(currentUserId, 'pembeli').then(setChats);
    });

    // Subscribe to realtime profile updates (saat ada perubahan profil: nama, foto/avatar, role)
    const unsubscribeProfiles = subscribeProfileUpdates((payload) => {
      const updatedRow = payload?.new;
      if (updatedRow && updatedRow.id) {
        if (updatedRow.id === currentUserId) {
          setCurrentProfile(prev => ({
            ...prev,
            ...updatedRow,
            name: updatedRow.full_name || prev?.name,
            full_name: updatedRow.full_name || prev?.full_name,
            avatar: updatedRow.avatar_url || prev?.avatar,
            avatar_url: updatedRow.avatar_url || prev?.avatar_url,
            role: updatedRow.role || prev?.role
          }));
        }

        setChats(prev => prev.map(c => {
          if (c.id === updatedRow.id) {
            return {
              ...c,
              name: updatedRow.full_name || c.name,
              avatar: updatedRow.avatar_url || c.avatar,
              role: updatedRow.role || c.role,
              roleLabel: formatUserRole(updatedRow.role || c.role)
            };
          }
          return c;
        }));
      }

      fetchRealProfiles().then(profiles => {
        const my = profiles.find(p => p.id === currentUserId);
        if (my) setCurrentProfile(my);
      });
      fetchUserConversations(currentUserId, 'pembeli').then(setChats);
    });

    return () => {
      unsubscribeMsgs();
      unsubscribeReqs();
      unsubscribeProfiles();
    };
  }, [currentUserId]);

  // Load messages for currently selected active chat partner
  useEffect(() => {
    if (!activeChatId) return;

    let isSubscribed = true;
    fetchMessagesBetween(currentUserId, activeChatId).then(loadedMsgs => {
      if (isSubscribed) {
        setMessages(prev => ({
          ...prev,
          [activeChatId]: loadedMsgs
        }));
      }
    });

    // Mark messages as read in Supabase
    markMessagesAsRead(currentUserId, activeChatId);

    return () => {
      isSubscribed = false;
    };
  }, [activeChatId, currentUserId]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeMessages = messages[activeChatId] || [];

  // Toggle favorite
  const handleToggleFavorite = (e, chatId) => {
    e.stopPropagation();
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  // Filter chats by search and pills
  const filteredChats = chats.filter(c => {
    if (activeFilter === 'belum_dibaca' && c.unreadCount === 0) return false;
    if (activeFilter === 'favorit' && !c.isFavorite) return false;

    if (chatSearchQuery.trim()) {
      const q = chatSearchQuery.toLowerCase();
      const match = c.name.toLowerCase().includes(q) ||
                    (c.company || '').toLowerCase().includes(q) ||
                    (c.commodity || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Send message handler to Supabase
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText.trim();
    setInputText('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    // Immediate optimistic update
    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), optimisticMsg]
    }));

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessage: `Anda: ${textToSend}`,
          time: 'Baru saja'
        };
      }
      return c;
    }));

    try {
      const res = await sendChatMessage({
        senderId: currentUserId,
        receiverId: activeChatId,
        text: textToSend
      });

      if (res?.data) {
        setMessages(prev => ({
          ...prev,
          [activeChatId]: (prev[activeChatId] || []).map(m => m.id === tempId ? { ...m, id: res.data.id } : m)
        }));
      }
    } catch (err) {
      console.error('[PesanPembeli] Gagal kirim pesan ke Supabase:', err);
    }
  };

  // Mulai obrolan atau ajukan permintaan kontak
  const handleStartChatWithUser = async (user) => {
    // 1. Admin atau relasi yang sudah 'accepted' / 'connected' langsung buka obrolan
    if (user.role === 'admin' || user.status === 'accepted' || user.status === 'connected') {
      const existingChat = chats.find(c => c.id === user.id);
      if (existingChat) {
        setActiveChatId(existingChat.id);
      } else {
        const newChatObj = {
          id: user.id,
          partnerId: user.id,
          name: user.name,
          company: user.company,
          role: user.role,
          roleLabel: user.roleLabel,
          avatar: user.avatar,
          lastMessage: 'Mulai percakapan baru...',
          time: 'Baru saja',
          unreadCount: 0,
          isFavorite: false,
          isOnline: true,
          phone: user.phone || '-',
          commodity: user.commodity || ''
        };
        setChats(prev => [newChatObj, ...prev]);
        setActiveChatId(user.id);
      }
      setShowAddFriendModal(false);
      showToast(`Membuka percakapan dengan ${user.name}`);
      return;
    }

    // 2. Jika Petani dan status masih pending
    if (user.status === 'pending') {
      showToast(`Permintaan obrolan sedang menunggu persetujuan dari ${user.name}.`);
      return;
    }

    // 3. Jika Petani belum ada persetujuan -> Wajib kirim permintaan obrolan ke Supabase
    try {
      const companyName = currentProfile?.company_name || 'PT Royal Agro Minahasa';
      await sendChatRequest({
        senderId: currentUserId,
        receiverId: user.id,
        note: `Halo Pak/Ibu ${user.name}, kami dari ${companyName} ingin berdiskusi terkait pasokan komoditas untuk kemitraan pengadaan.`
      });

      setDirectoryUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'pending' } : u));
      showToast(`Permintaan obrolan berhasil dikirim ke ${user.name}! Menunggu persetujuan petani.`);
    } catch (err) {
      console.error('[PesanPembeli] Gagal kirim permintaan chat:', err);
      showToast('Gagal mengirim permintaan obrolan. Silakan coba lagi.');
    }
  };

  // Menyetujui permintaan obrolan masuk dari Petani
  const handleAcceptRequest = async (req) => {
    try {
      await respondToChatRequest(req.id, 'accepted');
      setIncomingRequests(prev => prev.filter(r => r.id !== req.id));

      // Reload percakapan dan direktori
      const updatedChats = await fetchUserConversations(currentUserId, 'pembeli');
      setChats(updatedChats);
      setActiveChatId(req.senderId);
      setShowRequestsModal(false);
      showToast(`Permintaan obrolan dari ${req.name} disetujui! Anda sekarang terhubung.`);
    } catch (err) {
      console.error('[PesanPembeli] Gagal menyetujui permintaan:', err);
      showToast('Gagal memproses persetujuan.');
    }
  };

  // Menolak permintaan obrolan
  const handleDeclineRequest = async (reqId) => {
    try {
      await respondToChatRequest(reqId, 'declined');
      setIncomingRequests(prev => prev.filter(r => r.id !== reqId));
      showToast('Permintaan obrolan ditolak.');
    } catch (err) {
      console.error('[PesanPembeli] Gagal menolak permintaan:', err);
    }
  };

  // Filter directory users in modal
  const filteredDirectoryUsers = directoryUsers.filter((u) => {
    const q = addFriendSearchQuery.toLowerCase();
    const matchSearch = !addFriendSearchQuery || 
      u.name.toLowerCase().includes(q) ||
      u.company.toLowerCase().includes(q) ||
      u.commodity.toLowerCase().includes(q) ||
      u.location.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (addFriendRoleFilter !== 'semua' && u.role !== addFriendRoleFilter) return false;
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

      {/* Main Dribbble-Style Chat Container - Fully Frozen */}
      <div className={`clone-chat-app-container ${activeChat ? 'has-active-chat' : ''}`}>
        
        {/* ================= LEFT COLUMN: CHATS LIST ================= */}
        <div className="clone-chat-sidebar">
          {/* Frozen Top Section in Sidebar */}
          <div className="clone-chat-sidebar-freeze-header">
            {/* Header */}
            <div className="clone-chat-sidebar-header">
              <h2 className="clone-chat-heading">Chats</h2>
              <div className="clone-chat-header-actions">
                {/* Incoming Requests Button */}
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

            {/* Sleek Search bar inside chats list */}
            <div className="clone-chat-search-wrap">
              <MagnifyingGlass size={14} className="clone-chat-search-icon" />
              <input
                type="text"
                className="clone-chat-search-input"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                placeholder="Cari percakapan..."
              />
              {chatSearchQuery && (
                <button
                  type="button"
                  className="clone-chat-search-clear"
                  onClick={() => setChatSearchQuery('')}
                  title="Hapus pencarian"
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
                title="Cari & Tambah Kontak Baru"
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
                  onClick={() => {
                    setActiveChatId(c.id);
                    setChats(prev => prev.map(item => item.id === c.id ? { ...item, unreadCount: 0 } : item));
                  }}
                >
                  <div className="clone-chat-avatar-wrap">
                    <img src={c.avatar || DEFAULT_AVATAR} alt={c.name} className="clone-chat-avatar-img" onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
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

                  {/* Favorite star toggle */}
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
              {/* Conversation Top Header: HANYA NAMA DAN DIBAWAHNYA ROLE */}
              <div className="clone-chat-main-header">
                <button
                  type="button"
                  className="clone-chat-mobile-back-btn"
                  onClick={() => setActiveChat(null)}
                  title="Kembali ke daftar obrolan"
                  aria-label="Kembali"
                >
                  <CaretLeft size={20} weight="bold" />
                </button>
                <div className="clone-chat-partner-info">
                  <div className="clone-chat-avatar-wrap header">
                    <img src={activeChat.avatar || DEFAULT_AVATAR} alt={activeChat.name} className="clone-chat-avatar-img" onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
                    {activeChat.isOnline && <span className="clone-chat-online-badge" />}
                  </div>
                  <div className="clone-chat-partner-meta-block">
                    <h3 className="clone-chat-partner-name">{activeChat.name}</h3>
                    <span className="clone-chat-partner-role-text">
                      {formatUserRole(activeChat.role)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Stream Area */}
              <div className="clone-chat-stream">
                {activeMessages.map((msg) => {
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

              {/* Message Input Box (Ultra Compact) */}
              <div className="clone-chat-input-area">
                <form onSubmit={handleSendMessage} className="clone-chat-input-form">
                  <textarea
                    className="clone-chat-textarea"
                    placeholder={`Ketik pesan ke ${activeChat.name}...`}
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
                      <button type="button" className="clone-chat-tool-btn" title="Lampirkan Dokumen Kontrak">
                        <FileText size={14} />
                      </button>
                      <button type="button" className="clone-chat-tool-btn" title="Kirim Foto/Bukti">
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
                        <span>Kirim</span>
                        <ArrowRight size={12} weight="bold" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="clone-chat-no-active">
              <p>Pilih percakapan dari daftar di sebelah kiri untuk mulai mengobrol.</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL 1: TAMBAH KONTAK & TEMAN BARU (TOMBOL +) ================= */}
      {showAddFriendModal && (
        <div className="clone-chat-modal-backdrop" onClick={() => setShowAddFriendModal(false)}>
          <div className="clone-chat-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="clone-chat-modal-header">
              <div>
                <h3 className="clone-chat-modal-title">Tambah Kontak Mitra</h3>
                <p className="clone-chat-modal-subtitle">
                  Cari mitra kelompok tani atau admin penjamin untuk memulai obrolan langsung
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

            {/* Modal Search Input */}
            <div className="clone-chat-modal-search">
              <MagnifyingGlass size={15} className="clone-chat-search-icon" />
              <input
                type="text"
                value={addFriendSearchQuery}
                onChange={(e) => setAddFriendSearchQuery(e.target.value)}
                placeholder="Cari nama, kelompok tani, komoditas, atau kota..."
              />
              {addFriendSearchQuery && (
                <button
                  type="button"
                  className="clone-chat-search-clear"
                  onClick={() => setAddFriendSearchQuery('')}
                  style={{ right: '2.5rem' }}
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="clone-chat-filter-pills-row" style={{ padding: '0.25rem 1.75rem 0.5rem 1.75rem', borderBottom: 'none' }}>
              <button
                type="button"
                className={`clone-chat-pill-btn ${addFriendRoleFilter === 'semua' ? 'active' : ''}`}
                onClick={() => setAddFriendRoleFilter('semua')}
              >
                Semua Mitra
              </button>
              <button
                type="button"
                className={`clone-chat-pill-btn ${addFriendRoleFilter === 'petani' ? 'active' : ''}`}
                onClick={() => setAddFriendRoleFilter('petani')}
              >
                Petani Produsen
              </button>
              <button
                type="button"
                className={`clone-chat-pill-btn ${addFriendRoleFilter === 'admin' ? 'active' : ''}`}
                onClick={() => setAddFriendRoleFilter('admin')}
              >
                Admin Penjamin
              </button>
            </div>

            {/* Users Directory List */}
            <div className="clone-chat-directory-list">
              {filteredDirectoryUsers.map((u) => (
                <div key={u.id} className="clone-chat-directory-item">
                  <div className="clone-chat-dir-avatar-wrap">
                    <img src={u.avatar || DEFAULT_AVATAR} alt={u.name} className="clone-chat-dir-avatar-img" onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
                  </div>
                  <div className="clone-chat-dir-info">
                    <div className="clone-chat-dir-name-row">
                      <span className="clone-chat-dir-name">{u.name}</span>
                      <span className={`clone-chat-role-pill ${u.role}`}>
                        {u.role === 'petani' ? 'Petani' : 'Admin'}
                      </span>
                    </div>
                    <span className="clone-chat-dir-company">{u.company}</span>
                    <span className="clone-chat-dir-commodity">
                      Komoditas: <strong>{u.commodity}</strong> • {u.location}
                    </span>
                  </div>
                  {u.role === 'admin' || u.status === 'accepted' || u.status === 'connected' ? (
                    <button
                      type="button"
                      className="clone-chat-dir-add-btn"
                      onClick={() => handleStartChatWithUser(u)}
                      title="Mulai Percakapan Langsung"
                    >
                      <Plus size={14} weight="bold" />
                      <span>Mulai Chat</span>
                    </button>
                  ) : u.status === 'pending' ? (
                    <button
                      type="button"
                      className="clone-modal-btn-pending"
                      disabled
                      title="Menunggu Persetujuan Petani"
                    >
                      <Clock size={13} weight="bold" />
                      <span>Menunggu</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="clone-chat-dir-add-btn"
                      style={{ background: '#059669' }}
                      onClick={() => handleStartChatWithUser(u)}
                      title="Kirim Permintaan Obrolan ke Petani"
                    >
                      <UserPlus size={14} weight="bold" />
                      <span>Minta Izin Chat</span>
                    </button>
                  )}
                </div>
              ))}

              {filteredDirectoryUsers.length === 0 && (
                <div className="clone-modal-empty">
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Tidak Ada Kontak Ditemukan</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Coba kata kunci pencarian yang lain.</p>
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

      {/* ================= MODAL 2: PERMINTAAN OBROLAN MASUK ================= */}
      {showRequestsModal && (
        <div className="clone-chat-modal-backdrop" onClick={() => setShowRequestsModal(false)}>
          <div className="clone-chat-modal-box requests" onClick={(e) => e.stopPropagation()}>
            <div className="clone-chat-modal-header">
              <div>
                <h3 className="clone-chat-modal-title">Permintaan Obrolan Masuk</h3>
                <p className="clone-chat-modal-subtitle">
                  Petani produsen yang ingin membuka jalur penawaran langsung dengan Anda
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
                <div key={req.id} className="clone-chat-req-card">
                  <div className="clone-chat-req-top">
                    <img src={req.avatar || DEFAULT_AVATAR} alt={req.name} className="clone-chat-req-avatar" onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
                    <div className="clone-chat-req-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 className="clone-chat-req-name">{req.name}</h4>
                          <span className={`clone-chat-role-pill ${req.role}`}>
                            {req.role === 'petani' ? 'Petani' : 'Pembeli'}
                          </span>
                        </div>
                        <span className="clone-chat-req-time">{req.time}</span>
                      </div>
                      <span className="clone-chat-req-company">{req.company}</span>
                    </div>
                  </div>

                  {req.note && (
                    <p className="clone-chat-req-note">"{req.note}"</p>
                  )}

                  <div className="clone-chat-req-actions">
                    <button
                      type="button"
                      className="clone-chat-req-btn-ignore"
                      onClick={() => handleDeclineRequest(req.id)}
                    >
                      Abaikan
                    </button>
                    <button
                      type="button"
                      className="clone-chat-req-btn-accept"
                      onClick={() => handleAcceptRequest(req)}
                    >
                      <CheckCircle size={15} weight="bold" />
                      <span>Terima Obrolan</span>
                    </button>
                  </div>
                </div>
              ))}

              {incomingRequests.length === 0 && (
                <div className="clone-modal-empty">
                  <CheckCircle size={32} color="#10b981" weight="fill" style={{ marginBottom: '8px' }} />
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Semua permintaan telah diproses</p>
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
