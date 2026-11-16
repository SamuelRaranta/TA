-- ==========================================================
-- SKRIP SETUP SUPABASE: TABEL PENGADAAN & PROPOSAL (PROCUREMENT PROPOSALS)
-- Jalankan skrip ini di menu SQL Editor di dashboard Supabase Anda.
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. BUAT TABEL PROCUREMENT_PROPOSALS JIKA BELUM ADA
CREATE TABLE IF NOT EXISTS public.procurement_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL DEFAULT 'Pembeli Mitra',
  buyer_pic TEXT DEFAULT 'PIC Pengadaan',
  commodity_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Hortikultura & Sayur',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Menunggu Persetujuan' CHECK (status IN ('Aktif', 'Tidak Aktif', 'Menunggu Persetujuan')),
  status_detail TEXT DEFAULT 'Menunggu Persetujuan Admin',
  requested_kg NUMERIC NOT NULL DEFAULT 1000,
  offered_price_per_kg NUMERIC NOT NULL DEFAULT 10000,
  total_budget NUMERIC NOT NULL DEFAULT 10000000,
  target TEXT DEFAULT 'Semua Petani',
  location TEXT DEFAULT 'Minahasa, Sulawesi Utara',
  specifications TEXT,
  valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PASTIKAN SELURUH KOLOM LENGKAP JIKA TABEL SUDAH PERNAH DIBUAT SEBELUMNYA
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procurement_proposals' AND column_name = 'status_detail') THEN
    ALTER TABLE public.procurement_proposals ADD COLUMN status_detail TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procurement_proposals' AND column_name = 'rejection_reason') THEN
    ALTER TABLE public.procurement_proposals ADD COLUMN rejection_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procurement_proposals' AND column_name = 'buyer_pic') THEN
    ALTER TABLE public.procurement_proposals ADD COLUMN buyer_pic TEXT;
  END IF;
END $$;

-- 3. ROW LEVEL SECURITY (RLS) & POLICIES
ALTER TABLE public.procurement_proposals ENABLE ROW LEVEL SECURITY;

-- Semua pengguna (Petani, Pembeli, Admin, Public) dapat melihat proposal
DROP POLICY IF EXISTS "Proposals viewable by everyone" ON public.procurement_proposals;
CREATE POLICY "Proposals viewable by everyone"
  ON public.procurement_proposals FOR SELECT
  USING (true);

-- Pengguna terautentikasi dan anon dapat memasukkan proposal baru
DROP POLICY IF EXISTS "Users can insert proposals" ON public.procurement_proposals;
CREATE POLICY "Users can insert proposals"
  ON public.procurement_proposals FOR INSERT
  WITH CHECK (true);

-- Admin dan pengguna dapat mengupdate proposal (Diterima, Ditolak, Edit)
DROP POLICY IF EXISTS "Users and admins can update proposals" ON public.procurement_proposals;
CREATE POLICY "Users and admins can update proposals"
  ON public.procurement_proposals FOR UPDATE
  USING (true);

-- Pengguna dapat menghapus/membatalkan proposal
DROP POLICY IF EXISTS "Users can delete proposals" ON public.procurement_proposals;
CREATE POLICY "Users can delete proposals"
  ON public.procurement_proposals FOR DELETE
  USING (true);

-- 4. AKTIFKAN REPLICA IDENTITY FULL & REALTIME PUBLICATION
ALTER TABLE public.procurement_proposals REPLICA IDENTITY FULL;

DO $$
BEGIN
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

-- 5. SINKRONISASI DATA DUMMY KE AKUN PETANI (petani@agriconnect.id) & PEMBELI (pembeli@agriconnect.id)
DO $$
DECLARE
  v_petani_id UUID := 'a1111111-1111-1111-1111-111111111111';
  v_pembeli_id UUID := 'b2222222-2222-2222-2222-222222222222';
BEGIN
  -- Pastikan profil demo petani ada
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_petani_id) THEN
    INSERT INTO public.profiles (
      id, role, full_name, phone, group_name, leader_name, location, kyc_status
    ) VALUES (
      v_petani_id, 'petani', 'Hengky Mandagi, S.P.', '0812-4321-8765',
      'Poktan Ranowangko Langowan', 'Hengky Mandagi, S.P.', 'Kec. Langowan Timur, Minahasa', 'verified'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Pastikan profil demo pembeli ada
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_pembeli_id) THEN
    INSERT INTO public.profiles (
      id, role, full_name, phone, group_name, leader_name, location, kyc_status
    ) VALUES (
      v_pembeli_id, 'pembeli', 'Hendra Pratama, S.T.', '0811-9876-5432',
      'PT Royal Agro Minahasa', 'Hendra Pratama, S.T.', 'Kawasan Sentra Agro Minahasa', 'verified'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Pastikan komoditas di tabel commodities terhubung ke akun petani@agriconnect.id
  UPDATE public.commodities 
  SET farmer_id = v_petani_id 
  WHERE farmer_id IS NULL;

  -- 6. BERSIHKAN & SEED DATA PROPOSAL PENGADAAN (Dihubungkan ke pembeli & terlihat oleh petani saat Aktif)
  DELETE FROM public.procurement_proposals WHERE code IN ('PRP-2026-001', 'PRP-2026-002', 'PRP-2026-003', 'PRP-2026-004', 'PRP-2026-005', 'PRP-2026-006');

  INSERT INTO public.procurement_proposals (
    code, buyer_id, buyer_name, buyer_pic, commodity_name, category, image_url,
    status, status_detail, requested_kg, offered_price_per_kg, total_budget,
    target, location, specifications, valid_until, rejection_reason, created_at
  ) VALUES
    -- Proposal 1: Aktif (Diterima Admin -> Masuk ke "Cari Penawaran" Petani & "Lihat Penawar" Pembeli)
    (
      'PRP-2026-005',
      v_pembeli_id,
      'PT Royal Agro Minahasa',
      'Hendra Pratama, S.T.',
      'Kentang Granola Modoinding Grade A',
      'Hortikultura & Sayur',
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
      'Aktif',
      'Diterima & Dipublikasikan ke Petani',
      8000,
      14000,
      112000000,
      'Semua Petani',
      'Modoinding, Minahasa',
      'Kentang varietas Granola dataran tinggi Modoinding, umbi bersih bebas tanah tebal, bobot 100-150 gram per butir, tanpa cacat sayat.',
      CURRENT_DATE + INTERVAL '25 days',
      NULL,
      NOW() - INTERVAL '3 days'
    ),
    -- Proposal 2: Aktif (Diterima Admin -> Masuk ke "Cari Penawaran" Petani & "Lihat Penawar" Pembeli)
    (
      'PRP-2026-004',
      v_pembeli_id,
      'PT Royal Agro Minahasa',
      'Hendra Pratama, S.T.',
      'Kopi Arabika Minahasa Rurukan',
      'Perkebunan',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      'Aktif',
      'Diterima & Dipublikasikan ke Petani',
      2000,
      8500,
      17000000,
      'Semua Petani',
      'Tomohon - Minahasa',
      'Green beans Arabika specialty Minahasa, proses full-washed, kadar air 11-12%, defect rate maksimal 3%. Cocok untuk industri roastery.',
      CURRENT_DATE + INTERVAL '30 days',
      NULL,
      NOW() - INTERVAL '5 days'
    ),
    -- Proposal 3: Aktif (Diterima Admin -> Masuk ke "Cari Penawaran" Petani & "Lihat Penawar" Pembeli)
    (
      'PRP-2026-003',
      v_pembeli_id,
      'PT Royal Agro Minahasa',
      'Hendra Pratama, S.T.',
      'Jahe Merah Segar Pilihan',
      'Hortikultura & Sayur',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
      'Aktif',
      'Diterima & Dipublikasikan ke Petani',
      4000,
      22000,
      88000000,
      'Semua Petani',
      'Kawangkoan, Minahasa',
      'Rimpang jahe merah tua usia panen minimal 9 bulan, rimpang padat segar, bersih dari tanah gumpalan, aroma pedas kuat.',
      CURRENT_DATE + INTERVAL '20 days',
      NULL,
      NOW() - INTERVAL '7 days'
    ),
    -- Proposal 4: Menunggu Persetujuan (Untuk dicoba oleh Admin di Kelola Pengadaan: Klik "Diterima" atau "Ditolak")
    (
      'PRP-2026-006',
      v_pembeli_id,
      'PT Royal Agro Minahasa',
      'Hendra Pratama, S.T.',
      'Bawang Merah Lansuna Minahasa',
      'Hortikultura & Sayur',
      'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
      'Menunggu Persetujuan',
      'Menunggu Persetujuan Admin',
      5000,
      38000,
      190000000,
      'Semua Petani',
      'Tonsewer, Minahasa',
      'Bawang merah lokal Lansuna kering daun, umbi merah tua padat beraroma khas tajam. Siap kirim ke sentra industri bumbu.',
      CURRENT_DATE + INTERVAL '14 days',
      NULL,
      NOW() - INTERVAL '2 hours'
    ),
    -- Proposal 5: Tidak Aktif / Ditolak (Contoh penolakan oleh Admin)
    (
      'PRP-2026-002',
      v_pembeli_id,
      'PT Royal Agro Minahasa',
      'Hendra Pratama, S.T.',
      'Kedelai Lokal Anjasmoro Tompaso',
      'Biji-Bijian & Palawija',
      'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
      'Tidak Aktif',
      'Ditolak oleh Admin',
      10000,
      8000,
      80000000,
      'Semua Petani',
      'Tompaso, Minahasa',
      'Kedelai lokal varietas Anjasmoro untuk industri tahu/tempe.',
      CURRENT_DATE + INTERVAL '5 days',
      'Harga penawaran Rp8.000/kg berada jauh di bawah HPP pasar acuan Minahasa (minimum Rp9.800/kg). Mohon sesuaikan harga penawaran agar dapat dipublikasikan ke petani.',
      NOW() - INTERVAL '10 days'
    );
END $$;
