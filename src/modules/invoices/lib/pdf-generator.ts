// =====================================================
// PDF GENERATOR FOR INVOICES
// =====================================================
// Generate PDF invoices with QR codes (SEPA payment)
// Supports multi-language (PL/NL/EN)
// =====================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Invoice, Company, InvoiceLanguage } from "../types/index.js";
import { formatCurrency, formatDate } from "./utils.js";
import { generateSEPAQRPayload } from "./invoice-utils.js";

// =====================================================
// TRANSLATIONS
// =====================================================
const translations = {
  pl: {
    invoice: "FAKTURA",
    invoice_number: "Numer faktury",
    invoice_date: "Data wystawienia",
    due_date: "Termin płatności",
    seller: "SPRZEDAWCA",
    buyer: "NABYWCA",
    description: "Opis",
    quantity: "Ilość",
    unit: "Jedn.",
    unit_price: "Cena jedn.",
    vat_rate: "VAT",
    net_amount: "Wartość netto",
    vat_amount: "Kwota VAT",
    gross_amount: "Wartość brutto",
    total: "RAZEM",
    payment_method: "Metoda płatności",
    bank_transfer: "Przelew bankowy",
    account_number: "Numer konta",
    notes: "Uwagi",
    thank_you: "Dziękujemy za współpracę!",
  },
  nl: {
    invoice: "FACTUUR",
    invoice_number: "Factuurnummer",
    invoice_date: "Factuurdatum",
    due_date: "Vervaldatum",
    seller: "VERKOPER",
    buyer: "KOPER",
    description: "Omschrijving",
    quantity: "Aantal",
    unit: "Eenh.",
    unit_price: "Eenheidsprijs",
    vat_rate: "BTW",
    net_amount: "Netto bedrag",
    vat_amount: "BTW bedrag",
    gross_amount: "Bruto bedrag",
    total: "TOTAAL",
    payment_method: "Betalingsmethode",
    bank_transfer: "Bankoverschrijving",
    account_number: "Rekeningnummer",
    notes: "Opmerkingen",
    thank_you: "Bedankt voor uw vertrouwen!",
  },
  en: {
    invoice: "INVOICE",
    invoice_number: "Invoice number",
    invoice_date: "Invoice date",
    due_date: "Due date",
    seller: "SELLER",
    buyer: "BUYER",
    description: "Description",
    quantity: "Qty",
    unit: "Unit",
    unit_price: "Unit price",
    vat_rate: "VAT",
    net_amount: "Net amount",
    vat_amount: "VAT amount",
    gross_amount: "Gross amount",
    total: "TOTAL",
    payment_method: "Payment method",
    bank_transfer: "Bank transfer",
    account_number: "Account number",
    notes: "Notes",
    thank_you: "Thank you for your business!",
  },
};

// =====================================================
// PDF GENERATOR CLASS
// =====================================================

// Template styling interface
export interface PDFTemplateStyle {
  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  backgroundColor?: string;
  // Typography
  fontFamily?:
    | "Inter"
    | "Playfair Display"
    | "Courier Prime"
    | "Roboto"
    | "helvetica";
  fontSize?: number;
  lineHeight?: number;
  // Layout
  headerAlign?: "left" | "center" | "right";
  globalMargin?: number;
  borderRadius?: number;
  // Design features
  logo_url?: string;
  logo_size?: number;
  holographic_logo?: boolean;
  paper_texture?: string;
  show_qr_code?: boolean;
  show_product_frames?: boolean;
  show_signature_line?: boolean;
  show_watermark?: boolean;
  watermark_url?: string;
  // Template structure
  blocks?: any[];
  labels?: Record<string, string>;
}

// Helper to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export class InvoicePDFGenerator {
  private doc: jsPDF;
  private t: typeof translations.en;
  private language: InvoiceLanguage;
  private yPosition: number = 20;
  private readonly pageWidth: number = 210; // A4 width in mm
  private readonly pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;

  // Template styling
  private templateStyle?: PDFTemplateStyle;
  private primaryColor: { r: number; g: number; b: number } = {
    r: 59,
    g: 130,
    b: 246,
  }; // Default blue
  private secondaryColor: { r: number; g: number; b: number } = {
    r: 241,
    g: 245,
    b: 249,
  }; // Default light gray
  private textColor: { r: number; g: number; b: number } = {
    r: 30,
    g: 41,
    b: 59,
  }; // Default slate-800
  private fontFamily: string = "helvetica";
  private fontSizeScale: number = 1.0;
  private lineHeight: number = 1.5;
  private logoSize: number = 80;
  private showSignatureLine: boolean = false;
  private showWatermark: boolean = false;
  private watermarkUrl: string | null = null;

  constructor(
    language: InvoiceLanguage = "nl",
    templateStyle?: PDFTemplateStyle
  ) {
    this.doc = new jsPDF();
    this.language = language;
    this.t = translations[language];
    this.templateStyle = templateStyle;

    // Apply template styling
    if (templateStyle) {
      if (templateStyle.primaryColor) {
        this.primaryColor = hexToRgb(templateStyle.primaryColor);
      }
      if (templateStyle.secondaryColor) {
        this.secondaryColor = hexToRgb(templateStyle.secondaryColor);
      }
      if (templateStyle.textColor) {
        this.textColor = hexToRgb(templateStyle.textColor);
      }
      if (templateStyle.globalMargin) {
        this.margin = templateStyle.globalMargin;
      }
      if (templateStyle.fontSize) {
        this.fontSizeScale = templateStyle.fontSize;
      }
      if (templateStyle.lineHeight) {
        this.lineHeight = templateStyle.lineHeight;
      }
      if (templateStyle.logo_size) {
        this.logoSize = templateStyle.logo_size;
      }
      if (templateStyle.show_signature_line) {
        this.showSignatureLine = templateStyle.show_signature_line;
      }
      if (templateStyle.show_watermark) {
        this.showWatermark = templateStyle.show_watermark;
      }
      if (templateStyle.watermark_url) {
        this.watermarkUrl = templateStyle.watermark_url;
      }
      // Note: jsPDF has limited font support - we map to available fonts
      if (templateStyle.fontFamily) {
        // jsPDF only supports: helvetica, courier, times
        const fontMap: Record<string, string> = {
          Inter: "helvetica",
          Roboto: "helvetica",
          "Playfair Display": "times",
          "Courier Prime": "courier",
          helvetica: "helvetica",
        };
        this.fontFamily = fontMap[templateStyle.fontFamily] || "helvetica";
      }
    }
  }

  /**
   * Add background based on paper_texture
   */
  private addBackground(): void {
    const texture = this.templateStyle?.paper_texture || "plain";
    const primaryRgb = this.primaryColor;
    const secondaryRgb = this.secondaryColor;

    // 🔍 DEBUG: Log what texture is being applied
    console.log("🖼️ [PDF-BG] Applying background:", {
      texture,
      primaryRgb,
      secondaryRgb,
      templateStyleReceived: !!this.templateStyle,
      paper_texture_raw: this.templateStyle?.paper_texture,
    });

    // Get background color (default white)
    const bgColor = this.templateStyle?.backgroundColor
      ? hexToRgb(this.templateStyle.backgroundColor)
      : { r: 255, g: 255, b: 255 };

    // First fill with background color for all textures
    this.doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");

    // Apply texture-specific effects
    switch (texture) {
      case "holographic":
        // Gradient base with secondary color
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");
        // Primary color strip at top
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.rect(0, 0, this.pageWidth, 10, "F");
        // Holographic shimmer strips
        const shimmerColors = [
          { r: 255, g: 107, b: 107 }, // Pink
          { r: 254, g: 202, b: 87 }, // Yellow
          { r: 72, g: 219, b: 251 }, // Cyan
          { r: 255, g: 159, b: 243 }, // Magenta
        ];
        for (let i = 0; i < shimmerColors.length; i++) {
          this.doc.setFillColor(
            shimmerColors[i].r,
            shimmerColors[i].g,
            shimmerColors[i].b
          );
          this.doc.rect(0, 10 + i * 2, this.pageWidth, 1.5, "F");
        }
        break;

      case "gradient_tri":
        // Secondary color base
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");
        // Primary color triangle in corner
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.triangle(0, 0, 80, 0, 0, 80, "F");
        break;

      case "gradient_geo":
        // Secondary color base
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");
        // Geometric accent - diagonal stripe
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.rect(0, 0, this.pageWidth, 8, "F");
        // Small geometric shapes
        for (let i = 0; i < 5; i++) {
          const x = this.pageWidth - 30 - i * 15;
          const y = 20 + i * 10;
          this.doc.setFillColor(
            primaryRgb.r + i * 10,
            primaryRgb.g + i * 10,
            primaryRgb.b + i * 10
          );
          this.doc.circle(x, y, 3, "F");
        }
        break;

      case "gradient_soft":
        // Soft gradient - secondary at top fading to white
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.rect(0, 0, this.pageWidth, 60, "F");
        // Primary accent line
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.rect(0, 0, this.pageWidth, 4, "F");
        break;

      case "dots":
        // Dotted pattern with primary color
        const dotColor = {
          r: Math.min(255, primaryRgb.r + 180),
          g: Math.min(255, primaryRgb.g + 180),
          b: Math.min(255, primaryRgb.b + 180),
        };
        this.doc.setFillColor(dotColor.r, dotColor.g, dotColor.b);
        for (let x = 10; x < this.pageWidth; x += 12) {
          for (let y = 10; y < this.pageHeight; y += 12) {
            this.doc.circle(x, y, 0.4, "F");
          }
        }
        break;

      case "lines":
        // Horizontal lines
        const lineColor = {
          r: Math.min(255, primaryRgb.r + 200),
          g: Math.min(255, primaryRgb.g + 200),
          b: Math.min(255, primaryRgb.b + 200),
        };
        this.doc.setDrawColor(lineColor.r, lineColor.g, lineColor.b);
        this.doc.setLineWidth(0.1);
        for (let y = 20; y < this.pageHeight; y += 8) {
          this.doc.line(this.margin, y, this.pageWidth - this.margin, y);
        }
        break;

      case "grain":
        // Subtle grain effect
        this.doc.setFillColor(245, 245, 245);
        for (let i = 0; i < 300; i++) {
          const x = Math.random() * this.pageWidth;
          const y = Math.random() * this.pageHeight;
          this.doc.rect(x, y, 0.2, 0.2, "F");
        }
        break;

      // plain = already filled with background color above
    }
  }

  /**
   * Generate complete invoice PDF
   */
  async generateInvoice(invoice: Invoice, company: Company): Promise<Blob> {
    // Reset position
    this.yPosition = 20;

    // Add background texture/gradient
    this.addBackground();

    // Add header with logo and invoice number
    await this.addHeader(company, invoice);

    // Add invoice info (now empty - handled in header/parties)
    this.addInvoiceInfo(invoice);

    // Add client and invoice details (matching preview layout)
    this.addParties(company, invoice);

    // Add line items table (async to load product images)
    await this.addLineItemsTable(invoice);

    // Add totals
    this.addTotals(invoice);

    // Add payment info
    this.addPaymentInfo(company, invoice);

    // Add QR code if SEPA data available
    if (company.iban && invoice.payment_qr_payload) {
      await this.addQRCode(invoice.payment_qr_payload);
    }

    // Add footer
    this.addFooter(invoice);

    // Return as blob
    return this.doc.output("blob");
  }

  /**
   * Add company header with logo (matching preview layout)
   */
  private async addHeader(company: Company, invoice?: Invoice): Promise<void> {
    const logoHeight = 20; // mm
    let logoWidth = 0;
    const logoX = this.margin;
    const logoY = this.yPosition - 5;

    // Add company logo if available
    // Priority: 1. Design logo (templateStyle.logo_url), 2. Company base64, 3. Company URL
    const logoSource =
      this.templateStyle?.logo_url || company.logo_base64 || company.logo_url;

    if (logoSource) {
      try {
        // If it's already base64 data URL, use directly
        if (logoSource.startsWith("data:")) {
          const img = await this.loadImageFromDataUrl(logoSource);
          if (img) {
            const aspectRatio = img.width / img.height;
            logoWidth = Math.min(50, logoHeight * aspectRatio);

            // Add holographic effect (colored border around logo)
            if (this.templateStyle?.holographic_logo) {
              // Multi-color border effect
              const colors = [
                { r: 255, g: 0, b: 128 }, // Pink
                { r: 0, g: 255, b: 255 }, // Cyan
                { r: 255, g: 255, b: 0 }, // Yellow
              ];
              for (let i = 0; i < 3; i++) {
                const offset = (i + 1) * 0.5;
                this.doc.setDrawColor(colors[i].r, colors[i].g, colors[i].b);
                this.doc.setLineWidth(0.3);
                this.doc.roundedRect(
                  logoX - offset,
                  logoY - offset,
                  logoWidth + offset * 2,
                  logoHeight + offset * 2,
                  2,
                  2,
                  "S"
                );
              }
            }

            this.doc.addImage(
              logoSource,
              "PNG",
              logoX,
              logoY,
              logoWidth,
              logoHeight
            );
          }
        } else if (!logoSource.startsWith("blob:")) {
          // Load from URL (skip blob URLs - they don't work)
          const img = await this.loadImage(logoSource);
          if (img) {
            const aspectRatio = img.width / img.height;
            logoWidth = Math.min(50, logoHeight * aspectRatio);

            if (this.templateStyle?.holographic_logo) {
              const colors = [
                { r: 255, g: 0, b: 128 },
                { r: 0, g: 255, b: 255 },
                { r: 255, g: 255, b: 0 },
              ];
              for (let i = 0; i < 3; i++) {
                const offset = (i + 1) * 0.5;
                this.doc.setDrawColor(colors[i].r, colors[i].g, colors[i].b);
                this.doc.setLineWidth(0.3);
                this.doc.roundedRect(
                  logoX - offset,
                  logoY - offset,
                  logoWidth + offset * 2,
                  logoHeight + offset * 2,
                  2,
                  2,
                  "S"
                );
              }
            }

            this.doc.addImage(
              img.dataUrl,
              "PNG",
              logoX,
              logoY,
              logoWidth,
              logoHeight
            );
          }
        }
      } catch (error) {
        console.error("Error loading logo:", error);
      }
    }

    // Company name UNDER the logo (like preview)
    const companyInfoY = this.yPosition + logoHeight;
    this.doc.setFontSize(16);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.text(company.name, this.margin, companyInfoY);

    // Company details under name
    this.doc.setFontSize(8);
    this.doc.setFont(this.fontFamily, "normal");
    this.doc.setTextColor(80, 80, 80);
    let detailY = companyInfoY + 5;
    if (company.address) {
      this.doc.text(company.address, this.margin, detailY);
      detailY += 4;
    }
    if (company.postal_code || company.city) {
      this.doc.text(
        `${company.postal_code || ""} ${company.city || ""}`,
        this.margin,
        detailY
      );
      detailY += 4;
    }
    if (company.kvk_number) {
      this.doc.text(`KVK: ${company.kvk_number}`, this.margin, detailY);
      detailY += 4;
    }
    if (company.vat_number) {
      this.doc.text(`BTW: ${company.vat_number}`, this.margin, detailY);
      detailY += 4;
    }
    if (company.email) {
      this.doc.text(company.email, this.margin, detailY);
    }
    this.doc.setTextColor(0, 0, 0);

    // Invoice title (right side) - use primary color
    this.doc.setFontSize(28);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.setTextColor(
      this.primaryColor.r,
      this.primaryColor.g,
      this.primaryColor.b
    );
    this.doc.text(
      this.t.invoice,
      this.pageWidth - this.margin,
      this.yPosition + 5,
      { align: "right" }
    );

    // Invoice number under title
    if (invoice) {
      this.doc.setFontSize(12);
      this.doc.setFont(this.fontFamily, "normal");
      this.doc.text(
        invoice.invoice_number,
        this.pageWidth - this.margin,
        this.yPosition + 14,
        { align: "right" }
      );
    }
    this.doc.setTextColor(0, 0, 0);

    this.yPosition = Math.max(detailY + 5, this.yPosition + logoHeight + 25);

    // Add colored accent line under header
    this.doc.setDrawColor(
      this.primaryColor.r,
      this.primaryColor.g,
      this.primaryColor.b
    );
    this.doc.setLineWidth(1);
    this.doc.line(
      this.margin,
      this.yPosition,
      this.pageWidth - this.margin,
      this.yPosition
    );
    this.yPosition += 8;
  }

  /**
   * Load image from URL and convert to base64
   */
  private async loadImage(
    url: string
  ): Promise<{ dataUrl: string; width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            resolve({
              dataUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error("Canvas error:", e);
          resolve(null);
        }
      };
      img.onerror = () => {
        console.error("Failed to load image:", url);
        resolve(null);
      };
      img.src = url;
    });
  }

  /**
   * Load image dimensions from data URL (base64)
   */
  private async loadImageFromDataUrl(
    dataUrl: string
  ): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        console.error("Failed to load base64 image");
        resolve(null);
      };
      img.src = dataUrl;
    });
  }

  /**
   * Add invoice number, date, due date (combined with client info like preview)
   */
  private addInvoiceInfo(invoice: Invoice): void {
    // Skip - will be handled in addParties to match preview layout
  }

  /**
   * Add client and invoice details in two columns (matching preview layout)
   */
  private addParties(company: Company, invoice: Invoice): void {
    const clientData = invoice.client_snapshot as any;
    const midX = this.pageWidth / 2;

    // Left column: "Factuur aan" (Client info)
    this.doc.setFontSize(10);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.text("Factuur aan", this.margin, this.yPosition);

    // Underline
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    this.doc.line(
      this.margin,
      this.yPosition + 2,
      this.margin + 40,
      this.yPosition + 2
    );

    const clientY = this.yPosition + 7;
    this.doc.setFontSize(9);
    if (clientData) {
      this.doc.setFont(this.fontFamily, "bold");
      this.doc.text(clientData.name || "", this.margin, clientY);
      this.doc.setFont(this.fontFamily, "normal");
      this.doc.text(clientData.address || "", this.margin, clientY + 5);
      this.doc.text(
        `${clientData.postal_code || ""} ${clientData.city || ""}`,
        this.margin,
        clientY + 10
      );
      if (clientData.vat_number) {
        this.doc.text(
          `BTW: ${clientData.vat_number}`,
          this.margin,
          clientY + 15
        );
      }
    } else {
      this.doc.setFont(this.fontFamily, "normal");
      this.doc.setTextColor(150, 150, 150);
      this.doc.text("Klant selecteren...", this.margin, clientY);
      this.doc.setTextColor(0, 0, 0);
    }

    // Right column: "Factuurgegevens" (Invoice details)
    this.doc.setFontSize(10);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.text("Factuurgegevens", midX + 10, this.yPosition);

    // Underline
    this.doc.line(midX + 10, this.yPosition + 2, midX + 55, this.yPosition + 2);

    const detailsY = this.yPosition + 7;
    this.doc.setFontSize(9);
    this.doc.setFont(this.fontFamily, "normal");

    // Factuurdatum
    this.doc.setTextColor(100, 100, 100);
    this.doc.text("Factuurdatum:", midX + 10, detailsY);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.text(formatDate(invoice.invoice_date), midX + 70, detailsY);

    // Vervaldatum
    this.doc.setFont(this.fontFamily, "normal");
    this.doc.setTextColor(100, 100, 100);
    this.doc.text("Vervaldatum:", midX + 10, detailsY + 5);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.text(formatDate(invoice.due_date), midX + 70, detailsY + 5);

    this.doc.setDrawColor(0, 0, 0);
    this.yPosition += 30;
  }

  /**
   * Add line items table with product images
   */
  private async addLineItemsTable(invoice: Invoice): Promise<void> {
    const tableTop = this.yPosition;
    // 6 columns matching preview: Foto, Omschrijving, Aantal, Prijs, BTW, Bedrag
    const colWidths = [18, 52, 20, 25, 20, 30]; // Total ~165mm (page - 2*margin = 170mm)
    const colX = [
      this.margin,
      this.margin + colWidths[0],
      this.margin + colWidths[0] + colWidths[1],
      this.margin + colWidths[0] + colWidths[1] + colWidths[2],
      this.margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
      this.margin +
        colWidths[0] +
        colWidths[1] +
        colWidths[2] +
        colWidths[3] +
        colWidths[4],
    ];

    // Table header - use secondary color (light background like preview)
    this.doc.setFillColor(
      this.secondaryColor.r,
      this.secondaryColor.g,
      this.secondaryColor.b
    );
    this.doc.rect(
      this.margin,
      tableTop,
      this.pageWidth - 2 * this.margin,
      8,
      "F"
    );

    // Bottom border for header
    this.doc.setDrawColor(180, 180, 180);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      tableTop + 8,
      this.pageWidth - this.margin,
      tableTop + 8
    );

    this.doc.setFontSize(8);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.setTextColor(30, 30, 30); // Dark text on light header (like preview)
    // Use Dutch labels matching preview exactly
    this.doc.text("Foto", colX[0] + 2, tableTop + 5.5);
    this.doc.text("Omschrijving", colX[1] + 2, tableTop + 5.5);
    this.doc.text("Aantal", colX[2] + 2, tableTop + 5.5);
    this.doc.text("Prijs", colX[3] + 2, tableTop + 5.5);
    this.doc.text("BTW", colX[4] + 2, tableTop + 5.5);
    this.doc.text("Bedrag", colX[5] + 2, tableTop + 5.5);

    this.yPosition = tableTop + 11;

    // Table rows - reset text color
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont(this.fontFamily, "normal");
    this.doc.setDrawColor(220, 220, 220);
    const imageSize = 12; // mm for product image
    const rowHeight = Math.max(imageSize + 2, 8); // Row height to fit image

    for (const line of invoice.lines || []) {
      // Add product image if available
      if (line.image_url) {
        try {
          const img = await this.loadImage(line.image_url);
          if (img) {
            const aspectRatio = img.width / img.height;
            let imgWidth = imageSize;
            let imgHeight = imageSize;

            if (aspectRatio > 1) {
              imgHeight = imageSize / aspectRatio;
            } else {
              imgWidth = imageSize * aspectRatio;
            }

            // Center image in cell
            const imgX = colX[0] + (colWidths[0] - imgWidth) / 2;
            const imgY = this.yPosition - 5 + (rowHeight - imgHeight) / 2;

            this.doc.addImage(
              img.dataUrl,
              "PNG",
              imgX,
              imgY,
              imgWidth,
              imgHeight
            );
          }
        } catch (e) {
          console.error("Failed to add product image:", e);
        }
      } else {
        // Draw placeholder dash for no image
        this.doc.setTextColor(180, 180, 180);
        this.doc.text(
          "—",
          colX[0] + colWidths[0] / 2 - 2,
          this.yPosition + rowHeight / 2 - 3
        );
        this.doc.setTextColor(0, 0, 0);
      }

      // Description
      const desc =
        line.description.length > 35
          ? line.description.substring(0, 32) + "..."
          : line.description;
      this.doc.setTextColor(50, 50, 50);
      this.doc.text(desc, colX[1] + 2, this.yPosition);

      // Quantity with unit
      this.doc.setTextColor(80, 80, 80);
      const qtyText = line.unit
        ? `${line.quantity} ${line.unit}`
        : line.quantity.toString();
      this.doc.text(qtyText, colX[2] + 2, this.yPosition);

      // Unit price
      this.doc.text(
        formatCurrency(line.unit_price),
        colX[3] + 2,
        this.yPosition
      );

      // VAT rate
      this.doc.text(`${line.vat_rate}%`, colX[4] + 2, this.yPosition);

      // Gross amount (bold)
      this.doc.setTextColor(30, 30, 30);
      this.doc.setFont(this.fontFamily, "bold");
      this.doc.text(
        formatCurrency(line.line_gross),
        colX[5] + 2,
        this.yPosition
      );
      this.doc.setFont(this.fontFamily, "normal");

      this.yPosition += rowHeight;

      // Row separator line (like preview)
      this.doc.setLineWidth(0.2);
      this.doc.line(
        this.margin,
        this.yPosition - 2,
        this.pageWidth - this.margin,
        this.yPosition - 2
      );
    }

    this.doc.setDrawColor(0, 0, 0);
    this.yPosition += 8;
  }

  /**
   * Add totals section (matching preview layout)
   */
  private addTotals(invoice: Invoice): void {
    const rightX = this.pageWidth - this.margin;
    const boxWidth = 75;
    const labelX = rightX - boxWidth;

    this.doc.setFontSize(9);
    this.doc.setFont(this.fontFamily, "normal");

    // Subtotaal (excl. BTW)
    this.doc.setTextColor(100, 100, 100);
    this.doc.text("Subtotaal (excl. BTW):", labelX, this.yPosition);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(formatCurrency(invoice.total_net), rightX, this.yPosition, {
      align: "right",
    });

    // Underline
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.2);
    this.doc.line(labelX, this.yPosition + 2, rightX, this.yPosition + 2);
    this.yPosition += 7;

    // BTW
    this.doc.setTextColor(100, 100, 100);
    this.doc.text("BTW:", labelX, this.yPosition);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(formatCurrency(invoice.total_vat), rightX, this.yPosition, {
      align: "right",
    });

    // Underline
    this.doc.line(labelX, this.yPosition + 2, rightX, this.yPosition + 2);
    this.yPosition += 7;

    // Reverse charge warning if applicable
    if (invoice.is_reverse_charge) {
      this.doc.setFontSize(7);
      this.doc.setTextColor(180, 120, 0);
      this.doc.text("⚠️ BTW verlegd (reverse charge)", labelX, this.yPosition);
      this.doc.setTextColor(0, 0, 0);
      this.yPosition += 5;
    }

    // Totaal line (bold, with thick border)
    this.doc.setDrawColor(30, 30, 30);
    this.doc.setLineWidth(0.8);
    this.doc.line(labelX, this.yPosition, rightX, this.yPosition);
    this.yPosition += 5;

    this.doc.setFontSize(12);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.text("Totaal:", labelX, this.yPosition);
    this.doc.setTextColor(
      this.primaryColor.r,
      this.primaryColor.g,
      this.primaryColor.b
    );
    this.doc.text(formatCurrency(invoice.total_gross), rightX, this.yPosition, {
      align: "right",
    });
    this.doc.setTextColor(0, 0, 0);
    this.doc.setDrawColor(0, 0, 0);
    this.yPosition += 10;
  }

  /**
   * Add payment information (matching preview: Betalingsgegevens)
   */
  private addPaymentInfo(company: Company, invoice: Invoice): void {
    this.doc.setFontSize(10);
    this.doc.setFont(this.fontFamily, "bold");
    this.doc.text("Betalingsgegevens", this.margin, this.yPosition);
    this.yPosition += 6;

    this.doc.setFontSize(9);
    this.doc.setFont(this.fontFamily, "normal");
    this.doc.setTextColor(100, 100, 100);

    if (company.iban) {
      this.doc.text("IBAN:", this.margin, this.yPosition);
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont(this.fontFamily, "bold");
      this.doc.text(company.iban, this.margin + 20, this.yPosition);
      this.yPosition += 5;
    }

    if (company.bic) {
      this.doc.setFont(this.fontFamily, "normal");
      this.doc.setTextColor(100, 100, 100);
      this.doc.text("BIC:", this.margin, this.yPosition);
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(company.bic, this.margin + 20, this.yPosition);
      this.yPosition += 5;
    }

    // T.n.v. (company name)
    this.doc.setFont(this.fontFamily, "normal");
    this.doc.setTextColor(100, 100, 100);
    this.doc.text("T.n.v.:", this.margin, this.yPosition);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(company.name, this.margin + 20, this.yPosition);
    this.yPosition += 5;

    // Reference note
    this.doc.setFontSize(7);
    this.doc.setTextColor(130, 130, 130);
    this.doc.text(
      `Vermeld het factuurnummer bij betaling: ${invoice.invoice_number}`,
      this.margin,
      this.yPosition
    );
    this.doc.setTextColor(0, 0, 0);
    this.yPosition += 10;
  }

  /**
   * Add SEPA QR code for payment
   */
  private async addQRCode(qrPayload: string): Promise<void> {
    try {
      const qrDataURL = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 1,
      });

      const qrSize = 35;
      const qrX = this.pageWidth - this.margin - qrSize;
      const qrY = this.yPosition - 35;

      this.doc.addImage(qrDataURL, "PNG", qrX, qrY, qrSize, qrSize);

      // QR code label
      this.doc.setFontSize(7);
      this.doc.setFont(this.fontFamily, "normal");
      this.doc.setTextColor(100, 100, 100);
      this.doc.text("Scan om te betalen", qrX + qrSize / 2, qrY + qrSize + 4, {
        align: "center",
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }

  /**
   * Add footer with notes and thank you message (matching preview)
   */
  private addFooter(invoice: Invoice): void {
    // Notes section with separator
    if (invoice.notes) {
      // Separator line
      this.doc.setDrawColor(220, 220, 220);
      this.doc.setLineWidth(0.3);
      this.doc.line(
        this.margin,
        this.yPosition,
        this.pageWidth - this.margin,
        this.yPosition
      );
      this.yPosition += 6;

      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(invoice.notes, this.margin, this.yPosition, {
        maxWidth: this.pageWidth - 2 * this.margin,
      });
    }

    // Thank you message at bottom
    this.doc.setFontSize(9);
    this.doc.setTextColor(130, 130, 130);
    this.doc.text(
      "Bedankt voor uw vertrouwen!",
      this.pageWidth / 2,
      this.pageHeight - this.margin - 5,
      { align: "center" }
    );
    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Download PDF
   */
  downloadPDF(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * Get PDF as blob
   */
  getBlob(): Blob {
    return this.doc.output("blob");
  }
}

/**
 * Helper function to generate and download invoice PDF
 * @param invoice - The invoice data
 * @param company - The company data (includes logo_url)
 * @param download - Whether to trigger download (default: true)
 * @param templateStyle - Optional template styling (colors, fonts)
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  company: Company,
  download: boolean = true,
  templateStyle?: PDFTemplateStyle
): Promise<Blob> {
  const generator = new InvoicePDFGenerator(invoice.language, templateStyle);
  const blob = await generator.generateInvoice(invoice, company);

  if (download) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoice_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return blob;
}
