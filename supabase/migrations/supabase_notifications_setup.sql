-- ==========================================================
-- SKRIP SETUP SUPABASE: TABEL NOTIFIKASI REAL-TIME (NOTIFICATIONS)
-- Mendukung 3 Role: Pembeli (Buyer), Petani (Farmer), dan Admin
-- Jalankan skrip ini di menu SQL Editor di dashboard Supabase Anda.
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABEL UTAMA: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'farmer', 'admin', 'pembeli', 'petani')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id TEXT,
  related_type TEXT CHECK (related_type IN ('order', 'payment', 'proposal', 'offer', 'commodity', 'bug_report', 'user', 'system')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. INDEX UNTUK PERFORMA QUERY CEPAT
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Policy SELECT: User hanya dapat melihat notifikasi miliknya sendiri (atau admin untuk kebutuhan operasional)
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
);

-- Policy INSERT: Pengguna authenticated atau trigger database dapat memasukkan notifikasi baru
CREATE POLICY "Users can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  OR auth.role() = 'anon'
);

-- Policy UPDATE: Pengguna hanya dapat mengubah status is_read notifikasi miliknya sendiri
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
);

-- Policy DELETE: Hanya pemilik atau admin yang dapat menghapus (jika diperlukan)
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
);

-- 4. AKTIFKAN REPLICA IDENTITY FULL & REALTIME PUBLICATION
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
