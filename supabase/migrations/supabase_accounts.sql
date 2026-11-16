-- ==========================================================
-- SKRIP RESMI: BUAT 3 AKUN (PETANI, PEMBELI, ADMIN) VIA SQL
-- Menghapus kolom phone karena memiliki constraint UNIQUE
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ 
DECLARE 
  v_petani_id UUID := 'a1111111-1111-1111-1111-111111111111';
  v_pembeli_id UUID := 'b2222222-2222-2222-2222-222222222222';
  v_admin_id UUID := 'c3333333-3333-3333-3333-333333333333';
  v_petani_pw TEXT := crypt('petani123', gen_salt('bf'));
  v_pembeli_pw TEXT := crypt('pembeli123', gen_salt('bf'));
  v_admin_pw TEXT := crypt('admin123', gen_salt('bf'));
BEGIN 
  -- 1. BERSIHKAN DATA LAMA AGAR TIDAK TERJADI KONFLIK IDENTITAS
  DELETE FROM auth.identities WHERE user_id IN (v_petani_id, v_pembeli_id, v_admin_id) OR provider_id IN ('petani@agriconnect.id', 'pembeli@agriconnect.id', 'admin@agriconnect.id', v_petani_id::text, v_pembeli_id::text, v_admin_id::text);
  DELETE FROM auth.users WHERE id IN (v_petani_id, v_pembeli_id, v_admin_id) OR email IN ('petani@agriconnect.id', 'pembeli@agriconnect.id', 'admin@agriconnect.id');
  DELETE FROM public.profiles WHERE id IN (v_petani_id, v_pembeli_id, v_admin_id);

  -- 2. BUAT AKUN PETANI
  -- Email: petani@agriconnect.id | Password: petani123
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token
  ) VALUES (
    v_petani_id, '00000000-0000-0000-0000-000000000000',
    'petani@agriconnect.id', v_petani_pw, NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb, 
    '{"role":"petani","full_name":"Hengky Mandagi, S.P."}'::jsonb, 
    'authenticated', 'authenticated', false, NOW(), NOW(),
    '', '', '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, provider, identity_data, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    v_petani_id, v_petani_id, 'email', 
    jsonb_build_object('sub', v_petani_id::text, 'email', 'petani@agriconnect.id'), 
    v_petani_id::text, NOW(), NOW(), NOW()
  );

  INSERT INTO public.profiles (
    id, role, full_name, phone, group_name, leader_name, location, kyc_status
  ) VALUES (
    v_petani_id, 'petani', 'Hengky Mandagi, S.P.', '0812-4321-8765',
    'Poktan Ranowangko Langowan', 'Hengky Mandagi, S.P.', 'Kec. Langowan Timur, Minahasa', 'verified'
  );

  -- 3. BUAT AKUN PEMBELI
  -- Email: pembeli@agriconnect.id | Password: pembeli123
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token
  ) VALUES (
    v_pembeli_id, '00000000-0000-0000-0000-000000000000',
    'pembeli@agriconnect.id', v_pembeli_pw, NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb, 
    '{"role":"pembeli","full_name":"Hendra Pratama, S.T."}'::jsonb, 
    'authenticated', 'authenticated', false, NOW(), NOW(),
    '', '', '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, provider, identity_data, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    v_pembeli_id, v_pembeli_id, 'email', 
    jsonb_build_object('sub', v_pembeli_id::text, 'email', 'pembeli@agriconnect.id'), 
    v_pembeli_id::text, NOW(), NOW(), NOW()
  );

  INSERT INTO public.profiles (
    id, role, full_name, phone, company_name, location, kyc_status
  ) VALUES (
    v_pembeli_id, 'pembeli', 'Hendra Pratama, S.T.', '0811-9876-5432',
    'PT Royal Agro Minahasa', 'Kawasan Sentra Agro Minahasa', 'verified'
  );

  -- 4. BUAT AKUN ADMIN
  -- Email: admin@agriconnect.id | Password: admin123
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token
  ) VALUES (
    v_admin_id, '00000000-0000-0000-0000-000000000000',
    'admin@agriconnect.id', v_admin_pw, NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb, 
    '{"role":"admin","full_name":"Admin Utama AgriConnect"}'::jsonb, 
    'authenticated', 'authenticated', false, NOW(), NOW(),
    '', '', '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, provider, identity_data, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    v_admin_id, v_admin_id, 'email', 
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@agriconnect.id'), 
    v_admin_id::text, NOW(), NOW(), NOW()
  );

  INSERT INTO public.profiles (
    id, role, full_name, phone, location, kyc_status
  ) VALUES (
    v_admin_id, 'admin', 'Admin Utama AgriConnect', '0812-0000-9999',
    'Kantor Operasional Minahasa', 'verified'
  );

END $$;
