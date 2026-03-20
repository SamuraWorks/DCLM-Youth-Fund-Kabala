-- ============================================================
-- SQL Script to Seed 3 Predefined Admins directly in Supabase
-- ============================================================

DO $$
DECLARE
  uid1 UUID := gen_random_uuid();
  uid2 UUID := gen_random_uuid();
  uid3 UUID := gen_random_uuid();
BEGIN
  -- 1. Samuel Samura
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'samuel540wisesamura@gmail.com') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (uid1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'samuel540wisesamura@gmail.com', crypt('S@muR4#9xL!27', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Samuel Samura"}', now(), now());
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, created_at, updated_at)
    VALUES (gen_random_uuid(), uid1, format('{"sub":"%s","email":"%s"}', uid1::text, 'samuel540wisesamura@gmail.com')::jsonb, 'email', now(), now());
  END IF;

  -- 2. Paul Anneh Koroma
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'paulannehk@gmail.com') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (uid2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'paulannehk@gmail.com', crypt('P@uL#83vK!2zX', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Paul Anneh Koroma"}', now(), now());
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, created_at, updated_at)
    VALUES (gen_random_uuid(), uid2, format('{"sub":"%s","email":"%s"}', uid2::text, 'paulannehk@gmail.com')::jsonb, 'email', now(), now());
  END IF;

  -- 3. Princess Conteh
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'princessconteh673@gmail.com') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (uid3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'princessconteh673@gmail.com', crypt('Pr!nC3ss#7Lm@92', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Princess Conteh"}', now(), now());
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, created_at, updated_at)
    VALUES (gen_random_uuid(), uid3, format('{"sub":"%s","email":"%s"}', uid3::text, 'princessconteh673@gmail.com')::jsonb, 'email', now(), now());
  END IF;

  -- If the users already existed but had different passwords, the IF NOT EXISTS block skipped them.
  -- This guarantees their passwords are forcefully updated to match your strict spreadsheet requirements:
  UPDATE auth.users SET encrypted_password = crypt('S@muR4#9xL!27', gen_salt('bf')) WHERE email = 'samuel540wisesamura@gmail.com';
  UPDATE auth.users SET encrypted_password = crypt('P@uL#83vK!2zX', gen_salt('bf')) WHERE email = 'paulannehk@gmail.com';
  UPDATE auth.users SET encrypted_password = crypt('Pr!nC3ss#7Lm@92', gen_salt('bf')) WHERE email = 'princessconteh673@gmail.com';

  -- The auth.users trigger (handle_new_user) will have instantly created the public.members profiles.
  -- To guarantee there are no RLS UUID mismatch errors (where id != user_id), we synchronize the fields:
  UPDATE public.members SET id = user_id WHERE email IN (
    'samuel540wisesamura@gmail.com',
    'paulannehk@gmail.com',
    'princessconteh673@gmail.com'
  );

END $$;
