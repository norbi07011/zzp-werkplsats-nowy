/**
 * Certificate Preview & Designer Component
 * Advanced 5-tab designer with live preview and print functionality
 */

import React, { useState, useEffect, useRef } from "react";
import { Certificate, CertificateDesign, Language } from "../types";
import { QRCodeSVG } from "qrcode.react";
import { saveCertificateToDb } from "../services/certificateStorage";
import { toast } from "sonner";
import {
  Printer,
  ArrowLeft,
  Upload,
  FileText,
  CreditCard,
  User,
  Shield,
  Palette,
  Type,
  Edit,
  Plus,
  RefreshCw,
  Briefcase,
  Sparkles,
  AlertCircle,
  Activity,
  Zap,
  ZoomIn,
  ChevronDown,
  ChevronRight,
  Info,
  ExternalLink,
  Globe,
  Award,
  Star,
  Lock,
  Move,
  Settings,
  Save,
  Loader2,
} from "lucide-react";

// Alias for Undo/Redo - use ArrowLeft/RefreshCw as fallback
const Undo2 = ArrowLeft;
const Redo2 = ArrowLeft;
const RotateCcw = RefreshCw;

// Alias for compatibility - use available icons
const ShieldCheck = Shield;
const PaintBucket = Edit;
const Shapes = Plus;
const Contrast = AlertCircle;
const Waves = Activity;
const Maximize2 = ExternalLink;
const Barcode = Star;
const Stamp = Star;
const Layers = Settings;
const StickyNote = Edit;
const Grid = Settings;
const Hexagon = Settings;
const Cpu = Settings;
const Box = Briefcase;
const MousePointer2 = Edit;
const Database = Loader2;
const Maximize = ExternalLink;
const Hash = Star;
const Package = Briefcase;
const MousePointer = Edit;
const LayoutGrid = Settings;
const QrCode = Star;

// --- SHARED UI COMPONENTS ---
const SubHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="py-2 px-1 border-b border-slate-100 mb-2 mt-4">
    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
      {title}
    </span>
  </div>
);

const ToolSection: React.FC<{
  id: string;
  title: string;
  icon: any;
  children: React.ReactNode;
  openSections: string[];
  onToggle: (id: string) => void;
}> = ({ id, title, icon: Icon, children, openSections, onToggle }) => {
  const isOpen = openSections.includes(id);
  return (
    <div className="mb-2 bg-white/60 border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={14} className="text-brand-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown size={14} className="text-slate-400" />
        ) : (
          <ChevronRight size={14} className="text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-50">
          {children}
        </div>
      )}
    </div>
  );
};

const RangeField: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  field: keyof CertificateDesign;
  design: CertificateDesign;
  onChange: (design: CertificateDesign) => void;
}> = ({ label, value, min, max, step, field, design, onChange }) => (
  <div className="group">
    <div className="flex justify-between mb-1.5">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-brand-600 transition-colors">
        {label}
      </label>
      <span className="text-[9px] font-black text-brand-600">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) =>
        onChange({ ...design, [field]: parseFloat(e.target.value) })
      }
      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
    />
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  field: keyof CertificateDesign;
  design: CertificateDesign;
  onChange: (design: CertificateDesign) => void;
}> = ({ label, value, options, field, design, onChange }) => (
  <div>
    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 tracking-tighter">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange({ ...design, [field]: e.target.value as any })}
      className="w-full text-[11px] font-bold bg-white border border-slate-200 rounded-xl p-2 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// --- MAIN PREVIEW COMPONENT ---
interface Props {
  data: Certificate;
  design: CertificateDesign;
  onDesignChange: (design: CertificateDesign) => void;
  mode: "certificate" | "card";
  language: Language;
  onBack: () => void;
}

export const CertificatePreview: React.FC<Props> = ({
  data,
  design,
  onDesignChange,
  mode,
  language,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    "layout" | "assets" | "typo" | "visuals" | "matrix" | "security" | "card"
  >("layout");
  const [previewScale, setPreviewScale] = useState(1);
  const [cardSide, setCardSide] = useState<"front" | "back">("front");
  const [openSections, setOpenSections] = useState<string[]>([
    "branding",
    "typo-matrix",
    "bg-engine",
    "pos-matrix",
    "overlays",
    "frames",
    "sec-engine",
    "gradient-engine",
  ]);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // === UNDO/REDO HISTORY SYSTEM ===
  const [designHistory, setDesignHistory] = useState<CertificateDesign[]>([
    design,
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRef = useRef(false);
  const MAX_HISTORY = 50;

  // Track design changes for undo
  useEffect(() => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }
    // Only add to history if design actually changed
    const lastDesign = designHistory[historyIndex];
    if (JSON.stringify(design) !== JSON.stringify(lastDesign)) {
      const newHistory = designHistory.slice(0, historyIndex + 1);
      newHistory.push(design);
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        setDesignHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } else {
        setDesignHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  }, [design]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < designHistory.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    isUndoingRef.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    onDesignChange(designHistory[newIndex]);
    toast.success(`↩️ Cofnięto (${historyIndex}/${designHistory.length - 1})`);
  };

  const handleRedo = () => {
    if (!canRedo) return;
    isUndoingRef.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    onDesignChange(designHistory[newIndex]);
    toast.success(`↪️ Ponowiono (${newIndex}/${designHistory.length - 1})`);
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        "Czy na pewno chcesz zresetować wszystkie ustawienia do domyślnych?"
      )
    ) {
      // Will trigger history add automatically
      onDesignChange(designHistory[0]);
      toast.success("🔄 Zresetowano do stanu początkowego");
    }
  };

  const toggleSection = (id: string) =>
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.offsetWidth - 100;
      const ch = containerRef.current.offsetHeight - 100;
      const isLandscape = design.orientation === "landscape";
      const tw = mode === "certificate" ? (isLandscape ? 1123 : 794) : 324;
      const th = mode === "certificate" ? (isLandscape ? 794 : 1123) : 204;
      setPreviewScale(Math.min(cw / tw, ch / th, 1.0));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mode, design.orientation, activeTab]);

  const L = (nl: string, pl: string) =>
    design.isBilingual ? (
      <div className="flex flex-col leading-none">
        <span>{nl}</span>
        <span className="text-[0.55em] opacity-50 font-medium tracking-normal">
          / {pl}
        </span>
      </div>
    ) : language === "nl" ? (
      nl
    ) : (
      pl
    );

  const renderBackground = () => {
    if (!design.useGradientBackground) return { backgroundColor: "white" };
    const [c1, c2, c3] = design.gradientColors;
    switch (design.gradientType) {
      case "linear":
        return { background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3})` };
      case "radial":
        return {
          background: `radial-gradient(circle at center, ${c1}, ${c2}, ${c3})`,
        };
      case "mesh":
        return {
          backgroundColor: c1,
          backgroundImage: `radial-gradient(at 0% 0%, ${c2} 0, transparent 50%), radial-gradient(at 100% 0%, ${c3} 0, transparent 50%), radial-gradient(at 50% 100%, ${c2} 0, transparent 50%)`,
        };
      case "ocean":
        return {
          background: `linear-gradient(to right, #243949 0%, #517fa4 100%)`,
        };
      case "cosmic":
        return {
          background: `linear-gradient(to top, #30cfd0 0%, #330867 100%)`,
        };
      case "vibrant":
        return {
          background: `linear-gradient(45deg, #f093fb 0%, #f5576c 100%)`,
        };
      case "holographic-flow":
        return {
          background: `linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)`,
        };
      default:
        return { background: `linear-gradient(135deg, ${c1}, ${c2})` };
    }
  };

  const renderOverlay = () => {
    if (design.overlayShape === "none") return null;
    const commonProps = {
      className: "absolute inset-0 pointer-events-none mix-blend-multiply",
      style: { opacity: design.overlayOpacity, color: design.overlayColor },
    };
    switch (design.overlayShape) {
      case "circuit-board":
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M10 10 L30 10 L30 30 M70 10 L90 10 L90 30 M10 90 L10 70 L30 70 M90 90 L90 70 L70 70' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: "100px",
            }}
          ></div>
        );
      case "hexagon-mesh":
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.91v12.43l10.99 6.34 11-6.34V17.91l-11-6.34-10.99 6.34z' fill='currentColor' fill-opacity='0.1'/%3E%3C/svg%3E")`,
              backgroundSize: "56px",
            }}
          ></div>
        );
      case "topographic":
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cpath d='M0 100 Q 50 20 100 100 T 200 100' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: "300px",
            }}
          ></div>
        );
      case "bauhaus-circles":
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundImage: `radial-gradient(circle, currentColor 2px, transparent 2px)`,
              backgroundSize: "20px 20px",
            }}
          ></div>
        );
      case "safety-lines":
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 20px)`,
              opacity: design.overlayOpacity * 0.5,
            }}
          ></div>
        );
      case "waves":
        return (
          <div
            {...commonProps}
            style={{
              ...commonProps.style,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='20' viewBox='0 0 100 20'%3E%3Cpath d='M0 10 Q 25 0 50 10 T 100 10' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: "100px 20px",
            }}
          ></div>
        );
      default:
        return null;
    }
  };

  const renderGuilloche = () => {
    if (design.guillocheComplexity === 0) return null;
    return (
      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply z-0 overflow-hidden"
        style={{ opacity: design.guillocheOpacity }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 1200"
          preserveAspectRatio="none"
        >
          <g fill="none" stroke={design.primaryColor} strokeWidth="0.4">
            {[...Array(design.guillocheComplexity * 10)].map((_, i) => (
              <ellipse
                key={i}
                cx="400"
                cy="600"
                rx={200 + i * 20}
                ry={350 + i * 15}
                transform={`rotate(${
                  i * (360 / (design.guillocheComplexity * 10))
                } 400 600)`}
              />
            ))}
          </g>
        </svg>
      </div>
    );
  };

  const handleImageUpload =
    (field: keyof CertificateDesign) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () =>
          onDesignChange({ ...design, [field]: reader.result as string });
        reader.readAsDataURL(file);
      }
    };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    try {
      const success = await saveCertificateToDb(data);
      if (success) {
        toast.success("✅ Certyfikat zapisany do bazy danych!");
      } else {
        toast.error("❌ Błąd podczas zapisywania certyfikatu");
      }
    } catch (error) {
      toast.error("❌ Błąd podczas zapisywania");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`flex flex-col md:flex-row bg-slate-100 h-screen overflow-hidden`}
    >
      {/* Sidebar Designer */}
      <div className="w-full md:w-80 bg-white border-r flex flex-col h-screen sticky top-0 z-50 shadow-2xl overflow-hidden print:hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-center">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              Master Designer 13.0
            </h2>
            <p className="text-[8px] font-bold uppercase opacity-50">
              {mode === "certificate" ? "A4 Layout" : "ID Card Layout"}
            </p>
          </div>
          <div className="p-2 bg-amber-500 rounded-lg text-white">
            {mode === "certificate" ? (
              <FileText size={14} />
            ) : (
              <CreditCard size={14} />
            )}
          </div>
        </div>

        {mode === "card" && (
          <div className="p-2 bg-slate-100 flex gap-1">
            <button
              onClick={() => setCardSide("front")}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                cardSide === "front"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Przód Karty
            </button>
            <button
              onClick={() => setCardSide("back")}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
                cardSide === "back"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Tył Karty
            </button>
          </div>
        )}

        <div className="flex bg-white border-b overflow-x-auto scrollbar-hide">
          {[
            { id: "layout", label: "Layout", icon: Settings },
            { id: "assets", label: "Assets", icon: Briefcase },
            { id: "typo", label: "Typo", icon: Type },
            { id: "visuals", label: "Visuals", icon: PaintBucket },
            { id: "matrix", label: "Matrix", icon: Move },
            { id: "security", label: "Security", icon: Lock },
            { id: "card", label: "Card", icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all min-w-[54px] ${
                activeTab === tab.id
                  ? "text-brand-600 border-b-2 border-brand-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <tab.icon size={13} />
              <span className="text-[8px] font-black uppercase tracking-tighter">
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 custom-scrollbar">
          {/* LAYOUT TAB */}
          {activeTab === "layout" && (
            <>
              <ToolSection
                id="orientation"
                title="Orientacja Dokumentu"
                icon={Settings}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      onDesignChange({ ...design, orientation: "portrait" })
                    }
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      design.orientation === "portrait"
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-8 h-12 border-2 border-current rounded" />
                    <span className="text-[8px] font-black uppercase">
                      Portrait
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      onDesignChange({ ...design, orientation: "landscape" })
                    }
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      design.orientation === "landscape"
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-12 h-8 border-2 border-current rounded" />
                    <span className="text-[8px] font-black uppercase">
                      Landscape
                    </span>
                  </button>
                </div>
              </ToolSection>

              <ToolSection
                id="document-size"
                title="Rozmiar Dokumentu"
                icon={FileText}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <div className="grid grid-cols-3 gap-2">
                  {["A4", "A5", "Letter"].map((size) => (
                    <button
                      key={size}
                      className="p-3 rounded-xl border-2 border-slate-200 hover:border-brand-500 text-[9px] font-black uppercase transition-all"
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-[8px] text-slate-400 mt-2">
                  * Więcej rozmiarów wkrótce
                </p>
              </ToolSection>

              <ToolSection
                id="margins"
                title="Marginesy (mm)"
                icon={Move}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <p className="text-[8px] text-slate-400 mb-3">
                  Domyślne marginesy: 25mm (wszystkie strony)
                </p>
                <div className="text-center text-[9px] text-slate-500 italic">
                  Kontrola marginesów dostępna w przyszłej wersji
                </div>
              </ToolSection>
            </>
          )}

          {activeTab === "assets" && (
            <ToolSection
              id="branding"
              title="Logos & Media"
              icon={Briefcase}
              openSections={openSections}
              onToggle={toggleSection}
            >
              <div className="grid grid-cols-2 gap-2">
                {/* LOGO */}
                <div className="relative">
                  <label
                    className={`bg-white p-3 border-2 rounded-xl cursor-pointer hover:border-brand-500 flex flex-col items-center gap-1 text-center ${
                      design.logoDataUrl
                        ? "border-green-500 bg-green-50"
                        : "border-dashed"
                    }`}
                  >
                    {design.logoDataUrl ? (
                      <img
                        src={design.logoDataUrl}
                        alt="Logo"
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span className="text-[7px] font-black">
                      {design.logoDataUrl ? "✓ LOGO" : "LOGO"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload("logoDataUrl")}
                    />
                  </label>
                  {design.logoDataUrl && (
                    <button
                      onClick={() =>
                        onDesignChange({ ...design, logoDataUrl: null })
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold hover:bg-red-600 shadow-md"
                      title="Usuń Logo"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* STAMP */}
                <div className="relative">
                  <label
                    className={`bg-white p-3 border-2 rounded-xl cursor-pointer hover:border-brand-500 flex flex-col items-center gap-1 text-center ${
                      design.stampDataUrl
                        ? "border-green-500 bg-green-50"
                        : "border-dashed"
                    }`}
                  >
                    {design.stampDataUrl ? (
                      <img
                        src={design.stampDataUrl}
                        alt="Stamp"
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Stamp size={14} />
                    )}
                    <span className="text-[7px] font-black">
                      {design.stampDataUrl ? "✓ STAMP" : "STAMP"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload("stampDataUrl")}
                    />
                  </label>
                  {design.stampDataUrl && (
                    <button
                      onClick={() =>
                        onDesignChange({ ...design, stampDataUrl: null })
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold hover:bg-red-600 shadow-md"
                      title="Usuń Stamp"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* STICKER */}
                <div className="relative">
                  <label
                    className={`bg-white p-3 border-2 rounded-xl cursor-pointer hover:border-brand-500 flex flex-col items-center gap-1 text-center ${
                      design.stickerDataUrl
                        ? "border-green-500 bg-green-50"
                        : "border-dashed"
                    }`}
                  >
                    {design.stickerDataUrl ? (
                      <img
                        src={design.stickerDataUrl}
                        alt="Sticker"
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <StickyNote size={14} />
                    )}
                    <span className="text-[7px] font-black">
                      {design.stickerDataUrl ? "✓ STICKER" : "STICKER"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload("stickerDataUrl")}
                    />
                  </label>
                  {design.stickerDataUrl && (
                    <button
                      onClick={() =>
                        onDesignChange({ ...design, stickerDataUrl: null })
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold hover:bg-red-600 shadow-md"
                      title="Usuń Sticker"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* SIGNATURE */}
                <div className="relative">
                  <label
                    className={`bg-white p-3 border-2 rounded-xl cursor-pointer hover:border-brand-500 flex flex-col items-center gap-1 text-center ${
                      design.signatureDataUrl
                        ? "border-green-500 bg-green-50"
                        : "border-dashed"
                    }`}
                  >
                    {design.signatureDataUrl ? (
                      <img
                        src={design.signatureDataUrl}
                        alt="Signature"
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <ShieldCheck size={14} />
                    )}
                    <span className="text-[7px] font-black">
                      {design.signatureDataUrl ? "✓ PODPIS" : "SIGNATURE"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload("signatureDataUrl")}
                    />
                  </label>
                  {design.signatureDataUrl && (
                    <button
                      onClick={() =>
                        onDesignChange({ ...design, signatureDataUrl: null })
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold hover:bg-red-600 shadow-md"
                      title="Usuń Podpis"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <SubHeader title="Przezroczystość" />
              <RangeField
                label="Logo Opacity"
                value={design.logoOpacity}
                min={0}
                max={1}
                step={0.05}
                field="logoOpacity"
                design={design}
                onChange={onDesignChange}
              />
              <RangeField
                label="Sticker Opacity"
                value={design.stickerOpacity}
                min={0}
                max={1}
                step={0.05}
                field="stickerOpacity"
                design={design}
                onChange={onDesignChange}
              />
              <RangeField
                label="Stamp Opacity"
                value={design.stampOpacity}
                min={0}
                max={1}
                step={0.05}
                field="stampOpacity"
                design={design}
                onChange={onDesignChange}
              />
              <RangeField
                label="Signature Opacity"
                value={design.signatureOpacity}
                min={0}
                max={1}
                step={0.05}
                field="signatureOpacity"
                design={design}
                onChange={onDesignChange}
              />
            </ToolSection>
          )}

          {activeTab === "matrix" && (
            <ToolSection
              id="pos-matrix"
              title="Global Matrix X/Y"
              icon={Move}
              openSections={openSections}
              onToggle={toggleSection}
            >
              <SubHeader title="Główne Logo" />
              <RangeField
                label="Scale"
                value={design.logoScale}
                min={0.2}
                max={3}
                step={0.1}
                field="logoScale"
                design={design}
                onChange={onDesignChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <RangeField
                  label="X"
                  value={design.logoOffsetX}
                  min={-800}
                  max={800}
                  step={2}
                  field="logoOffsetX"
                  design={design}
                  onChange={onDesignChange}
                />
                <RangeField
                  label="Y"
                  value={design.logoOffsetY}
                  min={-800}
                  max={800}
                  step={2}
                  field="logoOffsetY"
                  design={design}
                  onChange={onDesignChange}
                />
              </div>
              <SubHeader title="Kod QR" />
              <RangeField
                label="Scale"
                value={design.qrCodeScale}
                min={0.4}
                max={3}
                step={0.1}
                field="qrCodeScale"
                design={design}
                onChange={onDesignChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <RangeField
                  label="X"
                  value={design.qrCodeOffsetX}
                  min={-1000}
                  max={1000}
                  step={2}
                  field="qrCodeOffsetX"
                  design={design}
                  onChange={onDesignChange}
                />
                <RangeField
                  label="Y"
                  value={design.qrCodeOffsetY}
                  min={-1000}
                  max={1000}
                  step={2}
                  field="qrCodeOffsetY"
                  design={design}
                  onChange={onDesignChange}
                />
              </div>
              <SubHeader title="Naklejka" />
              <RangeField
                label="Scale"
                value={design.stickerScale}
                min={0.2}
                max={4}
                step={0.1}
                field="stickerScale"
                design={design}
                onChange={onDesignChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <RangeField
                  label="X"
                  value={design.stickerOffsetX}
                  min={-1200}
                  max={1200}
                  step={2}
                  field="stickerOffsetX"
                  design={design}
                  onChange={onDesignChange}
                />
                <RangeField
                  label="Y"
                  value={design.stickerOffsetY}
                  min={-1200}
                  max={1200}
                  step={2}
                  field="stickerOffsetY"
                  design={design}
                  onChange={onDesignChange}
                />
              </div>

              <SubHeader title="Podpis (Signature)" />
              <RangeField
                label="Scale"
                value={design.signatureScale}
                min={0.2}
                max={3}
                step={0.1}
                field="signatureScale"
                design={design}
                onChange={onDesignChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <RangeField
                  label="X"
                  value={design.signatureOffsetX}
                  min={-800}
                  max={800}
                  step={2}
                  field="signatureOffsetX"
                  design={design}
                  onChange={onDesignChange}
                />
                <RangeField
                  label="Y"
                  value={design.signatureOffsetY}
                  min={-800}
                  max={800}
                  step={2}
                  field="signatureOffsetY"
                  design={design}
                  onChange={onDesignChange}
                />
              </div>

              <SubHeader title="Pieczątka (Stamp)" />
              <RangeField
                label="Scale"
                value={design.stampScale}
                min={0.2}
                max={3}
                step={0.1}
                field="stampScale"
                design={design}
                onChange={onDesignChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <RangeField
                  label="X"
                  value={design.stampOffsetX}
                  min={-800}
                  max={800}
                  step={2}
                  field="stampOffsetX"
                  design={design}
                  onChange={onDesignChange}
                />
                <RangeField
                  label="Y"
                  value={design.stampOffsetY}
                  min={-800}
                  max={800}
                  step={2}
                  field="stampOffsetY"
                  design={design}
                  onChange={onDesignChange}
                />
              </div>
              <RangeField
                label="Rotacja"
                value={design.stampRotation}
                min={-180}
                max={180}
                step={5}
                field="stampRotation"
                design={design}
                onChange={onDesignChange}
              />
            </ToolSection>
          )}

          {activeTab === "visuals" && (
            <>
              <ToolSection
                id="gradient-engine"
                title="Hyper-Gradient Engine"
                icon={PaintBucket}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <SelectField
                  label="Typ Gradientu"
                  value={design.gradientType}
                  field="gradientType"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "linear", label: "Linearne" },
                    { value: "radial", label: "Radialne" },
                    { value: "mesh", label: "Mesh (3 kolory)" },
                    { value: "ocean", label: "Ocean Deep" },
                    { value: "cosmic", label: "Cosmic Purple" },
                    { value: "vibrant", label: "Vibrant Energy" },
                  ]}
                />
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {design.gradientColors.map((c, i) => (
                    <input
                      key={i}
                      type="color"
                      value={c}
                      onChange={(e) => {
                        const newCols = [...design.gradientColors] as [
                          string,
                          string,
                          string
                        ];
                        newCols[i] = e.target.value;
                        onDesignChange({ ...design, gradientColors: newCols });
                      }}
                      className="w-full h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                    />
                  ))}
                </div>
              </ToolSection>
              <ToolSection
                id="overlays"
                title="Figury Geometryczne"
                icon={Shapes}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <SelectField
                  label="Typ Figury"
                  value={design.overlayShape}
                  field="overlayShape"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "none", label: "Brak" },
                    { value: "circuit-board", label: "Elektronika" },
                    { value: "topographic", label: "Mapa Topo" },
                    { value: "hexagon-mesh", label: "Plaster miodu" },
                    { value: "waves", label: "Fale" },
                  ]}
                />
                <RangeField
                  label="Przezroczystość"
                  value={design.overlayOpacity}
                  min={0}
                  max={1}
                  step={0.05}
                  field="overlayOpacity"
                  design={design}
                  onChange={onDesignChange}
                />
              </ToolSection>

              {/* Colors & Border Section */}
              <ToolSection
                id="colors-border"
                title="Kolory i Ramki"
                icon={Palette}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <SubHeader title="Kolory Główne" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                      Primary
                    </label>
                    <input
                      type="color"
                      value={design.primaryColor}
                      onChange={(e) =>
                        onDesignChange({
                          ...design,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-full h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                      Accent
                    </label>
                    <input
                      type="color"
                      value={design.accentColor}
                      onChange={(e) =>
                        onDesignChange({
                          ...design,
                          accentColor: e.target.value,
                        })
                      }
                      className="w-full h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                    />
                  </div>
                </div>
                <SubHeader title="Ramka Dokumentu" />
                <SelectField
                  label="Styl Ramki"
                  value={design.borderStyle}
                  field="borderStyle"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "none", label: "Brak" },
                    { value: "solid", label: "Ciągła" },
                    { value: "double", label: "Podwójna" },
                    { value: "dashed", label: "Przerywana" },
                    { value: "ornamental", label: "Ozdobna" },
                  ]}
                />
                <RangeField
                  label="Grubość Ramki"
                  value={design.borderWidth}
                  min={0}
                  max={10}
                  step={1}
                  field="borderWidth"
                  design={design}
                  onChange={onDesignChange}
                />
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                    Kolor Ramki
                  </label>
                  <input
                    type="color"
                    value={design.borderColor}
                    onChange={(e) =>
                      onDesignChange({ ...design, borderColor: e.target.value })
                    }
                    className="w-full h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                  />
                </div>
              </ToolSection>

              {/* Paper & Seals */}
              <ToolSection
                id="paper-seals"
                title="Tekstura i Pieczęcie"
                icon={Award}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <SelectField
                  label="Tekstura Papieru"
                  value={design.paperTexture}
                  field="paperTexture"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "none", label: "Brak" },
                    { value: "linen", label: "Len" },
                    { value: "parchment", label: "Pergamin" },
                    { value: "fiber", label: "Włókna" },
                    { value: "grain", label: "Ziarnisty" },
                    { value: "cotton", label: "Bawełna" },
                  ]}
                />
                <SubHeader title="Pieczęć Oficjalna" />
                <SelectField
                  label="Styl Pieczęci"
                  value={design.sealStyle}
                  field="sealStyle"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "none", label: "Brak" },
                    { value: "gold-embossed", label: "Złota Tłoczona" },
                    { value: "silver-embossed", label: "Srebrna Tłoczona" },
                    { value: "red-wax", label: "Czerwona Lakowa" },
                    { value: "modern-blue", label: "Nowoczesna Niebieska" },
                    { value: "holographic", label: "Holograficzna" },
                  ]}
                />
                <SubHeader title="Wstążka" />
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={design.showRibbon}
                    onChange={(e) =>
                      onDesignChange({
                        ...design,
                        showRibbon: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Pokaż Wstążkę
                  </span>
                </div>
                {design.showRibbon && (
                  <>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                        Kolor Wstążki
                      </label>
                      <input
                        type="color"
                        value={design.ribbonColor}
                        onChange={(e) =>
                          onDesignChange({
                            ...design,
                            ribbonColor: e.target.value,
                          })
                        }
                        className="w-full h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                      />
                    </div>
                    <SelectField
                      label="Pozycja Wstążki"
                      value={design.ribbonPosition}
                      field="ribbonPosition"
                      design={design}
                      onChange={onDesignChange}
                      options={[
                        { value: "top-right", label: "Góra Prawa" },
                        { value: "top-left", label: "Góra Lewa" },
                        { value: "bottom-right", label: "Dół Prawa" },
                        { value: "bottom-left", label: "Dół Lewa" },
                      ]}
                    />
                  </>
                )}
              </ToolSection>
            </>
          )}

          {/* TYPO TAB */}
          {activeTab === "typo" && (
            <>
              <ToolSection
                id="typography-main"
                title="Typografia Główna"
                icon={Type}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <SelectField
                  label="Rodzina Fontów"
                  value={design.fontFamily}
                  field="fontFamily"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "modern", label: "Modern (Sans)" },
                    { value: "serif", label: "Klasyczny (Serif)" },
                    { value: "royal", label: "Royal (Elegancki)" },
                    { value: "classic", label: "Classic (Tradycyjny)" },
                    { value: "sans", label: "Sans-Serif" },
                    { value: "standard", label: "Standard" },
                    { value: "mono", label: "Monospace" },
                    { value: "condensed", label: "Condensed" },
                    { value: "industrial", label: "Industrial" },
                  ]}
                />
                <SelectField
                  label="Tryb Designu"
                  value={design.themeMode}
                  field="themeMode"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "modern", label: "Nowoczesny" },
                    { value: "classic", label: "Klasyczny" },
                    { value: "minimal", label: "Minimalistyczny" },
                  ]}
                />
                <div className="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    checked={design.isBilingual}
                    onChange={(e) =>
                      onDesignChange({
                        ...design,
                        isBilingual: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Certyfikat Dwujęzyczny (NL/PL)
                  </span>
                </div>
              </ToolSection>

              <ToolSection
                id="title-style"
                title="Styl Tytułu"
                icon={Type}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <RangeField
                  label="Skala Tytułu"
                  value={design.scaleTitle}
                  min={0.5}
                  max={2}
                  step={0.05}
                  field="scaleTitle"
                  design={design}
                  onChange={onDesignChange}
                />
                <SelectField
                  label="Grubość Fontu"
                  value={design.fontWeightTitle}
                  field="fontWeightTitle"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "400", label: "Regular" },
                    { value: "500", label: "Medium" },
                    { value: "600", label: "Semi Bold" },
                    { value: "700", label: "Bold" },
                    { value: "800", label: "Extra Bold" },
                    { value: "900", label: "Black" },
                  ]}
                />
                <RangeField
                  label="Letter Spacing"
                  value={design.letterSpacingTitle}
                  min={-5}
                  max={20}
                  step={0.5}
                  field="letterSpacingTitle"
                  design={design}
                  onChange={onDesignChange}
                />
              </ToolSection>

              <ToolSection
                id="name-style"
                title="Styl Nazwiska"
                icon={User}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <RangeField
                  label="Skala Nazwiska"
                  value={design.scaleName}
                  min={0.5}
                  max={2}
                  step={0.05}
                  field="scaleName"
                  design={design}
                  onChange={onDesignChange}
                />
                <SelectField
                  label="Grubość Fontu"
                  value={design.fontWeightName}
                  field="fontWeightName"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "400", label: "Regular" },
                    { value: "500", label: "Medium" },
                    { value: "600", label: "Semi Bold" },
                    { value: "700", label: "Bold" },
                    { value: "800", label: "Extra Bold" },
                    { value: "900", label: "Black" },
                  ]}
                />
                <RangeField
                  label="Letter Spacing"
                  value={design.letterSpacingName}
                  min={-5}
                  max={20}
                  step={0.5}
                  field="letterSpacingName"
                  design={design}
                  onChange={onDesignChange}
                />
              </ToolSection>

              <ToolSection
                id="details-style"
                title="Styl Szczegółów"
                icon={FileText}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <RangeField
                  label="Skala Tekstu"
                  value={design.scaleDetails}
                  min={0.5}
                  max={2}
                  step={0.05}
                  field="scaleDetails"
                  design={design}
                  onChange={onDesignChange}
                />
                <RangeField
                  label="Wysokość Linii"
                  value={design.lineHeightDetails}
                  min={1}
                  max={3}
                  step={0.1}
                  field="lineHeightDetails"
                  design={design}
                  onChange={onDesignChange}
                />
                <SelectField
                  label="Wyrównanie Opisu"
                  value={design.descriptionAlign}
                  field="descriptionAlign"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "left", label: "Do Lewej" },
                    { value: "center", label: "Wyśrodkowane" },
                    { value: "justify", label: "Wyjustowane" },
                  ]}
                />
              </ToolSection>
            </>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <>
              <ToolSection
                id="guilloche-sec"
                title="Guilloche Pattern"
                icon={Shield}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <RangeField
                  label="Złożoność"
                  value={design.guillocheComplexity}
                  min={0}
                  max={10}
                  step={1}
                  field="guillocheComplexity"
                  design={design}
                  onChange={onDesignChange}
                />
                <RangeField
                  label="Przezroczystość"
                  value={design.guillocheOpacity}
                  min={0}
                  max={0.3}
                  step={0.01}
                  field="guillocheOpacity"
                  design={design}
                  onChange={onDesignChange}
                />
              </ToolSection>

              <ToolSection
                id="security-features"
                title="Funkcje Bezpieczeństwa"
                icon={Lock}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={design.useMicrotextBorder}
                    onChange={(e) =>
                      onDesignChange({
                        ...design,
                        useMicrotextBorder: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Ramka Mikrotekstowa
                  </span>
                </div>
                <RangeField
                  label="Ghost Photo Opacity"
                  value={design.ghostPhotoOpacity}
                  min={0}
                  max={0.5}
                  step={0.01}
                  field="ghostPhotoOpacity"
                  design={design}
                  onChange={onDesignChange}
                />
                <RangeField
                  label="Security Fibers"
                  value={design.securityFibersOpacity}
                  min={0}
                  max={0.2}
                  step={0.01}
                  field="securityFibersOpacity"
                  design={design}
                  onChange={onDesignChange}
                />
              </ToolSection>

              <ToolSection
                id="watermark-sec"
                title="Znak Wodny"
                icon={Activity}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <input
                  type="text"
                  value={design.watermarkText}
                  onChange={(e) =>
                    onDesignChange({ ...design, watermarkText: e.target.value })
                  }
                  placeholder="Tekst znaku wodnego..."
                  className="w-full px-3 py-2 text-[10px] border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <RangeField
                  label="Przezroczystość"
                  value={design.watermarkOpacity}
                  min={0}
                  max={0.5}
                  step={0.01}
                  field="watermarkOpacity"
                  design={design}
                  onChange={onDesignChange}
                />
              </ToolSection>

              <ToolSection
                id="shadow-sec"
                title="Cień Dokumentu"
                icon={Layers}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
                    Kolor Cienia
                  </label>
                  <input
                    type="color"
                    value={design.shadowColor}
                    onChange={(e) =>
                      onDesignChange({ ...design, shadowColor: e.target.value })
                    }
                    className="w-full h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                  />
                </div>
                <RangeField
                  label="Przezroczystość Cienia"
                  value={design.shadowOpacity}
                  min={0}
                  max={1}
                  step={0.05}
                  field="shadowOpacity"
                  design={design}
                  onChange={onDesignChange}
                />
                <RangeField
                  label="Rozmycie Cienia"
                  value={design.shadowBlur}
                  min={0}
                  max={100}
                  step={5}
                  field="shadowBlur"
                  design={design}
                  onChange={onDesignChange}
                />
              </ToolSection>
            </>
          )}

          {/* CARD MODE TAB - FULL REDESIGN */}
          {activeTab === "card" && (
            <>
              {/* === PRZÓD KARTY === */}
              <SubHeader title="🎴 PRZÓD KARTY" />

              <ToolSection
                id="card-shape"
                title="Kształt Karty"
                icon={CreditCard}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <RangeField
                  label="Zaokrąglenie Rogów (px)"
                  value={design.cardCornerRadius}
                  min={0}
                  max={24}
                  step={1}
                  field="cardCornerRadius"
                  design={design}
                  onChange={onDesignChange}
                />
                <div className="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    checked={design.cardUseCustomFrontGradient}
                    onChange={(e) =>
                      onDesignChange({
                        ...design,
                        cardUseCustomFrontGradient: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Własny gradient tła przodu
                  </span>
                </div>
                {design.cardUseCustomFrontGradient && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {design.cardFrontGradientColors.map((c, i) => (
                      <input
                        key={i}
                        type="color"
                        value={c}
                        onChange={(e) => {
                          const newCols = [
                            ...design.cardFrontGradientColors,
                          ] as [string, string, string];
                          newCols[i] = e.target.value;
                          onDesignChange({
                            ...design,
                            cardFrontGradientColors: newCols,
                          });
                        }}
                        className="w-full h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                      />
                    ))}
                  </div>
                )}
              </ToolSection>

              <ToolSection
                id="card-photo"
                title="Zdjęcie Profilowe"
                icon={User}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <SelectField
                  label="Kształt Zdjęcia"
                  value={design.cardPhotoShape}
                  field="cardPhotoShape"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "rounded", label: "Zaokrąglony prostokąt" },
                    { value: "circle", label: "Koło" },
                    { value: "square", label: "Kwadrat" },
                  ]}
                />
                <RangeField
                  label="Grubość Ramki"
                  value={design.cardPhotoBorderWidth}
                  min={0}
                  max={6}
                  step={0.5}
                  field="cardPhotoBorderWidth"
                  design={design}
                  onChange={onDesignChange}
                />
                <div className="mt-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1.5">
                    Kolor Ramki
                  </label>
                  <input
                    type="color"
                    value={design.cardPhotoBorderColor}
                    onChange={(e) =>
                      onDesignChange({
                        ...design,
                        cardPhotoBorderColor: e.target.value,
                      })
                    }
                    className="w-full h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    checked={design.cardPhotoShadow}
                    onChange={(e) =>
                      onDesignChange({
                        ...design,
                        cardPhotoShadow: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Cień za zdjęciem
                  </span>
                </div>
              </ToolSection>

              <ToolSection
                id="card-text-colors"
                title="Kolory Tekstu"
                icon={Type}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1.5">
                      Kolor Imienia
                    </label>
                    <input
                      type="color"
                      value={design.cardNameColor}
                      onChange={(e) =>
                        onDesignChange({
                          ...design,
                          cardNameColor: e.target.value,
                        })
                      }
                      className="w-full h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1.5">
                      Kolor Badge Roli
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[7px] text-slate-400">Tło</span>
                        <input
                          type="color"
                          value={design.cardRoleBgColor}
                          onChange={(e) =>
                            onDesignChange({
                              ...design,
                              cardRoleBgColor: e.target.value,
                            })
                          }
                          className="w-full h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                        />
                      </div>
                      <div>
                        <span className="text-[7px] text-slate-400">Tekst</span>
                        <input
                          type="color"
                          value={design.cardRoleColor}
                          onChange={(e) =>
                            onDesignChange({
                              ...design,
                              cardRoleColor: e.target.value,
                            })
                          }
                          className="w-full h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1.5">
                      Kolor Detali (ID, data)
                    </label>
                    <input
                      type="color"
                      value={design.cardDetailsColor}
                      onChange={(e) =>
                        onDesignChange({
                          ...design,
                          cardDetailsColor: e.target.value,
                        })
                      }
                      className="w-full h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                    />
                  </div>
                </div>
              </ToolSection>

              <ToolSection
                id="card-chip"
                title="Chip EMV"
                icon={Star}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={design.cardShowChip}
                    onChange={(e) =>
                      onDesignChange({
                        ...design,
                        cardShowChip: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Pokaż Chip EMV
                  </span>
                </div>
                {design.cardShowChip && (
                  <>
                    <SelectField
                      label="Styl Chipa"
                      value={design.cardChipStyle}
                      field="cardChipStyle"
                      design={design}
                      onChange={onDesignChange}
                      options={[
                        { value: "gold", label: "🥇 Złoty" },
                        { value: "silver", label: "🥈 Srebrny" },
                      ]}
                    />
                    <RangeField
                      label="Pozycja X"
                      value={design.cardChipPositionX}
                      min={0}
                      max={100}
                      step={2}
                      field="cardChipPositionX"
                      design={design}
                      onChange={onDesignChange}
                    />
                    <RangeField
                      label="Pozycja Y"
                      value={design.cardChipPositionY}
                      min={0}
                      max={100}
                      step={2}
                      field="cardChipPositionY"
                      design={design}
                      onChange={onDesignChange}
                    />
                  </>
                )}
              </ToolSection>

              <ToolSection
                id="card-hologram"
                title="Hologram & Zabezpieczenia"
                icon={Sparkles}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <RangeField
                  label="Intensywność Hologramu"
                  value={design.cardHologramIntensity}
                  min={0}
                  max={1}
                  step={0.05}
                  field="cardHologramIntensity"
                  design={design}
                  onChange={onDesignChange}
                />
                <SelectField
                  label="Wzór Zabezpieczeń"
                  value={design.cardSecurityPattern}
                  field="cardSecurityPattern"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "none", label: "Brak" },
                    { value: "holographic", label: "Holograficzny" },
                    { value: "guilloche", label: "Guilloche" },
                    { value: "microtext", label: "Mikrotekst" },
                  ]}
                />
              </ToolSection>

              {/* === TYŁ KARTY === */}
              <SubHeader title="🔄 TYŁ KARTY" />

              <ToolSection
                id="card-back-gradient"
                title="Gradient Tyłu"
                icon={Palette}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <SelectField
                  label="Typ Gradientu"
                  value={design.cardBackGradientType}
                  field="cardBackGradientType"
                  design={design}
                  onChange={onDesignChange}
                  options={[
                    { value: "linear", label: "Liniowy" },
                    { value: "radial", label: "Radialny" },
                    { value: "solid", label: "Jednolity kolor" },
                  ]}
                />
                <p className="text-[8px] text-slate-400 mb-2 mt-4">
                  Kolory gradientu (od lewej do prawej)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {design.cardBackGradientColors.map((c, i) => (
                    <input
                      key={i}
                      type="color"
                      value={c}
                      onChange={(e) => {
                        const newCols = [...design.cardBackGradientColors] as [
                          string,
                          string,
                          string
                        ];
                        newCols[i] = e.target.value;
                        onDesignChange({
                          ...design,
                          cardBackGradientColors: newCols,
                        });
                      }}
                      className="w-full h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                    />
                  ))}
                </div>
              </ToolSection>

              <ToolSection
                id="card-magstripe"
                title="Pasek Magnetyczny"
                icon={Settings}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={design.cardShowMagStripe}
                    onChange={(e) =>
                      onDesignChange({
                        ...design,
                        cardShowMagStripe: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Pokaż Pasek Magnetyczny
                  </span>
                </div>
                {design.cardShowMagStripe && (
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1.5">
                      Kolor Paska
                    </label>
                    <input
                      type="color"
                      value={design.cardMagStripeColor}
                      onChange={(e) =>
                        onDesignChange({
                          ...design,
                          cardMagStripeColor: e.target.value,
                        })
                      }
                      className="w-full h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                    />
                  </div>
                )}
              </ToolSection>

              <ToolSection
                id="card-barcode"
                title="Kod Kreskowy"
                icon={Star}
                openSections={openSections}
                onToggle={toggleSection}
              >
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={design.cardShowBarcode}
                    onChange={(e) =>
                      onDesignChange({
                        ...design,
                        cardShowBarcode: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <span className="text-[9px] font-bold text-slate-600">
                    Pokaż Kod Kreskowy (tył)
                  </span>
                </div>
                {design.cardShowBarcode && (
                  <SelectField
                    label="Typ Kodu"
                    value={design.cardBarcodeType}
                    field="cardBarcodeType"
                    design={design}
                    onChange={onDesignChange}
                    options={[
                      { value: "code128", label: "Code 128" },
                      { value: "code39", label: "Code 39" },
                      { value: "ean13", label: "EAN-13" },
                    ]}
                  />
                )}
              </ToolSection>

              <div className="p-4 bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-200 rounded-xl">
                <p className="text-[9px] text-brand-700 font-bold flex items-center gap-2">
                  <Info size={12} />
                  Przełącz na tryb "Karta ID" u góry i użyj przycisku "OBRÓĆ
                  KARTĘ" aby zobaczyć przód/tył
                </p>
              </div>
            </>
          )}
        </div>

        {/* UNDO/REDO Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex-1 h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-95"
              title={`Cofnij (${historyIndex}/${designHistory.length - 1})`}
            >
              <Undo2 size={14} />
              Cofnij
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex-1 h-10 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-95"
              title={`Ponów (${historyIndex + 1}/${designHistory.length - 1})`}
            >
              <Redo2 size={14} />
              Ponów
            </button>
            <button
              onClick={handleResetToDefault}
              className="h-10 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 active:scale-95"
              title="Resetuj do stanu początkowego"
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <div className="text-[8px] text-slate-400 text-center font-medium">
            Historia: {historyIndex + 1} / {designHistory.length} kroków (maks.{" "}
            {MAX_HISTORY})
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-white border-t space-y-2">
          <button
            onClick={handleSaveToDatabase}
            disabled={saving}
            className="w-full bg-emerald-600 text-white h-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
          >
            <Database size={16} />{" "}
            {saving ? "Zapisywanie..." : "ZAPISZ DO BAZY"}
          </button>
          <button
            onClick={() => window.print()}
            className="w-full bg-slate-900 text-white h-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <Printer size={16} /> DRUKUJ PROJEKT
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8 relative bg-slate-200/50 overflow-hidden"
      >
        {mode === "card" && (
          <button
            onClick={() => setCardSide(cardSide === "front" ? "back" : "front")}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 font-black text-[11px] uppercase tracking-widest text-brand-600 hover:bg-brand-600 hover:text-white transition-all z-[100] border border-brand-100"
          >
            <RefreshCw
              size={16}
              className={cardSide === "back" ? "rotate-180" : ""}
            />
            OBRÓĆ KARTĘ ( {cardSide === "front" ? "TYŁ" : "PRZÓD"} )
          </button>
        )}

        <div
          style={{
            transform: `scale(${previewScale})`,
            transformOrigin: "center center",
            transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            className="shadow-2xl relative overflow-hidden print:shadow-none"
            style={{
              ...renderBackground(),
              ...(mode === "card" &&
              design.cardUseCustomFrontGradient &&
              cardSide === "front"
                ? {
                    background: `linear-gradient(135deg, ${design.cardFrontGradientColors[0]}, ${design.cardFrontGradientColors[1]}, ${design.cardFrontGradientColors[2]})`,
                  }
                : {}),
              ...(mode === "card" && cardSide === "back"
                ? {
                    background:
                      design.cardBackGradientType === "solid"
                        ? design.cardBackGradientColors[0]
                        : design.cardBackGradientType === "radial"
                        ? `radial-gradient(circle, ${design.cardBackGradientColors[0]}, ${design.cardBackGradientColors[1]}, ${design.cardBackGradientColors[2]})`
                        : `linear-gradient(135deg, ${design.cardBackGradientColors[0]}, ${design.cardBackGradientColors[1]}, ${design.cardBackGradientColors[2]})`,
                  }
                : {}),
              width:
                mode === "certificate"
                  ? design.orientation === "landscape"
                    ? "297mm"
                    : "210mm"
                  : "85.6mm",
              height:
                mode === "certificate"
                  ? design.orientation === "landscape"
                    ? "210mm"
                    : "297mm"
                  : "53.98mm",
              padding: mode === "certificate" ? "25mm" : "0",
              borderRadius:
                mode === "certificate" ? "0" : `${design.cardCornerRadius}px`,
              border: `${design.borderWidth}px ${
                design.borderStyle === "ornamental"
                  ? "double"
                  : design.borderStyle
              } ${design.borderColor}`,
            }}
          >
            {/* Background Decorations */}
            {renderOverlay()}
            {renderGuilloche()}

            {/* RIBBON - Wstążka */}
            {design.showRibbon && (
              <div
                className={`absolute z-30 ${
                  design.ribbonPosition === "top-right"
                    ? "top-0 right-0"
                    : design.ribbonPosition === "top-left"
                    ? "top-0 left-0"
                    : design.ribbonPosition === "bottom-right"
                    ? "bottom-0 right-0"
                    : "bottom-0 left-0"
                }`}
                style={{
                  transform: design.ribbonPosition.includes("right")
                    ? "rotate(45deg) translate(25%, -50%)"
                    : "rotate(-45deg) translate(-25%, -50%)",
                }}
              >
                <div
                  className="px-16 py-2 text-white font-black text-sm uppercase tracking-widest shadow-lg"
                  style={{ backgroundColor: design.ribbonColor }}
                >
                  CERTIFIED
                </div>
              </div>
            )}

            {/* CONTENT LAYER */}
            <div
              className={`relative h-full w-full z-20 ${
                mode === "card" ? "p-6" : "p-0"
              }`}
            >
              {/* CERTIFICATE A4 MODE */}
              {mode === "certificate" && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12">
                  <div
                    style={{
                      transform: `translate(${design.logoOffsetX}px, ${design.logoOffsetY}px) scale(${design.logoScale})`,
                      opacity: design.logoOpacity,
                    }}
                  >
                    {design.logoDataUrl ? (
                      <img
                        src={design.logoDataUrl}
                        className="h-32 object-contain"
                        alt="Logo"
                      />
                    ) : (
                      <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl">
                        <ShieldCheck size={80} />
                      </div>
                    )}
                  </div>
                  <div className="mt-16 w-full">
                    <h1
                      className="mb-8 uppercase italic"
                      style={{
                        color: design.primaryColor,
                        fontSize: `${3.8 * design.scaleTitle}rem`,
                        fontWeight: design.fontWeightTitle,
                        letterSpacing: `${design.letterSpacingTitle}px`,
                      }}
                    >
                      {L("Certificaat", "Certyfikat")}
                    </h1>
                    <p className="text-slate-400 font-black text-2xl italic mb-14 uppercase tracking-widest">
                      {L(
                        "Hiermee wordt bevestigd dat de heer / mevrouw:",
                        "Niniejszym potwierdza się, że pan / pani:"
                      )}
                    </p>
                    <h2
                      className="mb-16 uppercase"
                      style={{
                        color: design.primaryColor,
                        fontSize: `${3.4 * design.scaleName}rem`,
                        fontWeight: design.fontWeightName,
                        letterSpacing: `${design.letterSpacingName}px`,
                      }}
                    >
                      {data.candidateName}
                    </h2>
                    <div
                      className="text-2xl text-slate-700 max-w-5xl px-24 leading-relaxed"
                      style={{
                        fontSize: `${1.15 * design.scaleDetails}rem`,
                        lineHeight: design.lineHeightDetails,
                        fontWeight: design.fontWeightDetails,
                        textAlign: design.descriptionAlign,
                      }}
                    >
                      {data.description}
                    </div>
                  </div>
                </div>
              )}

              {/* ID CARD - FRONT */}
              {mode === "card" && cardSide === "front" && (
                <div className="h-full flex flex-col justify-between relative">
                  {/* HOLOGRAM EFFECT */}
                  {design.cardHologramIntensity > 0 && (
                    <div
                      className="absolute top-2 right-2 w-8 h-8 rounded-full pointer-events-none z-40"
                      style={{
                        background: `conic-gradient(from 0deg, 
                          rgba(255,0,0,${design.cardHologramIntensity * 0.6}), 
                          rgba(255,165,0,${
                            design.cardHologramIntensity * 0.6
                          }), 
                          rgba(255,255,0,${
                            design.cardHologramIntensity * 0.6
                          }), 
                          rgba(0,255,0,${design.cardHologramIntensity * 0.6}), 
                          rgba(0,255,255,${
                            design.cardHologramIntensity * 0.6
                          }), 
                          rgba(0,0,255,${design.cardHologramIntensity * 0.6}), 
                          rgba(255,0,255,${
                            design.cardHologramIntensity * 0.6
                          }), 
                          rgba(255,0,0,${design.cardHologramIntensity * 0.6})
                        )`,
                        animation: "spin 4s linear infinite",
                        opacity: design.cardHologramIntensity,
                        boxShadow: `0 0 15px rgba(255,255,255,${
                          design.cardHologramIntensity * 0.5
                        })`,
                      }}
                    />
                  )}

                  {/* EMV CHIP */}
                  {design.cardShowChip && (
                    <div
                      className="absolute z-30"
                      style={{
                        left: `${design.cardChipPositionX}%`,
                        top: `${design.cardChipPositionY}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <svg width="36" height="28" viewBox="0 0 36 28">
                        <rect
                          x="1"
                          y="1"
                          width="34"
                          height="26"
                          rx="3"
                          fill={
                            design.cardChipStyle === "gold"
                              ? "#D4AF37"
                              : "#C0C0C0"
                          }
                          stroke={
                            design.cardChipStyle === "gold"
                              ? "#B8860B"
                              : "#A8A8A8"
                          }
                          strokeWidth="1"
                        />
                        {/* Chip contacts */}
                        <rect
                          x="4"
                          y="4"
                          width="10"
                          height="8"
                          rx="1"
                          fill={
                            design.cardChipStyle === "gold"
                              ? "#FFD700"
                              : "#D3D3D3"
                          }
                        />
                        <rect
                          x="4"
                          y="16"
                          width="10"
                          height="8"
                          rx="1"
                          fill={
                            design.cardChipStyle === "gold"
                              ? "#FFD700"
                              : "#D3D3D3"
                          }
                        />
                        <rect
                          x="18"
                          y="4"
                          width="14"
                          height="8"
                          rx="1"
                          fill={
                            design.cardChipStyle === "gold"
                              ? "#FFD700"
                              : "#D3D3D3"
                          }
                        />
                        <rect
                          x="18"
                          y="16"
                          width="14"
                          height="8"
                          rx="1"
                          fill={
                            design.cardChipStyle === "gold"
                              ? "#FFD700"
                              : "#D3D3D3"
                          }
                        />
                        {/* Lines */}
                        <line
                          x1="15"
                          y1="8"
                          x2="17"
                          y2="8"
                          stroke={
                            design.cardChipStyle === "gold" ? "#8B7355" : "#888"
                          }
                          strokeWidth="0.5"
                        />
                        <line
                          x1="15"
                          y1="20"
                          x2="17"
                          y2="20"
                          stroke={
                            design.cardChipStyle === "gold" ? "#8B7355" : "#888"
                          }
                          strokeWidth="0.5"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Security Pattern Overlay */}
                  {design.cardSecurityPattern !== "none" && (
                    <div
                      className="absolute inset-0 pointer-events-none z-10 opacity-10"
                      style={{
                        background:
                          design.cardSecurityPattern === "holographic"
                            ? "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)"
                            : design.cardSecurityPattern === "guilloche"
                            ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 20 Q10 0, 20 20 T40 20' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E\")"
                            : "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
                      }}
                    />
                  )}

                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div
                      style={{
                        transform: `translate(${design.logoOffsetX}px, ${
                          design.logoOffsetY
                        }px) scale(${design.logoScale * 0.4})`,
                        opacity: design.logoOpacity,
                        transformOrigin: "top left",
                      }}
                    >
                      {design.logoDataUrl ? (
                        <img
                          src={design.logoDataUrl}
                          className="h-10 object-contain"
                          alt=""
                        />
                      ) : (
                        <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg">
                          <ShieldCheck size={20} />
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className="text-[6px] font-black uppercase tracking-widest block mb-0.5"
                        style={{ color: design.cardDetailsColor }}
                      >
                        ID CARD / KARTA IDENTYFIKACYJNA
                      </span>
                      <span
                        className="text-[8.5px] font-black tracking-tighter"
                        style={{ color: design.cardRoleBgColor }}
                      >
                        ZZP WERKPLAATS B.V.
                      </span>
                    </div>
                  </div>

                  {/* Photo & Info */}
                  <div className="flex gap-5 items-center my-2">
                    <div
                      className={`w-24 h-28 bg-white/30 backdrop-blur-md overflow-hidden flex-shrink-0 p-0.5
                        ${
                          design.cardPhotoShape === "circle"
                            ? "rounded-full"
                            : design.cardPhotoShape === "square"
                            ? "rounded-none"
                            : "rounded-xl"
                        }
                      `}
                      style={{
                        border: `${design.cardPhotoBorderWidth}px solid ${design.cardPhotoBorderColor}`,
                        boxShadow: design.cardPhotoShadow
                          ? "0 10px 40px rgba(0,0,0,0.3)"
                          : "none",
                      }}
                    >
                      {data.candidatePhoto ? (
                        <img
                          src={data.candidatePhoto}
                          className={`w-full h-full object-cover ${
                            design.cardPhotoShape === "circle"
                              ? "rounded-full"
                              : design.cardPhotoShape === "square"
                              ? "rounded-none"
                              : "rounded-lg"
                          }`}
                          alt=""
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-300 bg-slate-50/50">
                          <User size={32} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 py-1">
                      <h2
                        className="text-[14.5px] font-black uppercase leading-none mb-1.5 tracking-tighter"
                        style={{ color: design.cardNameColor }}
                      >
                        {data.candidateName}
                      </h2>
                      <div
                        className="text-[7.5px] font-black px-2.5 py-1 rounded-full inline-block border border-white/30 uppercase shadow-sm mb-3 tracking-wide"
                        style={{
                          backgroundColor: design.cardRoleBgColor,
                          color: design.cardRoleColor,
                        }}
                      >
                        {data.role}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[5.5px] font-black uppercase"
                            style={{ color: design.cardDetailsColor }}
                          >
                            Numer ID:
                          </span>
                          <span
                            className="text-[7.5px] font-black"
                            style={{ color: design.cardNameColor }}
                          >
                            {data.certificateNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[5.5px] font-black uppercase"
                            style={{ color: design.cardDetailsColor }}
                          >
                            Ważne do:
                          </span>
                          <span
                            className="text-[7.5px] font-black"
                            style={{ color: design.cardRoleBgColor }}
                          >
                            {data.issueDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STAMP on front card */}
                  {design.stampDataUrl && (
                    <div
                      className="absolute z-30 pointer-events-none"
                      style={{
                        right: "8px",
                        bottom: "35px",
                        transform: `scale(${
                          design.stampScale * 0.5
                        }) translate(${design.stampOffsetX}px, ${
                          design.stampOffsetY
                        }px)`,
                        opacity: design.stampOpacity,
                        transformOrigin: "bottom right",
                      }}
                    >
                      <img
                        src={design.stampDataUrl}
                        className="w-12 h-12 object-contain"
                        alt="Stamp"
                      />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between items-end pt-2 border-t border-black/5">
                    <div className="flex items-center gap-2 bg-white/60 px-2.5 py-1.5 rounded-lg border border-white/50 shadow-sm">
                      <Globe
                        size={9}
                        style={{ color: design.cardRoleBgColor }}
                      />
                      <span
                        className="text-[5.5px] font-black uppercase tracking-[0.1em]"
                        style={{ color: design.cardNameColor }}
                      >
                        WWW.ZZPWERKPLAATS.NL
                      </span>
                    </div>
                    <div
                      className="text-[5px] font-black uppercase tracking-widest italic opacity-60"
                      style={{ color: design.cardDetailsColor }}
                    >
                      Verified Document
                    </div>
                  </div>
                </div>
              )}

              {/* ID CARD - BACK */}
              {mode === "card" && cardSide === "back" && (
                <div className="h-full flex flex-col relative">
                  {/* MAGNETIC STRIPE */}
                  {design.cardShowMagStripe && (
                    <div
                      className="absolute top-3 left-0 right-0 h-[8px]"
                      style={{ backgroundColor: design.cardMagStripeColor }}
                    />
                  )}

                  {/* Header */}
                  <div
                    className="p-2.5 rounded-xl flex items-center justify-between mb-3 border border-white/20 shadow-sm"
                    style={{
                      marginTop: design.cardShowMagStripe ? "16px" : "0",
                      backgroundColor: "rgba(15, 23, 42, 0.1)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span
                      className="text-[7.5px] font-black uppercase tracking-widest"
                      style={{ color: "#f8fafc" }}
                    >
                      Zakres uprawnień / Specification
                    </span>
                    <ShieldCheck
                      size={12}
                      style={{ color: design.cardRoleBgColor }}
                    />
                  </div>

                  {/* Description */}
                  <div className="flex-1 px-1 overflow-hidden">
                    <p
                      className="text-[6.8px] leading-[1.4] font-bold uppercase tracking-tight text-justify line-clamp-[8]"
                      style={{ color: "#e2e8f0" }}
                    >
                      {data.description}
                    </p>
                  </div>

                  {/* BARCODE */}
                  {design.cardShowBarcode && (
                    <div className="flex justify-center my-2">
                      <div className="bg-white px-2 py-1 rounded">
                        <svg width="120" height="30" viewBox="0 0 120 30">
                          {/* Simple barcode visualization */}
                          {Array.from({ length: 40 }).map((_, i) => (
                            <rect
                              key={i}
                              x={i * 3}
                              y={0}
                              width={Math.random() > 0.5 ? 2 : 1}
                              height={25}
                              fill="#000"
                            />
                          ))}
                          <text
                            x="60"
                            y="28"
                            textAnchor="middle"
                            fontSize="6"
                            fontFamily="monospace"
                          >
                            {data.certificateNumber}
                          </text>
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto flex items-end justify-between border-t border-white/10 pt-3">
                    <div className="space-y-1">
                      <div
                        className="text-[5.5px] font-black uppercase tracking-widest"
                        style={{ color: "#94a3b8" }}
                      >
                        Valid Thru / Data Ważności
                      </div>
                      <div
                        className="text-[9px] font-black px-3 py-1.5 rounded-lg border border-white/20 shadow-sm"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.1)",
                          color: design.cardRoleBgColor,
                        }}
                      >
                        {data.issueDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div
                          className="text-[5.5px] font-black uppercase mb-0.5"
                          style={{ color: "#94a3b8" }}
                        >
                          Verification ID
                        </div>
                        <div
                          className="text-[7px] font-mono font-black px-1 rounded"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.1)",
                            color: "#f8fafc",
                          }}
                        >
                          {data.certificateNumber}
                        </div>
                      </div>
                      <div
                        className="h-14 w-14 p-1.5 bg-white rounded-xl shadow-2xl border border-slate-100 flex items-center justify-center"
                        style={{
                          transform: `translate(${design.qrCodeOffsetX}px, ${design.qrCodeOffsetY}px) scale(${design.qrCodeScale})`,
                          opacity: design.qrCodeOpacity,
                        }}
                      >
                        <QRCodeSVG
                          value={`https://zzpwerkplaats.nl/verify/${data.id}`}
                          size={48}
                        />
                      </div>
                    </div>
                  </div>

                  {/* STAMP on back card */}
                  {design.stampDataUrl && (
                    <div
                      className="absolute z-30 pointer-events-none"
                      style={{
                        left: "8px",
                        bottom: "8px",
                        transform: `scale(${
                          design.stampScale * 0.4
                        }) translate(${design.stampOffsetX}px, ${
                          design.stampOffsetY
                        }px)`,
                        opacity: design.stampOpacity,
                        transformOrigin: "bottom left",
                      }}
                    >
                      <img
                        src={design.stampDataUrl}
                        className="w-10 h-10 object-contain"
                        alt="Stamp"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STICKER - GLOBAL */}
              {design.stickerDataUrl && (
                <div
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${design.stickerOffsetX}px), calc(-50% + ${design.stickerOffsetY}px)) scale(${design.stickerScale})`,
                    opacity: design.stickerOpacity,
                  }}
                >
                  <img
                    src={design.stickerDataUrl}
                    className={`${
                      mode === "certificate" ? "w-56 h-56" : "w-24 h-24"
                    } object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)] rotate-[-12deg]`}
                    alt=""
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
