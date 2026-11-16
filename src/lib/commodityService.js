import { supabase } from './supabaseClient';
import { DEFAULT_AVATAR } from './constants';
import { 
  notifyCommoditySubmitted, 
  notifyCommodityApproved, 
  notifyCommodityRejected 
} from './notificationService';

// Helper to get active farmer ID — hanya jika role=petani (cegah atribusi silang peran).
export const getCurrentFarmerId = () => {
  try {
    const roleStored = localStorage.getItem('agriconnect_auth_user_petani');
    const genericStored = localStorage.getItem('agriconnect_auth_user');
    const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
    if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'petani')) return parsed.id;
  } catch (err) {
    console.warn('[commodityService] Error reading auth user from localStorage:', err);
  }
  return null;
};

// Map database row (snake_case) to frontend object (camelCase)
export const mapRowToCommodity = (row) => {
  const stockVal = Number(row.stock_ton) || 0;
  const minOrderVal = Number(row.min_order_ton) || 1;
  const priceVal = Number(row.price_per_kg) || 0;
  const img = row.image_url || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80';
  
  // Authoritative Farmer Profile from profiles table join
  const profile = row.farmer || null;
  const resolvedFarmerName = profile?.full_name || row.farmer_leader || (row.farmer_group && !row.farmer_group.toLowerCase().startsWith('poktan') ? row.farmer_group : 'Petani');
  const resolvedFarmerAvatar = profile?.avatar_url || DEFAULT_AVATAR;
  const resolvedLocation = row.location || profile?.location || 'Minahasa';

  return {
    id: row.id,
    farmerId: row.farmer_id || profile?.id || null,
    name: row.name,
    commodityName: row.name, // compatibility for Admin & Buyer
    category: row.category,
    farmerGroup: row.farmer_group || 'Kelompok Tani',
    farmerLeader: resolvedFarmerName,
    farmerName: resolvedFarmerName,
    farmerAvatar: resolvedFarmerAvatar,
    avatarUrl: resolvedFarmerAvatar,
    location: resolvedLocation,
    distanceInfo: row.distance_info || resolvedLocation,
    stock: stockVal,
    stockTon: stockVal,
    totalStockTon: stockVal,
    unit: 'Ton',
    minOrderTon: minOrderVal,
    minimumOrderTon: minOrderVal,
    pricePerKg: priceVal,
    proposedPrice: priceVal,
    marketBenchmarkPrice: priceVal,
    qualityGrade: row.quality_grade || '',
    moistureContent: row.quality_grade || '',
    harvestType: row.harvest_type || 'Siap Diambil di Gudang',
    harvestDate: row.harvest_date || 'Panen September 2026',
    harvestPeriod: row.harvest_date || 'Panen September 2026',
    status: row.status || 'Menunggu Persetujuan',
    adminNotes: row.admin_notes || '',
    notes: row.admin_notes || row.description || '',
    rating: Number(row.rating) || 4.8,
    reviewsCount: Number(row.reviews_count) || 0,
    image: img,
    imageUrl: img,
    image_url: img,
    images: [img],
    description: row.description || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// Map frontend object (camelCase) to database row (snake_case)
export const mapCommodityToRow = (item, explicitFarmerId = null) => {
  const farmerId = explicitFarmerId || item.farmerId || getCurrentFarmerId();
  const name = item.name || item.commodityName || 'Komoditas Pertanian';
  const img = item.image || item.imageUrl || (Array.isArray(item.images) && item.images[0]) || '';
  const farmerLeader = item.farmerLeader || item.farmerName || 'Petani';

  return {
    farmer_id: farmerId,
    name: name,
    category: item.category || 'Biji-Bijian & Palawija',
    farmer_group: item.farmerGroup || 'Kelompok Tani',
    farmer_leader: farmerLeader,
    location: item.location || 'Minahasa',
    distance_info: item.distanceInfo || '18 km dari Gudang Kawangkoan',
    stock_ton: Number(item.stock ?? item.stockTon ?? item.totalStockTon) || 0,
    min_order_ton: Number(item.minOrderTon ?? item.minimumOrderTon) || 1,
    price_per_kg: Number(item.pricePerKg ?? item.proposedPrice) || 0,
    quality_grade: item.qualityGrade || item.moistureContent || '',
    harvest_type: item.harvestType || 'Siap Diambil di Gudang',
    harvest_date: item.harvestDate || item.harvestPeriod || 'Panen September 2026',
    status: item.status || 'Menunggu Persetujuan',
    admin_notes: item.adminNotes || item.notes || null,
    rating: Number(item.rating) || 4.8,
    reviews_count: Number(item.reviewsCount) || 0,
    image_url: img,
    description: item.description || '',
    updated_at: new Date().toISOString()
  };
};

/**
 * Fetch commodities from Supabase (100% Real Data, no mock fallbacks).
 * Returns { data, isSupabase, error }
 */
export async function fetchCommoditiesFromSupabase(options = {}) {
  const { statusFilter = null, farmerId = null, orderBy = 'created_at', ascending = false } = options;
  try {
    let query = supabase.from('commodities').select('*, farmer:profiles(*)');

    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        query = query.in('status', statusFilter);
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }

    query = query.order(orderBy, { ascending });

    const { data, error } = await query;

    if (error) {
      console.warn('[Supabase] Join fetch error, falling back to flat query:', error.message);
      let fallbackQuery = supabase.from('commodities').select('*');
      if (statusFilter) {
        if (Array.isArray(statusFilter)) {
          fallbackQuery = fallbackQuery.in('status', statusFilter);
        } else {
          fallbackQuery = fallbackQuery.eq('status', statusFilter);
        }
      }
      if (farmerId) {
        fallbackQuery = fallbackQuery.eq('farmer_id', farmerId);
      }
      fallbackQuery = fallbackQuery.order(orderBy, { ascending });
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) {
        return { data: [], isSupabase: false, error: fallbackError.message };
      }
      return { data: (fallbackData || []).map(mapRowToCommodity), isSupabase: true, error: null };
    }

    if (data && data.length > 0) {
      return { data: data.map(mapRowToCommodity), isSupabase: true, error: null };
    }

    // If 0 items in database, return clean empty array []
    return { data: [], isSupabase: true, error: null };
  } catch (err) {
    console.warn('[Supabase] Fetch commodities exception:', err);
    return { data: [], isSupabase: false, error: err.message };
  }
}

/**
 * Create a new commodity in Supabase.
 * Automatically enforces status = 'Menunggu Persetujuan'.
 */
export async function createCommodityInSupabase(commodityData, explicitFarmerId = null) {
  try {
    let targetFarmerId = explicitFarmerId || commodityData.farmerId;
    let targetFarmerName = commodityData.farmerLeader || commodityData.farmerName;
    let targetFarmerGroup = commodityData.farmerGroup || 'Kelompok Tani';

    // 1. Resolve active user from Supabase auth session directly
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      if (!targetFarmerId) targetFarmerId = user.id;
      if (!targetFarmerName || targetFarmerName === 'Petani' || targetFarmerName === 'Samuel Raranta') {
        targetFarmerName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];
      }
    }

    // 2. Fallback to localStorage if offline/cached — hanya cache petani.
    if (!targetFarmerId) {
      const roleStored = localStorage.getItem('agriconnect_auth_user_petani');
      const genericStored = localStorage.getItem('agriconnect_auth_user');
      const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
      if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'petani')) {
        targetFarmerId = parsed.id;
        if (!targetFarmerName && (parsed?.fullName || parsed?.name)) {
          targetFarmerName = parsed.fullName || parsed.name;
        }
      }
    }

    // 3. Ensure user exists in public.profiles to satisfy foreign key constraint!
    if (targetFarmerId && user) {
      try {
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', targetFarmerId)
          .maybeSingle();

        if (!existingProf) {
          await supabase.from('profiles').insert([{
            id: targetFarmerId,
            role: 'petani',
            full_name: targetFarmerName || 'Petani',
            email: user.email,
            location: 'Minahasa, Sulawesi Utara',
            kyc_status: 'verified'
          }]);
        } else {
          if (existingProf.full_name && targetFarmerName === 'Petani') {
            targetFarmerName = existingProf.full_name;
          }
        }
      } catch (profErr) {
        console.warn('[commodityService] Profile verification notice:', profErr);
      }
    }

    const payload = {
      ...commodityData,
      farmerId: targetFarmerId,
      farmerLeader: targetFarmerName || 'Petani',
      farmerName: targetFarmerName || 'Petani',
      farmerGroup: targetFarmerGroup || 'Kelompok Tani',
      status: 'Menunggu Persetujuan',
      adminNotes: 'Menunggu peninjauan dan verifikasi dari Admin.'
    };

    const row = mapCommodityToRow(payload, targetFarmerId);

    const { data, error } = await supabase
      .from('commodities')
      .insert([row])
      .select();

    if (error) {
      console.error('[Supabase] Error creating commodity:', error.message);
      return { data: null, error: error.message };
    }

    const created = data && data[0] ? mapRowToCommodity(data[0]) : null;
    if (created) {
      // Trigger Notification: Komoditas Menunggu Verifikasi ke Admin
      notifyCommoditySubmitted({
        commodityId: created.id,
        commodityName: created.name || created.commodityName || 'Komoditas'
      }).catch(e => console.warn('Notification commodity submit error:', e));
    }
    return { data: created, error: null };
  } catch (err) {
    console.error('[Supabase] Create commodity exception:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Update an existing commodity in Supabase.
 */
export async function updateCommodityInSupabase(id, updateData) {
  try {
    const row = mapCommodityToRow(updateData);
    delete row.id; // Do not overwrite ID

    const { data, error } = await supabase
      .from('commodities')
      .update(row)
      .eq('id', id)
      .select();

    if (error) {
      console.error('[Supabase] Error updating commodity:', error.message);
      return { data: null, error: error.message };
    }

    const updated = data && data[0] ? mapRowToCommodity(data[0]) : null;
    return { data: updated, error: null };
  } catch (err) {
    console.error('[Supabase] Update commodity exception:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Update commodity status (for Admin approval / rejection).
 * @param {string} id - Commodity UUID
 * @param {'Aktif' | 'Tidak Aktif' | 'Menunggu Persetujuan'} status
 * @param {string} [notes] - Admin notes or reason
 */
export async function updateCommodityStatusInSupabase(id, status, notes = '') {
  try {
    const updatePayload = {
      status,
      admin_notes: notes,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('commodities')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) {
      console.error('[Supabase] Error updating commodity status:', error.message);
      return { data: null, error: error.message };
    }

    const updated = data && data[0] ? mapRowToCommodity(data[0]) : null;
    if (updated) {
      if (status === 'Aktif' || status === 'Tersedia' || status === 'Disetujui') {
        notifyCommodityApproved({
          farmerId: updated.farmerId,
          commodityName: updated.name || updated.commodityName || 'Komoditas',
          commodityId: updated.id
        }).catch(e => console.warn('Notification commodity approved error:', e));
      } else if (status === 'Tidak Aktif' || status === 'Ditolak') {
        notifyCommodityRejected({
          farmerId: updated.farmerId,
          commodityName: updated.name || updated.commodityName || 'Komoditas',
          commodityId: updated.id
        }).catch(e => console.warn('Notification commodity rejected error:', e));
      }
    }
    return { data: updated, error: null };
  } catch (err) {
    console.error('[Supabase] Update commodity status exception:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Delete a commodity from Supabase.
 */
export async function deleteCommodityInSupabase(id) {
  try {
    const { error } = await supabase
      .from('commodities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error deleting commodity:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('[Supabase] Delete commodity exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe to realtime changes on the commodities table.
 */
export function subscribeCommodities(onPayload) {
  try {
    const channelName = `public_commodities_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commodities' },
        (payload) => {
          if (typeof onPayload === 'function') {
            onPayload(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (typeof onPayload === 'function') {
            onPayload(payload);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('[commodityService] Error removing channel:', e);
      }
    };
  } catch (err) {
    console.warn('[commodityService] subscribeCommodities error:', err);
    return () => {};
  }
}
