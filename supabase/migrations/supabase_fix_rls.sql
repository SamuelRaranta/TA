-- ==========================================================
-- SCRIPT AKTIVASI PERMISSION CRUD LENGKAP PROFILES DI SUPABASE
-- Jalankan skrip ini di SQL Editor Supabase agar tindakan
-- Tambah, Edit, Hapus, dan Verifikasi User di Kelola Pengguna
-- tersimpan 100% permanen ke database Supabase.
-- ==========================================================

-- 1. Hapus policy lama yang membatasi update/delete
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete on profiles" ON public.profiles;

-- 2. Buat policy baru yang mengizinkan seluruh operasi dari aplikasi
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
