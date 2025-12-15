import React, { useState, useRef, useEffect } from "react";
import {
  Palette,
  Type,
  Image as ImageIcon,
  Layout,
  Eye,
  EyeOff,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Settings2,
  Sparkles,
  X,
  Pipette,
} from "lucide-react";
import { QuoteStyle, defaultQuoteStyle, Language } from "./types";

// ==================== COLOR PICKER COMPONENT ====================
// Extracted outside StyleEditor to prevent re-render issues

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

// Helper functions outside component
const hexToHsl = (hex: string) => {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const ColorPickerPopup: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  onClose,
}) => {
  // Use refs for dragging state to avoid re-renders
  const isDraggingSatLight = useRef(false);
  const isDraggingHue = useRef(false);
  const wasDragging = useRef(false);

  // Store current values in refs for event handlers
  const currentHue = useRef(0);
  const currentSat = useRef(100);
  const currentLight = useRef(50);

  // State only for display updates
  const [displayHue, setDisplayHue] = useState(0);
  const [displaySat, setDisplaySat] = useState(100);
  const [displayLight, setDisplayLight] = useState(50);

  // Initialize from value
  useEffect(() => {
    if (value.startsWith("#")) {
      const hsl = hexToHsl(value);
      currentHue.current = hsl.h;
      currentSat.current = hsl.s;
      currentLight.current = hsl.l;
      setDisplayHue(hsl.h);
      setDisplaySat(hsl.s);
      setDisplayLight(hsl.l);
    }
  }, []);

  // Mouse handlers for dragging
  useEffect(() => {
    const updateSatLight = (e: MouseEvent) => {
      if (!satLightRef.current) return;
      const rect = satLightRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const newSat = (x / rect.width) * 100;
      const newLight = 100 - (y / rect.height) * 100;
      const adjustedLight = newLight / 2 + 25;

      currentSat.current = newSat;
      currentLight.current = adjustedLight;
      setDisplaySat(newSat);
      setDisplayLight(adjustedLight);
      onChange(hslToHex(currentHue.current, newSat, adjustedLight));
    };

    const updateHue = (e: MouseEvent) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const newHue = (x / rect.width) * 360;

      currentHue.current = newHue;
      setDisplayHue(newHue);
      onChange(hslToHex(newHue, currentSat.current, currentLight.current));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSatLight.current || isDraggingHue.current) {
        e.preventDefault();
        e.stopPropagation();
        wasDragging.current = true;

        if (isDraggingSatLight.current) {
          updateSatLight(e);
        }
        if (isDraggingHue.current) {
          updateHue(e);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const wasActive = isDraggingSatLight.current || isDraggingHue.current;
      isDraggingSatLight.current = false;
      isDraggingHue.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // If we were dragging, prevent the click from closing
      if (wasActive) {
        e.stopPropagation();
        // Reset wasDragging after a short delay
        setTimeout(() => {
          wasDragging.current = false;
        }, 100);
      }
    };

    // Attach listeners
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [onChange]);

  // Close on outside click - use capture phase and check properly
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if we were just dragging
      if (wasDragging.current) {
        return;
      }

      // Check if click is outside the picker
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Use a longer delay to ensure picker is mounted
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [onClose]);

  const rgb = hexToRgb(value);
  const handleX = displaySat;
  const handleY = 100 - (displayLight - 25) * 2;

  const startSatLightDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    isDraggingSatLight.current = true;
    wasDragging.current = true;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    // Immediate update on click
    if (satLightRef.current) {
      const rect = satLightRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const newSat = (x / rect.width) * 100;
      const newLight = 100 - (y / rect.height) * 100;
      const adjustedLight = newLight / 2 + 25;

      currentSat.current = newSat;
      currentLight.current = adjustedLight;
      setDisplaySat(newSat);
      setDisplayLight(adjustedLight);
      onChange(hslToHex(currentHue.current, newSat, adjustedLight));
    }
  };

  const startHueDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    isDraggingHue.current = true;
    wasDragging.current = true;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    // Immediate update on click
    if (hueRef.current) {
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const newHue = (x / rect.width) * 360;

      currentHue.current = newHue;
      setDisplayHue(newHue);
      onChange(hslToHex(newHue, currentSat.current, currentLight.current));
    }
  };

  // Prevent any clicks inside from closing
  const handlePickerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  return (
    <div
      ref={pickerRef}
      className="absolute right-0 top-full mt-2 z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72"
      onClick={handlePickerClick}
      onMouseDown={handlePickerClick}
    >
      {/* Saturation/Lightness Picker */}
      <div
        ref={satLightRef}
        className="relative w-full h-40 rounded-lg mb-3 overflow-hidden select-none touch-none"
        style={{
          background: `linear-gradient(to right, white, hsl(${displayHue}, 100%, 50%))`,
          cursor: "crosshair",
        }}
        onMouseDown={startSatLightDrag}
      >
        {/* Black overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, black)",
          }}
        />
        {/* Handle */}
        <div
          className="absolute w-5 h-5 border-[3px] border-white rounded-full pointer-events-none"
          style={{
            left: `${Math.max(2, Math.min(98, handleX))}%`,
            top: `${Math.max(2, Math.min(98, handleY))}%`,
            transform: "translate(-50%, -50%)",
            backgroundColor: value,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* Hue Slider */}
      <div
        ref={hueRef}
        className="relative w-full h-5 rounded-full mb-4 select-none touch-none"
        style={{
          background:
            "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          cursor: "pointer",
        }}
        onMouseDown={startHueDrag}
      >
        <div
          className="absolute w-5 h-5 border-[3px] border-white rounded-full pointer-events-none"
          style={{
            left: `${(displayHue / 360) * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: `hsl(${displayHue}, 100%, 50%)`,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* RGB Inputs */}
      <div className="flex items-center gap-2 border-t pt-3">
        <Pipette size={16} className="text-gray-400" />
        <div className="flex gap-1">
          {(["r", "g", "b"] as const).map((key) => (
            <div key={key} className="text-center">
              <input
                type="number"
                min={0}
                max={255}
                value={rgb[key]}
                onChange={(e) => {
                  const newVal = Math.min(
                    255,
                    Math.max(0, parseInt(e.target.value) || 0)
                  );
                  const newRgb = { ...rgb, [key]: newVal };
                  const hex = `#${newRgb.r
                    .toString(16)
                    .padStart(2, "0")}${newRgb.g
                    .toString(16)
                    .padStart(2, "0")}${newRgb.b
                    .toString(16)
                    .padStart(2, "0")}`;
                  onChange(hex);
                }}
                className="w-12 px-1 py-1 text-xs border rounded text-center"
              />
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {key.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== COLOR INPUT COMPONENT ====================
// Also extracted outside StyleEditor to prevent re-render issues

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 relative">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsPickerOpen(!isPickerOpen);
          }}
          className="w-10 h-8 rounded cursor-pointer border-2 border-gray-300 hover:border-blue-400 transition-colors shadow-sm"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 text-xs border rounded font-mono"
        />
      </div>

      {isPickerOpen && (
        <ColorPickerPopup
          value={value}
          onChange={onChange}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
    </div>
  );
};

// ==================== MAIN STYLE EDITOR ====================

interface Props {
  style: QuoteStyle;
  onStyleChange: (style: QuoteStyle) => void;
  currentLang: Language;
  isOpen: boolean;
  onClose: () => void;
}

const FONT_OPTIONS = [
  { value: "system-ui", label: "System (Default)" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Segoe UI', sans-serif", label: "Segoe UI" },
  { value: "Roboto, sans-serif", label: "Roboto" },
];

const PRESET_THEMES = [
  {
    name: "Profesjonalny Niebieski",
    nameNL: "Professioneel Blauw",
    colors: {
      primaryColor: "#1e40af",
      secondaryColor: "#1e3a8a",
      accentColor: "#3b82f6",
      headerBgColor: "#0f172a",
    },
  },
  {
    name: "Elegancki Zielony",
    nameNL: "Elegant Groen",
    colors: {
      primaryColor: "#059669",
      secondaryColor: "#047857",
      accentColor: "#10b981",
      headerBgColor: "#064e3b",
    },
  },
  {
    name: "Nowoczesny Fiolet",
    nameNL: "Modern Paars",
    colors: {
      primaryColor: "#7c3aed",
      secondaryColor: "#6d28d9",
      accentColor: "#8b5cf6",
      headerBgColor: "#4c1d95",
    },
  },
  {
    name: "Ciepła Pomarańcza",
    nameNL: "Warm Oranje",
    colors: {
      primaryColor: "#ea580c",
      secondaryColor: "#c2410c",
      accentColor: "#f97316",
      headerBgColor: "#7c2d12",
    },
  },
  {
    name: "Klasyczna Czerń",
    nameNL: "Klassiek Zwart",
    colors: {
      primaryColor: "#18181b",
      secondaryColor: "#27272a",
      accentColor: "#52525b",
      headerBgColor: "#09090b",
    },
  },
  {
    name: "Morski",
    nameNL: "Zee",
    colors: {
      primaryColor: "#0891b2",
      secondaryColor: "#0e7490",
      accentColor: "#06b6d4",
      headerBgColor: "#164e63",
    },
  },
];

export const StyleEditor: React.FC<Props> = ({
  style,
  onStyleChange,
  currentLang,
  isOpen,
  onClose,
}) => {
  const [expandedSection, setExpandedSection] = useState<string>("colors");

  const t =
    currentLang === Language.PL
      ? {
          styleEditor: "Edytor Stylu",
          colors: "Kolory",
          typography: "Typografia",
          logo: "Logo",
          layout: "Układ",
          images: "Zdjęcia",
          visibility: "Widoczność",
          presets: "Szablony kolorów",
          resetToDefault: "Przywróć domyślne",
          primaryColor: "Kolor główny",
          secondaryColor: "Kolor pomocniczy",
          accentColor: "Kolor akcentu",
          textColor: "Kolor tekstu",
          backgroundColor: "Tło",
          headerBgColor: "Tło nagłówka",
          tableBorderColor: "Ramki tabeli",
          fontFamily: "Czcionka",
          headingSize: "Rozmiar nagłówków",
          bodySize: "Rozmiar tekstu",
          smallSize: "Mały tekst",
          logoSize: "Rozmiar logo",
          logoPosition: "Pozycja logo",
          headerHeight: "Wysokość nagłówka",
          sectionSpacing: "Odstępy sekcji",
          borderRadius: "Zaokrąglenie rogów",
          imageSize: "Rozmiar zdjęć",
          imagePosition: "Pozycja zdjęć",
          showLogo: "Pokaż logo",
          showHeader: "Pokaż nagłówek",
          showFooter: "Pokaż stopkę",
          showWatermark: "Pokaż znak wodny",
          left: "Lewo",
          center: "Środek",
          right: "Prawo",
          close: "Zamknij",
        }
      : {
          styleEditor: "Stijl Editor",
          colors: "Kleuren",
          typography: "Typografie",
          logo: "Logo",
          layout: "Layout",
          images: "Afbeeldingen",
          visibility: "Zichtbaarheid",
          presets: "Kleur presets",
          resetToDefault: "Reset naar standaard",
          primaryColor: "Primaire kleur",
          secondaryColor: "Secundaire kleur",
          accentColor: "Accent kleur",
          textColor: "Tekstkleur",
          backgroundColor: "Achtergrond",
          headerBgColor: "Header achtergrond",
          tableBorderColor: "Tabel randen",
          fontFamily: "Lettertype",
          headingSize: "Koptekst grootte",
          bodySize: "Tekst grootte",
          smallSize: "Kleine tekst",
          logoSize: "Logo grootte",
          logoPosition: "Logo positie",
          headerHeight: "Header hoogte",
          sectionSpacing: "Sectie afstand",
          borderRadius: "Hoek radius",
          imageSize: "Afbeelding grootte",
          imagePosition: "Afbeelding positie",
          showLogo: "Toon logo",
          showHeader: "Toon header",
          showFooter: "Toon footer",
          showWatermark: "Toon watermerk",
          left: "Links",
          center: "Midden",
          right: "Rechts",
          close: "Sluiten",
        };

  const updateStyle = (key: keyof QuoteStyle, value: any) => {
    onStyleChange({ ...style, [key]: value });
  };

  const applyPreset = (preset: (typeof PRESET_THEMES)[0]) => {
    onStyleChange({ ...style, ...preset.colors });
  };

  const resetToDefault = () => {
    onStyleChange(defaultQuoteStyle);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? "" : section);
  };

  if (!isOpen) return null;

  const SectionHeader = ({
    id,
    icon: Icon,
    title,
  }: {
    id: string;
    icon: any;
    title: string;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2 font-medium text-gray-700">
        <Icon size={18} />
        {title}
      </div>
      {expandedSection === id ? (
        <ChevronUp size={18} />
      ) : (
        <ChevronDown size={18} />
      )}
    </button>
  );

  const SliderInput = ({
    label,
    value,
    onChange,
    min,
    max,
    unit = "px",
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    unit?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-800">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );

  const PositionSelector = ({
    value,
    onChange,
  }: {
    value: "left" | "center" | "right";
    onChange: (v: "left" | "center" | "right") => void;
  }) => (
    <div className="flex gap-1">
      {[
        { val: "left" as const, icon: AlignLeft, label: t.left },
        { val: "center" as const, icon: AlignCenter, label: t.center },
        { val: "right" as const, icon: AlignRight, label: t.right },
      ].map(({ val, icon: Icon, label }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`flex-1 p-2 rounded flex items-center justify-center gap-1 text-xs transition-colors ${
            value === val
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          title={label}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );

  const ToggleSwitch = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          value ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={24} />
            <h2 className="text-xl font-bold">{t.styleEditor}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Presets */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Palette size={18} />
              {t.presets}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_THEMES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="p-2 rounded-lg border-2 border-transparent hover:border-blue-400 transition-colors group"
                  title={
                    currentLang === Language.PL ? preset.name : preset.nameNL
                  }
                >
                  <div className="flex gap-0.5 mb-1">
                    <div
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: preset.colors.primaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: preset.colors.secondaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: preset.colors.accentColor }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-700 line-clamp-1">
                    {currentLang === Language.PL ? preset.name : preset.nameNL}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-2">
            <SectionHeader id="colors" icon={Palette} title={t.colors} />
            {expandedSection === "colors" && (
              <div className="p-4 bg-white border rounded-lg space-y-4">
                <ColorInput
                  label={t.primaryColor}
                  value={style.primaryColor}
                  onChange={(v) => updateStyle("primaryColor", v)}
                />
                <ColorInput
                  label={t.secondaryColor}
                  value={style.secondaryColor}
                  onChange={(v) => updateStyle("secondaryColor", v)}
                />
                <ColorInput
                  label={t.accentColor}
                  value={style.accentColor}
                  onChange={(v) => updateStyle("accentColor", v)}
                />
                <ColorInput
                  label={t.textColor}
                  value={style.textColor}
                  onChange={(v) => updateStyle("textColor", v)}
                />
                <ColorInput
                  label={t.backgroundColor}
                  value={style.backgroundColor}
                  onChange={(v) => updateStyle("backgroundColor", v)}
                />
                <ColorInput
                  label={t.headerBgColor}
                  value={style.headerBgColor}
                  onChange={(v) => updateStyle("headerBgColor", v)}
                />
                <ColorInput
                  label={t.tableBorderColor}
                  value={style.tableBorderColor}
                  onChange={(v) => updateStyle("tableBorderColor", v)}
                />
              </div>
            )}
          </div>

          {/* Typography Section */}
          <div className="space-y-2">
            <SectionHeader id="typography" icon={Type} title={t.typography} />
            {expandedSection === "typography" && (
              <div className="p-4 bg-white border rounded-lg space-y-4">
                <div className="space-y-2">
                  <span className="text-sm text-gray-600">{t.fontFamily}</span>
                  <select
                    value={style.fontFamily}
                    onChange={(e) => updateStyle("fontFamily", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option
                        key={font.value}
                        value={font.value}
                        style={{ fontFamily: font.value }}
                      >
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
                <SliderInput
                  label={t.headingSize}
                  value={style.headingSize}
                  onChange={(v) => updateStyle("headingSize", v)}
                  min={16}
                  max={48}
                />
                <SliderInput
                  label={t.bodySize}
                  value={style.bodySize}
                  onChange={(v) => updateStyle("bodySize", v)}
                  min={10}
                  max={24}
                />
                <SliderInput
                  label={t.smallSize}
                  value={style.smallSize}
                  onChange={(v) => updateStyle("smallSize", v)}
                  min={8}
                  max={16}
                />
              </div>
            )}
          </div>

          {/* Logo Section */}
          <div className="space-y-2">
            <SectionHeader id="logo" icon={ImageIcon} title={t.logo} />
            {expandedSection === "logo" && (
              <div className="p-4 bg-white border rounded-lg space-y-4">
                <SliderInput
                  label={t.logoSize}
                  value={style.logoSize}
                  onChange={(v) => updateStyle("logoSize", v)}
                  min={20}
                  max={200}
                  unit="%"
                />
                <div className="space-y-2">
                  <span className="text-sm text-gray-600">
                    {t.logoPosition}
                  </span>
                  <PositionSelector
                    value={style.logoPosition}
                    onChange={(v) => updateStyle("logoPosition", v)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Layout Section */}
          <div className="space-y-2">
            <SectionHeader id="layout" icon={Layout} title={t.layout} />
            {expandedSection === "layout" && (
              <div className="p-4 bg-white border rounded-lg space-y-4">
                <SliderInput
                  label={t.headerHeight}
                  value={style.headerHeight}
                  onChange={(v) => updateStyle("headerHeight", v)}
                  min={200}
                  max={500}
                />
                <SliderInput
                  label={t.sectionSpacing}
                  value={style.sectionSpacing}
                  onChange={(v) => updateStyle("sectionSpacing", v)}
                  min={8}
                  max={48}
                />
                <SliderInput
                  label={t.borderRadius}
                  value={style.borderRadius}
                  onChange={(v) => updateStyle("borderRadius", v)}
                  min={0}
                  max={24}
                />
              </div>
            )}
          </div>

          {/* Images Section */}
          <div className="space-y-2">
            <SectionHeader id="images" icon={ImageIcon} title={t.images} />
            {expandedSection === "images" && (
              <div className="p-4 bg-white border rounded-lg space-y-4">
                <SliderInput
                  label={t.imageSize}
                  value={style.imageSize}
                  onChange={(v) => updateStyle("imageSize", v)}
                  min={20}
                  max={200}
                  unit="%"
                />
                <div className="space-y-2">
                  <span className="text-sm text-gray-600">
                    {t.imagePosition}
                  </span>
                  <PositionSelector
                    value={style.imagePosition}
                    onChange={(v) => updateStyle("imagePosition", v)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Visibility Section */}
          <div className="space-y-2">
            <SectionHeader id="visibility" icon={Eye} title={t.visibility} />
            {expandedSection === "visibility" && (
              <div className="p-4 bg-white border rounded-lg space-y-4">
                <ToggleSwitch
                  label={t.showLogo}
                  value={style.showLogo}
                  onChange={(v) => updateStyle("showLogo", v)}
                />
                <ToggleSwitch
                  label={t.showHeader}
                  value={style.showHeader}
                  onChange={(v) => updateStyle("showHeader", v)}
                />
                <ToggleSwitch
                  label={t.showFooter}
                  value={style.showFooter}
                  onChange={(v) => updateStyle("showFooter", v)}
                />
                <ToggleSwitch
                  label={t.showWatermark}
                  value={style.showWatermark}
                  onChange={(v) => updateStyle("showWatermark", v)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex gap-3">
          <button
            onClick={resetToDefault}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={16} />
            {t.resetToDefault}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleEditor;
