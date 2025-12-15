// =====================================================
// INVOICE DESIGN TYPES
// =====================================================
// Shared types for template/design system
// Used by Documents.tsx, Timesheets.tsx, InvoiceForm.tsx
// =====================================================

// --- Block System Types ---
export type BlockType =
  | "heading_h1"
  | "heading_h2"
  | "heading_h3"
  | "paragraph"
  | "list"
  | "quote"
  | "divider"
  | "spacer"
  | "columns_2"
  | "image"
  | "qr"
  | "gallery"
  | "table_simple"
  | "price_list"
  | "signature"
  | "date"
  | "page_number"
  // Werkbon Specific
  | "checklist"
  | "materials_table"
  | "info_grid"
  | "input_box";

export interface DocBlock {
  id: string;
  type: BlockType;
  content: any; // Flexible content based on type
  styles?: React.CSSProperties;
}

export interface CVEntry {
  id: string;
  title: string;
  subtitle: string;
  dateRange: string;
  description: string;
}

export interface CVSkill {
  id: string;
  name: string;
  level: number;
}

export interface ContractArticle {
  id: string;
  title: string;
  content: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
}

// =====================================================
// MAIN INVOICE DESIGN INTERFACE
// =====================================================
export interface InvoiceDesign {
  id: string;
  user_id: string;
  name: string;
  type: "INVOICE" | "TIMESHEET" | "OFFER" | "CONTRACT" | "CV" | "LETTER";
  primary_color: string;
  secondary_color: string;
  text_color: string;
  background_color: string;
  font_family:
    | "Inter"
    | "Playfair Display"
    | "Courier Prime"
    | "Roboto"
    | "Lato"
    | "Montserrat";
  font_size_scale: number;
  line_height: number;
  header_align: "left" | "center" | "right";
  global_margin: number;
  border_radius: number;
  paper_texture: "plain" | "dots" | "lines" | "grain";
  logo_url?: string;
  logo_size: number;
  holographic_logo: boolean;
  show_qr_code: boolean;
  show_product_frames: boolean;
  show_signature_line: boolean;
  show_watermark: boolean;
  show_page_numbers: boolean;
  watermark_url?: string;
  blocks: DocBlock[];
  // Template System (Phase 1)
  is_template?: boolean; // TRUE for predefined templates
  template_category?: string; // "standard" | "product" | "service" | "creditnota" | etc
  is_locked?: boolean; // TRUE = cannot add/remove blocks
  base_template_id?: string; // References original template (for user copies)
  labels: {
    title: string;
    invoiceNo: string;
    from: string;
    to: string;
    total: string;
    date: string;
    dueDate: string;
  };
  cv_profile_photo?: string;
  cv_data?: {
    phone: string;
    email: string;
    address: string;
    bio: string;
    experience: CVEntry[];
    education: CVEntry[];
    skills: CVSkill[];
    languages: CVSkill[];
  };
  offer_data?: {
    introTitle: string;
    introText: string;
    gallery: GalleryImage[];
    scope: any[];
  };
  contract_data?: {
    partyA: string;
    partyB: string;
    articles: ContractArticle[];
  };
  letter_data?: {
    recipientName: string;
    recipientAddress: string;
    subject: string;
    body: string;
  };
  // Timesheet-specific fields
  ts_project_ref?: string;
  ts_project_name?: string;
  ts_project_manager?: string;
  ts_completion_percentage?: number;
  ts_materials?: any[];
  ts_departure_address?: string;
  ts_arrival_address?: string;
  ts_kilometers?: number;
  ts_rate_per_km?: number;
  ts_locations?: any[];
  created_at: string;
  updated_at: string;
}

// =====================================================
// CREATE/UPDATE TYPES (for Supabase operations)
// =====================================================
export type CreateInvoiceDesignData = Omit<
  InvoiceDesign,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type UpdateInvoiceDesignData = Partial<
  Omit<InvoiceDesign, "id" | "user_id" | "created_at" | "updated_at">
>;
