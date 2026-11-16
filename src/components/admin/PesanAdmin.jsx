import React, { useState, useEffect } from 'react';
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
  Checks,
  X,
  ArrowRight,
  FileText,
  Image as ImageIcon
} from '@phosphor-icons/react';
import {

  fetchRealProfiles,
  fetchUserConversations,
  fetchMessagesBetween,
  sendChatMessage,
  subscribeChatMessages,
  subscribeProfileUpdates,
  markMessagesAsRead,
  formatUserRole
} from '../../lib/chatService';
import { supabase } from '../../lib/supabaseClient';
import { DEFAULT_AVATAR } from '../../lib/constants';

export default function AdminChatView({ currentUserId: propUserId, currentUserProfile: propProfile }) {
  // Tanpa seed fallback: null = belum ada sesi, jangan tampilkan chat user lain.
  const [currentUserId, setCurrentUserId] = useState(() => propUserId || null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [messages, setMessages] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('semua'); // 'semua' | 'petani' | 'pembeli'
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  // Load all user conversations for Admin
  const loadConversations = async () => {
    try {
      const convs = await fetchUserConversations(currentUserId, 'admin');
      setChats(convs);
      if (convs.length > 0) {
        setActiveChatId(prev => prev && convs.some(c => c.id === prev) ? prev : convs[0].id);
      }
    } catch (err) {
      console.error('[PesanAdmin] Error loading conversations:', err);
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
    loadConversations();

    // Subscribe to realtime messages for admin
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

    // Subscribe to profile changes in Supabase (saat ada perubahan profil: nama, foto/avatar, role)
    const unsubscribeProfiles = subscribeProfileUpdates((payload) => {
      const updatedRow = payload?.new;
      if (updatedRow && updatedRow.id) {
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

      fetchUserConversations(currentUserId, 'admin').then(setChats);
    });

    return () => {
      unsubscribeMsgs();
      unsubscribeProfiles();
    };
  }, [currentUserId]);

  // Load messages for the active chat
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
  const activeMessages = (activeChat && messages[activeChat.id]) || [];

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeChat) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setMessages(prev => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg]
    }));

    setChats(prev => prev.map(c => {
      if (c.id === activeChat.id) {
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
      console.error('[PesanAdmin] Gagal kirim pesan ke Supabase:', err);
    }
  };

  const filteredChats = chats.filter(c => {
    if (activeRoleFilter !== 'semua' && c.role !== activeRoleFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = c.name.toLowerCase().includes(q) ||
                    (c.company || '').toLowerCase().includes(q) ||
                    (c.commodity || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="clone-chat-page-wrap">
      <div className="clone-chat-app-container">
        
        {/* ================= LEFT COLUMN: CHATS LIST ================= */}
        <div className="clone-chat-sidebar">
          
          {/* Frozen Top Header */}
          <div className="clone-chat-sidebar-freeze-header">
            <div className="clone-chat-sidebar-header">
              <h2 className="clone-chat-heading">Help Desk & Chat</h2>
            </div>

            {/* Sleek Search bar */}
            <div className="clone-chat-search-wrap">
              <MagnifyingGlass size={14} className="clone-chat-search-icon" />
              <input
                type="text"
                className="clone-chat-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pengguna atau pesan..."
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clone-chat-search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Hapus pencarian"
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>

            {/* Filter Pills: Semua, Petani, Pembeli */}
            <div className="clone-chat-filter-pills-row">
              <button
                type="button"
                className={`clone-chat-pill-btn ${activeRoleFilter === 'semua' ? 'active' : ''}`}
                onClick={() => setActiveRoleFilter('semua')}
              >
                Semua
              </button>
              <button
                type="button"
                className={`clone-chat-pill-btn ${activeRoleFilter === 'petani' ? 'active' : ''}`}
                onClick={() => setActiveRoleFilter('petani')}
              >
                Petani
              </button>
              <button
                type="button"
                className={`clone-chat-pill-btn ${activeRoleFilter === 'pembeli' ? 'active' : ''}`}
                onClick={() => setActiveRoleFilter('pembeli')}
              >
                Pembeli
              </button>
            </div>
          </div>

          {/* Chat List Items */}
          <div className="clone-chat-items-list">
            {filteredChats.map(c => {
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
              {/* Header Conversation: HANYA NAMA DAN DIBAWAHNYA ROLE */}
              <div className="clone-chat-main-header">
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

              {/* Message Stream */}
              <div className="clone-chat-stream">
                {activeMessages.map((m) => {
                  const isMe = m.sender === 'me';
                  return (
                    <div
                      key={m.id}
                      className={`clone-chat-bubble-row ${isMe ? 'sent' : 'received'}`}
                    >
                      <div className={`clone-chat-bubble ${isMe ? 'sent' : 'received'}`}>
                        <p className="clone-chat-bubble-text">{m.text}</p>
                        <div className="clone-chat-bubble-meta">
                          <span>{m.time}</span>
                          {isMe && <Checks size={13} weight="bold" className="clone-bubble-tick" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Area */}
              <div className="clone-chat-input-area">
                <form onSubmit={handleSendMessage} className="clone-chat-input-form">
                  <textarea
                    className="clone-chat-textarea"
                    placeholder={`Ketik pesan balasan resmi untuk ${activeChat.name}...`}
                    rows={1}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value.slice(0, 1200))}
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
                      <span className="clone-chat-char-count">{inputMessage.length}/1200</span>
                      <button
                        type="submit"
                        className="clone-chat-send-btn"
                        disabled={!inputMessage.trim()}
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
    </div>
  );
}
