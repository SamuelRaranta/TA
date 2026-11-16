-- ====================================================================
-- SUPABASE MIGRATION: Setup Tabel farmer_reviews & Sistem Rating Dinamis
-- ====================================================================
-- Tujuan:
-- 1. Menyimpan data review & rating dari pembeli untuk komoditas petani.
-- 2. Menghitung rating rata-rata dinamis per-petani (misal: 5 dan 4 -> 4.5).
-- 3. Default rating untuk petani baru tanpa review adalah 5.0.
-- 4. Isolasi data per-pengguna (setiap petani memiliki rating berbeda).
-- ====================================================================

-- 1. Buat Tabel farmer_reviews
CREATE TABLE IF NOT EXISTS public.farmer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_avatar TEXT,
  commodity_id UUID REFERENCES public.commodities(id) ON DELETE SET NULL,
  commodity_name TEXT NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  transaction_code TEXT,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index untuk Performa Query berdasarkan farmer_id
CREATE INDEX IF NOT EXISTS idx_farmer_reviews_farmer_id ON public.farmer_reviews(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_reviews_created_at ON public.farmer_reviews(created_at DESC);

-- 3. Konfigurasi Row Level Security (RLS)
ALTER TABLE public.farmer_reviews ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Semua pengguna (public/auth) dapat membaca review petani
DROP POLICY IF EXISTS "farmer_reviews_select_all" ON public.farmer_reviews;
CREATE POLICY "farmer_reviews_select_all"
  ON public.farmer_reviews
  FOR SELECT
  USING (true);

-- Policy INSERT: Pengguna autentikasi (pembeli) dapat menambahkan review
DROP POLICY IF EXISTS "farmer_reviews_insert_auth" ON public.farmer_reviews;
CREATE POLICY "farmer_reviews_insert_auth"
  ON public.farmer_reviews
  FOR INSERT
  WITH CHECK (true);

-- Policy UPDATE: Pengguna hanya dapat memperbarui review yang mereka buat sendiri
DROP POLICY IF EXISTS "farmer_reviews_update_own" ON public.farmer_reviews;
CREATE POLICY "farmer_reviews_update_own"
  ON public.farmer_reviews
  FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Policy DELETE: Pengguna hanya dapat menghapus review mereka sendiri
DROP POLICY IF EXISTS "farmer_reviews_delete_own" ON public.farmer_reviews;
CREATE POLICY "farmer_reviews_delete_own"
  ON public.farmer_reviews
  FOR DELETE
  USING (auth.uid() = buyer_id);

-- 4. Enable Realtime untuk Tabel farmer_reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.farmer_reviews;

-- 5. Seed Data Review untuk Petani Akun Demo 'yoru' & 'Samuel Raranta'
-- Contoh kasus pengguna: Pembeli 1 rating 5, Pembeli 2 rating 4 -> Rata-rata 4.5
DO $$
DECLARE
  v_yoru_id UUID;
  v_samuel_id UUID;
  v_buyer_id UUID;
BEGIN
  -- Dapatkan ID Petani yoru
  SELECT id INTO v_yoru_id FROM public.profiles WHERE full_name ILIKE '%yoru%' OR email ILIKE '%petani@agriconnect.id%' LIMIT 1;
  IF v_yoru_id IS NULL THEN
    v_yoru_id := 'a1111111-1111-1111-1111-111111111111';
  END IF;

  -- Dapatkan ID Petani Samuel Raranta
  SELECT id INTO v_samuel_id FROM public.profiles WHERE full_name ILIKE '%Samuel Raranta%' LIMIT 1;
  IF v_samuel_id IS NULL THEN
    v_samuel_id := 'b1ad80e8-1da5-4be1-bff6-35ee468b166f';
  END IF;

  -- Dapatkan ID Pembeli ikon
  SELECT id INTO v_buyer_id FROM public.profiles WHERE role = 'pembeli' LIMIT 1;
  IF v_buyer_id IS NULL THEN
    v_buyer_id := 'b2222222-2222-2222-2222-222222222222';
  END IF;

  -- Hapus review lama jika ada untuk mencegah duplikasi saat re-run
  DELETE FROM public.farmer_reviews WHERE farmer_id IN (v_yoru_id, v_samuel_id);

  -- Review untuk 'yoru' (Contoh: Pembeli 1 rating 5, Pembeli 2 rating 4 -> Rata-rata 4.5)
  INSERT INTO public.farmer_reviews (
    farmer_id, buyer_id, buyer_name, buyer_avatar, commodity_name, transaction_code, rating, comment, created_at
  ) VALUES 
  (
    v_yoru_id, 
    v_buyer_id, 
    'ikon (PT Royal Agro)', 
    '/default-avatar.png', 
    'Beras Premium Superwin', 
    'TRX-YORU-001', 
    5.0, 
    'Kualitas beras superwin sangat pulen, bersih dari kotoran/gabah, dan kadar air sesuai standar SNI. Pengiriman tepat waktu!', 
    NOW() - INTERVAL '3 days'
  ),
  (
    v_yoru_id, 
    v_buyer_id, 
    'Hendra Pratama, S.T.', 
    '/default-avatar.png', 
    'Cabai Rawit Merah (Rica Minahasa) Segar', 
    'TRX-YORU-002', 
    4.0, 
    'Cabai rica tiba dalam keadaan segar dan tingkat kepedasan luar biasa. Ada sedikit sortasi bobot tapi keseluruhan sangat memuaskan.', 
    NOW() - INTERVAL '1 day'
  );

  -- Review untuk 'Samuel Raranta' (Rating tinggi ~4.9)
  INSERT INTO public.farmer_reviews (
    farmer_id, buyer_id, buyer_name, buyer_avatar, commodity_name, transaction_code, rating, comment, created_at
  ) VALUES 
  (
    v_samuel_id, 
    v_buyer_id, 
    'ikon (PT Royal Agro)', 
    '/default-avatar.png', 
    'Cengkeh Zanzibar Kering (10 Ton)', 
    'TRX-SAM-001', 
    5.0, 
    'Kadar air cengkeh di bawah 12% dan aroma eugenol sangat kuat. Sangat profesional dalam pengemasan karung goni berlapis.', 
    NOW() - INTERVAL '7 days'
  ),
  (
    v_samuel_id, 
    v_buyer_id, 
    'CV Pangan Mandiri Nusantara', 
    '/default-avatar.png', 
    'Kentang Granola Modoinding', 
    'TRX-SAM-002', 
    4.8, 
    'Kentang ukuran seragam, kulit bersih tanpa cacat busuk basah. Mitra petani terpercaya di Minahasa Selatan.', 
    NOW() - INTERVAL '2 days'
  );

END $$;
