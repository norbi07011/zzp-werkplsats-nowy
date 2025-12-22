-- =====================================================
-- MIGRACJA: Uproszczenie szablonów faktur do 2 typów
-- Data: 2025-12-20
-- =====================================================
-- Usuwamy wszystkie stare predefined szablony
-- Tworzymy tylko 2 podstawowe:
-- 1. work_hours - Godzinówka / Praca
-- 2. product_gallery - Produkty ze zdjęciami
-- =====================================================

-- KROK 1: Usuń wszystkie stare szablony (is_template = true, user_id IS NULL)
DELETE FROM invoice_designs 
WHERE is_template = true 
AND user_id IS NULL;

-- KROK 2: Wstaw nowy szablon "Godzinówka / Praca"
INSERT INTO invoice_designs (
  id,
  name,
  type,
  primary_color,
  secondary_color,
  font_family,
  is_template,
  template_category,
  is_locked,
  user_id,
  header_align,
  logo_size,
  font_size_scale,
  show_qr_code,
  show_product_frames,
  holographic_logo,
  show_signature_line,
  show_watermark,
  blocks,
  labels,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Godzinówka / Praca',
  'INVOICE',
  '#1e40af',         -- Blue 800
  '#dbeafe',         -- Blue 100
  'Inter',
  true,              -- is_template
  'work_hours',      -- template_category
  true,              -- is_locked (cannot be edited)
  NULL,              -- user_id = NULL for global templates
  'left',
  80,
  1.0,
  true,              -- show QR code for payment
  false,
  false,
  true,              -- show signature line
  false,
  '[]'::jsonb,       -- empty blocks (use default invoice layout)
  '{
    "title": "FACTUUR",
    "invoiceNo": "Factuurnummer",
    "from": "Van",
    "to": "Aan",
    "total": "TOTAAL",
    "date": "Datum",
    "dueDate": "Vervaldatum"
  }'::jsonb,
  NOW(),
  NOW()
);

-- KROK 3: Wstaw nowy szablon "Produkty ze zdjęciami"
INSERT INTO invoice_designs (
  id,
  name,
  type,
  primary_color,
  secondary_color,
  font_family,
  is_template,
  template_category,
  is_locked,
  user_id,
  header_align,
  logo_size,
  font_size_scale,
  show_qr_code,
  show_product_frames,
  holographic_logo,
  show_signature_line,
  show_watermark,
  blocks,
  labels,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Produkty ze zdjęciami',
  'INVOICE',
  '#ea580c',         -- Orange 600
  '#ffedd5',         -- Orange 100
  'Inter',
  true,              -- is_template
  'product_gallery', -- template_category
  true,              -- is_locked
  NULL,              -- user_id = NULL for global templates
  'left',
  80,
  1.0,
  true,              -- show QR code for payment
  true,              -- show_product_frames = TRUE for gallery
  false,
  false,
  false,
  '[]'::jsonb,       -- empty blocks
  '{
    "title": "FACTUUR",
    "invoiceNo": "Factuurnummer",
    "from": "Van",
    "to": "Aan",
    "total": "TOTAAL",
    "date": "Datum",
    "dueDate": "Vervaldatum"
  }'::jsonb,
  NOW(),
  NOW()
);

-- KROK 4: Weryfikacja
SELECT id, name, template_category, primary_color, is_template
FROM invoice_designs 
WHERE is_template = true 
ORDER BY name;
