-- ==========================================================
-- FIX ISOLASI PROFILE: 1 user edit bocor ke semua user + admin
-- Penyebab lama:
--  - supabase_fix_rls.sql membuka UPDATE USING(true) -> siapa pun bisa update siapa pun
--  - Frontend fallback ke seed UUID bersama (a111../b222../c333..)
-- File ini mengunci backend agar hanya pemilik + admin yang bisa tulis.
-- Cara pakai: jalankan seluruh file di Supabase Dashboard > SQL Editor
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Bersihkan policy lama yang terlalu longgar / duplikat
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete on profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own_or_admin" ON public.profiles;

-- 2. SELECT: tetap terbuka untuk marketplace/chat/detail mitra (USING true)
-- Jika ingin lebih ketat, ganti ke auth.uid() = id, tapi UI katalog akan kosong untuk anon.
CREATE POLICY "profiles_select_own_or_public"
  ON public.profiles FOR SELECT
  USING (true);

-- 3. INSERT: hanya pemilik (auth.uid() = id) ATAU admin
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 4. UPDATE: hanya pemilik ATAU admin — INI KUNCI PERBAIKAN BOCOR
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 5. DELETE: hanya pemilik ATAU admin
CREATE POLICY "profiles_delete_own_or_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 6. Pastikan realtime tetap jalan untuk filter id=eq.xxx (frontend sudah diperbaiki)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
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
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
