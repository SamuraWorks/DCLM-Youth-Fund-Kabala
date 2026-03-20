-- ==============================================================================
-- TRANSPARENCY PATCH: ALLOW MEMBERS TO SEE EACH OTHER
-- ============================================================

BEGIN;

-- 1. MEMBERS TABLE: Allow any signed-in user to see approved members
DROP POLICY IF EXISTS "Allow authenticated users to view all approved members" ON public.members;
CREATE POLICY "Allow authenticated users to view all approved members" 
ON public.members FOR SELECT TO authenticated 
USING (status = 'approved');

-- 2. CONTRIBUTIONS TABLE: Allow any signed-in user to see verified payments
-- This is necessary for the transparency dashboard (Checkmarks ✅/❌)
DROP POLICY IF EXISTS "Allow authenticated users to view all verified contributions" ON public.contributions;
CREATE POLICY "Allow authenticated users to view all verified contributions" 
ON public.contributions FOR SELECT TO authenticated 
USING (status = 'verified');

COMMIT;
