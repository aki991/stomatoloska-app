-- Migration: 006_appointment_cancellation
-- Adds cancellation metadata columns and UPDATE policy for patients.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancelled_at  timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by  uuid,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- RLS: patients can update (cancel) their own future appointments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments'
      AND policyname = 'Patients can update own appointments'
  ) THEN
    CREATE POLICY "Patients can update own appointments"
      ON appointments FOR UPDATE TO authenticated
      USING  (patient_id = auth.uid())
      WITH CHECK (patient_id = auth.uid());
  END IF;
END $$;
