-- Migration: Add template-specific fields for TIMESHEET templates
-- Created: 2024-12-11
-- Purpose: Enable 5 different timesheet template types with custom fields

-- ====================================================================
-- Step 1: Add template_category column to invoice_designs (if not exists)
-- ====================================================================
-- NOTE: Already exists from invoice migration, but adding safe check
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='invoice_designs' AND column_name='template_category'
  ) THEN
    ALTER TABLE invoice_designs 
    ADD COLUMN template_category text;
    
    COMMENT ON COLUMN invoice_designs.template_category IS 
      'Template category for specialized workflows. INVOICE types: standard, product_gallery, work_services, etc. TIMESHEET types: standard_timesheet, project_based, with_materials, with_kilometers, multi_location';
  END IF;
END $$;

-- ====================================================================
-- Step 2: Add TIMESHEET-specific data columns
-- ====================================================================

-- Project-based timesheet fields
ALTER TABLE invoice_designs
ADD COLUMN IF NOT EXISTS ts_project_ref text,
ADD COLUMN IF NOT EXISTS ts_project_name text,
ADD COLUMN IF NOT EXISTS ts_project_manager text,
ADD COLUMN IF NOT EXISTS ts_completion_percentage integer CHECK (ts_completion_percentage >= 0 AND ts_completion_percentage <= 100);

COMMENT ON COLUMN invoice_designs.ts_project_ref IS 'TIMESHEET: Project reference number (project_based template)';
COMMENT ON COLUMN invoice_designs.ts_project_name IS 'TIMESHEET: Full project name (project_based template)';
COMMENT ON COLUMN invoice_designs.ts_project_manager IS 'TIMESHEET: Project manager name (project_based template)';
COMMENT ON COLUMN invoice_designs.ts_completion_percentage IS 'TIMESHEET: Project completion % (0-100) (project_based template)';

-- Materials timesheet fields
ALTER TABLE invoice_designs
ADD COLUMN IF NOT EXISTS ts_materials jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN invoice_designs.ts_materials IS 'TIMESHEET: Array of materials used [{name, quantity, unit_price, total}] (with_materials template)';

-- Kilometers timesheet fields
ALTER TABLE invoice_designs
ADD COLUMN IF NOT EXISTS ts_departure_address text,
ADD COLUMN IF NOT EXISTS ts_arrival_address text,
ADD COLUMN IF NOT EXISTS ts_kilometers numeric(10,2),
ADD COLUMN IF NOT EXISTS ts_rate_per_km numeric(10,2) DEFAULT 0.21; -- NL/BE standard 2024

COMMENT ON COLUMN invoice_designs.ts_departure_address IS 'TIMESHEET: Starting address for travel (with_kilometers template)';
COMMENT ON COLUMN invoice_designs.ts_arrival_address IS 'TIMESHEET: Destination address (with_kilometers template)';
COMMENT ON COLUMN invoice_designs.ts_kilometers IS 'TIMESHEET: Total kilometers traveled (with_kilometers template)';
COMMENT ON COLUMN invoice_designs.ts_rate_per_km IS 'TIMESHEET: Rate per kilometer in EUR (default: €0.21 NL/BE 2024) (with_kilometers template)';

-- Multi-location timesheet fields
ALTER TABLE invoice_designs
ADD COLUMN IF NOT EXISTS ts_locations jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN invoice_designs.ts_locations IS 'TIMESHEET: Array of work locations per day [{date, locations: [{address, start, end, work_type, hours}]}] (multi_location template)';

-- ====================================================================
-- Step 3: Insert 5 PREDEFINED TIMESHEET TEMPLATES
-- ====================================================================

-- Template 1: Standard Werkbon
INSERT INTO invoice_designs (
  id, user_id, name, type, template_category,
  primary_color, secondary_color, font_family, is_template, is_locked
) VALUES (
  'f8e7d6c5-b4a3-4920-8e1f-0d9c8b7a6f5e'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid, -- system template
  'Standaard Werkbon',
  'TIMESHEET',
  'standard_timesheet',
  '#f97316', -- orange
  '#fff7ed', -- orange-50
  'Inter',
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- Template 2: Za Projekt (Project-Based)
INSERT INTO invoice_designs (
  id, user_id, name, type, template_category,
  primary_color, secondary_color, font_family, is_template, is_locked
) VALUES (
  'a1b2c3d4-e5f6-4890-abcd-1234567890ab'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Werkbon Voor Project',
  'TIMESHEET',
  'project_based',
  '#3b82f6', -- blue
  '#eff6ff', -- blue-50
  'Roboto',
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- Template 3: Z Materiałami (With Materials)
INSERT INTO invoice_designs (
  id, user_id, name, type, template_category,
  primary_color, secondary_color, font_family, is_template, is_locked
) VALUES (
  'b2c3d4e5-f6a7-4901-bcde-2345678901bc'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Werkbon Met Materialen',
  'TIMESHEET',
  'with_materials',
  '#10b981', -- emerald
  '#f0fdf4', -- emerald-50
  'Lato',
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- Template 4: Z Kilometrami (With Kilometers)
INSERT INTO invoice_designs (
  id, user_id, name, type, template_category,
  primary_color, secondary_color, font_family, is_template, is_locked
) VALUES (
  'c3d4e5f6-a7b8-4012-cdef-3456789012cd'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Werkbon Met Kilometers',
  'TIMESHEET',
  'with_kilometers',
  '#8b5cf6', -- violet
  '#faf5ff', -- violet-50
  'Montserrat',
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- Template 5: Multi-Lokacja (Multi-Location)
INSERT INTO invoice_designs (
  id, user_id, name, type, template_category,
  primary_color, secondary_color, font_family, is_template, is_locked
) VALUES (
  'd4e5f6a7-b8c9-4123-def0-4567890123de'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Werkbon Meerdere Locaties',
  'TIMESHEET',
  'multi_location',
  '#ec4899', -- pink
  '#fef1f7', -- pink-50
  'Inter',
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Step 4: Verify templates created
-- ====================================================================
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count
  FROM invoice_designs
  WHERE type = 'TIMESHEET' AND is_template = true;
  
  RAISE NOTICE 'Created % TIMESHEET templates', template_count;
  
  IF template_count < 5 THEN
    RAISE WARNING 'Expected 5 TIMESHEET templates, found %', template_count;
  END IF;
END $$;
