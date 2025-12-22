// =====================================================
// INVOICE HOOKS - CENTRAL EXPORT
// =====================================================
// All Supabase hooks for invoice module
// =====================================================

export { useSupabaseInvoices } from "./useSupabaseInvoices.js";
export { useSupabaseClients } from "./useSupabaseClients.js";
export { useSupabaseProducts } from "./useSupabaseProducts.js";
export { useSupabaseCompany } from "./useSupabaseCompany.js";
export { useSupabaseExpenses } from "./useSupabaseExpenses.js";
export { useSupabaseBTW } from "./useSupabaseBTW.js";
export { useSupabaseKilometers } from "./useSupabaseKilometers.js";
export { useSupabaseVehicles } from "./useSupabaseVehicles.js";
export { useSupabaseInvoiceDesigns } from "./useSupabaseInvoiceDesigns.js";

// Advanced BTW hooks
export {
  useKOR,
  useBTWHealthScore,
  useBTWAnalytics,
  useBTWDeadlines,
} from "./useBTWAdvanced.js";
export type {
  KORStatus,
  KORCalculation,
  BTWHealthScore,
  BTWAnalytics,
  BTWDeadline,
} from "./useBTWAdvanced.js";
