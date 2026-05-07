-- Migration: 006_admin_features
-- Adds walk-in patient support and admin-scope RLS so the admin role
-- can manage all appointments, all profiles, and the services catalog.

-- ============================================================
-- 1. WALK-IN COLUMNS + ADMIN NOTES
-- ============================================================
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS walk_in_name  TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS walk_in_phone TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS admin_notes   TEXT;

-- patient_id is now optional when the appointment is for a walk-in
ALTER TABLE appointments ALTER COLUMN patient_id DROP NOT NULL;

-- Either an account-bound patient OR a walk-in (name + phone) is required.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_or_walkin'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT patient_or_walkin
      CHECK (
        patient_id IS NOT NULL
        OR (walk_in_name IS NOT NULL AND walk_in_phone IS NOT NULL)
      );
  END IF;
END $$;

-- ============================================================
-- 2. ADMIN RLS POLICIES (added alongside existing patient policies;
--    PostgreSQL OR-merges policies, so patients keep their scope)
-- ============================================================

-- Appointments: admin can SELECT/INSERT/UPDATE/DELETE everything
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'appointments'
       AND policyname = 'Admins can do everything on appointments'
  ) THEN
    CREATE POLICY "Admins can do everything on appointments"
      ON appointments FOR ALL TO authenticated
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

-- Profiles: admin can read every patient profile (for booking + lookup)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'profiles'
       AND policyname = 'Admins can read all profiles'
  ) THEN
    CREATE POLICY "Admins can read all profiles"
      ON profiles FOR SELECT TO authenticated
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;

-- Services: admin can manage the catalog (insert/update/deactivate)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'services'
       AND policyname = 'Admins can manage services'
  ) THEN
    CREATE POLICY "Admins can manage services"
      ON services FOR ALL TO authenticated
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
  END IF;
END $$;
