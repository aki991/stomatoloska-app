-- Migration: 005_update_working_hours
-- New schedule: Mon–Fri 09:00–15:00, Saturday closed.
-- Column names follow existing schema: closes_at, is_closed
-- (the booking app reads these — see src/types/index.ts WorkingHours).

UPDATE working_hours
   SET opens_at  = '09:00',
       closes_at = '15:00',
       is_closed = false
 WHERE day_of_week BETWEEN 1 AND 5;

UPDATE working_hours
   SET is_closed = true
 WHERE day_of_week = 6;
