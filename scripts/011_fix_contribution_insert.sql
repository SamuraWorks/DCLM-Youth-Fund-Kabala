-- 011_fix_contribution_insert.sql
-- Fixes the missing INSERT policy for members on the contributions table

-- 1. Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Members can insert their own contributions" ON public.contributions;

-- 2. Create the exact INSERT policy allowing members to solely insert records mapped to their authentic profile ID
CREATE POLICY "Members can insert their own contributions" 
ON public.contributions 
FOR INSERT TO authenticated 
WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
);
