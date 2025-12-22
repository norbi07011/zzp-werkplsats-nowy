// =====================================================
// SUPABASE INVOICES HOOK
// =====================================================
// Manages all invoice operations with Supabase
// Replaces useElectronDB for invoices
// NOTE: invoice_* tables are not in generated database.types.ts
//       Using explicit any casts until types are regenerated
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";

// Helper: Create untyped Supabase query for invoice tables
// This bypasses TypeScript's strict table name checking
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const invoiceDb = supabase as any;
import type {
  Invoice,
  InvoiceLine,
  CreateInvoiceData,
  InvoiceStats,
  Company,
} from "../types/index.js";
import { generateSEPAQRCode } from "../lib/sepa-qr-generator";

interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  stats: InvoiceStats | null;
  createInvoice: (data: CreateInvoiceData) => Promise<Invoice>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  markAsPaid: (
    id: string,
    paidAmount: number,
    paymentDate: string
  ) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSupabaseInvoices(userId: string): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<InvoiceStats | null>(null);

  // =====================================================
  // FETCH ALL INVOICES
  // =====================================================
  const fetchInvoices = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch invoices with lines
      const { data: invoicesData, error: invoicesError } = await invoiceDb
        .from("invoice_invoices")
        .select("*")
        .eq("user_id", userId)
        .order("invoice_date", { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch all invoice lines for these invoices
      const invoiceIds =
        invoicesData?.map((inv: Record<string, unknown>) => inv.id as string) ||
        [];

      let linesData: InvoiceLine[] = [];
      if (invoiceIds.length > 0) {
        const { data: lines, error: linesError } = await invoiceDb
          .from("invoice_invoice_lines")
          .select("*")
          .in("invoice_id", invoiceIds)
          .order("line_number", { ascending: true });

        if (linesError) throw linesError;
        // Convert database types (string) to app types (number)
        // PostgreSQL NUMERIC returns as string
        linesData = (lines || []).map((line: Record<string, unknown>) => ({
          ...line,
          quantity:
            typeof line.quantity === "string"
              ? parseFloat(line.quantity)
              : (line.quantity as number) || 0,
          unit_price:
            typeof line.unit_price === "string"
              ? parseFloat(line.unit_price)
              : (line.unit_price as number) || 0,
          vat_rate:
            typeof line.vat_rate === "string"
              ? parseFloat(line.vat_rate)
              : (line.vat_rate as number) || 0,
          image_url: (line.image_url as string) || undefined,
        })) as InvoiceLine[];
      }

      // Combine invoices with their lines
      // Convert database types (string/null) to app types (number/undefined)
      // PostgreSQL NUMERIC returns as string, we need to convert to number
      const invoicesWithLines = (invoicesData || []).map(
        (invoice: Record<string, unknown>) => {
          const row = invoice;
          return {
            ...row,
            total_net:
              typeof row.total_net === "string"
                ? parseFloat(row.total_net)
                : (row.total_net as number) || 0,
            total_vat:
              typeof row.total_vat === "string"
                ? parseFloat(row.total_vat)
                : (row.total_vat as number) || 0,
            total_gross:
              typeof row.total_gross === "string"
                ? parseFloat(row.total_gross)
                : (row.total_gross as number) || 0,
            paid_amount:
              typeof row.paid_amount === "string"
                ? parseFloat(row.paid_amount)
                : (row.paid_amount as number) || 0,
            shipping_cost:
              typeof row.shipping_cost === "string"
                ? parseFloat(row.shipping_cost)
                : (row.shipping_cost as number) || 0,
            lines: linesData.filter((line) => line.invoice_id === invoice.id),
          };
        }
      ) as unknown as Invoice[];

      setInvoices(invoicesWithLines);
      calculateStats(invoicesWithLines);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // =====================================================
  // CALCULATE STATS
  // =====================================================
  const calculateStats = (invoiceList: Invoice[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const unpaid = invoiceList.filter((inv) => inv.status === "unpaid");
    const paid = invoiceList.filter((inv) => inv.status === "paid");

    const thisMonth = invoiceList.filter((inv) => {
      const date = new Date(inv.invoice_date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const thisYear = invoiceList.filter((inv) => {
      const date = new Date(inv.invoice_date);
      return date.getFullYear() === currentYear;
    });

    setStats({
      total_invoices: invoiceList.length,
      unpaid_count: unpaid.length,
      unpaid_amount: unpaid.reduce((sum, inv) => sum + inv.total_gross, 0),
      paid_count: paid.length,
      paid_amount: paid.reduce((sum, inv) => sum + inv.total_gross, 0),
      this_month_amount: thisMonth.reduce(
        (sum, inv) => sum + inv.total_gross,
        0
      ),
      this_year_amount: thisYear.reduce((sum, inv) => sum + inv.total_gross, 0),
    });
  };

  // =====================================================
  // CREATE INVOICE
  // =====================================================
  const createInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
    try {
      setError(null);

      // Generate invoice number (FV-YYYY-MM-XXX)
      const invoiceDate = new Date(data.invoice_date);
      const year = invoiceDate.getFullYear();
      const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");
      const prefix = `FV-${year}-${month}-`;

      // Get highest invoice number with this prefix for this user
      const { data: existingInvoices } = await invoiceDb
        .from("invoice_invoices")
        .select("invoice_number")
        .eq("user_id", userId)
        .like("invoice_number", `${prefix}%`)
        .order("invoice_number", { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingInvoices && existingInvoices.length > 0) {
        const lastNumber = existingInvoices[0].invoice_number;
        const match = lastNumber.match(/(\d{3})$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      const invoiceNumber = `${prefix}${String(nextNumber).padStart(3, "0")}`;

      // Get client snapshot
      let clientSnapshot = null;
      if (data.client_id) {
        const { data: client } = await invoiceDb
          .from("invoice_clients")
          .select("*")
          .eq("id", data.client_id)
          .single();

        clientSnapshot = client;
      }

      // Calculate totals from lines
      const totals = data.lines.reduce(
        (acc, line) => {
          const lineNet = line.quantity * line.unit_price;
          const lineVat = lineNet * (line.vat_rate / 100);
          return {
            net: acc.net + lineNet,
            vat: acc.vat + lineVat,
            gross: acc.gross + lineNet + lineVat,
          };
        },
        { net: 0, vat: 0, gross: 0 }
      );

      // Fetch company data for QR code generation
      let qrPayload: string | null = null;
      const { data: companyData } = await invoiceDb
        .from("invoice_companies")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Generate SEPA QR payload if company has IBAN
      if (companyData?.iban && totals.gross > 0) {
        try {
          qrPayload = generateSEPAQRCode({
            bic: companyData.bic || "",
            name: companyData.name || "Company",
            iban: companyData.iban,
            amount: totals.gross,
            reference: invoiceNumber,
            purpose: `Factuur ${invoiceNumber} – ${companyData.name}`,
          });
          console.log(
            "✅ SEPA QR payload generated for invoice:",
            invoiceNumber
          );
        } catch (qrError) {
          console.warn("⚠️ Could not generate SEPA QR code:", qrError);
        }
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await invoiceDb
        .from("invoice_invoices")
        .insert({
          user_id: userId,
          invoice_number: invoiceNumber,
          invoice_date: data.invoice_date,
          due_date: data.due_date,
          client_id: data.client_id,
          client_snapshot: clientSnapshot,
          language: data.language,
          status: "unpaid",
          total_net: totals.net,
          total_vat: totals.vat,
          total_gross: totals.gross,
          notes: data.notes,
          footer_text: data.footer_text,
          template_name: data.template_name,
          is_reverse_charge: data.is_reverse_charge,
          payment_qr_payload: qrPayload,
          // ========== COLORS ==========
          primary_color: data.primary_color || "#2563eb",
          secondary_color: data.secondary_color || "#f0f9ff",
          text_color: data.text_color || "#1e293b",
          background_color: data.background_color || "#ffffff",
          // ========== TYPOGRAPHY ==========
          font_family: data.font_family || "Inter",
          font_size_scale: data.font_size_scale || 1.0,
          line_height: data.line_height || 1.5,
          // ========== LAYOUT ==========
          header_align: data.header_align || "left",
          global_margin: data.global_margin || 20,
          border_radius: data.border_radius || 8,
          // ========== DESIGN FEATURES ==========
          logo_url: data.logo_url || null,
          logo_size: data.logo_size || 80,
          holographic_logo: data.holographic_logo || false,
          paper_texture: data.paper_texture || "plain",
          show_qr_code: data.show_qr_code ?? true,
          show_product_frames: data.show_product_frames || false,
          show_signature_line: data.show_signature_line || false,
          show_watermark: data.show_watermark || false,
          watermark_url: data.watermark_url || null,
          // ========== TEMPLATE STRUCTURE ==========
          blocks: data.blocks || [],
          labels: data.labels || {},
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice lines
      const linesWithCalculations = data.lines.map((line, index) => {
        const lineNet = line.quantity * line.unit_price;
        const lineVat = lineNet * (line.vat_rate / 100);
        const lineGross = lineNet + lineVat;

        return {
          invoice_id: invoice.id,
          line_number: index + 1,
          product_id: line.product_id,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unit_price: line.unit_price,
          vat_rate: line.vat_rate,
          line_net: lineNet,
          line_vat: lineVat,
          line_gross: lineGross,
          image_url: line.image_url || null,
        };
      });

      const { error: linesError } = await invoiceDb
        .from("invoice_invoice_lines")
        .insert(linesWithCalculations);

      if (linesError) throw linesError;

      // Refetch to get complete invoice with lines
      await fetchInvoices();

      // Type assertion: database types (null) -> app types (undefined)
      return { ...invoice, lines: linesWithCalculations } as unknown as Invoice;
    } catch (err) {
      console.error("Error creating invoice:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create invoice";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // UPDATE INVOICE
  // =====================================================
  const updateInvoice = async (
    id: string,
    updates: Partial<Invoice>
  ): Promise<void> => {
    try {
      setError(null);

      // Type assertion: app types (undefined) -> database types (null)
      const { error: updateError } = await invoiceDb
        .from("invoice_invoices")
        .update(updates as any)
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchInvoices();
    } catch (err) {
      console.error("Error updating invoice:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update invoice";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // DELETE INVOICE
  // =====================================================
  const deleteInvoice = async (id: string): Promise<void> => {
    try {
      setError(null);

      // Lines will be deleted automatically by CASCADE
      const { error: deleteError } = await invoiceDb
        .from("invoice_invoices")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      await fetchInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete invoice";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // MARK AS PAID
  // =====================================================
  const markAsPaid = async (
    id: string,
    paidAmount: number,
    paymentDate: string
  ): Promise<void> => {
    try {
      setError(null);

      const invoice = invoices.find((inv) => inv.id === id);
      if (!invoice) throw new Error("Invoice not found");

      let status: "paid" | "partial" | "unpaid" = "unpaid";
      if (paidAmount >= invoice.total_gross) {
        status = "paid";
      } else if (paidAmount > 0) {
        status = "partial";
      }

      const { error: updateError } = await invoiceDb
        .from("invoice_invoices")
        .update({
          paid_amount: paidAmount,
          payment_date: paymentDate,
          status: status,
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchInvoices();
    } catch (err) {
      console.error("Error marking invoice as paid:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to mark invoice as paid";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // REFETCH
  // =====================================================
  const refetch = async () => {
    await fetchInvoices();
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    stats,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    refetch,
  };
}
