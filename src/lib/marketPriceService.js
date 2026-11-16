import { supabase } from './supabaseClient';

// Helper to format date strings
const getTodayFormatted = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });
  const fullDateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\./g, ':') + ' WIB';

  return { dateStr, fullDateStr, timeStr };
};

// Map database row (snake_case) to frontend object (camelCase)
export const mapRowToItem = (row) => {
  return {
    id: row.id,
    commodity: row.commodity,
    category: row.category || 'Beras',
    marketPrice: Number(row.market_price) || 0,
    prevPrice: row.prev_price !== null && row.prev_price !== undefined ? Number(row.prev_price) : Number(row.market_price),
    unit: row.unit || 'kg',
    trend: row.trend || 'stable',
    changePercent: row.change_percent || '0,0%',
    source: row.source || 'Badan Pangan Nasional',
    region: row.region || 'Sulawesi Utara',
    status: row.status || 'Data terbaru',
    updatedAt: row.updated_at ? new Date(row.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '19 Sep 2026',
    updatedDate: row.updated_date || '19 September 2026',
    updatedTime: row.updated_time || '10:30 WIB',
    history7d: Array.isArray(row.history_7d) && row.history_7d.length > 0 ? row.history_7d : [],
    history30d: Array.isArray(row.history_30d) && row.history_30d.length > 0 ? row.history_30d : [],
    history90d: Array.isArray(row.history_90d) && row.history_90d.length > 0 ? row.history_90d : []
  };
};

// Map frontend object (camelCase) to database row (snake_case)
export const mapItemToRow = (item) => {
  const { dateStr, fullDateStr, timeStr } = getTodayFormatted();

  return {
    commodity: item.commodity,
    category: item.category || 'Beras',
    market_price: Number(item.marketPrice) || 0,
    prev_price: item.prevPrice !== undefined ? Number(item.prevPrice) : null,
    unit: item.unit || 'kg',
    trend: ['up', 'down', 'stable'].includes(item.trend) ? item.trend : 'stable',
    change_percent: String(item.changePercent || '0,0%'),
    source: item.source || 'Badan Pangan Nasional',
    region: item.region || 'Sulawesi Utara',
    status: item.status || 'Data terbaru',
    updated_at: new Date().toISOString(),
    updated_date: fullDateStr,
    updated_time: timeStr,
    history_7d: item.history7d || [],
    history_30d: item.history30d || [],
    history_90d: item.history90d || []
  };
};

/**
 * Fetch all market prices from Supabase.
 * Falls back to INITIAL_MARKET_PRICES if Supabase is offline or table is empty.
 */
export async function fetchMarketPricesFromSupabase(options = {}) {
  const { orderBy = 'updated_at', ascending = false } = options;
  try {
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .order(orderBy, { ascending });

    if (error) {
      console.warn('[Supabase] Error fetching market_prices:', error.message);
      return { data: [], isSupabase: false, error: error.message };
    }

    return { data: (data || []).map(mapRowToItem), isSupabase: true, error: null };
  } catch (err) {
    console.warn('[Supabase] Fetch market_prices exception:', err);
    return { data: [], isSupabase: false, error: err.message };
  }
}

/**
 * Update market price in Supabase and append to history tracking.
 */
export async function saveMarketPriceToSupabase(updatedItem) {
  try {
    const { dateStr, fullDateStr, timeStr } = getTodayFormatted();

    // Append new price point to history arrays
    const newPoint = {
      date: dateStr,
      fullDate: fullDateStr,
      price: Number(updatedItem.marketPrice)
    };

    // Update history arrays with new point
    const history7d = [...(updatedItem.history7d || [])];
    if (history7d.length > 0) {
      // Replace last point if date matches, otherwise append and trim to 7
      if (history7d[history7d.length - 1].date === dateStr) {
        history7d[history7d.length - 1] = newPoint;
      } else {
        history7d.push(newPoint);
        if (history7d.length > 7) history7d.shift();
      }
    } else {
      history7d.push(newPoint);
    }

    const history30d = [...(updatedItem.history30d || [])];
    if (history30d.length > 0) {
      if (history30d[history30d.length - 1].date === dateStr) {
        history30d[history30d.length - 1] = newPoint;
      } else {
        history30d.push(newPoint);
        if (history30d.length > 10) history30d.shift();
      }
    } else {
      history30d.push(newPoint);
    }

    const history90d = [...(updatedItem.history90d || [])];
    if (history90d.length > 0) {
      if (history90d[history90d.length - 1].date === dateStr) {
        history90d[history90d.length - 1] = newPoint;
      } else {
        history90d.push(newPoint);
        if (history90d.length > 10) history90d.shift();
      }
    } else {
      history90d.push(newPoint);
    }

    const payload = {
      commodity: updatedItem.commodity,
      category: updatedItem.category || 'Beras',
      market_price: Number(updatedItem.marketPrice),
      prev_price: Number(updatedItem.prevPrice),
      trend: ['up', 'down', 'stable'].includes(updatedItem.trend) ? updatedItem.trend : 'stable',
      change_percent: String(updatedItem.changePercent || '0,0%'),
      source: updatedItem.source,
      updated_at: new Date().toISOString(),
      updated_date: fullDateStr,
      updated_time: timeStr,
      history_7d: history7d,
      history_30d: history30d,
      history_90d: history90d
    };

    // 1. Update in market_prices table
    const { data: updatedData, error: updateError } = await supabase
      .from('market_prices')
      .update(payload)
      .eq('id', updatedItem.id)
      .select();

    if (updateError) {
      console.warn('[Supabase] Update market_prices error:', updateError.message);
    }

    // 2. Insert record into market_price_history table
    try {
      await supabase
        .from('market_price_history')
        .insert({
          market_price_id: updatedItem.id,
          price: Number(updatedItem.marketPrice),
          price_date: new Date().toISOString().split('T')[0],
          source: updatedItem.source,
          notes: 'Diperbarui oleh Admin'
        });
    } catch (histErr) {
      console.warn('[Supabase] Insert market_price_history error:', histErr);
    }

    return {
      ...updatedItem,
      ...payload,
      history7d,
      history30d,
      history90d,
      updatedAt: 'Baru saja diperbarui',
      updatedDate: fullDateStr,
      updatedTime: timeStr
    };
  } catch (err) {
    console.warn('[Supabase] saveMarketPriceToSupabase exception:', err);
    return updatedItem;
  }
}

/**
 * Create a new commodity acuan in Supabase.
 */
export async function createMarketPriceInSupabase(newItem) {
  try {
    const rowPayload = mapItemToRow(newItem);

    const { data, error } = await supabase
      .from('market_prices')
      .insert(rowPayload)
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Create market_prices error:', error.message);
      return newItem;
    }

    const createdItem = mapRowToItem(data);

    // Insert initial point to market_price_history
    try {
      await supabase
        .from('market_price_history')
        .insert({
          market_price_id: createdItem.id,
          price: Number(createdItem.marketPrice),
          price_date: new Date().toISOString().split('T')[0],
          source: createdItem.source,
          notes: 'Komoditas baru ditambahkan oleh Admin'
        });
    } catch (histErr) {
      console.warn('[Supabase] Insert initial history error:', histErr);
    }

    return createdItem;
  } catch (err) {
    console.warn('[Supabase] createMarketPriceInSupabase exception:', err);
    return newItem;
  }
}

/**
 * Delete a commodity acuan from Supabase.
 */
export async function deleteMarketPriceFromSupabase(id) {
  try {
    const { error } = await supabase
      .from('market_prices')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[Supabase] Delete market_prices error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] deleteMarketPriceFromSupabase exception:', err);
    return false;
  }
}

/**
 * Set up real-time subscription for market prices.
 */
export function subscribeMarketPrices(onDataChanged) {
  try {
    const channelName = `realtime_market_prices_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_prices' },
        (payload) => {
          console.log('[Supabase Realtime] market_prices changed:', payload.eventType);
          if (onDataChanged) onDataChanged(payload);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('[Supabase] Error removing market prices channel:', e);
      }
    };
  } catch (err) {
    console.warn('[Supabase] subscribeMarketPrices error:', err);
    return () => {};
  }
}
