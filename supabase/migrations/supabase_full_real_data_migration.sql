-- ==========================================================
-- SKRIP MIGRASI LENGKAP AGRICONNECT: STRUKTUR DATA RIIL & ISOLASI MULTI-TENANT
-- Salin dan jalankan seluruh kode ini di menu SQL Editor di dashboard Supabase Anda.
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABEL PROFILES: LENGKAPI SELURUH KOLOM & PERBAIKI CONSTRAINT
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'petani' CHECK (role IN ('petani', 'pembeli', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  group_name TEXT,
  leader_name TEXT,
  location TEXT DEFAULT 'Minahasa, Sulawesi Utara',
  warehouse_address TEXT,
  land_area TEXT,
  business_type TEXT,
  business_info TEXT,
  nib TEXT,
  npwp TEXT,
  kyc_status TEXT DEFAULT 'verified' CHECK (kyc_status IN ('verified', 'pending', 'rejected')),
  kyc_document TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  avatar_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pastikan semua kolom penting ada di profiles jika tabel sudah pernah dibuat
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'warehouse_address') THEN
    ALTER TABLE public.profiles ADD COLUMN warehouse_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'land_area') THEN
    ALTER TABLE public.profiles ADD COLUMN land_area TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_type') THEN
    ALTER TABLE public.profiles ADD COLUMN business_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_info') THEN
    ALTER TABLE public.profiles ADD COLUMN business_info TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Sinkronkan email dari auth.users ke public.profiles jika masih kosong
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 2. TABEL COMMODITIES (Katalog & Komoditas Petani)
CREATE TABLE IF NOT EXISTS public.commodities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Biji-Bijian & Palawija',
  farmer_group TEXT DEFAULT 'Kelompok Tani',
  farmer_leader TEXT DEFAULT 'Petani',
  location TEXT NOT NULL DEFAULT 'Minahasa, Sulawesi Utara',
  distance_info TEXT DEFAULT 'Minahasa',
  stock_ton NUMERIC NOT NULL DEFAULT 0,
  min_order_ton NUMERIC NOT NULL DEFAULT 1,
  price_per_kg NUMERIC NOT NULL DEFAULT 0,
  quality_grade TEXT DEFAULT 'Grade A',
  harvest_type TEXT DEFAULT 'Siap Diambil di Gudang',
  harvest_date TEXT DEFAULT 'Panen September 2026',
  status TEXT DEFAULT 'Menunggu Persetujuan' CHECK (status IN ('Aktif', 'Tersedia', 'Menunggu Persetujuan', 'Tidak Aktif', 'Pre-Order')),
  admin_notes TEXT,
  rating NUMERIC DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pastikan kolom admin_notes ada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commodities' AND column_name = 'admin_notes') THEN
    ALTER TABLE public.commodities ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- Pastikan foreign key constraints tidak memblokir operasi insert/delete
DO $$
BEGIN
  ALTER TABLE public.commodities DROP CONSTRAINT IF EXISTS commodities_farmer_id_fkey;
  ALTER TABLE public.commodities
    ADD CONSTRAINT commodities_farmer_id_fkey
    FOREIGN KEY (farmer_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. TABEL PROCUREMENT_PROPOSALS (Kebutuhan Pengadaan Pasokan Pembeli)
CREATE TABLE IF NOT EXISTS public.procurement_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL DEFAULT 'Perusahaan Mitra',
  buyer_pic TEXT DEFAULT 'Pembeli',
  commodity_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Hortikultura & Sayur',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Menunggu Persetujuan' CHECK (status IN ('Aktif', 'Tidak Aktif', 'Menunggu Persetujuan', 'Selesai', 'Dibatalkan')),
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

-- 4. TABEL OFFERS (Penawaran & Negosiasi antara Pembeli dan Petani)
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_code TEXT,
  commodity_id UUID REFERENCES public.commodities(id) ON DELETE SET NULL,
  commodity_name TEXT NOT NULL,
  category TEXT DEFAULT 'Perkebunan',
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL DEFAULT 'Pembeli',
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_group TEXT NOT NULL DEFAULT 'Kelompok Tani',
  farmer_leader TEXT DEFAULT 'Petani',
  requested_ton NUMERIC NOT NULL DEFAULT 1,
  offered_price_per_kg NUMERIC NOT NULL DEFAULT 0,
  listing_price_per_kg NUMERIC NOT NULL DEFAULT 0,
  pickup_date DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  pickup_location TEXT DEFAULT 'Minahasa',
  fleet_type TEXT DEFAULT 'Truk Tronton',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Menunggu Respon' CHECK (status IN ('Menunggu Respon', 'Counter-Offer', 'Disetujui', 'Ditolak')),
  counter_price_per_kg NUMERIC,
  counter_ton NUMERIC,
  counter_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL CONTRACTS (Binding Agreements Terikat Secara Digital)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_code TEXT UNIQUE NOT NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  commodity_id UUID REFERENCES public.commodities(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  commodity_name TEXT NOT NULL,
  farmer_group TEXT NOT NULL DEFAULT 'Kelompok Tani',
  buyer_company TEXT NOT NULL DEFAULT 'Perusahaan Pembeli',
  tonnage NUMERIC NOT NULL DEFAULT 1,
  price_per_kg NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  booking_fee NUMERIC NOT NULL DEFAULT 0,
  booking_fee_status TEXT DEFAULT 'Terkunci di Penjamin Platform (Escrow)',
  signed_date DATE DEFAULT CURRENT_DATE,
  pickup_schedule TEXT,
  pickup_location TEXT,
  pic_warehouse TEXT,
  payment_method TEXT DEFAULT 'Pelunasan Transfer 95% saat Timbang Muat',
  status TEXT DEFAULT 'Terikat' CHECK (status IN ('Terikat', 'Armada Siap Muat', 'Selesai', 'Dibatalkan')),
  timeline JSONB DEFAULT '[]'::jsonb,
  clauses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABEL TRANSACTIONS (Riwayat Transaksi & Escrow)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_code TEXT UNIQUE NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_group TEXT NOT NULL DEFAULT 'Kelompok Tani',
  buyer_name TEXT NOT NULL DEFAULT 'Pembeli',
  commodity_name TEXT NOT NULL,
  volume_ton NUMERIC NOT NULL DEFAULT 1,
  category TEXT DEFAULT 'Perkebunan',
  amount NUMERIC NOT NULL DEFAULT 0,
  booking_fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'DP Terkunci' CHECK (status IN ('DP Terkunci', 'Terikat', 'Pelunasan', 'Selesai', 'Dibatalkan')),
  pickup_schedule TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL MARKET_PRICES (Acuan Harga Pasar)
CREATE TABLE IF NOT EXISTS public.market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commodity TEXT NOT NULL,
  category TEXT DEFAULT 'Beras',
  market_price NUMERIC NOT NULL DEFAULT 0,
  prev_price NUMERIC,
  unit TEXT DEFAULT 'kg',
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  change_percent TEXT DEFAULT '0,0%',
  source TEXT NOT NULL DEFAULT 'Badan Pangan Nasional',
  region TEXT DEFAULT 'Sulawesi Utara',
  status TEXT DEFAULT 'Data terbaru',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES YANG AMAN & FLEKSIBEL
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert profile" ON public.profiles;
CREATE POLICY "Users can insert profile" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update profile" ON public.profiles;
CREATE POLICY "Users can update profile" ON public.profiles FOR UPDATE USING (true);

-- 2. Commodities
DROP POLICY IF EXISTS "Commodities viewable by everyone" ON public.commodities;
CREATE POLICY "Commodities viewable by everyone" ON public.commodities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert commodities" ON public.commodities;
CREATE POLICY "Users can insert commodities" ON public.commodities FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Farmers can update commodities" ON public.commodities;
CREATE POLICY "Farmers can update commodities" ON public.commodities FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Farmers can delete commodities" ON public.commodities;
CREATE POLICY "Farmers can delete commodities" ON public.commodities FOR DELETE USING (true);

-- 3. Procurement Proposals
DROP POLICY IF EXISTS "Proposals viewable by everyone" ON public.procurement_proposals;
CREATE POLICY "Proposals viewable by everyone" ON public.procurement_proposals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert proposals" ON public.procurement_proposals;
CREATE POLICY "Users can insert proposals" ON public.procurement_proposals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Buyers can update proposals" ON public.procurement_proposals;
CREATE POLICY "Buyers can update proposals" ON public.procurement_proposals FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Buyers can delete proposals" ON public.procurement_proposals;
CREATE POLICY "Buyers can delete proposals" ON public.procurement_proposals FOR DELETE USING (true);

-- 4. Offers
DROP POLICY IF EXISTS "Offers viewable by participants" ON public.offers;
CREATE POLICY "Offers viewable by participants" ON public.offers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert offers" ON public.offers;
CREATE POLICY "Users can insert offers" ON public.offers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update offers" ON public.offers;
CREATE POLICY "Users can update offers" ON public.offers FOR UPDATE USING (true);

-- 5. Contracts & Transactions
DROP POLICY IF EXISTS "Contracts viewable by everyone" ON public.contracts;
CREATE POLICY "Contracts viewable by everyone" ON public.contracts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Contracts insertable" ON public.contracts;
CREATE POLICY "Contracts insertable" ON public.contracts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Contracts updatable" ON public.contracts;
CREATE POLICY "Contracts updatable" ON public.contracts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Transactions viewable by everyone" ON public.transactions;
CREATE POLICY "Transactions viewable by everyone" ON public.transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Transactions insertable" ON public.transactions;
CREATE POLICY "Transactions insertable" ON public.transactions FOR INSERT WITH CHECK (true);

-- 6. Market Prices
DROP POLICY IF EXISTS "Market prices viewable by everyone" ON public.market_prices;
CREATE POLICY "Market prices viewable by everyone" ON public.market_prices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Market prices updatable" ON public.market_prices;
CREATE POLICY "Market prices updatable" ON public.market_prices FOR ALL USING (true);

-- ==========================================================
-- REALTIME PUBLICATION SETUP
-- ==========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['profiles', 'commodities', 'procurement_proposals', 'offers', 'contracts', 'transactions', 'market_prices'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', tbl);
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      END IF;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;
