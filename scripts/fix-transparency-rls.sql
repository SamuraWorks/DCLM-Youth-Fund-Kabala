-- ============================================================
-- DLKYF — Community Transparency RLS Fix
-- Run this in the Supabase SQL Editor to fix the "0" balance issue
-- ============================================================

-- 1. FIX FUND BALANCES (Allow all authenticated users to see totals)
DROP POLICY IF EXISTS "Members can view balances" ON public.fund_balances;
DROP POLICY IF EXISTS "Enable read-only for all authenticated users" ON public.fund_balances;
CREATE POLICY "Enable read-only for all authenticated users" 
ON public.fund_balances FOR SELECT TO authenticated 
USING (true);

-- 2. FIX CONTRIBUTIONS (Allow transparency stats)
-- Members can always see their own, but need to see verified amounts for others
DROP POLICY IF EXISTS "Members can view their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "Community Transparency: View verified contributions" ON public.contributions;
CREATE POLICY "Community Transparency: View verified contributions" 
ON public.contributions FOR SELECT TO authenticated 
USING (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) -- Own
  OR 
  verified = true -- All verified contributions (for transparency totals)
);

-- 3. FIX MEMBERS (Allow seeing who is in the community)
DROP POLICY IF EXISTS "Members can view themselves" ON public.members;
DROP POLICY IF EXISTS "Admins can view all" ON public.members;
DROP POLICY IF EXISTS "Community Transparency: View approved members" ON public.members;

CREATE POLICY "Community Transparency: View approved members" 
ON public.members FOR SELECT TO authenticated 
USING (
  user_id = auth.uid() -- Own
  OR 
  status = 'approved' -- Others (only if approved)
);

-- 4. FIX LEDGER (Allow transparency for approved members)
DROP POLICY IF EXISTS "Members can view ledger" ON public.ledger_entries;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON public.ledger_entries;
CREATE POLICY "Enable read for all authenticated users" 
ON public.ledger_entries FOR SELECT TO authenticated 
USING (true);

-- 5. FIX NOTIFICATIONS (Allow coordinator to send messages)
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authorized roles can create notifications" ON public.notifications;
CREATE POLICY "Authorized roles can create notifications" 
ON public.notifications FOR INSERT TO authenticated 
WITH CHECK (
  (auth.jwt() ->> 'email') IN ('admin1@dclm-youth.org', 'admin2@dclm-youth.org', 'admin3@dclm-youth.org')
  OR 
  EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND role IN ('admin', 'treasurer', 'youth_coordinator'))
);
