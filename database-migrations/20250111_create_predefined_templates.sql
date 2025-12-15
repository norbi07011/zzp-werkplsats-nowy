-- Migration: Create 10 Predefined Dutch Invoice Templates
-- Date: 2025-01-11
-- Purpose: Add professional invoice templates for ZZP Werkplaats

DO $$
DECLARE
  system_user_id UUID;
BEGIN
  -- Get admin user for template ownership
  SELECT id INTO system_user_id FROM profiles WHERE role = 'admin' LIMIT 1;

  -- Template #2: Product Factuur (Product Invoice)
  INSERT INTO invoice_designs (
    user_id, name, type, is_template, is_locked, template_category,
    primary_color, secondary_color, text_color, font_family,
    show_qr_code, show_signature_line,
    blocks, labels
  ) VALUES (
    system_user_id, 'Product Factuur', 'INVOICE', TRUE, TRUE, 'product',
    '#10b981', '#ecfdf5', '#064e3b', 'Inter', TRUE, FALSE,
    '[
      {"id": "heading_1", "type": "heading_h1", "content": {"text": "PRODUCT FACTUUR", "align": "center"}, "position": 0},
      {"id": "gallery_1", "type": "gallery", "content": {"images": [], "layout": "grid_3x1", "maxImages": 3}, "position": 1},
      {"id": "table_1", "type": "table_simple", "content": {"headers": ["SKU", "Naam", "Aantal", "Prijs", "BTW%", "Totaal"], "columns": 6, "dataSource": "product_lines"}, "position": 2},
      {"id": "price_list_1", "type": "price_list", "content": {"items": [{"label": "Subtotaal", "key": "subtotal"}, {"label": "BTW 21%", "key": "vat"}, {"label": "Verzendkosten", "key": "shipping"}, {"label": "Totaal", "key": "total", "bold": true}]}, "position": 3},
      {"id": "qr_1", "type": "qr", "content": {"payload": "sepa", "size": 80}, "position": 4},
      {"id": "paragraph_1", "type": "paragraph", "content": {"text": "Retourbeleid: 14 dagen"}, "position": 5}
    ]'::jsonb,
    '{"title": "PRODUCT FACTUUR", "sku": "SKU", "name": "Naam", "quantity": "Aantal", "price": "Prijs", "vat_percent": "BTW%", "total": "Totaal", "shipping": "Verzendkosten"}'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Template #3: Diensten Factuur (Services Invoice)
  INSERT INTO invoice_designs (
    user_id, name, type, is_template, is_locked, template_category,
    primary_color, secondary_color, text_color, font_family,
    show_qr_code,
    blocks, labels
  ) VALUES (
    system_user_id, 'Diensten Factuur', 'INVOICE', TRUE, TRUE, 'service',
    '#8b5cf6', '#f5f3ff', '#4c1d95', 'Inter', TRUE,
    '[
      {"id": "heading_1", "type": "heading_h1", "content": {"text": "DIENSTEN FACTUUR", "align": "left"}, "position": 0},
      {"id": "table_hours", "type": "table_simple", "content": {"headers": ["Datum", "Omschrijving", "Uren", "Tarief", "Bedrag"], "columns": 5, "dataSource": "time_entries"}, "position": 1},
      {"id": "table_materials", "type": "materials_table", "content": {"headers": ["Omschrijving", "Bedrag"], "columns": 2, "dataSource": "materials"}, "position": 2},
      {"id": "price_list_1", "type": "price_list", "content": {"items": [{"label": "Subtotaal", "key": "subtotal"}, {"label": "BTW 21%", "key": "vat"}, {"label": "Totaal", "key": "total", "bold": true}]}, "position": 3},
      {"id": "qr_1", "type": "qr", "content": {"payload": "sepa", "size": 80}, "position": 4}
    ]'::jsonb,
    '{"title": "DIENSTEN FACTUUR", "date": "Datum", "description": "Omschrijving", "hours": "Uren", "rate": "Tarief", "amount": "Bedrag", "materials": "Materiaal/Kosten"}'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Template #4: Creditnota (Credit Note)
  INSERT INTO invoice_designs (
    user_id, name, type, is_template, is_locked, template_category,
    primary_color, secondary_color, text_color, font_family,
    show_qr_code,
    blocks, labels
  ) VALUES (
    system_user_id, 'Creditnota', 'INVOICE', TRUE, TRUE, 'creditnota',
    '#ef4444', '#fef2f2', '#7f1d1d', 'Inter', FALSE,
    '[
      {"id": "heading_1", "type": "heading_h1", "content": {"text": "CREDITNOTA", "align": "left", "color": "#ef4444"}, "position": 0},
      {"id": "paragraph_ref", "type": "paragraph", "content": {"text": "Originele Factuur: {{original_invoice}}"}, "position": 1},
      {"id": "paragraph_reason", "type": "paragraph", "content": {"text": "Reden: {{credit_reason}}"}, "position": 2},
      {"id": "table_1", "type": "table_simple", "content": {"headers": ["Item", "Aantal", "Bedrag"], "columns": 3, "dataSource": "credit_lines"}, "position": 3},
      {"id": "price_list_1", "type": "price_list", "content": {"items": [{"label": "Subtotaal", "key": "subtotal", "negative": true}, {"label": "BTW 21%", "key": "vat", "negative": true}, {"label": "Credit", "key": "total", "bold": true, "negative": true}]}, "position": 4},
      {"id": "info_grid_1", "type": "info_grid", "content": {"fields": [{"label": "Teruggave Methode", "key": "refund_method"}, {"label": "IBAN", "key": "iban"}]}, "position": 5}
    ]'::jsonb,
    '{"title": "CREDITNOTA", "original_invoice": "Originele Factuur", "credit_reason": "Reden", "refund_method": "Teruggave Methode", "iban": "IBAN"}'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Template #5: Werkbon (Timesheet)
  INSERT INTO invoice_designs (
    user_id, name, type, is_template, is_locked, template_category,
    primary_color, secondary_color, text_color, font_family,
    show_qr_code, show_signature_line,
    blocks, labels
  ) VALUES (
    system_user_id, 'Werkbon', 'TIMESHEET', TRUE, TRUE, 'werkbon',
    '#f97316', '#fff7ed', '#7c2d12', 'Inter', FALSE, TRUE,
    '[
      {"id": "heading_1", "type": "heading_h1", "content": {"text": "WERKBON / KARTA PRACY", "align": "center"}, "position": 0},
      {"id": "info_grid_1", "type": "info_grid", "content": {"fields": [{"label": "Zleceniodawca", "key": "client_name"}, {"label": "Adres", "key": "address"}, {"label": "Nr Zlecenia", "key": "order_number"}]}, "position": 1},
      {"id": "checklist_1", "type": "checklist", "content": {"title": "Zakres Prac", "items": []}, "position": 2},
      {"id": "materials_table_1", "type": "materials_table", "content": {"title": "Zużyte Materiały", "headers": ["Ilość", "Jedn.", "Nazwa Materiału"], "columns": 3}, "position": 3},
      {"id": "input_box_1", "type": "input_box", "content": {"label": "Uwagi", "height": 100}, "position": 4},
      {"id": "signature_1", "type": "signature", "content": {"text": "Podpis Pracownika", "showLine": true}, "position": 5},
      {"id": "signature_2", "type": "signature", "content": {"text": "Podpis Klienta", "showLine": true}, "position": 6}
    ]'::jsonb,
    '{"title": "WERKBON", "client": "Zleceniodawca", "address": "Adres", "order_number": "Nr Zlecenia", "work_scope": "Zakres Prac", "materials": "Zużyte Materiały", "notes": "Uwagi"}'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Template #6: Voorschot Factuur (Advance Payment)
  INSERT INTO invoice_designs (
    user_id, name, type, is_template, is_locked, template_category,
    primary_color, secondary_color, text_color, font_family,
    show_qr_code,
    blocks, labels
  ) VALUES (
    system_user_id, 'Voorschot Factuur', 'INVOICE', TRUE, TRUE, 'voorschot',
    '#0891b2', '#ecfeff', '#164e63', 'Inter', TRUE,
    '[
      {"id": "heading_1", "type": "heading_h1", "content": {"text": "VOORSCHOT FACTUUR", "align": "left"}, "position": 0},
      {"id": "paragraph_project", "type": "paragraph", "content": {"text": "Project: {{project_name}}"}, "position": 1},
      {"id": "price_list_project", "type": "price_list", "content": {"items": [{"label": "Totale Projectwaarde", "key": "project_total"}, {"label": "Voorschot (30%)", "key": "advance_amount", "bold": true}]}, "position": 2},
      {"id": "table_1", "type": "table_simple", "content": {"headers": ["Fase", "Bedrag", "Status"], "columns": 3, "dataSource": "payment_schedule"}, "position": 3},
      {"id": "price_list_1", "type": "price_list", "content": {"items": [{"label": "BTW 21%", "key": "vat"}, {"label": "Voorschot Te Betalen", "key": "total", "bold": true}]}, "position": 4},
      {"id": "qr_1", "type": "qr", "content": {"payload": "sepa", "size": 80}, "position": 5}
    ]'::jsonb,
    '{"title": "VOORSCHOT FACTUUR", "project_name": "Project", "project_total": "Totale Projectwaarde", "advance_amount": "Voorschot", "payment_schedule": "Betalingsschema", "phase": "Fase", "amount": "Bedrag", "status": "Status"}'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Template #7: Herhalingsfactuur (Recurring Invoice)
  INSERT INTO invoice_designs (
    user_id, name, type, is_template, is_locked, template_category,
    primary_color, secondary_color, text_color, font_family,
    show_qr_code,
    blocks, labels
  ) VALUES (
    system_user_id, 'Herhalingsfactuur', 'INVOICE', TRUE, TRUE, 'herhalingsfactuur',
    '#6366f1', '#eef2ff', '#312e81', 'Inter', TRUE,
    '[
      {"id": "heading_1", "type": "heading_h1", "content": {"text": "HERHALINGSFACTUUR", "align": "left"}, "position": 0},
      {"id": "paragraph_period", "type": "paragraph", "content": {"text": "Abonnement: {{subscription_name}}\nPeriode: {{period}}"}, "position": 1},
      {"id": "table_1", "type": "table_simple", "content": {"headers": ["Service", "Bedrag/maand"], "columns": 2, "dataSource": "subscription_lines"}, "position": 2},
      {"id": "price_list_1", "type": "price_list", "content": {"items": [{"label": "Subtotaal", "key": "subtotal"}, {"label": "BTW 21%", "key": "vat"}, {"label": "Totaal", "key": "total", "bold": true}]}, "position": 3},
      {"id": "paragraph_next", "type": "paragraph", "content": {"text": "Automatische Incasso:\nVolgende Betaling: {{next_payment_date}}"}, "position": 4},
      {"id": "qr_1", "type": "qr", "content": {"payload": "sepa", "size": 80}, "position": 5}
    ]'::jsonb,
    '{"title": "HERHALINGSFACTUUR", "subscription_name": "Abonnement", "period": "Periode", "service": "Service", "monthly_amount": "Bedrag/maand", "next_payment_date": "Volgende Betaling"}'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Template #8: Pro-forma Factuur (Proforma Invoice)
  INSERT INTO invoice_designs (
    user_id, name, type, is_template, is_locked, template_category,
    primary_color, secondary_color, text_color, font_family,
    show_qr_code,
    blocks, labels
  ) VALUES (
    system_user_id, 'Pro-forma Factuur', 'INVOICE', TRUE, TRUE, 'proforma',
    '#6b7280', '#f9fafb', '#1f2937', 'Inter', FALSE,
    '[
      {"id": "heading_1", "type": "heading_h1", "content": {"text": "PRO-FORMA FACTUUR", "align": "left", "color": "#6b7280"}, "position": 0},
      {"id": "paragraph_validity", "type": "paragraph", "content": {"text": "[NIET OFFICIEEL]\nGeldig tot: {{valid_until}}"}, "position": 1},
      {"id": "table_1", "type": "table_simple", "content": {"headers": ["Omschrijving", "Aantal", "Bedrag"], "columns": 3, "dataSource": "quote_lines"}, "position": 2},
      {"id": "price_list_1", "type": "price_list", "content": {"items": [{"label": "Subtotaal", "key": "subtotal"}, {"label": "BTW 21%", "key": "vat"}, {"label": "Totaal", "key": "total", "bold": true}]}, "position": 3},
      {"id": "quote_1", "type": "quote", "content": {"text": "⚠️ Dit is GEEN officiële factuur\nNa acceptatie volgt factuur"}, "position": 4}
    ]'::jsonb,
    '{"title": "PRO-FORMA FACTUUR", "valid_until": "Geldig tot", "description": "Omschrijving", "quantity": "Aantal", "amount": "Bedrag"}'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Template #9: BTW-Schuif Factuur (VAT Reverse Charge)
  INSERT INTO invoice_designs (
    user_id, name, type, is_template, is_locked, template_category,
    primary_color, secondary_color, text_color, font_family,
    show_qr_code,
    blocks, labels
  ) VALUES (
    system_user_id, 'BTW-Schuif Factuur', 'INVOICE', TRUE, TRUE, 'btw_schuif',
    '#14b8a6', '#f0fdfa', '#134e4a', 'Inter', FALSE,
    '[
      {"id": "heading_1", "type": "heading_h1", "content": {"text": "FACTUUR - BTW VERLEGD", "align": "left"}, "position": 0},
      {"id": "paragraph_legal", "type": "paragraph", "content": {"text": "Reverse Charge (Art. 69 BTW-wet)"}, "position": 1},
      {"id": "info_grid_1", "type": "info_grid", "content": {"fields": [{"label": "Klant (EU)", "key": "client_name"}, {"label": "Bedrijf", "key": "company_name"}, {"label": "BTW-ID", "key": "client_vat_id"}]}, "position": 2},
      {"id": "table_1", "type": "table_simple", "content": {"headers": ["Omschrijving", "Bedrag"], "columns": 2, "dataSource": "invoice_lines"}, "position": 3},
      {"id": "price_list_1", "type": "price_list", "content": {"items": [{"label": "Totaal", "key": "total", "bold": true}, {"label": "BTW", "key": "vat", "value": "€0"}]}, "position": 4},
      {"id": "quote_1", "type": "quote", "content": {"text": "(BTW verlegd naar klant)"}, "position": 5}
    ]'::jsonb,
    '{"title": "BTW VERLEGD", "client_eu": "Klant (EU)", "vat_id": "BTW-ID", "description": "Omschrijving", "amount": "Bedrag", "total": "Totaal", "vat": "BTW"}'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Template #10: Samenvattende Factuur (Summary Invoice)
  INSERT INTO invoice_designs (
    user_id, name, type, is_template, is_locked, template_category,
    primary_color, secondary_color, text_color, font_family,
    show_qr_code,
    blocks, labels
  ) VALUES (
    system_user_id, 'Samenvattende Factuur', 'INVOICE', TRUE, TRUE, 'samenvattende',
    '#059669', '#f0fdf4', '#064e3b', 'Inter', TRUE,
    '[
      {"id": "heading_1", "type": "heading_h1", "content": {"text": "SAMENVATTENDE FACTUUR", "align": "left"}, "position": 0},
      {"id": "paragraph_period", "type": "paragraph", "content": {"text": "Periode: {{period}} ({{start_month}} - {{end_month}})"}, "position": 1},
      {"id": "table_1", "type": "table_simple", "content": {"headers": ["Maand", "Omschrijving", "Bedrag"], "columns": 3, "dataSource": "monthly_breakdown"}, "position": 2},
      {"id": "price_list_1", "type": "price_list", "content": {"items": [{"label": "Subtotaal", "key": "subtotal"}, {"label": "BTW 21%", "key": "vat"}, {"label": "Totaal", "key": "total", "bold": true}]}, "position": 3},
      {"id": "qr_1", "type": "qr", "content": {"payload": "sepa", "size": 80}, "position": 4}
    ]'::jsonb,
    '{"title": "SAMENVATTENDE FACTUUR", "period": "Periode", "month": "Maand", "description": "Omschrijving", "amount": "Bedrag"}'::jsonb
  ) ON CONFLICT DO NOTHING;

END $$;

-- Verify templates created
SELECT name, template_category, is_template, is_locked 
FROM invoice_designs 
WHERE is_template = TRUE
ORDER BY template_category;
