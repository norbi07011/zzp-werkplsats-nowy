/**
 * =====================================================
 * INVOICE TEMPLATES - PREBUILT STYLES
 * =====================================================
 * 5 profesjonalnych szablonów faktur z MESSU-BOUW
 * Classic, Modern, Minimal, Professional, Creative
 * =====================================================
 */

export interface InvoiceTemplateStyle {
  id: string;
  name: string;
  style: "classic" | "modern" | "minimal" | "professional" | "creative";
  description: string;
  config: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    headerStyle: "spacious" | "compact" | "centered";
    tableStyle: "lined" | "striped" | "bordered" | "minimal";
    footerStyle: "detailed" | "standard" | "compact";
    showLogo: boolean;
    showQRCode: boolean;
    showBankDetails: boolean;
    showWeekNumber: boolean;
  };
}

export const defaultInvoiceTemplates: InvoiceTemplateStyle[] = [
  {
    id: "classic",
    name: "Classic Professional",
    style: "classic",
    description:
      "Traditional business invoice with clear structure and professional appearance",
    config: {
      primaryColor: "#1a1a1a",
      accentColor: "#3b82f6",
      fontFamily: "Inter",
      headerStyle: "spacious",
      tableStyle: "lined",
      footerStyle: "detailed",
      showLogo: true,
      showQRCode: true,
      showBankDetails: true,
      showWeekNumber: true,
    },
  },
  {
    id: "modern",
    name: "Modern Blue",
    style: "modern",
    description:
      "Contemporary design with bold blue accents and clean typography",
    config: {
      primaryColor: "#3b82f6",
      accentColor: "#60a5fa",
      fontFamily: "Inter",
      headerStyle: "compact",
      tableStyle: "striped",
      footerStyle: "standard",
      showLogo: true,
      showQRCode: true,
      showBankDetails: true,
      showWeekNumber: true,
    },
  },
  {
    id: "minimal",
    name: "Minimal Clean",
    style: "minimal",
    description:
      "Minimalist layout focusing on essential information with maximum white space",
    config: {
      primaryColor: "#374151",
      accentColor: "#6b7280",
      fontFamily: "Inter",
      headerStyle: "centered",
      tableStyle: "minimal",
      footerStyle: "compact",
      showLogo: true,
      showQRCode: true,
      showBankDetails: false,
      showWeekNumber: false,
    },
  },
  {
    id: "professional",
    name: "Professional Corporate",
    style: "professional",
    description:
      "Executive-level invoice with detailed information and formal presentation",
    config: {
      primaryColor: "#1e3a5f",
      accentColor: "#2563eb",
      fontFamily: "Inter",
      headerStyle: "spacious",
      tableStyle: "bordered",
      footerStyle: "detailed",
      showLogo: true,
      showQRCode: true,
      showBankDetails: true,
      showWeekNumber: true,
    },
  },
  {
    id: "creative",
    name: "Creative Orange",
    style: "creative",
    description:
      "Vibrant and energetic design with orange accents for creative businesses",
    config: {
      primaryColor: "#ea580c",
      accentColor: "#f97316",
      fontFamily: "Inter",
      headerStyle: "compact",
      tableStyle: "striped",
      footerStyle: "standard",
      showLogo: true,
      showQRCode: true,
      showBankDetails: true,
      showWeekNumber: true,
    },
  },
];

export function getTemplateById(
  templateId: string
): InvoiceTemplateStyle | undefined {
  return defaultInvoiceTemplates.find((t) => t.id === templateId);
}

export function getTemplateStyles(): InvoiceTemplateStyle[] {
  return defaultInvoiceTemplates;
}
