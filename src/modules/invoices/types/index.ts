// =====================================================
// NORBS INVOICE MODULE - TypeScript Types
// =====================================================
// Adapted from NORBS for ZZP Werkplaats + Supabase
// All types aligned with database schema in CREATE_INVOICE_TABLES.sql
// =====================================================

// =====================================================
// COMPANY
// =====================================================
export interface Company {
  id: string;
  user_id: string;

  // Basic info
  name: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country: string; // Default: 'NL'

  // Tax identifiers
  kvk_number?: string; // KVK (Netherlands)
  vat_number?: string; // BTW
  eori_number?: string; // EORI (international trade)

  // Contact
  email?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  website?: string;

  // Banking (SEPA QR codes)
  iban?: string;
  bic?: string;
  bank_name?: string;

  // Invoice settings
  default_payment_term_days: number; // Default: 14
  default_vat_rate: number; // Default: 21.00
  currency: string; // Default: 'EUR'

  // Logo
  logo_url?: string;
  logo_base64?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// CLIENT
// =====================================================
export type ClientType = "individual" | "company";

export interface Client {
  id: string;
  user_id: string;

  // Type
  type: ClientType;

  // Basic info
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;

  // Address
  address?: string;
  postal_code?: string;
  city?: string;
  country: string; // Default: 'NL'

  // Tax identifiers (varies by country)
  kvk_number?: string; // Netherlands: KVK
  vat_number?: string; // EU: VAT
  nip_number?: string; // Poland: NIP
  tax_id?: string; // Other countries

  // Payment settings
  payment_term_days: number; // Default: 14

  // Notes
  notes?: string;

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// PRODUCT / SERVICE
// =====================================================
export interface Product {
  id: string;
  user_id: string;

  // Product info
  code?: string;
  name: string;
  description?: string;

  // Product image
  image_url?: string; // URL to product image

  // Pricing
  unit_price: number; // Net price
  vat_rate: number; // VAT percentage (0, 9, 21)

  // Unit
  unit: string; // 'uur', 'stuk', 'dag', 'maand', etc.

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// INVOICE
// =====================================================
export type InvoiceLanguage = "pl" | "nl" | "en";
export type InvoiceStatus = "unpaid" | "partial" | "paid" | "cancelled";

export interface Invoice {
  id: string;
  user_id: string;

  // Invoice identification
  invoice_number: string;
  invoice_date: string; // ISO date string
  due_date: string; // ISO date string

  // Client reference
  client_id?: string;
  client_snapshot?: Client; // Snapshot at invoice time (JSONB)

  // Language
  language: InvoiceLanguage;

  // Status
  status: InvoiceStatus;

  // Amounts
  total_net: number;
  total_vat: number;
  total_gross: number;

  // Payment tracking
  paid_amount: number;
  payment_date?: string;

  // Payment reference (SEPA QR)
  payment_reference?: string;
  payment_qr_payload?: string; // EPC QR code data

  // EU reverse charge
  is_reverse_charge: boolean;

  // Notes
  notes?: string;
  footer_text?: string;

  // Template
  template_name: string; // 'classic', 'modern', 'minimal', 'professional'

  // ========== CUSTOM STYLE COLORS ==========
  primary_color?: string;
  secondary_color?: string;
  text_color?: string;
  background_color?: string;

  // ========== TYPOGRAPHY ==========
  font_family?: string;
  font_size_scale?: number;
  line_height?: number;

  // ========== LAYOUT ==========
  header_align?: "left" | "center" | "right";
  global_margin?: number;
  border_radius?: number;

  // ========== DESIGN FEATURES ==========
  logo_url?: string;
  logo_size?: number;
  holographic_logo?: boolean;
  paper_texture?: string;
  show_qr_code?: boolean;
  show_product_frames?: boolean;
  show_signature_line?: boolean;
  show_watermark?: boolean;
  watermark_url?: string;

  // ========== TEMPLATE STRUCTURE ==========
  blocks?: any[];
  labels?: Record<string, string>;

  // Lines (populated from invoice_invoice_lines)
  lines?: InvoiceLine[];

  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// INVOICE LINE
// =====================================================
export interface InvoiceLine {
  id: string;
  invoice_id: string;

  // Line position
  line_number: number;

  // Product reference (optional)
  product_id?: string;

  // Product image (optional - from linked product)
  image_url?: string;

  // Line data
  description: string;
  quantity: number;
  unit: string; // 'uur', 'stuk', etc.
  unit_price: number; // Net price
  vat_rate: number; // VAT percentage

  // Calculated amounts
  line_net: number; // quantity * unit_price
  line_vat: number; // line_net * (vat_rate / 100)
  line_gross: number; // line_net + line_vat

  // Timestamps
  created_at: string;
}

// =====================================================
// INVOICE TEMPLATE
// =====================================================
export type InvoiceTemplate = "classic" | "modern" | "minimal" | "professional";

// =====================================================
// CREATE INVOICE DATA (for forms)
// =====================================================
export interface CreateInvoiceData {
  client_id: string;
  invoice_date: string;
  due_date: string;
  language: InvoiceLanguage;
  notes?: string;
  footer_text?: string;
  template_name: InvoiceTemplate;
  is_reverse_charge: boolean;
  lines: Omit<InvoiceLine, "id" | "invoice_id" | "created_at">[];

  // ========== CUSTOM STYLE COLORS ==========
  primary_color?: string;
  secondary_color?: string;
  text_color?: string;
  background_color?: string;

  // ========== TYPOGRAPHY ==========
  font_family?: string;
  font_size_scale?: number;
  line_height?: number;

  // ========== LAYOUT ==========
  header_align?: "left" | "center" | "right";
  global_margin?: number;
  border_radius?: number;

  // ========== DESIGN FEATURES ==========
  logo_url?: string;
  logo_size?: number;
  holographic_logo?: boolean;
  paper_texture?: string;
  show_qr_code?: boolean;
  show_product_frames?: boolean;
  show_signature_line?: boolean;
  show_watermark?: boolean;
  watermark_url?: string;

  // ========== TEMPLATE STRUCTURE ==========
  blocks?: any[];
  labels?: Record<string, string>;

  // ========== PRODUCT_GALLERY TEMPLATE FIELDS ==========
  gallery_images?: Array<{ url: string; caption?: string }>;
  shipping_cost?: number;

  // ========== WORK_SERVICES TEMPLATE FIELDS ==========
  project_ref?: string;
  work_hours?: Array<{
    date: string;
    description: string;
    hours: number;
    rate: number;
  }>;
  materials?: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
}

// =====================================================
// HELPER TYPES
// =====================================================
export interface InvoiceStats {
  total_invoices: number;
  unpaid_count: number;
  unpaid_amount: number;
  paid_count: number;
  paid_amount: number;
  this_month_amount: number;
  this_year_amount: number;
}

// Export related types from other files
export type {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  ExpenseCategoryInfo,
  ExpenseReport,
} from "./expenses.js";
export type {
  BTWDeclaration,
  BTWPeriod,
  BTWStatus,
  BTWCalculationData,
} from "./btw.js";
export type {
  KilometerEntry,
  TripType,
  KilometerRates,
  KilometerReport,
} from "./kilometers.js";
export type {
  Vehicle,
  VehicleType,
  FuelType,
  VehicleRates,
  VehicleStats,
} from "./vehicles.js";
export { EXPENSE_CATEGORIES } from "./expenses.js";
export { BTW_RATES, getQuarterDateRange } from "./btw.js";
export {
  KILOMETER_RATES_2025,
  getKilometerRate,
  TAX_FREE_LIMIT_NL,
} from "./kilometers.js";
export {
  DUTCH_RATES_2025,
  getVehicleRate,
  formatDutchPlate,
} from "./vehicles.js";
