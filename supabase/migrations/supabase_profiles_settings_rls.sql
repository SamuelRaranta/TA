-- ==========================================================
-- SKRIP SETUP RLS SUPABASE: PENGATURAN PROFIL MANDIRI
-- File: supabase_profiles_settings_rls.sql
-- Memastikan pengguna hanya dapat mengubah profil miliknya sendiri (auth.uid() = id)
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan SELECT: Izinkan pembacaan profil untuk kebutuhan marketplace, detail mitra, dan chat
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "profiles_select_all" 
  ON public.profiles FOR SELECT 
  USING (true);

-- 2. Kebijakan UPDATE: Pengguna HANYA diizinkan memperbarui data profil miliknya sendiri
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Kebijakan INSERT: Pengguna hanya dapat memasukkan profil dengan id miliknya sendiri
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Pastikan REPLICA IDENTITY FULL tetap aktif untuk realtime
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
