-- Run this entire script in the Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums Idempotently
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE member_role AS ENUM ('member', 'admin', 'treasurer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
        CREATE TYPE member_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contribution_status') THEN
        CREATE TYPE contribution_status AS ENUM ('pending', 'verified', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('orange_money', 'africell_money', 'bank_transfer', 'cash');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('contribution', 'withdrawal', 'deposit', 'expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('payment_reminder', 'payment_verified', 'payment_rejected', 'announcement', 'fund_update');
    END IF;
END $$;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    role member_role NOT NULL DEFAULT 'member',
    status member_status NOT NULL DEFAULT 'pending',
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount >= 20),
    month TEXT NOT NULL,
    year INT NOT NULL,
    payment_method payment_method NOT NULL,
    payment_reference TEXT,
    proof_url TEXT,
    status contribution_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fund_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    target_amount NUMERIC,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.fund_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.fund_categories(id) ON DELETE CASCADE,
    balance NUMERIC NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.bank_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount NUMERIC NOT NULL,
    deposit_date DATE NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    deposit_slip_url TEXT,
    deposited_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type transaction_type NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID, -- Can link to contribution_id or deposit_id
    category_id UUID REFERENCES public.fund_categories(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Automatic "updated_at" Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contributions_updated_at ON public.contributions;
CREATE TRIGGER update_contributions_updated_at
    BEFORE UPDATE ON public.contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Initial Seed Data for Funds
INSERT INTO public.fund_categories (name, description, target_amount, is_active) VALUES 
('General Fund', 'Default fund for regular allocations and extra contributions', NULL, true),
('Emergency Fund', 'Fund strictly meant for sickness, funerals, and emergencies', NULL, true),
('Events & Programs', 'Funding for church weddings, conferences, youth programs', NULL, true),
('Charity', 'Supporting needy members within the church', NULL, true)
ON CONFLICT (name) DO NOTHING;

-- 5. Row Level Security Setup (Enable quickly, but set policy to permissive for rapid deployment or restrict appropriately)
-- Note: Replace the permissive policies with actual authenticated restrictions if needed for prod
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.contributions FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.fund_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON public.fund_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable updates for admins" ON public.fund_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.fund_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.fund_balances FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.bank_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.bank_deposits FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
