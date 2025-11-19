// =====================================================
// SUPABASE INVOICES HOOK
// =====================================================
// Manages all invoice operations with Supabase
// Replaces useElectronDB for invoices
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import type {
  Invoice,
  InvoiceLine,
  CreateInvoiceData,
  InvoiceStats,
} from "../types/index.js";

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
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoice_invoices")
        .select("*")
        .eq("user_id", userId)
        .order("invoice_date", { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch all invoice lines for these invoices
      const invoiceIds = invoicesData?.map((inv) => inv.id) || [];

      let linesData: InvoiceLine[] = [];
      if (invoiceIds.length > 0) {
        const { data: lines, error: linesError } = await supabase
          .from("invoice_invoice_lines")
          .select("*")
          .in("invoice_id", invoiceIds)
          .order("line_number", { ascending: true });

        if (linesError) throw linesError;
        // Type assertion for invoice lines
        linesData = (lines || []) as unknown as InvoiceLine[];
      }

      // Combine invoices with their lines
      // Type assertion: database types (null) -> app types (undefined)
      const invoicesWithLines = (invoicesData || []).map((invoice) => ({
        ...invoice,
        lines: linesData.filter((line) => line.invoice_id === invoice.id),
      })) as unknown as Invoice[];

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

      // Get count of invoices in this month
      const { count } = await supabase
        .from("invoice_invoices")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("invoice_date", `${year}-${month}-01`)
        .lt("invoice_date", `${year}-${month}-31`);

      const invoiceNumber = `FV-${year}-${month}-${String(
        (count || 0) + 1
      ).padStart(3, "0")}`;

      // Get client snapshot
      let clientSnapshot = null;
      if (data.client_id) {
        const { data: client } = await supabase
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

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
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
        };
      });

      const { error: linesError } = await supabase
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
      const { error: updateError } = await supabase
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
      const { error: deleteError } = await supabase
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

      const { error: updateError } = await supabase
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
