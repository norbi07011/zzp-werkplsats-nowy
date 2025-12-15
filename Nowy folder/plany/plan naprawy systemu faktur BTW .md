 RAPORT: Analiza Systemu Faktur BTW & Projekt Predefined Templates
✅ Co zrobiłem: Dogłębna Analiza
1. Przeanalizowana Architektura Systemu
Przeszukałem:

✅ Tabele bazy danych (80+ tabel live przez mcp_supabase_list_tables)
✅ Documents.tsx (2526 linii) - Studio Dokumentów 2.0
✅ InvoiceDesign.ts (130 linii) - Typy TypeScript
✅ pdf-generator.ts (437 linii) - Generator PDF z jsPDF + QRCode
✅ invoice-utils.ts - SEPA QR code generation
✅ BTWAangifte.tsx - Kwartalne deklaracje VAT
2. Tabela invoice_designs - Struktura Live

-- Z bazy danych (zweryfikowano live):- id: uuid (PK)- user_id: uuid (FK auth.users)- name: text- type: text (INVOICE | TIMESHEET | OFFER | CONTRACT | CV | LETTER)- primary_color, secondary_color, text_color, background_color- font_family: text (Inter | Playfair Display | Courier Prime | Roboto | Lato | Montserrat)- logo_url, logo_size: integer- show_qr_code, show_signature_line, show_page_numbers: boolean- blocks: jsonb[] (ARRAY of DocBlock - dynamiczny system blokow)- labels: jsonb (customizable field names)- created_at, updated_at
PROBLEM IDENTYFIKOWANY: Użytkownicy tworzą nielimitowane custom szablony przez blocks: jsonb[] system - każdy szablon może mieć różną strukturę bloków → chaos z pozycjonowaniem QR kodów i zdjęć.

⚠️ ZIDENTYFIKOWANE PROBLEMY (Template Chaos)
1. Nielimitowana Kreacja Szablonów

// Documents.tsx - LINE 230const addBlock = (type: BlockType) => {  // User może dodać DOWOLNE bloki w DOWOLNEJ kolejności:  // - 'image', 'qr', 'gallery', 'columns_2', 'heading_h1'...  const newBlock: DocBlock = { id: generateId(), type, content: {...} };  setCurrentDesign(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));};
Skutek:

❌ QR kod pozycjonowany fixed (qrX = this.pageWidth - this.margin - qrSize) w pdf-generator.ts → jak user doda image block w tym samym miejscu = OVERLAP
❌ Galerie 3x zdjęć (grid 3 images) - brak collision detection z innymi blokami
❌ columns_2 block (2 kolumny tekstu) może kolidować z logo/QR
2. PDF Generation = Fixed Positioning

// pdf-generator.ts - LINE 351private async addQRCode(qrPayload: string): Promise<void> {  const qrX = this.pageWidth - this.margin - qrSize;  // HARDCODED prawy dół  const qrY = this.pageHeight - this.margin - qrSize - 30;  // HARDCODED prawy dół  this.doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);}
Problem: Generator PDF używa fixed coordinates dla QR kodu, ale blocks: DocBlock[] system pozwala userowi dodać dowolne elementy w dowolnych miejscach przez UI builder.

3. Brak Validation Rules
❌ Brak limitu liczby bloków na szablon
❌ Brak wykrywania kolizji pozycji elementów
❌ Brak predefined layout constraints
❌ User może stworzyć szablon z 50+ blokami → PDF overflow
🎯 PROJEKT: 5-10 Predefined Dutch Invoice Templates
Strategia: Fixed Templates + Customization (NOT Creation)
Template #1: Standaard Factuur (Standard Invoice)

┌──────────────────────────────────────┐│ [LOGO 80px]         NL Standaard     ││ Company Name         Invoice #12345  ││ KVK: xxx | BTW: NLxxx               │├──────────────────────────────────────┤│ Aan:                Van:             ││ [Client Details]    [Company Details]│├──────────────────────────────────────┤│ ITEMS TABLE                          ││ Omschrijving | Aantal | Bedrag      ││ ───────────────────────────────────  ││ Item 1       | 1      | €100.00     ││ Item 2       | 2      | €200.00     │├──────────────────────────────────────┤│                    Subtotaal: €300   ││                    BTW 21%:   €63    ││                    Totaal:    €363   │├──────────────────────────────────────┤│ Betaling:                            ││ IBAN: NLxxxxx                        ││ [QR CODE SEPA - prawy dół]          │└──────────────────────────────────────┘
Fixed Blocks:

heading_h1 → Invoice Title
info_grid → Client/Company 2-column
table_simple → Line items (fixed 4 columns)
price_list → Totals breakdown
qr → SEPA QR code (fixed bottom-right)
signature → Optional signature line
User Customization (DOZWOLONE):

✅ Kolory (primary, secondary, text)
✅ Font family (6 opcji)
✅ Logo upload & rozmiar
✅ Margines strony (global_margin: 0-40mm)
✅ Paper texture (plain/dots/lines/grain)
✅ Kolejność sekcji (drag-drop istniejących bloków)
✅ Show/hide: QR code, signature, page numbers
User Customization (ZABLOKOWANE):

❌ Dodawanie nowych bloków typu image, gallery, columns_2
❌ Usuwanie kluczowych bloków (table, totals)
❌ Zmiana typu bloku (np. table_simple → price_list)
Template #2: Product Factuur (Product Invoice)

┌──────────────────────────────────────┐│         [CENTER LOGO]                ││       Product Factuur #2025-001      │├──────────────────────────────────────┤│ [3x GALLERY IMAGES - product photos] │├──────────────────────────────────────┤│ PRODUCTEN TABLE (6 cols)             ││ SKU | Naam | Aantal | Prijs | BTW  ││ ───────────────────────────────────  ││ P001| Widget| 10    | €50   | 21%  │├──────────────────────────────────────┤│                    Subtotaal: €500   ││                    BTW 21%:   €105   ││                    Verzendkosten: €10││                    Totaal:    €615   │├──────────────────────────────────────┤│ [QR CODE]    Retourbeleid:           ││              14 dagen                 │└──────────────────────────────────────┘
Fixed Blocks:

gallery → 3 product images (grid 3x1)
table_simple → Products (6 columns: SKU, Name, Qty, Price, VAT%, Total)
price_list → Totals + shipping
qr → SEPA QR code
paragraph → Return policy
Unikalność: Pre-configured gallery block dla zdjęć produktów.

Template #3: Diensten Factuur (Services Invoice)

┌──────────────────────────────────────┐│ [LOGO links]        Diensten Factuur ││ Consultant Services  #2025-DV-001    │├──────────────────────────────────────┤│ UREN REGISTRATIE TABLE               ││ Datum   | Omschrijving | Uren | Tarief││ ──────────────────────────────────── ││ 1 Jan   | Consultancy  | 8h   | €100 ││ 2 Jan   | Development  | 6h   | €120 │├──────────────────────────────────────┤│ MATERIAAL/KOSTEN TABLE               ││ Omschrijving         | Bedrag        ││ ──────────────────────────────────── ││ Software License     | €50.00        ││ Travel Expenses      | €20.00        │├──────────────────────────────────────┤│                    Subtotaal: €1470  ││                    BTW 21%:   €309   ││                    Totaal:    €1779  │└──────────────────────────────────────┘
Fixed Blocks:

table_simple → Time registration (4 cols)
materials_table → Expenses/materials
price_list → Totals
qr → SEPA QR code
Unikalność: Dual-table design (uren + materiaal) typowy dla ZZP diensten.

Template #4: Creditnota (Credit Note)

┌──────────────────────────────────────┐│       CREDITNOTA                     ││       #CN-2025-001                   ││       Originele Factuur: #2025-001   │├──────────────────────────────────────┤│ Reden:                               ││ [paragraph] - Product retour         │├──────────────────────────────────────┤│ GERETOURNEERDE ITEMS                 ││ Item         | Aantal | Bedrag       ││ ──────────────────────────────────── ││ Widget A     | 2      | -€100.00     │├──────────────────────────────────────┤│                    Subtotaal: -€100  ││                    BTW 21%:   -€21   ││                    Credit:    -€121  │├──────────────────────────────────────┤│ Teruggave Methode: Overschrijving   ││ IBAN: NLxxxxx                        │└──────────────────────────────────────┘
Fixed Blocks:

heading_h1 → CREDITNOTA (RED color)
paragraph → Reason for credit
table_simple → Returned items (negative amounts)
price_list → Totals (negative)
info_grid → Payment method
Unikalność: Czerwony nagłówek, negatywne kwoty, reference do original invoice.

Template #5: Werkbon (Timesheet)

┌──────────────────────────────────────┐│ WERKBON / KARTA PRACY                ││ #WB-2025-001      Data: 15-01-2025  │├──────────────────────────────────────┤│ Zleceniodawca: [info_grid]           ││ Adres: ...                           ││ Nr Zlecenia: #ORD-123                │├──────────────────────────────────────┤│ ZAKRES PRAC (Checklista)             ││ □ Przygotowanie powierzchni          ││ □ Montaż konstrukcji                 ││ □ Sprzątanie terenu                  │├──────────────────────────────────────┤│ ZUŻYTE MATERIAŁY                     ││ Ilość | Jedn. | Nazwa Materiału      ││ ──────────────────────────────────── ││ 10    | szt.  | Wkręty M6            ││ 5     | m     | Kabel elektryczny    │├──────────────────────────────────────┤│ Uwagi:                               ││ [input_box] - 100px height           │├──────────────────────────────────────┤│ Podpis Pracownika:                   ││ _______________________              ││                                      ││ Podpis Klienta:                      ││ _______________________              │└──────────────────────────────────────┘
Fixed Blocks:

heading_h1 → WERKBON title
info_grid → Zleceniodawca fields
checklist → Zakres prac (can add/remove items)
materials_table → Materials used
input_box → Uwagi field
signature x2 → Dual signatures
Unikalność: Orange theme (#f97316), checklist + materials tables, dual signatures.

Template #6: Voorschot Factuur (Advance Payment)

┌──────────────────────────────────────┐│ VOORSCHOT FACTUUR                    ││ #VF-2025-001                         ││ Project: Renovatie Kantoor           │├──────────────────────────────────────┤│ Totale Projectwaarde:    €10,000    ││ Voorschot (30%):         €3,000     │├──────────────────────────────────────┤│ BETALINGSSCHEMA                      ││ Fase           | Bedrag | Status     ││ ──────────────────────────────────── ││ Voorschot 30%  | €3,000 | Te betalen││ Voortgang 40%  | €4,000 | Pending   ││ Oplevering 30% | €3,000 | Pending   │├──────────────────────────────────────┤│                    BTW 21%:   €630   ││                    Voorschot: €3,630 │└──────────────────────────────────────┘
Fixed Blocks:

heading_h1 → VOORSCHOT FACTUUR
price_list → Payment schedule (phases)
table_simple → Payment plan breakdown
qr → SEPA QR code
Unikalność: Multi-phase payment schedule, progress tracking.

Template #7: Herhalingsfactuur (Recurring Invoice)

┌──────────────────────────────────────┐│ HERHALINGSFACTUUR                    ││ #HF-2025-01                          ││ Abonnement: Maandelijks Service      ││ Periode: Januari 2025                │├──────────────────────────────────────┤│ ABONNEMENT DETAILS                   ││ Service          | Bedrag/maand      ││ ──────────────────────────────────── ││ Premium Support  | €99.00            ││ Cloud Hosting    | €49.00            │├──────────────────────────────────────┤│                    Subtotaal: €148   ││                    BTW 21%:   €31    ││                    Totaal:    €179   │├──────────────────────────────────────┤│ Automatische Incasso:                ││ Volgende Betaling: 1 Februari 2025  │└──────────────────────────────────────┘
Fixed Blocks:

heading_h1 → HERHALINGSFACTUUR
paragraph → Abonnement details
table_simple → Service items
price_list → Totals
date → Next payment date
Unikalność: Recurring payment info, subscription model.

Template #8: Pro-forma Factuur (Proforma Invoice)

┌──────────────────────────────────────┐│ PRO-FORMA FACTUUR                    ││ #PF-2025-001       [NIET OFFICIEEL] ││ Geldig tot: 31-01-2025               │├──────────────────────────────────────┤│ OFFERTE ITEMS                        ││ Omschrijving     | Aantal | Bedrag  ││ ──────────────────────────────────── ││ Consultancy      | 40h    | €4000   ││ Development      | 80h    | €9600   │├──────────────────────────────────────┤│                    Subtotaal: €13600 ││                    BTW 21%:   €2856  ││                    Totaal:    €16456 │├──────────────────────────────────────┤│ ⚠️ Dit is GEEN officiële factuur     ││ Na acceptatie volgt factuur          │└──────────────────────────────────────┘
Fixed Blocks:

heading_h1 → PRO-FORMA FACTUUR (Blue/Gray)
date → Validity date
table_simple → Quote items
price_list → Totals
quote → Legal disclaimer (NOT official invoice)
Unikalność: Warning banner, validity date, no payment required.

Template #9: BTW-Schuif Factuur (VAT Reverse Charge)

┌──────────────────────────────────────┐│ FACTUUR - BTW VERLEGD               ││ #BV-2025-001                         ││ Reverse Charge (Art. 69 BTW-wet)    │├──────────────────────────────────────┤│ Klant (EU):                          ││ Company BV (België)                  ││ BTW-ID: BExxxxxxxxxx                 │├──────────────────────────────────────┤│ ITEMS                                ││ Omschrijving         | Bedrag       ││ ──────────────────────────────────── ││ Consultancy Services | €5,000.00    │├──────────────────────────────────────┤│                    Totaal:    €5,000 ││                    BTW:       €0     ││ (BTW verlegd naar klant)            │└──────────────────────────────────────┘
Fixed Blocks:

heading_h1 → BTW VERLEGD banner
paragraph → Reverse charge explanation (Art. 69 BTW-wet)
info_grid → EU client VAT ID
table_simple → Items
price_list → Totals (BTW = €0)
quote → Legal disclaimer
Unikalność: Zero VAT, EU/B2B specific, legal references.

Template #10: Samenvattende Factuur (Summary Invoice)

┌──────────────────────────────────────┐│ SAMENVATTENDE FACTUUR                ││ #SF-2025-001                         ││ Periode: Q1 2025 (Jan-Mrt)          │├──────────────────────────────────────┤│ MAANDELIJKSE BREAKDOWN               ││ Maand   | Omschrijving    | Bedrag  ││ ──────────────────────────────────── ││ Januari | Consultancy     | €1,200  ││ Februari| Development     | €2,400  ││ Maart   | Support         | €800    │├──────────────────────────────────────┤│ TOTAAL OVERZICHT                     ││                    Subtotaal: €4,400 ││                    BTW 21%:   €924   ││                    Totaal:    €5,324 │└──────────────────────────────────────┘
Fixed Blocks:

heading_h1 → SAMENVATTENDE FACTUUR
paragraph → Period description
table_simple → Monthly breakdown (3-12 rows)
price_list → Grand totals
qr → SEPA QR code
Unikalność: Multi-month summary, quarterly/annual invoicing.

🛠️ PLAN IMPLEMENTACJI: Fixed Templates + Customization
FAZA 1: Database Schema Update (30 min)

-- Dodaj nowe kolumny do invoice_designs:ALTER TABLE invoice_designs ADD COLUMN is_template BOOLEAN DEFAULT FALSE;ALTER TABLE invoice_designs ADD COLUMN template_category TEXT;  -- 'standard', 'product', 'service', 'werkbon', etc.ALTER TABLE invoice_designs ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;  -- czy user może edytować blocksALTER TABLE invoice_designs ADD COLUMN base_template_id UUID;  -- reference do original template-- Stwórz 10 predefined templates (INSERT INTO):INSERT INTO invoice_designs (user_id, name, type, is_template, is_locked, template_category, blocks, ...) VALUES  ('system', 'Standaard Factuur', 'INVOICE', TRUE, TRUE, 'standard', '[ {...fixed blocks...} ]', ...),  ('system', 'Product Factuur', 'INVOICE', TRUE, TRUE, 'product', '[ {...fixed blocks...} ]', ...),  ('system', 'Diensten Factuur', 'INVOICE', TRUE, TRUE, 'service', '[ {...fixed blocks...} ]', ...),  -- ... (pozostałe 7 templates);-- Index for quick template lookup:CREATE INDEX idx_invoice_designs_templates ON invoice_designs(is_template) WHERE is_template = TRUE;
FAZA 2: Update Documents.tsx - Template Selection Mode (1-2 godz)

// Documents.tsx - NOWY FLOWconst [viewMode, setViewMode] = useState<ViewMode>("TEMPLATE_SELECTOR");  // NOWY mode// TEMPLATE SELECTOR UI (zamiast chaotycznego "CREATE NEW"):const renderTemplateSelector = () => (  <div className="grid grid-cols-3 gap-6 p-8">    {PREDEFINED_TEMPLATES.map(template => (      <div         key={template.id}        onClick={() => handleSelectTemplate(template)}        className="border-2 rounded-xl p-6 hover:border-ocean-500 cursor-pointer"      >        <img src={template.thumbnail} className="w-full h-48 object-cover rounded-lg mb-4" />        <h3 className="font-bold text-lg">{template.name}</h3>        <p className="text-sm text-slate-500">{template.description}</p>                {/* Badges showing what's customizable: */}        <div className="flex gap-2 mt-3">          <Badge>✓ Kolory</Badge>          <Badge>✓ Logo</Badge>          <Badge>✓ Fonty</Badge>          <Badge>✗ Layout</Badge>        </div>      </div>    ))}  </div>);const handleSelectTemplate = (template: PredefinedTemplate) => {  // Kopiuj template (clone), ale NIE pozwalaj edytować blocks structure:  const userDesign = {    ...template,    is_locked: false,  // User może customizować    base_template_id: template.id,  // Track original template    blocks: template.blocks,  // FIXED - can't add/remove  };    setCurrentDesign(userDesign);  setViewMode("CUSTOMIZER");  // NOWY mode};
FAZA 3: Customizer Mode (zamiast Builder) (2-3 godz)

// Documents.tsx - NOWY CUSTOMIZER (zamiast chaotycznego BUILDER):const renderCustomizer = () => (  <div className="flex h-screen">    {/* LEFT SIDEBAR - TYLKO CUSTOMIZATION OPTIONS */}    <div className="w-80 bg-white border-r">      <TabsContainer>        {/* TAB 1: DESIGN (Kolory, Fonty) */}        <Tab name="DESIGN">          <ColorPicker label="Kolor Główny" value={design.primary_color} onChange={...} />          <ColorPicker label="Kolor Tekstu" value={design.text_color} onChange={...} />          <FontSelector fonts={ALLOWED_FONTS} selected={design.font_family} onChange={...} />          <PaperTexture selected={design.paper_texture} onChange={...} />        </Tab>                {/* TAB 2: LAYOUT (Margines, Logo, Alignments) */}        <Tab name="LAYOUT">          <LogoUploader />          <Slider label="Rozmiar Logo" min={40} max={200} value={design.logo_size} />          <Slider label="Margines Strony" min={0} max={40} value={design.global_margin} />          <AlignmentButtons label="Wyrównanie Nagłówka" value={design.header_align} />        </Tab>                {/* TAB 3: OPTIONS (Show/Hide toggles) */}        <Tab name="OPTIONS">          <Toggle label="Kod QR" checked={design.show_qr_code} />          <Toggle label="Miejsce na podpis" checked={design.show_signature_line} />          <Toggle label="Numeracja stron" checked={design.show_page_numbers} />        </Tab>                {/* TAB 4: CONTENT (Edycja treści istniejących bloków) */}        <Tab name="CONTENT">          <BlockContentEditor blocks={design.blocks} onUpdate={updateBlockContent} />          {/* Np. edycja tekstu w paragraph, labels w table headers */}        </Tab>                {/* TAB 5: LAYERS (Drag-Drop Order TYLKO) */}        <Tab name="LAYERS">          <DraggableBlockList             blocks={design.blocks}             onReorder={handleReorderBlocks}            disableAdd={true}  // 🔒 CAN'T ADD NEW BLOCKS            disableRemove={true}  // 🔒 CAN'T REMOVE BLOCKS          />        </Tab>      </TabsContainer>    </div>        {/* RIGHT PREVIEW - A4 CANVAS */}    <div className="flex-1 bg-slate-100 p-8 overflow-auto">      <A4PreviewCanvas design={design} zoom={zoomLevel} />    </div>  </div>);// 🔒 VALIDATION: Blokuj dodawanie nowych bloków:const addBlock = (type: BlockType) => {  if (currentDesign.is_locked) {    toast.error("❌ Nie można dodać nowych bloków do predefined template. Użyj zakładki LAYERS aby zmienić kolejność.");    return;  }  // ... existing logic (tylko dla custom templates)};
FAZA 4: PDF Generator Update (1 godz)

// pdf-generator.ts - OBSŁUGA FIXED TEMPLATES:export class InvoicePDFGenerator {  async generateFromTemplate(    invoice: Invoice,    company: Company,    template: InvoiceDesign  ): Promise<Blob> {    // Iteruj przez template.blocks (FIXED ORDER):    for (const block of template.blocks) {      switch (block.type) {        case 'heading_h1':          this.addHeading(block.content.text, template.primary_color);          break;        case 'info_grid':          this.addInfoGrid(block.content.fields);          break;        case 'table_simple':          this.addTable(invoice.lines, block.content.headers);          break;        case 'qr':          // QR positio based on template layout (NOT fixed):          await this.addQRCodeFromBlock(block, company, invoice);          break;        case 'gallery':          this.addGallery(block.content.images, template.global_margin);          break;        // ... handle all block types      }    }        return this.doc.output('blob');  }    // NOWA METODA: QR code pozycjonowany wg template block order:  private async addQRCodeFromBlock(block: DocBlock, company: Company, invoice: Invoice) {    const qrPayload = generateSEPAQRPayload(company, invoice, invoice.total_gross);    const qrDataURL = await QRCode.toDataURL(qrPayload);        // Pozycjonuj wg this.yPosition (dynamiczne, nie hardcoded):    this.doc.addImage(qrDataURL, 'PNG', this.pageWidth - 60, this.yPosition, 40, 40);    this.yPosition += 50;  // Update current Y position  }}
FAZA 5: UI Update - Template Library (2 godz)

// Documents.tsx - LIBRARY VIEW (UPDATED):const renderLibrary = () => (  <div className="p-8">    <div className="flex justify-between items-center mb-8">      <h1 className="text-3xl font-black">Studio Dokumentów 2.0</h1>      <button         onClick={() => setViewMode("TEMPLATE_SELECTOR")}        className="px-6 py-3 bg-ocean-600 text-white rounded-xl flex items-center gap-2"      >        <Plus size={20} />        Wybierz Szablon      </button>    </div>        {/* SEKCJA 1: Predefined Templates (TYLKO PREVIEW) */}    <section className="mb-12">      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">        <Star size={20} className="text-yellow-500" />        Gotowe Szablony (10)      </h2>      <div className="grid grid-cols-4 gap-4">        {PREDEFINED_TEMPLATES.map(template => (          <TemplateCard             key={template.id}            template={template}            badge="LOCKED"            onSelect={() => handleSelectTemplate(template)}          />        ))}      </div>    </section>        {/* SEKCJA 2: User's Customized Templates */}    <section>      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">        <Layers size={20} />        Twoje Szablony ({userDesigns.length})      </h2>      <div className="grid grid-cols-4 gap-4">        {userDesigns.map(design => (          <TemplateCard             key={design.id}            template={design}            badge={`Based on: ${design.base_template_name}`}            onEdit={() => handleEditDesign(design)}            onDelete={() => deleteInvoiceDesign(design.id)}          />        ))}      </div>    </section>  </div>);
📝 PODSUMOWANIE: Co działa & Co poprawić
✅ Co działa dobrze (Keep):
PDF Generator (pdf-generator.ts):

✅ jsPDF implementation solid
✅ SEPA QR code generation works
✅ Multi-language support (NL/PL/EN)
✅ IBAN/BIC validation
BTW System (BTWAangifte.tsx):

✅ Kwartalne deklaracje Q1-Q4
✅ Auto-calculation from invoices
✅ XML export dla Belastingdienst
Database Structure:

✅ invoice_designs table schema flexible (jsonb blocks)
✅ Relationship to auth.users via user_id
⚠️ Co poprawić (Fix):
Template Chaos → Fixed Predefined Templates:

❌ Obecny system: Nielimitowane custom templates z chaosem
✅ Nowy system: 10 predefined templates + customization ONLY
PDF Positioning → Dynamic Block-Based Rendering:

❌ Obecny: Hardcoded coordinates dla QR/images
✅ Nowy: Sequential rendering based on template.blocks order
UI Flow → Template Selector First:

❌ Obecny: "Create New" → chaotyczny builder z 40+ opcjami
✅ Nowy: "Select Template" → Customizer (tylko design options)
Validation → Lock Core Blocks:

❌ Obecny: Brak validation, user może dodać 50+ bloków
✅ Nowy: is_locked = TRUE dla predefined templates, tylko customization allowed
🔜 Kolejne kroki (Next Actions):
Database Migration:


ALTER TABLE invoice_designs ADD COLUMN is_template BOOLEAN;ALTER TABLE invoice_designs ADD COLUMN is_locked BOOLEAN;ALTER TABLE invoice_designs ADD COLUMN base_template_id UUID;
Create 10 Seed Templates:

Wygeneruj 10 rekordów w invoice_designs jako is_template=TRUE, is_locked=TRUE
Każdy z fixed blocks: DocBlock[] structure
Update Documents.tsx:

Dodaj TEMPLATE_SELECTOR view mode
Dodaj CUSTOMIZER mode (zamiast chaotycznego BUILDER)
Zablokuj addBlock() / removeBlock() dla locked templates
Update pdf-generator.ts:

Dodaj generateFromTemplate() method
Dynamic positioning based on this.yPosition (nie hardcoded)
Testing:

Stwórz invoice z każdym z 10 templates
Verify QR code nie overlappuje z images
Verify PDF eksport dla wszystkich templates
Czas implementacji: 8-10 godzin (full refactor)

Potrzebujesz, żebym zaimplementował to od razu? Mogę zacząć od FAZY 1 (Database Migration) + FAZY 2 (Template Selector UI). 🚀