-- ==========================================================
-- DEAL FLOW: status Disetujui + policy DELETE + bersih sisa TEST
-- Cara pakai: jalankan seluruh file di Supabase Dashboard > SQL Editor
--
-- 1) WAJIB untuk tombol Terima di "Cari Penawaran" petani.
--    CHECK bawaan hanya mengizinkan ('Menunggu Persetujuan',
--    'Aktif', 'Tidak Aktif') sehingga update proposal menjadi
--    'Disetujui' ditolak database (error 23514).
-- 2) Policy DELETE: tombol Hapus proposal, rollback deal gagal,
--    dan hapus pengguna di Kelola Pengguna selama ini GAGAL DIAM-DIAM
--    (API mengembalikan sukses tapi 0 baris terhapus karena tidak ada
--    policy DELETE). Gayanya disamakan dengan policy aplikasi lain
--    yang sudah terbuka (USING (true)).
-- 3) Bersih-bersih baris TEST/PROBE milik developer (aman: hanya
--    kode TEST-FLOW-*, COL-TEST-*, PROBE-* dan 2 offer uji yatim).
-- ==========================================================

-- ---------- 1. Status Disetujui ----------
ALTER TABLE public.procurement_proposals
  DROP CONSTRAINT IF EXISTS procurement_proposals_status_check;

ALTER TABLE public.procurement_proposals
  ADD CONSTRAINT procurement_proposals_status_check
  CHECK (status IN ('Menunggu Persetujuan', 'Aktif', 'Tidak Aktif', 'Disetujui'));

-- ---------- 2. Policy DELETE ----------
DROP POLICY IF EXISTS "Allow delete on procurement_proposals" ON public.procurement_proposals;
CREATE POLICY "Allow delete on procurement_proposals"
  ON public.procurement_proposals FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Allow delete on offers" ON public.offers;
CREATE POLICY "Allow delete on offers"
  ON public.offers FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Allow delete on profiles" ON public.profiles;
CREATE POLICY "Allow delete on profiles"
  ON public.profiles FOR DELETE
  USING (true);

-- ---------- 3. Bersih sisa TEST (milik developer, bukan data user) ----------
-- Stok sudah dikembalikan via aplikasi sebelum baris ini dihapus
-- (nnn kembali 22 Ton, Beras kembali 40 Ton — terverifikasi).
DELETE FROM public.transactions
WHERE transaction_code IN ('TEST-FLOW-001', 'TEST2-FLOW-001', 'TEST3-FLOW-001', 'COL-TEST-999')
   OR transaction_code LIKE 'TEST2-FLOW-%';

DELETE FROM public.contracts
WHERE contract_code IN ('TEST-FLOW-001', 'TEST2-FLOW-001', 'TEST3-FLOW-001')
   OR contract_code LIKE 'TEST2-FLOW-%';

DELETE FROM public.offers
WHERE id IN (
  '7e7d60f3-c064-4f77-bd20-bbeb9150ec6b', -- offer probe yatim
  'a36e5b76-3fea-4d87-8673-0d55a8c5ddf2', -- offer TEST-FLOW-001
  '814ef672-a549-41cb-92fe-87bb77a7a306', -- offer debug TEST2 (tanpa reservasi stok)
  'cdd278de-bbd4-46f8-a585-b4bedfb535a2', -- offer TEST2-FLOW-001 (sudah Dibatalkan + stok kembali)
  '2f7804ea-a7bf-40eb-b43a-2219376834e9'  -- offer TEST3-FLOW-001 (sudah Dibatalkan + stok kembali)
)
   OR notes LIKE '%TEST2-FLOW%';

DELETE FROM public.procurement_proposals
WHERE code IN ('TEST-FLOW-001', 'PROBE-001', 'TEST2-FLOW-001');

-- Verifikasi (harusnya 0 baris TEST, dan constraint baru):
-- SELECT transaction_code FROM public.transactions WHERE transaction_code LIKE 'TEST%' OR transaction_code LIKE 'COL-TEST%';
-- SELECT id FROM public.offers WHERE notes LIKE '%TEST2%';
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'public.procurement_proposals'::regclass AND conname = 'procurement_proposals_status_check';
