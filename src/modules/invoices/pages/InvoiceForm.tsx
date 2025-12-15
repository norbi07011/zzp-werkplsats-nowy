// =====================================================
// INVOICE FORM PAGE
// =====================================================
// Create/Edit invoice with lines, client selection, VAT
// Adapted from NORBS for ZZP Werkplaats (SIMPLIFIED)
// =====================================================

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "../i18n";
import {
  useSupabaseInvoices,
  useSupabaseClients,
  useSupabaseProducts,
  useSupabaseCompany,
} from "../hooks";
import { supabase } from "@/lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import {
  formatCurrency,
  calculateLineTotals,
  calculateInvoiceTotals,
} from "../lib";
import { useAuth } from "../../../../contexts/AuthContext";
import type { InvoiceLine, CreateInvoiceData } from "../types";
import {
  ArrowRight,
  Box,
  Briefcase,
  Clock,
  Image as ImageIcon,
  Palette,
} from "lucide-react";

// --- Types from Documents.tsx ---
interface InvoiceDesign {
  id: string;
  name: string;
  type: "INVOICE" | "TIMESHEET" | "OFFER" | "CONTRACT" | "CV" | "LETTER";
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: "Inter" | "Playfair Display" | "Courier Prime" | "Roboto";
  blocks?: any[];
  is_template?: boolean;
  template_category?: string;
  user_id?: string;
}

interface InvoiceFormProps {
  onNavigate: (page: string, invoiceId?: string) => void;
  editInvoiceId?: string | null;
}

export default function InvoiceForm({
  onNavigate,
  editInvoiceId,
}: InvoiceFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { clients } = useSupabaseClients(user?.id || "");
  const { products } = useSupabaseProducts(user?.id || "");
  const { company } = useSupabaseCompany(user?.id || "");
  const { invoices, createInvoice, updateInvoice } = useSupabaseInvoices(
    user?.id || ""
  );

  // --- Load templates from Supabase (predefined) + localStorage (user-created) ---
  const [predefinedTemplates, setPredefinedTemplates] = useState<
    InvoiceDesign[]
  >([]);
  const [userTemplates] = useState<InvoiceDesign[]>(() => {
    const saved = localStorage.getItem("invoice-designs");
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch predefined templates from Supabase on mount
  useEffect(() => {
    const fetchPredefinedTemplates = async () => {
      const { data, error } = await supabase
        .from("invoice_designs")
        .select("*")
        .eq("is_template", true)
        .eq("type", "INVOICE") // Only INVOICE type templates
        .order("template_category", { ascending: true });

      if (!error && data) {
        // Map snake_case database columns to camelCase interface
        const mapped = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          primaryColor: d.primary_color,
          secondaryColor: d.secondary_color,
          fontFamily: d.font_family,
          blocks: d.blocks,
          is_template: d.is_template,
          template_category: d.template_category,
          user_id: d.user_id,
        }));
        setPredefinedTemplates(mapped as InvoiceDesign[]);
      }
    };

    fetchPredefinedTemplates();
  }, []);

  // Combine predefined templates with user-created templates
  const availableTemplates = useMemo(
    () => [
      ...predefinedTemplates,
      ...userTemplates.filter((d) => d.type === "INVOICE"),
    ],
    [predefinedTemplates, userTemplates]
  );

  const [selectedDesignId, setSelectedDesignId] = useState<string>("");

  // Determine if we're in edit mode (must be before useEffect that uses it)
  const isEditMode = !!editInvoiceId;
  const invoiceToEdit = isEditMode
    ? invoices?.find((inv) => inv.id === editInvoiceId)
    : null;

  // Auto-select first template when templates load
  useEffect(() => {
    if (availableTemplates.length > 0 && !selectedDesignId && !isEditMode) {
      setSelectedDesignId(availableTemplates[0].id);
    }
  }, [availableTemplates, selectedDesignId, isEditMode]);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentTermDays, setPaymentTermDays] = useState(14);
  const [reverseCharge, setReverseCharge] = useState(false);
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState<"pl" | "nl" | "en">("nl");
  const [lines, setLines] = useState<Array<Partial<InvoiceLine>>>([
    {
      description: "",
      quantity: 1,
      unit_price: 0,
      vat_rate: 21,
      unit: "uur",
    },
  ]);

  // --- PRODUCT_GALLERY template fields ---
  const [galleryImages, setGalleryImages] = useState<
    Array<{ url: string; caption?: string }>
  >([]);
  const [shippingCost, setShippingCost] = useState(0);

  // --- WORK_SERVICES template fields ---
  const [projectRef, setProjectRef] = useState("");
  const [workHours, setWorkHours] = useState<
    Array<{
      date: string;
      description: string;
      hours: number;
      rate: number;
    }>
  >([
    {
      date: new Date().toISOString().split("T")[0],
      description: "",
      hours: 0,
      rate: 0,
    },
  ]);
  const [materials, setMaterials] = useState<
    Array<{
      description: string;
      quantity: number;
      price: number;
    }>
  >([{ description: "", quantity: 1, price: 0 }]);

  // Detect selected template category
  const selectedTemplate =
    availableTemplates.find((t) => t.id === selectedDesignId) ||
    availableTemplates[0];
  const templateCategory = selectedTemplate?.template_category || "standard";

  // DEBUG: Log template detection
  console.log("🎨 Template Debug:", {
    selectedDesignId,
    selectedTemplateName: selectedTemplate?.name,
    templateCategory,
    availableCount: availableTemplates.length,
  });

  const DUTCH_VAT_RATES = [
    { value: 0, label: "0% (VAT exempt / Export)" },
    { value: 9, label: "9% (Reduced rate)" },
    { value: 21, label: "21% (Standard rate)" },
  ];

  useEffect(() => {
    if (isEditMode && invoiceToEdit) {
      setSelectedClientId(invoiceToEdit.client_id || "");
      setInvoiceDate(invoiceToEdit.invoice_date);
      setNotes(invoiceToEdit.notes || "");
      setLanguage(invoiceToEdit.language || "nl");
      setReverseCharge(invoiceToEdit.is_reverse_charge);

      const issue = new Date(invoiceToEdit.invoice_date);
      const due = new Date(invoiceToEdit.due_date);
      const diffDays = Math.floor(
        (due.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24)
      );
      setPaymentTermDays(diffDays);

      if (invoiceToEdit.lines && invoiceToEdit.lines.length > 0) {
        setLines(
          invoiceToEdit.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            vat_rate: line.vat_rate,
            unit: line.unit,
          }))
        );
      }
    }
  }, [isEditMode, invoiceToEdit]);

  const dueDate = useMemo(() => {
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + paymentTermDays);
    return date.toISOString().split("T")[0];
  }, [invoiceDate, paymentTermDays]);

  const totals = useMemo(() => {
    const validLines = lines.filter(
      (l) => l.description && l.quantity && l.unit_price !== undefined
    );
    const calculatedLines: InvoiceLine[] = validLines.map((l, index) => {
      const actualVatRate = reverseCharge ? 0 : l.vat_rate || 0;
      const lineTotals = calculateLineTotals({ ...l, vat_rate: actualVatRate });
      return {
        id: "",
        invoice_id: "",
        line_number: index + 1,
        description: l.description!,
        quantity: l.quantity!,
        unit: l.unit || "uur",
        unit_price: l.unit_price!,
        vat_rate: actualVatRate,
        line_net: lineTotals.net,
        line_vat: lineTotals.vat,
        line_gross: lineTotals.gross,
        created_at: "",
      };
    });
    return calculateInvoiceTotals(calculatedLines);
  }, [lines, reverseCharge]);

  // ========== WORK_SERVICES: Combined totals including workHours and materials ==========
  const workHoursTotals = useMemo(() => {
    const net = workHours.reduce(
      (sum, e) => sum + (e.hours || 0) * (e.rate || 0),
      0
    );
    const vatRate = reverseCharge ? 0 : 21; // Default Dutch VAT rate
    const vat = net * (vatRate / 100);
    return {
      total_net: Math.round(net * 100) / 100,
      total_vat: Math.round(vat * 100) / 100,
      total_gross: Math.round((net + vat) * 100) / 100,
    };
  }, [workHours, reverseCharge]);

  const materialsTotals = useMemo(() => {
    const net = materials.reduce(
      (sum, m) => sum + (m.quantity || 0) * (m.price || 0),
      0
    );
    const vatRate = reverseCharge ? 0 : 21; // Default Dutch VAT rate
    const vat = net * (vatRate / 100);
    return {
      total_net: Math.round(net * 100) / 100,
      total_vat: Math.round(vat * 100) / 100,
      total_gross: Math.round((net + vat) * 100) / 100,
    };
  }, [materials, reverseCharge]);

  // Combined totals for WORK_SERVICES template
  const combinedTotals = useMemo(() => {
    // For work_services template: add workHours + materials + standard lines
    const total_net =
      totals.total_net + workHoursTotals.total_net + materialsTotals.total_net;
    const total_vat =
      totals.total_vat + workHoursTotals.total_vat + materialsTotals.total_vat;
    const total_gross =
      totals.total_gross +
      workHoursTotals.total_gross +
      materialsTotals.total_gross;

    return {
      total_net: Math.round(total_net * 100) / 100,
      total_vat: Math.round(total_vat * 100) / 100,
      total_gross: Math.round(total_gross * 100) / 100,
    };
  }, [totals, workHoursTotals, materialsTotals]);

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        vat_rate: 21,
        unit: "uur",
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSaveInvoice = async () => {
    if (!selectedClientId) {
      alert("Please select a client");
      return;
    }

    // For work_services template: allow saving with just workHours or materials (no standard lines required)
    const hasWorkHoursData =
      templateCategory === "work_services" &&
      workHours.some((w) => w.hours > 0 && w.rate > 0);
    const hasMaterialsData =
      templateCategory === "work_services" &&
      materials.some((m) => m.description && m.price > 0);
    const hasStandardLines =
      lines.length > 0 && lines.some((l) => l.description);

    if (!hasStandardLines && !hasWorkHoursData && !hasMaterialsData) {
      alert(
        "⚠️ Dodaj przynajmniej jedną pozycję faktury, godziny pracy lub materiały"
      );
      return;
    }

    if (!company) {
      alert(
        "❌ Brak profilu firmy! Przejdź do Ustawień i wypełnij dane firmy."
      );
      return;
    }

    // Build invoice lines from all sources
    let allLines: Array<{
      line_number: number;
      description: string;
      quantity: number;
      unit: string;
      unit_price: number;
      vat_rate: number;
      line_net: number;
      line_vat: number;
      line_gross: number;
    }> = [];

    let lineCounter = 1;

    // Add work hours as invoice lines (for work_services template)
    if (templateCategory === "work_services" && hasWorkHoursData) {
      workHours
        .filter((w) => w.hours > 0 && w.rate > 0)
        .forEach((w) => {
          const actualVatRate = reverseCharge ? 0 : 21;
          const net = w.hours * w.rate;
          const vat = net * (actualVatRate / 100);
          allLines.push({
            line_number: lineCounter++,
            description: `${w.date}: ${w.description || "Werkzaamheden"}`,
            quantity: w.hours,
            unit: "uur",
            unit_price: w.rate,
            vat_rate: actualVatRate,
            line_net: Math.round(net * 100) / 100,
            line_vat: Math.round(vat * 100) / 100,
            line_gross: Math.round((net + vat) * 100) / 100,
          });
        });
    }

    // Add materials as invoice lines (for work_services template)
    if (templateCategory === "work_services" && hasMaterialsData) {
      materials
        .filter((m) => m.description && m.price > 0)
        .forEach((m) => {
          const actualVatRate = reverseCharge ? 0 : 21;
          const net = m.quantity * m.price;
          const vat = net * (actualVatRate / 100);
          allLines.push({
            line_number: lineCounter++,
            description: `Materiaal: ${m.description}`,
            quantity: m.quantity,
            unit: "stuk",
            unit_price: m.price,
            vat_rate: actualVatRate,
            line_net: Math.round(net * 100) / 100,
            line_vat: Math.round(vat * 100) / 100,
            line_gross: Math.round((net + vat) * 100) / 100,
          });
        });
    }

    // Add standard lines
    if (hasStandardLines) {
      lines
        .filter((l) => l.description)
        .forEach((l) => {
          const actualVatRate = reverseCharge ? 0 : l.vat_rate || 0;
          const lineTotals = calculateLineTotals({
            ...l,
            vat_rate: actualVatRate,
          });
          allLines.push({
            line_number: lineCounter++,
            description: l.description!,
            quantity: l.quantity!,
            unit: l.unit || "uur",
            unit_price: l.unit_price!,
            vat_rate: actualVatRate,
            line_net: lineTotals.net,
            line_vat: lineTotals.vat,
            line_gross: lineTotals.gross,
          });
        });
    }

    const invoiceData: CreateInvoiceData = {
      client_id: selectedClientId,
      invoice_date: invoiceDate,
      due_date: dueDate,
      language,
      is_reverse_charge: reverseCharge,
      notes,
      template_name: "modern",
      lines: allLines,

      // PRODUCT_GALLERY template-specific data
      ...(templateCategory === "product_gallery" && {
        gallery_images: galleryImages,
        shipping_cost: shippingCost,
      }),

      // WORK_SERVICES template-specific data (keep as metadata for reference)
      ...(templateCategory === "work_services" && {
        project_ref: projectRef,
        work_hours: workHours,
        materials: materials,
      }),
    };

    try {
      if (isEditMode && invoiceToEdit) {
        await updateInvoice(invoiceToEdit.id, {
          ...invoiceData,
          invoice_number: invoiceToEdit.invoice_number,
        } as any);
        alert(`Faktura zaktualizowana`);
      } else {
        await createInvoice(invoiceData);
        alert(`Faktura utworzona pomyślnie!`);
      }

      setTimeout(() => {
        onNavigate("invoices");
      }, 100);
    } catch (error) {
      alert(
        isEditMode
          ? "Błąd podczas aktualizacji faktury"
          : "Błąd podczas tworzenia faktury"
      );
      console.error("Save invoice error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Template Selector */}
        {!isEditMode && availableTemplates.length > 0 && (
          <Card className="p-5">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Palette size={14} /> Wybierz Szablon Faktury
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {availableTemplates.map((temp) => (
                <button
                  key={temp.id}
                  onClick={() => setSelectedDesignId(temp.id)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 text-left transition-all min-w-[140px] ${
                    selectedDesignId === temp.id ||
                    (!selectedDesignId && temp === availableTemplates[0])
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 ring-offset-1"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <div
                    className="w-full h-2 rounded mb-2"
                    style={{ backgroundColor: temp.primaryColor || "#0ea5e9" }}
                  ></div>
                  <div className="font-bold text-sm text-slate-800 truncate">
                    {temp.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {temp.fontFamily || "Inter"}
                  </div>
                  {temp.is_template && (
                    <div className="text-[9px] text-blue-600 font-bold mt-1 uppercase tracking-wide">
                      Predefined
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* No Templates Warning */}
        {!isEditMode && availableTemplates.length === 0 && (
          <Card className="bg-blue-50 border-2 border-blue-200 p-6 text-center">
            <Palette size={40} className="mx-auto mb-3 text-blue-500" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Brak Szablonów Faktur
            </h3>
            <p className="text-slate-600 mb-4 text-sm">
              Możesz stworzyć profesjonalny szablon faktury w sekcji{" "}
              <strong>Dokumenty</strong>.
            </p>
            <a
              href="/invoices/documents"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors text-sm"
            >
              Przejdź do Dokumentów <ArrowRight size={16} />
            </a>
          </Card>
        )}

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                {isEditMode
                  ? `📝 ${t.invoiceForm.editTitle}`
                  : `➕ ${t.invoiceForm.createTitle}`}
              </h1>
              <p className="text-blue-100 text-lg">
                {isEditMode
                  ? `Edytuj fakturę ${invoiceToEdit?.invoice_number}`
                  : "Utwórz nową fakturę"}
              </p>
            </div>
            <Button
              onClick={() => onNavigate("invoices")}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300"
            >
              {t.common.cancel}
            </Button>
          </div>
        </div>

        {/* Warning jeśli brak company */}
        {!company && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🚫</div>
              <div>
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  Brak profilu firmy!
                </h3>
                <p className="text-red-800 mb-3">
                  Nie możesz utworzyć faktury bez profilu firmy. Przejdź do{" "}
                  <strong>Ustawień</strong> i wypełnij dane firmy.
                </p>
                <Button
                  onClick={() => onNavigate("settings")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  ⚙️ Przejdź do Ustawień
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Client & Date Info */}
        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t.invoiceForm.selectClient}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t.clients.name} *
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                <option value="">{t.invoiceForm.selectClient}</option>
                {(clients || []).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t.invoices.invoiceDate} *
              </label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t.clients.paymentTermDays}
              </label>
              <select
                value={paymentTermDays.toString()}
                onChange={(e) => setPaymentTermDays(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                <option value="7">7 dagen</option>
                <option value="14">14 dagen (Standaard NL)</option>
                <option value="30">30 dagen</option>
                <option value="60">60 dagen</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t.invoices.dueDate}
              </label>
              <Input
                type="date"
                value={dueDate}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t.invoiceForm.language}
              </label>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as "pl" | "nl" | "en")
                }
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                <option value="nl">Nederlands (NL)</option>
                <option value="en">English (EN)</option>
                <option value="pl">Polski (PL)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="reverseCharge"
                checked={reverseCharge}
                onChange={(e) => setReverseCharge(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="reverseCharge" className="text-sm text-gray-700">
                {t.invoiceForm.reverseCharge}
              </label>
            </div>
          </div>
        </Card>

        {/* ==================== PRODUCT_GALLERY TEMPLATE FIELDS ==================== */}
        {templateCategory === "product_gallery" && (
          <>
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon size={24} className="text-emerald-600" />
                Galeria Zdjęć Produktów
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Dodaj do 6 zdjęć produktów, które będą widoczne w fakturze (grid
                3x2)
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.url}
                      alt={img.caption || `Produkt ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-emerald-200"
                    />
                    <button
                      onClick={() =>
                        setGalleryImages(
                          galleryImages.filter((_, i) => i !== idx)
                        )
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    <Input
                      placeholder="Podpis zdjęcia..."
                      value={img.caption || ""}
                      onChange={(e) => {
                        const updated = [...galleryImages];
                        updated[idx].caption = e.target.value;
                        setGalleryImages(updated);
                      }}
                      className="mt-2 text-xs"
                    />
                  </div>
                ))}
              </div>

              {galleryImages.length < 6 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Dodaj zdjęcie (URL)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      id="new-image-url"
                      placeholder="https://example.com/product.jpg"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        const input = document.getElementById(
                          "new-image-url"
                        ) as HTMLInputElement;
                        if (input.value) {
                          setGalleryImages([
                            ...galleryImages,
                            { url: input.value, caption: "" },
                          ]);
                          input.value = "";
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      ➕ Dodaj
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Pozostało: {6 - galleryImages.length} zdjęć
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-blue-50 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                💶 Koszty Wysyłki
              </h3>
              <div className="max-w-xs space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Koszt wysyłki (EUR)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) =>
                    setShippingCost(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-600">
                  Zostanie dodane do podsumowania jako "Verzendkosten"
                </p>
              </div>
            </Card>
          </>
        )}

        {/* ==================== WORK_SERVICES TEMPLATE FIELDS ==================== */}
        {templateCategory === "work_services" && (
          <>
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase size={24} className="text-blue-600" />
                Referencja Projektu
              </h2>
              <div className="max-w-md space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Numer projektu / Referencja
                </label>
                <Input
                  type="text"
                  value={projectRef}
                  onChange={(e) => setProjectRef(e.target.value)}
                  placeholder="PRJ-2025-001"
                  className="font-mono"
                />
                <p className="text-xs text-gray-600">
                  Opcjonalne - zostanie wyświetlone w metadanych faktury
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock size={24} className="text-purple-600" />
                  Godziny Pracy
                </h2>
                <Button
                  onClick={() =>
                    setWorkHours([
                      ...workHours,
                      {
                        date: new Date().toISOString().split("T")[0],
                        description: "",
                        hours: 0,
                        rate: 0,
                      },
                    ])
                  }
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  ➕ Dodaj wpis
                </Button>
              </div>

              <div className="space-y-3">
                {workHours.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-lg border border-purple-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-purple-700">
                        Wpis {idx + 1}
                      </span>
                      {workHours.length > 1 && (
                        <button
                          onClick={() =>
                            setWorkHours(workHours.filter((_, i) => i !== idx))
                          }
                          className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                        >
                          🗑️ Usuń
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">
                          Data
                        </label>
                        <Input
                          type="date"
                          value={entry.date}
                          onChange={(e) => {
                            const updated = [...workHours];
                            updated[idx].date = e.target.value;
                            setWorkHours(updated);
                          }}
                        />
                      </div>

                      <div className="space-y-1 md:col-span-1">
                        <label className="text-xs font-medium text-gray-600">
                          Opis pracy
                        </label>
                        <Input
                          value={entry.description}
                          onChange={(e) => {
                            const updated = [...workHours];
                            updated[idx].description = e.target.value;
                            setWorkHours(updated);
                          }}
                          placeholder="Malowanie pokoju..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">
                          Godziny
                        </label>
                        <Input
                          type="number"
                          step="0.5"
                          value={entry.hours}
                          onChange={(e) => {
                            const updated = [...workHours];
                            updated[idx].hours =
                              parseFloat(e.target.value) || 0;
                            setWorkHours(updated);
                          }}
                          placeholder="8"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">
                          Stawka (EUR)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={entry.rate}
                          onChange={(e) => {
                            const updated = [...workHours];
                            updated[idx].rate = parseFloat(e.target.value) || 0;
                            setWorkHours(updated);
                          }}
                          placeholder="25.00"
                        />
                      </div>
                    </div>

                    <div className="text-right pt-2 border-t border-purple-100">
                      <span className="text-sm font-semibold text-purple-900">
                        Razem: €{(entry.hours * entry.rate).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                <div className="text-sm font-semibold text-purple-900">
                  Suma godzin pracy: €
                  {workHours
                    .reduce((sum, e) => sum + e.hours * e.rate, 0)
                    .toFixed(2)}
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Box size={24} className="text-amber-600" />
                  Materiały i Onkosten
                </h2>
                <Button
                  onClick={() =>
                    setMaterials([
                      ...materials,
                      { description: "", quantity: 1, price: 0 },
                    ])
                  }
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  ➕ Dodaj materiał
                </Button>
              </div>

              <div className="space-y-3">
                {materials.map((mat, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-lg border border-amber-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                  >
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-gray-600">
                        Opis materiału
                      </label>
                      <Input
                        value={mat.description}
                        onChange={(e) => {
                          const updated = [...materials];
                          updated[idx].description = e.target.value;
                          setMaterials(updated);
                        }}
                        placeholder="Farba biała 10L..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">
                        Ilość
                      </label>
                      <Input
                        type="number"
                        step="1"
                        value={mat.quantity}
                        onChange={(e) => {
                          const updated = [...materials];
                          updated[idx].quantity = parseInt(e.target.value) || 1;
                          setMaterials(updated);
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">
                        Cena (EUR)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={mat.price}
                          onChange={(e) => {
                            const updated = [...materials];
                            updated[idx].price =
                              parseFloat(e.target.value) || 0;
                            setMaterials(updated);
                          }}
                          placeholder="45.00"
                        />
                        {materials.length > 1 && (
                          <button
                            onClick={() =>
                              setMaterials(
                                materials.filter((_, i) => i !== idx)
                              )
                            }
                            className="text-red-600 hover:bg-red-50 px-2 rounded"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                <div className="text-sm font-semibold text-amber-900">
                  Suma materiałów: €
                  {materials
                    .reduce((sum, m) => sum + m.quantity * m.price, 0)
                    .toFixed(2)}
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Invoice Lines */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {t.invoiceForm.addLine}
            </h2>
            <Button
              onClick={handleAddLine}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              ➕ {t.invoiceForm.addLine}
            </Button>
          </div>

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-xl bg-white/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    Item {index + 1}
                  </span>
                  {lines.length > 1 && (
                    <button
                      onClick={() => handleRemoveLine(index)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🗑️ {t.common.delete}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t.invoiceForm.description} *
                    </label>
                    <Textarea
                      value={line.description || ""}
                      onChange={(e) =>
                        handleLineChange(index, "description", e.target.value)
                      }
                      placeholder="Week 39 - Diensten"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t.invoiceForm.quantity} *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.quantity || 0}
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          "quantity",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t.invoiceForm.unitPrice} (EUR) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.unit_price || 0}
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          "unit_price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t.invoiceForm.vatRate} (%)
                    </label>
                    <select
                      value={(reverseCharge
                        ? 0
                        : line.vat_rate || 0
                      ).toString()}
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          "vat_rate",
                          parseFloat(e.target.value)
                        )
                      }
                      disabled={reverseCharge}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {DUTCH_VAT_RATES.map((rate) => (
                        <option key={rate.value} value={rate.value}>
                          {rate.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-3 gap-3 pt-2 border-t">
                    <div>
                      <div className="text-xs text-gray-600">
                        {t.invoiceForm.netAmount}
                      </div>
                      <div className="font-mono font-bold text-sm">
                        {formatCurrency(
                          calculateLineTotals({ ...line, vat_rate: 0 }).net
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">
                        {t.invoiceForm.vatAmount}
                      </div>
                      <div className="font-mono font-bold text-sm">
                        {formatCurrency(
                          calculateLineTotals({
                            ...line,
                            vat_rate: reverseCharge ? 0 : line.vat_rate || 0,
                          }).vat
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">
                        {t.invoiceForm.grossAmount}
                      </div>
                      <div className="font-mono font-bold text-base text-blue-600">
                        {formatCurrency(
                          calculateLineTotals({
                            ...line,
                            vat_rate: reverseCharge ? 0 : line.vat_rate || 0,
                          }).gross
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t.invoiceForm.notes}
          </h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opmerkingen voor de klant..."
            rows={4}
          />
        </Card>

        {/* Summary */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t.invoiceForm.total}
          </h2>

          {/* WORK_SERVICES: Show breakdown of all components */}
          {templateCategory === "work_services" &&
            (workHoursTotals.total_net > 0 ||
              materialsTotals.total_net > 0) && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-amber-50 rounded-xl border border-purple-200 space-y-2">
                <h3 className="text-sm font-bold text-slate-700 mb-2">
                  📊 Rozbicie kosztów:
                </h3>
                {workHoursTotals.total_net > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">
                      🕐 Godziny pracy (netto):
                    </span>
                    <span className="font-mono font-semibold text-purple-800">
                      {formatCurrency(workHoursTotals.total_net)}
                    </span>
                  </div>
                )}
                {materialsTotals.total_net > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-700">
                      📦 Materiały (netto):
                    </span>
                    <span className="font-mono font-semibold text-amber-800">
                      {formatCurrency(materialsTotals.total_net)}
                    </span>
                  </div>
                )}
                {totals.total_net > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      📝 Dodatkowe pozycje (netto):
                    </span>
                    <span className="font-mono font-semibold text-slate-700">
                      {formatCurrency(totals.total_net)}
                    </span>
                  </div>
                )}
              </div>
            )}

          <div className="space-y-3 max-w-md ml-auto">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">{t.invoiceForm.netAmount}:</span>
              <span className="font-mono font-semibold">
                {formatCurrency(
                  templateCategory === "work_services"
                    ? combinedTotals.total_net
                    : totals.total_net
                )}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">{t.invoiceForm.vatAmount}:</span>
              <span className="font-mono font-semibold">
                {formatCurrency(
                  templateCategory === "work_services"
                    ? combinedTotals.total_vat
                    : totals.total_vat
                )}
              </span>
            </div>
            {reverseCharge && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                Verleggingsregeling - BTW 0%
              </div>
            )}
            <div className="flex justify-between pt-3 border-t-2 border-blue-600">
              <span className="text-xl font-bold">
                {t.invoiceForm.grossAmount}:
              </span>
              <span className="text-xl font-mono font-bold text-blue-600">
                {formatCurrency(
                  templateCategory === "work_services"
                    ? combinedTotals.total_gross
                    : totals.total_gross
                )}
              </span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={() => onNavigate("invoices")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3"
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSaveInvoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-bold"
          >
            {t.common.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
