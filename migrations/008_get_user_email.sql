-- Migration: 008_get_user_email
-- The `email` column does not live on `public.profiles` — it lives on
-- `auth.users`, which is not directly queryable from the client. Expose a
-- SECURITY DEFINER function so the admin can look up a patient's email by id.
--
-- Access is gated by RLS on `profiles`: only admins (per the policy added
-- in 006) can read other users' profile rows, so we mirror that gate here
-- by checking the caller's role before returning the email.

CREATE OR REPLACE FUNCTION public.get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_role text;
  result_email text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- Admins can look up anyone; users can only look up themselves.
  IF caller_role <> 'admin' AND auth.uid() <> user_id THEN
    RETURN NULL;
  END IF;

  SELECT email INTO result_email FROM auth.users WHERE id = user_id;
  RETURN result_email;
END;
$$;

-- Allow authenticated clients to call the function. The body still gates
-- who can actually read which email.
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;
