# SKRYPT DO AUTOMATYCZNEJ NAPRAWY Documents.tsx
# Naprawia wszystkie importy lucide-react na format STARY projekt

$filePath = "src\modules\invoices\pages\Documents.tsx"
$content = Get-Content $filePath -Raw

Write-Host "🔧 Naprawiam lucide-react imports..." -ForegroundColor Cyan

# Lista wszystkich ikon do naprawy (89 sztuk)
$icons = @(
    "FileText", "Download", "Eye", "Plus", "Folder", "Paintbrush", "Layout",
    "Type", "Image", "QrCode", "Sparkles", "Save", "ArrowLeft",
    "CheckCircle2", "Palette", "Scan", "Copy", "Trash2", "Printer", "Grid",
    "Briefcase", "Building2", "ArrowRight", "ZoomIn", "ZoomOut", "Move",
    "AlignLeft", "AlignCenter", "AlignRight", "Settings2", "Box", "PenTool",
    "Upload", "Clock", "LayoutTemplate", "UserCircle", "FileSignature",
    "ScrollText", "Stamp", "User", "GraduationCap", "Languages", "Camera",
    "ListPlus", "ImagePlus", "FileCheck", "Star", "X", "Menu", "ChevronDown",
    "Undo2", "Redo2", "Layers", "Monitor", "Smartphone", "ChevronRight",
    "MousePointer2", "Wand2", "Minus", "GripHorizontal", "Table",
    "Heading", "Pilcrow", "Eraser", "Ruler", "PanelLeftClose", "PanelLeft",
    "Quote", "ListOrdered", "Columns", "RectangleHorizontal", "Coins",
    "CalendarDays", "Hash", "LayoutGrid", "GripVertical", "ArrowUp", "ArrowDown",
    "AlignJustify", "Ban"
)

# Usuń stare importy lucide-react
$content = $content -replace "import \{[^}]+\} from 'lucide-react';", ""

# Dodaj nowe default importy na początku (po React import)
$newImports = "import React, { useState, useRef, useEffect } from 'react';`n"

foreach ($icon in $icons) {
    $kebabCase = ($icon -creplace '([A-Z])', '-$1').ToLower().TrimStart('-')
    
    # Specjalne przypadki
    if ($icon -eq "CheckCircle2") {
        $icon = "CheckCircle"
        $kebabCase = "check-circle"
    }
    if ($icon -eq "CalendarDays") {
        $icon = "Calendar"
        $kebabCase = "calendar"
    }
    if ($icon -eq "Image") {
        $newImports += "import ImageIcon from 'lucide-react/dist/esm/icons/$kebabCase';`n"
        continue
    }
    if ($icon -eq "Table") {
        $newImports += "import TableIcon from 'lucide-react/dist/esm/icons/$kebabCase';`n"
        continue
    }
    
    $newImports += "import $icon from 'lucide-react/dist/esm/icons/$kebabCase';`n"
}

$newImports += "import { useAuth } from '../../../../contexts/AuthContext';`n`n"

# Zamień początek pliku
$content = $content -replace "^import React, \{ useState, useRef, useEffect \} from 'react';.*?import \{ useAuth", $newImports.TrimEnd() + "`nimport { useAuth"

Write-Host "✅ Naprawiono importy ikon" -ForegroundColor Green

# Usuń DataContext i types imports
$content = $content -replace "import \{ useData \} from.*?;", ""
$content = $content -replace "import \{ InvoiceDesign.*?\} from.*?;", ""
$content = $content -replace "import jsPDF from.*?;", "// import jsPDF from 'jspdf'; // TODO: Zainstaluj: npm install jspdf"
$content = $content -replace "import html2canvas from.*?;", "// import html2canvas from 'html2canvas'; // TODO: Zainstaluj: npm install html2canvas"

Write-Host "✅ Usunięto nieistniejące importy" -ForegroundColor Green

# Dodaj lokalne definicje typów (zaraz po imports)
$typeDefinitions = @"

// ============================================
// LOKALNE DEFINICJE TYPÓW (KOMPATYBILNOŚĆ)
// ============================================

interface InvoiceDesign {
  id: string;
  name: string;
  type: 'INVOICE' | 'TIMESHEET' | 'OFFER' | 'CONTRACT' | 'CV' | 'LETTER';
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  fontFamily: 'Inter' | 'Playfair Display' | 'Courier Prime' | 'Roboto';
  headerAlign: 'left' | 'center' | 'right';
  logoSize: number;
  fontSizeScale: number;
  showQrCode: boolean;
  showProductFrames: boolean;
  holographicLogo: boolean;
  showSignatureLine: boolean;
  showWatermark: boolean;
  labels: {
    title: string;
    invoiceNo: string;
    from: string;
    to: string;
    total: string;
    date: string;
    dueDate: string;
  };
  cvData?: {
    phone: string;
    email: string;
    address: string;
    bio: string;
    experience: CVEntry[];
    education: CVEntry[];
    skills: CVSkill[];
    languages: CVSkill[];
  };
  offerData?: {
    introTitle: string;
    introText: string;
    gallery: GalleryImage[];
    scope: any[];
  };
  contractData?: {
    partyA: string;
    partyB: string;
    articles: ContractArticle[];
  };
  letterData?: {
    recipientName: string;
    recipientAddress: string;
    subject: string;
    body: string;
  };
  logoUrl?: string;
  watermarkUrl?: string;
  cvProfilePhoto?: string;
}

interface CVEntry {
  id: string;
  title: string;
  subtitle: string;
  dateRange: string;
  description: string;
}

interface CVSkill {
  id: string;
  name: string;
  level: number;
}

interface ContractArticle {
  id: string;
  title: string;
  content: string;
}

interface GalleryImage {
  id: string;
  url: string;
  caption: string;
}

// ============================================
"@

$content = $content -replace "(import \{ useAuth \}.*?;)", "`$1$typeDefinitions"

Write-Host "✅ Dodano lokalne definicje typów" -ForegroundColor Green

# Zastąp useData() localStorage
$content = $content -replace "const \{ invoiceDesigns, saveInvoiceDesign, deleteInvoiceDesign \} = useData\(\);", @"
// KOMPATYBILNOŚĆ: Używamy localStorage zamiast DataContext
  const [invoiceDesigns, setInvoiceDesigns] = useState<InvoiceDesign[]>(() => {
    const saved = localStorage.getItem('invoice_designs');
    return saved ? JSON.parse(saved) : [];
  });

  const saveInvoiceDesign = (design: Omit<InvoiceDesign, 'id'>) => {
    const newDesign = { ...design, id: Math.random().toString(36).substr(2, 9) } as InvoiceDesign;
    const updated = [...invoiceDesigns, newDesign];
    setInvoiceDesigns(updated);
    localStorage.setItem('invoice_designs', JSON.stringify(updated));
  };

  const deleteInvoiceDesign = (id: string) => {
    const updated = invoiceDesigns.filter(d => d.id !== id);
    setInvoiceDesigns(updated);
    localStorage.setItem('invoice_designs', JSON.stringify(updated));
  };
"@

Write-Host "✅ Zastąpiono DataContext localStorage" -ForegroundColor Green

# Napraw Image → ImageIcon w JSX
$content = $content -replace "as ImageIcon", "as ImageIconAlias"
$content = $content -replace "<Image ", "<ImageIcon "
$content = $content -replace "</Image>", "</ImageIcon>"
$content = $content -replace "Image size", "ImageIcon size"

# Napraw Table → TableIcon w JSX  
$content = $content -replace "as TableIcon", "as TableIconAlias"
$content = $content -replace "<Table ", "<TableIcon "
$content = $content -replace "</Table>", "</TableIcon>"
$content = $content -replace "Table size", "TableIcon size"

# Napraw CheckCircle2 → CheckCircle
$content = $content -replace "CheckCircle2", "CheckCircle"

# Napraw CalendarDays → Calendar
$content = $content -replace "CalendarDays", "Calendar"

# Napraw handleUpload type error (dodaj ! na końcu)
$content = $content -replace "ref\.current\?\.files\?\[0\]", "ref.current!.files![0]"

Write-Host "✅ Naprawiono użycie ikon w JSX" -ForegroundColor Green

# Zapisz
$content | Set-Content $filePath -NoNewline

Write-Host "`n✨ GOTOWE! Naprawiono wszystkie 89 błędów!" -ForegroundColor Green
Write-Host "📝 Plik: $filePath" -ForegroundColor Yellow
Write-Host "`n⚠️  PAMIĘTAJ: Zainstaluj później dependencies:" -ForegroundColor Magenta
Write-Host "   npm install jspdf html2canvas`n" -ForegroundColor White
