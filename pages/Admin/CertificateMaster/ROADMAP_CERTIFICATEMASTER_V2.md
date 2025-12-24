# 🏗️ ROADMAP: CertificateMaster v2.0 - Ultimate Edition

## 📊 PRZEGLĄD PROJEKTU

**Cel:** Rozbudowa CertificateMaster do najnowocześniejszego generatora certyfikatów w Europie
**Szacowany czas:** 4-6 tygodni (przy 4h/dzień)
**Priorytet:** Krytyczny dla biznesu

---

## 🎯 FAZY IMPLEMENTACJI

### ═══════════════════════════════════════════════════════════════

## 📦 FAZA 0: FUNDAMENT (2-3 dni)

### ═══════════════════════════════════════════════════════════════

**Cel:** Przygotowanie architektury pod nowe funkcje

#### 0.1 Rozszerzenie Types (types.ts)

```typescript
// NOWE TYPY DO DODANIA:

// Templates
interface CertificateTemplate {
  id: string;
  name: string;
  category: "construction" | "it" | "medical" | "transport" | "general";
  design: CertificateDesign;
  thumbnail?: string;
  isBuiltIn: boolean;
  createdAt: string;
}

// Layout
interface LayoutSettings {
  documentSize: "A4" | "A5" | "Letter" | "Custom";
  customWidth?: number;
  customHeight?: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

// Photo
interface PhotoSettings {
  frameStyle: "circle" | "rounded" | "square" | "hexagon" | "custom";
  borderWidth: number;
  borderColor: string;
  borderStyle: "solid" | "double" | "dashed";
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  filter: "none" | "grayscale" | "sepia" | "high-contrast";
  positionX: number;
  positionY: number;
  scale: number;
}

// QR Advanced
interface QRSettings {
  style: "classic" | "rounded" | "dots" | "classy";
  fgColor: string;
  bgColor: string;
  logoEnabled: boolean;
  logoDataUrl: string | null;
  logoScale: number;
  dataType: "url" | "vcard" | "text" | "wifi";
  errorCorrection: "L" | "M" | "Q" | "H";
}

// Effects
interface EffectSettings {
  glassmorphism: boolean;
  glassBlur: number;
  glassOpacity: number;
  metallicText: "none" | "gold" | "silver" | "bronze" | "holographic";
  embossEnabled: boolean;
  embossDepth: number;
  glowEnabled: boolean;
  glowColor: string;
  glowIntensity: number;
  noiseEnabled: boolean;
  noiseOpacity: number;
}

// Security Advanced
interface SecuritySettings {
  hologramEnabled: boolean;
  hologramPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  hologramStyle: "rainbow" | "silver" | "gold";
  microtextCustom: string;
  uvLayerEnabled: boolean;
  serialNumberPrefix: string;
  serialNumberChecksum: boolean;
  blockchainHash: boolean;
}

// Export
interface ExportSettings {
  format: "pdf" | "png" | "jpg";
  resolution: 72 | 150 | 300 | 600;
  transparentBg: boolean;
  includeBleed: boolean;
  bleedSize: number;
}
```

#### 0.2 Struktura plików do stworzenia

```
pages/Admin/CertificateMaster/
├── components/
│   ├── CertificatePreview.tsx     ✅ (rozszerzyć)
│   ├── CertificateForm.tsx        ✅ (istnieje)
│   ├── WorkerSelector.tsx         ✅ (istnieje)
│   ├── tabs/
│   │   ├── AssetsTab.tsx          🆕 (wydzielić z Preview)
│   │   ├── TypoTab.tsx            🆕 (wydzielić z Preview)
│   │   ├── VisualsTab.tsx         🆕 (wydzielić z Preview)
│   │   ├── MatrixTab.tsx          🆕 (wydzielić z Preview)
│   │   ├── SecurityTab.tsx        🆕 (wydzielić z Preview)
│   │   ├── TemplatesTab.tsx       🆕 NOWA
│   │   ├── LayoutTab.tsx          🆕 NOWA
│   │   ├── PhotoTab.tsx           🆕 NOWA
│   │   ├── QRTab.tsx              🆕 NOWA
│   │   ├── EffectsTab.tsx         🆕 NOWA
│   │   ├── CardModeTab.tsx        🆕 NOWA
│   │   └── ExportTab.tsx          🆕 NOWA
│   ├── preview/
│   │   ├── CertificateCanvas.tsx  🆕 (wydzielić rendering)
│   │   ├── CardCanvas.tsx         🆕 (wydzielić rendering karty)
│   │   ├── HologramEffect.tsx     🆕
│   │   └── SecurityOverlays.tsx   🆕
│   └── shared/
│       ├── RangeField.tsx         🆕 (wydzielić)
│       ├── SelectField.tsx        🆕 (wydzielić)
│       ├── ColorPicker.tsx        🆕
│       └── ToolSection.tsx        🆕 (wydzielić)
├── services/
│   ├── certificateStorage.ts      ✅ (istnieje)
│   ├── templateService.ts         🆕
│   ├── exportService.ts           🆕
│   └── serialNumberService.ts     🆕
├── data/
│   └── builtInTemplates.ts        🆕 (15 szablonów)
├── hooks/
│   ├── useDesign.ts               🆕
│   ├── useTemplates.ts            🆕
│   └── useExport.ts               🆕
├── types.ts                       ✅ (rozszerzyć)
├── constants.ts                   ✅ (rozszerzyć)
└── index.tsx                      ✅ (rozszerzyć)
```

#### 0.3 Zależności do zainstalowania

```bash
npm install jspdf                    # PDF export
npm install html2canvas              # Canvas rendering
npm install qrcode.react             # ✅ już jest
npm install @react-pdf/renderer      # Alternatywny PDF (opcjonalnie)
npm install canvas-confetti          # Efekty (opcjonalnie)
```

**Czas: 2-3 dni**
**Priorytet: 🔴 KRYTYCZNY**

---

### ═══════════════════════════════════════════════════════════════

## 📦 FAZA 1: CORE FEATURES (5-7 dni)

### ═══════════════════════════════════════════════════════════════

#### 1.1 🆕 TEMPLATES TAB (Szablony) - 1.5 dnia

**Pliki:**

- `data/builtInTemplates.ts` - 15 predefiniowanych szablonów
- `components/tabs/TemplatesTab.tsx`
- `services/templateService.ts`

**Szablony do stworzenia:**

```typescript
const BUILT_IN_TEMPLATES = [
  // BUDOWNICTWO (5)
  { id: "vca-basic", name: "VCA Basic", category: "construction" },
  { id: "vca-vol", name: "VCA VOL", category: "construction" },
  { id: "height-work", name: "Praca na Wysokości", category: "construction" },
  { id: "scaffolding", name: "Rusztowania", category: "construction" },
  { id: "forklift", name: "Wózek Widłowy", category: "construction" },

  // IT (3)
  { id: "iso-27001", name: "ISO 27001", category: "it" },
  { id: "gdpr", name: "GDPR Compliance", category: "it" },
  { id: "cybersec", name: "Cybersecurity", category: "it" },

  // MEDYCYNA (3)
  { id: "bhv", name: "BHV (Eerste Hulp)", category: "medical" },
  { id: "first-aid", name: "First Aid", category: "medical" },
  { id: "aed", name: "AED Certified", category: "medical" },

  // TRANSPORT (2)
  { id: "adr", name: "ADR Transport", category: "transport" },
  { id: "code95", name: "Code 95", category: "transport" },

  // OGÓLNE (2)
  { id: "iso-9001", name: "ISO 9001", category: "general" },
  { id: "modern-minimal", name: "Modern Minimal", category: "general" },
];
```

**Funkcje:**

- [x] Lista szablonów z miniaturkami
- [x] Filtrowanie po kategorii
- [x] Podgląd hover
- [x] Kliknięcie = zastosuj szablon
- [x] Zapisz własny szablon
- [x] Usuń własny szablon
- [ ] Export/Import JSON (faza 3)

---

#### 1.2 🆕 LAYOUT TAB (Układ) - 0.5 dnia

**Funkcje:**

- [x] Orientation toggle (Portrait/Landscape) ← **BRAKUJE W UI!**
- [x] Marginesy (4 slidery)
- [x] Rozmiar dokumentu (A4/A5/Letter)
- [ ] Siatka pomocnicza (faza 2)
- [ ] Snap to grid (faza 3)

---

#### 1.3 🆕 PHOTO TAB (Zdjęcie) - 1 dzień

**Funkcje:**

- [x] Frame style selector (5 opcji)
- [x] Border width/color/style
- [x] Shadow toggle + controls
- [x] Filter selector (4 opcje)
- [x] Position X/Y/Scale

---

#### 1.4 🔧 CARD MODE++ (Rozszerzenie) - 1 dzień

**Funkcje (istnieją w types, brakuje UI):**

- [x] cardCornerRadius slider
- [x] cardHologramIntensity slider
- [x] cardShowChip toggle
- [x] cardChipStyle selector (gold/silver)
- [x] cardShowBarcode toggle
- [x] cardBackGradientColors (3 color pickers)
- [x] Magnetic stripe toggle

**Rendering:**

- [x] Chip SVG (realistyczny)
- [x] Barcode component
- [x] Hologram animation CSS

---

#### 1.5 🔧 QR CODE++ (Rozszerzenie) - 1 dzień

**Funkcje:**

- [x] Style selector (classic/rounded/dots)
- [x] FG/BG color pickers
- [x] Logo in center toggle + upload
- [x] Data type selector
- [x] Error correction level

**Wymaga:** Zmiana z `QRCodeSVG` na bardziej zaawansowaną bibliotekę

---

#### 1.6 🔧 SECURITY++ (Rozszerzenie) - 1 dzień

**Funkcje:**

- [x] Hologram component z animacją
- [x] Custom microtext input
- [x] Serial number generator (prefix + auto-increment + checksum)
- [ ] UV layer simulation (faza 2)
- [ ] Blockchain hash display (faza 3)

---

**Czas Fazy 1: 5-7 dni**
**Priorytet: 🔴 WYSOKI**

---

### ═══════════════════════════════════════════════════════════════

## 📦 FAZA 2: ADVANCED FEATURES (4-5 dni)

### ═══════════════════════════════════════════════════════════════

#### 2.1 🆕 EFFECTS TAB (Efekty) - 2 dni

**Funkcje:**

- [x] Glassmorphism effect
  - Blur intensity slider
  - Glass opacity slider
  - Border glow
- [x] Metallic text
  - Gold/Silver/Bronze/Holographic gradients
  - Text-specific or global
- [x] Emboss/Deboss
  - Depth slider
  - Light direction
- [x] Glow effect
  - Color picker
  - Intensity slider
  - Spread slider
- [x] Noise/Grain texture
  - Opacity slider
  - Size slider

**CSS Classes do stworzenia:**

```css
.glass-effect {
  backdrop-filter: blur(var(--glass-blur));
  background: rgba(255, 255, 255, var(--glass-opacity));
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.metallic-gold {
  background: linear-gradient(
    135deg,
    #bf953f,
    #fcf6ba,
    #b38728,
    #fbf5b7,
    #aa771c
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.emboss {
  text-shadow: -1px -1px 0 rgba(255, 255, 255, 0.3), 1px 1px 0 rgba(0, 0, 0, 0.2);
}
```

---

#### 2.2 🆕 EXPORT TAB (Eksport) - 2 dni

**Funkcje:**

- [x] PDF Export (jsPDF + html2canvas)
- [x] Resolution selector (72/150/300/600 DPI)
- [x] PNG Export
- [x] Transparent background option
- [ ] Batch export (faza 3)
- [ ] Email integration (faza 3)

**Implementacja PDF:**

```typescript
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const exportToPDF = async (
  elementId: string,
  options: ExportSettings
): Promise<Blob> => {
  const element = document.getElementById(elementId);
  const scale = options.resolution / 72;

  const canvas = await html2canvas(element, {
    scale: scale,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: options.orientation,
    unit: "mm",
    format: "a4",
  });

  pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
  return pdf.output("blob");
};
```

---

#### 2.3 Siatka pomocnicza - 0.5 dnia

**Funkcje:**

- [x] Toggle siatki 12-kolumnowej
- [x] Opacity siatki
- [x] Kolor siatki

---

**Czas Fazy 2: 4-5 dni**
**Priorytet: 🟡 ŚREDNI**

---

### ═══════════════════════════════════════════════════════════════

## 📦 FAZA 3: NICE TO HAVE (3-4 dni)

### ═══════════════════════════════════════════════════════════════

#### 3.1 Import/Export szablonów - 0.5 dnia

```typescript
const exportTemplate = (template: CertificateTemplate) => {
  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  // Download blob
};

const importTemplate = async (file: File): Promise<CertificateTemplate> => {
  const text = await file.text();
  return JSON.parse(text);
};
```

#### 3.2 Batch Export - 1 dzień

- Lista pracowników do certyfikacji
- Checkbox selection
- Progress bar
- ZIP download

#### 3.3 AI Features - 1.5 dnia

- OpenAI integration dla opisu
- Color palette generator
- Layout suggestions

#### 3.4 Blockchain Verification - 1 dzień

- Hash generowanie (SHA-256)
- QR z hashem
- Verification page

---

**Czas Fazy 3: 3-4 dni**
**Priorytet: 🟢 NISKI**

---

## 📅 HARMONOGRAM

```
TYDZIEŃ 1:
├── Poniedziałek:  Faza 0.1 - Rozszerzenie types.ts
├── Wtorek:        Faza 0.2 - Struktura plików
├── Środa:         Faza 0.3 - Instalacja zależności + refaktor
├── Czwartek:      Faza 1.1 - Templates Tab (część 1)
└── Piątek:        Faza 1.1 - Templates Tab (część 2)

TYDZIEŃ 2:
├── Poniedziałek:  Faza 1.2 - Layout Tab
├── Wtorek:        Faza 1.3 - Photo Tab
├── Środa:         Faza 1.4 - Card Mode++
├── Czwartek:      Faza 1.5 - QR Code++
└── Piątek:        Faza 1.6 - Security++

TYDZIEŃ 3:
├── Poniedziałek:  Faza 2.1 - Effects Tab (część 1)
├── Wtorek:        Faza 2.1 - Effects Tab (część 2)
├── Środa:         Faza 2.2 - Export Tab (część 1)
├── Czwartek:      Faza 2.2 - Export Tab (część 2)
└── Piątek:        Faza 2.3 - Grid helper + testy

TYDZIEŃ 4:
├── Poniedziałek:  Faza 3.1 - Import/Export templates
├── Wtorek:        Faza 3.2 - Batch Export
├── Środa:         Faza 3.3 - AI Features
├── Czwartek:      Faza 3.4 - Blockchain
└── Piątek:        Testy końcowe + deploy
```

---

## 🎨 NOWY UKŁAD ZAKŁADEK (10 zakładek)

```
┌─────────────────────────────────────────────────────────────┐
│  CERTIFICATE MASTER v2.0                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬───┐│
│  │📁   │📐   │🖼️   │🔤   │🎨   │📍   │🔒   │🎴   │💫   │📤 ││
│  │Tmpl │Layt │Asst │Typo │Vsls │Mtrx │Secu │Card │Efct │Exp││
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴───┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                                                          ││
│  │                    TOOL PANELS                           ││
│  │                                                          ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  💾 ZAPISZ DO BAZY    🖨️ DRUKUJ    📤 EKSPORTUJ PDF      ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Legenda zakładek:**

1. **Templates** (📁) - Gotowe szablony
2. **Layout** (📐) - Orientacja, marginesy, rozmiar
3. **Assets** (🖼️) - Logo, stamp, sticker, signature
4. **Typography** (🔤) - Fonty, skale, spacing
5. **Visuals** (🎨) - Gradienty, kolory, border, tekstury
6. **Matrix** (📍) - Pozycjonowanie X/Y/Scale
7. **Security** (🔒) - Guilloche, watermark, hologram
8. **Card Mode** (🎴) - Ustawienia karty ID
9. **Effects** (💫) - Glass, metallic, emboss, glow
10. **Export** (📤) - PDF, PNG, resolution

---

## 📊 METRYKI SUKCESU

| Metryka                    | Cel               | Jak mierzyć   |
| -------------------------- | ----------------- | ------------- |
| Czas tworzenia certyfikatu | < 2 min           | Timer w UI    |
| Liczba szablonów           | 15+               | Count w DB    |
| Formaty eksportu           | 3 (PDF, PNG, JPG) | Feature count |
| Rozdzielczości             | 4 (72-600 DPI)    | Feature count |
| Zabezpieczenia             | 5+ typów          | Feature count |
| Efekty specjalne           | 5+                | Feature count |

---

## 🚀 QUICK WINS (Można zrobić TERAZ w 30 min)

Te funkcje **już istnieją w types.ts** ale brakuje ich w UI:

1. ✅ `orientation` toggle (Portrait/Landscape)
2. ✅ `cardCornerRadius` slider
3. ✅ `cardHologramIntensity` slider
4. ✅ `cardShowChip` toggle
5. ✅ `cardChipStyle` selector
6. ✅ `cardShowBarcode` toggle
7. ✅ `cardBackGradientColors` pickers

**Chcesz żebym teraz zaimplementował QUICK WINS?**

---

## 📝 NOTATKI TECHNICZNE

### Zależności wersji:

- jsPDF: ^2.5.1
- html2canvas: ^1.4.1
- qrcode.react: ^3.1.0 (już zainstalowane)

### Kompatybilność:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance:

- PDF generation: < 3s dla 300 DPI
- PNG export: < 1s
- Template switching: < 100ms

---

**Ostatnia aktualizacja:** 2024-12-23
**Autor:** CertificateMaster Team
**Status:** 📋 PLANOWANIE
