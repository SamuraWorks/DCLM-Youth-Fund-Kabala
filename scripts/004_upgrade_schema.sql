-- DLKYF Full Upgrade Script — Run in Supabase SQL Editor
-- This is fully idempotent: safe to run multiple times

-- 1. Update members table: add orange_money_number field
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS orange_money_number TEXT;

-- 2. Update contributions table: add extra tracking + transaction message
ALTER TABLE public.contributions ADD COLUMN IF NOT EXISTS is_extra BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.contributions ADD COLUMN IF NOT EXISTS transaction_message TEXT;
ALTER TABLE public.contributions ADD COLUMN IF NOT EXISTS allocated_month DATE; -- which month this 50Le covers

-- 3. Create immutable ledger_entries table (audit trail)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('contribution', 'extra_contribution', 'withdrawal', 'bank_deposit', 'expense', 'member_approved')),
  amount DECIMAL(10,2),
  description TEXT NOT NULL,
  member_id UUID REFERENCES public.members(id),
  member_name TEXT,
  approved_by UUID REFERENCES public.members(id),
  approved_by_name TEXT,
  transaction_id TEXT UNIQUE DEFAULT ('TXN-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  reference_id UUID,
  payment_source TEXT CHECK (payment_source IN ('orange_money', 'africell_money', 'bank_transfer', 'cash', NULL)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No UPDATE or DELETE allowed on ledger_entries (immutable)
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ledger_select_approved" ON public.ledger_entries;
CREATE POLICY "ledger_select_approved" ON public.ledger_entries 
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND status = 'approved'));
DROP POLICY IF EXISTS "ledger_insert_approved" ON public.ledger_entries;
CREATE POLICY "ledger_insert_approved" ON public.ledger_entries 
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND status = 'approved'));
-- NO UPDATE or DELETE policies — immutable by design

-- 4. Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('orange_money', 'africell_money', 'bank_transfer', 'cash')),
  category_id UUID REFERENCES public.fund_categories(id),
  approved_by UUID NOT NULL REFERENCES public.members(id),
  approved_by_name TEXT NOT NULL,
  ledger_entry_id UUID REFERENCES public.ledger_entries(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
-- All approved members can see withdrawals (transparency)
DROP POLICY IF EXISTS "withdrawals_select_approved" ON public.withdrawals;
CREATE POLICY "withdrawals_select_approved" ON public.withdrawals
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND status = 'approved'));
-- Only admins can insert withdrawals
DROP POLICY IF EXISTS "withdrawals_insert_admin" ON public.withdrawals;
CREATE POLICY "withdrawals_insert_admin" ON public.withdrawals
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('admin', 'treasurer') AND status = 'approved'));

-- 5. Ensure fund_balances has rows for all categories
INSERT INTO public.fund_balances (category_id, balance)
SELECT fc.id, 0 FROM public.fund_categories fc
WHERE NOT EXISTS (
  SELECT 1 FROM public.fund_balances fb WHERE fb.category_id = fc.id
);

-- 6. Add mobile_money_balance column to fund tracking
ALTER TABLE public.fund_balances ADD COLUMN IF NOT EXISTS mobile_money_balance DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.fund_balances ADD COLUMN IF NOT EXISTS bank_balance DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 7. Fix notifications: ensure member_id column exists alongside user_id
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.members(id);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ledger_member_id ON public.ledger_entries(member_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON public.ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON public.ledger_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_approved_by ON public.withdrawals(approved_by);
CREATE INDEX IF NOT EXISTS idx_contributions_is_extra ON public.contributions(is_extra);
CREATE INDEX IF NOT EXISTS idx_contributions_allocated_month ON public.contributions(allocated_month);

-- 9. Update the member trigger to include role=admin → status=approved
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  -- Check if this is one of the nominated admin emails
  is_admin_email := NEW.email IN (
    'samuel540wisesamura@gmail.com',
    'paulannehk@gmail.com'
  );

  -- Only insert if no member row exists for this auth user id
  IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = NEW.id) THEN
    INSERT INTO public.members (id, full_name, phone, email, role, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Member'),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NEW.email,
      CASE WHEN is_admin_email THEN 'admin' ELSE 'member' END,
      CASE WHEN is_admin_email THEN 'approved' ELSE 'pending' END
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

