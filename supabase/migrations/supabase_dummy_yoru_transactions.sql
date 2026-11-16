-- ==========================================================
-- DUMMY TRANSAKSI untuk akun petani "yoru" (mandiri per akun)
-- Cara pakai: jalankan seluruh file di Supabase Dashboard > SQL Editor
--
-- Data terisolasi via farmer_id (akun yoru), sehingga hanya muncul
-- di halaman Transaksi akun tersebut (dan di halaman Pembayaran
-- akun pembeli yang bersangkutan).
-- 4 baris: QRIS (berjalan), Transfer Bank (berjalan sisa ~4 jam),
-- Langsung + Selesai, Langsung + berjalan (demo tombol Konfirmasi
-- petani; baris kedaluwarsa didemo via akun ikon).
-- Idempoten: aman dijalankan ulang (hapus kode DUMMY-YORU lama dulu).
-- ==========================================================

DO $$
DECLARE
  v_farmer_id UUID;
  v_buyer_id UUID;
BEGIN
  SELECT id INTO v_farmer_id
  FROM public.profiles
  WHERE role = 'petani' AND (full_name ILIKE '%yoru%' OR email ILIKE '%yoru%')
  LIMIT 1;

  IF v_farmer_id IS NULL THEN
    RAISE EXCEPTION 'Akun petani "yoru" tidak ditemukan di profiles. Buat/login dulu akunnya, lalu ulangi.';
  END IF;

  SELECT id INTO v_buyer_id
  FROM public.profiles
  WHERE role = 'pembeli' AND (full_name ILIKE '%ikon%' OR email ILIKE '%ikon%')
  LIMIT 1;

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Akun pembeli "ikon" tidak ditemukan di profiles. Buat/login dulu akunnya, lalu ulangi.';
  END IF;

  DELETE FROM public.transactions
  WHERE transaction_code IN ('DUMMY-YORU-001', 'DUMMY-YORU-002', 'DUMMY-YORU-003', 'DUMMY-YORU-004');

  -- 1. QRIS, masih berjalan (dibuat sekarang, batas 24 jam)
  INSERT INTO public.transactions
    (transaction_code, buyer_id, farmer_id, farmer_group, commodity_name, volume_ton, category, amount, booking_fee, status, goods_status, pickup_schedule, notes, created_at)
  VALUES
    ('DUMMY-YORU-001', v_buyer_id, v_farmer_id, 'Poktan Ranowangko Langowan', 'Beras Premium Superwin', 2, 'Padi & Beras',
     30400000, 1520000, 'Berjalan', 'belum_diterima', 'Gudang Kawangkoan, Minahasa',
     '{"paymentMethod":"QRIS"}', now());

  -- 2. Transfer Bank, berjalan sisa ~4 jam (dibuat 20 jam lalu)
  INSERT INTO public.transactions
    (transaction_code, buyer_id, farmer_id, farmer_group, commodity_name, volume_ton, category, amount, booking_fee, status, goods_status, pickup_schedule, notes, created_at)
  VALUES
    ('DUMMY-YORU-002', v_buyer_id, v_farmer_id, 'Poktan Ranowangko Langowan', 'Kopra Putih Kering', 5, 'Perkebunan',
     69000000, 3450000, 'Berjalan', 'belum_diterima', 'Gudang Kombi, Minahasa',
     '{"paymentMethod":"Transfer Bank (VA Escrow)"}', now() - INTERVAL '20 hours');

  -- 3. Pembayaran Langsung, sudah selesai (dibuat 2 jam lalu)
  INSERT INTO public.transactions
    (transaction_code, buyer_id, farmer_id, farmer_group, commodity_name, volume_ton, category, amount, booking_fee, status, goods_status, received_at, pickup_schedule, notes, created_at)
  VALUES
    ('DUMMY-YORU-003', v_buyer_id, v_farmer_id, 'Poktan Ranowangko Langowan', 'Cengkeh Zanzibar Kering', 1, 'Perkebunan',
     125000000, 6250000, 'Selesai', 'diterima', now() - INTERVAL '1 hour', 'Gudang Langowan, Minahasa',
     '{"paymentMethod":"Pembayaran Langsung"}', now() - INTERVAL '2 hours');

  -- 4. Pembayaran Langsung, berjalan (demo tombol Konfirmasi petani; dibuat 3 jam lalu)
  INSERT INTO public.transactions
    (transaction_code, buyer_id, farmer_id, farmer_group, commodity_name, volume_ton, category, amount, booking_fee, status, goods_status, pickup_schedule, notes, created_at)
  VALUES
    ('DUMMY-YORU-004', v_buyer_id, v_farmer_id, 'Poktan Ranowangko Langowan', 'Jagung Pipil Kering', 3, 'Biji-Bijian & Palawija',
     16200000, 810000, 'Berjalan', 'belum_diterima', 'Gudang Kakas, Minahasa',
     '{"paymentMethod":"Pembayaran Langsung"}', now() - INTERVAL '3 hours');

  RAISE NOTICE 'Dummy yoru OK: 4 transaksi untuk farmer % (buyer %)', v_farmer_id, v_buyer_id;
END $$;
