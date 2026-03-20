-- ==============================================================================
-- DCLM YOUTH FUND KABALA: PRODUCTION SETUP - SECTION 2 (FIXED)
-- ONLY RUN THIS AFTER SECTION 1 HAS BEEN EXECUTED SUCCESSFULLY
-- ==============================================================================

-- 1. ALIGN CONTRIBUTIONS SCHEMA
ALTER TABLE public.contributions 
  RENAME COLUMN amount TO monthly_amount;

ALTER TABLE public.contributions 
  ADD COLUMN IF NOT EXISTS extra_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Ensure constraints match requirements
ALTER TABLE public.contributions 
  DROP CONSTRAINT IF EXISTS contributions_monthly_amount_check;

ALTER TABLE public.contributions 
  ADD CONSTRAINT contributions_monthly_amount_check CHECK (monthly_amount >= 50);

-- Sync 'verified' boolean with 'status' text
UPDATE public.contributions SET verified = TRUE WHERE status = 'verified';

-- 2. UPDATED RLS POLICIES
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies
DROP POLICY IF EXISTS "Members can insert their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "Allow contribution submission" ON public.contributions;
DROP POLICY IF EXISTS "Allow viewing verified contributions" ON public.contributions;
DROP POLICY IF EXISTS "contributions_select_own" ON public.contributions;
DROP POLICY IF EXISTS "contributions_select_admin" ON public.contributions;
DROP POLICY IF EXISTS "Members can see verified contributions" ON public.contributions;
DROP POLICY IF EXISTS "Allow members and coordinator to submit" ON public.contributions;
DROP POLICY IF EXISTS "Transparency and access" ON public.contributions;

-- NEW POLICY: Robust Submission (Allow members, admins, and youth coordinators)
CREATE POLICY "Allow members and coordinator to submit"
ON public.contributions
FOR INSERT
TO authenticated
WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR
  (auth.jwt() ->> 'email') IN (
      'samuel540wisesamura@gmail.com', 'paulannehk@gmail.com', 'princessconteh673@gmail.com', 'jonathanksenessie@gmail.com'
  )
);

-- NEW POLICY: Full Transparency (View verified or own or if admin/coordinator)
CREATE POLICY "Transparency and access"
ON public.contributions
FOR SELECT
TO authenticated
USING (
  verified = TRUE OR 
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR
  (auth.jwt() ->> 'email') IN (
      'samuel540wisesamura@gmail.com', 'paulannehk@gmail.com', 'princessconteh673@gmail.com', 'jonathanksenessie@gmail.com'
  )
);

-- 3. SEED YOUTH COORDINATOR
-- Use a block to update if exists or insert if not
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.members WHERE email = 'jonathanksenessie@gmail.com') THEN
    UPDATE public.members 
    SET role = 'youth_coordinator', status = 'approved'
    WHERE email = 'jonathanksenessie@gmail.com';
  ELSE
    INSERT INTO public.members (id, user_id, full_name, email, phone, role, status, joined_date)
    VALUES (
      gen_random_uuid(),
      NULL,
      'Jonathan K Senessie',
      'jonathanksenessie@gmail.com',
      'N/A', -- Fixed: added phone to satisfy NOT NULL constraint
      'youth_coordinator',
      'approved',
      CURRENT_DATE
    );
  END IF;
END $$;
