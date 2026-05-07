-- Migration: 007_notifications_columns
-- Adds scheduling/tracking columns to notifications and full RLS for both
-- push_tokens and notifications tables.

-- ── 1. notifications: add missing columns ────────────────────────────────────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scheduled_for  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at        TIMESTAMPTZ;

-- ── 2. RLS – push_tokens ─────────────────────────────────────────────────────
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_tokens'
    AND policyname='Users can read own push tokens') THEN
    CREATE POLICY "Users can read own push tokens"
      ON push_tokens FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_tokens'
    AND policyname='Users can insert own push tokens') THEN
    CREATE POLICY "Users can insert own push tokens"
      ON push_tokens FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_tokens'
    AND policyname='Users can update own push tokens') THEN
    CREATE POLICY "Users can update own push tokens"
      ON push_tokens FOR UPDATE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ── 3. RLS – notifications ────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications'
    AND policyname='Users can read own notifications') THEN
    CREATE POLICY "Users can read own notifications"
      ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications'
    AND policyname='Users can insert own notifications') THEN
    CREATE POLICY "Users can insert own notifications"
      ON notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications'
    AND policyname='Users can delete own notifications') THEN
    CREATE POLICY "Users can delete own notifications"
      ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;
