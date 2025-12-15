-- =====================================================
-- INVOICE VEHICLES TABLE
-- =====================================================
-- Multi-vehicle management for kilometer tracking
-- Each user can have multiple vehicles (car, motorcycle, bike, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic info
    name TEXT NOT NULL, -- e.g. "Mercedes Sprinter", "Honda CBR", "Gazelle E-bike"
    brand TEXT,
    model TEXT,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle', 'bike', 'scooter', 'electric_bike')),

    -- Registration
    license_plate TEXT, -- NL format: XX-123-YY
    registration_year INTEGER,
    registration_country TEXT DEFAULT 'NL',

    -- Technical
    fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'none')),
    current_odometer INTEGER NOT NULL DEFAULT 0,
    is_company_vehicle BOOLEAN NOT NULL DEFAULT FALSE, -- false = private, true = company

    -- Tax rate (overrides default if set)
    custom_rate_per_km NUMERIC(5,2), -- Optional custom rate €/km

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Active vehicles shown in trip form
    is_default BOOLEAN NOT NULL DEFAULT FALSE, -- Default selected vehicle

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoice_vehicles_user ON invoice_vehicles(user_id);
CREATE INDEX idx_invoice_vehicles_active ON invoice_vehicles(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_invoice_vehicles_default ON invoice_vehicles(user_id, is_default) WHERE is_default = TRUE;

-- RLS Policies
ALTER TABLE invoice_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vehicles"
    ON invoice_vehicles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
    ON invoice_vehicles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
    ON invoice_vehicles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
    ON invoice_vehicles FOR DELETE
    USING (auth.uid() = user_id);

-- Function: Ensure only one default vehicle per user
CREATE OR REPLACE FUNCTION ensure_one_default_vehicle()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        -- Unset other defaults for this user
        UPDATE invoice_vehicles
        SET is_default = FALSE
        WHERE user_id = NEW.user_id
          AND id != NEW.id
          AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_one_default_vehicle
    BEFORE INSERT OR UPDATE ON invoice_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_one_default_vehicle();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoice_vehicles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_vehicles_timestamp
    BEFORE UPDATE ON invoice_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_vehicles_timestamp();

-- =====================================================
-- UPDATE KILOMETER ENTRIES TO REFERENCE VEHICLES
-- =====================================================
-- Add vehicle_id column to invoice_kilometer_entries
ALTER TABLE invoice_kilometer_entries
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES invoice_vehicles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_kilometer_entries_vehicle 
ON invoice_kilometer_entries(vehicle_id);

-- Comment: vehicle_type and is_private_vehicle are kept for backward compatibility
-- New entries should use vehicle_id to reference the vehicles table
COMMENT ON COLUMN invoice_kilometer_entries.vehicle_id IS 'Reference to invoice_vehicles table (NEW)';
COMMENT ON COLUMN invoice_kilometer_entries.vehicle_type IS 'DEPRECATED: Use vehicle_id instead. Kept for old entries.';
COMMENT ON COLUMN invoice_kilometer_entries.is_private_vehicle IS 'DEPRECATED: Use vehicle.is_company_vehicle instead.';
