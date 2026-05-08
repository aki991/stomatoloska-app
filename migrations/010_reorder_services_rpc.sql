-- Migration: 010_reorder_services_rpc
-- Replaces UPSERT-based reordering with a safe RPC that issues a single UPDATE.
-- UPSERT fails because it tries to INSERT rows with only id+display_order,
-- violating the NOT NULL constraint on name.

CREATE OR REPLACE FUNCTION reorder_services(items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can reorder services';
  END IF;

  UPDATE services s
  SET display_order = (item->>'display_order')::int
  FROM jsonb_array_elements(items) AS item
  WHERE s.id = (item->>'id')::uuid;
END;
$$;
