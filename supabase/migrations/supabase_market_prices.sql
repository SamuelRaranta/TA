-- =============================================================================
-- SKEMA DATABASE HARGA PASAR & HISTORI HARGA (SUPABASE POSTGRESQL)
-- =============================================================================
-- Jalankan script ini di menu "SQL Editor" pada dashboard Supabase Anda.

-- 1. Aktifkan ekstensi UUID jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Hapus tabel lama jika ada agar seluruh kolom baru terpasang sempurna
DROP TABLE IF EXISTS public.market_price_history CASCADE;
DROP TABLE IF EXISTS public.market_prices CASCADE;

-- =============================================================================
-- TABEL 1: public.market_prices (Acuan Harga Pasar Utama & Cache Grafik)
-- =============================================================================
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Beras',
  market_price NUMERIC NOT NULL,
  prev_price NUMERIC,
  unit TEXT DEFAULT 'kg',
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  change_percent TEXT DEFAULT '0,0%',
  source TEXT NOT NULL,
  region TEXT DEFAULT 'Sulawesi Utara',
  status TEXT DEFAULT 'Data terbaru',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_date TEXT DEFAULT '19 September 2026',
  updated_time TEXT DEFAULT '10:30 WIB',
  history_7d JSONB DEFAULT '[]'::jsonb,
  history_30d JSONB DEFAULT '[]'::jsonb,
  history_90d JSONB DEFAULT '[]'::jsonb
);

-- =============================================================================
-- TABEL 2: public.market_price_history (Log Audit & Histori Harga Harian)
-- =============================================================================
CREATE TABLE public.market_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_price_id UUID REFERENCES public.market_prices(id) ON DELETE CASCADE,
  price_date DATE NOT NULL DEFAULT CURRENT_DATE,
  price NUMERIC NOT NULL,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing untuk query cepat
CREATE INDEX IF NOT EXISTS idx_market_prices_commodity ON public.market_prices(commodity);
CREATE INDEX IF NOT EXISTS idx_market_prices_category ON public.market_prices(category);
CREATE INDEX IF NOT EXISTS idx_market_prices_source ON public.market_prices(source);
CREATE INDEX IF NOT EXISTS idx_market_price_history_mp_id ON public.market_price_history(market_price_id);
CREATE INDEX IF NOT EXISTS idx_market_price_history_date ON public.market_price_history(price_date);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_history ENABLE ROW LEVEL SECURITY;

-- Policy: Siapapun (publik/anon dan user login) dapat membaca data harga pasar
CREATE POLICY "Enable select for all on market_prices"
  ON public.market_prices FOR SELECT
  USING (true);

CREATE POLICY "Enable select for all on market_price_history"
  ON public.market_price_history FOR SELECT
  USING (true);

-- Policy: Izin insert, update, delete untuk operasi admin
CREATE POLICY "Enable insert for all on market_prices"
  ON public.market_prices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all on market_prices"
  ON public.market_prices FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all on market_prices"
  ON public.market_prices FOR DELETE
  USING (true);

CREATE POLICY "Enable insert for all on market_price_history"
  ON public.market_price_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable delete for all on market_price_history"
  ON public.market_price_history FOR DELETE
  USING (true);

-- =============================================================================
-- SEED DATA AWAL (9 Komoditas Acuan Pasar Lengkap dengan Histori Grafik)
-- =============================================================================
INSERT INTO public.market_prices (
  commodity, category, market_price, prev_price, unit, trend, change_percent, 
  source, region, status, updated_at, updated_date, updated_time,
  history_7d, history_30d, history_90d
) VALUES
-- 1. Tomat
(
  'Tomat',
  'Hortikultura',
  12500,
  11500,
  'kg',
  'up',
  '+8,7%',
  'Badan Pangan Nasional',
  'Minahasa (Modoinding & Tompaso)',
  'Data terbaru',
  now(),
  '19 September 2026',
  '10:30 WIB',
  '[{"date":"13 Sep","fullDate":"13 September 2026","price":11000},{"date":"14 Sep","fullDate":"14 September 2026","price":11200},{"date":"15 Sep","fullDate":"15 September 2026","price":11200},{"date":"16 Sep","fullDate":"16 September 2026","price":11500},{"date":"17 Sep","fullDate":"17 September 2026","price":11300},{"date":"18 Sep","fullDate":"18 September 2026","price":11500},{"date":"19 Sep","fullDate":"19 September 2026","price":12500}]'::jsonb,
  '[{"date":"21 Agu","fullDate":"21 Agustus 2026","price":10200},{"date":"25 Agu","fullDate":"25 Agustus 2026","price":10500},{"date":"29 Agu","fullDate":"29 Agustus 2026","price":10800},{"date":"02 Sep","fullDate":"02 September 2026","price":10600},{"date":"06 Sep","fullDate":"06 September 2026","price":11000},{"date":"10 Sep","fullDate":"10 September 2026","price":11100},{"date":"14 Sep","fullDate":"14 September 2026","price":11200},{"date":"18 Sep","fullDate":"18 September 2026","price":11500},{"date":"19 Sep","fullDate":"19 September 2026","price":12500}]'::jsonb,
  '[{"date":"20 Jun","fullDate":"20 Juni 2026","price":9800},{"date":"05 Jul","fullDate":"05 Juli 2026","price":10100},{"date":"20 Jul","fullDate":"20 Juli 2026","price":10300},{"date":"05 Agu","fullDate":"05 Agustus 2026","price":10200},{"date":"20 Agu","fullDate":"20 Agustus 2026","price":10400},{"date":"05 Sep","fullDate":"05 September 2026","price":10900},{"date":"15 Sep","fullDate":"15 September 2026","price":11200},{"date":"19 Sep","fullDate":"19 September 2026","price":12500}]'::jsonb
),
-- 2. Cengkeh Zanzibar
(
  'Cengkeh Zanzibar Kering Langowan',
  'Perkebunan',
  125000,
  122000,
  'kg',
  'up',
  '+2,5%',
  'ASPEKINDO Minahasa',
  'Minahasa (Langowan, Sonder, Kawangkoan)',
  'Data terbaru',
  now(),
  '19 September 2026',
  '06:00 WITA',
  '[{"date":"13 Sep","fullDate":"13 September 2026","price":121000},{"date":"14 Sep","fullDate":"14 September 2026","price":121500},{"date":"15 Sep","fullDate":"15 September 2026","price":122000},{"date":"16 Sep","fullDate":"16 September 2026","price":122000},{"date":"17 Sep","fullDate":"17 September 2026","price":121800},{"date":"18 Sep","fullDate":"18 September 2026","price":122000},{"date":"19 Sep","fullDate":"19 September 2026","price":125000}]'::jsonb,
  '[{"date":"21 Agu","fullDate":"21 Agustus 2026","price":118000},{"date":"28 Agu","fullDate":"28 Agustus 2026","price":119500},{"date":"04 Sep","fullDate":"04 September 2026","price":120500},{"date":"11 Sep","fullDate":"11 September 2026","price":121500},{"date":"18 Sep","fullDate":"18 September 2026","price":122000},{"date":"19 Sep","fullDate":"19 September 2026","price":125000}]'::jsonb,
  '[{"date":"20 Jun","fullDate":"20 Juni 2026","price":114000},{"date":"10 Jul","fullDate":"10 Juli 2026","price":116000},{"date":"01 Agu","fullDate":"01 Agustus 2026","price":117500},{"date":"20 Agu","fullDate":"20 Agustus 2026","price":118000},{"date":"10 Sep","fullDate":"10 September 2026","price":121000},{"date":"19 Sep","fullDate":"19 September 2026","price":125000}]'::jsonb
),
-- 3. Kopra Putih
(
  'Kopra Putih Kering Kombi (KA 6%)',
  'Perkebunan',
  13800,
  13500,
  'kg',
  'up',
  '+2,2%',
  'Dinas Pertanian Minahasa (Distanbun)',
  'Minahasa (Kombi, Lembean Timur)',
  'Data terbaru',
  now(),
  '19 September 2026',
  '06:00 WITA',
  '[{"date":"13 Sep","fullDate":"13 September 2026","price":13200},{"date":"14 Sep","fullDate":"14 September 2026","price":13300},{"date":"15 Sep","fullDate":"15 September 2026","price":13400},{"date":"16 Sep","fullDate":"16 September 2026","price":13450},{"date":"17 Sep","fullDate":"17 September 2026","price":13500},{"date":"18 Sep","fullDate":"18 September 2026","price":13500},{"date":"19 Sep","fullDate":"19 September 2026","price":13800}]'::jsonb,
  '[{"date":"21 Agu","fullDate":"21 Agustus 2026","price":12800},{"date":"28 Agu","fullDate":"28 Agustus 2026","price":13000},{"date":"04 Sep","fullDate":"04 September 2026","price":13150},{"date":"11 Sep","fullDate":"11 September 2026","price":13350},{"date":"18 Sep","fullDate":"18 September 2026","price":13500},{"date":"19 Sep","fullDate":"19 September 2026","price":13800}]'::jsonb,
  '[{"date":"20 Jun","fullDate":"20 Juni 2026","price":12200},{"date":"15 Jul","fullDate":"15 Juli 2026","price":12500},{"date":"10 Agu","fullDate":"10 Agustus 2026","price":12700},{"date":"01 Sep","fullDate":"01 September 2026","price":13100},{"date":"19 Sep","fullDate":"19 September 2026","price":13800}]'::jsonb
),
-- 4. Beras Premium Superwin
(
  'Beras Premium Superwin Tondano',
  'Beras',
  15200,
  15100,
  'kg',
  'up',
  '+0,7%',
  'Pasar Tradisional Kawangkoan & Lembah Danau',
  'Minahasa (Tondano & Kakas)',
  'Data terbaru',
  now(),
  '19 September 2026',
  '06:00 WITA',
  '[{"date":"13 Sep","fullDate":"13 September 2026","price":15000},{"date":"14 Sep","fullDate":"14 September 2026","price":15000},{"date":"15 Sep","fullDate":"15 September 2026","price":15050},{"date":"16 Sep","fullDate":"16 September 2026","price":15100},{"date":"17 Sep","fullDate":"17 September 2026","price":15100},{"date":"18 Sep","fullDate":"18 September 2026","price":15100},{"date":"19 Sep","fullDate":"19 September 2026","price":15200}]'::jsonb,
  '[{"date":"21 Agu","fullDate":"21 Agustus 2026","price":14800},{"date":"28 Agu","fullDate":"28 Agustus 2026","price":14900},{"date":"04 Sep","fullDate":"04 September 2026","price":15000},{"date":"11 Sep","fullDate":"11 September 2026","price":15050},{"date":"18 Sep","fullDate":"18 September 2026","price":15100},{"date":"19 Sep","fullDate":"19 September 2026","price":15200}]'::jsonb,
  '[{"date":"20 Jun","fullDate":"20 Juni 2026","price":14500},{"date":"15 Jul","fullDate":"15 Juli 2026","price":14600},{"date":"10 Agu","fullDate":"10 Agustus 2026","price":14750},{"date":"01 Sep","fullDate":"01 September 2026","price":14950},{"date":"19 Sep","fullDate":"19 September 2026","price":15200}]'::jsonb
),
-- 5. Jagung Kuning Pipil
(
  'Jagung Kuning Pipil Kakas (KA 14%)',
  'Jagung & Kedelai',
  5400,
  5450,
  'kg',
  'down',
  '-0,9%',
  'Bapanas Sulut & Pengumpul Pakan Minahasa',
  'Minahasa (Kakas, Tompaso, Eris)',
  'Data terbaru',
  now(),
  '19 September 2026',
  '06:00 WITA',
  '[{"date":"13 Sep","fullDate":"13 September 2026","price":5500},{"date":"14 Sep","fullDate":"14 September 2026","price":5480},{"date":"15 Sep","fullDate":"15 September 2026","price":5450},{"date":"16 Sep","fullDate":"16 September 2026","price":5450},{"date":"17 Sep","fullDate":"17 September 2026","price":5450},{"date":"18 Sep","fullDate":"18 September 2026","price":5450},{"date":"19 Sep","fullDate":"19 September 2026","price":5400}]'::jsonb,
  '[{"date":"21 Agu","fullDate":"21 Agustus 2026","price":5600},{"date":"28 Agu","fullDate":"28 Agustus 2026","price":5550},{"date":"04 Sep","fullDate":"04 September 2026","price":5500},{"date":"11 Sep","fullDate":"11 September 2026","price":5480},{"date":"18 Sep","fullDate":"18 September 2026","price":5450},{"date":"19 Sep","fullDate":"19 September 2026","price":5400}]'::jsonb,
  '[{"date":"20 Jun","fullDate":"20 Juni 2026","price":5750},{"date":"15 Jul","fullDate":"15 Juli 2026","price":5700},{"date":"10 Agu","fullDate":"10 Agustus 2026","price":5650},{"date":"01 Sep","fullDate":"01 September 2026","price":5520},{"date":"19 Sep","fullDate":"19 September 2026","price":5400}]'::jsonb
),
-- 6. Cabai Rawit Merah
(
  'Cabai Rawit Merah (Rica Minahasa)',
  'Bawang & Cabai',
  48500,
  46500,
  'kg',
  'up',
  '+4,3%',
  'Sentra Hortikultura Modoinding',
  'Minahasa (Modoinding & Langowan)',
  'Data terbaru',
  now(),
  '19 September 2026',
  '06:00 WITA',
  '[{"date":"13 Sep","fullDate":"13 September 2026","price":44000},{"date":"14 Sep","fullDate":"14 September 2026","price":45000},{"date":"15 Sep","fullDate":"15 September 2026","price":45500},{"date":"16 Sep","fullDate":"16 September 2026","price":46000},{"date":"17 Sep","fullDate":"17 September 2026","price":46200},{"date":"18 Sep","fullDate":"18 September 2026","price":46500},{"date":"19 Sep","fullDate":"19 September 2026","price":48500}]'::jsonb,
  '[{"date":"21 Agu","fullDate":"21 Agustus 2026","price":41000},{"date":"28 Agu","fullDate":"28 Agustus 2026","price":42500},{"date":"04 Sep","fullDate":"04 September 2026","price":43500},{"date":"11 Sep","fullDate":"11 September 2026","price":44800},{"date":"18 Sep","fullDate":"18 September 2026","price":46500},{"date":"19 Sep","fullDate":"19 September 2026","price":48500}]'::jsonb,
  '[{"date":"20 Jun","fullDate":"20 Juni 2026","price":38000},{"date":"15 Jul","fullDate":"15 Juli 2026","price":39500},{"date":"10 Agu","fullDate":"10 Agustus 2026","price":40500},{"date":"01 Sep","fullDate":"01 September 2026","price":43000},{"date":"19 Sep","fullDate":"19 September 2026","price":48500}]'::jsonb
),
-- 7. Kentang Granola
(
  'Kentang Granola Modoinding Super',
  'Hortikultura',
  14500,
  14500,
  'kg',
  'stable',
  '0,0%',
  'Pasar Tradisional Langowan & Modoinding',
  'Minahasa (Modoinding)',
  'Data terbaru',
  now(),
  '19 September 2026',
  '06:00 WITA',
  '[{"date":"13 Sep","fullDate":"13 September 2026","price":14500},{"date":"14 Sep","fullDate":"14 September 2026","price":14500},{"date":"15 Sep","fullDate":"15 September 2026","price":14500},{"date":"16 Sep","fullDate":"16 September 2026","price":14500},{"date":"17 Sep","fullDate":"17 September 2026","price":14500},{"date":"18 Sep","fullDate":"18 September 2026","price":14500},{"date":"19 Sep","fullDate":"19 September 2026","price":14500}]'::jsonb,
  '[{"date":"21 Agu","fullDate":"21 Agustus 2026","price":14200},{"date":"28 Agu","fullDate":"28 Agustus 2026","price":14400},{"date":"04 Sep","fullDate":"04 September 2026","price":14500},{"date":"11 Sep","fullDate":"11 September 2026","price":14500},{"date":"18 Sep","fullDate":"18 September 2026","price":14500},{"date":"19 Sep","fullDate":"19 September 2026","price":14500}]'::jsonb,
  '[{"date":"20 Jun","fullDate":"20 Juni 2026","price":14000},{"date":"15 Jul","fullDate":"15 Juli 2026","price":14100},{"date":"10 Agu","fullDate":"10 Agustus 2026","price":14300},{"date":"01 Sep","fullDate":"01 September 2026","price":14500},{"date":"19 Sep","fullDate":"19 September 2026","price":14500}]'::jsonb
),
-- 8. Biji Pala Kupas
(
  'Biji Pala Kupas ABCD & Fuli',
  'Perkebunan',
  105000,
  103500,
  'kg',
  'up',
  '+1,4%',
  'Sentra Rempah Sonder Minahasa',
  'Minahasa (Sonder & Tombulu)',
  'Data terbaru',
  now(),
  '19 September 2026',
  '06:00 WITA',
  '[{"date":"13 Sep","fullDate":"13 September 2026","price":102000},{"date":"14 Sep","fullDate":"14 September 2026","price":102500},{"date":"15 Sep","fullDate":"15 September 2026","price":103000},{"date":"16 Sep","fullDate":"16 September 2026","price":103000},{"date":"17 Sep","fullDate":"17 September 2026","price":103200},{"date":"18 Sep","fullDate":"18 September 2026","price":103500},{"date":"19 Sep","fullDate":"19 September 2026","price":105000}]'::jsonb,
  '[{"date":"21 Agu","fullDate":"21 Agustus 2026","price":100000},{"date":"28 Agu","fullDate":"28 Agustus 2026","price":101000},{"date":"04 Sep","fullDate":"04 September 2026","price":102000},{"date":"11 Sep","fullDate":"11 September 2026","price":103000},{"date":"18 Sep","fullDate":"18 September 2026","price":103500},{"date":"19 Sep","fullDate":"19 September 2026","price":105000}]'::jsonb,
  '[{"date":"20 Jun","fullDate":"20 Juni 2026","price":98000},{"date":"15 Jul","fullDate":"15 Juli 2026","price":99000},{"date":"10 Agu","fullDate":"10 Agustus 2026","price":100000},{"date":"01 Sep","fullDate":"01 September 2026","price":101500},{"date":"19 Sep","fullDate":"19 September 2026","price":105000}]'::jsonb
),
-- 9. Kacang Kawangkoan
(
  'Kacang Kawangkoan Sangrai',
  'Jagung & Kedelai',
  32000,
  32000,
  'kg',
  'stable',
  '0,0%',
  'Sentra Kacang Kawangkoan Minahasa',
  'Minahasa (Kawangkoan)',
  'Data terbaru',
  now(),
  '19 September 2026',
  '06:00 WITA',
  '[{"date":"13 Sep","fullDate":"13 September 2026","price":32000},{"date":"14 Sep","fullDate":"14 September 2026","price":32000},{"date":"15 Sep","fullDate":"15 September 2026","price":32000},{"date":"16 Sep","fullDate":"16 September 2026","price":32000},{"date":"17 Sep","fullDate":"17 September 2026","price":32000},{"date":"18 Sep","fullDate":"18 September 2026","price":32000},{"date":"19 Sep","fullDate":"19 September 2026","price":32000}]'::jsonb,
  '[{"date":"21 Agu","fullDate":"21 Agustus 2026","price":31500},{"date":"28 Agu","fullDate":"28 Agustus 2026","price":31800},{"date":"04 Sep","fullDate":"04 September 2026","price":32000},{"date":"11 Sep","fullDate":"11 September 2026","price":32000},{"date":"18 Sep","fullDate":"18 September 2026","price":32000},{"date":"19 Sep","fullDate":"19 September 2026","price":32000}]'::jsonb,
  '[{"date":"20 Jun","fullDate":"20 Juni 2026","price":31000},{"date":"15 Jul","fullDate":"15 Juli 2026","price":31200},{"date":"10 Agu","fullDate":"10 Agustus 2026","price":31500},{"date":"01 Sep","fullDate":"01 September 2026","price":31800},{"date":"19 Sep","fullDate":"19 September 2026","price":32000}]'::jsonb
);

-- Masukkan riwayat awal ke tabel market_price_history
INSERT INTO public.market_price_history (market_price_id, price, price_date, source, notes)
SELECT id, market_price, CURRENT_DATE, source, 'Data harga pasar acuan awal'
FROM public.market_prices;
