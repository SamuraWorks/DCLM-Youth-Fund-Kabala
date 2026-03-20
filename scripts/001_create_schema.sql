-- DLKYF Youth Fund Management System Schema

-- Members table (links to auth.users)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Fund categories for tracking different types of funds
CREATE TABLE IF NOT EXISTS public.fund_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default fund categories
INSERT INTO public.fund_categories (name, description) VALUES
  ('emergencies', 'Sickness, funerals, and urgent needs'),
  ('events', 'Church weddings, conferences, youth programs'),
  ('charity', 'Supporting members in need'),
  ('general', 'Extra contributions and general fund')
ON CONFLICT (name) DO NOTHING;

-- Contributions table
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  proof_url TEXT,
  transaction_reference TEXT,
  contribution_month DATE NOT NULL, -- First day of the month this contribution applies to
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_extra BOOLEAN NOT NULL DEFAULT FALSE, -- True if this is beyond the minimum
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank deposits table (for tracking mobile money to bank transfers)
CREATE TABLE IF NOT EXISTS public.bank_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  deposit_date DATE NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  receipt_url TEXT,
  deposited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fund transactions ledger (complete audit trail)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contribution', 'withdrawal', 'bank_deposit', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  member_id UUID REFERENCES public.members(id),
  category_id UUID REFERENCES public.fund_categories(id),
  reference_id UUID, -- Links to contributions, bank_deposits, etc.
  description TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fund balance tracking (current balances per category)
CREATE TABLE IF NOT EXISTS public.fund_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.fund_categories(id) UNIQUE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initialize fund balances for each category
INSERT INTO public.fund_balances (category_id, balance)
SELECT id, 0 FROM public.fund_categories
ON CONFLICT (category_id) DO NOTHING;

-- Notifications table (in-app notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment_confirmed', 'payment_rejected', 'reminder', 'announcement', 'approval')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members table
CREATE POLICY "members_select_own" ON public.members FOR SELECT USING (auth.uid() = id);
CREATE POLICY "members_select_admin" ON public.members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
);
CREATE POLICY "members_insert_admin" ON public.members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
);
CREATE POLICY "members_update_admin" ON public.members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
);

-- RLS Policies for fund_categories (everyone can read)
CREATE POLICY "fund_categories_select_all" ON public.fund_categories FOR SELECT TO authenticated USING (true);

-- RLS Policies for contributions
CREATE POLICY "contributions_select_own" ON public.contributions FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "contributions_select_admin" ON public.contributions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
);
CREATE POLICY "contributions_insert_own" ON public.contributions FOR INSERT WITH CHECK (
  member_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "contributions_update_admin" ON public.contributions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
);

-- RLS Policies for bank_deposits (admin only for write, all approved members can read)
CREATE POLICY "bank_deposits_select_approved" ON public.bank_deposits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "bank_deposits_insert_admin" ON public.bank_deposits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
);
CREATE POLICY "bank_deposits_update_admin" ON public.bank_deposits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
);

-- RLS Policies for transactions (read-only for approved members)
CREATE POLICY "transactions_select_approved" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "transactions_insert_admin" ON public.transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
);

-- RLS Policies for fund_balances (read-only for approved members)
CREATE POLICY "fund_balances_select_approved" ON public.fund_balances FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "fund_balances_update_admin" ON public.fund_balances FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
);

-- RLS Policies for notifications
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_admin" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  OR user_id = auth.uid()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON public.contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_month ON public.contributions(contribution_month);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_role ON public.members(role);
