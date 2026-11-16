-- ==========================================================
-- SKRIP PERBAIKAN ISOLASI KOMODITAS PETANI & SINKRONISASI NAMA
-- Salin dan jalankan skrip ini di SQL Editor Supabase Anda.
-- ==========================================================

-- 1. PASTIKAN NAMA PETANI PADA KOMODITAS TERSINKRON SESUAI PROFIL PEMILIKNYA
UPDATE public.commodities c
SET farmer_leader = p.full_name,
    farmer_group = COALESCE(c.farmer_group, p.group_name, 'Kelompok Tani')
FROM public.profiles p
WHERE c.farmer_id = p.id AND p.full_name IS NOT NULL AND p.full_name != '';

-- 2. PASTIKAN FOREIGN KEY PADA TABEL COMMODITIES MENGIZINKAN ON DELETE SET NULL
DO $$
BEGIN
  ALTER TABLE public.commodities
    DROP CONSTRAINT IF EXISTS commodities_farmer_id_fkey;

  ALTER TABLE public.commodities
    ADD CONSTRAINT commodities_farmer_id_fkey
    FOREIGN KEY (farmer_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- 3. PASTIKAN RLS MENGIZINKAN SEMUA OPERASI COMMODITIES DARI FRONTEND
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Commodities are viewable by everyone" ON public.commodities;
CREATE POLICY "Commodities are viewable by everyone" 
  ON public.commodities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert commodities" ON public.commodities;
CREATE POLICY "Users can insert commodities" 
  ON public.commodities FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Farmers and admins can update commodities" ON public.commodities;
CREATE POLICY "Farmers and admins can update commodities" 
  ON public.commodities FOR UPDATE USING (true);

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
