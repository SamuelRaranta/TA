-- ====================================================================
-- SINKRONISASI IDENTITAS PEMBELI PADA REVIEW & RATING PETANI
-- ====================================================================
-- Masalah:
--   Tabel public.farmer_reviews menyimpan snapshot buyer_name & buyer_avatar
--   saat ulasan dibuat. Ketika pembeli mengganti nama atau foto profil,
--   snapshot tersebut tetap menampilkan data lama (mis. "ikon" + avatar rusak)
--   padahal akun pembeli masih aktif dan profilnya sudah diperbarui.
--
-- Solusi:
--   1. Backfill snapshot lama dengan data profil terbaru.
--   2. Trigger agar perubahan full_name / avatar_url pada public.profiles
--      otomatis ikut memperbarui seluruh ulasan milik pembeli tersebut.
--
-- Catatan: halaman Review di frontend juga membaca nama & foto langsung dari
-- public.profiles (join berdasarkan buyer_id), sehingga perubahan profil
-- langsung terlihat tanpa menunggu migrasi ini dijalankan.
--
-- Cara pakai: jalankan seluruh file di Supabase Dashboard > SQL Editor.
-- ====================================================================

-- 1. Backfill data ulasan yang masih memakai snapshot lama
UPDATE public.farmer_reviews fr
SET
  buyer_name = COALESCE(NULLIF(TRIM(p.full_name), ''), fr.buyer_name),
  buyer_avatar = p.avatar_url,
  updated_at = NOW()
FROM public.profiles p
WHERE fr.buyer_id = p.id
  AND (
    fr.buyer_name IS DISTINCT FROM COALESCE(NULLIF(TRIM(p.full_name), ''), fr.buyer_name)
    OR fr.buyer_avatar IS DISTINCT FROM p.avatar_url
  );

-- 2. Fungsi trigger: sinkronkan snapshot ulasan saat profil pembeli berubah
CREATE OR REPLACE FUNCTION public.sync_farmer_reviews_buyer_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.full_name IS DISTINCT FROM OLD.full_name
     OR NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
    UPDATE public.farmer_reviews
    SET
      buyer_name = COALESCE(NULLIF(TRIM(NEW.full_name), ''), buyer_name),
      buyer_avatar = NEW.avatar_url,
      updated_at = NOW()
    WHERE buyer_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Pasang trigger pada tabel profiles
DROP TRIGGER IF EXISTS trg_sync_farmer_reviews_buyer_profile ON public.profiles;
CREATE TRIGGER trg_sync_farmer_reviews_buyer_profile
AFTER UPDATE OF full_name, avatar_url ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_farmer_reviews_buyer_profile();

-- 4. Verifikasi hasil (opsional)
-- SELECT fr.id, fr.buyer_id, fr.buyer_name, p.full_name AS nama_profil_terbaru,
--        fr.buyer_avatar = p.avatar_url AS avatar_sama
-- FROM public.farmer_reviews fr
-- JOIN public.profiles p ON p.id = fr.buyer_id
-- ORDER BY fr.created_at DESC;
