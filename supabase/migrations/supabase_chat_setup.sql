-- ==========================================================
-- SKRIP MIGRASI SUPABASE: SISTEM PESAN & PERSETUJUAN KONTAK REAL
-- Tabel: chat_requests, chat_messages, RLS, Realtime & Trigger Pesan Sambutan Admin
-- CATATAN: Skrip ini TIDAK menggunakan data dummy obrolan buatan.
-- Setiap pengguna baru yang mendaftar secara otomatis menerima pesan sambutan dari Admin.
-- Salin dan jalankan seluruh kode ini di menu SQL Editor di dashboard Supabase Anda.
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL: chat_requests (Permintaan Obrolan & Persetujuan Antar Pengguna)
-- ATURAN:
-- - Petani dan Pembeli wajib melalui persetujuan (status: 'accepted')
-- - Admin langsung terhubung tanpa persetujuan
CREATE TABLE IF NOT EXISTS public.chat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_sender_receiver UNIQUE (sender_id, receiver_id)
);

-- 3. TABEL: chat_messages (Pesan Obrolan Riil yang Disimpan di Supabase)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  attachment_url TEXT,
  attachment_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES UNTUK PERFORMA QUERY CEPAT
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender ON public.chat_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_receiver ON public.chat_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON public.chat_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_pair ON public.chat_messages(sender_id, receiver_id);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Bersihkan policies lama jika ada
DROP POLICY IF EXISTS "chat_requests_select" ON public.chat_requests;
DROP POLICY IF EXISTS "chat_requests_insert" ON public.chat_requests;
DROP POLICY IF EXISTS "chat_requests_update" ON public.chat_requests;
DROP POLICY IF EXISTS "chat_requests_delete" ON public.chat_requests;

DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON public.chat_messages;

-- Policies untuk chat_requests
CREATE POLICY "chat_requests_select" 
  ON public.chat_requests FOR SELECT 
  USING (true);

CREATE POLICY "chat_requests_insert" 
  ON public.chat_requests FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "chat_requests_update" 
  ON public.chat_requests FOR UPDATE 
  USING (true);

CREATE POLICY "chat_requests_delete" 
  ON public.chat_requests FOR DELETE 
  USING (true);

-- Policies untuk chat_messages
CREATE POLICY "chat_messages_select" 
  ON public.chat_messages FOR SELECT 
  USING (true);

CREATE POLICY "chat_messages_insert" 
  ON public.chat_messages FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "chat_messages_update" 
  ON public.chat_messages FOR UPDATE 
  USING (true);

CREATE POLICY "chat_messages_delete" 
  ON public.chat_messages FOR DELETE 
  USING (true);

-- 6. PUBLIKASI REALTIME
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER TABLE public.chat_requests REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

DO $$ 
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 7. PASTIKAN AKUN ADMIN TERSEDIA DI TABEL PROFILES
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Cari apakah sudah ada admin di profiles
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;

  -- Jika tidak ada di profiles, cari di auth.users
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM auth.users WHERE email ILIKE '%admin%' OR (raw_user_meta_data->>'role') = 'admin' LIMIT 1;
  END IF;

  -- Jika ditemukan di auth.users tapi belum di profiles, masukkan ke profiles
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, role, company_name, location, kyc_status)
    VALUES (v_admin_id, 'Admin Utama AgriConnect', 'admin', 'Pusat Operasional AgriConnect Minahasa', 'Kantor Pusat Minahasa', 'verified')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  ELSE
    -- Jika belum ada akun admin sama sekali di database, buat akun admin default
    v_admin_id := 'c3333333-3333-3333-3333-333333333333';
    BEGIN
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      )
      VALUES (
        v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@agriconnect.id', crypt('AdminAgri2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"admin","full_name":"Admin Utama AgriConnect"}', now(), now()
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    BEGIN
      INSERT INTO public.profiles (id, full_name, role, company_name, location, kyc_status)
      VALUES (v_admin_id, 'Admin Utama AgriConnect', 'admin', 'Pusat Operasional AgriConnect Minahasa', 'Kantor Pusat Minahasa', 'verified')
      ON CONFLICT (id) DO UPDATE SET role = 'admin';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- 8. TRIGGER OTOMATIS: PESAN SAMBUTAN DARI ADMIN UNTUK SETIAP PENGGUNA BARU YANG MENDAFTAR
-- Ketika user baru (petani atau pembeli) mendaftar dan profilnya dibuat,
-- Admin otomatis mengirim pesan pembuka resmi sehingga akun baru tidak kosong dan langsung memiliki jalur pesan resmi.
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_welcome_text TEXT;
BEGIN
  -- Abaikan jika yang dibuat adalah akun admin itu sendiri
  IF NEW.role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Cari ID akun Admin yang aktif di sistem
  SELECT id INTO v_admin_id 
  FROM public.profiles 
  WHERE role = 'admin' 
  ORDER BY created_at ASC 
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    v_admin_id := 'c3333333-3333-3333-3333-333333333333';
  END IF;

  -- Cek apakah sudah pernah ada pesan riwayat obrolan antara admin dan user ini
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_messages 
    WHERE (sender_id = v_admin_id AND receiver_id = NEW.id) 
       OR (sender_id = NEW.id AND receiver_id = v_admin_id)
  ) THEN
    -- Tentukan pesan pembuka resmi sesuai peran pengguna
    IF NEW.role = 'pembeli' THEN
      v_welcome_text := 'Halo ' || COALESCE(NEW.full_name, 'Bapak/Ibu') || ', selamat datang di platform AgriConnect! Saya Admin Layanan Pengadaan & Penjamin Escrow. Ruang obrolan ini langsung terhubung dengan Admin tanpa memerlukan persetujuan kontak. Anda dapat berdiskusi dengan kami kapan saja untuk verifikasi penawaran, konsultasi sistem escrow, atau rekomendasi pasokan komoditas dari petani Minahasa.';
    ELSE
      v_welcome_text := 'Halo ' || COALESCE(NEW.full_name, 'Bapak/Ibu') || ', selamat datang di platform AgriConnect! Saya Admin Pendamping Petani & Penjamin Transaksi. Ruang obrolan ini langsung terhubung dengan Admin tanpa memerlukan persetujuan kontak. Anda dapat berkonsultasi dengan kami kapan saja mengenai verifikasi mutu komoditas, sertifikasi panen, hingga pendampingan kontrak jual-beli hasil tani Anda.';
    END IF;

    -- Masukkan pesan selamat datang resmi ke tabel chat_messages
    INSERT INTO public.chat_messages (sender_id, receiver_id, message, is_read, created_at)
    VALUES (v_admin_id, NEW.id, v_welcome_text, false, now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada tabel profiles (berlaku untuk INSERT maupun UPDATE)
DROP TRIGGER IF EXISTS trg_profile_welcome_chat ON public.profiles;
CREATE TRIGGER trg_profile_welcome_chat
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_welcome_chat();

-- 9. INISIALISASI PESAN ADMIN UNTUK PENGGUNA ASLI YANG SUDAH TERDAFTAR SEBELUMNYA DI PROFILES
-- (Menjamin seluruh profil yang sudah ada di database langsung memiliki pesan sambutan dari Admin)
DO $$
DECLARE
  rec RECORD;
  v_admin_id UUID;
  v_welcome_text TEXT;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  IF v_admin_id IS NULL THEN
    v_admin_id := 'c3333333-3333-3333-3333-333333333333';
  END IF;

  FOR rec IN 
    SELECT id, full_name, role 
    FROM public.profiles 
    WHERE role IN ('petani', 'pembeli')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.chat_messages 
      WHERE (sender_id = v_admin_id AND receiver_id = rec.id)
         OR (sender_id = rec.id AND receiver_id = v_admin_id)
    ) THEN
      IF rec.role = 'pembeli' THEN
        v_welcome_text := 'Halo ' || COALESCE(rec.full_name, 'Bapak/Ibu') || ', selamat datang di platform AgriConnect! Saya Admin Layanan Pengadaan & Penjamin Escrow. Ruang obrolan ini langsung terhubung dengan Admin tanpa memerlukan persetujuan kontak. Anda dapat berdiskusi dengan kami kapan saja untuk verifikasi penawaran, konsultasi sistem escrow, atau rekomendasi pasokan komoditas dari petani Minahasa.';
      ELSE
        v_welcome_text := 'Halo ' || COALESCE(rec.full_name, 'Bapak/Ibu') || ', selamat datang di platform AgriConnect! Saya Admin Pendamping Petani & Penjamin Transaksi. Ruang obrolan ini langsung terhubung dengan Admin tanpa memerlukan persetujuan kontak. Anda dapat berkonsultasi dengan kami kapan saja mengenai verifikasi mutu komoditas, sertifikasi panen, hingga pendampingan kontrak jual-beli hasil tani Anda.';
      END IF;

      INSERT INTO public.chat_messages (sender_id, receiver_id, message, is_read, created_at)
      VALUES (v_admin_id, rec.id, v_welcome_text, false, now());
    END IF;
  END LOOP;
END $$;

-- 10. PEMBARUAN FOTO PROFIL RESMI PENGGUNA DI TABEL PROFILES SUPABASE
-- Memastikan foto profil pengguna tersimpan dengan foto asli yang representatif
UPDATE public.profiles
SET avatar_url = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80'
WHERE full_name ILIKE '%Samuel Raranta%' OR id = 'b1ad80e8-1da5-4be1-bff6-35ee468b166f';

UPDATE public.profiles
SET avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
WHERE full_name ILIKE '%Hengky Mandagi%' OR id = 'a1111111-1111-1111-1111-111111111111';

UPDATE public.profiles
SET avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
WHERE full_name ILIKE '%Hendra Pratama%' OR id = 'b2222222-2222-2222-2222-222222222222';

UPDATE public.profiles
SET avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80'
WHERE role = 'admin' OR id = 'c3333333-3333-3333-3333-333333333333';
