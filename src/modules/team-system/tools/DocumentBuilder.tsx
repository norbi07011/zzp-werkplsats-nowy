import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Plus,
  Languages,
  Save,
  Printer,
  ArrowLeft,
  ChevronDown,
  Trash2,
  Camera,
  BookTemplate,
  X,
  Package,
  Wrench,
  Receipt,
  Building2,
  Users,
  Image as ImageIcon,
  UserCheck,
  CheckCircle2,
  MousePointerClick,
  Calculator,
  TrendingUp,
  PieChart,
  Activity,
  ShieldAlert,
  Wallet,
  Download,
  Folders,
  Menu,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RefreshCw,
  CloudOff,
  Cloud,
  Sparkles,
  Palette,
} from "lucide-react";
import {
  Quote,
  Client,
  WorkItem,
  Language,
  DocStatus,
  ProjectImage,
  QuoteTemplate,
  ResourceItem,
  CompanyProfile,
  ResourceTemplate,
  QuoteStyle,
  defaultQuoteStyle,
} from "./types";
import {
  LABELS,
  UNITS,
  DEFAULT_INTRO_NL,
  INITIAL_TEMPLATES,
  INITIAL_RESOURCE_TEMPLATES,
} from "./constants";
import { QuotePreview } from "./QuotePreview";
import { PhotoEditor } from "./PhotoEditor";
import { StyleEditor } from "./StyleEditor";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  fetchQuoteTemplates,
  createQuoteTemplate,
  updateQuoteTemplate,
  deleteQuoteTemplate,
  fetchResourceTemplates,
  createResourceTemplate,
  deleteResourceTemplate,
  fetchCompanyProfile,
  upsertCompanyProfile,
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  migrateLocalStorageToSupabase,
  fetchQuoteStyle,
  upsertQuoteStyle,
} from "./documentService";
import { toast } from "sonner";

// Mock Initial Data
const initialQuote: Quote = {
  id: "1",
  referenceNumber: "KB.24/104",
  date: new Date().toISOString().split("T")[0],
  executionDate: "", // Initialize empty
  status: DocStatus.DRAFT,
  client: {
    id: "",
    name: "",
    address: "",
    postalCode: "",
    city: "",
  },
  location: "",
  subject: "Renovatie Garagevloer",
  introText: DEFAULT_INTRO_NL,
  items: [
    {
      id: "101",
      category: "Garagevloer",
      description:
        "De 2 aanwezige dilatatievoege afdichten met Vulkem Quick-systeem:\nD.m.v. schuren met diamant de ondergrond opruwen.",
      quantity: 17,
      unit: "m1",
      pricePerUnit: 45.0,
      vatRate: 21,
    },
  ],
  materials: [],
  tools: [],
  images: [],
  notes: "",
  estimatedHours: 0,
  hourlyRate: 45,
  riskBuffer: 5, // Default 5%

  // Visibility Defaults
  showItemPrices: true,
  showMaterialPrices: true,
  showToolPrices: true,
};

// --- STORAGE HELPERS ---
const STORAGE_KEYS = {
  ACTIVE_QUOTE: "zzp_active_quote",
  COMPANY: "zzp_company_profile",
  CLIENTS: "zzp_clients",
  TEMPLATES: "zzp_templates",
  RESOURCE_TEMPLATES: "zzp_resource_templates",
  LANG: "zzp_lang",
};

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Failed to load ${key} from storage`, e);
    return fallback;
  }
};

// Helper: Parse number safely (returns 0 for NaN)
const parseNumber = (value: string, defaultValue: number = 0): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

export function DocumentBuilder() {
  // --- AUTH & ONLINE STATUS ---
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);

  // --- STATE INITIALIZATION WITH STORAGE ---
  const [view, setView] = useState<
    "dashboard" | "editor" | "preview" | "settings"
  >("dashboard");
  const [editorTab, setEditorTab] = useState<"quote" | "resources">("quote");
  const [settingsTab, setSettingsTab] = useState<"company" | "clients">(
    "company"
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State
  const [showStyleEditor, setShowStyleEditor] = useState(false); // Style Editor Panel

  const [currentLang, setCurrentLang] = useState<Language>(() =>
    loadFromStorage(STORAGE_KEYS.LANG, Language.PL)
  );

  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>(() =>
    loadFromStorage("zzp_quote_style", defaultQuoteStyle)
  );

  const [activeQuote, setActiveQuote] = useState<Quote>(() =>
    loadFromStorage(STORAGE_KEYS.ACTIVE_QUOTE, initialQuote)
  );

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() =>
    loadFromStorage(STORAGE_KEYS.COMPANY, {
      name: "",
      address: "",
      postalCode: "",
      city: "",
      kvk: "",
      btw: "",
      iban: "",
      bankName: "",
      email: "",
      phone: "",
      website: "",
    })
  );

  const [clients, setClients] = useState<Client[]>(() =>
    loadFromStorage(STORAGE_KEYS.CLIENTS, [])
  );

  const [templates, setTemplates] = useState<QuoteTemplate[]>(() =>
    loadFromStorage(STORAGE_KEYS.TEMPLATES, INITIAL_TEMPLATES)
  );

  const [resourceTemplates, setResourceTemplates] = useState<
    ResourceTemplate[]
  >(() =>
    loadFromStorage(STORAGE_KEYS.RESOURCE_TEMPLATES, INITIAL_RESOURCE_TEMPLATES)
  );

  // --- FILTER & SORT STATE ---
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceVatFilter, setResourceVatFilter] = useState<number | "all">(
    "all"
  );
  const [resourceSortConfig, setResourceSortConfig] = useState<{
    key: keyof ResourceItem;
    direction: "asc" | "desc";
  } | null>(null);

  // --- SUPABASE DATA LOADING ---
  const loadDataFromSupabase = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoadingData(true);
    try {
      // Pobierz szablony z bazy
      const [
        dbTemplates,
        dbResourceTemplates,
        dbCompanyProfile,
        dbClients,
        dbQuoteStyle,
      ] = await Promise.all([
        fetchQuoteTemplates(),
        fetchResourceTemplates(),
        fetchCompanyProfile(),
        fetchClients(),
        fetchQuoteStyle(),
      ]);

      console.log("[DocumentBuilder] Loaded from Supabase:", {
        templates: dbTemplates.length,
        resourceTemplates: dbResourceTemplates.length,
        hasCompanyProfile: !!dbCompanyProfile,
        clients: dbClients.length,
        hasQuoteStyle: !!dbQuoteStyle,
      });

      // Jeśli baza ma dane, używaj ich
      if (dbTemplates.length > 0) {
        setTemplates(dbTemplates);
      }
      if (dbResourceTemplates.length > 0) {
        setResourceTemplates(dbResourceTemplates);
      }
      if (dbCompanyProfile) {
        setCompanyProfile(dbCompanyProfile);
      }
      if (dbClients.length > 0) {
        setClients(dbClients);
      }
      // Zawsze ustaw styl z bazy (ma domyślne wartości)
      if (dbQuoteStyle) {
        setQuoteStyle(dbQuoteStyle);
      }

      // Sprawdź czy są lokalne dane do migracji (tylko gdy baza jest pusta i lokalne dane istnieją)
      const localTemplates = loadFromStorage(STORAGE_KEYS.TEMPLATES, []);
      const localClients = loadFromStorage(STORAGE_KEYS.CLIENTS, []);
      const hasLocalTemplatesNotInDb =
        localTemplates.length > 0 && dbTemplates.length === 0;
      const hasLocalClientsNotInDb =
        localClients.length > 0 && dbClients.length === 0;

      // Pokaż prompt tylko gdy są UNIKALNE lokalne dane których nie ma w bazie
      if (hasLocalTemplatesNotInDb || hasLocalClientsNotInDb) {
        console.log(
          "[DocumentBuilder] Migration prompt: local templates=",
          localTemplates.length,
          "db templates=",
          dbTemplates.length
        );
        setShowMigrationPrompt(true);
      } else {
        // Wyczyść lokalne dane jeśli baza ma dane (zapobiega przyszłym promptom)
        if (dbTemplates.length > 0) {
          localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
        }
        if (dbClients.length > 0) {
          localStorage.removeItem(STORAGE_KEYS.CLIENTS);
        }
      }

      setIsOnline(true);
    } catch (error) {
      console.error("Błąd ładowania danych z Supabase:", error);
      // NIE ustawiaj isOnline=false - pozwól użytkownikowi próbować zapisywać
      // setIsOnline(false); // USUNIĘTE - nie blokuj zapisu gdy błąd odczytu
      toast.warning("Problem z ładowaniem danych - używam lokalnych");
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, user]);

  // Załaduj dane z Supabase przy starcie (jeśli zalogowany)
  useEffect(() => {
    loadDataFromSupabase();
  }, [loadDataFromSupabase]);

  // Migracja danych z localStorage do Supabase
  const handleMigration = async () => {
    if (!isAuthenticated) return;

    setIsSyncing(true);
    try {
      const result = await migrateLocalStorageToSupabase();

      if (result.templates > 0 || result.clients > 0) {
        toast.success(
          `Zmigrowano: ${result.templates} szablonów, ${result.clients} klientów`
        );
        // Odśwież dane po migracji
        await loadDataFromSupabase();
        // Wyczyść localStorage po udanej migracji
        localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
        localStorage.removeItem(STORAGE_KEYS.RESOURCE_TEMPLATES);
        localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      } else {
        toast.info("Brak danych do migracji");
      }

      // Migration completed successfully
    } catch (error) {
      console.error("Błąd migracji:", error);
      toast.error("Nie udało się zmigrować danych");
    } finally {
      setIsSyncing(false);
      setShowMigrationPrompt(false);
    }
  };

  // --- PERSISTENCE EFFECTS (localStorage jako cache) ---
  useEffect(
    () =>
      localStorage.setItem(
        STORAGE_KEYS.ACTIVE_QUOTE,
        JSON.stringify(activeQuote)
      ),
    [activeQuote]
  );

  // Zapisz companyProfile do localStorage natychmiast, do bazy z debounce
  useEffect(() => {
    // Zapisz lokalnie natychmiast
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(companyProfile));

    // Zapisz do bazy danych z debounce (1.5 sekundy) - zapisuj gdy cokolwiek jest wypełnione
    const hasAnyData =
      companyProfile.name ||
      companyProfile.email ||
      companyProfile.phone ||
      companyProfile.logoUrl;
    if (isAuthenticated && user && hasAnyData) {
      const timeoutId = setTimeout(async () => {
        try {
          await upsertCompanyProfile(companyProfile);
          console.log("[DocumentBuilder] Company profile saved to Supabase");
        } catch (error) {
          console.error(
            "[DocumentBuilder] Error saving company profile:",
            error
          );
        }
      }, 1500);

      return () => clearTimeout(timeoutId);
    }
  }, [companyProfile, isAuthenticated, user]);

  useEffect(
    () => localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients)),
    [clients]
  );
  useEffect(
    () =>
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates)),
    [templates]
  );
  useEffect(
    () =>
      localStorage.setItem(
        STORAGE_KEYS.RESOURCE_TEMPLATES,
        JSON.stringify(resourceTemplates)
      ),
    [resourceTemplates]
  );
  useEffect(
    () => localStorage.setItem(STORAGE_KEYS.LANG, JSON.stringify(currentLang)),
    [currentLang]
  );

  // Zapisz styl do localStorage natychmiast, do bazy z debounce
  useEffect(() => {
    // Zapisz lokalnie natychmiast
    localStorage.setItem("zzp_quote_style", JSON.stringify(quoteStyle));

    // Zapisz do bazy danych z debounce (1.5 sekundy)
    if (isAuthenticated && user) {
      const timeoutId = setTimeout(async () => {
        try {
          await upsertQuoteStyle(quoteStyle);
          console.log("[DocumentBuilder] Quote style saved to Supabase");
        } catch (error) {
          console.error("[DocumentBuilder] Error saving quote style:", error);
        }
      }, 1500);

      return () => clearTimeout(timeoutId);
    }
  }, [quoteStyle, isAuthenticated, user]);

  // Other State
  const [validationErrors, setValidationErrors] = useState<Set<string>>(
    new Set()
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [showClientModal, setShowClientModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showResourceTemplateModal, setShowResourceTemplateModal] =
    useState(false);
  const [showSaveResourceTemplateModal, setShowSaveResourceTemplateModal] =
    useState(false);
  const [newResourceTemplateName, setNewResourceTemplateName] = useState("");

  const t = LABELS[currentLang];

  // PDF Generation is now handled directly in handleDownloadPDF
  // No useEffect needed - removes React DOM conflicts

  // Financial Calculations
  const calculateFinancials = () => {
    // 1. Revenue
    const revenue = activeQuote.items.reduce(
      (acc, item) => acc + item.quantity * item.pricePerUnit,
      0
    );

    // 2. Direct Costs
    const materialCosts = activeQuote.materials.reduce(
      (acc, item) => acc + item.quantity * (item.estimatedCost || 0),
      0
    );
    const toolCosts = activeQuote.tools.reduce(
      (acc, item) => acc + item.quantity * (item.estimatedCost || 0),
      0
    );
    const baseDirectCosts = materialCosts + toolCosts;

    // 3. Risk Cost
    const riskCost = (baseDirectCosts * (activeQuote.riskBuffer || 0)) / 100;

    // 4. Labor Cost (Theoretical - What you PAY yourself)
    const laborCosts =
      (activeQuote.estimatedHours || 0) * (activeQuote.hourlyRate || 0);

    // 5. Total Costs (Theoretical)
    const totalTheoreticalCosts = baseDirectCosts + riskCost + laborCosts;

    // 6. Profit (Company Margin)
    const profit = revenue - totalTheoreticalCosts;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // 7. Total Earnings for Freelancer (Labor + Profit)
    const totalEarnings = laborCosts + profit;

    // 8. Effective Hourly Rate (Real earning per hour)
    // (Revenue - MaterialCosts - ToolCosts - Risk) / Hours
    const effectiveHourlyRate =
      activeQuote.estimatedHours > 0
        ? (revenue - baseDirectCosts - riskCost) / activeQuote.estimatedHours
        : 0;

    return {
      revenue,
      materialCosts,
      toolCosts,
      riskCost,
      laborCosts,
      totalTheoreticalCosts,
      profit,
      margin,
      totalEarnings,
      effectiveHourlyRate,
    };
  };

  const financials = calculateFinancials();

  // Helper: Clear specific error
  const clearError = (key: string) => {
    if (validationErrors.has(key)) {
      setValidationErrors((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
    setFormError(null);
  };

  // Helper: Validate Form
  const validateForm = () => {
    const errors = new Set<string>();

    console.log("[VALIDATE] Checking form...", {
      clientName: activeQuote.client.name,
      referenceNumber: activeQuote.referenceNumber,
      itemsCount: activeQuote.items.length,
    });

    if (!activeQuote.client.name.trim()) errors.add("client.name");
    if (!activeQuote.referenceNumber.trim()) errors.add("referenceNumber");

    activeQuote.items.forEach((item) => {
      if (!item.description.trim()) {
        errors.add(`item-${item.id}-desc`);
      }
    });

    console.log("[VALIDATE] Errors found:", Array.from(errors));

    setValidationErrors(errors);
    if (errors.size > 0) {
      const errorMsg = errors.has("client.name")
        ? "⚠️ Uzupełnij nazwę klienta (zakładka Dane Klienta)"
        : errors.has("referenceNumber")
        ? "⚠️ Uzupełnij numer oferty (na górze formularza)"
        : "⚠️ Uzupełnij brakujące opisy pozycji";
      setFormError(errorMsg);
      toast.error(errorMsg);
      return false;
    }
    return true;
  };

  // Handlers for Quote Editor
  const handleAddItem = () => {
    const newItem: WorkItem = {
      id: Date.now().toString(),
      category: "Nieuwe Categorie",
      description: "",
      quantity: 1,
      unit: "stuks",
      pricePerUnit: 0,
      vatRate: 21,
    };
    setActiveQuote((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleUpdateItem = (id: string, field: keyof WorkItem, value: any) => {
    setActiveQuote((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));

    if (field === "description") {
      clearError(`item-${id}-desc`);
    }
  };

  const handleItemImageUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateItem(id, "image", reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleRemoveItemImage = (id: string) => {
    handleUpdateItem(id, "image", undefined);
  };

  const handleRemoveItem = (id: string) => {
    setActiveQuote((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  // Resource Handlers
  const handleAddResource = (type: "materials" | "tools") => {
    const newItem: ResourceItem = {
      id: Date.now().toString(),
      name: "",
      quantity: 1,
      unit: "stuks",
      estimatedCost: 0,
      vatRate: 21,
      notes: "",
    };
    setActiveQuote((prev) => ({
      ...prev,
      [type]: [...prev[type], newItem],
    }));
  };

  const handleUpdateResource = (
    type: "materials" | "tools",
    id: string,
    field: keyof ResourceItem,
    value: any
  ) => {
    setActiveQuote((prev) => ({
      ...prev,
      [type]: prev[type].map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleResourceImageUpload = (
    type: "materials" | "tools",
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Konwertuj do Base64 zamiast blob URL (blob URLs znikają po odświeżeniu strony)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleUpdateResource(type, id, "imageUrl", base64String);
      };
      reader.onerror = () => {
        console.error("Błąd odczytu pliku obrazu");
        toast.error("Nie udało się załadować obrazu");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveResource = (type: "materials" | "tools", id: string) => {
    setActiveQuote((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item.id !== id),
    }));
  };

  // --- FILTER & SORT LOGIC ---
  const handleSort = (key: keyof ResourceItem) => {
    setResourceSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const renderSortIcon = (key: keyof ResourceItem) => {
    if (resourceSortConfig?.key !== key)
      return <ArrowUpDown size={14} className="opacity-30" />;
    return resourceSortConfig.direction === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  const processResources = (items: ResourceItem[]) => {
    let result = [...items];

    // Filter by Text (Name or Notes)
    if (resourceSearch) {
      const lower = resourceSearch.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(lower) ||
          (i.notes && i.notes.toLowerCase().includes(lower))
      );
    }

    // Filter by VAT
    if (resourceVatFilter !== "all") {
      result = result.filter((i) => i.vatRate === resourceVatFilter);
    }

    // Sort
    if (resourceSortConfig) {
      result.sort((a, b) => {
        const aVal = a[resourceSortConfig.key] ?? 0;
        const bVal = b[resourceSortConfig.key] ?? 0;

        // Handle string vs number comparisons safely
        if (typeof aVal === "string" && typeof bVal === "string") {
          if (aVal.toLowerCase() < bVal.toLowerCase())
            return resourceSortConfig.direction === "asc" ? -1 : 1;
          if (aVal.toLowerCase() > bVal.toLowerCase())
            return resourceSortConfig.direction === "asc" ? 1 : -1;
          return 0;
        }

        if (aVal < bVal) return resourceSortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return resourceSortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      const newImage: ProjectImage = {
        id: Date.now().toString(),
        url,
        caption: "",
        description: "", // Init new field
        annotations: [],
      };
      setActiveQuote((prev) => ({
        ...prev,
        images: [...prev.images, newImage],
      }));
    }
  };

  const updateImage = (updatedImg: ProjectImage) => {
    setActiveQuote((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.id === updatedImg.id ? updatedImg : img
      ),
    }));
  };

  const removeImage = (id: string) => {
    setActiveQuote((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== id),
    }));
  };

  const handleSave = () => {
    // Explicit save action - validates and provides feedback
    if (validateForm()) {
      // Auto-save to localStorage is already active
      // Show success toast instead of alert
      toast.success(
        currentLang === Language.PL
          ? "✅ Zapisano lokalnie! Użyj 'Zapisz jako szablon' aby zapisać do bazy."
          : "✅ Lokaal opgeslagen! Gebruik 'Opslaan als sjabloon' om naar database op te slaan."
      );
    } else {
      toast.error(
        currentLang === Language.PL
          ? "❌ Popraw błędy walidacji przed zapisem"
          : "❌ Corrigeer validatiefouten voor opslaan"
      );
      setEditorTab("quote"); // Switch to main tab to show errors
    }
  };

  const handlePreviewClick = () => {
    if (validateForm()) {
      setView("preview");
    } else {
      setEditorTab("quote"); // Switch to main tab to show errors
    }
  };

  // Helper function to build print-ready HTML
  const buildPrintHTML = (previewContainer: HTMLElement) => {
    // Get all stylesheets from the current page
    const styleSheets = Array.from(document.styleSheets);
    let cssText = "";

    styleSheets.forEach((sheet) => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach((rule) => {
            cssText += rule.cssText + "\n";
          });
        }
      } catch (e) {
        // Skip cross-origin stylesheets
        if (sheet.href) {
          cssText += `@import url("${sheet.href}");\n`;
        }
      }
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Oferta ${activeQuote.referenceNumber}</title>
        <style>
          ${cssText}
          
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .print-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
          }
          
          [class*="bg-gradient"], [class*="from-"], [class*="to-"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .shadow-2xl, .shadow-xl, .shadow-lg {
            box-shadow: none !important;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${previewContainer.innerHTML}
        </div>
      </body>
      </html>
    `;
  };

  // PRINT function - opens print dialog
  const handlePrint = async () => {
    console.log("[PRINT] ========= handlePrint STARTED =========");

    if (!activeQuote.referenceNumber.trim()) {
      toast.error("⚠️ Uzupełnij numer oferty przed drukowaniem");
      setEditorTab("quote");
      return;
    }

    const originalView = view;

    try {
      if (view !== "preview") {
        setView("preview");
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const previewContainer = document.getElementById("pdf-preview-container");
      if (!previewContainer) {
        throw new Error("Preview container not found.");
      }

      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        throw new Error("Could not open print window. Please allow popups.");
      }

      const printContent =
        buildPrintHTML(previewContainer) +
        `
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 500);
          };
        </script>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();

      toast.info("🖨️ Otwarto okno drukowania");
      console.log("[PRINT] ========= PRINT DIALOG OPENED =========");
    } catch (e) {
      console.error("[PRINT] Error:", e);
      toast.error("Błąd: " + (e instanceof Error ? e.message : "nieznany"));
    }
  };

  // PDF DOWNLOAD function - automatically downloads PDF file
  const handleDownloadPDF = async () => {
    console.log("[PDF] ========= handleDownloadPDF STARTED =========");

    if (!activeQuote.referenceNumber.trim()) {
      toast.error("⚠️ Uzupełnij numer oferty przed pobraniem PDF");
      setEditorTab("quote");
      return;
    }

    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      toast.error("Błąd: biblioteka PDF nie załadowana. Odśwież stronę.");
      return;
    }

    setIsGeneratingPDF(true);
    toast.info("Generowanie PDF... proszę czekać");

    const originalView = view;

    try {
      if (view !== "preview") {
        setView("preview");
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const previewContainer = document.getElementById("pdf-preview-container");
      if (!previewContainer) {
        throw new Error("Preview container not found.");
      }

      // Create an iframe to render with full styles
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "0";
      iframe.style.top = "0";
      iframe.style.width = "210mm";
      iframe.style.height = "297mm";
      iframe.style.border = "none";
      iframe.style.zIndex = "99999";
      iframe.style.background = "white";
      document.body.appendChild(iframe);

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Could not access iframe document");
      }

      // Write the full HTML with styles
      iframeDoc.open();
      iframeDoc.write(buildPrintHTML(previewContainer));
      iframeDoc.close();

      // Wait for iframe to fully render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Wait for images in iframe
      const images = iframeDoc.querySelectorAll("img");
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) resolve(true);
                else {
                  img.onload = () => resolve(true);
                  img.onerror = () => resolve(false);
                  setTimeout(() => resolve(false), 3000);
                }
              })
          )
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const printContainer = iframeDoc.querySelector(".print-container");
      if (!printContainer) {
        throw new Error("Print container not found in iframe");
      }

      console.log("[PDF] Starting html2pdf from iframe...");

      const opt = {
        margin: 0,
        filename: `${activeQuote.referenceNumber || "offerte"}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(opt).from(printContainer).save();

      // Cleanup
      document.body.removeChild(iframe);

      console.log("[PDF] ========= PDF GENERATED SUCCESSFULLY =========");
      toast.success("✅ PDF pobrany pomyślnie!");
    } catch (e) {
      console.error("[PDF] Error:", e);
      toast.error(
        "Błąd generowania PDF: " + (e instanceof Error ? e.message : "nieznany")
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Template Handlers
  const handleLoadTemplate = (template: QuoteTemplate) => {
    const newItems = template.items.map((item) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
    }));

    // Also load materials and tools
    const newMaterials = template.materials
      ? template.materials.map((m) => ({
          ...m,
          id: Math.random().toString(36).substr(2, 9),
        }))
      : [];
    const newTools = template.tools
      ? template.tools.map((t) => ({
          ...t,
          id: Math.random().toString(36).substr(2, 9),
        }))
      : [];

    setActiveQuote((prev) => ({
      ...prev,
      subject: template.subject,
      introText: template.introText,
      items: newItems,
      materials: newMaterials,
      tools: newTools,
    }));
    setShowTemplateModal(false);
    setView("editor");
    setEditorTab("quote");
  };

  const handleSaveAsTemplate = async () => {
    console.log("[DocumentBuilder] handleSaveAsTemplate called!", {
      newTemplateName,
      isAuthenticated,
      userId: user?.id,
    });

    if (!newTemplateName.trim()) {
      toast.error("Podaj nazwę szablonu / Voer sjabloonnaam in");
      return;
    }

    // Zapisz nazwę przed zamknięciem modala
    const templateName = newTemplateName.trim();
    setNewTemplateName("");

    // NIE zamykamy modala natychmiast - poczekamy na zakończenie operacji
    // setShowSaveTemplateModal(false); // OPÓŹNIONE

    const newTemplate: QuoteTemplate = {
      id: Date.now().toString(),
      name: templateName,
      subject: activeQuote.subject,
      introText: activeQuote.introText,
      items: activeQuote.items.map(({ id, ...rest }) => rest), // Strip IDs
      materials: activeQuote.materials.map(({ id, ...rest }) => rest),
      tools: activeQuote.tools.map(({ id, ...rest }) => rest),
    };

    // ZAWSZE próbuj zapisać do Supabase jeśli zalogowany (niezależnie od isOnline)
    if (isAuthenticated) {
      try {
        console.log("[DocumentBuilder] Saving template to Supabase...", {
          name: templateName,
          isAuthenticated,
          userId: user?.id,
        });
        const savedTemplate = await createQuoteTemplate(newTemplate);
        console.log(
          "[DocumentBuilder] Template saved successfully:",
          savedTemplate
        );
        setTemplates((prev) => [...prev, savedTemplate]);
        setIsOnline(true); // Sukces = jesteśmy online

        // ZAMKNIJ MODAL PO SUKCESIE - użyj setTimeout aby uniknąć race condition
        setTimeout(() => setShowSaveTemplateModal(false), 50);

        toast.success(
          currentLang === Language.PL
            ? "✅ Szablon zapisany w bazie!"
            : "✅ Sjabloon opgeslagen in database!"
        );
      } catch (error) {
        console.error("[DocumentBuilder] Błąd zapisu szablonu:", error);
        // Fallback do localStorage
        setTemplates((prev) => [...prev, newTemplate]);

        // ZAMKNIJ MODAL PO BŁĘDZIE
        setTimeout(() => setShowSaveTemplateModal(false), 50);

        toast.warning(
          currentLang === Language.PL
            ? "⚠️ Zapisano lokalnie (błąd bazy: " +
                (error instanceof Error ? error.message : "nieznany") +
                ")"
            : "⚠️ Lokaal opgeslagen (databasefout)"
        );
      }
    } else {
      // Nie zalogowany - zapisz lokalnie
      console.log("[DocumentBuilder] Not authenticated - saving locally");
      setTemplates((prev) => [...prev, newTemplate]);

      // ZAMKNIJ MODAL PO ZAPISIE LOKALNYM
      setTimeout(() => setShowSaveTemplateModal(false), 50);

      toast.info(
        currentLang === Language.PL
          ? "💾 Zapisano lokalnie (zaloguj się aby synchronizować)"
          : "💾 Lokaal opgeslagen (log in om te synchroniseren)"
      );
    }
  };

  // Resource Template Handlers
  const handleLoadResourceTemplate = (template: ResourceTemplate) => {
    const newMaterials = template.materials.map((m) => ({
      ...m,
      id: Math.random().toString(36).substr(2, 9),
    }));
    const newTools = template.tools.map((t) => ({
      ...t,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setActiveQuote((prev) => ({
      ...prev,
      materials: [...prev.materials, ...newMaterials],
      tools: [...prev.tools, ...newTools],
    }));

    // ZAMKNIJ MODAL Z OPÓŹNIENIEM
    setTimeout(() => setShowResourceTemplateModal(false), 50);

    toast.success(
      currentLang === Language.PL
        ? "Dodano zasoby z szablonu!"
        : "Resources toegevoegd!"
    );
  };

  const handleSaveResourceTemplate = async () => {
    if (!newResourceTemplateName.trim()) {
      toast.error("Podaj nazwę zestawu / Voer setnaam in");
      return;
    }

    // Zapisz nazwę przed operacją
    const templateName = newResourceTemplateName.trim();
    setNewResourceTemplateName("");
    // NIE zamykaj modala natychmiast - poczekaj na zakończenie operacji

    const newTemplate: ResourceTemplate = {
      id: Date.now().toString(),
      name: templateName,
      materials: activeQuote.materials.map(({ id, ...rest }) => rest),
      tools: activeQuote.tools.map(({ id, ...rest }) => rest),
    };

    // Zapisz do Supabase jeśli zalogowany
    if (isAuthenticated && isOnline) {
      try {
        const savedTemplate = await createResourceTemplate(newTemplate);
        setResourceTemplates((prev) => [...prev, savedTemplate]);

        // ZAMKNIJ MODAL PO SUKCESIE
        setTimeout(() => setShowSaveResourceTemplateModal(false), 50);

        toast.success(
          currentLang === Language.PL
            ? "✅ Zestaw zapisany w bazie!"
            : "✅ Set opgeslagen in database!"
        );
      } catch (error) {
        console.error("Błąd zapisu zestawu:", error);
        setResourceTemplates((prev) => [...prev, newTemplate]);

        // ZAMKNIJ MODAL PO BŁĘDZIE
        setTimeout(() => setShowSaveResourceTemplateModal(false), 50);

        toast.warning("Zapisano lokalnie (brak połączenia z bazą)");
      }
    } else {
      setResourceTemplates((prev) => [...prev, newTemplate]);

      // ZAMKNIJ MODAL PO ZAPISIE LOKALNYM
      setTimeout(() => setShowSaveResourceTemplateModal(false), 50);

      toast.info("Zapisano lokalnie");
    }
  };

  // Template Delete Handlers
  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering template load

    const confirmed = window.confirm(
      currentLang === Language.PL
        ? "Czy na pewno chcesz usunąć ten szablon?"
        : "Weet je zeker dat je dit sjabloon wilt verwijderen?"
    );

    if (!confirmed) return;

    if (isAuthenticated && isOnline) {
      try {
        await deleteQuoteTemplate(id);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast.success("Szablon usunięty");
      } catch (error) {
        console.error("Błąd usuwania szablonu:", error);
        toast.error("Nie udało się usunąć szablonu");
      }
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.info("Usunięto lokalnie");
    }
  };

  const handleDeleteResourceTemplate = async (
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      currentLang === Language.PL
        ? "Czy na pewno chcesz usunąć ten zestaw?"
        : "Weet je zeker dat je deze set wilt verwijderen?"
    );

    if (!confirmed) return;

    if (isAuthenticated && isOnline) {
      try {
        await deleteResourceTemplate(id);
        setResourceTemplates((prev) => prev.filter((t) => t.id !== id));
        toast.success("Zestaw usunięty");
      } catch (error) {
        console.error("Błąd usuwania zestawu:", error);
        toast.error("Nie udało się usunąć zestawu");
      }
    } else {
      setResourceTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.info("Usunięto lokalnie");
    }
  };

  // Settings & Client Handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyProfile((prev) => ({
          ...prev,
          logoUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAddClient = () => {
    setClients((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        address: "",
        postalCode: "",
        city: "",
      },
    ]);
  };

  const handleUpdateClient = (
    id: string,
    field: keyof Client,
    value: string
  ) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const selectClientForQuote = (client: Client) => {
    setActiveQuote((prev) => ({
      ...prev,
      client: { ...client }, // copy
    }));
    setShowClientModal(false);
    clearError("client.name");
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 relative">
      {/* ... (Styles and Hidden PDF content omitted) ... */}
      {/* Custom CSS for the Neon Cards - Global */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .neon-card {
                /* ... (existing styles) ... */
                --white: hsl(0, 0%, 100%);
                --black: hsl(240, 15%, 9%);
                --paragraph: hsl(0, 0%, 83%);
                --line: hsl(240, 9%, 17%);
                --primary: hsl(189, 92%, 58%);

                position: relative;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                padding: 1.5rem;
                
                background-color: hsla(240, 15%, 9%, 1);
                background-image: radial-gradient(
                    at 88% 40%,
                    hsla(240, 15%, 9%, 1) 0px,
                    transparent 85%
                ),
                radial-gradient(at 49% 30%, hsla(240, 15%, 9%, 1) 0px, transparent 85%),
                radial-gradient(at 14% 26%, hsla(240, 15%, 9%, 1) 0px, transparent 85%),
                radial-gradient(at 0% 64%, hsl(189, 99%, 26%) 0px, transparent 85%),
                radial-gradient(at 41% 94%, hsl(189, 97%, 36%) 0px, transparent 85%),
                radial-gradient(at 100% 99%, hsl(188, 94%, 13%) 0px, transparent 85%);

                border-radius: 1rem;
                /* Elegant Border without rotation */
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0px -16px 24px 0px rgba(255, 255, 255, 0.05) inset;
                
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                min-height: 250px;
                cursor: pointer;
                overflow: hidden;
            }

            .neon-card:hover {
                transform: translateY(-5px) scale(1.02);
                border-color: var(--primary);
                box-shadow: 
                    0px -16px 24px 0px rgba(255, 255, 255, 0.1) inset,
                    0 16px 48px -12px hsla(189, 92%, 58%, 0.4);
                z-index: 10;
            }

            /* Hiding old elements to clean up the look */
            .neon-card .card__border {
                display: none;
            }

            .neon-card .card_title {
                font-size: 1.25rem;
                font-weight: 700;
                color: var(--white);
            }

            .neon-card .card_paragraph {
                margin-top: 0.25rem;
                font-size: 0.85rem;
                color: var(--paragraph);
            }

            .neon-card .line {
                width: 100%;
                height: 0.1rem;
                background-color: var(--line);
                border: none;
                margin: 0.5rem 0;
            }

            .neon-card .card__list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .neon-card .card__list_item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .neon-card .check {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 1rem;
                height: 1rem;
                background-color: var(--primary);
                border-radius: 50%;
                flex-shrink: 0;
            }

            .neon-card .check_svg {
                width: 0.75rem;
                height: 0.75rem;
                fill: var(--black);
            }

            .neon-card .list_text {
                font-size: 0.75rem;
                color: var(--white);
            }

            .neon-card .button {
                cursor: pointer;
                padding: 0.75rem;
                width: 100%;
                background-image: linear-gradient(
                0deg,
                hsl(189, 92%, 58%),
                hsl(189, 99%, 26%) 100%
                );
                font-size: 0.875rem;
                font-weight: 700;
                color: var(--white);
                border: 0;
                border-radius: 9999px;
                box-shadow: inset 0 -2px 25px -4px var(--white);
                transition: opacity 0.2s;
                text-align: center;
            }
            
            .neon-card .button:hover {
                opacity: 0.9;
            }
        `,
        }}
      />

      {/* PDF Generation Indicator - Simple overlay without mounting QuotePreview */}
      {isGeneratingPDF && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-lg font-medium text-gray-700">
              Generowanie PDF...
            </span>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      {view !== "preview" && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 z-40 flex items-center justify-between px-4 md:hidden shadow-md">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <FileText className="text-blue-500" /> ZZP Werkplaats
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 hover:bg-slate-800 rounded-lg"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      {view !== "preview" && (
        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-screen overflow-y-auto print:hidden transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
            md:translate-x-0
        `}
        >
          <div className="p-6 hidden md:block">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="text-blue-500" /> ZZP Werkplaats
            </h1>
          </div>
          {/* Mobile specific header inside sidebar for better UX */}
          <div className="p-6 md:hidden flex justify-between items-center border-b border-slate-800 mb-2">
            <h1 className="text-xl font-bold text-white">Menu</h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-400"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4 md:mt-0">
            {/* Back to Team button */}
            <button
              onClick={() => {
                navigate("/employer/team");
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 border border-orange-500/30 mb-4"
            >
              <ArrowLeft size={20} /> Powrót do Drużyny
            </button>
            
            <button
              onClick={() => {
                setView("dashboard");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                view === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800"
              }`}
            >
              <LayoutDashboard size={20} /> {t.dashboard}
            </button>
            <button
              onClick={() => {
                setView("settings");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                view === "settings"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800"
              }`}
            >
              <Settings size={20} /> {t.settings}
            </button>
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={() =>
                setCurrentLang((l) =>
                  l === Language.PL ? Language.NL : Language.PL
                )
              }
              className="flex items-center gap-2 text-sm hover:text-white"
            >
              <Languages size={16} />{" "}
              {currentLang === Language.PL ? "Polski" : "Nederlands"}
            </button>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {view === "dashboard" && (
        <div className="md:pl-64 pt-16 md:pt-0 p-8 min-h-screen">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl md:text-3xl font-bold text-gray-800">
              {t.dashboard}
            </h2>
            <button
              onClick={() => {
                // Reset but keep ID to prevent key collision if needed, or create new
                const newQuote = { ...initialQuote, id: Date.now().toString() };
                setActiveQuote(newQuote);
                setValidationErrors(new Set());
                setView("editor");
                setEditorTab("quote");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow-lg flex items-center gap-2 font-medium transition-transform active:scale-95 text-sm md:text-base"
            >
              <Plus size={20} /> {t.newQuote}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="neon-card relative group">
                <div className="card__border" />
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                  className="absolute top-2 right-2 p-2 bg-red-500/10 hover:bg-red-500/30 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                  title={
                    currentLang === Language.PL
                      ? "Usuń szablon"
                      : "Verwijder sjabloon"
                  }
                >
                  <Trash2 size={16} />
                </button>
                <div className="card_title__container">
                  <span className="card_title">{tmpl.name}</span>
                  <p className="card_paragraph">{tmpl.subject}</p>
                </div>
                <hr className="line" />
                <ul className="card__list flex-1">
                  {tmpl.items.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="card__list_item">
                      <span className="check">
                        <svg
                          className="check_svg"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            clipRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            fillRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="list_text line-clamp-1">
                        {item.category}
                      </span>
                    </li>
                  ))}
                  <li className="card__list_item">
                    <span className="list_text text-xs text-gray-400 italic">
                      +{" "}
                      {tmpl.items.length +
                        tmpl.materials.length +
                        tmpl.tools.length}{" "}
                      pozycji
                    </span>
                  </li>
                </ul>
                {/* Dwa przyciski: Edytuj i Podgląd */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadTemplate(tmpl);
                    }}
                    className="flex-1 cursor-pointer py-2 px-3 bg-gradient-to-b from-cyan-400 to-cyan-700 text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                  >
                    <FileText size={14} />
                    {currentLang === Language.PL ? "Edytuj" : "Bewerken"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Załaduj szablon i przejdź do podglądu
                      const newItems = tmpl.items.map((item) => ({
                        ...item,
                        id: Math.random().toString(36).substr(2, 9),
                      }));
                      const newMaterials = tmpl.materials
                        ? tmpl.materials.map((m) => ({
                            ...m,
                            id: Math.random().toString(36).substr(2, 9),
                          }))
                        : [];
                      const newTools = tmpl.tools
                        ? tmpl.tools.map((t) => ({
                            ...t,
                            id: Math.random().toString(36).substr(2, 9),
                          }))
                        : [];
                      setActiveQuote((prev) => ({
                        ...prev,
                        subject: tmpl.subject,
                        introText: tmpl.introText,
                        items: newItems,
                        materials: newMaterials,
                        tools: newTools,
                      }));
                      setView("preview");
                    }}
                    className="flex-1 cursor-pointer py-2 px-3 bg-gradient-to-b from-slate-600 to-slate-800 text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                  >
                    <Eye size={14} />
                    {currentLang === Language.PL ? "Podgląd" : "Preview"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings View */}
      {view === "settings" && (
        <div className="md:pl-64 pt-16 md:pt-0 p-8 min-h-screen bg-gray-50">
          <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-6">
            {t.settings}
          </h2>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
            {/* ... (Settings content omitted) ... */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSettingsTab("company")}
                className={`flex-1 py-4 text-center font-medium flex items-center justify-center gap-2 ${
                  settingsTab === "company"
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Building2 size={20} />{" "}
                <span className="hidden md:inline">{t.companyProfile}</span>{" "}
                <span className="md:hidden">Firma</span>
              </button>
              <button
                onClick={() => setSettingsTab("clients")}
                className={`flex-1 py-4 text-center font-medium flex items-center justify-center gap-2 ${
                  settingsTab === "clients"
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Users size={20} />{" "}
                <span className="hidden md:inline">{t.clientDatabase}</span>{" "}
                <span className="md:hidden">Klienci</span>
              </button>
            </div>

            <div className="p-4 md:p-8">
              {settingsTab === "company" && (
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Company Settings form content omitted for brevity as it is unchanged */}
                  <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="w-24 h-24 bg-white border rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {companyProfile.logoUrl ? (
                        <img
                          src={companyProfile.logoUrl}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="text-gray-300" size={40} />
                      )}
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="font-bold text-gray-700 mb-2">
                        {t.uploadLogo}
                      </h3>
                      <label className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer inline-block">
                        Wybierz plik
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                      </label>
                      <p className="text-xs text-gray-400 mt-2">
                        Format: PNG, JPG (Max 2MB)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        {t.companyName}
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.name}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        {t.address}
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.address}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        Kod Pocztowy
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.postalCode}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            postalCode: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        Miasto
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.city}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 pt-4 border-t mt-2">
                      <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider mb-4">
                        {t.contactInfo}
                      </h4>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        Email
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.email}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        Telefon / Telefoon
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.phone}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        Website
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.website}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            website: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 pt-4 border-t mt-2">
                      <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider mb-4">
                        {t.bankDetails}
                      </h4>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        KvK (CoC)
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.kvk}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            kvk: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        BTW (VAT ID)
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.btw}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            btw: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        Nazwa Banku
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.bankName}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            bankName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-600 mb-1">
                        IBAN
                      </label>
                      <input
                        className="w-full p-2 border rounded"
                        value={companyProfile.iban}
                        onChange={(e) =>
                          setCompanyProfile({
                            ...companyProfile,
                            iban: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <button
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4"
                    onClick={() => alert("Zapisano pomyślnie!")}
                  >
                    {t.save}
                  </button>
                </div>
              )}

              {settingsTab === "clients" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-700">
                      Twoi Klienci ({clients.length})
                    </h3>
                    <button
                      onClick={handleAddClient}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700"
                    >
                      <Plus size={16} /> {t.addClient}
                    </button>
                  </div>

                  {clients.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                      {t.noClients}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center"
                        >
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <input
                              className="p-2 border rounded text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Nazwa Klienta / Firma"
                              value={client.name}
                              onChange={(e) =>
                                handleUpdateClient(
                                  client.id,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                            <input
                              className="p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Adres"
                              value={client.address}
                              onChange={(e) =>
                                handleUpdateClient(
                                  client.id,
                                  "address",
                                  e.target.value
                                )
                              }
                            />
                            <input
                              className="p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Kod pocztowy"
                              value={client.postalCode}
                              onChange={(e) =>
                                handleUpdateClient(
                                  client.id,
                                  "postalCode",
                                  e.target.value
                                )
                              }
                            />
                            <input
                              className="p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Miasto"
                              value={client.city}
                              onChange={(e) =>
                                handleUpdateClient(
                                  client.id,
                                  "city",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-gray-400 hover:text-red-500 p-2"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal - Using Portal to avoid insertBefore error */}
      {showSaveTemplateModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {t.saveAsTemplate}
              </h3>
              <input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder={t.templateName}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Save Resource Template Modal - Using Portal */}
      {showSaveResourceTemplateModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {t.saveResourceTemplate}
              </h3>
              <input
                value={newResourceTemplateName}
                onChange={(e) => setNewResourceTemplateName(e.target.value)}
                placeholder={t.templateName}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveResourceTemplateModal(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveResourceTemplate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Template Modal - Using Portal */}
      {showTemplateModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BookTemplate className="text-blue-600" /> {t.templates}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Wybierz gotowy wzór, aby przyspieszyć pracę
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {templates.map((tmpl) => (
                    <div key={tmpl.id} className="neon-card">
                      <div className="card__border" />

                      <div className="card_title__container">
                        <span className="card_title">{tmpl.name}</span>
                        <p className="card_paragraph">{tmpl.subject}</p>
                      </div>

                      <hr className="line" />

                      <ul className="card__list flex-1">
                        {tmpl.items.slice(0, 5).map((item, idx) => (
                          <li key={idx} className="card__list_item">
                            <span className="check">
                              <svg
                                className="check_svg"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  clipRule="evenodd"
                                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                                  fillRule="evenodd"
                                />
                              </svg>
                            </span>
                            <span className="list_text line-clamp-2">
                              {item.category}:{" "}
                              {item.description.substring(0, 50)}...
                            </span>
                          </li>
                        ))}
                        {(tmpl.items.length > 5 ||
                          tmpl.materials.length > 0) && (
                          <li className="card__list_item">
                            <span
                              className="check"
                              style={{
                                background: "transparent",
                                border: "1px solid var(--primary)",
                              }}
                            >
                              <Plus size={10} className="text-cyan-400" />
                            </span>
                            <span className="list_text text-cyan-400">
                              +{" "}
                              {tmpl.items.length - 5 > 0
                                ? `${tmpl.items.length - 5} items, `
                                : ""}
                              {tmpl.materials.length} materialen
                            </span>
                          </li>
                        )}
                      </ul>

                      <div className="mt-4">
                        <button
                          className="button"
                          onClick={() => handleLoadTemplate(tmpl)}
                        >
                          {t.useTemplate}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Resource Template Modal - Using Portal */}
      {showResourceTemplateModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Folders className="text-amber-600" /> {t.resourceTemplates}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Wybierz zestaw, aby dodać go do listy
                  </p>
                </div>
                <button
                  onClick={() => setShowResourceTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {resourceTemplates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="neon-card"
                      style={{ "--primary": "hsl(36, 92%, 58%)" } as any}
                    >
                      <div className="card__border" />

                      <div className="card_title__container">
                        <span className="card_title">{tmpl.name}</span>
                      </div>

                      <hr className="line" />

                      <ul className="card__list flex-1">
                        {tmpl.materials.slice(0, 4).map((item, idx) => (
                          <li key={idx} className="card__list_item">
                            <span
                              className="check"
                              style={{ background: "var(--primary)" }}
                            >
                              <svg
                                className="check_svg"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  clipRule="evenodd"
                                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                                  fillRule="evenodd"
                                />
                              </svg>
                            </span>
                            <span className="list_text line-clamp-1">
                              {item.name}
                            </span>
                          </li>
                        ))}
                        {tmpl.tools.slice(0, 2).map((item, idx) => (
                          <li key={"tool" + idx} className="card__list_item">
                            <span
                              className="check"
                              style={{
                                background: "var(--primary)",
                                opacity: 0.7,
                              }}
                            >
                              <Wrench size={10} className="text-black" />
                            </span>
                            <span className="list_text line-clamp-1">
                              {item.name}
                            </span>
                          </li>
                        ))}
                        <li className="card__list_item">
                          <span className="list_text text-xs text-gray-400 italic">
                            {tmpl.materials.length} mat. / {tmpl.tools.length}{" "}
                            tool
                          </span>
                        </li>
                      </ul>

                      <div className="mt-4">
                        <button
                          className="button"
                          style={{
                            backgroundImage:
                              "linear-gradient(0deg, hsl(36, 92%, 58%), hsl(36, 99%, 26%) 100%)",
                          }}
                          onClick={() => handleLoadResourceTemplate(tmpl)}
                        >
                          {t.loadResourceTemplate}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Editor View */}
      {view === "editor" && (
        <div className="md:pl-64 pt-16 md:pt-0 bg-gray-50 min-h-screen pb-20">
          {/* Top Bar */}
          <div className="bg-white border-b sticky top-16 md:top-0 z-20 px-4 md:px-8 py-4 flex flex-col shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => setView("dashboard")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft />
                </button>
                <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate max-w-[200px] md:max-w-none">
                  {activeQuote.referenceNumber || "Nowa Oferta"}
                </h2>
              </div>

              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                <button
                  onClick={() => setEditorTab("quote")}
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    editorTab === "quote"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Receipt size={14} />
                  <span>Oferta</span>
                </button>
                <button
                  onClick={() => setEditorTab("resources")}
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    editorTab === "resources"
                      ? "bg-white text-amber-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Package size={14} />
                  <span>Zasoby</span>
                </button>
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium border border-blue-200 text-sm whitespace-nowrap"
                >
                  <BookTemplate size={16} />{" "}
                  <span className="hidden lg:inline">{t.templates}</span>
                </button>
                <button
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-medium border border-emerald-200 text-sm whitespace-nowrap"
                >
                  <Save size={16} />{" "}
                  <span className="hidden lg:inline">{t.saveAsTemplate}</span>
                </button>
                <div className="flex-1"></div>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  <span className={isGeneratingPDF ? "" : "hidden"}>
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  </span>
                  <span className={isGeneratingPDF ? "hidden" : ""}>
                    <Download size={16} />
                  </span>
                  <span>PDF</span>
                </button>
                <button
                  onClick={handlePreviewClick}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium shadow-md text-sm"
                >
                  <Printer size={16} />
                </button>
              </div>
            </div>

            {/* Form Validation Error Banner */}
            {formError ? (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-red-700 text-sm font-bold">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{formError}</span>
                </div>
                <button
                  onClick={() => setFormError(null)}
                  className="text-red-400 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="max-w-5xl mx-auto mt-4 md:mt-8 px-4 md:px-8 space-y-8">
            {/* === TAB: QUOTE === */}
            {editorTab === "quote" && (
              <>
                {/* Header Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex justify-between items-center">
                      {t.clientDetails}
                      <button
                        onClick={() => setShowClientModal(true)}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded-full"
                        title="Wybierz z listy"
                      >
                        <UserCheck size={18} />
                      </button>
                    </h3>
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          placeholder="Nazwa Klienta / Firma"
                          className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${
                            validationErrors.has("client.name")
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200"
                          }`}
                          value={activeQuote.client.name}
                          onChange={(e) => {
                            setActiveQuote({
                              ...activeQuote,
                              client: {
                                ...activeQuote.client,
                                name: e.target.value,
                              },
                            });
                            clearError("client.name");
                          }}
                        />
                        {validationErrors.has("client.name") && (
                          <p className="text-red-500 text-xs mt-1">
                            To pole jest wymagane
                          </p>
                        )}
                      </div>
                      <input
                        placeholder="Ulica i numer"
                        className="w-full p-2 border rounded outline-none border-gray-200"
                        value={activeQuote.client.address}
                        onChange={(e) =>
                          setActiveQuote({
                            ...activeQuote,
                            client: {
                              ...activeQuote.client,
                              address: e.target.value,
                            },
                          })
                        }
                      />
                      <div className="flex gap-4">
                        <input
                          placeholder="Kod pocztowy"
                          className="w-1/3 p-2 border rounded outline-none border-gray-200"
                          value={activeQuote.client.postalCode}
                          onChange={(e) =>
                            setActiveQuote({
                              ...activeQuote,
                              client: {
                                ...activeQuote.client,
                                postalCode: e.target.value,
                              },
                            })
                          }
                        />
                        <input
                          placeholder="Miasto"
                          className="w-2/3 p-2 border rounded outline-none border-gray-200"
                          value={activeQuote.client.city}
                          onChange={(e) =>
                            setActiveQuote({
                              ...activeQuote,
                              client: {
                                ...activeQuote.client,
                                city: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                      {t.projectDetails}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className="text-xs text-gray-500">
                            {t.date}
                          </label>
                          <input
                            type="date"
                            className="w-full p-2 border rounded outline-none border-gray-200"
                            value={activeQuote.date}
                            onChange={(e) =>
                              setActiveQuote({
                                ...activeQuote,
                                date: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="text-xs text-gray-500">
                            {t.reference}
                          </label>
                          <input
                            className={`w-full p-2 border rounded outline-none ${
                              validationErrors.has("referenceNumber")
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200"
                            }`}
                            value={activeQuote.referenceNumber}
                            onChange={(e) => {
                              setActiveQuote({
                                ...activeQuote,
                                referenceNumber: e.target.value,
                              });
                              clearError("referenceNumber");
                            }}
                          />
                          {validationErrors.has("referenceNumber") && (
                            <p className="text-red-500 text-xs mt-1">
                              To pole jest wymagane
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          {t.executionDate}
                        </label>
                        <input
                          type="date"
                          className="w-full p-2 border rounded outline-none border-gray-200"
                          value={activeQuote.executionDate || ""}
                          onChange={(e) =>
                            setActiveQuote({
                              ...activeQuote,
                              executionDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          {t.subject}
                        </label>
                        <input
                          className="w-full p-2 border rounded outline-none font-medium border-gray-200"
                          value={activeQuote.subject}
                          onChange={(e) =>
                            setActiveQuote({
                              ...activeQuote,
                              subject: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          Adres Projektu (jeśli inny niż klienta)
                        </label>
                        <input
                          className="w-full p-2 border rounded outline-none border-gray-200"
                          value={activeQuote.location}
                          onChange={(e) =>
                            setActiveQuote({
                              ...activeQuote,
                              location: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Introduction */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                    {t.intro}
                  </h3>
                  <textarea
                    className="w-full h-24 p-3 border rounded-lg outline-none text-gray-700 resize-none focus:border-blue-500 border-gray-200"
                    value={activeQuote.introText}
                    onChange={(e) =>
                      setActiveQuote({
                        ...activeQuote,
                        introText: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Work Items */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                        {t.workItems}
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={activeQuote.showItemPrices}
                          onChange={(e) =>
                            setActiveQuote((prev) => ({
                              ...prev,
                              showItemPrices: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-gray-700">
                          {t.showPrices}
                        </span>
                      </label>
                    </div>
                    <button
                      onClick={handleAddItem}
                      className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={16} /> {t.addItem}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {activeQuote.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 bg-gray-50 hover:bg-white hover:shadow-md transition-all group relative border-gray-200"
                      >
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="grid grid-cols-12 gap-4">
                          {/* Category */}
                          <div className="col-span-12 md:col-span-4">
                            <label className="text-xs text-gray-500 mb-1 block">
                              {t.category}
                            </label>
                            <input
                              className="w-full p-2 border rounded bg-white font-medium text-gray-800 border-gray-200"
                              value={item.category}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "category",
                                  e.target.value
                                )
                              }
                              placeholder="np. Garagevloer"
                            />
                          </div>

                          {/* Description */}
                          <div className="col-span-12">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs text-gray-500">
                                {t.desc}
                              </label>
                            </div>
                            <textarea
                              className={`w-full h-24 p-3 border rounded bg-white text-gray-700 text-sm ${
                                validationErrors.has(`item-${item.id}-desc`)
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-200"
                              }`}
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Opisz prace..."
                            />
                            {validationErrors.has(`item-${item.id}-desc`) && (
                              <p className="text-red-500 text-xs mt-1">
                                Opis jest wymagany
                              </p>
                            )}

                            {/* OPTIONAL ITEM IMAGE UPLOAD - UPDATED UI */}
                            <div className="mt-3">
                              {item.image ? (
                                <div className="relative inline-block group/img">
                                  <img
                                    src={item.image}
                                    alt="Item attachment"
                                    className="h-24 w-auto rounded-lg border border-gray-300 object-cover shadow-sm"
                                  />
                                  <button
                                    onClick={() =>
                                      handleRemoveItemImage(item.id)
                                    }
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md"
                                    title="Usuń zdjęcie"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 cursor-pointer transition-all bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 w-fit">
                                  <Camera size={18} />
                                  <span className="hidden sm:inline">
                                    Dokumentacja Zdjęciowa (Dodaj zdjęcie)
                                  </span>
                                  <span className="sm:hidden">
                                    Dodaj zdjęcie
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleItemImageUpload(item.id, e)
                                    }
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* Numbers */}
                          <div className="col-span-6 md:col-span-3">
                            <label className="text-xs text-gray-500 mb-1 block">
                              {t.qty}
                            </label>
                            <input
                              type="number"
                              className="w-full p-2 border rounded bg-white border-gray-200"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "quantity",
                                  parseNumber(e.target.value, 1)
                                )
                              }
                            />
                          </div>
                          <div className="col-span-6 md:col-span-3">
                            <label className="text-xs text-gray-500 mb-1 block">
                              {t.unit}
                            </label>
                            <div className="relative">
                              <select
                                className="w-full p-2 border rounded bg-white appearance-none border-gray-200"
                                value={item.unit}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.id,
                                    "unit",
                                    e.target.value
                                  )
                                }
                              >
                                {UNITS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={14}
                                className="absolute right-2 top-3 text-gray-400 pointer-events-none"
                              />
                            </div>
                          </div>
                          <div className="col-span-6 md:col-span-3">
                            <label className="text-xs text-gray-500 mb-1 block">
                              {t.price}
                            </label>
                            <input
                              type="number"
                              className="w-full p-2 border rounded bg-white border-gray-200"
                              value={item.pricePerUnit}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "pricePerUnit",
                                  parseNumber(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="col-span-6 md:col-span-3">
                            <label className="text-xs text-gray-500 mb-1 block">
                              {t.vat}
                            </label>
                            <select
                              className="w-full p-2 border rounded bg-white border-gray-200"
                              value={item.vatRate}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "vatRate",
                                  parseInt(e.target.value)
                                )
                              }
                            >
                              <option value={9}>9%</option>
                              <option value={21}>21%</option>
                              <option value={0}>0%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                      {t.photos}
                    </h3>
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                      <Camera size={16} /> {t.uploadPhoto}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeQuote.images.map((img) => (
                      <PhotoEditor
                        key={img.id}
                        image={img}
                        onUpdate={updateImage}
                        onDelete={() => removeImage(img.id)}
                        labels={t}
                      />
                    ))}
                  </div>
                  {activeQuote.images.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                      Brak zdjęć. Dodaj dokumentację aby uniknąć sporów.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* === TAB: RESOURCES === */}
            {editorTab === "resources" && (
              <div>
                {/* ... (Resource tab content omitted) ... */}
                {/* Financial Analysis Section - EXPANDED */}
                <div className="mb-8 bg-slate-900 rounded-xl text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-700 pb-4 gap-4">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                          <Calculator className="text-blue-400" />{" "}
                          {t.financialAnalysis}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">
                          Kompletna analiza kosztów, marży i ryzyka
                        </p>
                      </div>

                      {/* Health Badge */}
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide border ${
                          financials.profit > 0
                            ? financials.margin > 20
                              ? "bg-green-500/10 border-green-500 text-green-400"
                              : "bg-yellow-500/10 border-yellow-500 text-yellow-400"
                            : "bg-red-500/10 border-red-500 text-red-400"
                        }`}
                      >
                        <span className="flex-shrink-0">
                          {financials.profit > 0 ? (
                            <TrendingUp size={16} />
                          ) : (
                            <TrendingUp size={16} className="rotate-180" />
                          )}
                        </span>
                        <span>
                          {financials.profit > 0
                            ? financials.margin > 20
                              ? "Wysoka Rentowność"
                              : "Średnia Rentowność"
                            : "Strata"}
                        </span>
                      </div>
                    </div>

                    {/* Main KPI Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                      {/* ... (Rest of financial content) ... */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-blue-300 font-bold uppercase text-xs tracking-wider mb-2">
                          <Activity size={14} /> Nakłady Pracy
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-slate-500 mb-1 block">
                                {t.estimatedHours}
                              </label>
                              <input
                                type="number"
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                value={activeQuote.estimatedHours || 0}
                                onChange={(e) =>
                                  setActiveQuote({
                                    ...activeQuote,
                                    estimatedHours: parseNumber(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 mb-1 block">
                                {t.hourlyRate}
                              </label>
                              <input
                                type="number"
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                value={activeQuote.hourlyRate || 0}
                                onChange={(e) =>
                                  setActiveQuote({
                                    ...activeQuote,
                                    hourlyRate: parseNumber(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between text-xs text-slate-400">
                            <span>Koszt Robocizny:</span>
                            <span className="text-white font-bold">
                              € {financials.laborCosts.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-amber-300 font-bold uppercase text-xs tracking-wider mb-2">
                          <ShieldAlert size={14} /> Zarządzanie Ryzykiem
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                          <label className="text-xs text-slate-500 mb-1 flex justify-between">
                            {t.riskBuffer}
                            <span className="text-amber-400">
                              {activeQuote.riskBuffer || 0}%
                            </span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            value={activeQuote.riskBuffer || 0}
                            onChange={(e) =>
                              setActiveQuote({
                                ...activeQuote,
                                riskBuffer: parseInt(e.target.value),
                              })
                            }
                          />
                          <p className="text-[10px] text-slate-500 mt-2">
                            Dodatkowy bufor na nieprzewidziane wydatki
                            (materiał, dojazdy).
                            <br />
                            Koszt ryzyka:{" "}
                            <span className="text-white font-bold">
                              € {financials.riskCost.toFixed(2)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* ... (rest of financial blocks) ... */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-purple-300 font-bold uppercase text-xs tracking-wider mb-2">
                          <PieChart size={14} /> Struktura Kosztów
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-300">
                              {t.projectCosts}
                            </span>
                            <span className="text-white">
                              €{" "}
                              {(
                                financials.materialCosts + financials.toolCosts
                              ).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-300">
                              {t.laborCosts}
                            </span>
                            <span className="text-white">
                              € {financials.laborCosts.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-300">{t.riskCost}</span>
                            <span className="text-amber-400">
                              € {financials.riskCost.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t border-slate-600 pt-2 flex justify-between items-center font-bold">
                            <span className="text-slate-200">
                              Suma Kosztów:
                            </span>
                            <span className="text-white">
                              € {financials.totalTheoreticalCosts.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg border border-slate-700 flex flex-col justify-between">
                        <div>
                          <h4 className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-4">
                            {t.projectRevenue}
                          </h4>
                          <div className="text-3xl font-bold text-white mb-6">
                            € {financials.revenue.toFixed(2)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                              <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                                {t.laborCosts}
                              </h4>
                              <div className="text-lg font-bold text-white">
                                € {financials.laborCosts.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                                {t.totalProfit}
                              </h4>
                              <div
                                className={`text-lg font-bold ${
                                  financials.profit > 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                € {financials.profit.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Additional KPIs */}
                          <div className="grid grid-cols-3 gap-1 mt-4 pt-4 border-t border-slate-700">
                            <div className="text-center px-1">
                              <h4 className="text-slate-400 text-[8px] uppercase font-bold tracking-tight mb-1">
                                Marża
                              </h4>
                              <div
                                className={`text-xs font-bold ${
                                  financials.margin > 20
                                    ? "text-green-400"
                                    : financials.margin > 0
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }`}
                              >
                                {financials.margin.toFixed(0)}%
                              </div>
                            </div>
                            <div className="text-center px-1">
                              <h4 className="text-slate-400 text-[8px] uppercase font-bold tracking-tight mb-1">
                                €/godz
                              </h4>
                              <div className="text-xs font-bold text-cyan-400">
                                {activeQuote.estimatedHours > 0 ? (
                                  `€${financials.effectiveHourlyRate.toFixed(
                                    0
                                  )}`
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </div>
                            </div>
                            <div className="text-center px-1">
                              <h4 className="text-slate-400 text-[8px] uppercase font-bold tracking-tight mb-1">
                                Zarobek
                              </h4>
                              <div
                                className={`text-xs font-bold ${
                                  financials.totalEarnings > 0
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                €{financials.totalEarnings.toFixed(0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 flex justify-between items-center">
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex items-center gap-2">
                    <Wrench size={18} />
                    {t.internalUse} - Te dane pojawią się na osobnej stronie
                    wydruku (Werkbon).
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowResourceTemplateModal(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Folders size={16} /> {t.loadResourceTemplate}
                    </button>
                    <button
                      onClick={() => setShowSaveResourceTemplateModal(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Save size={16} /> {t.saveResourceTemplate}
                    </button>
                  </div>
                </div>

                {/* FILTER BAR */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 w-full relative">
                    <Search
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={18}
                    />
                    <input
                      placeholder="Szukaj po nazwie lub notatkach..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                      <Filter size={18} />
                    </div>
                    <select
                      className="py-2 px-4 border border-gray-200 rounded-lg outline-none bg-white min-w-[120px]"
                      value={resourceVatFilter}
                      onChange={(e) =>
                        setResourceVatFilter(
                          e.target.value === "all"
                            ? "all"
                            : parseInt(e.target.value)
                        )
                      }
                    >
                      <option value="all">Wszystkie VAT</option>
                      <option value="21">21%</option>
                      <option value="9">9%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                </div>

                {/* Materials Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Package size={16} /> {t.materials}
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={activeQuote.showMaterialPrices}
                          onChange={(e) =>
                            setActiveQuote((prev) => ({
                              ...prev,
                              showMaterialPrices: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-gray-700">
                          {t.showPrices}
                        </span>
                      </label>
                    </div>
                    <button
                      onClick={() => handleAddResource("materials")}
                      className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={16} /> {t.addMaterial}
                    </button>
                  </div>

                  {activeQuote.materials.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed text-sm">
                      Brak pozycji. Kliknij "Dodaj", aby uzupełnić listę.
                    </div>
                  ) : (
                    <div>
                      {/* HEADERS */}
                      <div className="grid grid-cols-12 gap-4 items-center mb-2 px-2 text-xs font-bold text-gray-400 uppercase">
                        <div className="col-span-1">Img</div>
                        <div className="col-span-4">
                          <button
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          >
                            Nazwa {renderSortIcon("name")}
                          </button>
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => handleSort("quantity")}
                            className="flex items-center justify-end gap-1 w-full hover:text-blue-600 transition-colors"
                          >
                            Ilość {renderSortIcon("quantity")}
                          </button>
                        </div>
                        <div className="col-span-2">J.m.</div>
                        <div className="col-span-2 text-right">
                          <button
                            onClick={() => handleSort("estimatedCost")}
                            className="flex items-center justify-end gap-1 w-full hover:text-blue-600 transition-colors"
                          >
                            Koszt {renderSortIcon("estimatedCost")}
                          </button>
                        </div>
                        <div className="col-span-1">VAT</div>
                        <div className="col-span-1"></div>
                      </div>

                      <div className="space-y-2">
                        {processResources(activeQuote.materials).map((item) => (
                          <div
                            key={item.id}
                            className="bg-gray-50 p-2 rounded border border-gray-200 hover:bg-white transition-colors"
                          >
                            {/* ... (Row Content Unchanged) ... */}
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-1">
                                <label className="cursor-pointer block w-8 h-8 rounded border border-gray-300 bg-white overflow-hidden relative group hover:border-blue-500 transition-colors">
                                  {item.imageUrl &&
                                  !item.imageUrl.startsWith("blob:") ? (
                                    <img
                                      src={item.imageUrl}
                                      alt="img"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:text-blue-500">
                                      <Plus size={14} />
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleResourceImageUpload(
                                        "materials",
                                        item.id,
                                        e
                                      )
                                    }
                                  />
                                </label>
                              </div>
                              <div className="col-span-4">
                                <input
                                  className="w-full bg-transparent outline-none font-medium text-gray-800 placeholder-gray-400"
                                  placeholder="Nazwa..."
                                  value={item.name}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "materials",
                                      item.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-1">
                                <input
                                  type="number"
                                  className="w-full bg-transparent outline-none text-right font-medium text-gray-800"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "materials",
                                      item.id,
                                      "quantity",
                                      parseNumber(e.target.value, 1)
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-2">
                                <select
                                  className="w-full bg-transparent outline-none text-sm text-gray-600"
                                  value={item.unit}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "materials",
                                      item.id,
                                      "unit",
                                      e.target.value
                                    )
                                  }
                                >
                                  {UNITS.map((u) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="€ 0.00"
                                  className="w-full bg-transparent outline-none text-right font-medium text-gray-600 placeholder-gray-300"
                                  value={item.estimatedCost || ""}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "materials",
                                      item.id,
                                      "estimatedCost",
                                      parseNumber(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-1">
                                <select
                                  className="w-full bg-transparent outline-none text-sm text-gray-600 text-right"
                                  value={item.vatRate ?? 21}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "materials",
                                      item.id,
                                      "vatRate",
                                      parseInt(e.target.value)
                                    )
                                  }
                                >
                                  <option value={9}>9%</option>
                                  <option value={21}>21%</option>
                                  <option value={0}>0%</option>
                                </select>
                              </div>
                              <div className="col-span-1 text-right">
                                <button
                                  onClick={() =>
                                    handleRemoveResource("materials", item.id)
                                  }
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {/* Notes Field - IMPROVED VISIBILITY */}
                            <div className="mt-2 flex items-center gap-2 pl-1 md:pl-10">
                              <div className="text-gray-300">
                                <FileText size={14} />
                              </div>
                              <input
                                className="w-full bg-white text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 focus:border-blue-400 outline-none placeholder-gray-400 transition-colors"
                                placeholder={t.notesPlaceholder}
                                value={item.notes || ""}
                                onChange={(e) =>
                                  handleUpdateResource(
                                    "materials",
                                    item.id,
                                    "notes",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tools Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Wrench size={16} /> {t.tools}
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={activeQuote.showToolPrices}
                          onChange={(e) =>
                            setActiveQuote((prev) => ({
                              ...prev,
                              showToolPrices: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-slate-600 rounded border-gray-300 focus:ring-slate-500"
                        />
                        <span className="text-xs font-bold text-gray-700">
                          {t.showPrices}
                        </span>
                      </label>
                    </div>
                    <button
                      onClick={() => handleAddResource("tools")}
                      className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={16} /> {t.addTool}
                    </button>
                  </div>

                  {activeQuote.tools.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed text-sm">
                      Brak pozycji. Kliknij "Dodaj", aby uzupełnić listę.
                    </div>
                  ) : (
                    <div>
                      {/* HEADERS */}
                      <div className="grid grid-cols-12 gap-4 items-center mb-2 px-2 text-xs font-bold text-gray-400 uppercase">
                        <div className="col-span-1">Img</div>
                        <div className="col-span-4">
                          <button
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          >
                            Nazwa {renderSortIcon("name")}
                          </button>
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => handleSort("quantity")}
                            className="flex items-center justify-end gap-1 w-full hover:text-blue-600 transition-colors"
                          >
                            Ilość {renderSortIcon("quantity")}
                          </button>
                        </div>
                        <div className="col-span-2">J.m.</div>
                        <div className="col-span-2 text-right">
                          <button
                            onClick={() => handleSort("estimatedCost")}
                            className="flex items-center justify-end gap-1 w-full hover:text-blue-600 transition-colors"
                          >
                            Koszt {renderSortIcon("estimatedCost")}
                          </button>
                        </div>
                        <div className="col-span-1">VAT</div>
                        <div className="col-span-1"></div>
                      </div>

                      <div className="space-y-2">
                        {processResources(activeQuote.tools).map((item) => (
                          <div
                            key={item.id}
                            className="bg-gray-50 p-2 rounded border border-gray-200 hover:bg-white transition-colors"
                          >
                            {/* Row Content Unchanged */}
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-1">
                                <label className="cursor-pointer block w-8 h-8 rounded border border-gray-300 bg-white overflow-hidden relative group hover:border-blue-500 transition-colors">
                                  {item.imageUrl &&
                                  !item.imageUrl.startsWith("blob:") ? (
                                    <img
                                      src={item.imageUrl}
                                      alt="img"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:text-blue-500">
                                      <Plus size={14} />
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleResourceImageUpload(
                                        "tools",
                                        item.id,
                                        e
                                      )
                                    }
                                  />
                                </label>
                              </div>
                              <div className="col-span-4">
                                <input
                                  className="w-full bg-transparent outline-none font-medium text-gray-800 placeholder-gray-400"
                                  placeholder="Nazwa..."
                                  value={item.name}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "tools",
                                      item.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-1">
                                <input
                                  type="number"
                                  className="w-full bg-transparent outline-none text-right font-medium text-gray-800"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "tools",
                                      item.id,
                                      "quantity",
                                      parseNumber(e.target.value, 1)
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-2">
                                <select
                                  className="w-full bg-transparent outline-none text-sm text-gray-600"
                                  value={item.unit}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "tools",
                                      item.id,
                                      "unit",
                                      e.target.value
                                    )
                                  }
                                >
                                  {UNITS.map((u) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="€ 0.00"
                                  className="w-full bg-transparent outline-none text-right font-medium text-gray-600 placeholder-gray-300"
                                  value={item.estimatedCost || ""}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "tools",
                                      item.id,
                                      "estimatedCost",
                                      parseNumber(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-1">
                                <select
                                  className="w-full bg-transparent outline-none text-sm text-gray-600 text-right"
                                  value={item.vatRate ?? 21}
                                  onChange={(e) =>
                                    handleUpdateResource(
                                      "tools",
                                      item.id,
                                      "vatRate",
                                      parseInt(e.target.value)
                                    )
                                  }
                                >
                                  <option value={9}>9%</option>
                                  <option value={21}>21%</option>
                                  <option value={0}>0%</option>
                                </select>
                              </div>
                              <div className="col-span-1 text-right">
                                <button
                                  onClick={() =>
                                    handleRemoveResource("tools", item.id)
                                  }
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {/* Notes Field - IMPROVED VISIBILITY */}
                            <div className="mt-2 flex items-center gap-2 pl-1 md:pl-10">
                              <div className="text-gray-300">
                                <FileText size={14} />
                              </div>
                              <input
                                className="w-full bg-white text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 focus:border-blue-400 outline-none placeholder-gray-400 transition-colors"
                                placeholder={t.notesPlaceholder}
                                value={item.notes || ""}
                                onChange={(e) =>
                                  handleUpdateResource(
                                    "tools",
                                    item.id,
                                    "notes",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* INTERNAL NOTES GLOBAL SECTION */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                    {t.internalNotes}
                  </h3>
                  <textarea
                    className="w-full h-32 p-3 border rounded-lg outline-none text-gray-700 resize-none focus:border-blue-500 border-gray-200"
                    value={activeQuote.notes}
                    onChange={(e) =>
                      setActiveQuote({ ...activeQuote, notes: e.target.value })
                    }
                    placeholder="Instrukcje dla ekipy, kody do domofonu, specyficzne wymagania..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview View - NAPRAWIONE: Jeden skonsolidowany panel */}
      {view === "preview" && (
        <div className="md:pl-64 pt-16 md:pt-0 min-h-screen bg-gray-100">
          {/* Unified Top Action Bar */}
          <div className="bg-white border-b sticky top-16 md:top-0 z-20 px-4 md:px-8 py-3 shadow-sm">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              {/* Left side - Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("editor")}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="hidden sm:inline font-medium">
                    {currentLang === Language.PL
                      ? "Wróć do edytora"
                      : "Terug naar editor"}
                  </span>
                </button>
                <div className="hidden md:block h-6 w-px bg-gray-300" />
                <h2 className="text-lg font-bold text-gray-800">
                  {currentLang === Language.PL
                    ? "Podgląd oferty"
                    : "Offerte preview"}
                </h2>
              </div>

              {/* Right side - Action Buttons */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Edit Button */}
                <button
                  onClick={() => setView("editor")}
                  className="px-3 md:px-4 py-2 text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                  <FileText size={18} />
                  <span className="hidden sm:inline">{t.edit}</span>
                </button>

                {/* Style Editor Button */}
                <button
                  onClick={() => setShowStyleEditor(true)}
                  className="px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                  <Palette size={18} />
                  <span className="hidden sm:inline">
                    {currentLang === Language.PL
                      ? "Edytuj Styl"
                      : "Stijl bewerken"}
                  </span>
                </button>

                {/* Print Button */}
                <button
                  onClick={handlePrint}
                  className="px-3 md:px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                  <Printer size={18} />
                  <span className="hidden sm:inline">
                    {currentLang === Language.PL ? "Wydrukuj" : "Afdrukken"}
                  </span>
                </button>

                {/* Download PDF Button */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={isGeneratingPDF ? "hidden" : ""}>
                    <Download size={18} />
                  </span>
                  <span className={isGeneratingPDF ? "" : "hidden"}>
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  </span>
                  <span className="hidden sm:inline">
                    {currentLang === Language.PL
                      ? "Pobierz PDF"
                      : "Download PDF"}
                  </span>
                </button>

                {/* Save as Template Button */}
                <button
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="px-3 md:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                  <Save size={18} />
                  <span className="hidden sm:inline">
                    {currentLang === Language.PL
                      ? "Zapisz szablon"
                      : "Opslaan als sjabloon"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div
              id="pdf-preview-container"
              className="bg-white shadow-2xl rounded-lg overflow-hidden"
            >
              <QuotePreview
                quote={activeQuote}
                companyProfile={companyProfile}
                style={quoteStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* Status Online/Offline Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg ${
            isOnline
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-orange-100 text-orange-700 border border-orange-200"
          }`}
        >
          <span className={isOnline ? "" : "hidden"}>
            <Cloud size={14} />
          </span>
          <span className={isOnline ? "hidden" : ""}>
            <CloudOff size={14} />
          </span>
          <span>{isOnline ? "Online" : "Offline"}</span>
          <span className={isLoadingData ? "ml-1" : "hidden"}>
            <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          </span>
        </div>
      </div>

      {/* Migration Prompt Modal */}
      {showMigrationPrompt && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Migracja danych
                </h3>
                <p className="text-sm text-gray-500">
                  Przenieś lokalne dane do chmury
                </p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Znaleziono lokalne szablony lub klientów zapisanych w
              przeglądarce. Czy chcesz je przenieść do bazy danych, żeby były
              dostępne na wszystkich urządzeniach?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowMigrationPrompt(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Później
              </button>
              <button
                onClick={handleMigration}
                disabled={isSyncing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className={isSyncing ? "" : "hidden"}>
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                </span>
                <span className={isSyncing ? "hidden" : ""}>
                  <Cloud size={16} />
                </span>
                <span>{isSyncing ? "Migruję..." : "Migruj teraz"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Style Editor Panel */}
      <StyleEditor
        style={quoteStyle}
        onStyleChange={setQuoteStyle}
        currentLang={currentLang}
        isOpen={showStyleEditor}
        onClose={() => setShowStyleEditor(false)}
      />
    </div>
  );
}
