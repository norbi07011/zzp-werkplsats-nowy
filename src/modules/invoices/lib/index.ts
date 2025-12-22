// =====================================================
// LIB - CENTRAL EXPORT
// =====================================================
// All utility functions and helpers for invoice module
// =====================================================

// Utils
export {
  cn,
  formatCurrency,
  formatDate,
  parseNumber,
  round2,
} from "./utils.js";

// Invoice utilities
export {
  generateSEPAQRPayload,
  generatePaymentReference,
  calculateLineTotals,
  calculateInvoiceTotals,
  getNextInvoiceNumber,
  validateIBAN,
  formatIBAN,
  validateVATNumber,
  getClientSnapshot,
  getDaysUntilDue,
  isInvoiceOverdue,
  getInvoiceStatusColor,
  exportInvoicesToCSV,
} from "./invoice-utils.js";

// PDF Generator
export {
  InvoicePDFGenerator,
  generateInvoicePDF,
  type PDFTemplateStyle,
} from "./pdf-generator.js";

// Gradient Styles
export {
  GRADIENT_STYLES,
  getGradientById,
  getGradientsByCategory,
  getGradientCategories,
  gradientToPDFStyle,
  type GradientStyle,
} from "./gradient-styles.js";

// =====================================================
// TEMPLATE STYLE PRESETS
// =====================================================
// Only 2 template types:
// 1. work_hours - Godzinówka / Praca (niebieski)
// 2. product_gallery - Produkty ze zdjęciami (pomarańczowy)
// =====================================================

import type { PDFTemplateStyle } from "./pdf-generator.js";
import { GRADIENT_STYLES as GRADIENTS } from "./gradient-styles.js";

// Build presets from gradient styles
const gradientPresets: Record<string, PDFTemplateStyle> = {};
GRADIENTS.forEach((g) => {
  gradientPresets[g.id] = {
    primaryColor: g.primaryColor,
    secondaryColor: g.secondaryColor,
    fontFamily: "helvetica",
  };
});

export const TEMPLATE_STYLE_PRESETS: Record<string, PDFTemplateStyle> = {
  // Default fallback
  classic: {
    primaryColor: "#2563eb", // Blue 600
    secondaryColor: "#f0f9ff", // Sky 50
    fontFamily: "helvetica",
  },

  // === GŁÓWNE 2 TYPY FAKTUR ===

  // 1. Godzinówka / Praca - niebieski profesjonalny
  work_hours: {
    primaryColor: "#1e40af", // Blue 800 (profesjonalny ciemny niebieski)
    secondaryColor: "#dbeafe", // Blue 100
    fontFamily: "helvetica",
  },

  // 2. Produkty ze zdjęciami - pomarańczowy energiczny
  product_gallery: {
    primaryColor: "#ea580c", // Orange 600
    secondaryColor: "#ffedd5", // Orange 100
    fontFamily: "helvetica",
  },

  // === GRADIENT STYLES ===
  ...gradientPresets,
};
