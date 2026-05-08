-- Migration: 009_services_display_order
-- Adds display_order column to services for admin reordering

ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 9999;

-- Initialize sequential order for existing services (alphabetical)
WITH ordered AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY name) - 1) AS new_order
  FROM services
)
UPDATE services s
SET display_order = o.new_order
FROM ordered o
WHERE s.id = o.id;
