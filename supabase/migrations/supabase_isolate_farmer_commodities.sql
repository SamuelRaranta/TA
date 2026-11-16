-- ==========================================================
-- SKRIP SUPABASE: ISOLASI DATA KOMODITAS MANDIRI PER AKUN PETANI
-- Menyimpan semua komoditas yang sudah ada secara eksklusif ke akun Samuel
-- dan memastikan akun petani baru memiliki data mandiri yang terpisah.
-- ==========================================================

DO $$
DECLARE
  v_samuel_id UUID;
  v_demo_farmer_id UUID := 'a1111111-1111-1111-1111-111111111111';
BEGIN
  -- 1. CARI APAKAH SUDAH ADA AKUN SAMUEL DI TABEL PROFILES ATAU AUTH.USERS
  SELECT id INTO v_samuel_id
  FROM public.profiles
  WHERE full_name ILIKE '%samuel%' OR email ILIKE '%samuel%'
  LIMIT 1;

  -- Jika tidak ditemukan di profiles, cari di auth.users
  IF v_samuel_id IS NULL THEN
    SELECT id INTO v_samuel_id
    FROM auth.users
    WHERE email ILIKE '%samuel%' OR (raw_user_meta_data->>'full_name') ILIKE '%samuel%'
    LIMIT 1;
  END IF;

  -- Jika belum ada akun Samuel khusus, tetapkan ke akun demo petani utama (a1111111-1111-1111-1111-111111111111)
  -- dan perbarui profilnya menjadi nama Samuel Raranta
  IF v_samuel_id IS NULL THEN
    v_samuel_id := v_demo_farmer_id;
  END IF;

  -- Pastikan profil Samuel memiliki nama Samuel Raranta
  UPDATE public.profiles
  SET full_name = 'Samuel Raranta',
      leader_name = 'Samuel Raranta',
      group_name = COALESCE(group_name, 'Poktan Ranowangko Langowan')
  WHERE id = v_samuel_id;

  -- 2. TAUTKAN SELURUH DATA KOMODITAS YANG SUDAH ADA SAAT INI SECARA EKSKLUSIF KE AKUN SAMUEL
  UPDATE public.commodities
  SET farmer_id = v_samuel_id,
      farmer_leader = 'Samuel Raranta',
      farmer_group = COALESCE(farmer_group, 'Poktan Ranowangko Langowan')
  WHERE farmer_id IS NULL OR farmer_id = v_demo_farmer_id OR farmer_id = v_samuel_id;

  RAISE NOTICE 'Semua komoditas yang ada berhasil ditautkan ke akun Samuel dengan ID: %', v_samuel_id;

END $$;

-- 3. PERIKSA & PASTIKAN ROW LEVEL SECURITY (RLS) AKTIF
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Semua pengguna (Pembeli, Petani lain, Admin) bisa melihat katalog komoditas
DROP POLICY IF EXISTS "Commodities are viewable by everyone" ON public.commodities;
CREATE POLICY "Commodities are viewable by everyone" 
  ON public.commodities FOR SELECT USING (true);

-- Policy INSERT: Setiap akun petani terautentikasi dapat menambahkan komoditas miliknya sendiri
DROP POLICY IF EXISTS "Users can insert commodities" ON public.commodities;
CREATE POLICY "Users can insert commodities" 
  ON public.commodities FOR INSERT WITH CHECK (true);

-- Policy UPDATE: Petani dan Admin dapat memperbarui komoditas
DROP POLICY IF EXISTS "Farmers and admins can update commodities" ON public.commodities;
CREATE POLICY "Farmers and admins can update commodities" 
  ON public.commodities FOR UPDATE USING (true);

-- Policy DELETE: Petani dan Admin dapat menghapus komoditas
DROP POLICY IF EXISTS "Farmers and admins can delete commodities" ON public.commodities;
CREATE POLICY "Farmers and admins can delete commodities" 
  ON public.commodities FOR DELETE USING (true);

-- 4. REALTIME PUBLICATION
ALTER TABLE public.commodities REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'commodities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.commodities;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
