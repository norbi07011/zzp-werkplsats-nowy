import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useSupabaseInvoiceDesigns } from "../hooks";
import { supabase } from "@/lib/supabase";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Ban,
  Box,
  BoxSelect,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  CheckCircle,
  CheckSquare,
  ClipboardList,
  Clock,
  Coins,
  Columns,
  FileCheck,
  FileSignature,
  FileText,
  Folder,
  Grid,
  GripVertical,
  Hammer,
  Hash,
  Heading,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  Layout,
  LayoutGrid,
  LayoutTemplate,
  ListOrdered,
  Minus,
  Paintbrush,
  Palette,
  PanelLeft,
  PanelLeftClose,
  PenTool,
  Pilcrow,
  Plus,
  QrCode,
  Quote,
  Redo2,
  Ruler,
  Save,
  Settings2,
  Sparkles,
  Stamp,
  Table as TableIcon,
  Trash2,
  Undo2,
  UserCircle,
  Wrench,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type {
  InvoiceDesign,
  DocBlock,
  CVEntry,
  CVSkill,
  ContractArticle,
  GalleryImage,
  BlockType,
} from "../types/InvoiceDesign";
import {
  GRADIENT_STYLES,
  getGradientCategories,
  getGradientsByCategory,
  type GradientStyle,
} from "../lib/gradient-styles";

// ============================================
// VIEW MODES & TABS
// ============================================

type ViewMode = "LIBRARY" | "TEMPLATE_SELECTOR" | "BUILDER";
type BuilderTab = "INSERT" | "CONTENT" | "DESIGN" | "LAYOUT" | "SETTINGS";

// Template Category Info (used in Template Selector and Library)
// =====================================================
// SZABLONY FAKTUR I WERKBONÓW
// =====================================================
const TEMPLATE_INFO: Record<
  string,
  { icon: React.ReactNode; label: string; description: string }
> = {
  // FAKTURY
  work_hours: {
    icon: <Clock size={24} />,
    label: "⏱️ Godzinówka / Praca",
    description: "Faktura za pracę z rozliczeniem godzin i stawek",
  },
  product_gallery: {
    icon: <ImageIcon size={24} />,
    label: "📸 Produkty ze zdjęciami",
    description: "Faktura produktowa z galerią zdjęć, cenami i opisami",
  },
  // WERKBON
  werkbon: {
    icon: <FileText size={24} />,
    label: "📋 Werkbon / Karta Godzin",
    description: "Uniwersalny werkbon do rejestracji czasu pracy",
  },
};

// Category Groups for organizing templates in Library view
const TEMPLATE_CATEGORY_GROUPS: {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  categories: string[];
}[] = [
  {
    id: "invoices",
    label: "📄 Faktury",
    icon: <FileText size={20} />,
    description: "Szablony faktur do rozliczeń za pracę i produkty",
    color: "from-blue-500 to-indigo-600",
    categories: ["work_hours", "product_gallery"],
  },
  {
    id: "timesheets",
    label: "⏱️ Karty Godzin",
    icon: <Clock size={20} />,
    description: "Werkbon do rejestracji czasu pracy",
    color: "from-orange-500 to-amber-600",
    categories: ["werkbon"],
  },
];

// Extended Design Interface
interface ExtendedDesign extends Omit<InvoiceDesign, "id" | "name"> {
  paper_texture:
    | "plain"
    | "dots"
    | "lines"
    | "grain"
    | "holographic"
    | "gradient_tri"
    | "gradient_geo"
    | "gradient_soft";
  global_margin: number;
  border_radius: number;
  line_height: number;
  show_page_numbers: boolean;
  blocks: DocBlock[]; // New: Store blocks in the design
}

const DEFAULT_DESIGN: ExtendedDesign = {
  user_id: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  type: "INVOICE",
  primary_color: "#0ea5e9",
  secondary_color: "#f1f5f9",
  text_color: "#1e293b",
  background_color: "#ffffff",
  font_family: "Inter",
  header_align: "left",
  logo_size: 80,
  font_size_scale: 1,
  show_qr_code: true,
  show_product_frames: false,
  holographic_logo: false,
  show_signature_line: false,
  show_watermark: false,
  paper_texture: "plain",
  global_margin: 15,
  border_radius: 0,
  line_height: 1.5,
  show_page_numbers: false,
  blocks: [], // Start empty

  // Template System Properties
  is_template: false,
  template_category: undefined,
  is_locked: false,
  base_template_id: undefined,

  labels: {
    title: "DOKUMENT",
    invoiceNo: "Nr",
    from: "Nadawca",
    to: "Odbiorca",
    total: "SUMA",
    date: "Data",
    dueDate: "Termin",
  },
  cv_data: {
    phone: "",
    email: "",
    address: "",
    bio: "",
    experience: [],
    education: [],
    skills: [],
    languages: [],
  },
  offer_data: {
    introTitle: "Oferta",
    introText: "Treść...",
    gallery: [],
    scope: [],
  },
  contract_data: { partyA: "", partyB: "", articles: [] },
  letter_data: {
    recipientName: "",
    recipientAddress: "",
    subject: "",
    body: "",
  },
};

export const Documents: React.FC = () => {
  // SUPABASE INTEGRATION: Load designs from database
  const { user } = useAuth();
  const {
    designs: invoiceDesigns,
    loading: designsLoading,
    error: designsError,
    createDesign,
    updateDesign,
    deleteDesign: deleteDesignAsync,
  } = useSupabaseInvoiceDesigns(user?.id || "");

  // Track if we're editing an existing design or creating new
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);

  const saveInvoiceDesign = async (design: Omit<any, "id">) => {
    try {
      if (editingDesignId) {
        // UPDATE existing design
        console.log(
          "[saveInvoiceDesign] Updating existing design:",
          editingDesignId
        );
        await updateDesign(editingDesignId, design as any);
      } else {
        // CREATE new design
        console.log("[saveInvoiceDesign] Creating new design:", design.name);
        await createDesign(design as any);
      }
      setEditingDesignId(null); // Reset after save
    } catch (err) {
      console.error("Failed to save design:", err);
    }
  };

  const deleteInvoiceDesign = async (id: string) => {
    try {
      await deleteDesignAsync(id);
    } catch (err) {
      console.error("Failed to delete design:", err);
    }
  };

  const [viewMode, setViewMode] = useState<ViewMode>("LIBRARY");
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState<
    "INVOICE" | "TIMESHEET" | null
  >(null);
  const [predefinedTemplates, setPredefinedTemplates] = useState<
    InvoiceDesign[]
  >([]);

  // Builder State
  const [designName, setDesignName] = useState("Nowy Projekt");
  const [currentDesign, setCurrentDesign] =
    useState<ExtendedDesign>(DEFAULT_DESIGN);
  const [activeTab, setActiveTab] = useState<BuilderTab>("INSERT");
  const [zoomLevel, setZoomLevel] = useState(0.65);

  // Canvas Tools State
  const [showGrid, setShowGrid] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH PREDEFINED TEMPLATES ---
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from("invoice_designs")
        .select("*")
        .eq("is_template", true)
        .order("template_category", { ascending: true });

      if (!error && data) {
        // Map database schema to InvoiceDesign type - use actual values from DB
        const templates = data.map((t) => ({
          id: t.id,
          user_id: t.user_id,
          name: t.name, // Correct column name
          type: t.type || "INVOICE",
          primary_color: t.primary_color || "#0ea5e9",
          secondary_color: t.secondary_color || "#f1f5f9",
          text_color: t.text_color || "#1e293b",
          background_color: t.background_color || "#ffffff",
          font_family: t.font_family || "Inter",
          font_size_scale: t.font_size_scale || 1.0,
          line_height: t.line_height || 1.5,
          header_align: t.header_align || "left",
          global_margin: t.global_margin || 15,
          border_radius: t.border_radius || 0,
          paper_texture: t.paper_texture || "plain",
          logo_size: t.logo_size || 80,
          holographic_logo: t.holographic_logo ?? false,
          show_qr_code: t.show_qr_code ?? true,
          show_product_frames: t.show_product_frames ?? false,
          show_signature_line: t.show_signature_line ?? false,
          show_watermark: t.show_watermark ?? false,
          show_page_numbers: t.show_page_numbers ?? false,
          blocks: (t.blocks as any) || [],
          labels: t.labels || {
            title: "DOKUMENT",
            invoiceNo: "Nr",
            from: "Od",
            to: "Do",
            total: "Razem",
            date: "Data",
            dueDate: "Termin",
          },
          is_template: t.is_template ?? false,
          template_category: t.template_category ?? undefined,
          is_locked: t.is_locked ?? false,
          base_template_id: t.base_template_id ?? undefined,
          created_at: t.created_at ?? new Date().toISOString(),
          updated_at: t.updated_at ?? new Date().toISOString(),
        }));
        setPredefinedTemplates(templates as InvoiceDesign[]);
      } else if (error) {
        console.error(
          "❌ [TEMPLATES] Failed to fetch predefined templates:",
          error
        );
      }
    };

    fetchTemplates();
  }, []); // No dependencies - templates are global

  // --- BLOCK LOGIC ---

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addBlock = (type: BlockType) => {
    let initialContent: any = {};

    switch (type) {
      case "heading_h1":
        initialContent = { text: "Nagłówek Główny" };
        break;
      case "heading_h2":
        initialContent = { text: "Nagłówek Sekcji" };
        break;
      case "heading_h3":
        initialContent = { text: "Podtytuł" };
        break;
      case "paragraph":
        initialContent = {
          text: "Kliknij tutaj, aby edytować ten tekst. Możesz wpisać dowolną treść, opis oferty lub warunki umowy.",
        };
        break;
      case "list":
        initialContent = {
          items: ["Punkt pierwszy", "Punkt drugi", "Punkt trzeci"],
        };
        break;
      case "quote":
        initialContent = { text: "Ważny cytat lub wyróżnienie.", author: "" };
        break;
      case "divider":
        initialContent = {};
        break;
      case "spacer":
        initialContent = { height: 32 };
        break;
      case "columns_2":
        initialContent = {
          leftText: "Tekst kolumna lewa",
          rightText: "Tekst kolumna prawa",
        };
        break;
      case "image":
        initialContent = { url: null, caption: "Podpis zdjęcia" };
        break;
      case "qr":
        initialContent = {
          value: "https://example.com",
          label: "Zeskanuj mnie",
        };
        break;
      case "gallery":
        initialContent = { images: [null, null, null] };
        break;
      case "table_simple":
        initialContent = {
          headers: ["Nazwa", "Opis", "Wartość"],
          rows: [
            ["A", "Desc A", "100"],
            ["B", "Desc B", "200"],
          ],
        };
        break;
      case "price_list":
        initialContent = {
          items: [
            { name: "Usługa Premium", price: "100.00" },
            { name: "Konsultacja", price: "50.00" },
          ],
        };
        break;
      case "signature":
        initialContent = { label: "Podpis osoby upoważnionej" };
        break;
      case "date":
        initialContent = {
          label: "Data i Miejsce",
          value: new Date().toLocaleDateString(),
        };
        break;
      case "page_number":
        initialContent = { current: 1, total: 1 };
        break;
      // Werkbon blocks
      case "checklist":
        initialContent = {
          items: [
            { text: "Zadanie 1", checked: false },
            { text: "Zadanie 2", checked: false },
            { text: "Zadanie 3", checked: false },
          ],
        };
        break;
      case "materials_table":
        initialContent = {
          headers: ["Ilość", "Jedn.", "Nazwa Materiału"],
          rows: [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""],
          ],
        };
        break;
      case "info_grid":
        initialContent = {
          fields: [
            { label: "Zleceniodawca", value: "" },
            { label: "Adres", value: "" },
            { label: "Data", value: "" },
            { label: "Nr Zlecenia", value: "" },
          ],
        };
        break;
      case "input_box":
        initialContent = { label: "Uwagi", text: "", height: 100 };
        break;
    }

    const newBlock: DocBlock = {
      id: generateId(),
      type,
      content: initialContent,
    };

    setCurrentDesign((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  };

  const updateBlock = (id: string, newContent: any) => {
    setCurrentDesign((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === id ? { ...b, content: { ...b.content, ...newContent } } : b
      ),
    }));
  };

  const removeBlock = (id: string) => {
    setCurrentDesign((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newBlocks = [...currentDesign.blocks];
    if (index + direction < 0 || index + direction >= newBlocks.length) return;

    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;

    setCurrentDesign((prev) => ({ ...prev, blocks: newBlocks }));
  };

  // --- Handlers ---

  const handleCreateNew = (type: InvoiceDesign["type"]) => {
    // For INVOICE and TIMESHEET types, show template selector first
    if (type === "INVOICE" || type === "TIMESHEET") {
      setSelectedTemplateType(type);
      setIsTypeModalOpen(false);
      setViewMode("TEMPLATE_SELECTOR");
      return;
    }

    // For other types, create from scratch as before
    const newDesign = JSON.parse(JSON.stringify(DEFAULT_DESIGN));
    newDesign.type = type;

    // Pre-fill blocks based on type for better UX
    if (type === "CONTRACT") {
      newDesign.blocks = [
        {
          id: generateId(),
          type: "heading_h1",
          content: { text: "UMOWA WSPÓŁPRACY" },
        },
        {
          id: generateId(),
          type: "paragraph",
          content: { text: "Zawarta w dniu ................. pomiędzy:" },
        },
        {
          id: generateId(),
          type: "columns_2",
          content: {
            leftText: "Zleceniodawcą: ...",
            rightText: "Zleceniobiorcą: ...",
          },
        },
        { id: generateId(), type: "spacer", content: { height: 32 } },
        {
          id: generateId(),
          type: "heading_h2",
          content: { text: "§1 Przedmiot Umowy" },
        },
        {
          id: generateId(),
          type: "paragraph",
          content: {
            text: "Przedmiotem umowy jest wykonanie następujących prac...",
          },
        },
      ];
    } else if (type === "OFFER") {
      newDesign.blocks = [
        {
          id: generateId(),
          type: "heading_h1",
          content: { text: "OFERTA HANDLOWA" },
        },
        {
          id: generateId(),
          type: "paragraph",
          content: {
            text: "Dziękujemy za zainteresowanie naszymi usługami. Poniżej przedstawiamy szczegóły oferty.",
          },
        },
        {
          id: generateId(),
          type: "gallery",
          content: { images: [null, null, null] },
        },
        {
          id: generateId(),
          type: "price_list",
          content: { items: [{ name: "Usługa 1", price: "1000" }] },
        },
      ];
    }

    // No need to check for TIMESHEET here - already handled above with early return
    // Type is now narrowed to: "OFFER" | "CONTRACT" | "CV" | "LETTER"

    setCurrentDesign(newDesign);
    let typeName = "Nowy Dokument";
    if (type === "OFFER") {
      typeName = "Nowa Oferta";
    } else if (type === "CONTRACT") {
      typeName = "Nowa Umowa";
    } else if (type === "CV") {
      typeName = "Nowe CV";
    } else if (type === "LETTER") {
      typeName = "Nowy List";
    }
    setDesignName(typeName);
    setEditingDesignId(null); // New document - not editing existing
    setIsTypeModalOpen(false);
    setViewMode("BUILDER");
    setActiveTab("INSERT");
  };

  const handleSelectTemplate = (template: InvoiceDesign) => {
    // Clone template for user customization (blocks are locked but colors/fonts can be changed)
    // ExtendedDesign omits 'id' and 'name' so we manually extract needed fields
    const clonedDesign: ExtendedDesign = {
      user_id: user?.id || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: template.type,
      primary_color: template.primary_color,
      secondary_color: template.secondary_color,
      text_color: template.text_color,
      background_color: template.background_color,
      font_family: template.font_family,
      font_size_scale: template.font_size_scale,
      line_height: template.line_height || 1.5,
      header_align: template.header_align,
      global_margin: template.global_margin || 15,
      border_radius: template.border_radius || 0,
      paper_texture: template.paper_texture || "plain",
      logo_url: template.logo_url,
      logo_size: template.logo_size,
      holographic_logo: template.holographic_logo,
      show_qr_code: template.show_qr_code,
      show_product_frames: template.show_product_frames,
      show_signature_line: template.show_signature_line,
      show_watermark: template.show_watermark,
      show_page_numbers: template.show_page_numbers || false,
      watermark_url: template.watermark_url,
      blocks: template.blocks || [],
      labels: template.labels,
      cv_profile_photo: template.cv_profile_photo,
      cv_data: template.cv_data,
      offer_data: template.offer_data,
      contract_data: template.contract_data,
      letter_data: template.letter_data,
      // Template System Properties
      is_template: false, // User's copy is NOT a template
      is_locked: true, // Keep locked (can't add/remove blocks)
      base_template_id: template.id, // Reference original template
      template_category: template.template_category,
    };

    setCurrentDesign(clonedDesign);
    setDesignName(`Moja ${template.name}`);
    setEditingDesignId(null); // NEW design based on template
    setViewMode("BUILDER");
    setActiveTab("DESIGN"); // Start in DESIGN tab for customization
  };

  const handleSaveDesign = async () => {
    await saveInvoiceDesign({ name: designName, ...currentDesign });
    setViewMode("LIBRARY");
  };

  const handleUpload = (
    ref: React.RefObject<HTMLInputElement | null>,
    field: keyof ExtendedDesign
  ) => {
    const file = ref.current?.files?.[0];
    if (file) {
      // Convert to base64 for persistent storage (blob URLs are temporary)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setCurrentDesign((prev) => ({ ...prev, [field]: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Render Helpers ---

  const renderSidebar = () => (
    <div className="w-20 bg-[#0f172a] flex flex-col items-center py-6 gap-4 z-20 shadow-2xl shrink-0 h-full border-r border-white/5">
      <div className="w-10 h-10 bg-gradient-to-br from-ocean-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-black mb-4 shadow-lg shadow-ocean-500/40 cursor-pointer hover:scale-105 transition-transform">
        Z
      </div>

      {[
        { id: "INSERT", icon: Plus, label: "Wstaw" },
        { id: "CONTENT", icon: Layers, label: "Treść" },
        { id: "DESIGN", icon: Palette, label: "Design" },
        { id: "LAYOUT", icon: LayoutTemplate, label: "Układ" },
        { id: "SETTINGS", icon: Settings2, label: "Opcje" },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id as BuilderTab);
            setIsDrawerOpen(true);
          }}
          className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all w-16 ${
            activeTab === tab.id && isDrawerOpen
              ? "bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <tab.icon
            size={22}
            className={`transition-colors ${
              activeTab === tab.id && isDrawerOpen ? "text-ocean-400" : ""
            }`}
          />
          <span className="text-[9px] font-bold uppercase tracking-wide">
            {tab.label}
          </span>
          {activeTab === tab.id && isDrawerOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-1 h-8 bg-ocean-500 rounded-r-full"></div>
          )}
        </button>
      ))}

      <div className="mt-auto flex flex-col gap-4">
        <button
          className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          title="Pomoc"
        >
          <Layout size={20} />
        </button>
      </div>
    </div>
  );

  const renderDrawer = () => (
    <div
      className={`bg-white border-r border-slate-200 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 transition-all duration-300 ease-in-out relative ${
        isDrawerOpen ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden"
      }`}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-20 backdrop-blur-sm">
        <h3
          key={activeTab}
          className="font-black text-slate-800 uppercase tracking-wide text-sm flex items-center gap-2"
        >
          {activeTab === "INSERT" && !currentDesign.is_locked ? (
            <>
              <Plus size={16} className="text-ocean-500" /> Biblioteka Elementów
            </>
          ) : activeTab === "INSERT" && currentDesign.is_locked ? (
            <>
              <Ban size={16} className="text-orange-500" /> Szablon Zablokowany
            </>
          ) : activeTab === "CONTENT" ? (
            <>
              <Layers size={16} className="text-ocean-500" /> Zarządzanie
              Treścią
            </>
          ) : null}
          {activeTab === "DESIGN" && (
            <>
              <Palette size={16} className="text-ocean-500" /> Stylizacja
            </>
          )}
          {activeTab === "LAYOUT" && (
            <>
              <LayoutTemplate size={16} className="text-ocean-500" /> Układ
              Strony
            </>
          )}
          {activeTab === "SETTINGS" && (
            <>
              <Settings2 size={16} className="text-ocean-500" /> Konfiguracja
            </>
          )}
        </h3>
        <button
          onClick={() => setIsDrawerOpen(false)}
          className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8">
        {/* === INSERT TAB (LOCKED WARNING FOR TEMPLATES) === */}
        {activeTab === "INSERT" && currentDesign.is_locked && (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
              <Ban size={48} className="mx-auto text-orange-500 mb-3" />
              <h4 className="text-lg font-bold text-orange-900 mb-2">
                Szablon Zablokowany
              </h4>
              <p className="text-sm text-orange-700 mb-4">
                Ten szablon ma zablokowany układ. Nie możesz dodawać ani usuwać
                bloków.
              </p>
              <div className="bg-white rounded-lg p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle size={16} />
                  <span>Możesz zmieniać kolory w zakładce DESIGN</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle size={16} />
                  <span>Możesz zmieniać czcionki i logo</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle size={16} />
                  <span>Możesz edytować treść bloków</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === INSERT TAB (ACTIVE BUTTONS FOR UNLOCKED) === */}
        {activeTab === "INSERT" && !currentDesign.is_locked && (
          <div className="space-y-6">
            {/* Typography Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
                Typografia
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => addBlock("heading_h1")}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-ocean-400 hover:shadow-md transition-all group"
                >
                  <Heading
                    size={20}
                    className="text-slate-400 group-hover:text-ocean-600"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-700 block">
                      Nagłówek H1
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tytuł główny
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => addBlock("heading_h2")}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-ocean-400 hover:shadow-md transition-all group"
                >
                  <Heading
                    size={18}
                    className="text-slate-400 group-hover:text-ocean-600"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-700 block">
                      Nagłówek H2
                    </span>
                    <span className="text-[10px] text-slate-400">Podtytuł</span>
                  </div>
                </button>
                <button
                  onClick={() => addBlock("paragraph")}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-ocean-400 hover:shadow-md transition-all group"
                >
                  <Pilcrow
                    size={20}
                    className="text-slate-400 group-hover:text-ocean-600"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-700 block">
                      Paragraf
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tekst ciągły
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => addBlock("list")}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-ocean-400 hover:shadow-md transition-all group"
                >
                  <ListOrdered
                    size={20}
                    className="text-slate-400 group-hover:text-ocean-600"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-700 block">
                      Lista
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Punktowana
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => addBlock("quote")}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-ocean-400 hover:shadow-md transition-all group col-span-2"
                >
                  <Quote
                    size={20}
                    className="text-slate-400 group-hover:text-ocean-600"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-700 block">
                      Cytat / Wyróżnienie
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Blok cytatu
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Layout Structure */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
                Układ & Struktura
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addBlock("columns_2")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-ocean-300 transition-all group"
                  title="Dwie kolumny"
                >
                  <Columns
                    size={18}
                    className="text-slate-400 group-hover:text-ocean-500"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    2 Kol.
                  </span>
                </button>
                <button
                  onClick={() => addBlock("spacer")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-ocean-300 transition-all group"
                  title="Odstęp"
                >
                  <GripVertical
                    size={18}
                    className="text-slate-400 group-hover:text-ocean-500"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Spacer
                  </span>
                </button>
                <button
                  onClick={() => addBlock("divider")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-ocean-300 transition-all group"
                  title="Linia podziału"
                >
                  <Minus
                    size={18}
                    className="text-slate-400 group-hover:text-ocean-500"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Linia
                  </span>
                </button>
              </div>
            </div>

            {/* Media & Visuals */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
                Media & Obiekty
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => addBlock("image")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-ocean-50 hover:border-ocean-200 transition-colors group"
                >
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white text-slate-500 group-hover:text-ocean-600">
                    <ImagePlus size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    Zdjęcie / Obraz
                  </span>
                </button>
                <button
                  onClick={() => addBlock("qr")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-ocean-50 hover:border-ocean-200 transition-colors group"
                >
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white text-slate-500 group-hover:text-ocean-600">
                    <QrCode size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    Kod QR
                  </span>
                </button>
                <button
                  onClick={() => addBlock("gallery")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-ocean-50 hover:border-ocean-200 transition-colors group"
                >
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white text-slate-500 group-hover:text-ocean-600">
                    <LayoutGrid size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    Galeria (3 zdjęcia)
                  </span>
                </button>
              </div>
            </div>

            {/* Tables & Data */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
                Dane & Tabele
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => addBlock("table_simple")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <TableIcon
                      size={18}
                      className="text-slate-400 group-hover:text-indigo-600"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      Tabela Prosta
                    </span>
                  </div>
                  <Plus
                    size={16}
                    className="text-slate-300 group-hover:text-indigo-500"
                  />
                </button>
                <button
                  onClick={() => addBlock("price_list")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Coins
                      size={18}
                      className="text-slate-400 group-hover:text-indigo-600"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      Cennik (Price List)
                    </span>
                  </div>
                  <Plus
                    size={16}
                    className="text-slate-300 group-hover:text-indigo-500"
                  />
                </button>
              </div>
            </div>

            {/* Special Blocks */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">
                Specjalne
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => addBlock("signature")}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-ocean-600 hover:border-ocean-300 flex items-center gap-1 transition-all"
                >
                  <FileSignature size={12} /> Podpis
                </button>
                <button
                  onClick={() => addBlock("date")}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-ocean-600 hover:border-ocean-300 flex items-center gap-1 transition-all"
                >
                  <Calendar size={12} /> Data
                </button>
                <button
                  onClick={() => addBlock("page_number")}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-ocean-600 hover:border-ocean-300 flex items-center gap-1 transition-all"
                >
                  <Hash size={12} /> Nr Strony
                </button>
              </div>
            </div>

            {/* Werkbon Blocks (TIMESHEET specific) */}
            {currentDesign.type === "TIMESHEET" && (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <h4 className="text-xs font-bold text-orange-700 uppercase mb-3 tracking-wider flex items-center gap-2">
                  <Hammer size={14} /> Werkbon
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => addBlock("checklist")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all group"
                  >
                    <CheckSquare size={18} className="text-orange-500" />
                    <div className="text-left flex-1">
                      <span className="text-sm font-bold text-slate-700 block">
                        Checklista
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Zakres prac
                      </span>
                    </div>
                    <Plus
                      size={16}
                      className="text-orange-300 group-hover:text-orange-500"
                    />
                  </button>
                  <button
                    onClick={() => addBlock("materials_table")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all group"
                  >
                    <ClipboardList size={18} className="text-orange-500" />
                    <div className="text-left flex-1">
                      <span className="text-sm font-bold text-slate-700 block">
                        Tabela Materiałów
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Zużyte materiały
                      </span>
                    </div>
                    <Plus
                      size={16}
                      className="text-orange-300 group-hover:text-orange-500"
                    />
                  </button>
                  <button
                    onClick={() => addBlock("info_grid")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all group"
                  >
                    <BoxSelect size={18} className="text-orange-500" />
                    <div className="text-left flex-1">
                      <span className="text-sm font-bold text-slate-700 block">
                        Siatka Info
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Zleceniodawca, adres, data
                      </span>
                    </div>
                    <Plus
                      size={16}
                      className="text-orange-300 group-hover:text-orange-500"
                    />
                  </button>
                  <button
                    onClick={() => addBlock("input_box")}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all group"
                  >
                    <Box size={18} className="text-orange-500" />
                    <div className="text-left flex-1">
                      <span className="text-sm font-bold text-slate-700 block">
                        Pole Tekstowe
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Uwagi / Notatki
                      </span>
                    </div>
                    <Plus
                      size={16}
                      className="text-orange-300 group-hover:text-orange-500"
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === CONTENT TAB === */}
        {activeTab === "CONTENT" && (
          <>
            {currentDesign.is_locked && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Layers size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">
                      Tryb Edycji Treści
                    </h4>
                    <p className="text-xs text-blue-700">
                      Możesz edytować treść istniejących bloków i zmieniać ich
                      kolejność, ale nie możesz dodawać ani usuwać elementów.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <FileText size={14} /> Dane Główne
                </h4>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Tytuł Dokumentu
                </label>
                <div className="relative">
                  <input
                    value={currentDesign.labels.title}
                    onChange={(e) =>
                      setCurrentDesign((p) => ({
                        ...p,
                        labels: { ...p.labels, title: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-ocean-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CV Specific Inputs */}
            {currentDesign.type === "CV" && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <UserCircle size={14} /> Profil Kandydata
                </h4>

                <div
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:border-ocean-400 transition-colors">
                    {currentDesign.cv_profile_photo ? (
                      <img
                        src={currentDesign.cv_profile_photo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Zdjęcie Profilowe
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Kliknij aby zmienić
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={profilePhotoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                      handleUpload(profilePhotoInputRef, "cv_profile_photo")
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <input
                    placeholder="Email"
                    value={currentDesign.cv_data?.email}
                    onChange={(e) =>
                      setCurrentDesign((p) => ({
                        ...p,
                        cv_data: { ...p.cv_data!, email: e.target.value },
                      }))
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                  />
                  <input
                    placeholder="Telefon"
                    value={currentDesign.cv_data?.phone}
                    onChange={(e) =>
                      setCurrentDesign((p) => ({
                        ...p,
                        cv_data: { ...p.cv_data!, phone: e.target.value },
                      }))
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                  />
                  <input
                    placeholder="Adres"
                    value={currentDesign.cv_data?.address}
                    onChange={(e) =>
                      setCurrentDesign((p) => ({
                        ...p,
                        cv_data: { ...p.cv_data!, address: e.target.value },
                      }))
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                  />
                </div>
              </div>
            )}

            {/* Layer/Block Manager */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <Layers size={14} /> Warstwy (Bloki)
              </h4>

              {currentDesign.blocks.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-4">
                  Brak bloków. Dodaj elementy z zakładki Wstaw.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentDesign.blocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm group hover:border-ocean-300"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                          {block.type.includes("heading") && (
                            <Heading size={12} />
                          )}
                          {block.type === "paragraph" && <Pilcrow size={12} />}
                          {block.type === "image" && <ImageIcon size={12} />}
                          {!block.type.includes("heading") &&
                            block.type !== "paragraph" &&
                            block.type !== "image" && <Box size={12} />}
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[100px] capitalize">
                          {block.type.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveBlock(index, -1)}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => moveBlock(index, 1)}
                          disabled={index === currentDesign.blocks.length - 1}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={() => removeBlock(block.id)}
                          disabled={currentDesign.is_locked}
                          className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 ml-1 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            currentDesign.is_locked
                              ? "Szablon zablokowany"
                              : "Usuń blok"
                          }
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* === DESIGN TAB === */}
        {activeTab === "DESIGN" && (
          <div className="space-y-6">
            {/* Gradient Style Selector */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Sparkles size={12} />
                Styl Gradientu
              </label>
              <div className="space-y-3">
                {/* Category tabs */}
                <div className="flex flex-wrap gap-1">
                  {getGradientCategories().map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        // Show gradients for this category
                        const first = getGradientsByCategory(cat.id)[0];
                        if (first) {
                          setCurrentDesign((p) => ({
                            ...p,
                            primary_color: first.primaryColor,
                            secondary_color: first.secondaryColor,
                          }));
                        }
                      }}
                      className="px-2 py-1 text-[10px] rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 capitalize transition-colors"
                    >
                      {cat.id === "gradient"
                        ? "🎨 Modern"
                        : cat.id === "geometric"
                        ? "📐 Geometric"
                        : cat.id === "holographic"
                        ? "✨ Holographic"
                        : cat.id === "duotone"
                        ? "🎭 Duotone"
                        : cat.id === "vibrant"
                        ? "🌈 Vibrant"
                        : cat.id === "neon"
                        ? "💡 Neon"
                        : cat.nameNL}
                    </button>
                  ))}
                </div>
                {/* Gradient previews */}
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {GRADIENT_STYLES.map((gradient) => (
                    <button
                      key={gradient.id}
                      onClick={() => {
                        setCurrentDesign((p) => ({
                          ...p,
                          primary_color: gradient.primaryColor,
                          secondary_color: gradient.secondaryColor,
                          background_color: gradient.secondaryColor,
                        }));
                      }}
                      className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                        currentDesign.primary_color === gradient.primaryColor
                          ? "border-ocean-500 ring-2 ring-ocean-200 scale-[1.02]"
                          : "border-slate-200 hover:border-slate-300 hover:scale-[1.01]"
                      }`}
                      title={gradient.nameNL}
                    >
                      {/* Gradient preview */}
                      <div
                        className="h-10 w-full"
                        style={{ background: gradient.cssGradient }}
                      />
                      {/* Label */}
                      <div className="px-2 py-1 bg-white">
                        <span className="text-[9px] font-medium text-slate-600 truncate block">
                          {gradient.nameNL}
                        </span>
                      </div>
                      {/* Selected indicator */}
                      {currentDesign.primary_color ===
                        gradient.primaryColor && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-ocean-500 flex items-center justify-center">
                          <CheckCircle size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">
                Kolorystyka
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Kolor Główny</span>
                  <input
                    type="color"
                    value={currentDesign.primary_color}
                    onChange={(e) =>
                      setCurrentDesign((p) => ({
                        ...p,
                        primary_color: e.target.value,
                      }))
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Kolor Tekstu</span>
                  <input
                    type="color"
                    value={currentDesign.text_color}
                    onChange={(e) =>
                      setCurrentDesign((p) => ({
                        ...p,
                        text_color: e.target.value,
                      }))
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Kolor Tła</span>
                  <input
                    type="color"
                    value={currentDesign.background_color}
                    onChange={(e) =>
                      setCurrentDesign((p) => ({
                        ...p,
                        background_color: e.target.value,
                      }))
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">
                Typografia
              </label>
              <div className="space-y-2">
                {["Inter", "Playfair Display", "Courier Prime", "Roboto"].map(
                  (font) => (
                    <button
                      key={font}
                      onClick={() =>
                        setCurrentDesign((p) => ({
                          ...p,
                          font_family: font as any,
                        }))
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-all flex justify-between items-center text-sm ${
                        currentDesign.font_family === font
                          ? "border-ocean-500 bg-ocean-50 text-ocean-700 font-bold shadow-sm"
                          : "border-slate-100 hover:border-slate-300 text-slate-600 bg-white"
                      }`}
                      style={{ fontFamily: font }}
                    >
                      {font}
                      {currentDesign.font_family === font && (
                        <CheckCircle size={14} />
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Paper Texture */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">
                Tekstura Papieru
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "plain", bg: "#fff", label: "Gładki" },
                  {
                    id: "dots",
                    bg: "radial-gradient(#cbd5e1 1px, transparent 1px)",
                    size: "8px 8px",
                    label: "Kropki",
                  },
                  {
                    id: "lines",
                    bg: "repeating-linear-gradient(0deg, transparent, transparent 9px, #e2e8f0 10px)",
                    label: "Linie",
                  },
                  { id: "grain", bg: "#f8fafc", label: "Ziarno" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      setCurrentDesign((p) => ({
                        ...p,
                        paper_texture: t.id as any,
                      }))
                    }
                    className={`h-12 rounded-lg border-2 transition-all relative overflow-hidden ${
                      currentDesign.paper_texture === t.id
                        ? "border-ocean-500 ring-2 ring-ocean-200"
                        : "border-slate-200"
                    }`}
                    style={{
                      background: t.bg,
                      backgroundSize: (t as any).size,
                    }}
                    title={t.label}
                  />
                ))}
              </div>
            </div>

            {/* Premium Gradient Effects */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">
                ✨ Efekty Premium
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: "holographic",
                    bg: "linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #ff6b6b 100%)",
                    label: "🌈 Holograficzny",
                  },
                  {
                    id: "gradient_tri",
                    bg: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                    label: "💜 Trzykolorowy",
                  },
                  {
                    id: "gradient_geo",
                    bg: "conic-gradient(from 45deg, #12c2e9, #c471ed, #f64f59, #12c2e9)",
                    label: "🔷 Geometryczny",
                  },
                  {
                    id: "gradient_soft",
                    bg: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(99,102,241,0.1) 50%, rgba(168,85,247,0.15) 100%)",
                    label: "🌊 Miękki",
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      setCurrentDesign((p) => ({
                        ...p,
                        paper_texture: t.id as any,
                      }))
                    }
                    className={`h-14 rounded-lg border-2 transition-all relative overflow-hidden flex items-center justify-center text-xs font-medium ${
                      currentDesign.paper_texture === t.id
                        ? "border-ocean-500 ring-2 ring-ocean-200"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    style={{ background: t.bg }}
                    title={t.label}
                  >
                    <span className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-slate-700">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === LAYOUT TAB === */}
        {activeTab === "LAYOUT" && (
          <div className="space-y-6">
            {/* Logo Control */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase block">
                Logo Firmowe
              </label>
              <div
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:text-ocean-500 hover:border-ocean-400 hover:bg-ocean-50/30 transition-all cursor-pointer h-32"
              >
                {currentDesign.logo_url ? (
                  <img
                    src={currentDesign.logo_url}
                    className="h-full object-contain"
                  />
                ) : (
                  <>
                    <ImageIcon size={24} className="mb-2" />
                    <span className="text-xs font-bold">Wgraj Logo</span>
                  </>
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleUpload(logoInputRef, "logo_url")}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                  <span>Rozmiar Logo</span>{" "}
                  <span>{currentDesign.logo_size}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={currentDesign.logo_size}
                  onChange={(e) =>
                    setCurrentDesign((p) => ({
                      ...p,
                      logo_size: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-ocean-600"
                />
              </div>
            </div>

            {/* Margins & Spacing */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase block">
                Odstępy
              </label>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                  <span>Margines Strony (Padding)</span>{" "}
                  <span>{currentDesign.global_margin}mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={currentDesign.global_margin}
                  onChange={(e) =>
                    setCurrentDesign((p) => ({
                      ...p,
                      global_margin: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-ocean-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-600">
                  <span>Interlinia</span>{" "}
                  <span>{currentDesign.line_height}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={currentDesign.line_height}
                  onChange={(e) =>
                    setCurrentDesign((p) => ({
                      ...p,
                      line_height: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-ocean-600"
                />
              </div>
            </div>

            {/* Header Align */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">
                Wyrównanie Nagłówka
              </label>
              <div className="flex bg-slate-100 p-1.5 rounded-xl">
                <button
                  onClick={() =>
                    setCurrentDesign((p) => ({ ...p, header_align: "left" }))
                  }
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    currentDesign.header_align === "left"
                      ? "bg-white shadow-sm text-ocean-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <AlignLeft size={18} className="mx-auto" />
                </button>
                <button
                  onClick={() =>
                    setCurrentDesign((p) => ({ ...p, header_align: "center" }))
                  }
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    currentDesign.header_align === "center"
                      ? "bg-white shadow-sm text-ocean-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <AlignCenter size={18} className="mx-auto" />
                </button>
                <button
                  onClick={() =>
                    setCurrentDesign((p) => ({ ...p, header_align: "right" }))
                  }
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    currentDesign.header_align === "right"
                      ? "bg-white shadow-sm text-ocean-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <AlignRight size={18} className="mx-auto" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === "SETTINGS" && (
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <PenTool size={16} /> Miejsce na podpis
              </span>
              <div
                className={`w-10 h-5 rounded-full p-1 transition-colors ${
                  currentDesign.show_signature_line
                    ? "bg-ocean-500"
                    : "bg-slate-300"
                }`}
                onClick={() =>
                  setCurrentDesign((p) => ({
                    ...p,
                    show_signature_line: !p.show_signature_line,
                  }))
                }
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${
                    currentDesign.show_signature_line ? "translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <QrCode size={16} /> Kod QR
              </span>
              <div
                className={`w-10 h-5 rounded-full p-1 transition-colors ${
                  currentDesign.show_qr_code ? "bg-ocean-500" : "bg-slate-300"
                }`}
                onClick={() =>
                  setCurrentDesign((p) => ({
                    ...p,
                    show_qr_code: !p.show_qr_code,
                  }))
                }
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${
                    currentDesign.show_qr_code ? "translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Hash size={16} /> Numeracja Stron
              </span>
              <div
                className={`w-10 h-5 rounded-full p-1 transition-colors ${
                  currentDesign.show_page_numbers
                    ? "bg-ocean-500"
                    : "bg-slate-300"
                }`}
                onClick={() =>
                  setCurrentDesign((p) => ({
                    ...p,
                    show_page_numbers: !p.show_page_numbers,
                  }))
                }
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${
                    currentDesign.show_page_numbers ? "translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Znak Wodny / Tło
              </label>
              {currentDesign.show_watermark ? (
                <div className="relative group">
                  <div className="w-full h-32 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                    {currentDesign.watermark_url ? (
                      <img
                        src={currentDesign.watermark_url}
                        className="h-full object-contain opacity-50"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">
                        Używam Logo jako Znaku
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentDesign((p) => ({ ...p, show_watermark: false }))
                    }
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCurrentDesign((p) => ({ ...p, show_watermark: true }));
                    watermarkInputRef.current?.click();
                  }}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-ocean-400 hover:text-ocean-600 transition-colors flex flex-col items-center gap-1"
                >
                  <Stamp size={18} />+ Dodaj Znak Wodny
                </button>
              )}
              <input
                type="file"
                ref={watermarkInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) =>
                  handleUpload(watermarkInputRef, "watermark_url")
                }
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() =>
                  setCurrentDesign({
                    ...DEFAULT_DESIGN,
                    blocks: currentDesign.blocks,
                  })
                } // Keep blocks, reset styles
                className="w-full py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
              >
                <Ban size={14} /> Resetuj Wygląd
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // --- MAIN CANVAS RENDERER ---
  const renderCanvas = () => {
    return (
      <div className="flex-1 bg-[#1e1e24] overflow-hidden flex flex-col relative transition-all duration-300">
        {/* Top Canvas Toolbar */}
        <div className="h-12 bg-[#27272a] border-b border-white/5 flex items-center justify-between px-4 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white"
            >
              {isDrawerOpen ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeft size={18} />
              )}
            </button>
            <div className="h-4 w-px bg-white/10 mx-1"></div>
            <button
              className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white"
              title="Cofnij"
            >
              <Undo2 size={18} />
            </button>
            <button
              className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white"
              title="Ponów"
            >
              <Redo2 size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded transition-colors ${
                showGrid
                  ? "bg-ocean-500/20 text-ocean-400"
                  : "hover:bg-white/10 text-slate-400"
              }`}
              title="Siatka"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setShowRuler(!showRuler)}
              className={`p-2 rounded transition-colors ${
                showRuler
                  ? "bg-ocean-500/20 text-ocean-400"
                  : "hover:bg-white/10 text-slate-400"
              }`}
              title="Linijka"
            >
              <Ruler size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-10 relative cursor-grab active:cursor-grabbing custom-scrollbar">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

          {/* THE A4 PAPER */}
          <div
            className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out origin-center relative group"
            style={{
              width: "210mm",
              minHeight: "297mm",
              transform: `scale(${zoomLevel})`,
              backgroundColor: currentDesign.background_color,
              color: currentDesign.text_color,
              fontFamily: currentDesign.font_family,
              padding: `${currentDesign.global_margin}mm`,
              lineHeight: currentDesign.line_height,
            }}
          >
            {/* Texture Overlay */}
            {currentDesign.paper_texture === "dots" && (
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              ></div>
            )}
            {currentDesign.paper_texture === "lines" && (
              <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 19px, #000 20px)",
                }}
              ></div>
            )}

            {/* Premium Gradient Effects */}
            {currentDesign.paper_texture === "holographic" && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  background:
                    "linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #ff6b6b 100%)",
                  backgroundSize: "400% 400%",
                  animation: "holographicShift 8s ease infinite",
                }}
              ></div>
            )}
            {currentDesign.paper_texture === "gradient_tri" && (
              <div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                }}
              ></div>
            )}
            {currentDesign.paper_texture === "gradient_geo" && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "conic-gradient(from 45deg at 50% 50%, rgba(18,194,233,0.15), rgba(196,113,237,0.15), rgba(246,79,89,0.15), rgba(18,194,233,0.15))",
                }}
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `
                      linear-gradient(60deg, transparent 48%, rgba(99,102,241,0.1) 50%, transparent 52%),
                      linear-gradient(-60deg, transparent 48%, rgba(168,85,247,0.1) 50%, transparent 52%)
                    `,
                    backgroundSize: "60px 100px",
                  }}
                ></div>
              </div>
            )}
            {currentDesign.paper_texture === "gradient_soft" && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(99,102,241,0.08) 50%, rgba(168,85,247,0.12) 100%)",
                }}
              ></div>
            )}

            {/* Design Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 z-50 pointer-events-none border-2 border-ocean-400 opacity-30 grid grid-cols-12 gap-4 p-8">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-ocean-200/20 h-full"></div>
                ))}
              </div>
            )}

            {/* --- DYNAMIC CONTENT RENDERING --- */}
            <div className="h-full flex flex-col relative z-10">
              {/* Watermark (Absolute) */}
              {currentDesign.show_watermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 opacity-[0.03]">
                  {currentDesign.watermark_url || currentDesign.logo_url ? (
                    <img
                      src={
                        currentDesign.watermark_url || currentDesign.logo_url
                      }
                      className="w-[80%] h-[80%] object-contain grayscale"
                    />
                  ) : (
                    <Building2 size={400} />
                  )}
                </div>
              )}

              {/* Header */}
              <div
                className={`mb-8 flex ${
                  currentDesign.header_align === "center"
                    ? "flex-col items-center text-center"
                    : currentDesign.header_align === "right"
                    ? "flex-row-reverse text-right"
                    : "justify-between items-start"
                } border-b pb-4 relative z-10`}
                style={{ borderColor: currentDesign.secondary_color }}
              >
                {currentDesign.logo_url ? (
                  <img
                    src={currentDesign.logo_url}
                    className="object-contain mb-4"
                    style={{ height: currentDesign.logo_size }}
                  />
                ) : (
                  <div className="mb-4"></div>
                )}

                <div
                  className={`${
                    currentDesign.header_align === "right"
                      ? "text-left"
                      : "text-right"
                  }`}
                >
                  <h1
                    className="font-black uppercase leading-none"
                    style={{
                      color: currentDesign.primary_color,
                      fontSize: "2.5rem",
                    }}
                  >
                    {currentDesign.labels.title}
                  </h1>
                  <p className="opacity-60 mt-1 font-bold">
                    #{new Date().getFullYear()}-001
                  </p>
                </div>
              </div>

              {/* BLOCKS LOOP */}
              <div className="flex-1 space-y-2 relative z-10">
                {currentDesign.blocks.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                    <Plus size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Kliknij elementy w menu po lewej, aby dodać treść.</p>
                  </div>
                )}

                {currentDesign.blocks.map((block) => (
                  <div
                    key={`${block.id}-${block.type}-${String(
                      block.content.text || ""
                    ).substring(0, 10)}`}
                    className="group/block relative hover:ring-1 hover:ring-ocean-300 rounded transition-all p-1"
                  >
                    {/* Block Actions (Hover) */}
                    <div className="absolute -right-8 top-0 flex flex-col gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-50">
                      <button
                        onClick={() => removeBlock(block.id)}
                        disabled={currentDesign.is_locked}
                        className="p-1.5 bg-white text-red-500 shadow-sm border border-slate-200 rounded hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          currentDesign.is_locked
                            ? "Szablon zablokowany"
                            : "Usuń blok"
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Render Specific Block Type */}
                    {renderBlockContent(block)}
                  </div>
                ))}
              </div>

              {/* Footer Elements (Static) */}
              <div
                className="mt-auto pt-8 border-t flex justify-between items-end text-sm opacity-70 relative z-10"
                style={{ borderColor: currentDesign.secondary_color }}
              >
                <div>
                  {currentDesign.show_signature_line && (
                    <div className="border-t border-black w-48 pt-2 text-center text-xs uppercase">
                      Podpis
                    </div>
                  )}
                </div>
                <div className="flex items-end gap-4">
                  {currentDesign.show_page_numbers && (
                    <div className="text-xs font-mono">Strona 1/1</div>
                  )}
                  {currentDesign.show_qr_code && <QrCode size={48} />}
                </div>
              </div>

              {/* Decorative Footer Strip */}
              <div
                className="absolute bottom-0 left-0 right-0 h-2"
                style={{ backgroundColor: currentDesign.primary_color }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- BLOCK RENDERER ---
  const renderBlockContent = (block: DocBlock) => {
    switch (block.type) {
      case "heading_h1":
        return (
          <h1
            contentEditable
            suppressContentEditableWarning
            className="text-3xl font-bold outline-none"
            style={{ color: currentDesign.primary_color }}
            onBlur={(e) =>
              updateBlock(block.id, { text: e.currentTarget.textContent })
            }
          >
            {block.content.text}
          </h1>
        );
      case "heading_h2":
        return (
          <h2
            contentEditable
            suppressContentEditableWarning
            className="text-2xl font-bold outline-none mb-2 border-b pb-1"
            style={{ borderColor: currentDesign.secondary_color }}
            onBlur={(e) =>
              updateBlock(block.id, { text: e.currentTarget.textContent })
            }
          >
            {block.content.text}
          </h2>
        );
      case "heading_h3":
        return (
          <h3
            contentEditable
            suppressContentEditableWarning
            className="text-xl font-bold outline-none text-slate-600"
            onInput={(e) =>
              updateBlock(block.id, { text: e.currentTarget.textContent })
            }
          >
            {block.content.text}
          </h3>
        );
      case "paragraph":
        return (
          <p
            contentEditable
            suppressContentEditableWarning
            className="outline-none whitespace-pre-wrap"
            onBlur={(e) =>
              updateBlock(block.id, { text: e.currentTarget.textContent })
            }
          >
            {block.content.text}
          </p>
        );
      case "list":
        return (
          <ul className="list-disc list-inside space-y-1">
            {(block.content.items || []).map((item: string, idx: number) => (
              <li
                key={idx}
                contentEditable
                suppressContentEditableWarning
                className="outline-none"
                onBlur={(e) => {
                  const newItems = [...block.content.items];
                  newItems[idx] = e.currentTarget.textContent;
                  updateBlock(block.id, { items: newItems });
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        );
      case "quote":
        return (
          <blockquote
            className="border-l-4 pl-4 italic py-2 my-2 bg-slate-50"
            style={{ borderColor: currentDesign.primary_color }}
          >
            <p
              contentEditable
              suppressContentEditableWarning
              className="outline-none font-medium text-lg"
            >
              {block.content.text}
            </p>
          </blockquote>
        );
      case "divider":
        return (
          <hr
            className="my-4 border-t-2"
            style={{ borderColor: currentDesign.secondary_color }}
          />
        );
      case "spacer":
        return (
          <div
            style={{ height: block.content.height }}
            className="w-full bg-transparent group-hover/block:bg-slate-50/50 transition-colors flex items-center justify-center text-[10px] text-transparent group-hover/block:text-slate-400 select-none"
          >
            Odstęp {block.content.height}px
          </div>
        );
      case "columns_2":
        return (
          <div className="grid grid-cols-2 gap-6">
            <div
              contentEditable
              suppressContentEditableWarning
              className="outline-none p-2 border border-transparent hover:border-slate-200 rounded"
            >
              {block.content.leftText}
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              className="outline-none p-2 border border-transparent hover:border-slate-200 rounded"
            >
              {block.content.rightText}
            </div>
          </div>
        );
      case "image":
        return (
          <div className="w-full h-48 bg-slate-100 rounded flex items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden group/img">
            {block.content.url ? (
              <img
                src={block.content.url}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-slate-400 flex flex-col items-center">
                <ImageIcon size={32} />
                <span className="text-xs mt-2">Kliknij, aby dodać zdjęcie</span>
              </div>
            )}
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files?.[0])
                  updateBlock(block.id, {
                    url: URL.createObjectURL(e.target.files[0]),
                  });
              }}
            />
          </div>
        );
      case "qr":
        return (
          <div className="flex flex-col items-center justify-center p-4 bg-white border rounded-lg w-fit mx-auto">
            <QrCode size={64} />
            <p
              contentEditable
              suppressContentEditableWarning
              className="text-xs mt-2 font-mono uppercase"
            >
              {block.content.label}
            </p>
          </div>
        );
      case "gallery":
        return (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-square bg-slate-100 rounded border border-slate-200 flex items-center justify-center relative overflow-hidden"
              >
                {block.content.images[i] ? (
                  <img
                    src={block.content.images[i]}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlus size={20} className="text-slate-300" />
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const newImgs = [...block.content.images];
                      newImgs[i] = URL.createObjectURL(e.target.files[0]);
                      updateBlock(block.id, { images: newImgs });
                    }
                  }}
                />
              </div>
            ))}
          </div>
        );
      case "table_simple":
        return (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                {(block.content.headers || []).map((h: string, i: number) => (
                  <th
                    key={i}
                    contentEditable
                    suppressContentEditableWarning
                    className="border p-2 text-left outline-none"
                    onBlur={(e) => {
                      const newH = [...block.content.headers];
                      newH[i] = e.currentTarget.textContent;
                      updateBlock(block.id, { headers: newH });
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(block.content.rows || []).map((row: string[], i: number) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      contentEditable
                      suppressContentEditableWarning
                      className="border p-2 outline-none"
                      onBlur={(e) => {
                        const newRows = [...(block.content.rows || [])];
                        newRows[i][j] = e.currentTarget.textContent;
                        updateBlock(block.id, { rows: newRows });
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Placeholder row if dataSource is used */}
              {block.content.dataSource &&
                (!block.content.rows || block.content.rows.length === 0) && (
                  <tr className="bg-slate-50">
                    {(block.content.headers || []).map(
                      (_: string, idx: number) => (
                        <td
                          key={idx}
                          className="border p-2 text-slate-400 italic text-sm"
                        >
                          {idx === 0
                            ? `Data from: ${block.content.dataSource}`
                            : "—"}
                        </td>
                      )
                    )}
                  </tr>
                )}
            </tbody>
          </table>
        );
      case "price_list":
        return (
          <div className="space-y-2">
            {(block.content.items || []).map((item: any, i: number) => (
              <div
                key={i}
                className="flex justify-between items-center border-b border-dotted border-slate-300 pb-1"
              >
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="font-medium outline-none flex-1"
                >
                  {item.name}
                </span>
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="font-bold outline-none"
                  style={{ color: currentDesign.primary_color }}
                >
                  €{item.price}
                </span>
              </div>
            ))}
            <div
              className="text-right font-black pt-2"
              style={{ color: currentDesign.primary_color }}
            >
              SUMA: €
              {block.content.items
                .reduce((acc: number, item: any) => acc + Number(item.price), 0)
                .toFixed(2)}
            </div>
          </div>
        );
      case "signature":
        return (
          <div className="mt-8 w-64 border-t border-black pt-2">
            <p
              contentEditable
              suppressContentEditableWarning
              className="text-xs uppercase font-bold text-slate-500 outline-none"
            >
              {block.content.label}
            </p>
          </div>
        );
      case "date":
        return (
          <div className="text-right">
            <p className="text-sm font-medium text-slate-600">
              <span contentEditable suppressContentEditableWarning>
                {block.content.label}
              </span>
              :{" "}
              <span contentEditable suppressContentEditableWarning>
                {block.content.value}
              </span>
            </p>
          </div>
        );
      case "page_number":
        return (
          <div className="w-full text-center text-xs text-slate-400 mt-4">
            Strona {block.content.current} z {block.content.total}
          </div>
        );

      // --- Werkbon Renderers ---
      case "checklist":
        return (
          <div className="space-y-2">
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-slate-300 rounded flex items-center justify-center">
                  {item.checked && (
                    <CheckSquare size={16} className="text-slate-700" />
                  )}
                </div>
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className="outline-none flex-1"
                  onBlur={(e) => {
                    const newItems = [...block.content.items];
                    newItems[i].text = e.currentTarget.textContent;
                    updateBlock(block.id, { items: newItems });
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        );

      case "materials_table":
        return (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200">
                <th className="p-2 text-left w-16">Ilość</th>
                <th className="p-2 text-left w-16">Jedn.</th>
                <th className="p-2 text-left">Nazwa Materiału</th>
              </tr>
            </thead>
            <tbody>
              {(block.content.rows || []).map((row: string[], i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td
                    contentEditable
                    suppressContentEditableWarning
                    className="p-2 border-r border-slate-100 outline-none"
                    onBlur={(e) => {
                      const newRows = [...block.content.rows];
                      newRows[i][0] = e.currentTarget.textContent || "";
                      updateBlock(block.id, { rows: newRows });
                    }}
                  >
                    {row[0]}
                  </td>
                  <td
                    contentEditable
                    suppressContentEditableWarning
                    className="p-2 border-r border-slate-100 outline-none"
                    onBlur={(e) => {
                      const newRows = [...block.content.rows];
                      newRows[i][1] = e.currentTarget.textContent || "";
                      updateBlock(block.id, { rows: newRows });
                    }}
                  >
                    {row[1]}
                  </td>
                  <td
                    contentEditable
                    suppressContentEditableWarning
                    className="p-2 outline-none"
                    onBlur={(e) => {
                      const newRows = [...block.content.rows];
                      newRows[i][2] = e.currentTarget.textContent || "";
                      updateBlock(block.id, { rows: newRows });
                    }}
                  >
                    {row[2]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "info_grid":
        return (
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            {(block.content.fields || []).map((field: any, i: number) => (
              <div key={i} className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                  {field.label}
                </span>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="font-bold text-slate-800 border-b border-slate-300 pb-1 outline-none"
                  onBlur={(e) => {
                    const newFields = [...block.content.fields];
                    newFields[i].value = e.currentTarget.textContent || "";
                    updateBlock(block.id, { fields: newFields });
                  }}
                >
                  {field.value || "...................."}
                </div>
              </div>
            ))}
          </div>
        );

      case "input_box":
        return (
          <div
            className="w-full border border-slate-300 rounded p-2"
            style={{ height: block.content.height || 100 }}
          >
            <p className="text-xs text-slate-400 uppercase font-bold mb-2">
              {block.content.label || "Uwagi"}
            </p>
            <div
              contentEditable
              suppressContentEditableWarning
              className="outline-none text-sm h-[calc(100%-24px)] overflow-auto"
              onBlur={(e) =>
                updateBlock(block.id, { text: e.currentTarget.textContent })
              }
            >
              {block.content.text}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-2 border border-red-200 bg-red-50 text-red-500 text-xs">
            Nieznany blok: {block.type}
          </div>
        );
    }
  };

  // --- Template Selector Render ---
  const renderTemplateSelector = () => {
    const filteredTemplates = predefinedTemplates.filter(
      (t) => t.type === selectedTemplateType
    );

    return (
      <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-slate-900 flex flex-col animate-in fade-in duration-300 overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 shrink-0 bg-slate-800 border-b border-slate-700 px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setViewMode("LIBRARY");
                setIsTypeModalOpen(true);
              }}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">
                Wybierz Szablon{" "}
                {selectedTemplateType === "INVOICE" ? "Faktury" : "Werkbonu"}
              </h2>
              <p className="text-sm text-slate-400">
                10 gotowych szablonów z zablokowanymi układami
              </p>
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => {
              const info =
                TEMPLATE_INFO[template.template_category || "standard"];
              return (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group relative bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 text-left overflow-hidden"
                >
                  {/* Color Preview Bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-2"
                    style={{ backgroundColor: template.primary_color }}
                  ></div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4 mt-2">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: template.primary_color }}
                    >
                      {info?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-ocean-600 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                        {template.template_category}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4">
                    {info?.description || "Profesjonalny szablon dokumentu"}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle size={14} className="text-green-500" />
                      <span>Kolory i czcionki</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle size={14} className="text-green-500" />
                      <span>Logo i marginesy</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Ban size={14} className="text-red-400" />
                      <span className="line-through">Dodawanie bloków</span>
                    </div>
                  </div>

                  {/* Block Count */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-100">
                    <Layers size={14} />
                    <span>
                      {template.blocks?.length || 0} zablokowanych elementów
                    </span>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-ocean-500/0 to-blue-600/0 group-hover:from-ocean-500/5 group-hover:to-blue-600/5 transition-all rounded-2xl pointer-events-none"></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---

  if (viewMode === "TEMPLATE_SELECTOR") {
    return renderTemplateSelector();
  }

  if (viewMode === "BUILDER") {
    console.log("🏗️ [RENDER] Mode: BUILDER");
    return (
      <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-[#1e1e24] flex flex-col animate-in fade-in duration-300 overflow-hidden font-sans">
        {/* TOP COMMAND BAR */}
        <div className="h-14 shrink-0 bg-[#18181b] border-b border-white/5 px-4 flex justify-between items-center shadow-lg z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode("LIBRARY")}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div>
                <input
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none focus:ring-1 focus:ring-ocean-500 rounded px-2 w-48 sm:w-64 text-sm"
                />
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-2">
                  {currentDesign.type} STUDIO
                </p>
              </div>
              {currentDesign.is_locked && (
                <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold uppercase flex items-center gap-1.5">
                  <Ban size={12} />
                  Zablokowany Układ
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-black/30 rounded-lg border border-white/10 p-0.5">
              <button
                onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))}
                className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-mono w-10 text-center text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))}
                className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            <button
              onClick={handleSaveDesign}
              className="bg-ocean-600 hover:bg-ocean-500 text-white px-4 py-1.5 rounded-lg font-bold text-sm shadow-lg shadow-ocean-500/20 flex items-center gap-2 transition-all"
            >
              <Save size={16} /> Zapisz
            </button>
          </div>
        </div>

        {/* MAIN BUILDER LAYOUT */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Icon Rail */}
          {renderSidebar()}

          {/* Slide-out Drawer */}
          {renderDrawer()}

          {/* Center Canvas */}
          {renderCanvas()}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ocean-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 animate-pulse"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-ocean-300">
              Studio Dokumentów 2.0
            </span>
          </div>
          <h1 className="text-5xl font-black mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Centrum Dowodzenia
          </h1>
          <p className="text-lg text-slate-400 mb-8 font-light">
            Profesjonalne narzędzia do tworzenia dokumentów z wykorzystaniem AI
            i zaawansowanego designu.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setIsTypeModalOpen(true)}
              className="group bg-gradient-to-r from-ocean-500 to-blue-600 hover:from-ocean-400 hover:to-blue-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-ocean-900/50 flex items-center gap-3 transition-all hover:scale-[1.02]"
            >
              <Paintbrush
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
              Stwórz Nowy Projekt
            </button>
          </div>
        </div>
      </div>

      {/* Predefined Templates Section - GROUPED BY CATEGORY */}
      {predefinedTemplates.length > 0 && (
        <div className="mb-12 space-y-10">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="text-yellow-500" /> Gotowe Szablony
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {predefinedTemplates.length} profesjonalnych szablonów
                pogrupowanych według kategorii
              </p>
            </div>
          </div>

          {/* Render each category group */}
          {TEMPLATE_CATEGORY_GROUPS.map((group) => {
            // Filter templates that belong to this category group
            const groupTemplates = predefinedTemplates.filter(
              (t) =>
                t.template_category &&
                group.categories.includes(t.template_category)
            );

            // Skip empty groups
            if (groupTemplates.length === 0) return null;

            return (
              <div key={group.id} className="space-y-4">
                {/* Category Header */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${group.color} shadow-lg`}
                >
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white">
                    {group.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white">
                      {group.label}
                    </h4>
                    <p className="text-sm text-white/70">{group.description}</p>
                  </div>
                  <div className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-bold">
                    {groupTemplates.length}{" "}
                    {groupTemplates.length === 1
                      ? "szablon"
                      : groupTemplates.length < 5
                      ? "szablony"
                      : "szablonów"}
                  </div>
                </div>

                {/* Templates Grid for this category */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pl-4">
                  {groupTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="group relative w-full min-h-[280px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 hover:border-ocean-400 hover:shadow-xl transition-all text-left flex flex-col"
                    >
                      {/* Color Header */}
                      <div
                        className="h-3 flex-shrink-0"
                        style={{ backgroundColor: template.primary_color }}
                      ></div>

                      {/* Document Preview Thumbnail */}
                      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                        <div className="bg-white w-full max-w-[130px] h-36 shadow-lg rounded p-2 overflow-hidden transform transition-transform duration-500 group-hover:scale-105 opacity-95 group-hover:opacity-100 border border-slate-200">
                          {/* Header with color bar */}
                          <div className="flex items-center gap-1 mb-2">
                            <div
                              className="h-2 w-2 rounded-sm flex-shrink-0"
                              style={{
                                backgroundColor: template.primary_color,
                              }}
                            ></div>
                            <div className="h-1 bg-slate-200 flex-1 rounded"></div>
                            <div className="h-1 bg-slate-200 w-1/4 rounded"></div>
                          </div>

                          {/* Simplified preview lines */}
                          <div className="space-y-1">
                            <div className="h-0.5 bg-slate-300 w-3/4 rounded"></div>
                            <div className="h-0.5 bg-slate-200 w-1/2 rounded"></div>
                            <div className="h-0.5 bg-slate-200 w-2/3 rounded"></div>
                            <div className="mt-2 p-1 border border-slate-200 rounded">
                              <div className="h-0.5 bg-slate-300 w-full rounded mb-0.5"></div>
                              <div className="h-0.5 bg-slate-200 w-full rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="p-4 pt-0 flex-shrink-0 relative z-20 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
                        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 border border-slate-700/50">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-lg"
                              style={{
                                backgroundColor:
                                  template.primary_color || "#0ea5e9",
                              }}
                            >
                              {
                                TEMPLATE_INFO[
                                  template.template_category || "standard"
                                ]?.icon
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-white group-hover:text-ocean-400 transition-colors truncate">
                                {template.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                                {
                                  TEMPLATE_INFO[
                                    template.template_category || "standard"
                                  ]?.label
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Badges */}
                      <div className="p-3 pt-0 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[9px] font-bold">
                            Kolory ✓
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {template.blocks?.length || 0} bloków
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-ocean-500/0 to-blue-600/0 group-hover:from-ocean-500/20 group-hover:to-blue-600/20 transition-all pointer-events-none"></div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Library Grid */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Folder className="text-fuchsia-500" /> Moje Projekty
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 isolate p-4">
          {/* Create New Shortcut */}
          <button
            onClick={() => setIsTypeModalOpen(true)}
            className="group relative h-[360px] w-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 hover:border-ocean-400 hover:bg-ocean-50/30 transition-all"
          >
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-slate-300 group-hover:text-ocean-500">
              <Plus size={40} />
            </div>
            <span className="font-bold text-slate-400 group-hover:text-ocean-600 text-lg">
              Nowy Dokument
            </span>
          </button>

          {/* Saved Items */}
          {invoiceDesigns.map((design) => (
            <div
              key={design.id}
              className="relative w-full h-[360px] group hover:z-[100] transition-all duration-200 ease-out"
            >
              <div className="absolute inset-0 -left-[2px] -top-[2px] w-[calc(100%+4px)] h-[calc(100%+4px)] rounded-[22px] bg-gradient-to-br from-[#fff01c] to-[#40c9ff] -z-10 transition-all duration-500 group-hover:rotate-2 group-hover:scale-[1.02] pointer-events-none"></div>

              <div className="relative w-full h-full bg-black rounded-[20px] p-4 flex flex-col justify-between overflow-hidden text-white shadow-lg">
                <div className="flex-1 flex items-center justify-center p-2 relative z-10 pointer-events-none">
                  <div className="bg-white w-3/4 h-48 shadow-lg rounded p-2 text-[4px] overflow-hidden transform transition-transform duration-500 group-hover:scale-95 opacity-90 group-hover:opacity-100">
                    <div
                      className="h-2 mb-2 w-1/3"
                      style={{ backgroundColor: design.primary_color }}
                    ></div>
                    <div className="space-y-1">
                      <div className="h-0.5 bg-slate-200 w-full"></div>
                      <div className="h-0.5 bg-slate-200 w-full"></div>
                      <div className="h-0.5 bg-slate-200 w-2/3"></div>
                    </div>
                  </div>
                </div>

                <div className="z-20 bg-black/50 backdrop-blur-sm p-2 rounded-lg pointer-events-none">
                  <p className="text-xl font-bold capitalize tracking-tight">
                    {design.name}
                  </p>
                  <div className="flex justify-between items-center mt-1 text-gray-400 text-xs font-medium">
                    <span className="uppercase tracking-wider">
                      {design.type}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-3 translate-y-[120%] group-hover:translate-y-0 transition-transform duration-300 z-30">
                  <button
                    onClick={() => {
                      setCurrentDesign({
                        ...design,
                        paper_texture: "plain",
                        global_margin: 15,
                        border_radius: 0,
                        line_height: 1.5,
                        show_page_numbers: false,
                        blocks: [],
                      } as ExtendedDesign);
                      setDesignName(design.name);
                      setEditingDesignId(design.id); // Editing existing design
                      setViewMode("BUILDER");
                    }}
                    className="flex-1 py-2 rounded-xl border-none bg-gradient-to-br from-[#fc00ff] to-[#00dbde] text-white font-bold shadow-lg text-sm hover:brightness-110 transition-all"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteInvoiceDesign(design.id);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/20 text-white hover:bg-red-500/80 transition-colors backdrop-blur-md"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Type Modal */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800">
                Wybierz Typ Dokumentu
              </h2>
              <button
                onClick={() => setIsTypeModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => handleCreateNew("CONTRACT")}
                className="p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileSignature size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800">Umowa</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Gotowe szablony prawne
                </p>
              </button>
              <button
                onClick={() => handleCreateNew("CV")}
                className="p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UserCircle size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800">CV</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Profesjonalny życiorys
                </p>
              </button>
              <button
                onClick={() => handleCreateNew("OFFER")}
                className="p-6 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800">Oferta</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Wizualna oferta handlowa
                </p>
              </button>
              <button
                onClick={() => handleCreateNew("INVOICE")}
                className="p-6 rounded-2xl border-2 border-slate-100 hover:border-ocean-500 hover:bg-ocean-50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-ocean-100 text-ocean-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800">Faktura</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Standardowa faktura VAT
                </p>
              </button>
              <button
                onClick={() => handleCreateNew("TIMESHEET")}
                className="p-6 rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                  Karta Pracy (Uren)
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Ewidencja godzin (Werkbon)
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
