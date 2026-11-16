-- ==========================================================
-- SKRIP SETUP & SINKRONISASI TABEL COMMODITIES SUPABASE
-- Jalankan skrip ini di menu SQL Editor di dashboard Supabase Anda.
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PASTIKAN TABEL COMMODITIES MEMILIKI SEMUA KOLOM YANG DIBUTUHKAN
CREATE TABLE IF NOT EXISTS public.commodities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Perkebunan', 'Padi & Beras', 'Biji-Bijian & Palawija', 'Hortikultura & Sayur')),
  farmer_group TEXT,
  farmer_leader TEXT,
  location TEXT NOT NULL,
  distance_info TEXT,
  stock_ton NUMERIC NOT NULL DEFAULT 0,
  min_order_ton NUMERIC NOT NULL DEFAULT 1,
  price_per_kg NUMERIC NOT NULL,
  quality_grade TEXT,
  harvest_type TEXT DEFAULT 'Siap Diambil di Gudang',
  harvest_date TEXT,
  status TEXT DEFAULT 'Menunggu Persetujuan' CHECK (status IN ('Aktif', 'Tersedia', 'Menunggu Persetujuan', 'Tidak Aktif', 'Pre-Order')),
  admin_notes TEXT,
  rating NUMERIC DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TAMBAHKAN KOLOM admin_notes JIKA TABEL SUDAH ADA SEBELUMNYA
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'commodities' 
      AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE public.commodities ADD COLUMN admin_notes TEXT;
  END IF;

  -- Set default status ke 'Menunggu Persetujuan'
  ALTER TABLE public.commodities ALTER COLUMN status SET DEFAULT 'Menunggu Persetujuan';
END $$;

-- 3. AKTIFKAN ROW LEVEL SECURITY (RLS) & POLICY AKSES
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Semua pengguna (public/anon/authenticated) bisa melihat komoditas
DROP POLICY IF EXISTS "Commodities are viewable by everyone" ON public.commodities;
CREATE POLICY "Commodities are viewable by everyone" 
  ON public.commodities FOR SELECT USING (true);

-- Policy INSERT: Pengguna terautentikasi maupun anon (demo mode) bisa menambah komoditas
DROP POLICY IF EXISTS "Authenticated users can insert commodities" ON public.commodities;
DROP POLICY IF EXISTS "Users can insert commodities" ON public.commodities;
CREATE POLICY "Users can insert commodities" 
  ON public.commodities FOR INSERT WITH CHECK (true);

-- Policy UPDATE: Pemilik komoditas atau Admin dapat memperbarui komoditas & status
DROP POLICY IF EXISTS "Farmers can update their own commodities" ON public.commodities;
DROP POLICY IF EXISTS "Farmers and admins can update commodities" ON public.commodities;
CREATE POLICY "Farmers and admins can update commodities" 
  ON public.commodities FOR UPDATE USING (true);

-- Policy DELETE: Pemilik komoditas atau Admin dapat menghapus komoditas
DROP POLICY IF EXISTS "Farmers can delete their own commodities" ON public.commodities;
DROP POLICY IF EXISTS "Farmers and admins can delete commodities" ON public.commodities;
CREATE POLICY "Farmers and admins can delete commodities" 
  ON public.commodities FOR DELETE USING (true);

-- 4. AKTIFKAN REPLICA IDENTITY FULL AGAR REALTIME DAPAT MEMANTAU UPDATE/DELETE
ALTER TABLE public.commodities REPLICA IDENTITY FULL;

-- Tambahkan tabel commodities ke publication supabase_realtime jika belum ada
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

-- 5. SEED / PERBARUI DATA DUMMY KE AKUN DEMO PETANI (Hengky Mandagi, S.P.)
-- ID Demo Petani: a1111111-1111-1111-1111-111111111111
DO $$
DECLARE
  v_demo_farmer_id UUID := 'a1111111-1111-1111-1111-111111111111';
BEGIN
  -- Periksa apakah profil demo petani ada
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_demo_farmer_id) THEN
    -- Masukkan profil demo jika belum ada
    INSERT INTO public.profiles (
      id, role, full_name, phone, group_name, leader_name, location, kyc_status
    ) VALUES (
      v_demo_farmer_id, 'petani', 'Hengky Mandagi, S.P.', '0812-4321-8765',
      'Poktan Ranowangko Langowan', 'Hengky Mandagi, S.P.', 'Kec. Langowan Timur, Minahasa', 'verified'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Update farmer_id pada komoditas yang belum memiliki farmer_id
  UPDATE public.commodities 
  SET farmer_id = v_demo_farmer_id 
  WHERE farmer_id IS NULL;

  -- Jika tabel commodities masih kosong, masukkan data awal dummy
  IF NOT EXISTS (SELECT 1 FROM public.commodities LIMIT 1) THEN
    INSERT INTO public.commodities (
      farmer_id, name, category, farmer_group, farmer_leader, location, distance_info, 
      stock_ton, min_order_ton, price_per_kg, quality_grade, harvest_type, harvest_date, 
      status, admin_notes, rating, reviews_count, image_url, description
    ) VALUES
      (
        v_demo_farmer_id,
        'Cengkeh Zanzibar Kering Sikotok Super', 
        'Perkebunan', 
        'Poktan Ranowangko Langowan', 
        'Hengky Mandagi, S.P.', 
        'Gudang Sentral Walantakan, Langowan Timur, Minahasa', 
        '18 km dari Gudang Kawangkoan', 
        25, 1, 125000, 
        'Grade A Sikotok (KA < 12%, Bunga Utuh Harum)', 
        'Siap Diambil di Gudang', 
        'Panen Agustus 2026', 
        'Aktif', 
        'Disetujui tampil di katalog utama pembeli.',
        4.9, 38, 
        'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80', 
        'Cengkeh Zanzibar kualitas terbaik Langowan Minahasa, dipetik matang pohon, dijemur alami higienis. Aroma eugenol tinggi standar ekspor.'
      ),
      (
        v_demo_farmer_id,
        'Kopra Putih Kering Standar Ekspor (KA 6%)', 
        'Perkebunan', 
        'Koperasi Kelapa Pesisir Kombi', 
        'Welly Walangitan', 
        'Sentra Pengeringan Kelapa Kombi, Minahasa', 
        '35 km dari Gudang Kawangkoan', 
        45, 5, 13800, 
        'Grade Super Ekspor (Oven Kering, KA 6%)', 
        'Siap Diambil di Gudang', 
        'Panen September 2026', 
        'Aktif', 
        'Disetujui tampil di katalog utama pembeli.',
        4.7, 26, 
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', 
        'Kopra putih oven berkualitas tinggi dari sentra kelapa Kombi Minahasa. Cocok untuk pabrik minyak kelapa murni dan ekspor.'
      ),
      (
        v_demo_farmer_id,
        'Beras Premium Superwin Danau Tondano', 
        'Padi & Beras', 
        'Poktan Danau Tondano', 
        'Frits Rumagit', 
        'Rice Milling Unit Lembah Kakas, Minahasa', 
        '22 km dari Gudang Kawangkoan', 
        35, 3, 15200, 
        'Premium Minahasa (Pecahan < 5%, Sosoh 98%)', 
        'Siap Diambil di Gudang', 
        'Panen Agustus 2026', 
        'Aktif', 
        'Disetujui tampil di katalog utama pembeli.',
        4.8, 45, 
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', 
        'Beras Superwin langsung dari RMU Tondano Minahasa. Bersih, pulen, warna putih alami tanpa bahan pemutih kimia.'
      ),
      (
        v_demo_farmer_id,
        'Jagung Pipil Kering Hibrida Kakas', 
        'Biji-Bijian & Palawija', 
        'Poktan Tou Kakas Mandiri', 
        'Jemmy Rondonuwu', 
        'Gudang Silo Tompaso Barat, Minahasa', 
        '15 km dari Gudang Kawangkoan', 
        60, 10, 5400, 
        'Standar Industri Pakan (KA 14%, Bebas Aflatoksin)', 
        'Siap Diambil di Gudang', 
        'Panen September 2026', 
        'Aktif', 
        'Disetujui tampil di katalog utama pembeli.',
        4.6, 19, 
        'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80', 
        'Jagung hibrida kering pipil terstandarisasi untuk pakan ternak dan industri pati. Disimpan dalam silo berventilasi modern di Kakas.'
      ),
      (
        v_demo_farmer_id,
        'Cabai Rawit Merah (Rica Minahasa) Segar', 
        'Hortikultura & Sayur', 
        'Poktan Horti Sinisir Modoinding', 
        'Maikel Pongoh', 
        'Lahan Hortikultura Modoinding, Minahasa', 
        '48 km dari Gudang Kawangkoan', 
        8, 1, 48000, 
        'Grade Super (Segar Petik Pagi, Pedas Maksimal)', 
        'Menunggu Persetujuan Admin', 
        'Estimasi 18 September 2026', 
        'Menunggu Persetujuan', 
        'Menunggu peninjauan dan validasi oleh Admin.',
        4.9, 52, 
        'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', 
        'Rica Minahasa petik pagi segar untuk pasokan industri bumbu olahan dan katering. Kadar capsaicin tinggi khas Modoinding.'
      ),
      (
        v_demo_farmer_id,
        'Kentang Granola Modoinding Super', 
        'Hortikultura & Sayur', 
        'Gapoktan Modoinding Sejahtera', 
        'Arnold Lumempow', 
        'Sentra Hortikultura Sinisir, Minahasa', 
        '48 km dari Gudang Kawangkoan', 
        30, 2, 14500, 
        'Grade AB Pilihan (Umbi Padat Bersih)', 
        'Siap Diambil di Gudang', 
        'Panen September 2026', 
        'Tidak Aktif', 
        'Ditolak: Kualitas panen atau dokumen belum memenuhi standar.',
        4.8, 31, 
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', 
        'Kentang Granola unggulan sentra hortikultura dataran tinggi Modoinding Minahasa. Umbi padat berdaging kuning cerah.'
      );
  END IF;
END $$;
