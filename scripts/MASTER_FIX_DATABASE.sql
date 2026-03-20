-- ==============================================================================
-- MASTER REPAIR SCRIPT 
-- RUN THIS IN YOUR SUPABASE 'SQL EDITOR' TO FIX ALL BUGS INSTANTLY
-- ==============================================================================

-- 1. FIX THE INFINITE RECURSION CRASH ON THE MEMBERS TABLE
-- We are dropping the old broken recursive policies from Day 1.
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_select_admin" ON public.members;
DROP POLICY IF EXISTS "members_insert_admin" ON public.members;
DROP POLICY IF EXISTS "members_update_admin" ON public.members;
DROP POLICY IF EXISTS "members_delete_admin" ON public.members;
DROP POLICY IF EXISTS "Admins can do everything" ON public.members;
DROP POLICY IF EXISTS "Admins can view all" ON public.members;
DROP POLICY IF EXISTS "Admins can update all" ON public.members;

-- Replace them with Non-Recursive JWT email locks!
CREATE POLICY "Admins can view all members" ON public.members 
  FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'email') IN (
      'samuel540wisesamura@gmail.com', 'paulannehk@gmail.com', 'princessconteh673@gmail.com'
    )
  );

CREATE POLICY "Admins can manage all members" ON public.members 
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'email') IN (
      'samuel540wisesamura@gmail.com', 'paulannehk@gmail.com', 'princessconteh673@gmail.com'
    )
  );

-- 2. FIX THE MISSING FRONTEND COLUMNS ON CONTRIBUTIONS
ALTER TABLE public.contributions 
  ADD COLUMN IF NOT EXISTS month TEXT,
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;


-- 3. FIX THE MISSING INSERT POLICY SO NORMAL MEMBERS CAN SUBMIT PAYMENTS
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can insert their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "contributions_insert_own" ON public.contributions;

CREATE POLICY "Members can insert their own contributions" 
ON public.contributions 
FOR INSERT TO authenticated 
WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
);
