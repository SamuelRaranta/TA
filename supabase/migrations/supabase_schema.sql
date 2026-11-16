-- ==========================================================
-- SKEMA DATABASE AGRICONNECT / TANIG (SUPABASE POSTGRESQL)
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- TABEL 1: PROFILES (Akun Pengguna: Petani, Pembeli, Admin)
-- ==========================================================
-- Skema ramping (lihat supabase_slim_profiles.sql): kolom tak terpakai
-- (brand_name, bank_*, kyc_document, nib, npwp, leader_name,
-- warehouse_address, business_*, land_area, rating,
-- company_name, group_name) sudah dihapus.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('petani', 'pembeli', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,                  -- Wilayah/Kecamatan
  avatar_url TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('verified', 'pending', 'rejected')),
  notification_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- TABEL 2: COMMODITIES (Katalog Produk / Komoditas Petani)
-- ==========================================================
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
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Tersedia', 'Menunggu Persetujuan', 'Tidak Aktif', 'Pre-Order')),
  rating NUMERIC DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- TABEL 3: BUYER_PROPOSALS (Proposal Kebutuhan Pasokan Pembeli)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.buyer_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  commodity_name TEXT NOT NULL,
  category TEXT NOT NULL,
  requested_kg NUMERIC NOT NULL,
  offered_price_per_kg NUMERIC NOT NULL,
  total_budget NUMERIC,
  target TEXT DEFAULT 'Semua Petani',
  location TEXT,
  valid_until DATE,
  specifications TEXT,
  status TEXT DEFAULT 'Menunggu Persetujuan' CHECK (status IN ('Menunggu Persetujuan', 'Aktif', 'Tidak Aktif', 'Selesai', 'Dibatalkan')),
  status_detail TEXT DEFAULT 'Menunggu Persetujuan Admin',
  rejection_reason TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- TABEL 4: OFFERS (Negosiasi & Penawaran dari Pembeli ke Petani)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commodity_id UUID REFERENCES public.commodities(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_ton NUMERIC NOT NULL,
  offered_price_per_kg NUMERIC NOT NULL,
  listing_price_per_kg NUMERIC NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Menunggu Respon' CHECK (status IN ('Menunggu Respon', 'Counter-Offer', 'Disetujui', 'Ditolak')),
  counter_price_per_kg NUMERIC,
  counter_ton NUMERIC,
  counter_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- TABEL 5: CONTRACTS (Digital Binding Agreement)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_code TEXT UNIQUE NOT NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  commodity_id UUID REFERENCES public.commodities(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  commodity_name TEXT NOT NULL,
  tonnage NUMERIC NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  booking_fee NUMERIC NOT NULL,      -- 5% Escrow
  booking_fee_status TEXT DEFAULT 'Terkunci di Penjamin Platform (Escrow)',
  signed_date DATE DEFAULT CURRENT_DATE,
  pickup_schedule TEXT,
  pickup_location TEXT,
  pic_warehouse TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'Terikat' CHECK (status IN ('Terikat', 'Armada Siap Muat', 'Selesai', 'Dibatalkan')),
  timeline JSONB DEFAULT '[]'::jsonb,
  clauses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- TABEL 6: TRANSACTIONS (Riwayat Transaksi)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_code TEXT UNIQUE NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_group TEXT,
  commodity_name TEXT NOT NULL,
  volume_ton NUMERIC NOT NULL,
  category TEXT,
  amount NUMERIC NOT NULL,
  booking_fee NUMERIC NOT NULL,
  status TEXT DEFAULT 'DP Terkunci' CHECK (status IN ('DP Terkunci', 'Terikat', 'Pelunasan', 'Selesai', 'Dibatalkan')),
  pickup_schedule TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- TABEL 7: MARKET_PRICES (Acuan Harga Pasar Nasional & Minahasa)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commodity TEXT NOT NULL,
  source TEXT NOT NULL,
  market_price NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  trend TEXT DEFAULT 'up' CHECK (trend IN ('up', 'down', 'stable')),
  change_amount NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- 1. Policies untuk PROFILES
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Policies untuk COMMODITIES
CREATE POLICY "Commodities are viewable by everyone" 
  ON public.commodities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert commodities" 
  ON public.commodities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Farmers can update their own commodities" 
  ON public.commodities FOR UPDATE USING (auth.uid() = farmer_id);
CREATE POLICY "Farmers can delete their own commodities" 
  ON public.commodities FOR DELETE USING (auth.uid() = farmer_id);

-- 3. Policies untuk BUYER_PROPOSALS
CREATE POLICY "Proposals are viewable by everyone" 
  ON public.buyer_proposals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert proposals" 
  ON public.buyer_proposals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Buyers can update their own proposals" 
  ON public.buyer_proposals FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can delete their own proposals" 
  ON public.buyer_proposals FOR DELETE USING (auth.uid() = buyer_id);

-- 4. Policies untuk OFFERS
CREATE POLICY "Offers are viewable by buyer and farmer involved" 
  ON public.offers FOR SELECT USING (true);
CREATE POLICY "Buyers can insert offers" 
  ON public.offers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Participants can update offers" 
  ON public.offers FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

-- 5. Policies untuk CONTRACTS
CREATE POLICY "Contracts are viewable by participants" 
  ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert contracts" 
  ON public.contracts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Policies untuk TRANSACTIONS
CREATE POLICY "Transactions are viewable by participants" 
  ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert transactions" 
  ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Policies untuk MARKET_PRICES
CREATE POLICY "Market prices are viewable by everyone" 
  ON public.market_prices FOR SELECT USING (true);

-- ==========================================================
-- INITIAL DATA SEED (DATA AWAL CONTOH UNTUK TESTING)
-- ==========================================================

-- Data Acuan Harga Pasar
INSERT INTO public.market_prices (commodity, source, market_price, unit, trend, change_amount) VALUES
  ('Cengkeh Kering Super', 'ASPEKINDO Minahasa', 125000, 'kg', 'up', 1500),
  ('Kopra Putih Standar Ekspor', 'Distanbun Minahasa', 13800, 'kg', 'up', 250),
  ('Beras Superwin Tondano', 'Pasar Sentral Kakas', 15200, 'kg', 'stable', 0),
  ('Jagung Pipil Pakan KA 14%', 'Bapanas Sulut', 5400, 'kg', 'down', -100),
  ('Cabai Rawit Merah Modoinding', 'Pasar Langowan', 48000, 'kg', 'up', 2000),
  ('Kentang Granola Modoinding', 'Pasar Modoinding', 14500, 'kg', 'stable', 0)
ON CONFLICT DO NOTHING;

-- Data Katalog Komoditas Awal
INSERT INTO public.commodities (name, category, farmer_group, farmer_leader, location, distance_info, stock_ton, min_order_ton, price_per_kg, quality_grade, harvest_type, harvest_date, status, rating, reviews_count, image_url, description) VALUES
  ('Cengkeh Zanzibar Kering Sikotok Super', 'Perkebunan', 'Poktan Ranowangko Langowan', 'Hengky Mandagi, S.P.', 'Kec. Langowan Timur, Kab. Minahasa', '18 km dari Gudang Kawangkoan', 25, 1, 125000, 'Grade A Sikotok (KA < 12%, Bunga Utuh Harum)', 'Siap Muat di Gudang', 'Panen Agustus 2026', 'Tersedia', 4.9, 38, 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80', 'Cengkeh Zanzibar kualitas terbaik Langowan Minahasa, dipetik matang pohon, dijemur alami higienis. Aroma eugenol tinggi standar ekspor.'),
  ('Kopra Putih Kering Standar Ekspor (KA 6%)', 'Perkebunan', 'Koperasi Kelapa Pesisir Kombi', 'Welly Walangitan', 'Kec. Kombi, Kab. Minahasa', '35 km dari Gudang Kawangkoan', 50, 5, 13800, 'Grade Super Ekspor (Oven Kering, KA 6%)', 'Siap Muat di Gudang', 'Panen September 2026', 'Tersedia', 4.7, 26, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', 'Kopra putih oven berkualitas tinggi dari sentra kelapa Kombi Minahasa. Cocok untuk pabrik minyak kelapa murni dan ekspor.'),
  ('Beras Premium Superwin Danau Tondano', 'Padi & Beras', 'Poktan Danau Tondano', 'Frits Rumagit', 'Kec. Tondano Barat, Kab. Minahasa', '22 km dari Gudang Kawangkoan', 40, 3, 15200, 'Premium Minahasa (Pecahan < 5%, Sosoh 98%)', 'Siap Muat di Gudang', 'Panen Agustus 2026', 'Tersedia', 4.8, 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', 'Beras Superwin langsung dari RMU Tondano Minahasa. Bersih, pulen, warna putih alami tanpa bahan pemutih kimia.'),
  ('Jagung Pipil Kering Hibrida Kakas (KA 14%)', 'Biji-Bijian & Palawija', 'Poktan Tou Kakas Mandiri', 'Jemmy Rondonuwu', 'Kec. Kakas Barat, Kab. Minahasa', '15 km dari Gudang Kawangkoan', 70, 10, 5400, 'Standar Industri Pakan (KA 14%, Bebas Aflatoksin)', 'Siap Muat di Gudang', 'Panen September 2026', 'Tersedia', 4.6, 19, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80', 'Jagung hibrida kering pipil terstandarisasi untuk pakan ternak dan industri pati. Disimpan dalam silo berventilasi modern di Kakas.'),
  ('Cabai Rawit Merah (Rica Minahasa) Segar', 'Hortikultura & Sayur', 'Poktan Horti Sinisir Modoinding', 'Maikel Pongoh', 'Kec. Modoinding, Kab. Minahasa', '48 km dari Gudang Kawangkoan', 10, 1, 48000, 'Grade Super (Segar Petik Pagi, Pedas Maksimal)', 'Pre-Order (Panen 3 Hari Lagi)', 'Estimasi 18 September 2026', 'Pre-Order', 4.9, 52, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', 'Rica Minahasa petik pagi segar untuk pasokan industri bumbu olahan dan katering. Kadar capsaicin tinggi khas Modoinding.'),
  ('Kentang Granola Modoinding Super', 'Hortikultura & Sayur', 'Gapoktan Modoinding Sejahtera', 'Arnold Lumempow', 'Kec. Modoinding, Kab. Minahasa', '48 km dari Gudang Kawangkoan', 35, 2, 14500, 'Grade AB Pilihan (Umbi Padat Bersih)', 'Siap Muat di Gudang', 'Panen September 2026', 'Tersedia', 4.8, 31, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', 'Kentang Granola unggulan sentra hortikultura dataran tinggi Modoinding Minahasa. Umbi padat berdaging kuning cerah.')
ON CONFLICT DO NOTHING;
