-- Migration: 003_add_category_to_services
-- Description: Add category column to services table and insert initial service data

-- 1. Add category column
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Ostalo';

-- 2. Enable RLS if not already enabled
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy: authenticated users can read active services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'services' AND policyname = 'Authenticated users can read active services'
  ) THEN
    CREATE POLICY "Authenticated users can read active services"
      ON services
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END
$$;

-- 4. Insert initial services
INSERT INTO services (name, description, category, duration_minutes, price, is_active) VALUES
  ('Pregled i dijagnostika',   'Kompletan stomatološki pregled sa RTG snimkom',    'Preventiva',   30,  2500, true),
  ('Čišćenje kamenca',         'Profesionalno uklanjanje kamenca i poliranje',      'Preventiva',   45,  3500, true),
  ('Plombiranje (kompozit)',   'Estetska kompozitna plomba bele boje',              'Restauracija', 45,  6000, true),
  ('Inlay / Onlay',            'Keramički ili kompozitni umetak za veće defekte',   'Restauracija', 60, 12000, true),
  ('Vađenje zuba',             'Ekstrakcija zuba u lokalnoj anesteziji',            'Hirurgija',    30,  4000, true),
  ('Hirurško vađenje',         'Ekstrakcija impaktiranog ili umnjaka',              'Hirurgija',    60,  8000, true),
  ('Izbeljivanje zuba',        'Profesionalno izbeljivanje u ordinaciji',           'Estetika',     60, 15000, true),
  ('Estetske fasete',          'Keramičke ili kompozitne fasete',                   'Estetika',     90, 25000, true),
  ('Ortodontski pregled',      'Procena za fiksni aparat ili aligner',              'Ortodoncija',  30,  3000, true),
  ('Fiksni ortodontski aparat','Metalni ili keramički breketi (po luku)',           'Ortodoncija',  60, 45000, true),
  ('Dečji pregled',            'Preventivni pregled za decu do 12 godina',          'Dečja stom.',  20,  1500, true),
  ('Zalivanje fisura',         'Preventivna zaštita zuba kod dece',                'Dečja stom.',  20,  2000, true)
ON CONFLICT DO NOTHING;
