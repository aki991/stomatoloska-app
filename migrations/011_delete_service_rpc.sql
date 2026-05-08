-- Migration: 011_delete_service_rpc
-- Adds a SECURITY DEFINER RPC that safely deletes a service:
--   1. Verifies caller is admin
--   2. Blocks deletion if future confirmed appointments exist
--   3. NULLs service_id on historical appointments
--   4. Deletes the service row

-- service_id on appointments may have a NOT NULL constraint from the initial schema.
-- Drop it so historical appointments can survive after the service is deleted.
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION delete_service(service_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete services';
  END IF;

  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE service_id = service_uuid
      AND status = 'confirmed'
      AND starts_at > now()
  ) THEN
    RAISE EXCEPTION 'Cannot delete service with future confirmed appointments';
  END IF;

  UPDATE appointments SET service_id = NULL WHERE service_id = service_uuid;
  DELETE FROM services WHERE id = service_uuid;
END;
$$;
