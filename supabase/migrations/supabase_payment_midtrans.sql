-- ==============================================================================
-- MIGRATION: TABEL PAYMENT & ROW LEVEL SECURITY (MIDTRANS SANDBOX)
-- File: supabase/migrations/supabase_payment_midtrans.sql
-- ==============================================================================

-- 1. Ekstensi UUID & Kriptografi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Fungsi helper is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Buat tabel public.payment jika belum ada
CREATE TABLE IF NOT EXISTS public.payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  midtrans_order_id TEXT UNIQUE NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  payment_method TEXT,
  midtrans_transaction_id TEXT,
  snap_token TEXT,
  snap_redirect_url TEXT,
  raw_response JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Pastikan kolom-kolom penting ada (menggunakan sintaks native IF NOT EXISTS)
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS snap_token TEXT;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS snap_redirect_url TEXT;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS midtrans_transaction_id TEXT;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS raw_response JSONB;
ALTER TABLE public.payment ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 5. Indeks performa pencarian & filter
CREATE INDEX IF NOT EXISTS idx_payment_order_id ON public.payment(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_midtrans_order_id ON public.payment(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON public.payment(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON public.payment(created_at DESC);

-- 6. Trigger otomatis untuk updated_at
CREATE OR REPLACE FUNCTION public.handle_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_updated_at ON public.payment;
CREATE TRIGGER trg_payment_updated_at
BEFORE UPDATE ON public.payment
FOR EACH ROW
EXECUTE FUNCTION public.handle_payment_updated_at();

-- 7. Row Level Security (RLS)
ALTER TABLE public.payment ENABLE ROW LEVEL SECURITY;

-- 7a. Policy SELECT untuk Pembeli
DROP POLICY IF EXISTS "Buyers can view payments for their orders" ON public.payment;
CREATE POLICY "Buyers can view payments for their orders"
  ON public.payment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = payment.order_id
        AND t.buyer_id = auth.uid()
    )
  );

-- 7b. Policy SELECT untuk Petani
DROP POLICY IF EXISTS "Farmers can view payments for their orders" ON public.payment;
CREATE POLICY "Farmers can view payments for their orders"
  ON public.payment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = payment.order_id
        AND t.farmer_id = auth.uid()
    )
  );

-- 7c. Policy SELECT untuk Admin
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payment;
CREATE POLICY "Admins can view all payments"
  ON public.payment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 7d. Policy WRITE untuk Admin
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payment;
CREATE POLICY "Admins can manage payments"
  ON public.payment FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 8. Pendaftaran ke Realtime Publication Supabase
ALTER TABLE public.payment REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'payment'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
