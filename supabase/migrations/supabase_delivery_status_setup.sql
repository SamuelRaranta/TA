-- ==============================================================================
-- MIGRATION: STATUS TRANSAKSI & STATUS BARANG (SUPABASE)
-- File: supabase_delivery_status_setup.sql
-- 
-- Aturan Status Transaksi (HANYA 3 STATUS):
-- 1. 'Berjalan'   : Transaksi aktif (baru dibuat, menunggu pembayaran, atau sudah dibayar tapi barang belum diterima)
-- 2. 'Selesai'    : Transaksi tuntas (pembeli sudah konfirmasi barang diterima)
-- 3. 'Dibatalkan' : Transaksi dibatalkan atau kedaluwarsa
--
-- Aturan Status Barang:
-- 1. 'belum_diterima' : Barang belum sampai / belum diterima pembeli (status transaksi tetap 'Berjalan')
-- 2. 'diterima'       : Barang telah diterima oleh pembeli (status transaksi menjadi 'Selesai')
-- ==============================================================================

-- 1. Tambahkan kolom goods_status dan received_at jika belum ada
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS goods_status TEXT DEFAULT 'belum_diterima';

ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ DEFAULT NULL;

-- 2. PENTING: Hapus constraint status LAMA terlebih dahulu sebelum melakukan UPDATE data!
-- (Jika UPDATE dijalankan sebelum DROP, Postgres akan menolak status 'Berjalan' karena constraint lama)
ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS transactions_goods_status_check;

-- Hapus juga jika ada check constraint lain yang memeriksa kolom status pada tabel transactions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.transactions'::regclass 
          AND contype = 'c' 
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 3. Normalisasi data transaksi lama ke 3 status: 'Berjalan', 'Selesai', 'Dibatalkan'
-- Transaksi yang sebelumnya berstatus selesai atau barang diterima -> 'Selesai'
UPDATE public.transactions 
SET status = 'Selesai',
    goods_status = 'diterima',
    received_at = COALESCE(received_at, created_at)
WHERE status = 'Selesai' OR goods_status = 'diterima';

-- Transaksi yang sebelumnya berstatus dibatalkan -> 'Dibatalkan'
UPDATE public.transactions 
SET status = 'Dibatalkan'
WHERE status = 'Dibatalkan';

-- Semua status transaksi selain 'Selesai' dan 'Dibatalkan' (seperti 'DP Terkunci', 'Terikat', 'Pelunasan', 'Diproses', 'Pembayaran Berhasil', 'Menunggu Pembayaran') dinormalisasi menjadi 'Berjalan'
UPDATE public.transactions 
SET status = 'Berjalan',
    goods_status = COALESCE(goods_status, 'belum_diterima')
WHERE status NOT IN ('Selesai', 'Dibatalkan') OR status IS NULL;

-- Pastikan default goods_status adalah 'belum_diterima'
UPDATE public.transactions
SET goods_status = 'belum_diterima'
WHERE goods_status IS NULL OR goods_status NOT IN ('belum_diterima', 'diterima');

-- 4. Ubah default status pada tabel menjadi 'Berjalan'
ALTER TABLE public.transactions 
  ALTER COLUMN status SET DEFAULT 'Berjalan';

ALTER TABLE public.transactions 
  ALTER COLUMN goods_status SET DEFAULT 'belum_diterima';

-- 5. Pasang CHECK constraint status transaksi BARU: HANYA 'Berjalan', 'Selesai', 'Dibatalkan'
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('Berjalan', 'Selesai', 'Dibatalkan'));

-- 6. Pasang CHECK constraint goods_status BARU: 'belum_diterima' dan 'diterima'
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_goods_status_check 
  CHECK (goods_status IN ('belum_diterima', 'diterima'));

-- 7. Tambahkan indeks untuk performa pencarian & filter
CREATE INDEX IF NOT EXISTS idx_transactions_status 
  ON public.transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_goods_status 
  ON public.transactions(goods_status);

CREATE INDEX IF NOT EXISTS idx_transactions_received_at 
  ON public.transactions(received_at);

-- 8. Kebijakan RLS agar Pembeli & Petani dapat memperbarui status transaksi
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions_update_admin_only'
  ) THEN
    DROP POLICY transactions_update_admin_only ON public.transactions;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions_update_participants'
  ) THEN
    DROP POLICY transactions_update_participants ON public.transactions;
  END IF;

  CREATE POLICY transactions_update_participants ON public.transactions
    FOR UPDATE TO authenticated
    USING (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin())
    WITH CHECK (buyer_id = auth.uid() OR farmer_id = auth.uid() OR public.is_admin());
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Keterangan dokumentasi kolom
COMMENT ON COLUMN public.transactions.status IS 'Status transaksi: Berjalan, Selesai, Dibatalkan';
COMMENT ON COLUMN public.transactions.goods_status IS 'Status penerimaan fisik komoditas: belum_diterima, diterima';
COMMENT ON COLUMN public.transactions.received_at IS 'Waktu saat pembeli mengonfirmasi bahwa barang telah diterima';
