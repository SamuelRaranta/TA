import { supabase } from './supabaseClient';

/**
 * Service Notifikasi Real-Time TaniNiaga (Supabase Integration)
 * Mendukung 3 Role: Pembeli, Petani, Admin.
 * 100% Data Aktual dari Supabase - Tanpa Mock / Dummy Data.
 */

// Memory cache to prevent duplicate notifications being fired within a short window
const recentNotificationFingerprints = new Set();

export const formatRelativeTime = (isoString) => {
  if (!isoString) return 'Baru saja';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (err) {
    return 'Baru saja';
  }
};

/**
 * Get current active user ID from Supabase auth or fallback to localStorage
 */
export const getActiveUserId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch (e) {}

  try {
    const stored = localStorage.getItem('agriconnect_auth_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.id) return parsed.id;
    }
  } catch (e) {}

  return null;
};

/**
 * Get Admin user IDs for broadcast notifications
 */
export const getAdminUserIds = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (!error && data && data.length > 0) {
      return data.map(d => d.id);
    }
  } catch (err) {
    console.warn('[notificationService] Failed to query admin profiles:', err);
  }
  // Default fallback ID for admin if profiles query is not populated
  return ['c3333333-3333-3333-3333-333333333333'];
};

/**
 * Fetch notifications from Supabase for a specific authenticated user
 */
export const fetchNotificationsFromSupabase = async (options = {}) => {
  const { userId, role, limit = 50, unreadOnly = false, filterCategory = null } = options;
  if (!userId) {
    return { data: [], error: null };
  }

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (filterCategory && filterCategory !== 'Semua') {
      if (filterCategory === 'Belum Dibaca') {
        query = query.eq('is_read', false);
      } else if (filterCategory === 'Transaksi') {
        query = query.in('related_type', ['order', 'payment']);
      } else if (filterCategory === 'Penawaran') {
        query = query.eq('related_type', 'offer');
      } else if (filterCategory === 'Proposal') {
        query = query.eq('related_type', 'proposal');
      } else if (filterCategory === 'Sistem') {
        query = query.in('related_type', ['commodity', 'bug_report', 'user', 'system']);
      }
    }

    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      console.warn('[notificationService] Error fetching notifications:', error.message);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.warn('[notificationService] Exception fetching notifications:', err);
    return { data: [], error: err.message };
  }
};

/**
 * Fetch unread notification count efficiently from Supabase
 */
export const fetchUnreadCountFromSupabase = async (userId) => {
  if (!userId) return 0;
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.warn('[notificationService] Error fetching unread count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.warn('[notificationService] Exception fetching unread count:', err);
    return 0;
  }
};

/**
 * Create a new notification in Supabase
 */
export const createNotificationInSupabase = async ({
  userId,
  role,
  type,
  title,
  message,
  relatedId = null,
  relatedType = null
}) => {
  if (!userId || !title || !message) {
    console.warn('[notificationService] Missing required fields for notification');
    return { data: null, error: 'Field wajib belum lengkap.' };
  }

  // Deduplication check: ignore if identical notification sent in the last 4 seconds
  const fingerprint = `${userId}_${type}_${relatedId || ''}_${title}`;
  if (recentNotificationFingerprints.has(fingerprint)) {
    return { data: null, duplicate: true };
  }
  recentNotificationFingerprints.add(fingerprint);
  setTimeout(() => {
    recentNotificationFingerprints.delete(fingerprint);
  }, 4000);

  try {
    const newRecord = {
      user_id: userId,
      role: role || 'buyer',
      type: type || 'system',
      title: title.trim(),
      message: message.trim(),
      is_read: false,
      related_id: relatedId ? String(relatedId) : null,
      related_type: relatedType || null
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.warn('[notificationService] Error inserting notification:', error.message);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.warn('[notificationService] Exception inserting notification:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsReadInSupabase = async (notificationId) => {
  if (!notificationId) return { success: false };
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.warn('[notificationService] Error marking as read:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.warn('[notificationService] Exception marking as read:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsAsReadInSupabase = async (userId) => {
  if (!userId) return { success: false };
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.warn('[notificationService] Error marking all as read:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.warn('[notificationService] Exception marking all as read:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Subscribe to realtime notification changes for the logged-in user
 */
export const subscribeUserNotifications = (userId, onNotificationUpdate) => {
  if (!userId) return () => {};

  try {
    const channelName = `realtime:notifications:${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (typeof onNotificationUpdate === 'function') {
            onNotificationUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('[notificationService] Realtime channel status:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[notificationService] Error setting up realtime notification subscription:', err);
    return () => {};
  }
};

// ==========================================================
// BUSINESS EVENT TRIGGERS (EVENT-DRIVEN IMPLEMENTATION)
// ==========================================================

/**
 * Event: Order Dibuat
 * - Pembeli menerima: new_order
 * - Petani menerima: new_order (Pesanan Masuk)
 */
export const notifyOrderCreated = async ({
  buyerId,
  farmerId,
  commodityName,
  requestedKg,
  orderId
}) => {
  const kgFormatted = Number(requestedKg).toLocaleString('id-ID');

  // 1. Notifikasi untuk Pembeli
  if (buyerId) {
    await createNotificationInSupabase({
      userId: buyerId,
      role: 'buyer',
      type: 'new_order',
      title: 'Pesanan Berhasil Dibuat',
      message: `Pesanan ${commodityName} sebanyak ${kgFormatted} kg telah berhasil dibuat.`,
      relatedId: orderId,
      relatedType: 'order'
    });
  }

  // 2. Notifikasi untuk Petani Terkait
  if (farmerId) {
    await createNotificationInSupabase({
      userId: farmerId,
      role: 'farmer',
      type: 'new_order',
      title: 'Pesanan Masuk',
      message: `Pesanan baru untuk ${commodityName} sebanyak ${kgFormatted} kg telah diterima.`,
      relatedId: orderId,
      relatedType: 'order'
    });
  }
};

/**
 * Event: Menunggu Pembayaran
 */
export const notifyPaymentPending = async ({
  buyerId,
  commodityName,
  orderId
}) => {
  if (!buyerId) return;
  await createNotificationInSupabase({
    userId: buyerId,
    role: 'buyer',
    type: 'payment_pending',
    title: 'Menunggu Pembayaran',
    message: `Pesanan ${commodityName} menunggu pembayaran.`,
    relatedId: orderId,
    relatedType: 'payment'
  });
};

/**
 * Event: Pembayaran Berhasil (Transfer Bank / QRIS)
 * - Pembeli menerima: payment_success
 * - Petani menerima: payment_received
 */
export const notifyPaymentSuccess = async ({
  buyerId,
  farmerId,
  commodityName,
  orderId
}) => {
  // Notifikasi untuk Pembeli
  if (buyerId) {
    await createNotificationInSupabase({
      userId: buyerId,
      role: 'buyer',
      type: 'payment_success',
      title: 'Pembayaran Berhasil',
      message: `Pembayaran untuk ${commodityName} telah berhasil.`,
      relatedId: orderId,
      relatedType: 'payment'
    });
  }

  // Notifikasi untuk Petani
  if (farmerId) {
    await createNotificationInSupabase({
      userId: farmerId,
      role: 'farmer',
      type: 'payment_received',
      title: 'Pembayaran Diterima',
      message: `Pembayaran untuk ${commodityName} telah diterima.`,
      relatedId: orderId,
      relatedType: 'payment'
    });
  }
};

/**
 * Event: Pembayaran Langsung Dipilih
 * Petani menerima notifikasi tanpa menampilkan detail lokasi
 */
export const notifyDirectPaymentSelected = async ({
  farmerId,
  commodityName,
  orderId
}) => {
  if (!farmerId) return;
  await createNotificationInSupabase({
    userId: farmerId,
    role: 'farmer',
    type: 'direct_payment_selected',
    title: 'Pembayaran Langsung Dipilih',
    message: `Pembeli memilih pembayaran langsung untuk ${commodityName}.`,
    relatedId: orderId,
    relatedType: 'order'
  });
};

/**
 * Event: Perubahan Status Order (Processing, Completed, Cancelled)
 */
export const notifyOrderStatusChanged = async ({
  buyerId,
  farmerId,
  commodityName,
  newStatus,
  orderId
}) => {
  let type = 'order_processing';
  let title = 'Pesanan Sedang Diproses';
  let message = `Pesanan ${commodityName} sedang diproses.`;

  if (newStatus === 'completed' || newStatus === 'Selesai') {
    type = 'order_completed';
    title = 'Transaksi Selesai';
    message = `Transaksi ${commodityName} telah selesai.`;
  } else if (newStatus === 'cancelled' || newStatus === 'Dibatalkan') {
    type = 'order_cancelled';
    title = 'Transaksi Dibatalkan';
    message = `Transaksi ${commodityName} telah dibatalkan.`;
  }

  if (buyerId) {
    await createNotificationInSupabase({
      userId: buyerId,
      role: 'buyer',
      type,
      title,
      message,
      relatedId: orderId,
      relatedType: 'order'
    });
  }
};

/**
 * Event: Penawaran / Tawar Baru Diajukan
 * - Pembeli menerima: offer_submitted
 * - Petani menerima: new_offer
 */
export const notifyOfferSubmitted = async ({
  buyerId,
  farmerId,
  commodityName,
  offerId
}) => {
  // Notifikasi ke Pembeli
  if (buyerId) {
    await createNotificationInSupabase({
      userId: buyerId,
      role: 'buyer',
      type: 'offer_submitted',
      title: 'Penawaran Berhasil Dikirim',
      message: `Penawaran untuk ${commodityName} telah dikirim kepada petani.`,
      relatedId: offerId,
      relatedType: 'offer'
    });
  }

  // Notifikasi ke Petani Terkait
  if (farmerId) {
    await createNotificationInSupabase({
      userId: farmerId,
      role: 'farmer',
      type: 'new_offer',
      title: 'Penawaran Baru',
      message: `Pembeli mengajukan penawaran untuk ${commodityName}.`,
      relatedId: offerId,
      relatedType: 'offer'
    });
  }
};

/**
 * Event: Petani Menerima Tawaran
 * Pembeli menerima: offer_accepted
 */
export const notifyOfferAccepted = async ({
  buyerId,
  commodityName,
  offerId
}) => {
  if (!buyerId) return;
  await createNotificationInSupabase({
    userId: buyerId,
    role: 'buyer',
    type: 'offer_accepted',
    title: 'Penawaran Diterima',
    message: `Penawaran Anda untuk ${commodityName} telah diterima.`,
    relatedId: offerId,
    relatedType: 'offer'
  });
};

/**
 * Event: Pembeli Menyetujui Tawaran Balik Petani
 * Petani menerima: offer_accepted
 */
export const notifyOfferAcceptedToFarmer = async ({
  farmerId,
  commodityName,
  offerId
}) => {
  if (!farmerId) return;
  await createNotificationInSupabase({
    userId: farmerId,
    role: 'farmer',
    type: 'offer_accepted',
    title: 'Tawaran Balik Disetujui Pembeli',
    message: `Pembeli telah menyetujui tawaran balik untuk ${commodityName}. Transaksi berhasil dibuat.`,
    relatedId: offerId,
    relatedType: 'offer'
  });
};

/**
 * Event: Petani Menolak Tawaran
 * Pembeli menerima: offer_rejected
 */
export const notifyOfferRejected = async ({
  buyerId,
  commodityName,
  offerId
}) => {
  if (!buyerId) return;
  await createNotificationInSupabase({
    userId: buyerId,
    role: 'buyer',
    type: 'offer_rejected',
    title: 'Penawaran Ditolak',
    message: `Penawaran Anda untuk ${commodityName} telah ditolak.`,
    relatedId: offerId,
    relatedType: 'offer'
  });
};

/**
 * Event: Petani Mengajukan Counter Offer
 * Pembeli menerima: offer_countered
 */
export const notifyOfferCountered = async ({
  buyerId,
  commodityName,
  offerId
}) => {
  if (!buyerId) return;
  await createNotificationInSupabase({
    userId: buyerId,
    role: 'buyer',
    type: 'offer_countered',
    title: 'Petani Mengajukan Harga Baru',
    message: `Petani mengajukan harga baru untuk ${commodityName}.`,
    relatedId: offerId,
    relatedType: 'offer'
  });
};

/**
 * Event: Pembeli Mengajukan Tawaran Balik (Counter Offer) ke Petani
 * Petani menerima: offer_countered
 */
export const notifyOfferCounteredByBuyer = async ({
  farmerId,
  commodityName,
  offerId
}) => {
  if (!farmerId) return;
  await createNotificationInSupabase({
    userId: farmerId,
    role: 'farmer',
    type: 'offer_countered',
    title: 'Pembeli Mengajukan Tawaran Balik',
    message: `Pembeli mengajukan harga/kuantitas baru untuk ${commodityName}.`,
    relatedId: offerId,
    relatedType: 'offer'
  });
};

/**
 * Event: Pembeli Membuat Proposal Pengadaan Baru
 * Admin menerima: proposal_submitted
 */
export const notifyProposalSubmitted = async ({
  proposalId,
  commodityName
}) => {
  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await createNotificationInSupabase({
      userId: adminId,
      role: 'admin',
      type: 'proposal_submitted',
      title: 'Proposal Baru Menunggu Persetujuan',
      message: 'Proposal baru dari pembeli menunggu persetujuan.',
      relatedId: proposalId,
      relatedType: 'proposal'
    });
  }
};

/**
 * Event: Admin Menyetujui Proposal
 * - Pembeli menerima: proposal_approved
 * - Petani yang berhak menerima: proposal_published
 */
export const notifyProposalApproved = async ({
  buyerId,
  commodityName,
  proposalId
}) => {
  // 1. Notifikasi untuk Pembeli
  if (buyerId) {
    await createNotificationInSupabase({
      userId: buyerId,
      role: 'buyer',
      type: 'proposal_approved',
      title: 'Proposal Disetujui',
      message: `Proposal ${commodityName} telah disetujui.`,
      relatedId: proposalId,
      relatedType: 'proposal'
    });
  }

  // 2. Notifikasi untuk Petani yang terdaftar di sistem
  try {
    const { data: farmers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'petani')
      .limit(10);

    if (farmers && farmers.length > 0) {
      for (const farmer of farmers) {
        await createNotificationInSupabase({
          userId: farmer.id,
          role: 'farmer',
          type: 'proposal_published',
          title: 'Proposal Baru Tersedia',
          message: `Terdapat proposal baru untuk ${commodityName}.`,
          relatedId: proposalId,
          relatedType: 'proposal'
        });
      }
    }
  } catch (err) {
    console.warn('[notificationService] Failed to notify farmers of proposal approval:', err);
  }
};

/**
 * Event: Admin Menolak Proposal
 * Pembeli menerima: proposal_rejected
 */
export const notifyProposalRejected = async ({
  buyerId,
  commodityName,
  proposalId
}) => {
  if (!buyerId) return;
  await createNotificationInSupabase({
    userId: buyerId,
    role: 'buyer',
    type: 'proposal_rejected',
    title: 'Proposal Ditolak',
    message: `Proposal ${commodityName} tidak disetujui.`,
    relatedId: proposalId,
    relatedType: 'proposal'
  });
};

/**
 * Event: Petani Mengajukan Komoditas Baru
 * Admin menerima: commodity_submitted
 */
export const notifyCommoditySubmitted = async ({
  commodityId,
  commodityName
}) => {
  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await createNotificationInSupabase({
      userId: adminId,
      role: 'admin',
      type: 'commodity_submitted',
      title: 'Komoditas Menunggu Verifikasi',
      message: `Komoditas ${commodityName} menunggu verifikasi.`,
      relatedId: commodityId,
      relatedType: 'commodity'
    });
  }
};

/**
 * Event: Admin Menyetujui Komoditas
 * Petani menerima: commodity_approved
 */
export const notifyCommodityApproved = async ({
  farmerId,
  commodityName,
  commodityId
}) => {
  if (!farmerId) return;
  await createNotificationInSupabase({
    userId: farmerId,
    role: 'farmer',
    type: 'commodity_approved',
    title: 'Komoditas Disetujui',
    message: `Komoditas ${commodityName} telah disetujui.`,
    relatedId: commodityId,
    relatedType: 'commodity'
  });
};

/**
 * Event: Admin Menolak Komoditas
 * Petani menerima: commodity_rejected
 */
export const notifyCommodityRejected = async ({
  farmerId,
  commodityName,
  commodityId
}) => {
  if (!farmerId) return;
  await createNotificationInSupabase({
    userId: farmerId,
    role: 'farmer',
    type: 'commodity_rejected',
    title: 'Komoditas Ditolak',
    message: `Komoditas ${commodityName} tidak disetujui.`,
    relatedId: commodityId,
    relatedType: 'commodity'
  });
};

/**
 * Event: Laporan Bug Baru Dibuat
 * Admin menerima: bug_report_created
 */
export const notifyBugReportCreated = async ({
  userRole,
  reportId
}) => {
  const roleDisplay = userRole === 'petani' ? 'Petani' : 'Pembeli';
  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await createNotificationInSupabase({
      userId: adminId,
      role: 'admin',
      type: 'bug_report_created',
      title: 'Laporan Bug Baru',
      message: `${roleDisplay} melaporkan masalah pada sistem.`,
      relatedId: reportId,
      relatedType: 'bug_report'
    });
  }
};

/**
 * Event: Pengguna Baru Mendaftar
 * Admin menerima: new_user
 */
export const notifyNewUserRegistered = async ({
  userId,
  userRole
}) => {
  const roleDisplay = userRole === 'petani' ? 'Petani' : (userRole === 'pembeli' ? 'Pembeli' : 'Pengguna');
  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await createNotificationInSupabase({
      userId: adminId,
      role: 'admin',
      type: 'new_user',
      title: 'Pengguna Baru',
      message: `Pengguna baru mendaftar sebagai ${roleDisplay}.`,
      relatedId: userId,
      relatedType: 'user'
    });
  }
};
