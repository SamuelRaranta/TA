import { supabase } from './supabaseClient';
import { DEFAULT_AVATAR } from './constants';
import { notifyOfferSubmitted, notifyOrderCreated } from './notificationService';

/**
 * Service to manage Offers, Contracts (Binding Agreements), and Transactions
 * directly with Supabase, enforcing multi-tenant isolation per user.
 */

// Helper to get active user ID — hanya jika role cocok (cegah atribusi silang peran).
export const getActiveUserId = (role = null) => {
  try {
    const stored = localStorage.getItem('agriconnect_auth_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.id && (!role || !parsed?.role || String(parsed.role).toLowerCase() === String(role).toLowerCase())) {
        return parsed.id;
      }
    }
  } catch (err) {}
  return null;
};

// ==========================================
// 1. OFFERS (PENAWARAN & NEGOSIASI)
// ==========================================

export const mapRowToOffer = (row) => {
  const reqTon = Number(row.requested_ton) || 1;
  const offPrice = Number(row.offered_price_per_kg) || 0;
  const listPrice = Number(row.listing_price_per_kg) || (row.commodity?.price_per_kg ? Number(row.commodity.price_per_kg) : 0);
  const totalVal = reqTon * 1000 * offPrice;

  // Parse structured metadata from notes (paymentMethod, validUntil, rejectionReason, source, etc.)
  let userNotes = row.notes || '';
  let paymentMethod = 'Transfer Bank';
  let validUntil = '30 September 2026';
  let rejectionReason = null;
  let source = 'pembeli';
  let isAutoAccepted = false;
  let acceptedAt = null;
  let rejectedAt = null;
  let stockReserved = false;
  let stockRestored = false;
  let reservedTon = 0;
  let counterBy = null;

  try {
    if (typeof row.notes === 'string' && row.notes.trim().startsWith('{')) {
      const meta = JSON.parse(row.notes);
      userNotes = meta.notes || '';
      if (meta.paymentMethod) paymentMethod = meta.paymentMethod;
      if (meta.validUntil) validUntil = meta.validUntil;
      if (meta.rejectionReason) rejectionReason = meta.rejectionReason;
      if (meta.source) source = meta.source;
      if (meta.isAutoAccepted !== undefined) isAutoAccepted = Boolean(meta.isAutoAccepted);
      if (meta.acceptedAt) acceptedAt = meta.acceptedAt;
      if (meta.rejectedAt) rejectedAt = meta.rejectedAt;
      if (meta.stockReserved !== undefined) stockReserved = Boolean(meta.stockReserved);
      if (meta.stockRestored !== undefined) stockRestored = Boolean(meta.stockRestored);
      if (meta.reservedTon !== undefined) reservedTon = Number(meta.reservedTon) || 0;
      if (meta.counterBy) counterBy = meta.counterBy;
    }
  } catch (e) {
    // Keep userNotes as plain string
  }

  // Format validUntil to readable Indonesian string if ISO date
  let formattedValidUntil = validUntil;
  try {
    if (validUntil && validUntil.includes('-')) {
      const d = new Date(validUntil);
      if (!isNaN(d.getTime())) {
        formattedValidUntil = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }
  } catch (e) {}

  // Expiry calculation: if pending and validUntil is in the past, treat as Kedaluwarsa
  let finalStatus = row.status || 'Menunggu Respon';
  const normalizedStatus = String(finalStatus).trim().toLowerCase();
  const isTerminalStatus = ['diterima', 'disetujui', 'accepted', 'approved', 'ditolak', 'rejected', 'dibatalkan', 'batal', 'cancelled', 'canceled'].includes(normalizedStatus);
  if (!isTerminalStatus) {
    if (validUntil) {
      try {
        const expDate = new Date(validUntil);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(expDate.getTime()) && expDate < today) {
          finalStatus = 'Kedaluwarsa';
        }
      } catch (e) {}
    }
  }

  // Normalize status naming for consistency
  if (finalStatus === 'Disetujui' || finalStatus === 'accepted') finalStatus = 'Diterima';
  if (finalStatus === 'rejected') finalStatus = 'Ditolak';
  if (finalStatus === 'expired') finalStatus = 'Kedaluwarsa';

  // Stock from commodity
  const stockTon = row.commodity?.stock_ton !== undefined && row.commodity?.stock_ton !== null
    ? Number(row.commodity.stock_ton)
    : (row.stock_ton ? Number(row.stock_ton) : 0);

  const commImg = row.commodity?.image_url 
    || row.commodity?.image 
    || row.commodity_image 
    || row.image_url 
    || row.imageUrl 
    || null;

  return {
    id: row.id,
    offerCode: row.offer_code || `OFF-${String(row.id).slice(0, 8).toUpperCase()}`,
    commodityId: row.commodity_id,
    commodityName: row.commodity?.name || row.commodity_name || 'Komoditas Pertanian',
    commodityImage: commImg,
    imageUrl: commImg,
    image: commImg,
    category: row.commodity?.category || row.category || 'Perkebunan',
    buyerId: row.buyer_id,
    buyerName: row.buyer?.company_name || row.buyer?.full_name || row.buyer_name || 'PT Contoh Nusantara',
    buyerCompany: row.buyer?.company_name || '',
    buyerAvatar: row.buyer?.avatar_url || DEFAULT_AVATAR,
    farmerId: row.farmer_id,
    farmerGroup: row.farmer?.group_name || row.farmer_group || 'Kelompok Tani',
    farmerLeader: row.farmer?.leader_name || row.farmer?.full_name || row.farmer_leader || 'Petani',
    farmerAvatar: row.farmer?.avatar_url || DEFAULT_AVATAR,
    requestedTon: reqTon,
    requestedKg: reqTon * 1000,
    stockTon: stockTon,
    stockKg: stockTon * 1000,
    offeredPricePerKg: offPrice,
    listingPricePerKg: listPrice,
    totalOfferValue: totalVal,
    pickupDate: row.pickup_date ? new Date(row.pickup_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '7 Hari ke Depan',
    pickupLocation: row.pickup_location || 'Minahasa',
    fleetType: row.fleet_type || 'Truk Tronton (Kapasitas 30 Ton)',
    paymentMethod: paymentMethod,
    validUntil: formattedValidUntil,
    rawValidUntil: validUntil,
    rejectionReason: rejectionReason,
    source: source,
    isAutoAccepted: isAutoAccepted || source === 'cari_penawaran',
    acceptedAt: acceptedAt,
    rejectedAt: rejectedAt,
    stockReserved: stockReserved,
    stockRestored: stockRestored,
    reservedTon: reservedTon,
    notes: userNotes,
    status: finalStatus,
    counterPricePerKg: row.counter_price_per_kg ? Number(row.counter_price_per_kg) : null,
    counterTon: row.counter_ton ? Number(row.counter_ton) : null,
    counterNotes: row.counter_notes || null,
    counterBy: counterBy || (row.counter_price_per_kg ? 'petani' : null),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const fetchOffersFromSupabase = async (options = {}) => {
  const { farmerId = null, buyerId = null, status = null } = options;
  try {
    let query = supabase
      .from('offers')
      .select('*, commodity:commodities(*), buyer:profiles!offers_buyer_id_fkey(*), farmer:profiles!offers_farmer_id_fkey(*)');

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }
    if (buyerId) {
      query = query.eq('buyer_id', buyerId);
    }
    if (status) {
      if (status === 'Diterima') {
        query = query.in('status', ['Diterima', 'Disetujui', 'accepted']);
      } else if (status === 'Ditolak') {
        query = query.in('status', ['Ditolak', 'rejected']);
      } else if (status === 'Kedaluwarsa') {
        query = query.in('status', ['Kedaluwarsa', 'expired']);
      } else {
        query = query.eq('status', status);
      }
    }

    query = query.order('created_at', { ascending: false });

    let { data, error } = await query;
    if (error) {
      console.warn('[dealService] Joined offers query failed; retrying base rows:', error.message);
      let fallbackQuery = supabase.from('offers').select('*');
      if (farmerId) fallbackQuery = fallbackQuery.eq('farmer_id', farmerId);
      if (buyerId) fallbackQuery = fallbackQuery.eq('buyer_id', buyerId);
      if (status) {
        const statuses = status === 'Diterima' ? ['Diterima', 'Disetujui', 'accepted']
          : status === 'Ditolak' ? ['Ditolak', 'rejected']
            : status === 'Kedaluwarsa' ? ['Kedaluwarsa', 'expired'] : null;
        fallbackQuery = statuses ? fallbackQuery.in('status', statuses) : fallbackQuery.eq('status', status);
      }
      fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
      const fallback = await fallbackQuery;
      if (fallback.error) return { data: [], error: fallback.error.message };
      data = fallback.data || [];

      // Resolve the related buyer, farmer, and commodity using their database IDs
      // when PostgREST cannot infer the foreign-key joins above.
      const profileIds = [...new Set(data.flatMap(row => [row.buyer_id, row.farmer_id]).filter(Boolean))];
      const commodityIds = [...new Set(data.map(row => row.commodity_id).filter(Boolean))];
      const [profilesResult, commoditiesResult] = await Promise.all([
        profileIds.length ? supabase.from('profiles').select('*').in('id', profileIds) : Promise.resolve({ data: [] }),
        commodityIds.length ? supabase.from('commodities').select('*').in('id', commodityIds) : Promise.resolve({ data: [] })
      ]);
      const profiles = new Map((profilesResult.data || []).map(profile => [profile.id, profile]));
      const commodities = new Map((commoditiesResult.data || []).map(commodity => [commodity.id, commodity]));
      data = data.map(row => ({
        ...row,
        buyer: profiles.get(row.buyer_id) || null,
        farmer: profiles.get(row.farmer_id) || null,
        commodity: commodities.get(row.commodity_id) || null
      }));
    }

    const rowsNeedingRelations = data || [];
    const missingProfileIds = [...new Set(rowsNeedingRelations.flatMap(row => [
      (!row.buyer || !row.buyer.full_name) ? row.buyer_id : null,
      (!row.farmer || !row.farmer.full_name) ? row.farmer_id : null
    ]).filter(Boolean))];
    const missingCommodityIds = [...new Set(rowsNeedingRelations
      .filter(row => row.commodity_id && (!row.commodity || !row.commodity.name || !row.commodity.image_url))
      .map(row => row.commodity_id))];
    if (missingProfileIds.length || missingCommodityIds.length) {
      const [profileRes, commodityRes] = await Promise.all([
        missingProfileIds.length ? supabase.from('profiles').select('*').in('id', missingProfileIds) : Promise.resolve({ data: [] }),
        missingCommodityIds.length ? supabase.from('commodities').select('*').in('id', missingCommodityIds) : Promise.resolve({ data: [] })
      ]);
      const profileMap = new Map((profileRes.data || []).map(profile => [profile.id, profile]));
      const commodityMap = new Map((commodityRes.data || []).map(commodity => [commodity.id, commodity]));
      data = rowsNeedingRelations.map(row => ({
        ...row,
        buyer: row.buyer || profileMap.get(row.buyer_id) || null,
        farmer: row.farmer || profileMap.get(row.farmer_id) || null,
        commodity: row.commodity || commodityMap.get(row.commodity_id) || null
      }));
    }

    return { data: (data || []).map(mapRowToOffer), error: null };
  } catch (err) {
    console.warn('[dealService] Exception fetching offers:', err);
    return { data: [], error: err.message };
  }
};

export const createOfferInSupabase = async (offerData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const activeBuyerId = offerData.buyerId || user?.id || getActiveUserId('pembeli');

    let metaNotes = JSON.stringify({
      notes: offerData.notes || '',
      paymentMethod: offerData.paymentMethod || 'Transfer Bank',
      validUntil: offerData.validUntil || '2026-09-30',
      source: offerData.source || 'pembeli',
      isAutoAccepted: Boolean(offerData.isAutoAccepted)
    });

    const reqTon = Number(offerData.requestedTon) || 1;
    const commodityId = offerData.commodityId || null;

    // Penawaran yang masih menunggu tidak mengunci persediaan. Stok baru
    // dipesan ketika petani menerima penawaran, supaya permintaan yang belum
    // disepakati tidak membuat stok database terlihat habis.
    const isAlreadyAccepted = ['Disetujui', 'Diterima', 'accepted'].includes(offerData.status);
    if (isAlreadyAccepted && commodityId) {
      metaNotes = JSON.stringify({ ...JSON.parse(metaNotes), stockReserved: false, stockRestored: false, reservedTon: 0 });
    }
    const newRow = {
      commodity_id: commodityId,
      buyer_id: activeBuyerId,
      farmer_id: offerData.farmerId || null,
      requested_ton: reqTon,
      offered_price_per_kg: Number(offerData.offeredPricePerKg) || 0,
      listing_price_per_kg: Number(offerData.listingPricePerKg) || 0,
      notes: metaNotes,
      status: offerData.status || 'Menunggu Respon'
    };

    const { data, error } = await supabase
      .from('offers')
      .insert([newRow])
      .select('*, commodity:commodities(*), buyer:profiles!offers_buyer_id_fkey(*), farmer:profiles!offers_farmer_id_fkey(*)')
      .single();

    if (error) throw error;

    // Jalur yang membuat offer langsung diterima (mis. proposal Cari Penawaran)
    // harus mengunci stok setelah baris tercatat. Offer biasa tetap menunggu.
    if (isAlreadyAccepted && commodityId) {
      const dec = await decrementCommodityStock(commodityId, reqTon);
      if (!dec.success) {
        await supabase.from('offers').delete().eq('id', data.id);
        throw dec.error || new Error('Gagal mengunci stok.');
      }
      const acceptedMeta = { ...JSON.parse(metaNotes), stockReserved: true, reservedTon: reqTon };
      const { error: metaError } = await supabase.from('offers').update({ notes: JSON.stringify(acceptedMeta) }).eq('id', data.id);
      if (metaError) {
        await restoreCommodityStock(commodityId, reqTon);
        await supabase.from('offers').delete().eq('id', data.id);
        throw metaError;
      }
    }

    const mappedOffer = mapRowToOffer(data);

    // Trigger notification to Buyer and Farmer
    notifyOfferSubmitted({
      buyerId: activeBuyerId,
      farmerId: offerData.farmerId,
      commodityName: mappedOffer.commodityName || 'Komoditas',
      offerId: mappedOffer.id
    }).catch(e => console.warn('[dealService] Notification error:', e));

    return { data: mappedOffer, error: null };
  } catch (err) {
    console.warn('[dealService] Error creating offer:', err);
    return { data: null, error: err.message };
  }
};

export const updateOfferInSupabase = async (offerId, updateFields) => {
  try {
    const rowUpdates = {
      updated_at: new Date().toISOString()
    };

    if (updateFields.status) rowUpdates.status = updateFields.status;
    if (updateFields.counterPricePerKg !== undefined) rowUpdates.counter_price_per_kg = updateFields.counterPricePerKg;
    if (updateFields.counterTon !== undefined) rowUpdates.counter_ton = updateFields.counterTon;
    if (updateFields.counterNotes !== undefined) rowUpdates.counter_notes = updateFields.counterNotes;

    // Handle notes & metadata
    if (updateFields.notes !== undefined || updateFields.rejectionReason !== undefined || updateFields.paymentMethod !== undefined || updateFields.acceptedAt !== undefined || updateFields.rejectedAt !== undefined || updateFields.counterBy !== undefined) {
      let currentMeta = {};
      try {
        const { data: curr } = await supabase.from('offers').select('notes').eq('id', offerId).single();
        if (curr?.notes && curr.notes.trim().startsWith('{')) {
          currentMeta = JSON.parse(curr.notes);
        } else if (curr?.notes) {
          currentMeta = { notes: curr.notes };
        }
      } catch (e) {}

      if (updateFields.notes !== undefined) currentMeta.notes = updateFields.notes;
      if (updateFields.rejectionReason !== undefined) currentMeta.rejectionReason = updateFields.rejectionReason;
      if (updateFields.paymentMethod !== undefined) currentMeta.paymentMethod = updateFields.paymentMethod;
      if (updateFields.acceptedAt !== undefined) currentMeta.acceptedAt = updateFields.acceptedAt;
      if (updateFields.rejectedAt !== undefined) currentMeta.rejectedAt = updateFields.rejectedAt;
      if (updateFields.stockReserved !== undefined) currentMeta.stockReserved = updateFields.stockReserved;
      if (updateFields.stockRestored !== undefined) currentMeta.stockRestored = updateFields.stockRestored;
      if (updateFields.reservedTon !== undefined) currentMeta.reservedTon = updateFields.reservedTon;
      if (updateFields.counterBy !== undefined) currentMeta.counterBy = updateFields.counterBy;

      rowUpdates.notes = JSON.stringify(currentMeta);
    }

    const { data, error } = await supabase
      .from('offers')
      .update(rowUpdates)
      .eq('id', offerId)
      .select('*, commodity:commodities(*), buyer:profiles!offers_buyer_id_fkey(*), farmer:profiles!offers_farmer_id_fkey(*)')
      .single();

    if (error) throw error;
    return { data: mapRowToOffer(data), error: null };
  } catch (err) {
    console.warn('[dealService] Error updating offer:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Kurangi stok komoditas saat deal disepakati (accept).
 * Baca stok segar dari DB; tolak jika stok kurang (tanpa menulis apa pun).
 */
export const decrementCommodityStock = async (commodityId, ton) => {
  try {
    if (!commodityId) return { success: true, skipped: true };
    const need = Number(ton) || 0;
    if (need <= 0) return { success: true, skipped: true };
    const { data: row, error: readError } = await supabase
      .from('commodities')
      .select('id, stock_ton')
      .eq('id', commodityId)
      .maybeSingle();
    if (readError) throw readError;
    if (!row) return { success: false, error: new Error('Komoditas tidak ditemukan di database.') };
    const stock = Number(row.stock_ton) || 0;
    if (stock < need) {
      return { success: false, error: new Error(`Stok tidak mencukupi (tersedia ${stock} Ton, dibutuhkan ${need} Ton).`), stock };
    }
    const { data: updatedRow, error: writeError } = await supabase
      .from('commodities')
      .update({ stock_ton: stock - need, updated_at: new Date().toISOString() })
      .eq('id', commodityId)
      .eq('stock_ton', row.stock_ton)
      .gte('stock_ton', need)
      .select('id, stock_ton')
      .maybeSingle();
    if (writeError) throw writeError;
    if (!updatedRow) {
      const { data: current, error: currentError } = await supabase
        .from('commodities')
        .select('id, stock_ton')
        .eq('id', commodityId)
        .maybeSingle();
      if (currentError) throw currentError;
      const currentStock = Number(current?.stock_ton) || 0;
      const message = currentStock < need
        ? `Stok tidak mencukupi (tersedia ${currentStock} Ton, dibutuhkan ${need} Ton).`
        : currentStock === stock
          ? 'Database tidak mengizinkan perubahan stok. Periksa izin UPDATE untuk komoditas petani.'
          : 'Stok berubah saat proses penerimaan. Muat ulang data lalu coba kembali.';
      return { success: false, error: new Error(message), stock: currentStock };
    }
    return { success: true, newStock: Number(updatedRow.stock_ton), error: null };
  } catch (err) {
    console.warn('[dealService] decrementCommodityStock error:', err);
    return { success: false, error: err };
  }
};

/**
 * Kembalikan stok saat transaksi gagal (cancel/reject pasca-accept/kedaluwarsa).
 */
export const restoreCommodityStock = async (commodityId, ton) => {
  try {
    if (!commodityId) return { success: true, skipped: true };
    const back = Number(ton) || 0;
    if (back <= 0) return { success: true, skipped: true };
    const { data: row, error: readError } = await supabase
      .from('commodities')
      .select('id, stock_ton')
      .eq('id', commodityId)
      .maybeSingle();
    if (readError) throw readError;
    if (!row) return { success: false, error: new Error('Komoditas tidak ditemukan di database.') };
    const stock = Number(row.stock_ton) || 0;
    const { error: writeError } = await supabase
      .from('commodities')
      .update({ stock_ton: stock + back, updated_at: new Date().toISOString() })
      .eq('id', commodityId);
    if (writeError) throw writeError;
    return { success: true, newStock: stock + back, error: null };
  } catch (err) {
    console.warn('[dealService] restoreCommodityStock error:', err);
    return { success: false, error: err };
  }
};

/**
 * Pastikan stok terkunci untuk satu offer (idempoten).
 * Lewati bila flag stockReserved sudah true; untuk baris lama tanpa flag
 * yang statusnya sudah accepted, anggap perlu kunci (catch-up sekali).
 */
export const ensureStockReserved = async (offerId) => {
  try {
    const { data: row, error: readError } = await supabase
      .from('offers')
      .select('id, commodity_id, requested_ton, counter_ton, status, notes')
      .eq('id', offerId)
      .maybeSingle();
    if (readError) throw readError;
    if (!row) return { success: false, error: new Error('Penawaran tidak ditemukan.') };
    if (!row.commodity_id) return { success: true, skipped: true };
    let meta = {};
    try {
      if (row.notes && row.notes.trim().startsWith('{')) meta = JSON.parse(row.notes);
      else if (row.notes) meta.notes = row.notes;
    } catch (e) {}
    if (meta.stockReserved && !meta.stockRestored) return { success: true, already: true };
    const ton = Number(row.counter_ton || row.requested_ton) || 0;
    const dec = await decrementCommodityStock(row.commodity_id, ton);
    if (!dec.success) return dec;
    meta.stockReserved = true;
    meta.stockRestored = false;
    meta.reservedTon = ton;
    const { data: updatedOffer, error: metadataError } = await supabase
      .from('offers')
      .update({ notes: JSON.stringify(meta) })
      .eq('id', offerId)
      .select('id')
      .maybeSingle();
    if (metadataError || !updatedOffer) {
      const restored = await restoreCommodityStock(row.commodity_id, ton);
      if (!restored.success) {
        throw new Error(`Penanda reservasi stok gagal disimpan dan stok tidak berhasil dipulihkan. ${restored.error?.message || ''}`.trim());
      }
      return {
        success: false,
        error: metadataError || new Error('Penanda reservasi stok tidak tersimpan. Stok sudah dikembalikan.')
      };
    }
    return { success: true, error: null };
  } catch (err) {
    console.warn('[dealService] ensureStockReserved error:', err);
    return { success: false, error: err };
  }
};

/**
 * Pastikan stok kembali untuk satu offer (idempoten — aman dipanggil berulang
 * dari jalur cancel/reject/kedaluwarsa mana pun).
 */
export const ensureStockRestored = async (offerId) => {
  try {
    const { data: row, error: readError } = await supabase
      .from('offers')
      .select('id, commodity_id, requested_ton, counter_ton, status, notes')
      .eq('id', offerId)
      .maybeSingle();
    if (readError) throw readError;
    if (!row) return { success: true, skipped: true, reason: 'no-offer' };
    if (!row.commodity_id) return { success: true, skipped: true };
    let meta = {};
    try {
      if (row.notes && row.notes.trim().startsWith('{')) meta = JSON.parse(row.notes);
    } catch (e) {}
    if (meta.stockRestored) return { success: true, already: true };
    const wasAccepted = ['Disetujui', 'Diterima'].includes(row.status);
    // Kembalikan hanya bila stok pernah dikunci: flag ada, atau baris lama
    // yang sudah accepted (di era sebelum flag, accept selalu mengurangi).
    if (!meta.stockReserved && !wasAccepted) return { success: true, skipped: true, reason: 'never-reserved' };
    const ton = Number(meta.reservedTon) || Number(row.counter_ton || row.requested_ton) || 0;
    const res = await restoreCommodityStock(row.commodity_id, ton);
    if (!res.success) return res;
    meta.stockRestored = true;
    await supabase.from('offers').update({ notes: JSON.stringify(meta) }).eq('id', offerId);
    return { success: true, error: null };
  } catch (err) {
    console.warn('[dealService] ensureStockRestored error:', err);
    return { success: false, error: err };
  }
};

/**
 * Tandai offer terkait kontrak menjadi Dibatalkan (sinkron status dua arah
 * saat transaksi dibatalkan dari halaman Pembayaran).
 */
export const markOfferCancelledByContract = async (contractId) => {
  try {
    if (!contractId) return { success: true, skipped: true };
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, offer_id')
      .eq('id', contractId)
      .maybeSingle();
    if (!contract?.offer_id) return { success: true, skipped: true, reason: 'no-offer' };
    const { error } = await supabase
      .from('offers')
      .update({ status: 'Dibatalkan', updated_at: new Date().toISOString() })
      .eq('id', contract.offer_id);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.warn('[dealService] markOfferCancelledByContract error:', err);
    return { success: false, error: err };
  }
};

/**
 * Kembalikan stok berdasarkan kode transaksi (lewat offer terkait kontrak).
 * Idempoten via flag di offer; tanpa link offer -> jalur langsung lawas.
 * Dipakai saat transaksi dibatalkan/kedaluwarsa.
 */
export const restoreStockForTransaction = async (transactionCode) => {
  try {
    if (!transactionCode) return { success: true, skipped: true };
    const { data: trx, error: trxError } = await supabase
      .from('transactions')
      .select('id, contract_id, status')
      .eq('transaction_code', transactionCode)
      .maybeSingle();
    if (trxError) throw trxError;
    if (!trx?.contract_id) return { success: true, skipped: true, reason: 'no-contract' };
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, offer_id, commodity_id, tonnage')
      .eq('id', trx.contract_id)
      .maybeSingle();
    if (contractError) throw contractError;
    if (contract?.offer_id) {
      return await ensureStockRestored(contract.offer_id);
    }
    if (!contract?.commodity_id) return { success: true, skipped: true, reason: 'no-commodity' };
    return await restoreCommodityStock(contract.commodity_id, contract.tonnage);
  } catch (err) {
    console.warn('[dealService] restoreStockForTransaction error:', err);
    return { success: false, error: err };
  }
};

// ==========================================
// 2. CONTRACTS (BINDING AGREEMENTS)
// ==========================================

export const mapRowToContract = (row) => {
  const ton = Number(row.tonnage) || 1;
  const price = Number(row.price_per_kg) || 0;
  const val = Number(row.total_value) || ton * 1000 * price;
  const fee = Number(row.booking_fee) || val * 0.05;

  const farmerProfile = row.farmer || null;
  const buyerProfile = row.buyer || null;

  const resolvedFarmerName = farmerProfile?.full_name || row.farmer_group || 'Kelompok Tani';
  const resolvedFarmerAvatar = farmerProfile?.avatar_url || DEFAULT_AVATAR;
  const resolvedBuyerName = buyerProfile?.full_name || row.buyer_company || 'Perusahaan Mitra';
  const resolvedBuyerAvatar = buyerProfile?.avatar_url || DEFAULT_AVATAR;

  return {
    id: row.id,
    contractCode: row.contract_code,
    offerId: row.offer_id,
    commodityId: row.commodity_id,
    productName: row.commodity_name,
    commodityName: row.commodity_name,
    buyerId: row.buyer_id,
    farmerId: row.farmer_id,
    farmerName: resolvedFarmerName,
    farmerGroup: resolvedFarmerName,
    farmerAvatar: resolvedFarmerAvatar,
    buyerName: resolvedBuyerName,
    buyerCompany: resolvedBuyerName,
    buyerAvatar: resolvedBuyerAvatar,
    tonnage: ton,
    pricePerKg: price,
    totalValue: val,
    bookingFee: fee,
    bookingFeeStatus: row.booking_fee_status || 'Terkunci di Penjamin Platform (Escrow)',
    signedDate: row.signed_date ? new Date(row.signed_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hari Ini',
    pickupSchedule: row.pickup_schedule || '7 Hari ke Depan',
    pickupLocation: row.pickup_location || 'Minahasa',
    picWarehouse: row.pic_warehouse || 'Pengurus Lapangan Poktan Setempat',
    paymentMethod: row.payment_method || 'Pelunasan Transfer 95% saat Timbang Muat',
    status: row.status || 'Berjalan',
    timeline: Array.isArray(row.timeline) && row.timeline.length > 0 ? row.timeline : [
      { label: 'Penawaran Disepakati Pihak Poktan', date: 'Hari Ini', completed: true },
      { label: 'Binding Agreement Diterbitkan Sistem', date: 'Hari Ini', completed: true },
      { label: 'Booking Fee 5% Terverifikasi di Platform', date: 'Terkunci Aman di Escrow', completed: true },
      { label: 'Kedatangan Armada Muat Mandiri', date: 'Dijadwalkan', completed: false },
      { label: 'Uji Kadar Air, Timbang & Pelunasan', date: 'Estimasi Timbang', completed: false }
    ],
    clauses: Array.isArray(row.clauses) && row.clauses.length > 0 ? row.clauses : [
      'Poktan menjamin mutu hasil panen sesuai standar spesifikasi yang disepakati.',
      'Pembeli bertanggung jawab menyediakan armada muat mandiri.',
      'Pelunasan 95% dilakukan saat verifikasi timbang di lokasi gudang penyerahan.'
    ],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const fetchContractsFromSupabase = async (options = {}) => {
  const { farmerId = null, buyerId = null, status = null } = options;
  try {
    let query = supabase
      .from('contracts')
      .select('*, farmer:profiles!contracts_farmer_id_fkey(id, full_name, avatar_url, role), buyer:profiles!contracts_buyer_id_fkey(id, full_name, avatar_url, role)');

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }
    if (buyerId) {
      query = query.eq('buyer_id', buyerId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    let { data, error } = await query;
    if (error) {
      console.warn('[dealService] Join fetch contracts notice, fallback to flat query:', error.message);
      let fallbackQuery = supabase.from('contracts').select('*');
      if (farmerId) fallbackQuery = fallbackQuery.eq('farmer_id', farmerId);
      if (buyerId) fallbackQuery = fallbackQuery.eq('buyer_id', buyerId);
      if (status) fallbackQuery = fallbackQuery.eq('status', status);
      fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
      const fallbackRes = await fallbackQuery;
      if (fallbackRes.error) {
        return { data: [], error: fallbackRes.error.message };
      }
      data = fallbackRes.data || [];
    }

    // Batch resolve missing farmer profiles
    const farmerIdsToFetch = Array.from(new Set(
      (data || [])
        .filter(c => c.farmer_id && (!c.farmer || !c.farmer.full_name))
        .map(c => c.farmer_id)
    ));

    if (farmerIdsToFetch.length > 0) {
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, role, avatar_url')
          .in('id', farmerIdsToFetch);

        if (profs && profs.length > 0) {
          const profMap = new Map(profs.map(p => [p.id, p]));
          data = data.map(c => {
            if (c.farmer_id && profMap.has(c.farmer_id)) {
              return { ...c, farmer: { ...(c.farmer || {}), ...profMap.get(c.farmer_id) } };
            }
            return c;
          });
        }
      } catch (errProf) {
        console.warn('[dealService] Error batch fetching contract farmer profiles:', errProf);
      }
    }

    return { data: (data || []).map(mapRowToContract), error: null };
  } catch (err) {
    console.warn('[dealService] Exception fetching contracts:', err);
    return { data: [], error: err.message };
  }
};

export const createContractInSupabase = async (contractData) => {
  try {
    const ton = Number(contractData.tonnage) || 1;
    const price = Number(contractData.pricePerKg) || 0;
    const val = Number(contractData.totalValue) || (ton * 1000 * price);
    const fee = Number(contractData.bookingFee) || (val * 0.05);

    // CATATAN: tabel live TIDAK punya kolom farmer_group/buyer_company
    // (nama dibaca via buyer_id/farmer_id). Jangan tambahkan lagi.
    const newRow = {
      contract_code: contractData.contractCode || `AC-AGR/${new Date().getFullYear()}/IX/${Date.now().toString().slice(-4)}`,
      offer_id: contractData.offerId || null,
      commodity_id: contractData.commodityId || null,
      commodity_name: contractData.productName || contractData.commodityName || 'Komoditas',
      buyer_id: contractData.buyerId || null,
      farmer_id: contractData.farmerId || null,
      tonnage: ton,
      price_per_kg: price,
      total_value: val,
      booking_fee: fee,
      booking_fee_status: 'Terkunci di Penjamin Platform (Escrow)',
      pickup_schedule: contractData.pickupSchedule || '7 Hari ke Depan',
      pickup_location: contractData.pickupLocation || 'Minahasa',
      pic_warehouse: contractData.picWarehouse || 'Pengurus Lapangan Poktan Setempat',
      payment_method: contractData.paymentMethod || 'Pembayaran Langsung',
      status: 'Terikat'
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert([newRow])
      .select()
      .single();

    if (error) throw error;
    const mappedContract = mapRowToContract(data);

    // Trigger notification to Buyer and Farmer
    notifyOrderCreated({
      buyerId: contractData.buyerId,
      farmerId: contractData.farmerId,
      commodityName: contractData.productName || contractData.commodityName || 'Komoditas',
      requestedKg: ton * 1000,
      orderId: mappedContract.id
    }).catch(e => console.warn('[dealService] Contract notification error:', e));

    return { data: mappedContract, error: null };
  } catch (err) {
    console.warn('[dealService] Error creating contract:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Buat baris transaksi saat deal disepakati (masuk halaman Transaksi petani
 * dan Pembayaran pembeli). Status awal 'DP Terkunci'.
 */
export const createTransactionInSupabase = async (trxData) => {
  try {
    const ton = Number(trxData.volumeTon || trxData.tonnage) || 1;
    const amt = Number(trxData.amount || trxData.totalValue) || 0;

    // Pastikan paymentMethod selalu tersimpan di notes JSON
    let notesVal = trxData.notes;
    const targetPayMethod = trxData.paymentMethod || trxData.method || null;
    if (targetPayMethod) {
      let parsed = {};
      if (typeof notesVal === 'string' && notesVal.trim().startsWith('{')) {
        try { parsed = JSON.parse(notesVal); } catch (e) { parsed = { notes: notesVal }; }
      } else if (notesVal && typeof notesVal === 'object') {
        parsed = { ...notesVal };
      } else if (notesVal) {
        parsed = { notes: String(notesVal) };
      }
      parsed.paymentMethod = targetPayMethod;
      notesVal = JSON.stringify(parsed);
    }

    const newRow = {
      transaction_code: trxData.transactionCode || `TRX-${Date.now().toString().slice(-6)}`,
      contract_id: trxData.contractId || null,
      buyer_id: trxData.buyerId || null,
      farmer_id: trxData.farmerId || null,
      commodity_name: trxData.commodityName || trxData.productName || 'Komoditas',
      volume_ton: ton,
      category: trxData.category || 'Perkebunan',
      amount: amt,
      booking_fee: Number(trxData.bookingFee) || amt * 0.05,
      status: trxData.status || 'Berjalan',
      goods_status: trxData.goodsStatus || 'belum_diterima',
      pickup_schedule: trxData.pickupSchedule || 'Minahasa',
      notes: notesVal
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([newRow])
      .select()
      .single();

    if (error) throw error;
    return { data: mapRowToTransaction(data), error: null };
  } catch (err) {
    console.warn('[dealService] Error creating transaction:', err);
    return { data: null, error: err.message || err };
  }
};

// ==========================================
// 3. TRANSACTIONS (RIWAYAT TRANSAKSI & ESCROW)
// ==========================================

export const mapRowToTransaction = (row) => {
  const ton = Number(row.volume_ton) || 1;
  const amt = Number(row.amount) || 0;
  const fee = Number(row.booking_fee) || amt * 0.05;

  const farmerProfile = row.farmer || null;
  const buyerProfile = row.buyer || null;

  const resolvedFarmerName = farmerProfile?.full_name || row.farmer_group || 'Kelompok Tani';
  const resolvedFarmerAvatar = farmerProfile?.avatar_url || DEFAULT_AVATAR;
  const resolvedBuyerName = buyerProfile?.full_name || row.buyer_name || 'Pembeli';
  const resolvedBuyerAvatar = buyerProfile?.avatar_url || DEFAULT_AVATAR;

  const resolvedGoodsStatus = row.goods_status || (row.status === 'Selesai' ? 'diterima' : 'belum_diterima');

  // Resolusi Payment Method yang akurat (notes JSON, relasi contract, atau fallback)
  let resolvedPaymentMethod = null;
  if (row.notes) {
    try {
      const parsedNotes = typeof row.notes === 'string' && row.notes.trim().startsWith('{')
        ? JSON.parse(row.notes)
        : (typeof row.notes === 'object' ? row.notes : null);
      if (parsedNotes?.paymentMethod) {
        resolvedPaymentMethod = parsedNotes.paymentMethod;
      }
    } catch (e) {}
  }
  if (!resolvedPaymentMethod && row.contract?.payment_method) {
    resolvedPaymentMethod = row.contract.payment_method;
  }
  if (!resolvedPaymentMethod && row.payment_method) {
    resolvedPaymentMethod = row.payment_method;
  }
  if (!resolvedPaymentMethod) {
    resolvedPaymentMethod = 'Pembayaran Langsung';
  }

  return {
    id: row.transaction_code || `TRX-${row.id.slice(0, 8).toUpperCase()}`,
    dbId: row.id,
    contractId: row.contract_id,
    buyerId: row.buyer_id,
    farmerId: row.farmer_id,
    farmerGroup: resolvedFarmerName,
    farmerName: resolvedFarmerName,
    farmerAvatar: resolvedFarmerAvatar,
    buyerName: resolvedBuyerName,
    buyerAvatar: resolvedBuyerAvatar,
    productName: row.commodity_name,
    commodityName: row.commodity_name,
    volumeTon: ton,
    category: row.category || 'Perkebunan',
    amount: amt,
    totalValue: amt,
    bookingFee: fee,
    status: row.status || 'Berjalan',
    goodsStatus: resolvedGoodsStatus,
    receivedAt: row.received_at || null,
    pickupSchedule: row.pickup_schedule || 'Minahasa',
    notes: row.notes || null,
    paymentMethod: resolvedPaymentMethod,
    method: resolvedPaymentMethod,
    contract: row.contract || null,
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hari Ini',
    createdAt: row.created_at
  };
};

export const fetchTransactionsFromSupabase = async (options = {}) => {
  const { farmerId = null, buyerId = null } = options;
  try {
    let query = supabase
      .from('transactions')
      .select('*, contract:contracts(id, payment_method), farmer:profiles!transactions_farmer_id_fkey(id, full_name, avatar_url, role), buyer:profiles!transactions_buyer_id_fkey(id, full_name, avatar_url, role)');

    if (farmerId) {
      query = query.eq('farmer_id', farmerId);
    }
    if (buyerId) {
      query = query.eq('buyer_id', buyerId);
    }

    query = query.order('created_at', { ascending: false });

    let { data, error } = await query;
    if (error) {
      console.warn('[dealService] Join fetch transactions notice, fallback to contract join query:', error.message);
      let fallbackQuery = supabase.from('transactions').select('*, contract:contracts(id, payment_method)');
      if (farmerId) fallbackQuery = fallbackQuery.eq('farmer_id', farmerId);
      if (buyerId) fallbackQuery = fallbackQuery.eq('buyer_id', buyerId);
      fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
      const fallbackRes = await fallbackQuery;
      if (fallbackRes.error) {
        return { data: [], error: fallbackRes.error.message };
      }
      data = fallbackRes.data || [];
    }

    // Batch resolve missing farmer profiles agar selalu sinkron 100% dengan profiles
    const farmerIdsToFetch = Array.from(new Set(
      (data || [])
        .filter(t => t.farmer_id && (!t.farmer || !t.farmer.full_name))
        .map(t => t.farmer_id)
    ));

    if (farmerIdsToFetch.length > 0) {
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, role, avatar_url')
          .in('id', farmerIdsToFetch);

        if (profs && profs.length > 0) {
          const profMap = new Map(profs.map(p => [p.id, p]));
          data = data.map(t => {
            if (t.farmer_id && profMap.has(t.farmer_id)) {
              return { ...t, farmer: { ...(t.farmer || {}), ...profMap.get(t.farmer_id) } };
            }
            return t;
          });
        }
      } catch (errProf) {
        console.warn('[dealService] Error batch fetching farmer profiles:', errProf);
      }
    }

    return { data: (data || []).map(mapRowToTransaction), error: null };
  } catch (err) {
    console.warn('[dealService] Exception fetching transactions:', err);
    return { data: [], error: err.message };
  }
};

// ==========================================
// 4. REALTIME SUBSCRIPTIONS
// ==========================================

export const subscribeOffers = (callback) => {
  try {
    const channelName = `realtime_offers_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, payload => {
        if (callback) callback(payload);
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('[dealService] Error removing offers channel:', e);
      }
    };
  } catch (err) {
    console.warn('[dealService] subscribeOffers error:', err);
    return () => {};
  }
};

export const subscribeContracts = (callback) => {
  try {
    const channelName = `realtime_contracts_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, payload => {
        if (callback) callback(payload);
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('[dealService] Error removing contracts channel:', e);
      }
    };
  } catch (err) {
    console.warn('[dealService] subscribeContracts error:', err);
    return () => {};
  }
};

export const subscribeTransactions = (callback) => {
  try {
    const channelName = `realtime_transactions_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
        if (callback) callback(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
        if (callback) callback(payload);
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('[dealService] Error removing transactions channel:', e);
      }
    };
  } catch (err) {
    console.warn('[dealService] subscribeTransactions error:', err);
    return () => {};
  }
};

/**
 * Perbarui status barang oleh pembeli ('belum_diterima' vs 'diterima').
 * Sesuai aturan bisnis:
 * - 'belum_diterima' -> status transaksi tetap 'Berjalan'
 * - 'diterima'       -> status transaksi menjadi 'Selesai' dengan catatan received_at
 */
export const updateGoodsStatusInSupabase = async (trxId, goodsStatus) => {
  try {
    if (!trxId) return { success: false, error: 'ID Transaksi wajib diisi' };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trxId);
    const isReceived = goodsStatus === 'diterima';
    const nowIso = new Date().toISOString();

    const updatePayload = {
      goods_status: isReceived ? 'diterima' : 'belum_diterima',
      status: isReceived ? 'Selesai' : 'Berjalan',
      received_at: isReceived ? nowIso : null
    };

    let q = supabase.from('transactions').update(updatePayload);
    if (isUuid) q = q.eq('id', trxId);
    else q = q.eq('transaction_code', trxId);

    const { error } = await q;
    if (error) {
      // Fallback jika kolom goods_status belum dimigrasi di Supabase
      console.warn('[dealService] Fallback update without goods_status column:', error.message);
      let fallbackQ = supabase.from('transactions').update({ status: isReceived ? 'Selesai' : 'Berjalan' });
      if (isUuid) fallbackQ = fallbackQ.eq('id', trxId);
      else fallbackQ = fallbackQ.eq('transaction_code', trxId);
      const fallbackRes = await fallbackQ;
      if (fallbackRes.error) throw fallbackRes.error;
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn('[dealService] Error updateGoodsStatusInSupabase:', err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Konfirmasi penerimaan barang oleh pembeli.
 * Mengubah status transaksi menjadi 'Selesai', goods_status menjadi 'diterima',
 * dan mencatat timestamp received_at di Supabase.
 */
export const confirmGoodsReceivedInSupabase = async (trxId) => {
  return await updateGoodsStatusInSupabase(trxId, 'diterima');
};

