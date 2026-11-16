-- ==============================================================================
-- MIGRATION: IZINKAN HAPUS LENGKAP PENAWARAN, KONTRAK, & TRANSAKSI
-- File: supabase/migrations/supabase_allow_delete_history.sql
-- 
-- Jalankan SELURUH skrip ini di menu SQL Editor pada Dashboard Supabase Anda.
-- Skrip ini menyelesaikan akar masalah error penghapusan:
-- 1. Foreign Key Constraint yang mengunci baris penawaran yang sudah berstatus 'Diterima'
--    atau memiliki relasi ke tabel contracts / transactions.
-- 2. Memberikan izin DELETE (Row Level Security) ke tabel offers, contracts,
--    transactions, dan procurement_proposals.
-- ==============================================================================

-- 1. AKTIFKAN ROW LEVEL SECURITY (RLS) PADA SEMUA TABEL TERKAIT
ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.procurement_proposals ENABLE ROW LEVEL SECURITY;

-- 2. BERIKAN POLICY DELETE LENGKAP PADA OFFERS (PENAWARAN)
DROP POLICY IF EXISTS "Allow delete on offers" ON public.offers;
DROP POLICY IF EXISTS "offers_delete_participants" ON public.offers;
DROP POLICY IF EXISTS "Users can delete offers" ON public.offers;
DROP POLICY IF EXISTS "Farmers can delete offers" ON public.offers;

CREATE POLICY "Allow delete on offers"
  ON public.offers FOR DELETE
  USING (true);

-- 3. BERIKAN POLICY DELETE PADA CONTRACTS (KONTRAK PENAWARAN DITERIMA)
DROP POLICY IF EXISTS "Allow delete on contracts" ON public.contracts;
DROP POLICY IF EXISTS "contracts_delete_policy" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete contracts" ON public.contracts;

CREATE POLICY "Allow delete on contracts"
  ON public.contracts FOR DELETE
  USING (true);

-- 4. BERIKAN POLICY DELETE PADA TRANSACTIONS (RIWAYAT TRANSAKSI)
DROP POLICY IF EXISTS "Allow delete on transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_participants" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_admin_only" ON public.transactions;

CREATE POLICY "Allow delete on transactions"
  ON public.transactions FOR DELETE
  USING (true);

-- 5. BERIKAN POLICY DELETE PADA PROCUREMENT_PROPOSALS
DROP POLICY IF EXISTS "Allow delete on procurement_proposals" ON public.procurement_proposals;
DROP POLICY IF EXISTS "Buyers can delete proposals" ON public.procurement_proposals;
DROP POLICY IF EXISTS "Users can delete proposals" ON public.procurement_proposals;

CREATE POLICY "Allow delete on procurement_proposals"
  ON public.procurement_proposals FOR DELETE
  USING (true);

-- 6. BERSIHKAN SEMUA FOREIGN KEY YANG MEMBLOKIR HAPUS DARI OFFERS & CONTRACTS
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop semua foreign key yang mengarah ke tabel public.offers
    FOR r IN (
        SELECT conrelid::regclass AS table_name, conname
        FROM pg_constraint
        WHERE confrelid = 'public.offers'::regclass
    ) LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;

    -- Drop semua foreign key yang mengarah ke tabel public.contracts
    FOR r IN (
        SELECT conrelid::regclass AS table_name, conname
        FROM pg_constraint
        WHERE confrelid = 'public.contracts'::regclass
    ) LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 7. PASANG ULANG FOREIGN KEY DENGAN CASCADE / SET NULL AGAR TIDAK PERNAH CRASH LAGI
DO $$
BEGIN
  -- Hubungkan contracts -> offers dengan ON DELETE CASCADE
  -- (Jika penawaran dihapus, kontrak terkait ikut bersih tanpa error)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contracts') THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_offer_id_fkey
      FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE;
  END IF;

  -- Hubungkan transactions -> contracts dengan ON DELETE SET NULL
  -- (Jika kontrak dihapus, riwayat transaksi tidak memblokir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_contract_id_fkey
      FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 8. AKTIFKAN REPLICA IDENTITY FULL & REALTIME PUBLICATION
ALTER TABLE IF EXISTS public.offers REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.contracts REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.transactions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'contracts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
