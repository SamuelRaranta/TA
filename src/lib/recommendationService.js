/**
 * ==============================================================================
 * SISTEM REKOMENDASI / SMART MATCHING - TANINIAGA
 * Metode: Content-Based Filtering dengan Weighted Scoring
 * 
 * Deskripsi:
 * Content-Based Filtering digunakan untuk memberikan rekomendasi berdasarkan
 * kesesuaian antara kebutuhan pengadaan pembeli dengan karakteristik komoditas petani.
 * Skor kesesuaian dihitung secara langsung menggunakan Weighted Scoring dengan
 * empat atribut berbobot:
 * 1. Komoditas (K) = 50% (0.50)
 * 2. Stok (S)      = 15% (0.15)
 * 3. Harga (H)     = 20% (0.20)
 * 4. Rating (R)    = 15% (0.15)
 * Total Bobot      = 100% (1.0)
 * 
 * Threshold Rekomendasi:
 * Hanya komoditas dengan ScorePercentage > 50% yang ditampilkan sebagai rekomendasi.
 * Komoditas dengan skor <= 50% otomatis dibuang dari daftar rekomendasi.
 * ==============================================================================
 */

export const RECOMMENDATION_WEIGHTS = {
  commodity: 0.50, // 50%
  stock: 0.15,     // 15%
  price: 0.20,     // 20%
  rating: 0.15     // 15%
};

export const MIN_RECOMMENDATION_SCORE = 50; // Threshold > 50%

/**
 * 1. Normalisasi Komoditas (K)
 * Menguji kecocokan komoditas secara langsung (case-insensitive).
 * - K = 1 jika nama komoditas sesuai / pembeli tidak menentukan nama
 * - K = 0 jika nama komoditas berbeda
 * 
 * @param {string} farmerCommodityName - Nama komoditas pada data petani
 * @param {string} buyerCommodityName - Nama komoditas yang dicari pembeli
 * @returns {number} 1 atau 0
 */
export function normalizeCommodity(farmerCommodityName = '', buyerCommodityName = '') {
  const target = (buyerCommodityName || '').trim().toLowerCase();
  if (!target) {
    // Jika pembeli tidak mengisi filter nama komoditas, netral (K = 1)
    return 1;
  }

  const candidate = (farmerCommodityName || '').trim().toLowerCase();
  if (!candidate) {
    return 0;
  }

  // Kecocokan langsung (case-insensitive)
  if (candidate.includes(target) || target.includes(candidate)) {
    return 1;
  }

  return 0;
}

/**
 * 2. Normalisasi Stok (N_stok)
 * Formula: N_stok = min(stok_petani / stok_dibutuhkan, 1)
 * Rentang nilai: 0 sampai 1.
 * Semakin memenuhi kebutuhan stok pembeli, semakin tinggi nilainya.
 * 
 * @param {number} farmerStock - Stok yang dimiliki petani (Ton)
 * @param {number|string} buyerMinStock - Minimal stok yang dibutuhkan pembeli (Ton)
 * @returns {number} Nilai normalisasi antara 0 dan 1
 */
export function normalizeStock(farmerStock = 0, buyerMinStock = '') {
  const fStock = Number(farmerStock) || 0;

  // Jika input stok pembeli kosong/tidak ditentukan, netral (1)
  if (buyerMinStock === '' || buyerMinStock === null || buyerMinStock === undefined) {
    return 1;
  }

  const bStock = Number(buyerMinStock);
  if (isNaN(bStock) || bStock <= 0) {
    return 1;
  }

  if (fStock <= 0) {
    return 0;
  }

  const ratio = fStock / bStock;
  return Math.min(Math.max(ratio, 0), 1);
}

/**
 * 3. Normalisasi Harga (N_harga)
 * Formula: N_harga = min(harga_maks_pembeli / harga_petani, 1)
 * Rentang nilai: 0 sampai 1.
 * Harga petani yang berada di bawah atau sama dengan batas pembeli mendapatkan nilai 1.
 * 
 * @param {number} farmerPrice - Harga komoditas petani (Rp/kg)
 * @param {number|string} buyerMaxPrice - Batas harga maksimum pembeli (Rp/kg)
 * @returns {number} Nilai normalisasi antara 0 dan 1
 */
export function normalizePrice(farmerPrice = 0, buyerMaxPrice = '') {
  const fPrice = Number(farmerPrice) || 0;

  // Jika batas harga pembeli kosong/tidak ditentukan, netral (1)
  if (buyerMaxPrice === '' || buyerMaxPrice === null || buyerMaxPrice === undefined) {
    return 1;
  }

  const bMaxPrice = Number(buyerMaxPrice);
  if (isNaN(bMaxPrice) || bMaxPrice <= 0) {
    return 1;
  }

  if (fPrice <= 0) {
    return 1;
  }

  const ratio = bMaxPrice / fPrice;
  return Math.min(Math.max(ratio, 0), 1);
}

/**
 * 4. Normalisasi Rating (N_rating)
 * Skala rating 1–5 dinormalisasikan ke rentang 0–1.
 * Formula: N_rating = rating_petani / 5
 * 
 * @param {number} farmerRating - Rating komoditas/petani (skala 1-5)
 * @returns {number} Nilai normalisasi antara 0 dan 1
 */
export function normalizeRating(farmerRating = 4.8) {
  const rating = Number(farmerRating);
  if (isNaN(rating) || rating <= 0) {
    return 0.8; // Fallback 4.0 / 5 = 0.8 jika data rating kosong
  }
  return Math.min(Math.max(rating / 5, 0), 1);
}

/**
 * 5. Menghitung Weighted Score
 * Formula:
 * Score = (K * 0.50) + (Stok * 0.15) + (Harga * 0.20) + (Rating * 0.15)
 * ScorePercentage = Score * 100
 * 
 * @param {Object} scores
 * @param {number} scores.commodityScore - Normalisasi komoditas (0 atau 1)
 * @param {number} scores.stockScore - Normalisasi stok (0 sampai 1)
 * @param {number} scores.priceScore - Normalisasi harga (0 sampai 1)
 * @param {number} scores.ratingScore - Normalisasi rating (0 sampai 1)
 * @returns {number} Skor persentase (0 sampai 100)
 */
export function calculateWeightedScore({
  commodityScore = 0,
  stockScore = 0,
  priceScore = 0,
  ratingScore = 0
}) {
  const w = RECOMMENDATION_WEIGHTS;
  const score = (commodityScore * w.commodity) +
                (stockScore * w.stock) +
                (priceScore * w.price) +
                (ratingScore * w.rating);

  return Math.min(100, Math.max(0, score * 100));
}

/**
 * 6. Menghitung Skor dan Detail Komoditas Tunggal
 * 
 * @param {Object} farmerItem - Data komoditas petani
 * @param {Object} buyerCriteria - Kriteria pencarian pembeli
 * @returns {Object} Hasil perhitungan skor dan label
 */
export function calculateRecommendationItem(farmerItem = {}, buyerCriteria = {}) {
  const farmerName = farmerItem.name || farmerItem.commodityName || '';
  const farmerStock = farmerItem.stockTon ?? farmerItem.stock ?? farmerItem.totalStockTon ?? 0;
  const farmerPrice = farmerItem.pricePerKg ?? farmerItem.proposedPrice ?? 0;
  const farmerRating = farmerItem.rating ?? 4.8;

  const kScore = normalizeCommodity(farmerName, buyerCriteria.commodity);
  const sScore = normalizeStock(farmerStock, buyerCriteria.minStock);
  const hScore = normalizePrice(farmerPrice, buyerCriteria.maxPrice);
  const rScore = normalizeRating(farmerRating);

  const percentage = calculateWeightedScore({
    commodityScore: kScore,
    stockScore: sScore,
    priceScore: hScore,
    ratingScore: rScore
  });

  // Format satu angka desimal standar Indonesia (cth: 99,4%)
  const formattedPct = percentage.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  return {
    score: percentage / 100,
    scorePercentage: percentage,
    formatted: `${formattedPct}%`,
    label: `${formattedPct}% sesuai kebutuhan`,
    // Alias compatibility untuk downstream components
    similarity: percentage / 100,
    similarityPercentage: percentage,
    similarityFormatted: `${formattedPct}%`,
    similarityLabel: `${formattedPct}% sesuai kebutuhan`,
    breakdown: {
      k: kScore,
      stok: sScore,
      harga: hScore,
      rating: rScore
    }
  };
}

/**
 * 7. Filter dan Urutkan Rekomendasi (Weighted Scoring)
 * 
 * Alur:
 * 1. Hitung Weighted Score untuk setiap kandidat komoditas.
 * 2. Terapkan threshold ketat: HANYA simpan jika scorePercentage > 50 (MIN_RECOMMENDATION_SCORE).
 * 3. Buang komoditas dengan scorePercentage <= 50.
 * 4. Urutkan hasil:
 *    - 'Paling Sesuai' (default): scorePercentage DESC
 *    - 'Harga Terendah': pricePerKg ASC
 *    - 'Stok Terbanyak': stockTon DESC
 *    - 'Rating Tertinggi': rating DESC
 *    - 'Terbaru': created_at / id DESC
 * 
 * @param {Array<Object>} commodities - Daftar komoditas dari Supabase
 * @param {Object} buyerCriteria - Kriteria pencarian pembeli
 * @param {string} [sortBy='Paling Sesuai'] - Opsi sorting
 * @returns {Array<Object>} Daftar komoditas yang lolos threshold (>50%) dan terurut
 */
export function rankRecommendations(commodities = [], buyerCriteria = {}, sortBy = 'Paling Sesuai') {
  if (!Array.isArray(commodities) || commodities.length === 0) {
    return [];
  }

  // 1. Hitung Weighted Score untuk setiap komoditas
  const scoredItems = commodities.map((item) => {
    const scoreDetail = calculateRecommendationItem(item, buyerCriteria);
    return {
      ...item,
      recommendationScore: scoreDetail.score,
      scorePercentage: scoreDetail.scorePercentage,
      scoreFormatted: scoreDetail.formatted,
      scoreLabel: scoreDetail.label,
      // Alias compatibility
      similarityScore: scoreDetail.score,
      similarityPercentage: scoreDetail.scorePercentage,
      similarityFormatted: scoreDetail.formatted,
      similarityLabel: scoreDetail.label
    };
  });

  // 2. ATURAN PENTING: Threshold rekomendasi scorePercentage > 50
  // Buang semua hasil dengan score <= 50%
  const filteredItems = scoredItems.filter((item) => item.scorePercentage > MIN_RECOMMENDATION_SCORE);

  // 3. Urutkan hasil yang telah lolos threshold
  return filteredItems.sort((a, b) => {
    if (sortBy === 'Harga Terendah') {
      const priceA = Number(a.pricePerKg ?? a.proposedPrice) || 0;
      const priceB = Number(b.pricePerKg ?? b.proposedPrice) || 0;
      return priceA - priceB;
    }

    if (sortBy === 'Stok Terbanyak') {
      const stockA = Number(a.stockTon ?? a.stock ?? a.totalStockTon) || 0;
      const stockB = Number(b.stockTon ?? b.stock ?? b.totalStockTon) || 0;
      return stockB - stockA;
    }

    if (sortBy === 'Rating Tertinggi') {
      const ratingA = Number(a.rating) || 0;
      const ratingB = Number(b.rating) || 0;
      return ratingB - ratingA;
    }

    // Default: 'Paling Sesuai' (Score DESC)
    const diff = b.scorePercentage - a.scorePercentage;
    if (Math.abs(diff) > 0.0001) {
      return diff;
    }

    // Secondary sorting: jika skor persis sama, prioritaskan rating lebih tinggi
    return (Number(b.rating) || 0) - (Number(a.rating) || 0);
  });
}

export default {
  RECOMMENDATION_WEIGHTS,
  MIN_RECOMMENDATION_SCORE,
  normalizeCommodity,
  normalizeStock,
  normalizePrice,
  normalizeRating,
  calculateWeightedScore,
  calculateRecommendationItem,
  rankRecommendations
};
