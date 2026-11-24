import React, { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  CaretLeft
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

const CHAT_EMOJIS = [
  '😊', '😄', '😃', '👍', '🙏', '👏', '❤️', '🤝', '👌', '😎',
  '🌱', '🌾', '🌽', '🥔', '🥕', '🍅', '🌶️', '🥬', '🍎', '🧅',
  '📦', '🚚', '💰', '💵', '📈', '📄', '📑', '⚖️', '✅', '✨'
];

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

  // Attachment & Emoji Picker States & Refs
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const docInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Handler for file attachments
  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedAttachment({
        name: file.name,
        type: type === 'image' || file.type.startsWith('image/') ? 'image' : (type === 'document' ? 'document' : 'file'),
        url: event.target.result,
        size: (file.size / 1024).toFixed(0) + ' KB'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
        attachmentUrl: newMsgRow.attachment_url,
        attachmentType: newMsgRow.attachment_type,
        attachmentName: newMsgRow.attachment_name,
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
    if ((!inputMessage.trim() && !selectedAttachment) || !activeChat) return;

    const textToSend = inputMessage.trim();
    const attachmentToSend = selectedAttachment;
    setInputMessage('');
    setSelectedAttachment(null);
    setShowEmojiPicker(false);

    const tempId = `temp-${Date.now()}`;
    const previewText = textToSend || (attachmentToSend?.type === 'image' ? '[Foto]' : `[Berkas: ${attachmentToSend?.name || 'Dokumen'}]`);
    const newMsg = {
      id: tempId,
      sender: 'me',
      text: textToSend,
      attachmentUrl: attachmentToSend?.url || null,
      attachmentType: attachmentToSend?.type || null,
      attachmentName: attachmentToSend?.name || null,
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
          lastMessage: `Anda: ${previewText}`,
          time: 'Baru saja'
        };
      }
      return c;
    }));

    try {
      const res = await sendChatMessage({
        senderId: currentUserId,
        receiverId: activeChat.id,
        text: textToSend,
        attachmentUrl: attachmentToSend?.url || null,
        attachmentType: attachmentToSend?.type || null,
        attachmentName: attachmentToSend?.name || null
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
      <div className={`clone-chat-app-container ${activeChat ? 'has-active-chat' : ''}`}>
        
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
                        {m.attachmentUrl && (
                          <div style={{ marginBottom: m.text ? '8px' : '0' }}>
                            {m.attachmentType === 'image' || (typeof m.attachmentUrl === 'string' && m.attachmentUrl.startsWith('data:image')) ? (
                              <img 
                                src={m.attachmentUrl} 
                                alt="Lampiran Foto" 
                                style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', cursor: 'pointer', display: 'block' }}
                                onClick={() => window.open(m.attachmentUrl, '_blank')}
                              />
                            ) : (
                              <a 
                                href={m.attachmentUrl} 
                                download={m.attachmentName || 'dokumen-taniniaga'}
                                target="_blank" 
                                rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)', borderRadius: '6px', textDecoration: 'none', color: 'inherit' }}
                              >
                                <FileText size={18} weight="duotone" />
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all' }}>
                                  {m.attachmentName || 'Unduh Berkas Lampiran'}
                                </span>
                              </a>
                            )}
                          </div>
                        )}
                        {m.text && <p className="clone-chat-bubble-text">{m.text}</p>}
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
                {/* Preview Lampiran Sebelum Dikirim */}
                {selectedAttachment && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--bg-canvas-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border-subtle, #e2e8f0)', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      {selectedAttachment.type === 'image' ? (
                        <img src={selectedAttachment.url} alt="Preview" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        <FileText size={20} color="#2563eb" weight="duotone" />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedAttachment.name}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{selectedAttachment.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAttachment(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ef4444' }}
                      title="Hapus Lampiran"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                )}

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
                    <div className="clone-chat-input-tools" style={{ position: 'relative' }}>
                      {/* Hidden Input Files */}
                      <input 
                        type="file" 
                        ref={docInputRef} 
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" 
                        style={{ display: 'none' }} 
                        onChange={(e) => handleFileSelect(e, 'document')} 
                      />
                      <input 
                        type="file" 
                        ref={imageInputRef} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => handleFileSelect(e, 'image')} 
                      />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="*/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => handleFileSelect(e, 'file')} 
                      />

                      <button 
                        type="button" 
                        className="clone-chat-tool-btn" 
                        title="Lampirkan Dokumen (.pdf, .doc, .xlsx, .txt)"
                        onClick={() => docInputRef.current?.click()}
                      >
                        <FileText size={14} />
                      </button>
                      <button 
                        type="button" 
                        className="clone-chat-tool-btn" 
                        title="Kirim Foto/Gambar"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <ImageIcon size={14} />
                      </button>
                      <button 
                        type="button" 
                        className="clone-chat-tool-btn" 
                        title="Sisipkan Berkas"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip size={14} />
                      </button>
                      <button 
                        type="button" 
                        className={`clone-chat-tool-btn ${showEmojiPicker ? 'active' : ''}`} 
                        title="Pilih Emoji"
                        onClick={() => setShowEmojiPicker(prev => !prev)}
                      >
                        <Smiley size={14} />
                      </button>

                      {/* Popover Emoji Picker */}
                      {showEmojiPicker && (
                        <div 
                          ref={emojiPickerRef}
                          style={{
                            position: 'absolute',
                            bottom: '36px',
                            left: '0',
                            background: 'var(--card-bg, #ffffff)',
                            border: '1px solid var(--border-subtle, #e2e8f0)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            padding: '8px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '4px',
                            zIndex: 100,
                            width: '230px',
                            maxHeight: '180px',
                            overflowY: 'auto'
                          }}
                        >
                          {CHAT_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setInputMessage(prev => prev + emoji);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                padding: '4px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-canvas-subtle, #f1f5f9)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="clone-chat-input-right">
                      <span className="clone-chat-char-count">{inputMessage.length}/1200</span>
                      <button
                        type="submit"
                        className="clone-chat-send-btn"
                        disabled={!inputMessage.trim() && !selectedAttachment}
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
