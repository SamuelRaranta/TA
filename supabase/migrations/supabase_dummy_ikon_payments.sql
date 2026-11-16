-- ==========================================================
-- DUMMY PEMBAYARAN untuk akun pembeli "ikon" (mandiri per akun)
-- Cara pakai: jalankan seluruh file di Supabase Dashboard > SQL Editor
--
-- Data terisolasi via buyer_id (akun ikon = seed buyer b222...),
-- sehingga hanya muncul di halaman Pembayaran akun tersebut.
-- 4 baris: QRIS (berjalan), Transfer Bank (berjalan, sisa ~4 jam),
-- Langsung (selesai), Transfer (kedaluwarsa 26 jam -> batal otomatis
-- saat halaman Pembayaran dibuka).
-- Idempoten: aman dijalankan ulang (hapus kode DUMMY-IKON lama dulu).
-- ==========================================================

DO $$
DECLARE
  v_buyer_id UUID;
  v_farmer_id UUID := 'b1ad80e8-1da5-4be1-bff6-35ee468b166f'; -- Samuel Raranta (petani)
BEGIN
  SELECT id INTO v_buyer_id
  FROM public.profiles
  WHERE role = 'pembeli' AND (full_name ILIKE '%ikon%' OR email ILIKE '%ikon%')
  LIMIT 1;

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Akun pembeli "ikon" tidak ditemukan di profiles. Buat/login dulu akunnya, lalu ulangi.';
  END IF;

  DELETE FROM public.transactions
  WHERE transaction_code IN ('DUMMY-IKON-001', 'DUMMY-IKON-002', 'DUMMY-IKON-003', 'DUMMY-IKON-004');

  -- 1. QRIS, masih berjalan (dibuat sekarang, batas 24 jam)
  INSERT INTO public.transactions
    (transaction_code, buyer_id, farmer_id, farmer_group, commodity_name, volume_ton, category, amount, booking_fee, status, goods_status, pickup_schedule, notes, created_at)
  VALUES
    ('DUMMY-IKON-001', v_buyer_id, v_farmer_id, 'Kelompok Tani Mitra', 'Beras Premium Superwin', 2, 'Padi & Beras',
     30400000, 1520000, 'Berjalan', 'belum_diterima', 'Gudang Kawangkoan, Minahasa',
     '{"paymentMethod":"QRIS"}', now());

  -- 2. Transfer Bank, berjalan sisa ~4 jam (dibuat 20 jam lalu)
  INSERT INTO public.transactions
    (transaction_code, buyer_id, farmer_id, farmer_group, commodity_name, volume_ton, category, amount, booking_fee, status, goods_status, pickup_schedule, notes, created_at)
  VALUES
    ('DUMMY-IKON-002', v_buyer_id, v_farmer_id, 'Kelompok Tani Mitra', 'Kopra Putih Kering', 5, 'Perkebunan',
     69000000, 3450000, 'Berjalan', 'belum_diterima', 'Gudang Kombi, Minahasa',
     '{"paymentMethod":"Transfer Bank (VA Escrow)"}', now() - INTERVAL '20 hours');

  -- 3. Pembayaran Langsung, sudah selesai (dibuat 2 jam lalu)
  INSERT INTO public.transactions
    (transaction_code, buyer_id, farmer_id, farmer_group, commodity_name, volume_ton, category, amount, booking_fee, status, goods_status, received_at, pickup_schedule, notes, created_at)
  VALUES
    ('DUMMY-IKON-003', v_buyer_id, v_farmer_id, 'Kelompok Tani Mitra', 'Cengkeh Zanzibar Kering', 1, 'Perkebunan',
     125000000, 6250000, 'Selesai', 'diterima', now() - INTERVAL '1 hour', 'Gudang Langowan, Minahasa',
     '{"paymentMethod":"Pembayaran Langsung"}', now() - INTERVAL '2 hours');

  -- 4. Transfer Bank, kedaluwarsa (dibuat 26 jam lalu -> batal otomatis saat halaman dibuka)
  INSERT INTO public.transactions
    (transaction_code, buyer_id, farmer_id, farmer_group, commodity_name, volume_ton, category, amount, booking_fee, status, goods_status, pickup_schedule, notes, created_at)
  VALUES
    ('DUMMY-IKON-004', v_buyer_id, v_farmer_id, 'Kelompok Tani Mitra', 'Jagung Pipil Kering', 3, 'Biji-Bijian & Palawija',
     16200000, 810000, 'Berjalan', 'belum_diterima', 'Gudang Kakas, Minahasa',
     '{"paymentMethod":"Transfer Bank (VA Escrow)"}', now() - INTERVAL '26 hours');

  RAISE NOTICE 'Dummy ikon OK: 4 transaksi untuk buyer %', v_buyer_id;
END $$;
