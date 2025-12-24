// =====================================================
// EXPENSES - TypeScript Types
// =====================================================
// Business expenses tracking with VAT deductibility
// Aligned with invoice_expenses table
// =====================================================

export type ExpenseCategory =
  | "office_supplies"
  | "it_equipment"
  | "software"
  | "marketing"
  | "training"
  | "travel"
  | "fuel"
  | "meals"
  | "accommodation"
  | "professional_services"
  | "insurance"
  | "subscriptions"
  | "other";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "paypal"
  | "other";

export interface Expense {
  id: string;
  user_id: string;

  // Expense info
  date: string; // ISO date string
  description: string;
  category: ExpenseCategory;
  supplier?: string;

  // Amounts
  amount: number; // Total amount
  vat_amount: number;
  vat_rate: number; // 0, 9, 21

  // Tax deductibility
  is_deductible: boolean;
  deductible_percentage: number; // 0-100 (for mixed private/business)

  // Receipt
  receipt_url?: string;
  receipt_base64?: string;

  // Client/Project reference
  client_id?: string;
  invoice_id?: string; // If rebilled to client

  // Payment
  payment_method?: PaymentMethod;
  is_paid: boolean;

  // Notes
  notes?: string;

  // EU Purchase (reverse charge)
  is_eu_purchase?: boolean;
  eu_country_code?: string;
  supplier_vat_number?: string;
  is_reverse_charge?: boolean;

  // Fixed Asset (depreciation)
  is_asset?: boolean;
  asset_depreciation_years?: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// EXPENSE CATEGORY INFO
// =====================================================
export interface ExpenseCategoryInfo {
  category: ExpenseCategory;
  name_nl: string;
  name_en: string;
  name_pl: string;
  default_vat_deductible: boolean;
  default_deductible_percentage: number;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryInfo[] = [
  {
    category: "office_supplies",
    name_nl: "Kantoorbenodigdheden",
    name_en: "Office Supplies",
    name_pl: "Artykuły biurowe",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
  {
    category: "it_equipment",
    name_nl: "IT Apparatuur",
    name_en: "IT Equipment",
    name_pl: "Sprzęt IT",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
  {
    category: "software",
    name_nl: "Software & Licenties",
    name_en: "Software & Licenses",
    name_pl: "Oprogramowanie i licencje",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
  {
    category: "marketing",
    name_nl: "Marketing & Reclame",
    name_en: "Marketing & Advertising",
    name_pl: "Marketing i reklama",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
  {
    category: "training",
    name_nl: "Scholing & Training",
    name_en: "Training & Education",
    name_pl: "Szkolenia",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
  {
    category: "travel",
    name_nl: "Reiskosten",
    name_en: "Travel Expenses",
    name_pl: "Koszty podróży",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
  {
    category: "fuel",
    name_nl: "Brandstof",
    name_en: "Fuel",
    name_pl: "Paliwo",
    default_vat_deductible: true,
    default_deductible_percentage: 75, // Mixed use
  },
  {
    category: "meals",
    name_nl: "Maaltijden & Horeca",
    name_en: "Meals & Catering",
    name_pl: "Posiłki",
    default_vat_deductible: false, // Not VAT deductible in NL
    default_deductible_percentage: 100,
  },
  {
    category: "accommodation",
    name_nl: "Accommodatie",
    name_en: "Accommodation",
    name_pl: "Zakwaterowanie",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
  {
    category: "professional_services",
    name_nl: "Professionele Diensten",
    name_en: "Professional Services",
    name_pl: "Usługi profesjonalne",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
  {
    category: "insurance",
    name_nl: "Verzekeringen",
    name_en: "Insurance",
    name_pl: "Ubezpieczenia",
    default_vat_deductible: false, // Usually not VAT deductible
    default_deductible_percentage: 100,
  },
  {
    category: "subscriptions",
    name_nl: "Abonnementen",
    name_en: "Subscriptions",
    name_pl: "Subskrypcje",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
  {
    category: "other",
    name_nl: "Overig",
    name_en: "Other",
    name_pl: "Inne",
    default_vat_deductible: true,
    default_deductible_percentage: 100,
  },
];

// =====================================================
// EXPENSE REPORT
// =====================================================
export interface ExpenseReport {
  total_expenses: number;
  total_vat: number;
  total_deductible: number;
  by_category: {
    category: ExpenseCategory;
    amount: number;
    count: number;
  }[];
  by_month: {
    month: string; // YYYY-MM
    amount: number;
    count: number;
  }[];
}
