-- ==========================================================
-- SAMAKAN STATUS TRANSAKSI WEB <-> DATABASE
-- Cara pakai: jalankan seluruh file di Supabase Dashboard > SQL Editor
--
-- Mulai versi ini aplikasi HANYA menulis 3 status:
--   'Berjalan' | 'Selesai' | 'Dibatalkan'
-- sehingga nilai di web selalu sama persis dengan di Supabase.
-- Migrasi di bawah memetakan nilai lama ke nilai baru:
--   DP Terkunci, Terikat, Pelunasan,
--   Menunggu Pembayaran, Dalam Proses, Terkunci di Escrow -> Berjalan
--   Pembayaran Berhasil, Lunas                        -> Selesai
--   (Dibatalkan tidak berubah)
-- ==========================================================

UPDATE public.transactions
SET status = 'Berjalan'
WHERE status IN (
  'DP Terkunci', 'Terikat', 'Pelunasan',
  'Menunggu Pembayaran', 'Dalam Proses', 'Terkunci di Escrow'
);

UPDATE public.transactions
SET status = 'Selesai'
WHERE status IN ('Pembayaran Berhasil', 'Lunas');

-- Verifikasi (harusnya hanya Berjalan/Selesai/Dibatalkan):
-- SELECT status, COUNT(*) FROM public.transactions GROUP BY status;
