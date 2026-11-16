-- ====================================================================
-- MIGRATION: Penambahan Kolom payment_method pada Tabel procurement_proposals
-- Proyek: AgriConnect
-- Tanggal: 28 September 2026
-- ====================================================================

-- 1. Tambahkan kolom payment_method jika belum tersedia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'procurement_proposals' 
      AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.procurement_proposals 
    ADD COLUMN payment_method TEXT DEFAULT 'Transfer Bank (Escrow)';
    
    RAISE NOTICE 'Kolom payment_method berhasil ditambahkan ke tabel procurement_proposals.';
  ELSE
    RAISE NOTICE 'Kolom payment_method sudah ada pada tabel procurement_proposals.';
  END IF;
END $$;

-- 2. Migrasi Data Lama (Backfill data yang tersimpan sebelumnya)
-- Jika sebelumnya ada tag [Metode Pembayaran: ...] di dalam specifications, pindahkan nilainya ke kolom payment_method
UPDATE public.procurement_proposals
SET payment_method = substring(specifications FROM '\[Metode Pembayaran:\s*([^\]]+)\]')
WHERE specifications ~ '\[Metode Pembayaran:\s*[^\]]+\]'
  AND (payment_method IS NULL OR payment_method = 'Transfer Bank (Escrow)');

-- Pastikan semua baris yang masih NULL memiliki nilai default
UPDATE public.procurement_proposals
SET payment_method = 'Transfer Bank (Escrow)'
WHERE payment_method IS NULL;

-- 3. Bersihkan tag metadata [Metode Pembayaran: ...] dari kolom specifications agar teks catatan komoditas bersih
UPDATE public.procurement_proposals
SET specifications = TRIM(regexp_replace(specifications, '\[Metode Pembayaran:\s*[^\]]+\]\s*', '', 'g'))
WHERE specifications ~ '\[Metode Pembayaran:\s*[^\]]+\]';

-- 4. Dokumentasi Kolom (Comment)
COMMENT ON COLUMN public.procurement_proposals.payment_method IS 'Pilihan metode pembayaran proposal pengadaan: Transfer Bank (Escrow), QRIS Standar Nasional, atau Pembayaran Langsung';

-- 5. Verifikasi Hasil Migrasi
SELECT id, code, commodity_name, payment_method, specifications, created_at 
FROM public.procurement_proposals 
LIMIT 10;
