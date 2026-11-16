-- ==========================================================
-- SKRIP SETUP SUPABASE: REALTIME SINKRONISASI PROFIL & PESAN
-- File: supabase_profiles_realtime_setup.sql
-- Menghubungkan tabel profiles, chat_messages, & chat_requests ke Supabase Realtime
-- Salin dan jalankan seluruh kode ini di SQL Editor dashboard Supabase Anda.
-- ==========================================================

-- 1. Pastikan Ekstensi UUID Aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Aktifkan REPLICA IDENTITY FULL pada tabel profiles & chat
-- Ini krusial agar Supabase Realtime mengirim seluruh data kolom baru saat ada UPDATE (nama, avatar, role)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_requests') THEN
    ALTER TABLE public.chat_requests REPLICA IDENTITY FULL;
  END IF;
END $$;

-- 3. Pastikan Publikasi Realtime Tersedia
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 4. Tambahkan tabel profiles, chat_messages, & chat_requests ke publikasi realtime
DO $$ 
BEGIN
  -- Daftarkan tabel profiles ke Realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- Daftarkan tabel chat_messages ke Realtime (jika tabel ada)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- Daftarkan tabel chat_requests ke Realtime (jika tabel ada)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_requests') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- 5. Konfigurasi Row Level Security (RLS) pada tabel profiles
-- Agar klien web (baik login maupun anonim) dapat menerima event realtime dan membaca update profil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Kebijakan SELECT: Izinkan pembacaan profil untuk seluruh client agar realtime event terkirim
CREATE POLICY "profiles_select_all" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Kebijakan UPDATE: Izinkan pembaruan profil
CREATE POLICY "profiles_update_all" 
  ON public.profiles FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Kebijakan INSERT: Izinkan insert profil baru
CREATE POLICY "profiles_insert_all" 
  ON public.profiles FOR INSERT 
  WITH CHECK (true);

-- 6. Verifikasi & Standarisasi Role Pengguna di tabel profiles
-- Pastikan format role konsisten ('petani', 'pembeli', 'admin')
UPDATE public.profiles 
SET role = 'petani' 
WHERE LOWER(role) IN ('petani', 'farmer');

UPDATE public.profiles 
SET role = 'pembeli' 
WHERE LOWER(role) IN ('pembeli', 'buyer');

UPDATE public.profiles 
SET role = 'admin' 
WHERE LOWER(role) = 'admin';

-- Selesai: Realtime sekarang aktif penuh untuk pembaruan profil di seluruh halaman chat!
