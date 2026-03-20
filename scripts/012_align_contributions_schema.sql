-- 012_align_contributions_schema.sql
-- Fixes the massive schema discrepancy where the frontend is trying to save data
-- to columns that were never created in the PostgreSQL contributions table.

ALTER TABLE public.contributions 
  ADD COLUMN IF NOT EXISTS month TEXT,
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
