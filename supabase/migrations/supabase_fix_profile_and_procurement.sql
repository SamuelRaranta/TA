-- ==========================================================
-- SKRIP PERBAIKAN SUPABASE: PROFIL PENGGUNA & ISOLASI PENGADAAN
-- Salin dan jalankan seluruh kode ini di menu SQL Editor di dashboard Supabase Anda.
-- ==========================================================

-- 1. PASTIKAN SELURUH KOLOM PADA TABEL PROFILES LENGKAP
DO $$ 
BEGIN
  -- Kolom email pada profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  -- Kolom alamat gudang / operasional pembeli
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'warehouse_address') THEN
    ALTER TABLE public.profiles ADD COLUMN warehouse_address TEXT;
  END IF;

  -- Kolom preferensi notifikasi (JSON)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_preferences') THEN
    ALTER TABLE public.profiles ADD COLUMN notification_preferences JSONB;
  END IF;

  -- Kolom jenis usaha & info usaha tambahan
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_type') THEN
    ALTER TABLE public.profiles ADD COLUMN business_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_info') THEN
    ALTER TABLE public.profiles ADD COLUMN business_info TEXT;
  END IF;

  -- Kolom luas lahan petani
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'land_area') THEN
    ALTER TABLE public.profiles ADD COLUMN land_area TEXT;
  END IF;

  -- Kolom avatar_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  -- Kolom updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
  END IF;
END $$;

-- 2. SINKRONKAN EMAIL DARI AUTH.USERS KE PUBLIC.PROFILES (JIKA MASIH KOSONG)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. PERBAIKI KEBIJAKAN ROW LEVEL SECURITY (RLS) PADA TABEL PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete on profiles" ON public.profiles;

CREATE POLICY "Allow select on profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert on profiles" 
  ON public.profiles FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update on profiles" 
  ON public.profiles FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow delete on profiles" 
  ON public.profiles FOR DELETE 
  USING (true);

-- 4. PASTIKAN ISOLASI DATA PENGADAAN (PROCUREMENT PROPOSALS)
DO $$ 
DECLARE
  v_pembeli_id UUID := 'b2222222-2222-2222-2222-222222222222';
BEGIN
  -- Pastikan kolom buyer_id ada di tabel procurement_proposals
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procurement_proposals' AND column_name = 'buyer_id') THEN
    ALTER TABLE public.procurement_proposals ADD COLUMN buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- Hubungkan semua proposal lama/dummy yang belum memiliki buyer_id ke akun pembeli utama (pembeli@agriconnect.id)
  -- Sehingga akun pembeli baru yang baru mendaftar memiliki data mandiri yang bersih (kosong)
  UPDATE public.procurement_proposals
  SET buyer_id = v_pembeli_id
  WHERE buyer_id IS NULL;
END $$;

-- 5. PERBAIKI KEBIJAKAN RLS PADA TABEL PROCUREMENT_PROPOSALS
ALTER TABLE public.procurement_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proposals viewable by everyone" ON public.procurement_proposals;
DROP POLICY IF EXISTS "Users can insert proposals" ON public.procurement_proposals;
DROP POLICY IF EXISTS "Users and admins can update proposals" ON public.procurement_proposals;
DROP POLICY IF EXISTS "Users can delete proposals" ON public.procurement_proposals;

CREATE POLICY "Proposals viewable by everyone"
  ON public.procurement_proposals FOR SELECT
  USING (true);

CREATE POLICY "Users can insert proposals"
  ON public.procurement_proposals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users and admins can update proposals"
  ON public.procurement_proposals FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete proposals"
  ON public.procurement_proposals FOR DELETE
  USING (true);

-- 6. REPLICA IDENTITY & REALTIME REGISTRATION
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.procurement_proposals REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'procurement_proposals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.procurement_proposals;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
