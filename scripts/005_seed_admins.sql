-- DLKYF — Promote accounts to admin
-- Run this in Supabase SQL Editor AFTER the accounts exist in Authentication > Users

UPDATE public.members 
SET role = 'admin', status = 'approved' 
WHERE email IN (
  'samuel540wisesamura@gmail.com',
  'paulannehk@gmail.com'
);

-- Verify: should return 2 rows with role = admin
SELECT id, full_name, email, role, status FROM public.members 
WHERE email IN ('samuel540wisesamura@gmail.com', 'paulannehk@gmail.com');
