-- ============================================================
-- DLKYF — Robust User Registration Trigger
-- This version uses BEGIN...EXCEPTION to ensure it never 
-- fails the main Auth transaction.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_email BOOLEAN;
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  -- 1. Determine if this is a nominated admin
  is_admin_email := NEW.email IN (
    'admin1@dclm-youth.org',
    'admin2@dclm-youth.org',
    'admin3@dclm-youth.org'
  );

  -- 2. Extract metadata safely
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Member');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', 'N/A');

  -- 3. Perform the insert inside its own sub-transaction block
  BEGIN
    INSERT INTO public.members (user_id, full_name, phone, email, role, status)
    VALUES (
      NEW.id,
      v_full_name,
      v_phone,
      NEW.email,
      CASE WHEN is_admin_email THEN 'admin'::member_role ELSE 'member'::member_role END,
      CASE WHEN is_admin_email THEN 'approved'::member_status ELSE 'pending'::member_status END
    )
    ON CONFLICT (email) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but DO NOT fail (this prevents Auth transaction rollback)
    RAISE WARNING 'Profile creation failed for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Ensure trigger is applied correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
