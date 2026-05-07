-- Migration: 004_booking_seed_and_rls
-- Seeds working_hours with default schedule and adds RLS policies for booking tables.
-- Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING and DO $$ checks).

-- ============================================================
-- 1. WORKING HOURS  (opens_at / closes_at / is_closed)
-- ============================================================
INSERT INTO working_hours (day_of_week, opens_at, closes_at, is_closed) VALUES
  (0, '08:00', '16:00', true),   -- Sunday  — zatvoreno
  (1, '08:00', '18:00', false),  -- Monday
  (2, '08:00', '18:00', false),  -- Tuesday
  (3, '08:00', '18:00', false),  -- Wednesday
  (4, '08:00', '18:00', false),  -- Thursday
  (5, '08:00', '18:00', false),  -- Friday
  (6, '08:00', '13:00', false)   -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- ============================================================
-- 2. RLS — WORKING HOURS (read for authenticated users)
-- ============================================================
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'working_hours'
      AND policyname = 'Authenticated users can read working hours'
  ) THEN
    CREATE POLICY "Authenticated users can read working hours"
      ON working_hours FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ============================================================
-- 3. RLS — TIME OFF (read for authenticated users)
-- ============================================================
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'time_off'
      AND policyname = 'Authenticated users can read time off'
  ) THEN
    CREATE POLICY "Authenticated users can read time off"
      ON time_off FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ============================================================
-- 4. RLS — APPOINTMENTS
--    SELECT: patient can read own appointments
--    INSERT: authenticated users can insert their own
-- ============================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'appointments'
      AND policyname = 'Patients can read own appointments'
  ) THEN
    CREATE POLICY "Patients can read own appointments"
      ON appointments FOR SELECT TO authenticated
      USING (patient_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'appointments'
      AND policyname = 'Patients can insert own appointments'
  ) THEN
    CREATE POLICY "Patients can insert own appointments"
      ON appointments FOR INSERT TO authenticated
      WITH CHECK (patient_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 5. OPTIONAL: EXCLUDE constraint to prevent double-booking
--    Requires btree_gist extension. Safe to run once.
--    If your appointments table already has this, skip this block.
-- ============================================================
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
--
-- ALTER TABLE appointments
--   ADD CONSTRAINT no_overlapping_appointments
--   EXCLUDE USING gist (
--     tstzrange(starts_at, ends_at) WITH &&
--   )
--   WHERE (status NOT IN ('cancelled'));
