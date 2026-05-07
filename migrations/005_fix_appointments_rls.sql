-- Migration: 005_fix_appointments_rls
-- Problem: the "Patients can read own appointments" policy (patient_id = auth.uid())
-- blocks reading other patients' confirmed appointments, so taken slots appear free.
-- Fix: replace with a policy that lets all authenticated users read all appointments
-- (needed for correct slot availability). INSERT stays patient-scoped.

-- 1. Drop the over-restrictive SELECT policy
DROP POLICY IF EXISTS "Patients can read own appointments" ON appointments;

-- 2. Allow all authenticated users to read all appointments
--    (time-slot availability requires seeing other patients' bookings)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments'
      AND policyname = 'Authenticated users can read all appointments'
  ) THEN
    CREATE POLICY "Authenticated users can read all appointments"
      ON appointments
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- INSERT policy from migration 004 stays unchanged:
-- "Patients can insert own appointments" WITH CHECK (patient_id = auth.uid())
