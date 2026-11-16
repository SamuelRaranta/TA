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
  Clock
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


export default function FarmerChatView({ currentUserId: propUserId, currentUserProfile: propProfile }) {
  // Tanpa seed fallback: null = belum ada sesi, jangan tampilkan chat user lain.
  const [currentUserId, setCurrentUserId] = useState(() => propUserId || null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [activeFilter, setActiveFilter] = useState('semua'); // 'semua' | 'belum_dibaca' | 'favorit'
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [messages, setMessages] = useState({});
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Friend Modal State
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendSearchQuery, setAddFriendSearchQuery] = useState('');
  const [addFriendRoleFilter, setAddFriendRoleFilter] = useState('semua'); // 'semua' | 'pembeli' | 'admin'
  const [directoryUsers, setDirectoryUsers] = useState([]);

  // Incoming Requests Modal State
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Helper trigger toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
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
        fetchUserConversations(currentUserId, 'petani'),
        fetchIncomingChatRequests(currentUserId),
        fetchDirectoryUsers(currentUserId)
      ]);

      const myProf = propProfile || profiles.find(p => p.id === currentUserId) || {
        full_name: 'Samuel Raranta',
        group_name: 'Gapoktan Modoinding Sejahtera',
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
        role: 'petani'
      };
      setCurrentProfile(myProf);
      setChats(conversations);
      setIncomingRequests(requests);
      setDirectoryUsers(dirUsers);

      if (conversations.length > 0) {
        setActiveChatId(prev => prev && conversations.some(c => c.id === prev) ? prev : conversations[0].id);
      }
    } catch (err) {
      console.error('[PesanPetani] Error loading live data:', err);
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

    // Subscribe to realtime messages
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
      fetchUserConversations(currentUserId, 'petani').then(setChats);
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
      fetchUserConversations(currentUserId, 'petani').then(setChats);
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

  // Active chat object
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const activeMessages = (activeChat && messages[activeChat.id]) || [];

  // Filter chats list
  const filteredChats = chats.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                        (c.company || '').toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                        (c.commodity || '').toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                        (c.lastMessage || '').toLowerCase().includes(chatSearchQuery.toLowerCase());
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

  // Send message to Supabase
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText.trim();
    setInputText('');

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg]
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, lastMessage: `Anda: ${textToSend}`, time: 'Baru saja' }
          : c
      )
    );

    try {
      const res = await sendChatMessage({
        senderId: currentUserId,
        receiverId: activeChat.id,
        text: textToSend
      });
      if (res?.data) {
        setMessages(prev => ({
          ...prev,
          [activeChat.id]: (prev[activeChat.id] || []).map(m => m.id === tempId ? { ...m, id: res.data.id } : m)
        }));
      }
    } catch (err) {
      console.error('[PesanPetani] Gagal kirim pesan ke Supabase:', err);
    }
  };

  // Hubungkan dengan kontak (Admin langsung, Pembeli via permintaan)
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
      triggerToast(`Membuka percakapan dengan ${user.name}`);
      return;
    }

    // 2. Jika Pembeli dan status masih pending
    if (user.status === 'pending') {
      triggerToast(`Permintaan obrolan sedang menunggu persetujuan dari ${user.name}.`);
      return;
    }

    // 3. Kirim permintaan obrolan ke Pembeli
    try {
      const groupName = currentProfile?.group_name || 'Poktan Ranowangko Langowan';
      await sendChatRequest({
        senderId: currentUserId,
        receiverId: user.id,
        note: `Salam Tani, kami dari ${groupName} memiliki stok komoditas panen siap pasok untuk kebutuhan pengadaan Anda.`
      });

      setDirectoryUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'pending' } : u));
      triggerToast(`Permintaan obrolan terkirim ke ${user.name}! Menunggu persetujuan pembeli.`);
    } catch (err) {
      console.error('[PesanPetani] Gagal kirim permintaan chat:', err);
      triggerToast('Gagal mengirim permintaan obrolan. Silakan coba lagi.');
    }
  };

  // Accept incoming request (SETUJU)
  const handleAcceptRequest = async (req) => {
    try {
      await respondToChatRequest(req.id, 'accepted');
      setIncomingRequests(prev => prev.filter(r => r.id !== req.id));

      const updatedChats = await fetchUserConversations(currentUserId, 'petani');
      setChats(updatedChats);
      setActiveChatId(req.senderId);
      setShowRequestsModal(false);
      triggerToast(`Permintaan disetujui! Anda sekarang terhubung dengan ${req.name}.`);
    } catch (err) {
      console.error('[PesanPetani] Gagal menyetujui permintaan:', err);
      triggerToast('Gagal memproses persetujuan.');
    }
  };

  // Reject incoming request (TOLAK)
  const handleRejectRequest = async (reqId) => {
    try {
      await respondToChatRequest(reqId, 'declined');
      setIncomingRequests(prev => prev.filter(r => r.id !== reqId));
      triggerToast('Permintaan obrolan telah ditolak.');
    } catch (err) {
      console.error('[PesanPetani] Gagal menolak permintaan:', err);
    }
  };

  // Filter directory users
  const filteredDirectoryUsers = directoryUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(addFriendSearchQuery.toLowerCase()) ||
                        (u.company || '').toLowerCase().includes(addFriendSearchQuery.toLowerCase()) ||
                        (u.commodity || '').toLowerCase().includes(addFriendSearchQuery.toLowerCase()) ||
                        (u.location || '').toLowerCase().includes(addFriendSearchQuery.toLowerCase());
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

      {/* Main Dribbble-Style Chat Container - Fully Frozen */}
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
              {/* Conversation Top Header: HANYA NAMA DAN DIBAWAHNYA ROLE */}
              <div className="clone-chat-main-header">
                <div className="clone-chat-partner-info">
                  <div className="clone-chat-avatar-wrap header">
                    <img src={activeChat.avatar} alt={activeChat.name} className="clone-chat-avatar-img" />
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

              {/* Message Input Box (Ultra Compact) */}
              <div className="clone-chat-input-area">
                <form onSubmit={handleSendMessage} className="clone-chat-input-form">
                  <textarea
                    className="clone-chat-textarea"
                    placeholder={`Ketik pesan balasan untuk ${activeChat.name}...`}
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

      {/* ================= MODAL 1: TAMBAH TEMAN & SEARCH PENGGUNA (TOMBOL +) ================= */}
      {showAddFriendModal && (
        <div className="clone-chat-modal-backdrop" onClick={() => setShowAddFriendModal(false)}>
          <div className="clone-chat-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="clone-chat-modal-header">
              <div>
                <h3 className="clone-chat-modal-title">Tambah Kontak Mitra</h3>
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
                className={`clone-chat-pill-btn ${addFriendRoleFilter === 'pembeli' ? 'active' : ''}`}
                onClick={() => setAddFriendRoleFilter('pembeli')}
              >
                Pembeli
              </button>
              <button
                type="button"
                className={`clone-chat-pill-btn ${addFriendRoleFilter === 'admin' ? 'active' : ''}`}
                onClick={() => setAddFriendRoleFilter('admin')}
              >
                Admin Penjamin
              </button>
              <button
                type="button"
                className={`clone-chat-pill-btn ${addFriendRoleFilter === 'petani' ? 'active' : ''}`}
                onClick={() => setAddFriendRoleFilter('petani')}
              >
                Petani
              </button>
            </div>

            {/* User Results List */}
            <div className="clone-chat-modal-results">
              {filteredDirectoryUsers.map((user) => (
                <div key={user.id} className="clone-modal-user-card">
                  <img src={user.avatar} alt={user.name} className="clone-modal-user-avatar" />
                  <div className="clone-modal-user-info">
                    <span className="clone-modal-user-name">{user.name}</span>
                    <span className="clone-modal-user-role-text">
                      {user.company || (user.role === 'petani' ? 'Petani Produsen' : user.role === 'admin' ? 'Admin Penjamin' : 'Pembeli')} • {user.location}
                    </span>
                  </div>

                  {user.role === 'admin' || user.status === 'connected' || user.status === 'accepted' ? (
                    <button
                      type="button"
                      className="clone-modal-btn-add"
                      onClick={() => handleStartChatWithUser(user)}
                      title={`Buka obrolan langsung dengan ${user.name}`}
                    >
                      <Plus size={13} weight="bold" />
                      <span>Mulai Chat</span>
                    </button>
                  ) : user.status === 'pending' ? (
                    <span className="clone-modal-btn-pending" title="Menunggu Persetujuan Pembeli">
                      <Clock size={12} weight="bold" />
                      <span>Menunggu</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="clone-modal-btn-add"
                      style={{ background: '#059669' }}
                      onClick={() => handleStartChatWithUser(user)}
                      title={`Kirim permintaan obrolan ke ${user.name}`}
                    >
                      <UserPlus size={13} weight="bold" />
                      <span>Minta Izin</span>
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
                <div key={req.id} className="clone-chat-req-card">
                  <div className="clone-chat-req-top">
                    <img src={req.avatar} alt={req.name} className="clone-chat-req-avatar" />
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

                  {(req.message || req.note) && (
                    <p className="clone-chat-req-note">"{req.message || req.note}"</p>
                  )}

                  {/* Action Buttons: SETUJU or TOLAK */}
                  <div className="clone-chat-req-actions">
                    <button
                      type="button"
                      className="clone-chat-req-btn-ignore"
                      onClick={() => handleRejectRequest(req.id)}
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      className="clone-chat-req-btn-accept"
                      onClick={() => handleAcceptRequest(req)}
                    >
                      <CheckCircle size={15} weight="bold" />
                      <span>Setuju</span>
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
