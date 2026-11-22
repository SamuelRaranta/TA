import { supabase } from './supabaseClient';

// Helper untuk format role pengguna (Petani, Pembeli, Admin)
export const formatUserRole = (role) => {
  if (!role) return 'Pengguna';
  const r = String(role).toLowerCase();
  if (r === 'petani' || r === 'farmer') return 'Petani';
  if (r === 'pembeli' || r === 'buyer') return 'Pembeli';
  if (r === 'admin') return 'Admin';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Fallback Real Profiles (Matching Supabase Seed)
const FALLBACK_PROFILES = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    full_name: 'Hengky Mandagi, S.P.',
    role: 'petani',
    phone: '0812-4321-8765',
    group_name: 'Poktan Ranowangko Langowan',
    company_name: null,
    location: 'Kec. Langowan Timur, Minahasa',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    commodity: 'Cengkeh Zanzibar Kering (10 Ton)'
  },
  {
    id: 'b1ad80e8-1da5-4be1-bff6-35ee468b166f',
    full_name: 'Samuel Raranta',
    role: 'petani',
    phone: '0813-9988-7766',
    group_name: 'Gapoktan Modoinding Sejahtera',
    company_name: null,
    location: 'Sinisir, Kec. Modoinding, Minahasa',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
    commodity: 'Kentang Granola & Rica Modoinding'
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    full_name: 'Hendra Pratama, S.T.',
    role: 'pembeli',
    phone: '0811-9876-5432',
    group_name: null,
    company_name: 'PT Royal Agro Minahasa',
    location: 'Kawasan Sentra Agro Minahasa',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    commodity: 'Eksportir & Industri Olahan Pangan'
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    full_name: 'Admin Utama AgriConnect',
    role: 'admin',
    phone: '0812-0000-9999',
    group_name: null,
    company_name: 'Pusat Operasional AgriConnect Minahasa',
    location: 'Kantor Pusat Kawangkoan, Minahasa',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80',
    commodity: 'Pengawas Legalitas & Escrow Transaksi'
  }
];

// Default System Admin ID
export const DEFAULT_ADMIN_ID = 'c3333333-3333-3333-3333-333333333333';

/**
 * Membuat pesan sambutan otomatis resmi dari Admin untuk pengguna baru / pengguna yang belum memiliki chat
 */
export const createAdminWelcomeMessage = (userId, userRole = 'petani', userName = 'Bapak/Ibu') => {
  const isBuyer = userRole === 'pembeli' || userRole === 'buyer';
  return {
    id: `welcome-${userId}`,
    sender_id: DEFAULT_ADMIN_ID,
    receiver_id: userId,
    message: isBuyer
      ? `Halo ${userName}, selamat datang di platform AgriConnect! Saya Admin Layanan Pengadaan & Penjamin Escrow. Ruang obrolan ini langsung terhubung dengan Admin tanpa memerlukan persetujuan kontak. Anda dapat berdiskusi dengan kami kapan saja untuk verifikasi penawaran, konsultasi sistem escrow, atau rekomendasi pasokan komoditas dari petani Minahasa.`
      : `Halo ${userName}, selamat datang di platform AgriConnect! Saya Admin Pendamping Petani & Penjamin Transaksi. Ruang obrolan ini langsung terhubung dengan Admin tanpa memerlukan persetujuan kontak. Anda dapat berkonsultasi dengan kami kapan saja mengenai verifikasi mutu komoditas, sertifikasi panen, hingga pendampingan kontrak jual-beli hasil tani Anda.`,
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString()
  };
};

// Data penyimpanan sementara jika koneksi database sedang offline
let localFallbackMessages = [];
let localFallbackRequests = [];

/**
 * Mendapatkan ID user aktif — hanya jika role cocok. Tanpa seed fallback
 * (seed bersama = chat user A bocor ke user B). Return null jika tak ada sesi.
 */
export const getActiveUserId = (role = 'pembeli') => {
  try {
    const roleStored = localStorage.getItem(`agriconnect_auth_user_${role}`);
    const genericStored = localStorage.getItem('agriconnect_auth_user');
    const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
    if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === String(role).toLowerCase())) {
      return parsed.id;
    }
  } catch (err) {
    console.warn('[chatService] Gagal membaca auth user:', err);
  }
  return null;
};

/**
 * Mengambil semua profiles asli dari Supabase
 */
export const fetchRealProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email, phone, location, avatar_url');

    if (error) {
      console.warn('[chatService] profiles fetch error, return empty (no stale fallback):', error.message);
      return [];
    }
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(p => {
      const fb = FALLBACK_PROFILES.find(f => f.id === p.id) || {};
      const resolvedRole = (p.role || fb.role || 'petani').toLowerCase();
      const defaultAvatar = resolvedRole === 'admin' 
        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80'
        : (resolvedRole === 'pembeli' || resolvedRole === 'buyer')
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80';

      return {
        id: p.id,
        full_name: p.full_name || fb.full_name || (p.email ? p.email.split('@')[0] : 'Pengguna AgriConnect'),
        role: resolvedRole,
        roleLabel: formatUserRole(resolvedRole),
        phone: p.phone || fb.phone || '-',
        company_name: fb.company_name || null,
        group_name: fb.group_name || null,
        location: p.location || fb.location || 'Minahasa, Sulawesi Utara',
        avatar_url: p.avatar_url || fb.avatar_url || defaultAvatar,
        commodity: fb.commodity || (resolvedRole === 'petani' ? 'Komoditas Panen Minahasa' : (resolvedRole === 'pembeli' || resolvedRole === 'buyer') ? 'Pembeli Komoditas' : 'Admin Operasional')
      };
    });
  } catch (err) {
    console.warn('[chatService] Gagal memuat profiles, return empty (no stale fallback):', err);
    return [];
  }
};

/**
 * Format relative time
 */
export const formatChatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);

  if (diffSec < 60) return 'Baru saja';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam`;
  if (diffSec < 172800) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

/**
 * Mengambil daftar percakapan untuk pengguna saat ini dari Supabase.
 * Menampilkan semua partner yang terdaftar di Supabase dengan riwayat pesan teratas.
 */
export const fetchUserConversations = async (currentUserId, currentUserRole) => {
  const allProfiles = await fetchRealProfiles();
  const otherProfiles = allProfiles.filter(p => p.id !== currentUserId);

  // 1. Ambil semua pesan obrolan yang melibatkan user dari Supabase
  let userMessages = [];
  try {
    const { data: msgs, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: true });

    if (!error && msgs) {
      userMessages = msgs;
    } else {
      userMessages = localFallbackMessages.filter(
        m => m.sender_id === currentUserId || m.receiver_id === currentUserId
      );
    }
  } catch {
    userMessages = localFallbackMessages.filter(
      m => m.sender_id === currentUserId || m.receiver_id === currentUserId
    );
  }

  // 1b. Ambil relasi pertemanan / izin obrolan yang sudah berstatus 'accepted'
  const acceptedPartnerIds = new Set();
  try {
    const { data: acceptedReqs } = await supabase
      .from('chat_requests')
      .select('sender_id, receiver_id, status')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .eq('status', 'accepted');

    if (acceptedReqs) {
      acceptedReqs.forEach(r => {
        const partner = r.sender_id === currentUserId ? r.receiver_id : r.sender_id;
        if (partner) acceptedPartnerIds.add(partner);
      });
    }
  } catch (err) {
    console.warn('[chatService] Gagal fetch accepted chat_requests:', err);
  }

  localFallbackRequests
    .filter(r => (r.sender_id === currentUserId || r.receiver_id === currentUserId) && r.status === 'accepted')
    .forEach(r => {
      const partner = r.sender_id === currentUserId ? r.receiver_id : r.sender_id;
      if (partner) acceptedPartnerIds.add(partner);
    });

  // 2. Pastikan percakapan dengan Admin selalu memiliki pesan pembuka resmi bagi pengguna baru
  const adminProfile = allProfiles.find(p => p.role === 'admin') || {
    id: DEFAULT_ADMIN_ID,
    full_name: 'Admin Utama AgriConnect',
    role: 'admin',
    company_name: 'Pusat Operasional AgriConnect Minahasa',
    location: 'Kantor Layanan Minahasa',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80'
  };

  if (currentUserRole !== 'admin') {
    const hasAdminMsg = userMessages.some(
      m => (m.sender_id === currentUserId && m.receiver_id === adminProfile.id) ||
           (m.sender_id === adminProfile.id && m.receiver_id === currentUserId)
    );

    if (!hasAdminMsg) {
      const myProfile = allProfiles.find(p => p.id === currentUserId) || {};
      const welcomeMsg = createAdminWelcomeMessage(
        currentUserId, 
        currentUserRole, 
        myProfile.full_name || 'Pengguna'
      );
      userMessages.push(welcomeMsg);
    }
  }

  // 3. Bangun daftar kontak percakapan yang SAH
  const conversations = [];

  for (const profile of otherProfiles) {
    const isAdminConnection = currentUserRole === 'admin' || profile.role === 'admin';
    const isAcceptedFriend = acceptedPartnerIds.has(profile.id);

    // KETENTUAN UTAMA:
    // Hanya Admin atau partner yang sudah disetujui izin obrolannya ('accepted')
    // yang boleh muncul di daftar Chats (sidebar percakapan).
    // Pengguna yang belum ada pertemanan/izin ('none') atau masih 'pending' TIDAK BOLEH masuk.
    if (!isAdminConnection && !isAcceptedFriend) {
      continue;
    }

    // Cari pesan-pesan antara currentUserId & profile.id
    const thread = userMessages.filter(
      m => (m.sender_id === currentUserId && m.receiver_id === profile.id) ||
           (m.sender_id === profile.id && m.receiver_id === currentUserId)
    );

    const lastMsgObj = thread[thread.length - 1];
    const unreadCount = thread.filter(m => m.sender_id === profile.id && !m.is_read).length;

    const companyOrGroup = profile.company_name || profile.group_name || 
      (profile.role === 'admin' ? 'Kantor Operasional Minahasa' : 
       profile.role === 'petani' ? 'Mitra Petani Minahasa' : 'Mitra Pembeli');

    conversations.push({
      id: profile.id,
      partnerId: profile.id,
      name: profile.full_name,
      company: companyOrGroup,
      role: profile.role,
      roleLabel: formatUserRole(profile.role),
      avatar: profile.avatar_url,
      phone: profile.phone || '-',
      location: profile.location || 'Minahasa, Sulawesi Utara',
      commodity: profile.commodity || '',
      lastMessage: lastMsgObj 
        ? (lastMsgObj.sender_id === currentUserId ? `Anda: ${lastMsgObj.message}` : lastMsgObj.message) 
        : 'Belum ada pesan. Klik untuk mulai chat...',
      time: lastMsgObj ? formatChatTime(lastMsgObj.created_at) : '',
      rawTime: lastMsgObj ? new Date(lastMsgObj.created_at).getTime() : 0,
      unreadCount,
      isOnline: true,
      isFavorite: false,
      hasMessages: thread.length > 0,
      isAdminConnection: currentUserRole === 'admin' || profile.role === 'admin'
    });
  }

  // Percakapan yang sudah memiliki pesan diurutkan paling atas
  conversations.sort((a, b) => {
    if (a.rawTime && b.rawTime) return b.rawTime - a.rawTime;
    if (a.rawTime) return -1;
    if (b.rawTime) return 1;
    if (a.role === 'admin') return -1;
    if (b.role === 'admin') return 1;
    return a.name.localeCompare(b.name);
  });

  return conversations;
};

/**
 * Mengambil daftar pesan antara 2 pengguna dari Supabase
 */
export const fetchMessagesBetween = async (user1Id, user2Id) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`
      )
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map(m => ({
        id: m.id,
        sender: m.sender_id === user1Id ? 'me' : 'them',
        text: m.message,
        attachmentUrl: m.attachment_url,
        attachmentType: m.attachment_type,
        attachmentName: m.attachment_name,
        time: new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: m.is_read ? 'read' : 'sent',
        createdAt: m.created_at
      }));
    }
  } catch (err) {
    console.warn('[chatService] Menggunakan fallback pesan:', err);
  }

  // Fallback lokal
  let thread = localFallbackMessages.filter(
    m => (m.sender_id === user1Id && m.receiver_id === user2Id) ||
         (m.sender_id === user2Id && m.receiver_id === user1Id)
  );

  // Jika obrolan dengan admin masih kosong, berikan pesan sambutan selamat datang resmi
  const isAdminThread = user1Id === DEFAULT_ADMIN_ID || user2Id === DEFAULT_ADMIN_ID;
  if (thread.length === 0 && isAdminThread) {
    const targetUserId = user1Id === DEFAULT_ADMIN_ID ? user2Id : user1Id;
    const allProfiles = await fetchRealProfiles();
    const targetProfile = allProfiles.find(p => p.id === targetUserId) || {};
    const welcomeMsg = createAdminWelcomeMessage(
      targetUserId,
      targetProfile.role || 'petani',
      targetProfile.full_name || 'Bapak/Ibu'
    );
    thread = [welcomeMsg];
  }

  return thread.map(m => ({
    id: m.id,
    sender: m.sender_id === user1Id ? 'me' : 'them',
    text: m.message,
    attachmentUrl: m.attachment_url,
    attachmentType: m.attachment_type,
    attachmentName: m.attachment_name,
    time: new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    status: m.is_read ? 'read' : 'sent',
    createdAt: m.created_at
  }));
};

/**
 * Mengirim pesan baru dan menyimpannya di Supabase
 */
export const sendChatMessage = async ({ senderId, receiverId, message, text, attachmentUrl = null, attachmentType = null, attachmentName = null }) => {
  const content = (message || text || '').trim();
  const newRow = {
    sender_id: senderId,
    receiver_id: receiverId,
    message: content || (attachmentType === 'image' ? '[Foto]' : attachmentUrl ? '[Dokumen]' : ''),
    attachment_url: attachmentUrl,
    attachment_type: attachmentType,
    is_read: false
  };

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(newRow)
      .select()
      .single();

    if (!error && data) {
      return { success: true, data };
    }
  } catch (err) {
    console.warn('[chatService] Gagal insert ke Supabase, simpan ke lokal:', err);
  }

  // Fallback
  const fallbackItem = {
    ...newRow,
    id: `m-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  localFallbackMessages.push(fallbackItem);
  return { success: true, data: fallbackItem };
};

/**
 * Mengambil daftar permintaan obrolan masuk (pending) untuk user aktif
 */
export const fetchIncomingChatRequests = async (currentUserId) => {
  const allProfiles = await fetchRealProfiles();

  try {
    const { data, error } = await supabase
      .from('chat_requests')
      .select('*')
      .eq('receiver_id', currentUserId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(r => {
        const sender = allProfiles.find(p => p.id === r.sender_id) || {};
        return {
          id: r.id,
          senderId: r.sender_id,
          name: sender.full_name || 'Pengguna AgriConnect',
          company: sender.company_name || sender.group_name || 'Petani Produsen Minahasa',
          role: sender.role || 'petani',
          avatar: sender.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
          note: r.note,
          time: formatChatTime(r.created_at)
        };
      });
    }
  } catch (err) {
    console.warn('[chatService] Gagal fetch requests Supabase:', err);
  }

  // Fallback
  return localFallbackRequests
    .filter(r => r.receiver_id === currentUserId && r.status === 'pending')
    .map(r => {
      const sender = allProfiles.find(p => p.id === r.sender_id) || {};
      return {
        id: r.id,
        senderId: r.sender_id,
        name: sender.full_name || 'Pengguna AgriConnect',
        company: sender.company_name || sender.group_name || 'Petani Produsen Minahasa',
        role: sender.role || 'petani',
        avatar: sender.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80',
        note: r.note,
        time: formatChatTime(r.created_at)
      };
    });
};

/**
 * Mengirim permintaan obrolan baru dari Petani ke Pembeli atau sebaliknya
 */
export const sendChatRequest = async ({ senderId, receiverId, note = '' }) => {
  const newRow = {
    sender_id: senderId,
    receiver_id: receiverId,
    note: note.trim() || 'Ingin membuka jalur komunikasi pasokan komoditas',
    status: 'pending'
  };

  try {
    const { data, error } = await supabase
      .from('chat_requests')
      .upsert(newRow, { onConflict: 'sender_id,receiver_id' })
      .select()
      .single();

    if (!error && data) {
      return { success: true, data };
    }
  } catch (err) {
    console.warn('[chatService] Gagal upsert chat_requests ke Supabase:', err);
  }

  // Fallback
  const existingIdx = localFallbackRequests.findIndex(
    r => r.sender_id === senderId && r.receiver_id === receiverId
  );
  if (existingIdx >= 0) {
    localFallbackRequests[existingIdx].status = 'pending';
    localFallbackRequests[existingIdx].note = newRow.note;
  } else {
    localFallbackRequests.push({
      ...newRow,
      id: `req-${Date.now()}`,
      created_at: new Date().toISOString()
    });
  }
  return { success: true };
};

/**
 * Menyetujui ('accepted') atau menolak ('declined') permintaan obrolan
 */
export const respondToChatRequest = async (requestId, status = 'accepted') => {
  try {
    const { data, error } = await supabase
      .from('chat_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (!error && data) {
      return { success: true, data };
    }
  } catch (err) {
    console.warn('[chatService] Gagal update chat_requests di Supabase:', err);
  }

  // Fallback
  const item = localFallbackRequests.find(r => r.id === requestId);
  if (item) {
    item.status = status;
  }
  return { success: true };
};

/**
 * Mengambil daftar user untuk direktori Tambah Kontak (mengecek status pertemanan)
 */
export const fetchDirectoryUsers = async (currentUserId) => {
  const allProfiles = await fetchRealProfiles();
  const otherProfiles = allProfiles.filter(p => p.id !== currentUserId);

  let requests = [];
  try {
    const { data } = await supabase
      .from('chat_requests')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
    requests = data || localFallbackRequests;
  } catch {
    requests = localFallbackRequests;
  }

  return otherProfiles.map(p => {
    // Cek apakah ada record permintaan
    const rel = requests.find(
      r => (r.sender_id === currentUserId && r.receiver_id === p.id) ||
           (r.sender_id === p.id && r.receiver_id === currentUserId)
    );

    let status = 'none';
    if (p.role === 'admin') {
      status = 'connected'; // Admin selalu langsung terhubung
    } else if (rel) {
      status = rel.status; // 'pending' | 'accepted' | 'declined'
    }

    return {
      id: p.id,
      name: p.full_name,
      company: p.company_name || p.group_name || (p.role === 'admin' ? 'Admin AgriConnect' : 'Mitra Petani'),
      role: p.role,
      roleLabel: formatUserRole(p.role),
      avatar: p.avatar_url,
      location: p.location || 'Minahasa',
      commodity: p.commodity || 'Komoditas Unggulan',
      status // 'none' | 'pending' | 'accepted' | 'connected'
    };
  });
};

/**
 * Subscribe Realtime untuk pesan baru
 */
export const subscribeChatMessages = (currentUserId, onNewMessage) => {
  try {
    const channel = supabase
      .channel(`chat_messages_${currentUserId}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new;
          if (row.receiver_id === currentUserId || row.sender_id === currentUserId) {
            onNewMessage(row);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[chatService] Gagal subscribe realtime messages:', err);
    return () => {};
  }
};

/**
 * Subscribe Realtime untuk perubahan status permintaan obrolan
 */
export const subscribeChatRequests = (currentUserId, onRequestChange) => {
  try {
    const channel = supabase
      .channel(`chat_requests_${currentUserId}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_requests' },
        (payload) => {
          const row = payload.new || payload.old;
          if (row && (row.receiver_id === currentUserId || row.sender_id === currentUserId)) {
            onRequestChange(row);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[chatService] Gagal subscribe realtime requests:', err);
    return () => {};
  }
};

/**
 * Menandai semua pesan dari pengirim tertentu sebagai sudah dibaca (is_read = true)
 */
export const markMessagesAsRead = async (currentUserId, partnerId) => {
  if (!currentUserId || !partnerId) return;
  try {
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('receiver_id', currentUserId)
      .eq('sender_id', partnerId)
      .eq('is_read', false);
  } catch (err) {
    console.warn('[chatService] Gagal update is_read:', err);
  }
};

/**
 * Subscribe Realtime untuk pembaruan profil user (nama, role, avatar)
 */
export const subscribeProfileUpdates = (onUpdate) => {
  try {
    const channelName = `realtime_profiles_${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (onUpdate) onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[chatService] Gagal subscribe profile updates:', err);
    return () => {};
  }
};
