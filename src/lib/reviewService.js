import { supabase } from './supabaseClient';
import { DEFAULT_AVATAR } from './constants';

/**
 * Service untuk mengelola Review & Rating Petani di TaniNiaga.
 * 
 * Aturan Bisnis:
 * 1. Setiap petani memiliki data rating & ulasan yang terisolasi di Supabase.
 * 2. Nilai rating keseluruhan adalah rata-rata dari seluruh pembeli (misal 5 dan 4 -> 4.5).
 * 3. Jika petani belum memiliki ulasan, nilai rating default adalah 5.0 dengan 0 ulasan.
 */

// Fallback seed review per ID / nama jika tabel di Supabase belum dibuat
const FALLBACK_SEED_REVIEWS = {
  // Akun yoru: Pembeli 1 rating 5, Pembeli 2 rating 4 -> Rata-rata 4.5
  yoru: [
    {
      id: 'rev-yoru-1',
      farmer_id: 'a1111111-1111-1111-1111-111111111111',
      buyer_id: 'b2222222-2222-2222-2222-222222222222',
      buyer_name: 'ikon (PT Royal Agro)',
      buyer_avatar: DEFAULT_AVATAR,
      commodity_name: 'Beras Premium Superwin',
      transaction_code: 'TRX-YORU-001',
      rating: 5.0,
      comment: 'Kualitas beras superwin sangat pulen, bersih dari kotoran/gabah, dan kadar air sesuai standar SNI. Pengiriman tepat waktu!',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'rev-yoru-2',
      farmer_id: 'a1111111-1111-1111-1111-111111111111',
      buyer_id: 'b2222222-2222-2222-2222-222222222222',
      buyer_name: 'Hendra Pratama, S.T.',
      buyer_avatar: DEFAULT_AVATAR,
      commodity_name: 'Cabai Rawit Merah (Rica Minahasa) Segar',
      transaction_code: 'TRX-YORU-002',
      rating: 4.0,
      comment: 'Cabai rica tiba dalam keadaan segar dan tingkat kepedasan luar biasa. Ada sedikit sortasi bobot tapi keseluruhan sangat memuaskan.',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],
  // Akun Samuel Raranta
  samuel: [
    {
      id: 'rev-sam-1',
      farmer_id: 'b1ad80e8-1da5-4be1-bff6-35ee468b166f',
      buyer_id: 'b2222222-2222-2222-2222-222222222222',
      buyer_name: 'ikon (PT Royal Agro)',
      buyer_avatar: DEFAULT_AVATAR,
      commodity_name: 'Cengkeh Zanzibar Kering (10 Ton)',
      transaction_code: 'TRX-SAM-001',
      rating: 5.0,
      comment: 'Kadar air cengkeh di bawah 12% dan aroma eugenol sangat kuat. Sangat profesional dalam pengemasan karung goni berlapis.',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString()
    },
    {
      id: 'rev-sam-2',
      farmer_id: 'b1ad80e8-1da5-4be1-bff6-35ee468b166f',
      buyer_id: 'b2222222-2222-2222-2222-222222222222',
      buyer_name: 'CV Pangan Mandiri Nusantara',
      buyer_avatar: DEFAULT_AVATAR,
      commodity_name: 'Kentang Granola Modoinding',
      transaction_code: 'TRX-SAM-002',
      rating: 4.8,
      comment: 'Kentang ukuran seragam, kulit bersih tanpa cacat busuk basah. Mitra petani terpercaya di Minahasa Selatan.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    }
  ],
  // Akun Pikachu
  pikachu: [
    {
      id: 'rev-pika-1',
      farmer_id: 'c3333333-3333-3333-3333-333333333333',
      buyer_id: 'b2222222-2222-2222-2222-222222222222',
      buyer_name: 'Dimas (PT Royal Agro)',
      buyer_avatar: DEFAULT_AVATAR,
      commodity_name: 'Bawang Merah',
      transaction_code: 'TRX-PIKA-001',
      rating: 5.0,
      comment: 'Bawang merah kualitas super, kering sempurna dan aroma tajam. Penimbangan tepat tanpa susut berlebih.',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'rev-pika-2',
      farmer_id: 'c3333333-3333-3333-3333-333333333333',
      buyer_id: 'b2222222-2222-2222-2222-222222222222',
      buyer_name: 'CV Agro Sentosa Minahasa',
      buyer_avatar: DEFAULT_AVATAR,
      commodity_name: 'Bawang Merah',
      transaction_code: 'TRX-PIKA-002',
      rating: 5.0,
      comment: 'Pelayanan sangat ramah, respon cepat, dan komoditas siap angkut tepat waktu di gudang.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    }
  ]
};

/**
 * Hitung rata-rata rating dan rincian persentase bintang.
 */
export function calculateRatingSummary(reviewsList = []) {
  if (!Array.isArray(reviewsList) || reviewsList.length === 0) {
    return {
      average: 5.0,
      totalCount: 0,
      isDefault: true,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  let totalSum = 0;
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviewsList.forEach(r => {
    const score = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    distribution[score] = (distribution[score] || 0) + 1;
    totalSum += Number(r.rating) || 5;
  });

  const totalCount = reviewsList.length;
  const rawAverage = totalSum / totalCount;
  // Format ke 1 desimal (contoh: 4.5)
  const average = Number(rawAverage.toFixed(1));

  const percentages = {
    5: Math.round(((distribution[5] || 0) / totalCount) * 100),
    4: Math.round(((distribution[4] || 0) / totalCount) * 100),
    3: Math.round(((distribution[3] || 0) / totalCount) * 100),
    2: Math.round(((distribution[2] || 0) / totalCount) * 100),
    1: Math.round(((distribution[1] || 0) / totalCount) * 100),
  };

  return {
    average,
    totalCount,
    isDefault: false,
    distribution,
    percentages
  };
}

/**
 * Ambil daftar review dan rangkuman rating seorang petani dari Supabase.
 */
export async function fetchFarmerReviews(farmerId, farmerName = '') {
  const normName = String(farmerName || '').toLowerCase();
  const cacheKey = `agriconnect_farmer_reviews_${farmerId || normName || 'default'}`;

  try {
    if (farmerId) {
      // 1. Coba ambil dari tabel public.farmer_reviews di Supabase
      const { data, error } = await supabase
        .from('farmer_reviews')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // Simpan ke cache lokal
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {}

        const summary = calculateRatingSummary(data);
        return {
          reviews: data,
          ...summary
        };
      }
    }
  } catch (err) {
    console.warn('[reviewService] Gagal fetch dari Supabase:', err);
  }

  // 2. Fallback: Baca dari localStorage jika pernah ada
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return {
          reviews: parsed,
          ...calculateRatingSummary(parsed)
        };
      }
    }
  } catch (e) {}

  // 3. Fallback Seed bawaan per user spesifik
  let seed = [];
  if (normName.includes('yoru') || farmerId === 'a1111111-1111-1111-1111-111111111111') {
    seed = FALLBACK_SEED_REVIEWS.yoru;
  } else if (normName.includes('samuel') || farmerId === 'b1ad80e8-1da5-4be1-bff6-35ee468b166f') {
    seed = FALLBACK_SEED_REVIEWS.samuel;
  } else if (normName.includes('pika') || farmerId === 'c3333333-3333-3333-3333-333333333333') {
    seed = FALLBACK_SEED_REVIEWS.pikachu;
  } else {
    // Petani baru belum ada rating -> default 5.0 (0 ulasan)
    seed = [];
  }

  // Simpan seed awal ke localStorage agar persist
  try {
    localStorage.setItem(cacheKey, JSON.stringify(seed));
  } catch (e) {}

  return {
    reviews: seed,
    ...calculateRatingSummary(seed)
  };
}

/**
 * Tambah ulasan baru ke Supabase
 */
export async function addFarmerReview(reviewPayload) {
  const newRow = {
    id: reviewPayload.id || undefined,
    farmer_id: reviewPayload.farmer_id,
    buyer_id: reviewPayload.buyer_id || null,
    buyer_name: reviewPayload.buyer_name || 'Pembeli Terverifikasi',
    buyer_avatar: reviewPayload.buyer_avatar || DEFAULT_AVATAR,
    commodity_name: reviewPayload.commodity_name || 'Komoditas Pertanian',
    transaction_code: reviewPayload.transaction_code || null,
    rating: Number(reviewPayload.rating) || 5.0,
    comment: reviewPayload.comment || '',
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('farmer_reviews')
      .insert([newRow])
      .select()
      .single();

    if (!error && data) {
      updateLocalCache(data.farmer_id, data);
      return { data, error: null };
    }
  } catch (e) {
    console.warn('[reviewService] Gagal insert Supabase:', e);
  }

  // Fallback simpan di local cache
  const localRow = { ...newRow, id: newRow.id || `rev-${Date.now()}` };
  updateLocalCache(localRow.farmer_id, localRow);
  return { data: localRow, error: null };
}

function updateLocalCache(farmerId, newReview) {
  if (!farmerId) return;
  const cacheKey = `agriconnect_farmer_reviews_${farmerId}`;
  try {
    const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const updated = [newReview, ...existing.filter(r => r.id !== newReview.id)];
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  } catch (e) {}
}

/**
 * Realtime subscription untuk review petani
 */
export function subscribeFarmerReviews(farmerId, onReviewChange) {
  if (!farmerId) return () => {};

  try {
    const channel = supabase
      .channel(`farmer_reviews_${farmerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'farmer_reviews',
          filter: `farmer_id=eq.${farmerId}`
        },
        () => {
          fetchFarmerReviews(farmerId).then(onReviewChange);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    return () => {};
  }
}

/**
 * Ambil semua review yang dibuat oleh pembeli tertentu atau semua review transaksi.
 */
export async function fetchBuyerReviews(buyerId = null) {
  try {
    let query = supabase
      .from('farmer_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (buyerId) {
      query = query.eq('buyer_id', buyerId);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      return { data, error: null };
    }
  } catch (err) {
    console.warn('[reviewService] Gagal fetch review pembeli dari Supabase:', err);
  }

  // Fallback: baca dari seluruh local cache
  try {
    const allReviews = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('agriconnect_farmer_reviews_')) {
        const item = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(item)) {
          allReviews.push(...item.filter(r => !buyerId || r.buyer_id === buyerId));
        }
      }
    }
    return { data: allReviews, error: null };
  } catch (e) {
    return { data: [], error: null };
  }
}

/**
 * Tambah atau Perbarui review untuk transaksi tertentu di Supabase.
 */
export async function upsertFarmerReview(reviewPayload) {
  const {
    id,
    farmer_id,
    buyer_id,
    buyer_name,
    buyer_avatar,
    commodity_name,
    commodity_id,
    transaction_code,
    rating,
    comment
  } = reviewPayload;

  const now = new Date().toISOString();

  try {
    let existingId = id;
    if (!existingId && transaction_code) {
      const { data: existing } = await supabase
        .from('farmer_reviews')
        .select('id')
        .eq('transaction_code', transaction_code)
        .maybeSingle();
      if (existing?.id) existingId = existing.id;
    }

    if (existingId) {
      const { data, error } = await supabase
        .from('farmer_reviews')
        .update({
          rating: Number(rating) || 5.0,
          comment: comment || '',
          updated_at: now
        })
        .eq('id', existingId)
        .select()
        .single();

      if (!error && data) {
        updateLocalCache(data.farmer_id, data);
        return { data, error: null };
      }
    } else {
      const newRow = {
        farmer_id,
        buyer_id: buyer_id || null,
        buyer_name: buyer_name || 'Pembeli Terverifikasi',
        buyer_avatar: buyer_avatar || DEFAULT_AVATAR,
        commodity_name: commodity_name || 'Komoditas Pertanian',
        commodity_id: commodity_id || null,
        transaction_code: transaction_code || null,
        rating: Number(rating) || 5.0,
        comment: comment || '',
        created_at: now,
        updated_at: now
      };

      const { data, error } = await supabase
        .from('farmer_reviews')
        .insert([newRow])
        .select()
        .single();

      if (!error && data) {
        updateLocalCache(data.farmer_id, data);
        return { data, error: null };
      }
    }
  } catch (err) {
    console.warn('[reviewService] Gagal upsert ke Supabase:', err);
  }

  // Fallback lokal
  const fallbackRow = {
    id: id || `rev-${Date.now()}`,
    farmer_id,
    buyer_id: buyer_id || null,
    buyer_name: buyer_name || 'Pembeli Terverifikasi',
    buyer_avatar: buyer_avatar || DEFAULT_AVATAR,
    commodity_name: commodity_name || 'Komoditas Pertanian',
    commodity_id: commodity_id || null,
    transaction_code: transaction_code || null,
    rating: Number(rating) || 5.0,
    comment: comment || '',
    created_at: now,
    updated_at: now
  };
  updateLocalCache(farmer_id, fallbackRow);
  return { data: fallbackRow, error: null };
}

