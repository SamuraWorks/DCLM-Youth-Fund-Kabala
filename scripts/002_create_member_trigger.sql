-- Auto-create member profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.members (id, full_name, phone, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New Member'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'member'),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'role' = 'admin' THEN 'approved'
      ELSE 'pending'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create a welcome notification for the new user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to DLKYF!',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'role' = 'admin' THEN 'Your admin account is now active. You can manage members and contributions.'
      ELSE 'Your account is pending approval. An admin will review your membership soon.'
    END,
    'announcement'
  );

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
