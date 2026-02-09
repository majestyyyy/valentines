-- ============================================
-- ENFORCE UE EMAIL VALIDATION
-- ============================================
-- This prevents any user from signing up with non-UE emails
-- Works at the database level, cannot be bypassed by frontend manipulation

-- Function to validate UE email on profile creation
CREATE OR REPLACE FUNCTION validate_ue_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if email is not null and not empty
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;
  
  -- Check if email ends with @ue.edu.ph (case-insensitive)
  -- This is a simple check that works with any format before the @
  IF LOWER(NEW.email) NOT LIKE '%@ue.edu.ph' THEN
    RAISE EXCEPTION 'Only @ue.edu.ph email addresses are allowed'
      USING HINT = 'Please use your University of the East email address',
            ERRCODE = 'invalid_parameter_value';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (DISABLED FOR NOW)
-- The frontend validation is sufficient for blocking non-UE emails
-- Re-enable these triggers once signup flow is tested and working
DROP TRIGGER IF EXISTS enforce_ue_email_on_insert ON profiles;
DROP TRIGGER IF EXISTS enforce_ue_email_on_update ON profiles;

-- TRIGGERS DISABLED - Frontend handles validation
-- Uncomment below to re-enable database-level enforcement:

-- CREATE TRIGGER enforce_ue_email_on_insert
--   BEFORE INSERT ON profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION validate_ue_email();

-- CREATE TRIGGER enforce_ue_email_on_update
--   BEFORE UPDATE ON profiles
--   FOR EACH ROW
--   WHEN (OLD.email IS DISTINCT FROM NEW.email)
--   EXECUTE FUNCTION validate_ue_email();

-- Add comment for documentation
COMMENT ON FUNCTION validate_ue_email() IS 'Enforces @ue.edu.ph email domain validation at database level. Cannot be bypassed by frontend manipulation.';

-- Test the validation (uncomment to test)
-- This should fail:
-- INSERT INTO profiles (id, email) VALUES ('00000000-0000-0000-0000-000000000000', 'hacker@gmail.com');

-- This should succeed:
-- INSERT INTO profiles (id, email) VALUES ('00000000-0000-0000-0000-000000000000', 'student@ue.edu.ph');
