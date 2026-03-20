-- ==============================================================================
-- PRODUCTION RESET SCRIPT: WIPE ALL TEST DATA
-- WARNING: THIS WILL PERMANENTLY DELETE ALL MEMBERS, PAYMENTS, AND LEDGER ENTRIES.
-- ==============================================================================

BEGIN;

-- 1. Wipe all data tables in order of dependency
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.ledger_entries CASCADE;
TRUNCATE TABLE public.contributions CASCADE;
TRUNCATE TABLE public.withdrawals CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.members CASCADE;

-- 2. Reset Fund Balances to Zero
UPDATE public.fund_balances SET balance = 0, last_updated = NOW();

COMMIT;

-- IMPORTANT FINAL STEP:
-- You MUST manually delete all users from your "Authentication" -> "Users" 
-- tab in the Supabase Dashboard to complete the reset!
