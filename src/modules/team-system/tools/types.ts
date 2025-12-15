export enum Language {
  PL = "PL",
  NL = "NL",
}

export enum DocStatus {
  DRAFT = "Draft",
  SENT = "Verzonden", // Wysłane
  APPROVED = "Goedgekeurd", // Zaakceptowane
  COMPLETED = "Afgerond", // Zakończone
}

export interface CompanyProfile {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  kvk: string;
  btw: string;
  iban: string;
  bankName: string;
  email: string;
  phone: string;
  website: string;
  logoUrl?: string; // Base64 string
}

export interface Client {
  id: string; // Added ID for database management
  name: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface WorkItem {
  id: string;
  category: string; // e.g., "Sanering", "Bekleding"
  description: string;
  quantity: number;
  unit: string; // m1, m2, stuks, post
  pricePerUnit: number;
  vatRate: number; // 9 or 21
  image?: string; // Optional image for the specific item (Base64)
}

export interface ResourceItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost?: number; // Cost per unit for internal calculation
  vatRate: number;
  imageUrl?: string; // URL of the product image
  notes?: string; // Optional notes
}

export interface ProjectImage {
  id: string;
  url: string;
  caption: string;
  description: string; // Dodatkowy szczegółowy opis
  annotations: {
    x: number;
    y: number;
    type: "cross" | "circle" | "line";
    size?: number;
  }[];
}

export interface Quote {
  id: string;
  referenceNumber: string; // e.g., KB.24/103
  date: string;
  executionDate?: string; // Data wykonania
  client: Client;
  location: string; // e.g., Catsheuvel 77-181
  subject: string; // Betreft
  introText: string;
  items: WorkItem[];
  materials: ResourceItem[]; // Nowe pole
  tools: ResourceItem[]; // Nowe pole
  images: ProjectImage[];
  status: DocStatus;
  notes: string; // Internal notes

  // Visibility Settings
  showItemPrices: boolean; // Toggle for Work Items on Quote
  showMaterialPrices: boolean; // Toggle for Materials on Internal Doc
  showToolPrices: boolean; // Toggle for Tools on Internal Doc

  // Financial Analysis
  estimatedHours: number;
  hourlyRate: number; // Internal hourly cost/rate
  riskBuffer: number; // Percentage (0-100) for unforeseen costs
}

export interface QuoteTemplate {
  id: string;
  name: string;
  subject: string;
  introText: string;
  items: Omit<WorkItem, "id">[]; // Items without IDs as they will be generated anew
  materials: Omit<ResourceItem, "id">[]; // Template materials
  tools: Omit<ResourceItem, "id">[]; // Template tools
}

export interface ResourceTemplate {
  id: string;
  name: string;
  materials: Omit<ResourceItem, "id">[];
  tools: Omit<ResourceItem, "id">[];
}

// Style settings for quote customization
export interface QuoteStyle {
  // Colors
  primaryColor: string; // Main brand color (header, accents)
  secondaryColor: string; // Secondary color
  accentColor: string; // Accent color for highlights
  textColor: string; // Main text color
  backgroundColor: string; // Background color
  headerBgColor: string; // Header background
  tableBorderColor: string; // Table borders

  // Typography
  fontFamily: string; // Font family
  headingSize: number; // Heading font size (px)
  bodySize: number; // Body text size (px)
  smallSize: number; // Small text size (px)

  // Logo
  logoSize: number; // Logo size (0-200%)
  logoPosition: "left" | "center" | "right";

  // Layout
  headerHeight: number; // Header height (px)
  sectionSpacing: number; // Spacing between sections (px)
  borderRadius: number; // Border radius (px)

  // Images in quote
  imageSize: number; // Default image size (0-200%)
  imagePosition: "left" | "center" | "right";

  // Visibility
  showLogo: boolean;
  showHeader: boolean;
  showFooter: boolean;
  showWatermark: boolean;
}

export const defaultQuoteStyle: QuoteStyle = {
  primaryColor: "#1e40af",
  secondaryColor: "#1e3a8a",
  accentColor: "#3b82f6",
  textColor: "#1e293b",
  backgroundColor: "#ffffff",
  headerBgColor: "#0f172a",
  tableBorderColor: "#e2e8f0",

  fontFamily: "system-ui",
  headingSize: 24,
  bodySize: 14,
  smallSize: 12,

  logoSize: 100,
  logoPosition: "left",

  headerHeight: 350,
  sectionSpacing: 24,
  borderRadius: 8,

  imageSize: 100,
  imagePosition: "left",

  showLogo: true,
  showHeader: true,
  showFooter: true,
  showWatermark: false,
};
