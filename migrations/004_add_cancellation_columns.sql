-- Migration: 004_add_cancellation_columns
-- Adds cancellation metadata to the appointments table and enforces
-- a CHECK constraint so that cancelled rows always have the required fields.

-- 1. Add columns (safe to re-run thanks to IF NOT EXISTS)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by        UUID REFERENCES profiles(id);

-- 2. CHECK constraint: when status = 'cancelled', the who/when fields must be set
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conrelid = 'appointments'::regclass
      AND  conname  = 'check_cancellation_fields'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT check_cancellation_fields CHECK (
        status != 'cancelled'
        OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL)
      );
  END IF;
END $$;
