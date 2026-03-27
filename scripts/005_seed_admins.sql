-- DLKYF — Promote accounts to admin
-- Run this in Supabase SQL Editor AFTER the accounts exist in Authentication > Users

UPDATE public.members 
SET role = 'admin', status = 'approved' 
WHERE email IN (
  'admin1@dclm-youth.org',
  'admin2@dclm-youth.org'
);

-- Verify: should return 2 rows with role = admin
SELECT id, full_name, email, role, status FROM public.members 
WHERE email IN ('admin1@dclm-youth.org', 'admin2@dclm-youth.org');
