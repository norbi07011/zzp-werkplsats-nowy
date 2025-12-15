// =====================================================
// BTW/VAT DECLARATIONS - TypeScript Types
// =====================================================
// Quarterly BTW declarations for Dutch ZZP
// Aligned with invoice_btw_declarations table
// =====================================================

export type BTWPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type BTWStatus = 'draft' | 'submitted' | 'paid';

// =====================================================
// BTW DECLARATION
// =====================================================
export interface BTWDeclaration {
  id: string;
  user_id: string;
  
  // Period
  year: number;
  quarter: BTWPeriod;
  
  // Status
  status: BTWStatus;
  
  // Revenue lines (omzet)
  revenue_21: number; // Revenue at 21% VAT
  revenue_9: number; // Revenue at 9% VAT
  revenue_0: number; // Revenue at 0% VAT
  revenue_eu: number; // EU B2B (reverse charge)
  revenue_export: number; // Export outside EU
  
  // Input VAT (voorbelasting - deductible)
  input_vat: number;
  
  // Calculated fields
  output_vat_21: number; // revenue_21 * 0.21
  output_vat_9: number; // revenue_9 * 0.09
  total_output_vat: number; // output_vat_21 + output_vat_9
  balance: number; // total_output_vat - input_vat (positive = to pay, negative = to receive)
  
  // Submission
  submitted_at?: string;
  paid_at?: string;
  
  // Notes
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// BTW CALCULATION DATA (for auto-fill from invoices/expenses)
// =====================================================
export interface BTWCalculationData {
  // From invoices
  revenue_21: number;
  revenue_9: number;
  revenue_0: number;
  revenue_eu: number;
  revenue_export: number;
  
  // From expenses
  input_vat_from_expenses: number;
  
  // Calculated
  output_vat_21: number;
  output_vat_9: number;
  total_output_vat: number;
  total_input_vat: number;
  balance: number;
}

// =====================================================
// BTW RATES (Netherlands)
// =====================================================
export const BTW_RATES = {
  HIGH: 21, // Standard rate
  LOW: 9, // Reduced rate
  ZERO: 0, // Zero rate
} as const;

// =====================================================
// QUARTER DATE RANGES
// =====================================================
export function getQuarterDateRange(year: number, quarter: BTWPeriod): { start: string; end: string } {
  const ranges = {
    Q1: { start: `${year}-01-01`, end: `${year}-03-31` },    Q2: { start: `${year}-04-01`, end: `${year}-06-30` },
    Q3: { start: `${year}-07-01`, end: `${year}-09-30` },
    Q4: { start: `${year}-10-01`, end: `${year}-12-31` },
  };
  return ranges[quarter];
}
