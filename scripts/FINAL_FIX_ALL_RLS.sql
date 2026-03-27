-- ==============================================================================
-- DEFINITIVE REPAIR SCRIPT: SYNCING IDs & FIXING RECURSION
-- THIS VERSION MANUALLY DROPS AND RECREATES CONSTRAINTS. (TRANSACTIONS REMOVED)
-- ==============================================================================

BEGIN;

-- 1. DROP ALL BLOCKING FOREIGN KEY CONSTRAINTS
ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS contributions_member_id_fkey;
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_member_id_fkey;
ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_approved_by_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_member_id_fkey;
-- Check if some were named without the table prefix
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_approved_by_fkey;

-- 2. PERFORM THE SYNCHRONIZED ID SWAP
-- Sync referencing tables first to prevent "Orphaned" records
UPDATE public.contributions c SET member_id = m.user_id FROM public.members m WHERE c.member_id = m.id AND m.id != m.user_id;
UPDATE public.ledger_entries l SET member_id = m.user_id FROM public.members m WHERE l.member_id = m.id AND m.id != m.user_id;
UPDATE public.withdrawals w SET approved_by = m.user_id FROM public.members m WHERE w.approved_by = m.id AND m.id != m.user_id;
UPDATE public.notifications n SET member_id = m.user_id FROM public.members m WHERE n.member_id = m.id AND m.id != m.user_id;

-- FINALLY update the primary parent table
UPDATE public.members SET id = user_id WHERE id != user_id;

-- 3. RE-CREATE THE FOREIGN KEY CONSTRAINTS
ALTER TABLE public.contributions ADD CONSTRAINT contributions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);
ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.members(id);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);


-- 4. FIX THE CONTRIBUTION POLICIES (NON-RECURSIVE)
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "Admins can manage all contributions" ON public.contributions;
DROP POLICY IF EXISTS "Members can insert their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "contributions_select_own" ON public.contributions;
DROP POLICY IF EXISTS "contributions_select_admin" ON public.contributions;
DROP POLICY IF EXISTS "contributions_insert_own" ON public.contributions;
DROP POLICY IF EXISTS "contributions_update_admin" ON public.contributions;

CREATE POLICY "Admins can manage all contributions" 
ON public.contributions FOR ALL TO authenticated 
USING ((auth.jwt() ->> 'email') IN ('admin1@dclm-youth.org', 'admin2@dclm-youth.org', 'admin3@dclm-youth.org'));

CREATE POLICY "Members can view their own contributions" 
ON public.contributions FOR SELECT TO authenticated 
USING (member_id = auth.uid());

CREATE POLICY "Members can insert their own contributions" 
ON public.contributions FOR INSERT TO authenticated 
WITH CHECK (member_id = auth.uid());

COMMIT;
