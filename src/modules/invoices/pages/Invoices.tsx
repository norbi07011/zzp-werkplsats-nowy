// =====================================================
// INVOICES PAGE
// =====================================================
// List all invoices with export/download functionality
// Adapted from NORBS for ZZP Werkplaats with Supabase
// =====================================================

import { useState, useMemo } from "react";
import { useTranslation } from "../i18n";
import {
  useSupabaseInvoices,
  useSupabaseClients,
  useSupabaseCompany,
} from "../hooks";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  formatCurrency,
  formatDate,
  generateInvoicePDF,
  TEMPLATE_STYLE_PRESETS,
} from "../lib";
import { useAuth } from "../../../../contexts/AuthContext";

interface InvoicesProps {
  onNavigate: (page: string, invoiceId?: string) => void;
}

export default function Invoices({ onNavigate }: InvoicesProps) {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const {
    invoices,
    loading: invoicesLoading,
    updateInvoice,
    deleteInvoice,
  } = useSupabaseInvoices(user?.id || "");
  const { clients, loading: clientsLoading } = useSupabaseClients(
    user?.id || ""
  );
  const { company, loading: companyLoading } = useSupabaseCompany(
    user?.id || ""
  );
  const [selectedTemplateId] = useState("classic");

  const sortedInvoices = useMemo(() => {
    return (invoices || []).sort(
      (a, b) =>
        new Date(b.created_at || "").getTime() -
        new Date(a.created_at || "").getTime()
    );
  }, [invoices]);

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "success" | "warning" | "error"
    > = {
      paid: "success",
      unpaid: "error",
      partial: "warning",
      cancelled: "secondary",
    };

    const labels: Record<string, string> = {
      paid: t.invoices.statuses.paid,
      unpaid: t.invoices.statuses.unpaid,
      partial: t.invoices.statuses.partial,
      cancelled: t.invoices.statuses.cancelled,
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleGeneratePDF = async (invoice: any) => {
    const client = clients?.find((c) => c.id === invoice.client_id);
    if (!client || !company) {
      alert("Missing data");
      return;
    }

    // 🔍 DEBUG: Log invoice data to trace template mismatch
    console.log("📄 [PDF-GEN] Invoice data from database:", {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      template_name: invoice.template_name,
      paper_texture: invoice.paper_texture,
      primary_color: invoice.primary_color,
      secondary_color: invoice.secondary_color,
      background_color: invoice.background_color,
    });

    try {
      // Use invoice's custom colors if available, fallback to preset
      const templateName = invoice.template_name || "classic";
      const presetStyle =
        TEMPLATE_STYLE_PRESETS[templateName] || TEMPLATE_STYLE_PRESETS.classic;

      // Override with invoice's custom style settings if they exist
      const templateStyle = {
        ...presetStyle,
        // Colors
        primaryColor: invoice.primary_color || presetStyle.primaryColor,
        secondaryColor: invoice.secondary_color || presetStyle.secondaryColor,
        textColor: invoice.text_color || "#1e293b",
        backgroundColor: invoice.background_color || "#ffffff",
        // Typography
        fontFamily: invoice.font_family || "Inter",
        fontSize: invoice.font_size_scale || 1.0,
        lineHeight: invoice.line_height || 1.5,
        // Layout
        headerAlign: invoice.header_align || "left",
        globalMargin: invoice.global_margin || 20,
        borderRadius: invoice.border_radius || 8,
        // Design features from invoice
        logo_url: invoice.logo_url || undefined,
        logo_size: invoice.logo_size || 80,
        holographic_logo: invoice.holographic_logo || false,
        paper_texture: invoice.paper_texture || "plain",
        show_qr_code: invoice.show_qr_code ?? true,
        show_product_frames: invoice.show_product_frames || false,
        show_signature_line: invoice.show_signature_line || false,
        show_watermark: invoice.show_watermark || false,
        watermark_url: invoice.watermark_url || undefined,
        // Template structure
        blocks: invoice.blocks || [],
        labels: invoice.labels || {},
      };

      // 🔍 DEBUG: Log final templateStyle passed to PDF generator
      console.log("🎨 [PDF-GEN] Final templateStyle:", {
        paper_texture: templateStyle.paper_texture,
        primaryColor: templateStyle.primaryColor,
        secondaryColor: templateStyle.secondaryColor,
        backgroundColor: templateStyle.backgroundColor,
      });

      await generateInvoicePDF(invoice, company, true, templateStyle);
      alert("PDF generated");
    } catch (error) {
      alert("Failed to generate PDF");
      console.error(error);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const invoice = invoices?.find((inv) => inv.id === invoiceId);
      if (invoice) {
        await updateInvoice(invoiceId, {
          status: "paid" as const,
        });
        alert("Faktura oznaczona jako opłacona");
      }
    } catch (error) {
      alert("Błąd podczas oznaczania jako opłacone");
      console.error("Mark paid error:", error);
    }
  };

  const handleDeleteInvoice = async (
    invoiceId: string,
    invoiceNumber: string
  ) => {
    if (
      !window.confirm(`Czy na pewno chcesz usunąć fakturę ${invoiceNumber}?`)
    ) {
      return;
    }

    try {
      await deleteInvoice(invoiceId);
      alert("Faktura usunięta pomyślnie");
    } catch (error) {
      alert("Błąd podczas usuwania faktury");
      console.error("Delete invoice error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                📄 {t.invoices.title}
              </h1>
              <p className="text-blue-100 text-lg">
                Zarządzaj wszystkimi fakturami w jednym miejscu
              </p>
            </div>
            <Button
              onClick={() => onNavigate("invoice-form")}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-xl"
            >
              ➕ {t.invoices.newInvoice}
            </Button>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-xl"></div>
        </div>

        {/* Modern Invoices Card */}
        <Card className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-gray-500/5"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t.invoices.title}
                </h2>
                <p className="text-gray-600">Wszystkie faktury w systemie</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>

            {invoicesLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">{t.common.loading}</p>
              </div>
            ) : sortedInvoices.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl inline-block mb-6">
                  <svg
                    className="w-16 h-16 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Brak faktur
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Utwórz pierwszą fakturę
                </p>
                <Button
                  onClick={() => onNavigate("invoice-form")}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-xl"
                >
                  ➕ {t.invoices.newInvoice}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Modern Table Header */}
                  <div className="grid grid-cols-7 gap-4 p-4 bg-gradient-to-r from-slate-100 to-gray-100 rounded-t-xl border-b border-gray-200">
                    <div className="font-bold text-gray-700">
                      {t.invoices.invoiceNumber}
                    </div>
                    <div className="font-bold text-gray-700">
                      {t.invoices.client}
                    </div>
                    <div className="font-bold text-gray-700">
                      {t.invoices.invoiceDate}
                    </div>
                    <div className="font-bold text-gray-700">
                      {t.invoices.dueDate}
                    </div>
                    <div className="font-bold text-gray-700 text-right">
                      {t.invoices.amount}
                    </div>
                    <div className="font-bold text-gray-700">
                      {t.invoices.status}
                    </div>
                    <div className="font-bold text-gray-700 text-right">
                      {t.invoices.actions}
                    </div>
                  </div>

                  {/* Modern Table Body */}
                  <div className="space-y-2 p-2">
                    {sortedInvoices.map((invoice) => {
                      const client = clients?.find(
                        (c) => c.id === invoice.client_id
                      );
                      return (
                        <div
                          key={invoice.id}
                          className="group relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 p-4 hover:bg-white/80 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                          <div className="relative grid grid-cols-7 gap-4 items-center">
                            <div className="font-mono font-bold text-gray-900">
                              {invoice.invoice_number}
                            </div>
                            <div className="font-medium text-gray-800">
                              {client?.name || "Unknown"}
                            </div>
                            <div className="font-mono text-sm text-gray-600">
                              {formatDate(invoice.invoice_date)}
                            </div>
                            <div className="font-mono text-sm text-gray-600">
                              {formatDate(invoice.due_date)}
                            </div>
                            <div className="text-right font-mono font-bold text-gray-900">
                              {formatCurrency(invoice.total_gross)}
                            </div>
                            <div>{getStatusBadge(invoice.status)}</div>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleGeneratePDF(invoice)}
                                  className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-colors duration-200"
                                  title="Download PDF"
                                >
                                  <svg
                                    className="w-4 h-4 text-indigo-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </button>
                                {invoice.status !== "paid" && (
                                  <button
                                    onClick={() => handleMarkPaid(invoice.id)}
                                    className="p-2 bg-green-100 hover:bg-green-200 rounded-xl transition-colors duration-200"
                                    title="Mark as paid"
                                  >
                                    <svg
                                      className="w-4 h-4 text-green-600"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate("invoice-form", invoice.id);
                                  }}
                                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors duration-200"
                                  title="Edytuj fakturę"
                                >
                                  <svg
                                    className="w-4 h-4 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteInvoice(
                                      invoice.id,
                                      invoice.invoice_number
                                    );
                                  }}
                                  className="p-2 bg-red-100 hover:bg-red-200 rounded-xl transition-colors duration-200"
                                  title="Usuń fakturę"
                                >
                                  <svg
                                    className="w-4 h-4 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-indigo-200/20 rounded-full blur-xl group-hover:bg-purple-200/30 transition-all duration-300"></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
