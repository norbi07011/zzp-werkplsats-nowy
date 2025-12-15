-- =====================================================
-- INVOICE DESIGNS TABLE
-- =====================================================
-- Stores custom invoice/document templates created in Documents page
-- Supports: INVOICE, TIMESHEET, OFFER, CONTRACT, CV, LETTER
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template metadata
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INVOICE', 'TIMESHEET', 'OFFER', 'CONTRACT', 'CV', 'LETTER')),
  
  -- Design colors
  primary_color TEXT NOT NULL DEFAULT '#0ea5e9',
  secondary_color TEXT NOT NULL DEFAULT '#f1f5f9',
  text_color TEXT NOT NULL DEFAULT '#1e293b',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  
  -- Typography
  font_family TEXT NOT NULL DEFAULT 'Inter' CHECK (font_family IN ('Inter', 'Playfair Display', 'Courier Prime', 'Roboto', 'Lato', 'Montserrat')),
  font_size_scale NUMERIC NOT NULL DEFAULT 1.0 CHECK (font_size_scale BETWEEN 0.8 AND 1.5),
  line_height NUMERIC NOT NULL DEFAULT 1.5 CHECK (line_height BETWEEN 1.0 AND 2.0),
  
  -- Layout
  header_align TEXT NOT NULL DEFAULT 'left' CHECK (header_align IN ('left', 'center', 'right')),
  global_margin INTEGER NOT NULL DEFAULT 15 CHECK (global_margin BETWEEN 0 AND 40),
  border_radius INTEGER NOT NULL DEFAULT 0 CHECK (border_radius BETWEEN 0 AND 20),
  paper_texture TEXT NOT NULL DEFAULT 'plain' CHECK (paper_texture IN ('plain', 'dots', 'lines', 'grain')),
  
  -- Logo settings
  logo_url TEXT,
  logo_size INTEGER NOT NULL DEFAULT 80 CHECK (logo_size BETWEEN 20 AND 200),
  holographic_logo BOOLEAN NOT NULL DEFAULT false,
  
  -- Features
  show_qr_code BOOLEAN NOT NULL DEFAULT true,
  show_product_frames BOOLEAN NOT NULL DEFAULT false,
  show_signature_line BOOLEAN NOT NULL DEFAULT false,
  show_watermark BOOLEAN NOT NULL DEFAULT false,
  show_page_numbers BOOLEAN NOT NULL DEFAULT false,
  watermark_url TEXT,
  
  -- Content blocks (main template structure)
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Labels customization
  labels JSONB NOT NULL DEFAULT '{
    "title": "DOKUMENT",
    "invoiceNo": "Nr",
    "from": "Nadawca",
    "to": "Odbiorca",
    "total": "SUMA",
    "date": "Data",
    "dueDate": "Termin"
  }'::jsonb,
  
  -- Document-specific data
  cv_profile_photo TEXT,
  cv_data JSONB,
  offer_data JSONB,
  contract_data JSONB,
  letter_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_invoice_designs_user_id ON invoice_designs(user_id);
CREATE INDEX idx_invoice_designs_type ON invoice_designs(type);
CREATE INDEX idx_invoice_designs_user_type ON invoice_designs(user_id, type);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE invoice_designs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own designs
CREATE POLICY "Users can view own invoice_designs"
  ON invoice_designs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own designs
CREATE POLICY "Users can insert own invoice_designs"
  ON invoice_designs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own designs
CREATE POLICY "Users can update own invoice_designs"
  ON invoice_designs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own designs
CREATE POLICY "Users can delete own invoice_designs"
  ON invoice_designs
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_invoice_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_designs_updated_at
  BEFORE UPDATE ON invoice_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_designs_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE invoice_designs IS 'Custom invoice/document templates - supports INVOICE, TIMESHEET, OFFER, CONTRACT, CV, LETTER types';
COMMENT ON COLUMN invoice_designs.blocks IS 'JSONB array of document blocks (heading, paragraph, table, signature, etc.)';
COMMENT ON COLUMN invoice_designs.labels IS 'Customizable labels for invoice fields (multilingual support)';
COMMENT ON COLUMN invoice_designs.type IS 'Document type: INVOICE (faktury), TIMESHEET (werkbon/godziny pracy), OFFER (oferty), CONTRACT (umowy), CV, LETTER';
