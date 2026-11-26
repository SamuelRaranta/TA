import { supabase } from './supabaseClient';
import { notifyBugReportCreated } from './notificationService';

/**
 * Service untuk mengelola Laporan Bug / Masalah secara terintegrasi dengan Supabase Database,
 * Storage Bucket (bug-reports), dan Row Level Security (RLS).
 */

// Category Options
export const BUG_CATEGORIES = [
  { value: 'bug', label: 'Bug / Error' },
  { value: 'ui', label: 'Tampilan' },
  { value: 'transaction', label: 'Transaksi' },
  { value: 'payment', label: 'Pembayaran' },
  { value: 'account', label: 'Akun' },
  { value: 'feature', label: 'Fitur Tidak Berfungsi' },
  { value: 'other', label: 'Lainnya' }
];

// Page Options
export const BUG_PAGES = [
  { value: 'home', label: 'Beranda' },
  { value: 'search', label: 'Cari Komoditas' },
  { value: 'product_detail', label: 'Detail Komoditas' },
  { value: 'cart', label: 'Keranjang' },
  { value: 'payment', label: 'Pembayaran' },
  { value: 'transaction_history', label: 'Riwayat Transaksi' },
  { value: 'profile', label: 'Profil' },
  { value: 'settings', label: 'Pengaturan' },
  { value: 'other', label: 'Lainnya' }
];

// Impact Options
export const BUG_IMPACTS = [
  { value: 'low', label: 'Rendah', desc: 'Masalah tidak menghambat penggunaan fitur.' },
  { value: 'medium', label: 'Sedang', desc: 'Sebagian fungsi terganggu tetapi masih dapat digunakan.' },
  { value: 'high', label: 'Tinggi', desc: 'Fitur tidak dapat digunakan.' }
];

// Status Options
export const BUG_STATUSES = [
  { value: 'new', label: 'Baru', badgeClass: 'badge-new' },
  { value: 'in_progress', label: 'Diproses', badgeClass: 'badge-in-progress' },
  { value: 'resolved', label: 'Selesai', badgeClass: 'badge-resolved' },
  { value: 'rejected', label: 'Ditolak', badgeClass: 'badge-rejected' }
];

// Helpers to get label
export const getCategoryLabel = (cat) => BUG_CATEGORIES.find(c => c.value === cat)?.label || cat || 'Lainnya';
export const getPageLabel = (p) => BUG_PAGES.find(item => item.value === p)?.label || p || 'Lainnya';
export const getImpactLabel = (imp) => BUG_IMPACTS.find(i => i.value === imp)?.label || imp || 'Sedang';
export const getStatusLabel = (st) => BUG_STATUSES.find(s => s.value === st)?.label || st || 'Baru';

const LOCAL_STORAGE_KEY = 'agriconnect_bug_reports_cache';

// Helper to get local cache — kosong = kosong (tanpa seed basi milik user lain).
const getLocalReportsCache = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

// Helper to save local cache
const saveLocalReportsCache = (reports) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {}
};

/**
 * Generate unique report number: BUG-YYYYMMDD-XXX
 */
export const generateReportNumber = (existingCount = 0) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Sequence or random 3-digit
  const seq = String((existingCount % 999) + 1).padStart(3, '0');
  return `BUG-${dateStr}-${seq}`;
};

/**
 * Fetch all bug reports from Supabase (with fallback cache)
 */
export const fetchBugReportsFromSupabase = async (options = {}) => {
  const { userId = null, role = null } = options;

  try {
    let query = supabase
      .from('bug_reports')
      .select('*, bug_report_attachments(*)');

    // If not admin and userId is specified, filter by user_id
    if (role !== 'admin' && userId) {
      query = query.eq('user_id', userId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (!error && Array.isArray(data) && data.length > 0) {
      // Map attachments array to consistent property
      const mapped = data.map(r => ({
        ...r,
        attachments: r.bug_report_attachments || []
      }));
      saveLocalReportsCache(mapped);
      return { data: mapped, error: null };
    }

    if (error) {
      console.warn('[bugReportService] Supabase fetch notice:', error.message);
    }
  } catch (err) {
    console.warn('[bugReportService] Fetch caught error, using cached records:', err);
  }

  // Graceful Fallback from Cache
  const cached = getLocalReportsCache();
  if (role !== 'admin' && userId) {
    return { data: cached.filter(r => r.user_id === userId), error: null };
  }
  return { data: cached, error: null };
};

/**
 * Upload screenshot to Supabase Storage bucket 'bug-reports'
 */
export const uploadScreenshotToStorage = async (file, reportNumber) => {
  if (!file) return null;

  // Max 2MB
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Ukuran file maksimal 2 MB.');
  }

  // Allowed mime types
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowed.includes(file.type.toLowerCase())) {
    throw new Error('Format file tidak didukung. Harap gunakan JPG, JPEG, atau PNG.');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${reportNumber}/${Date.now()}-${cleanName}`;

  try {
    const { data, error } = await supabase.storage
      .from('bug-reports')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (!error && data?.path) {
      const { data: urlData } = supabase.storage
        .from('bug-reports')
        .getPublicUrl(data.path);

      return {
        file_name: file.name,
        file_path: urlData?.publicUrl || data.path,
        file_type: file.type,
        file_size: file.size
      };
    }
  } catch (err) {
    console.warn('[bugReportService] Storage upload notice:', err);
  }

  // Fallback: Read as Data URL so preview works even if Storage bucket is pending
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        file_name: file.name,
        file_path: reader.result,
        file_type: file.type,
        file_size: file.size
      });
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas screenshot.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Create a new Bug Report in Supabase
 */
export const createBugReportInSupabase = async (formData, files = []) => {
  const {
    userId,
    userName,
    userEmail,
    userRole,
    category,
    title,
    page,
    description,
    impact
  } = formData;

  // 1. Validasi Input
  if (!title || title.trim().length < 5) {
    throw new Error('Judul masalah wajib diisi (minimal 5 karakter).');
  }
  if (title.trim().length > 100) {
    throw new Error('Judul masalah maksimal 100 karakter.');
  }
  if (!category) {
    throw new Error('Jenis masalah wajib dipilih.');
  }
  if (!page) {
    throw new Error('Halaman terjadinya masalah wajib dipilih.');
  }
  if (!description || description.trim().length < 10) {
    throw new Error('Deskripsi masalah wajib diisi (minimal 10 karakter).');
  }
  if (description.trim().length > 2000) {
    throw new Error('Deskripsi masalah maksimal 2000 karakter.');
  }

  // 2. Generate Report Number
  const cachedList = getLocalReportsCache();
  const reportNumber = generateReportNumber(cachedList.length + 1);

  // 3. Upload Attachments
  const uploadedAttachments = [];
  for (const file of files.slice(0, 3)) {
    try {
      const att = await uploadScreenshotToStorage(file, reportNumber);
      if (att) uploadedAttachments.push(att);
    } catch (e) {
      console.warn('Screenshot upload warning:', e.message);
    }
  }

  // 4. Payload Record
  const newRecord = {
    report_number: reportNumber,
    user_id: userId,
    user_name: userName || 'Pengguna AgriConnect',
    user_email: userEmail || 'user@agriconnect.id',
    user_role: userRole || 'pembeli',
    category,
    title: title.trim(),
    page,
    description: description.trim(),
    impact: impact || 'medium',
    status: 'new',
    admin_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let savedRecord = null;

  try {
    const { data, error } = await supabase
      .from('bug_reports')
      .insert([newRecord])
      .select()
      .single();

    if (!error && data) {
      savedRecord = data;

      // Insert attachments if any
      if (uploadedAttachments.length > 0) {
        const attRows = uploadedAttachments.map(att => ({
          bug_report_id: data.id,
          file_name: att.file_name,
          file_path: att.file_path,
          file_type: att.file_type,
          file_size: att.file_size
        }));

        const { data: insertedAtts } = await supabase
          .from('bug_report_attachments')
          .insert(attRows)
          .select();

        savedRecord.attachments = insertedAtts || uploadedAttachments;
      } else {
        savedRecord.attachments = [];
      }
    } else if (error) {
      console.warn('[bugReportService] Insert notice:', error.message);
    }
  } catch (err) {
    console.warn('[bugReportService] Database insert caught error:', err);
  }

  // Fallback to local cache if database insert did not return
  if (!savedRecord) {
    savedRecord = {
      ...newRecord,
      id: `local-${Date.now()}`,
      attachments: uploadedAttachments
    };
  }

  // Update local cache
  const updatedList = [savedRecord, ...cachedList];
  saveLocalReportsCache(updatedList);

  // Trigger Notification: Laporan Bug Baru ke Admin
  notifyBugReportCreated({
    userRole: formData.userRole,
    reportId: savedRecord.id
  }).catch(e => console.warn('Notification bug report error:', e));

  return savedRecord;
};

/**
 * Update Bug Report Status (Admin only action)
 */
export const updateBugReportStatusInSupabase = async (reportId, newStatus, adminNote = '', adminUserId = null) => {
  const updatePayload = {
    status: newStatus,
    admin_note: adminNote || null,
    updated_at: new Date().toISOString()
  };

  if (newStatus === 'resolved') {
    updatePayload.resolved_at = new Date().toISOString();
    if (adminUserId) updatePayload.resolved_by = adminUserId;
  }

  try {
    const { data, error } = await supabase
      .from('bug_reports')
      .update(updatePayload)
      .eq('id', reportId)
      .select('*, bug_report_attachments(*)')
      .single();

    if (!error && data) {
      const mapped = { ...data, attachments: data.bug_report_attachments || [] };
      // Update cache
      const cached = getLocalReportsCache();
      const updated = cached.map(r => r.id === reportId ? mapped : r);
      saveLocalReportsCache(updated);
      return { data: mapped, error: null };
    }
  } catch (err) {
    console.warn('[bugReportService] Update status caught error:', err);
  }

  // Update local cache fallback
  const cached = getLocalReportsCache();
  const updated = cached.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        ...updatePayload
      };
    }
    return r;
  });
  saveLocalReportsCache(updated);

  const target = updated.find(r => r.id === reportId);
  return { data: target, error: null };
};

/**
 * Realtime subscription to bug_reports table
 */
export const subscribeBugReports = (onUpdate) => {
  try {
    const channelName = `public_bug_reports_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bug_reports' },
        (payload) => {
          if (onUpdate) onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('[bugReportService] Error removing channel:', e);
      }
    };
  } catch (err) {
    console.warn('[bugReportService] Realtime subscribe warning:', err);
    return () => {};
  }
};
