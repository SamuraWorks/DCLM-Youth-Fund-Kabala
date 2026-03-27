-- ============================================================
-- DLKYF — Minimal Fix: User Registration Trigger
-- Run ONLY this script in Supabase SQL Editor to fix sign-up
-- ============================================================

-- Fix the trigger so new users are saved correctly
-- members table: id = auto UUID, user_id = auth.users.id, phone = NOT NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  -- Check if this is a nominated admin email
  is_admin_email := NEW.email IN (
    'admin1@dclm-youth.org',
    'admin2@dclm-youth.org'
  );

  -- Only insert if no member record exists for this auth user yet
  IF NOT EXISTS (SELECT 1 FROM public.members WHERE user_id = NEW.id) THEN
    INSERT INTO public.members (user_id, full_name, phone, email, role, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Member'),
      COALESCE(NEW.raw_user_meta_data->>'phone', 'N/A'),
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

-- Verify trigger was created
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
