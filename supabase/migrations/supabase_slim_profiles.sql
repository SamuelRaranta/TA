-- ==========================================================
-- SLIM TABLE PROFILES: hapus 15 kolom gemuk yang tidak dipakai web
-- Cara pakai: jalankan seluruh file di Supabase Dashboard > SQL Editor
--
-- HASIL AUDIT FRONTEND (src/, 68 file):
--   DIPAKAI (dipertahankan): id, role, full_name, email, phone,
--     location, avatar_url, kyc_status,
--     notification_preferences, created_at, updated_at
--   TIDAK DIPAKAI (dihapus):
--     brand_name, bank_name, bank_account_number, bank_account_holder,
--     kyc_document          -> 0 referensi, semua NULL
--     nib, npwp             -> hanya teks mock/label, tidak dibaca dari DB
--     leader_name           -> mirror full_name (tulis saja, tak dibaca)
--     warehouse_address     -> mirror location (nilainya duplikat location)
--     business_type,
--     business_info         -> dibaca tapi tidak pernah ditampilkan
--     land_area             -> semua NULL, tidak ditampilkan
--     rating                -> hanya dipakai di tabel commodities
--     company_name          -> hanya label default lokal, tak dibaca dari DB
--     group_name            -> hanya label default lokal, tak dibaca dari DB
--   CATATAN: kolom farmer_group di tabel COMMODITIES tidak ikut dihapus
--   (itu label per-produk yang diisi lewat form, bukan tabel profiles).
--
-- PENTING: backup dulu bila ragu:
--   CREATE TABLE public.profiles_backup_2026 AS TABLE public.profiles;
-- ==========================================================

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS brand_name,
  DROP COLUMN IF EXISTS bank_name,
  DROP COLUMN IF EXISTS bank_account_number,
  DROP COLUMN IF EXISTS bank_account_holder,
  DROP COLUMN IF EXISTS kyc_document,
  DROP COLUMN IF EXISTS nib,
  DROP COLUMN IF EXISTS npwp,
  DROP COLUMN IF EXISTS leader_name,
  DROP COLUMN IF EXISTS warehouse_address,
  DROP COLUMN IF EXISTS business_type,
  DROP COLUMN IF EXISTS business_info,
  DROP COLUMN IF EXISTS land_area,
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS company_name,
  DROP COLUMN IF EXISTS group_name;

-- Verifikasi sisa kolom (harusnya 11):
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles'
-- ORDER BY ordinal_position;
