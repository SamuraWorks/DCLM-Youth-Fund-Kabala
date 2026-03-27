-- ============================================================
-- DLKYF — Admin Actions & RLS Fixes (Idempotent Version)
-- Run in Supabase SQL Editor to enable Member Approval 
-- and Payment Verification
-- ============================================================

-- 1. Ensure ledger_entries table is correctly structured
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  amount DECIMAL(15,2),
  description TEXT NOT NULL,
  member_id UUID REFERENCES public.members(id),
  member_name TEXT,
  approved_by UUID REFERENCES public.members(id),
  approved_by_name TEXT,
  transaction_id TEXT UNIQUE DEFAULT ('TXN-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  reference_id UUID,
  payment_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Clean up fund_categories names (ensure they match the UI logic)
UPDATE public.fund_categories SET name = 'General Fund' WHERE name ILIKE 'general%';
UPDATE public.fund_categories SET name = 'Emergency Fund' WHERE name ILIKE 'emergency%';
UPDATE public.fund_categories SET name = 'Events & Programs' WHERE name ILIKE 'events%';
UPDATE public.fund_categories SET name = 'Charity' WHERE name ILIKE 'charity%';

-- 3. Fix RLS for members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.members;
DROP POLICY IF EXISTS "Admins can do everything" ON public.members;
DROP POLICY IF EXISTS "Members can view themselves" ON public.members;
DROP POLICY IF EXISTS "Admins can view all" ON public.members;
DROP POLICY IF EXISTS "Admins can update all" ON public.members;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.members;

-- Individual access
CREATE POLICY "Members can view themselves" ON public.members 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Admin access (Non-recursive using JWT email)
CREATE POLICY "Admins can view all" ON public.members 
  FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'email') IN (
      'admin1@dclm-youth.org',
      'admin2@dclm-youth.org',
      'admin3@dclm-youth.org'
    )
  );

CREATE POLICY "Admins can update all" ON public.members 
  FOR UPDATE TO authenticated USING (
    (auth.jwt() ->> 'email') IN (
      'admin1@dclm-youth.org',
      'admin2@dclm-youth.org',
      'admin3@dclm-youth.org'
    )
  ) WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      'admin1@dclm-youth.org',
      'admin2@dclm-youth.org',
      'admin3@dclm-youth.org'
    )
  );

-- 4. Fix RLS for contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.contributions;
DROP POLICY IF EXISTS "Members can view their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "Admins can view and update all contributions" ON public.contributions;

CREATE POLICY "Members can view their own contributions" ON public.contributions 
  FOR SELECT TO authenticated USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view and update all contributions" ON public.contributions 
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'email') IN (
      'admin1@dclm-youth.org',
      'admin2@dclm-youth.org',
      'admin3@dclm-youth.org'
    )
  );

-- 5. Fix RLS for ledger_entries
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.ledger_entries;
DROP POLICY IF EXISTS "Admins can manage ledger" ON public.ledger_entries;
DROP POLICY IF EXISTS "Members can view ledger" ON public.ledger_entries;

CREATE POLICY "Admins can manage ledger" ON public.ledger_entries 
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'email') IN (
      'admin1@dclm-youth.org',
      'admin2@dclm-youth.org',
      'admin3@dclm-youth.org'
    )
  );

CREATE POLICY "Members can view ledger" ON public.ledger_entries 
  FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'email') IN (
      'admin1@dclm-youth.org',
      'admin2@dclm-youth.org',
      'admin3@dclm-youth.org'
    ) OR
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND status = 'approved')
  );

-- 6. Fix RLS for fund_balances
ALTER TABLE public.fund_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.fund_balances;
DROP POLICY IF EXISTS "Admins can manage balances" ON public.fund_balances;
DROP POLICY IF EXISTS "Members can view balances" ON public.fund_balances;

CREATE POLICY "Admins can manage balances" ON public.fund_balances 
  FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'email') IN (
      'admin1@dclm-youth.org',
      'admin2@dclm-youth.org',
      'admin3@dclm-youth.org'
    )
  );

CREATE POLICY "Members can view balances" ON public.fund_balances 
  FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'email') IN (
      'admin1@dclm-youth.org',
      'admin2@dclm-youth.org',
      'admin3@dclm-youth.org'
    ) OR
    EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid() AND status = 'approved')
  );

-- 7. Fix RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Members can view and update their own notifications" ON public.notifications;

CREATE POLICY "Admins can create notifications" ON public.notifications 
  FOR INSERT TO authenticated WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      'admin1@dclm-youth.org',
      'admin2@dclm-youth.org',
      'admin3@dclm-youth.org'
    )
  );

CREATE POLICY "Members can view and update their own notifications" ON public.notifications 
  FOR ALL TO authenticated USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

