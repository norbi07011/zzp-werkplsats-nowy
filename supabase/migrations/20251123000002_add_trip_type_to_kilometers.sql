-- Add trip_type column to invoice_kilometer_entries table
-- Migration: 20251123000002_add_trip_type_to_kilometers.sql
-- Purpose: Add trip type categorization (BUSINESS/COMMUTE/PRIVATE) for kilometers tracking

-- Add trip_type column with CHECK constraint
ALTER TABLE invoice_kilometer_entries 
ADD COLUMN trip_type TEXT CHECK (trip_type IN ('BUSINESS', 'COMMUTE', 'PRIVATE')) DEFAULT 'BUSINESS';

-- Add comment
COMMENT ON COLUMN invoice_kilometer_entries.trip_type IS 'Trip category: BUSINESS (Zakelijk), COMMUTE (Woon-werk), PRIVATE (Privé)';

-- Create index for filtering by trip_type
CREATE INDEX idx_invoice_kilometer_entries_trip_type 
ON invoice_kilometer_entries(trip_type);

-- Update existing entries to BUSINESS (default)
UPDATE invoice_kilometer_entries 
SET trip_type = 'BUSINESS' 
WHERE trip_type IS NULL;

-- Make column NOT NULL after setting defaults
ALTER TABLE invoice_kilometer_entries 
ALTER COLUMN trip_type SET NOT NULL;
