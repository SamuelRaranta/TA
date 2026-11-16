-- ==========================================================
-- SKRIP MIGRASI SUPABASE: SISTEM LAPORAN BUG & MASALAH
-- Tabel: bug_reports, bug_report_attachments, Storage & RLS
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- ==========================================================

-- 1. EXTENSION
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABEL UTAMA: bug_reports
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL, -- 'petani' | 'pembeli'
  category TEXT NOT NULL,  -- 'bug' | 'ui' | 'transaction' | 'payment' | 'account' | 'feature' | 'other'
  title TEXT NOT NULL,
  page TEXT NOT NULL,      -- 'home' | 'search' | 'product_detail' | 'cart' | 'payment' | 'transaction_history' | 'profile' | 'settings' | 'other'
  description TEXT NOT NULL,
  impact TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  status TEXT NOT NULL DEFAULT 'new',    -- 'new' | 'in_progress' | 'resolved' | 'rejected'
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

-- 3. TABEL LAMPIRAN: bug_report_attachments
CREATE TABLE IF NOT EXISTS public.bug_report_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES UNTUK PERFORMA QUERY ADMIN & USER
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON public.bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_category ON public.bug_reports(category);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_report_attachments_report_id ON public.bug_report_attachments(bug_report_id);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_report_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if exists
DROP POLICY IF EXISTS "Users can insert own bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Users can view own bug reports or admin all" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can update bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Attachments view policy" ON public.bug_report_attachments;
DROP POLICY IF EXISTS "Attachments insert policy" ON public.bug_report_attachments;

-- Policy INSERT: Pengguna yang terautentikasi dapat membuat laporan miliknya
CREATE POLICY "Users can insert own bug reports"
ON public.bug_reports
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR auth.uid() IS NOT NULL
);

-- Policy SELECT: Pengguna hanya melihat laporan miliknya, Admin melihat semua
CREATE POLICY "Users can view own bug reports or admin all"
ON public.bug_reports
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
  OR (auth.jwt()->>'role' = 'service_role')
);

-- Policy UPDATE: Hanya Admin yang dapat memperbarui status & catatan
CREATE POLICY "Admins can update bug reports"
ON public.bug_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
  OR (auth.jwt()->>'role' = 'service_role')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
  OR (auth.jwt()->>'role' = 'service_role')
);

-- Policy Attachments: SELECT
CREATE POLICY "Attachments view policy"
ON public.bug_report_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bug_reports r
    WHERE r.id = bug_report_attachments.bug_report_id
      AND (
        r.user_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
  )
);

-- Policy Attachments: INSERT
CREATE POLICY "Attachments insert policy"
ON public.bug_report_attachments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 6. STORAGE BUCKET: bug-reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-reports', 'bug-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Read Bug Reports Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Bug Reports Bucket" ON storage.objects;

CREATE POLICY "Public Read Bug Reports Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'bug-reports');

CREATE POLICY "Authenticated Upload Bug Reports Bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bug-reports'
);

-- 7. SEED DATA DUMMY AWAL (CONTOH LAPORAN REALISTIS)
INSERT INTO public.bug_reports (
  report_number, user_id, user_name, user_email, user_role,
  category, title, page, description, impact, status, created_at
)
VALUES
(
  'BUG-20260925-001',
  'b2222222-2222-2222-2222-222222222222',
  'Hendra Pratama, S.T.',
  'pembeli@agriconnect.id',
  'pembeli',
  'payment',
  'Tombol konfirmasi pembayaran tidak dapat ditekan',
  'payment',
  'Saya sudah mengunggah bukti pembayaran pelunasan transaksi cengkeh, tetapi tombol Konfirmasi Pembayaran tidak dapat ditekan dan tetap abu-abu.',
  'high',
  'new',
  NOW() - INTERVAL '3 hours'
),
(
  'BUG-20260925-002',
  'a1111111-1111-1111-1111-111111111111',
  'Hengky Mandagi, S.P.',
  'petani@agriconnect.id',
  'petani',
  'ui',
  'Grafik tren harga pasar terpotong pada layar ponsel',
  'search',
  'Ketika membuka halaman acuan harga komoditas jagung melalui browser HP, sumbu grafik sebelah kanan terpotong sehingga angka harga tidak terlihat jelas.',
  'medium',
  'in_progress',
  NOW() - INTERVAL '1 day'
),
(
  'BUG-20260924-001',
  'b2222222-2222-2222-2222-222222222222',
  'Hendra Pratama, S.T.',
  'pembeli@agriconnect.id',
  'pembeli',
  'transaction',
  'Notifikasi persetujuan binding agreement terlambat muncul',
  'transaction_history',
  'Kontrak sudah disepakati oleh kelompok tani sejak pagi, namun status di riwayat kontrak baru terupdate setelah refresh manual beberapa kali.',
  'low',
  'resolved',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (report_number) DO NOTHING;
