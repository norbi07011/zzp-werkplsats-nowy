/**
 * =====================================================
 * GRADIENT STYLES FOR INVOICE TEMPLATES
 * =====================================================
 * Nowoczesne gradienty i kształty dla faktur:
 * - Geometric Gradient
 * - Modern Gradient
 * - Holographic Gradient
 * - Duotone Shape
 * - Vibrant Shape
 * - Neon Gradient
 * =====================================================
 */

export interface GradientStyle {
  id: string;
  name: string;
  nameNL: string;
  description: string;
  category:
    | "gradient"
    | "geometric"
    | "holographic"
    | "duotone"
    | "neon"
    | "vibrant";
  // CSS gradient for preview
  cssGradient: string;
  // Colors for PDF generation
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  tertiaryColor?: string;
  // Style properties
  headerBackground: string;
  tableHeaderBackground: string;
  borderStyle: "solid" | "gradient" | "none";
  // Shape/decoration type
  decorationType?:
    | "circles"
    | "triangles"
    | "waves"
    | "dots"
    | "lines"
    | "blob"
    | "none";
  decorationPosition?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "corners";
}

export const GRADIENT_STYLES: GradientStyle[] = [
  // =====================================================
  // GEOMETRIC GRADIENT
  // =====================================================
  {
    id: "geometric-blue",
    name: "Geometric Blue",
    nameNL: "Geometrisch Blauw",
    description: "Profesjonalny niebieski z geometrycznymi kształtami",
    category: "geometric",
    cssGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    primaryColor: "#667eea",
    secondaryColor: "#f0f4ff",
    accentColor: "#764ba2",
    headerBackground: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    tableHeaderBackground: "linear-gradient(90deg, #eef2ff 0%, #faf5ff 100%)",
    borderStyle: "gradient",
    decorationType: "triangles",
    decorationPosition: "top-right",
  },
  {
    id: "geometric-teal",
    name: "Geometric Teal",
    nameNL: "Geometrisch Teal",
    description: "Nowoczesny teal z trójkątnymi akcentami",
    category: "geometric",
    cssGradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
    primaryColor: "#0d9488",
    secondaryColor: "#f0fdfa",
    accentColor: "#0891b2",
    headerBackground: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
    tableHeaderBackground: "linear-gradient(90deg, #f0fdfa 0%, #ecfeff 100%)",
    borderStyle: "gradient",
    decorationType: "triangles",
    decorationPosition: "corners",
  },

  // =====================================================
  // MODERN GRADIENT
  // =====================================================
  {
    id: "modern-purple",
    name: "Modern Purple",
    nameNL: "Modern Paars",
    description: "Elegancki fioletowy gradient",
    category: "gradient",
    cssGradient: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
    primaryColor: "#a855f7",
    secondaryColor: "#faf5ff",
    accentColor: "#6366f1",
    headerBackground: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
    tableHeaderBackground: "linear-gradient(90deg, #faf5ff 0%, #eef2ff 100%)",
    borderStyle: "gradient",
    decorationType: "waves",
    decorationPosition: "bottom-right",
  },
  {
    id: "modern-sunset",
    name: "Modern Sunset",
    nameNL: "Modern Zonsondergang",
    description: "Ciepły gradient zachodzącego słońca",
    category: "gradient",
    cssGradient: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
    primaryColor: "#f97316",
    secondaryColor: "#fff7ed",
    accentColor: "#ec4899",
    headerBackground: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
    tableHeaderBackground: "linear-gradient(90deg, #fff7ed 0%, #fdf2f8 100%)",
    borderStyle: "gradient",
    decorationType: "circles",
    decorationPosition: "top-right",
  },
  {
    id: "modern-ocean",
    name: "Modern Ocean",
    nameNL: "Modern Oceaan",
    description: "Spokojny oceaniczny gradient",
    category: "gradient",
    cssGradient: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
    primaryColor: "#0ea5e9",
    secondaryColor: "#f0f9ff",
    accentColor: "#8b5cf6",
    headerBackground: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
    tableHeaderBackground: "linear-gradient(90deg, #f0f9ff 0%, #faf5ff 100%)",
    borderStyle: "gradient",
    decorationType: "waves",
    decorationPosition: "bottom-left",
  },

  // =====================================================
  // HOLOGRAPHIC GRADIENT
  // =====================================================
  {
    id: "holographic-rainbow",
    name: "Holographic Rainbow",
    nameNL: "Holografisch Regenboog",
    description: "Tęczowy holograficzny efekt",
    category: "holographic",
    cssGradient:
      "linear-gradient(135deg, #f0abfc 0%, #a5f3fc 25%, #86efac 50%, #fde68a 75%, #fca5a5 100%)",
    primaryColor: "#a855f7",
    secondaryColor: "#fdf4ff",
    accentColor: "#06b6d4",
    tertiaryColor: "#22c55e",
    headerBackground:
      "linear-gradient(135deg, #f0abfc 0%, #a5f3fc 25%, #86efac 50%, #fde68a 75%, #fca5a5 100%)",
    tableHeaderBackground:
      "linear-gradient(90deg, #fdf4ff 0%, #ecfeff 50%, #f0fdf4 100%)",
    borderStyle: "gradient",
    decorationType: "blob",
    decorationPosition: "corners",
  },
  {
    id: "holographic-pastel",
    name: "Holographic Pastel",
    nameNL: "Holografisch Pastel",
    description: "Delikatny pastelowy hologram",
    category: "holographic",
    cssGradient:
      "linear-gradient(135deg, #fce7f3 0%, #e0e7ff 33%, #cffafe 66%, #dcfce7 100%)",
    primaryColor: "#ec4899",
    secondaryColor: "#fdf2f8",
    accentColor: "#6366f1",
    tertiaryColor: "#06b6d4",
    headerBackground:
      "linear-gradient(135deg, #fce7f3 0%, #e0e7ff 33%, #cffafe 66%, #dcfce7 100%)",
    tableHeaderBackground:
      "linear-gradient(90deg, #fdf2f8 0%, #eef2ff 50%, #ecfeff 100%)",
    borderStyle: "gradient",
    decorationType: "dots",
    decorationPosition: "top-right",
  },

  // =====================================================
  // DUOTONE SHAPE
  // =====================================================
  {
    id: "duotone-coral",
    name: "Duotone Coral",
    nameNL: "Duotoon Koraal",
    description: "Dwukolorowy koralowo-różowy",
    category: "duotone",
    cssGradient: "linear-gradient(135deg, #fb7185 0%, #f472b6 100%)",
    primaryColor: "#fb7185",
    secondaryColor: "#fff1f2",
    accentColor: "#f472b6",
    headerBackground: "linear-gradient(135deg, #fb7185 0%, #f472b6 100%)",
    tableHeaderBackground: "#fff1f2",
    borderStyle: "solid",
    decorationType: "circles",
    decorationPosition: "top-left",
  },
  {
    id: "duotone-mint",
    name: "Duotone Mint",
    nameNL: "Duotoon Mint",
    description: "Świeży miętowo-szmaragdowy",
    category: "duotone",
    cssGradient: "linear-gradient(135deg, #34d399 0%, #06b6d4 100%)",
    primaryColor: "#34d399",
    secondaryColor: "#ecfdf5",
    accentColor: "#06b6d4",
    headerBackground: "linear-gradient(135deg, #34d399 0%, #06b6d4 100%)",
    tableHeaderBackground: "#ecfdf5",
    borderStyle: "solid",
    decorationType: "waves",
    decorationPosition: "bottom-right",
  },
  {
    id: "duotone-gold",
    name: "Duotone Gold",
    nameNL: "Duotoon Goud",
    description: "Luksusowy złoto-brązowy",
    category: "duotone",
    cssGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    primaryColor: "#f59e0b",
    secondaryColor: "#fffbeb",
    accentColor: "#d97706",
    headerBackground: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    tableHeaderBackground: "#fffbeb",
    borderStyle: "solid",
    decorationType: "lines",
    decorationPosition: "corners",
  },

  // =====================================================
  // VIBRANT SHAPE
  // =====================================================
  {
    id: "vibrant-electric",
    name: "Vibrant Electric",
    nameNL: "Levendig Elektrisch",
    description: "Energetyczny elektryczny błękit",
    category: "vibrant",
    cssGradient:
      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
    primaryColor: "#3b82f6",
    secondaryColor: "#eff6ff",
    accentColor: "#8b5cf6",
    tertiaryColor: "#ec4899",
    headerBackground:
      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
    tableHeaderBackground:
      "linear-gradient(90deg, #eff6ff 0%, #faf5ff 50%, #fdf2f8 100%)",
    borderStyle: "gradient",
    decorationType: "blob",
    decorationPosition: "top-right",
  },
  {
    id: "vibrant-tropical",
    name: "Vibrant Tropical",
    nameNL: "Levendig Tropisch",
    description: "Tropikalne żywe kolory",
    category: "vibrant",
    cssGradient:
      "linear-gradient(135deg, #22c55e 0%, #eab308 50%, #f97316 100%)",
    primaryColor: "#22c55e",
    secondaryColor: "#f0fdf4",
    accentColor: "#eab308",
    tertiaryColor: "#f97316",
    headerBackground:
      "linear-gradient(135deg, #22c55e 0%, #eab308 50%, #f97316 100%)",
    tableHeaderBackground:
      "linear-gradient(90deg, #f0fdf4 0%, #fefce8 50%, #fff7ed 100%)",
    borderStyle: "gradient",
    decorationType: "circles",
    decorationPosition: "corners",
  },

  // =====================================================
  // NEON GRADIENT
  // =====================================================
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    nameNL: "Neon Cyber",
    description: "Cyberpunkowy neonowy styl",
    category: "neon",
    cssGradient:
      "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)",
    primaryColor: "#06b6d4",
    secondaryColor: "#0f172a",
    accentColor: "#8b5cf6",
    tertiaryColor: "#ec4899",
    headerBackground:
      "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)",
    tableHeaderBackground:
      "linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #1e1b4b 100%)",
    borderStyle: "gradient",
    decorationType: "lines",
    decorationPosition: "corners",
  },
  {
    id: "neon-retro",
    name: "Neon Retro",
    nameNL: "Neon Retro",
    description: "Retro neonowy róż i niebieski",
    category: "neon",
    cssGradient: "linear-gradient(135deg, #f472b6 0%, #818cf8 100%)",
    primaryColor: "#f472b6",
    secondaryColor: "#fdf2f8",
    accentColor: "#818cf8",
    headerBackground: "linear-gradient(135deg, #f472b6 0%, #818cf8 100%)",
    tableHeaderBackground: "linear-gradient(90deg, #fdf2f8 0%, #eef2ff 100%)",
    borderStyle: "gradient",
    decorationType: "dots",
    decorationPosition: "top-left",
  },
  {
    id: "neon-lime",
    name: "Neon Lime",
    nameNL: "Neon Limoen",
    description: "Świeży neonowy limonkowy",
    category: "neon",
    cssGradient: "linear-gradient(135deg, #84cc16 0%, #22d3ee 100%)",
    primaryColor: "#84cc16",
    secondaryColor: "#f7fee7",
    accentColor: "#22d3ee",
    headerBackground: "linear-gradient(135deg, #84cc16 0%, #22d3ee 100%)",
    tableHeaderBackground: "linear-gradient(90deg, #f7fee7 0%, #ecfeff 100%)",
    borderStyle: "gradient",
    decorationType: "waves",
    decorationPosition: "bottom-right",
  },

  // =====================================================
  // CLASSIC PROFESSIONAL (dla zachowania kompatybilności)
  // =====================================================
  {
    id: "classic-blue",
    name: "Classic Blue",
    nameNL: "Klassiek Blauw",
    description: "Klasyczny profesjonalny niebieski",
    category: "gradient",
    cssGradient: "#2563eb",
    primaryColor: "#2563eb",
    secondaryColor: "#eff6ff",
    headerBackground: "#2563eb",
    tableHeaderBackground: "#eff6ff",
    borderStyle: "solid",
    decorationType: "none",
  },
  {
    id: "classic-dark",
    name: "Classic Dark",
    nameNL: "Klassiek Donker",
    description: "Elegancki ciemny profesjonalny",
    category: "gradient",
    cssGradient: "#1e293b",
    primaryColor: "#1e293b",
    secondaryColor: "#f8fafc",
    headerBackground: "#1e293b",
    tableHeaderBackground: "#f8fafc",
    borderStyle: "solid",
    decorationType: "none",
  },
];

// Get gradient by ID
export function getGradientById(id: string): GradientStyle | undefined {
  return GRADIENT_STYLES.find((g) => g.id === id);
}

// Get gradients by category
export function getGradientsByCategory(
  category: GradientStyle["category"]
): GradientStyle[] {
  return GRADIENT_STYLES.filter((g) => g.category === category);
}

// Get all gradient categories
export function getGradientCategories(): {
  id: GradientStyle["category"];
  name: string;
  nameNL: string;
}[] {
  return [
    { id: "geometric", name: "Geometric", nameNL: "Geometrisch" },
    { id: "gradient", name: "Modern Gradient", nameNL: "Modern Gradient" },
    { id: "holographic", name: "Holographic", nameNL: "Holografisch" },
    { id: "duotone", name: "Duotone", nameNL: "Duotoon" },
    { id: "vibrant", name: "Vibrant", nameNL: "Levendig" },
    { id: "neon", name: "Neon", nameNL: "Neon" },
  ];
}

// Convert GradientStyle to PDFTemplateStyle
export function gradientToPDFStyle(gradient: GradientStyle): {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
} {
  return {
    primaryColor: gradient.primaryColor,
    secondaryColor: gradient.secondaryColor,
    fontFamily: "helvetica",
  };
}
