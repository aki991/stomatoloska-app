-- Migration: 007_verify_patient_appointments_rls
-- Idempotent re-create of the patient-facing RLS policies on `appointments`,
-- in case migration 006 left them in an inconsistent state (or the original
-- policy from 004 was never applied). Safe to re-run.
--
-- Note: PostgreSQL combines multiple PERMISSIVE policies with OR, so this
-- coexists with the admin "do everything" policy from 006 — admins continue
-- to have full access via their own policy.

-- ------------------------------------------------------------------
-- Inspection helper (run manually to see what's actually there):
--   SELECT policyname, cmd, qual, with_check
--     FROM pg_policies
--    WHERE tablename = 'appointments';
-- ------------------------------------------------------------------

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: patient reads only their own appointments.
DROP POLICY IF EXISTS "Patients can read own appointments" ON appointments;
CREATE POLICY "Patients can read own appointments"
  ON appointments FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

-- 2. INSERT: patient may only insert appointments for themselves.
DROP POLICY IF EXISTS "Patients can insert own appointments" ON appointments;
CREATE POLICY "Patients can insert own appointments"
  ON appointments FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- 3. UPDATE: patient may update only their own appointments
--    (e.g. cancellations from the patient app).
DROP POLICY IF EXISTS "Patients can update own appointments" ON appointments;
CREATE POLICY "Patients can update own appointments"
  ON appointments FOR UPDATE TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());
