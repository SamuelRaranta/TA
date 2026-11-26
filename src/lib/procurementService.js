import { supabase } from './supabaseClient';
import { 
  notifyProposalSubmitted, 
  notifyProposalApproved, 
  notifyProposalRejected 
} from './notificationService';

// Helper to get active user ID — hanya jika role=pembeli (cegah baca ID petani/admin).
export const getCurrentBuyerId = () => {
  try {
    const roleStored = localStorage.getItem('agriconnect_auth_user_pembeli');
    const genericStored = localStorage.getItem('agriconnect_auth_user');
    const parsed = roleStored ? JSON.parse(roleStored) : (genericStored ? JSON.parse(genericStored) : null);
    if (parsed?.id && (!parsed?.role || String(parsed.role).toLowerCase() === 'pembeli')) return parsed.id;
  } catch (err) {
    console.warn('[procurementService] Error reading auth user:', err);
  }
  return null;
};

// Map Supabase DB row (snake_case) to Frontend Object (camelCase)
export const mapRowToProposal = (row) => {
  const requestedVal = Number(row.requested_kg) || 0;
  const priceVal = Number(row.offered_price_per_kg) || 0;
  const totalBudgetVal = Number(row.total_budget) || (requestedVal * priceVal);
  const img = row.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80';
  const rawSpecs = row.specifications || '';
  const matchMethod = rawSpecs.match(/\[Metode Pembayaran:\s*([^\]]+)\]/i);
  const paymentMethod = row.payment_method || (matchMethod ? matchMethod[1].trim() : 'Transfer Bank (Escrow)');
  const cleanSpecs = rawSpecs.replace(/\[Metode Pembayaran:\s*[^\]]+\]\s*/gi, '').trim();

  const buyerProfile = row.buyer || null;
  const resolvedBuyerName = buyerProfile?.full_name || (row.buyer_name && !row.buyer_name.includes('PT Royal Agro') ? row.buyer_name : 'ikon');

  return {
    id: row.code || row.id,
    dbId: row.id,
    commodityName: row.commodity_name,
    category: row.category || 'Hortikultura & Sayur',
    buyerId: row.buyer_id,
    buyerName: resolvedBuyerName,
    buyer: buyerProfile,
    buyerPic: row.buyer_pic || 'PIC Pengadaan',
    commodityImage: row.image_url || img,
    image: img,
    imageUrl: img,
    status: row.status || 'Menunggu Persetujuan',
    statusDetail: row.status_detail || (row.status === 'Aktif' ? 'Diterima & Dipublikasikan ke Petani' : row.status === 'Tidak Aktif' ? 'Ditolak' : 'Menunggu Persetujuan Admin'),
    requestedKg: requestedVal,
    requestedTon: requestedVal / 1000,
    offeredPricePerKg: priceVal,
    totalBudget: totalBudgetVal,
    target: row.target || 'Semua Petani',
    location: row.location || 'Minahasa',
    createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hari Ini',
    validUntil: row.valid_until ? new Date(row.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 September 2026',
    rawValidUntil: row.valid_until,
    specifications: cleanSpecs,
    paymentMethod: paymentMethod,
    rejectionReason: row.rejection_reason || null
  };
};

// Map Procurement Proposal to Offer Item for Farmer "Cari Penawaran" view and Buyer "Lihat Penawaran" view
export const mapProposalToOfferItem = (proposal) => {
  const reqKg = Number(proposal.requestedKg) || (Number(proposal.requestedTon) ? Number(proposal.requestedTon) * 1000 : 1000);
  const reqTon = reqKg >= 1000 ? reqKg / 1000 : reqKg / 1000;
  const price = Number(proposal.offeredPricePerKg) || 0;
  const totalBudgetVal = Number(proposal.totalBudget) || (reqKg * price);
  const rawSpecs = proposal.specifications || '';
  const matchMethod = rawSpecs.match(/\[Metode Pembayaran:\s*([^\]]+)\]/i);
  const paymentMethod = proposal.paymentMethod || proposal.payment_method || (matchMethod ? matchMethod[1].trim() : 'Transfer Bank (Escrow)');
  const cleanSpecs = rawSpecs.replace(/\[Metode Pembayaran:\s*[^\]]+\]\s*/gi, '').trim();

  const buyerName = proposal.buyer?.full_name || (proposal.buyerName && !proposal.buyerName.includes('PT Royal Agro') ? proposal.buyerName : 'ikon');

  return {
    id: proposal.id || `PRP-${Date.now().toString().slice(-4)}`,
    code: proposal.code || proposal.id,
    buyerId: proposal.buyerId || null,
    proposalDbId: proposal.dbId || null,
    proposalCode: proposal.code || proposal.id,
    // ID proposal adalah baris procurement_proposals, bukan komoditas petani.
    commodityId: null,
    commodityName: proposal.commodityName,
    category: proposal.category || 'Hortikultura & Sayur',
    farmerGroup: proposal.target || 'Semua Petani',
    farmerLeader: proposal.buyerPic || 'PIC Pengadaan',
    buyerName: buyerName,
    buyer: proposal.buyer,
    buyerPic: proposal.buyerPic || 'PIC Pengadaan',
    location: proposal.location || 'Minahasa',
    requestedTon: reqTon,
    requestedKg: reqKg,
    offeredPricePerKg: price,
    listingPricePerKg: price,
    totalBudget: totalBudgetVal,
    target: proposal.target || 'Semua Petani',
    validUntil: proposal.validUntil || '30 Sep 2026',
    commodityImage: proposal.commodityImage || proposal.image || proposal.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    image: proposal.image || proposal.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    imageUrl: proposal.image || proposal.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    notes: cleanSpecs || `Kebutuhan pengadaan ${proposal.commodityName} dari ${proposal.buyerName || 'Pembeli'}. Batas waktu: ${proposal.validUntil}.`,
    specifications: cleanSpecs,
    paymentMethod: paymentMethod,
    submittedDate: proposal.createdAt || 'Hari Ini',
    createdAt: proposal.createdAt || 'Hari Ini',
    status: proposal.status || 'Aktif',
    proposalStatus: proposal.status || 'Aktif',
    statusDetail: proposal.statusDetail || (proposal.status === 'Aktif' ? 'Diterima & Dipublikasikan ke Petani' : 'Menunggu Persetujuan Admin')
  };
};

// Map Frontend Object to Supabase DB row
export const mapProposalToRow = (item, explicitBuyerId = null) => {
  const buyerId = explicitBuyerId || item.buyerId || getCurrentBuyerId();
  const requestedKg = Math.max(1, Number(item.requestedKg) || 1000);
  const pricePerKg = Math.max(100, Number(item.offeredPricePerKg) || 1000);
  const totalBudget = requestedKg * pricePerKg;
  const rawSpecs = item.specifications || '';
  const cleanSpecs = rawSpecs.replace(/\[Metode Pembayaran:\s*[^\]]+\]\s*/gi, '').trim();
  const paymentMethod = item.paymentMethod || 'Transfer Bank (Escrow)';
  const specsWithMethod = `[Metode Pembayaran: ${paymentMethod}] ${cleanSpecs}`.trim();

  return {
    code: item.id || `PRP-2026-${Date.now().toString().slice(-4)}`,
    buyer_id: buyerId,
    buyer_name: item.buyerName || 'Pembeli Mitra',
    buyer_pic: item.buyerPic || 'Hendra Pratama, S.T.',
    commodity_name: item.commodityName,
    category: item.category || 'Hortikultura & Sayur',
    image_url: item.image || item.imageUrl || '',
    status: item.status || 'Menunggu Persetujuan',
    status_detail: item.statusDetail || 'Menunggu Persetujuan Admin',
    requested_kg: requestedKg,
    offered_price_per_kg: pricePerKg,
    total_budget: totalBudget,
    target: item.target || 'Semua Petani',
    location: item.location || 'Minahasa',
    payment_method: paymentMethod,
    specifications: specsWithMethod,
    valid_until: item.rawValidUntil || item.validUntil || '2026-10-30',
    rejection_reason: item.rejectionReason || null
  };
};

/**
 * Fetch procurement proposals (optionally filtered by buyerId or statusFilter)
 * 100% Real Supabase data without mock fallbacks
 */
export const fetchProcurementProposalsFromSupabase = async (options = {}) => {
  const { buyerId = null, statusFilter = null, orderBy = 'created_at', ascending = false } = options;
  try {
    let query = supabase.from('procurement_proposals').select('*, buyer:profiles(id, full_name)');

    if (buyerId) {
      // ISOLASI KETAT: hanya milik buyer ini. Tanpa or-seed / is.null (itu bocor antar user).
      query = query.eq('buyer_id', buyerId);
    }

    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        query = query.in('status', statusFilter);
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    query = query.order(orderBy, { ascending });

    const { data, error } = await query;

    if (error) {
      console.warn('[procurementService] Supabase fetch notice:', error.message);
      return { data: [], isSupabase: false, error: error.message };
    }

    if (data && data.length > 0) {
      return {
        data: data.map(mapRowToProposal),
        isSupabase: true,
        error: null
      };
    }

    // TANPA fallback ke semua proposal: user baru dengan 0 baris harus dapat [] (kosong),
    // bukan data milik buyer lain (itu bug stale/wrong-user).
    return { data: [], isSupabase: true, error: null };
  } catch (err) {
    console.warn('[procurementService] Failed to load proposals from Supabase:', err);
    return { data: [], isSupabase: false, error: err.message };
  }
};

/**
 * Fetch only active procurement proposals (for Farmer "Cari Penawaran" view)
 * 100% Real Supabase data without mock fallbacks
 */
export const fetchActiveProcurementProposalsFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('procurement_proposals')
      .select('*, buyer:profiles(id, full_name)')
      .eq('status', 'Aktif')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[procurementService] Supabase fetch active notice:', error.message);
      return { data: [], isSupabase: false, error: error.message };
    }

    if (data && data.length > 0) {
      return {
        data: data.map(mapRowToProposal),
        isSupabase: true,
        error: null
      };
    }

    return { data: [], isSupabase: true, error: null };
  } catch (err) {
    console.warn('[procurementService] Failed to load active proposals:', err);
    return { data: [], isSupabase: false, error: err.message };
  }
};

/**
 * Create a new procurement proposal from Buyer
 */
export const createProcurementProposalInSupabase = async (proposalData, explicitBuyerId = null) => {
  try {
    const targetBuyerId = explicitBuyerId || proposalData.buyerId || getCurrentBuyerId();
    let row = mapProposalToRow(proposalData, targetBuyerId);
    let { data, error } = await supabase
      .from('procurement_proposals')
      .insert([row])
      .select()
      .single();

    // Fallback gracefully jika kolom payment_method belum dieksekusi di database Supabase
    if (error && (error.code === '42703' || String(error.message).includes('payment_method'))) {
      const fallbackRow = { ...row };
      delete fallbackRow.payment_method;
      const retry = await supabase
        .from('procurement_proposals')
        .insert([fallbackRow])
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('[procurementService] Insert notice:', error.message);
      return { data: proposalData, isSupabase: false, error };
    }

    const createdProposal = mapRowToProposal(data);

    // Trigger Notification: Proposal Baru Menunggu Persetujuan ke Admin
    notifyProposalSubmitted({
      proposalId: createdProposal.id,
      commodityName: createdProposal.commodityName
    }).catch(e => console.warn('Notification proposal error:', e));

    return { data: createdProposal, isSupabase: true, error: null };
  } catch (err) {
    console.warn('[procurementService] Create proposal error:', err);
    return { data: proposalData, isSupabase: false, error: err };
  }
};

/**
 * Resolve code-or-UUID ke filter query (id frontend = code DB, dbId = UUID).
 * Return { column, value }.
 */
export const resolveProposalKey = (itemOrId) => {
  const raw = typeof itemOrId === 'string' ? itemOrId : (itemOrId?.dbId || itemOrId?.id);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw || '');
  return isUuid ? { column: 'id', value: raw } : { column: 'code', value: raw };
};

/**
 * Update procurement proposal status (Diterima -> 'Aktif' | Ditolak/Batal -> 'Tidak Aktif'
 * | Disetujui petani -> 'Disetujui', butuh SQL supabase_deal_flow_status.sql).
 */
export const updateProcurementStatusInSupabase = async (id, newStatus, reason = null, statusDetailOverride = null) => {
  try {
    // Detail status yang benar: batal oleh pembeli != ditolak admin != disetujui petani.
    const lowerReason = String(reason || '').toLowerCase();
    const isBuyerCancel = lowerReason.includes('batal') || lowerReason.includes('pembeli');
    const statusDetail = statusDetailOverride
      || (newStatus === 'Aktif'
        ? 'Diterima & Dipublikasikan ke Petani'
        : newStatus === 'Disetujui'
          ? 'Disetujui Petani, Menunggu Kontrak Binding'
          : isBuyerCancel
            ? 'Dibatalkan Pembeli'
            : 'Ditolak oleh Admin');

    const { column, value } = resolveProposalKey(id);
    const { data, error } = await supabase
      .from('procurement_proposals')
      .update({
        status: newStatus,
        status_detail: statusDetail,
        rejection_reason: reason
      })
      .eq(column, value)
      .select();

    if (error) {
      console.warn('[procurementService] Update status notice:', error.message);
      return { success: false, error };
    }

    if (!data || data.length === 0) {
      // Baris tidak ditemukan (mis. id lokal yang insert-nya gagal) — laporkan agar UI tidak diam.
      return { success: false, error: new Error('Data tidak ditemukan di database. Muat ulang lalu coba lagi.') };
    }

    if (data && data.length > 0) {
      const p = data[0];
      if (newStatus === 'Aktif' || newStatus === 'Disetujui') {
        notifyProposalApproved({
          buyerId: p.buyer_id,
          commodityName: p.commodity_name,
          proposalId: p.id
        }).catch(e => console.warn('Notification proposal approved error:', e));
      } else if (newStatus === 'Tidak Aktif') {
        notifyProposalRejected({
          buyerId: p.buyer_id,
          commodityName: p.commodity_name,
          proposalId: p.id
        }).catch(e => console.warn('Notification proposal rejected error:', e));
      }
    }

    return { success: true, data };
  } catch (err) {
    console.warn('[procurementService] Update status error:', err);
    return { success: false, error: err };
  }
};

/**
 * Update isi proposal (edit pembeli): nama, kategori, kebutuhan, harga, lokasi,
 * masa berlaku, spesifikasi, gambar. Return proposal termapping + dbId.
 */
export const updateProcurementInSupabase = async (itemOrId, fields) => {
  try {
    const requestedKg = Math.max(1, Number(fields.requestedKg) || 1);
    const pricePerKg = Math.max(100, Number(fields.offeredPricePerKg) || 0);
    const rawSpecs = fields.specifications !== undefined ? fields.specifications : '';
    const cleanSpecs = rawSpecs.replace(/\[Metode Pembayaran:\s*[^\]]+\]\s*/gi, '').trim();
    const paymentMethod = fields.paymentMethod;
    const finalSpecs = paymentMethod
      ? `[Metode Pembayaran: ${paymentMethod}] ${cleanSpecs}`.trim()
      : (fields.specifications !== undefined ? fields.specifications : undefined);

    const payload = {
      commodity_name: fields.commodityName,
      category: fields.category || 'Hortikultura & Sayur',
      requested_kg: requestedKg,
      offered_price_per_kg: pricePerKg,
      total_budget: requestedKg * pricePerKg,
      location: fields.location || 'Minahasa',
      valid_until: fields.rawValidUntil || fields.validUntil || '2026-10-30',
      specifications: finalSpecs,
      payment_method: paymentMethod,
      image_url: fields.image || fields.imageUrl || ''
    };
    // Buang undefined agar tidak menimpa dengan NULL.
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    const { column, value } = resolveProposalKey(itemOrId);
    let { data, error } = await supabase
      .from('procurement_proposals')
      .update(payload)
      .eq(column, value)
      .select()
      .single();

    // Fallback jika kolom payment_method belum dieksekusi di Supabase
    if (error && (error.code === '42703' || String(error.message).includes('payment_method'))) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.payment_method;
      const retry = await supabase
        .from('procurement_proposals')
        .update(fallbackPayload)
        .eq(column, value)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('[procurementService] Update proposal notice:', error.message);
      return { success: false, error };
    }

    return { success: true, data: mapRowToProposal(data), error: null };
  } catch (err) {
    console.warn('[procurementService] Update proposal error:', err);
    return { success: false, error: err };
  }
};

/**
 * Hapus permanen proposal (untuk item 'Tidak Aktif').
 */
export const deleteProcurementInSupabase = async (itemOrId) => {
  try {
    const { column, value } = resolveProposalKey(itemOrId);
    const { error } = await supabase
      .from('procurement_proposals')
      .delete()
      .eq(column, value);

    if (error) {
      console.warn('[procurementService] Delete proposal notice:', error.message);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn('[procurementService] Delete proposal error:', err);
    return { success: false, error: err };
  }
};

/**
 * Subscribe to realtime changes on procurement_proposals table
 */
export const subscribeProcurementProposals = (callback) => {
  try {
    const channelName = `realtime_procurement_proposals_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'procurement_proposals' },
        (payload) => {
          if (callback) callback(payload);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('[procurementService] Error removing channel:', e);
      }
    };
  } catch (err) {
    console.warn('[procurementService] Realtime subscription error:', err);
    return () => {};
  }
};
