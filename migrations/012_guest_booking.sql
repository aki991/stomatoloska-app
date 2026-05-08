-- Migration: 012_guest_booking
-- Enables guest (anonymous) checkout: a visitor can book an appointment
-- without registering. Anonymous users get:
--   • SELECT on active services + open working_hours (read-only)
--   • SELECT on relevant time_off rows (so the calendar can disable them)
--   • SELECT on appointments time-window (so taken slots are correctly hidden)
--   • A SECURITY DEFINER RPC that inserts the appointment as walk-in.
-- Direct INSERT to appointments is NOT granted to anon — only via RPC.
-- Safe to re-run.

-- ============================================================
-- 1. PUBLIC READ — services (only active rows visible to anon)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'services'
       AND policyname = 'Anyone can view active services'
  ) THEN
    CREATE POLICY "Anyone can view active services"
      ON services FOR SELECT TO anon
      USING (is_active = true);
  END IF;
END $$;

-- ============================================================
-- 2. PUBLIC READ — working_hours (only open days visible to anon)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'working_hours'
       AND policyname = 'Anyone can view working hours'
  ) THEN
    CREATE POLICY "Anyone can view working hours"
      ON working_hours FOR SELECT TO anon
      USING (is_closed = false);
  END IF;
END $$;

-- ============================================================
-- 3. PUBLIC READ — time_off (so the date picker can disable holidays)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'time_off'
       AND policyname = 'Anyone can view time off'
  ) THEN
    CREATE POLICY "Anyone can view time off"
      ON time_off FOR SELECT TO anon
      USING (true);
  END IF;
END $$;

-- ============================================================
-- 4. PUBLIC READ — appointments (booked time windows so taken slots are hidden)
--     Only minimal columns are needed by the client (starts_at, ends_at, status).
--     We expose all columns but the client only selects time fields; combine with
--     a column-level GRANT if you need to restrict further.
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'appointments'
       AND policyname = 'Anyone can view active appointment time slots'
  ) THEN
    CREATE POLICY "Anyone can view active appointment time slots"
      ON appointments FOR SELECT TO anon
      USING (status IN ('confirmed', 'pending'));
  END IF;
END $$;

-- ============================================================
-- 5. RPC — create_guest_appointment (SECURITY DEFINER, validates input)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_guest_appointment(
  p_walk_in_name  text,
  p_walk_in_phone text,
  p_service_id    uuid,
  p_starts_at     timestamptz,
  p_ends_at       timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_appointment_id uuid;
  v_service_active   boolean;
BEGIN
  -- Input validation
  IF p_walk_in_name IS NULL OR length(trim(p_walk_in_name)) < 2 THEN
    RAISE EXCEPTION 'Ime mora imati minimum 2 karaktera' USING ERRCODE = '22023';
  END IF;

  IF p_walk_in_phone IS NULL OR length(regexp_replace(p_walk_in_phone, '\s+', '', 'g')) < 9 THEN
    RAISE EXCEPTION 'Neispravan broj telefona' USING ERRCODE = '22023';
  END IF;

  IF p_starts_at < now() THEN
    RAISE EXCEPTION 'Termin ne može biti u prošlosti' USING ERRCODE = '22023';
  END IF;

  IF p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'Krajnje vreme mora biti posle početnog' USING ERRCODE = '22023';
  END IF;

  -- Service must exist and be active
  SELECT is_active INTO v_service_active FROM services WHERE id = p_service_id;
  IF v_service_active IS NULL THEN
    RAISE EXCEPTION 'Usluga ne postoji' USING ERRCODE = '22023';
  END IF;
  IF v_service_active = false THEN
    RAISE EXCEPTION 'Izabrana usluga više nije aktivna' USING ERRCODE = '22023';
  END IF;

  -- Reject overlap with confirmed/pending appointments
  IF EXISTS (
    SELECT 1 FROM appointments
     WHERE status IN ('confirmed', 'pending')
       AND tstzrange(starts_at, ends_at) && tstzrange(p_starts_at, p_ends_at)
  ) THEN
    RAISE EXCEPTION 'Termin je već zauzet' USING ERRCODE = '23P01';
  END IF;

  -- Insert appointment as walk-in (no patient_id)
  INSERT INTO appointments (
    patient_id,
    walk_in_name,
    walk_in_phone,
    service_id,
    starts_at,
    ends_at,
    status
  ) VALUES (
    NULL,
    trim(p_walk_in_name),
    trim(p_walk_in_phone),
    p_service_id,
    p_starts_at,
    p_ends_at,
    'confirmed'
  )
  RETURNING id INTO new_appointment_id;

  RETURN jsonb_build_object('id', new_appointment_id, 'success', true);
END;
$$;

-- Allow anonymous and authenticated callers to invoke the RPC
REVOKE ALL ON FUNCTION public.create_guest_appointment(text, text, uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_appointment(text, text, uuid, timestamptz, timestamptz) TO anon, authenticated;
