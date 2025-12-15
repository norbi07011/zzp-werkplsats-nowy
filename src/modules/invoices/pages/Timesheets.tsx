import React, { useState, useEffect, useMemo } from "react";














import { useAuth } from "../../../../contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { InvoiceDesign } from "../types/InvoiceDesign";

// Helper to get ISO week number and dates
const getWeekRange = (date: Date) => {
  const current = new Date(date);
  const first = current.getDate() - current.getDay() + 1; // Monday
  const last = first + 6; // Sunday

  const monday = new Date(current.setDate(first));
  const sunday = new Date(current.setDate(last));

  return {
    start: monday,
    end: sunday,
    weekNumber: getWeekNumber(monday),
  };
};

const getWeekNumber = (d: Date) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const DAYS = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

export const Timesheets: React.FC = () => {
  const { user } = useAuth();

  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekInfo, setWeekInfo] = useState(getWeekRange(new Date()));
  const [predefinedTemplates, setPredefinedTemplates] = useState<
    InvoiceDesign[]
  >([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string>("");

  const [employeeName, setEmployeeName] = useState(
    user?.email || "Messu Owner"
  );
  const [projectAddress, setProjectAddress] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRateOnPrint, setShowRateOnPrint] = useState(false); // Toggle stawka na wydruku

  // Timesheet Data State
  const [entries, setEntries] = useState(
    DAYS.map(() => ({
      start: "",
      end: "",
      breakMins: 0,
      total: 0,
      desc: "",
    }))
  );

  // Template-specific fields state
  // Project-based fields
  const [projectRef, setProjectRef] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectManager, setProjectManager] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Materials fields
  const [materials, setMaterials] = useState<
    Array<{ name: string; quantity: number; unitPrice: number; total: number }>
  >([]);

  // Kilometers fields
  const [departureAddress, setDepartureAddress] = useState("");
  const [arrivalAddress, setArrivalAddress] = useState("");
  const [kilometers, setKilometers] = useState(0);
  const [ratePerKm, setRatePerKm] = useState(0.21); // NL/BE 2024 standard

  // Multi-location fields
  const [locations, setLocations] = useState<
    Array<{
      date: string;
      address: string;
      start: string;
      end: string;
      workType: string;
      hours: number;
    }>
  >([]);

  // Fetch templates from Supabase
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from("invoice_designs")
        .select("*")
        .eq("is_template", true)
        .eq("type", "TIMESHEET")
        .order("name", { ascending: true });

      if (!error && data) {
        // Map database schema to InvoiceDesign type (same as Documents.tsx)
        const templates = data.map((t) => ({
          id: t.id,
          user_id: t.user_id,
          name: t.design_name,
          type: "TIMESHEET" as const,
          primary_color: "#f97316",
          secondary_color: "#f1f5f9",
          text_color: "#1e293b",
          background_color: "#ffffff",
          font_family: "Inter" as const,
          font_size_scale: 1.0,
          line_height: 1.5,
          header_align: "left" as const,
          global_margin: 15,
          border_radius: 0,
          paper_texture: "plain" as const,
          logo_size: 80,
          holographic_logo: false,
          show_qr_code: true,
          show_product_frames: false,
          show_signature_line: false,
          show_watermark: false,
          show_page_numbers: false,
          blocks: (t.blocks as any) || [],
          labels: {
            title: "WERKBON",
            invoiceNo: "Nr",
            from: "Od",
            to: "Do",
            total: "Razem",
            date: "Data",
            dueDate: "Termin",
          },
          is_template: t.is_template ?? false,
          template_category: t.template_category ?? undefined,
          is_locked: t.is_locked ?? false,
          base_template_id: t.base_template_id ?? undefined,
          created_at: t.created_at ?? new Date().toISOString(),
          updated_at: t.updated_at ?? new Date().toISOString(),
        }));
        setPredefinedTemplates(templates as InvoiceDesign[]);
      }
    };

    fetchTemplates();
  }, []);

  const availableTemplates = useMemo(
    () => predefinedTemplates,
    [predefinedTemplates]
  );

  // Auto-select first template on load
  useEffect(() => {
    if (availableTemplates.length > 0 && !selectedDesignId) {
      setSelectedDesignId(availableTemplates[0].id);
    }
  }, [availableTemplates, selectedDesignId]);

  const activeDesign = useMemo(() => {
    const design =
      availableTemplates.find((d) => d.id === selectedDesignId) ||
      availableTemplates[0] ||
      null;
    return design;
  }, [selectedDesignId, availableTemplates]);

  // Template category detection
  const selectedTemplate =
    availableTemplates.find((t) => t.id === selectedDesignId) ||
    availableTemplates[0];
  const templateCategory =
    (selectedTemplate?.template_category as string | undefined) ||
    "standard_timesheet";

  const totalWeekHours = useMemo(() => {
    const sum = entries.reduce((acc, day) => acc + (Number(day.total) || 0), 0);
    const rounded = Number(sum.toFixed(2));
    console.log("📊 TOTAL WEEK HOURS:", {
      entries: entries.map((e) => ({
        start: e.start,
        end: e.end,
        total: e.total,
      })),
      sum,
      rounded,
    });
    return rounded;
  }, [entries]);

  const totalEarnings = useMemo(
    () => totalWeekHours * hourlyRate,
    [totalWeekHours, hourlyRate]
  );

  const totalMaterialsCost = useMemo(() => {
    return materials.reduce((acc, mat) => {
      const qty = Number(mat.quantity) || 0;
      const price = Number(mat.unitPrice) || 0;
      return acc + qty * price;
    }, 0);
  }, [materials]);

  const totalLocationHours = useMemo(() => {
    return locations.reduce((acc, loc) => acc + (Number(loc.hours) || 0), 0);
  }, [locations]);

  // --- Effects ---
  useEffect(() => {
    setWeekInfo(getWeekRange(currentDate));
  }, [currentDate]);

  // --- Handlers ---
  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleEntryChange = (index: number, field: string, value: any) => {
    console.log("🔄 handleEntryChange called:", { index, field, value });

    // DEEP COPY - tworzy nową tablicę z nowymi obiektami (React wykryje zmiany!)
    const newEntries = entries.map((entry, i) =>
      i === index ? { ...entry } : entry
    );

    // Update field
    if (field === "breakMins") {
      newEntries[index].breakMins = Number(value) || 0;
    } else if (field === "start") {
      newEntries[index].start = value;
    } else if (field === "end") {
      newEntries[index].end = value;
    } else if (field === "desc") {
      newEntries[index].desc = value;
    }

    console.log("📝 After field update:", newEntries[index]);

    // ALWAYS recalculate total when start/end/break changes
    const entry = newEntries[index];
    const start = entry.start;
    const end = entry.end;
    const brk = Number(entry.breakMins) || 0;

    console.log("⏰ Time values:", { start, end, brk });

    if (start && end && start.trim() !== "" && end.trim() !== "") {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);

      console.log("🔢 Parsed times:", { sh, sm, eh, em });

      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;

        console.log("📊 Minutes:", { startMins, endMins });

        if (endMins > startMins) {
          const diff = endMins - startMins - brk;
          const hours = Math.max(0, Number((diff / 60).toFixed(2)));
          newEntries[index].total = hours;
          console.log("✅ CALCULATED HOURS:", hours);
        } else {
          newEntries[index].total = 0;
          console.log("⚠️ End time not after start");
        }
      } else {
        newEntries[index].total = 0;
        console.log("❌ NaN in parsed times");
      }
    } else {
      newEntries[index].total = 0;
      console.log("⚠️ Missing start or end time");
    }

    console.log("💾 Setting entries with total:", newEntries[index].total);
    setEntries(newEntries);
  };

  const handleQuickFill = () => {
    const filled = entries.map((entry, idx) => {
      // Skip weekends
      if (idx >= 5) {
        return {
          ...entry,
          start: "",
          end: "",
          breakMins: 0,
          total: 0,
          desc: "",
        };
      }

      // Fill weekdays - let handleEntryChange calculate total
      const newEntry = {
        ...entry,
        start: "07:30",
        end: "16:30",
        breakMins: 45,
        desc: "Prace ogólnobudowlane",
      };

      // Calculate total manually here too
      const [sh, sm] = newEntry.start.split(":").map(Number);
      const [eh, em] = newEntry.end.split(":").map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      const diff = endMins - startMins - newEntry.breakMins;
      newEntry.total = Number((diff / 60).toFixed(2));

      return newEntry;
    });

    setEntries(filled);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("timesheet-print-area");
    if (!element) {
      alert("Nie znaleziono elementu PDF");
      return;
    }

    setIsGenerating(true);

    // Make element visible for canvas capture
    const wasHidden = element.style.display === "none";
    element.style.display = "block";
    element.style.visibility = "visible";
    element.style.opacity = "1";

    try {
      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: true,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");

      if (!imgData || imgData === "data:,") {
        throw new Error("Failed to generate image from canvas");
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `Werkbon_W${weekInfo.weekNumber}_${employeeName.replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
    } catch (err) {
      console.error("PDF Generation Error:", err);
      const error = err as Error;
      alert(`Błąd generowania PDF: ${error.message || "Unknown error"}`);
    } finally {
      // Hide element again if it was hidden before
      if (!showPreview && wasHidden) {
        element.style.display = "none";
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* No Templates Warning */}
      {availableTemplates.length === 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8 text-center">
          <Clock size={48} className="mx-auto mb-4 text-orange-500" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Brak Szablonów Kart Pracy
          </h3>
          <p className="text-slate-600 mb-4">
            Aby wygenerować kartę pracy, musisz najpierw stworzyć szablon typu{" "}
            <strong>TIMESHEET</strong> w sekcji Dokumenty.
          </p>
          <a
            href="/invoices/documents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
          >
            Przejdź do Dokumentów <ArrowRight size={20} />
          </a>
        </div>
      )}

      {/* Template Selector */}
      {availableTemplates.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <Palette size={14} /> Wybierz Szablon Werkbon
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {availableTemplates.map((temp) => (
              <button
                key={temp.id}
                onClick={() => setSelectedDesignId(temp.id)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 text-left transition-all min-w-[140px] ${
                  selectedDesignId === temp.id ||
                  (!selectedDesignId && temp === availableTemplates[0])
                    ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200 ring-offset-1"
                    : "border-slate-100 hover:border-slate-300 bg-slate-50"
                }`}
              >
                <div
                  className="w-full h-2 rounded mb-2"
                  style={{ backgroundColor: temp.primary_color }}
                ></div>
                <div className="font-bold text-sm text-slate-800 truncate">
                  {temp.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {temp.font_family}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
              Werkbon Generator
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Karty Pracy (Uren)
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            Rejestruj godziny i generuj profesjonalne raporty PDF
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              showPreview
                ? "bg-slate-800 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Clock size={20} />
            {showPreview ? "Edytuj Dane" : "Podgląd Wydruku"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl flex items-center gap-3 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:-translate-y-1 disabled:opacity-70"
          >
            {isGenerating ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Download size={20} />
            )}
            <span className="font-bold relative z-10">Pobierz PDF</span>
          </button>
        </div>
      </div>

      {/* --- Config Panel (Inputs) --- */}
      <div
        className={`${
          showPreview ? "hidden" : "grid"
        } grid-cols-1 lg:grid-cols-3 gap-6`}
      >
        {/* Left Column: Context & Settings */}
        <div className="space-y-6">
          {/* Context Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <User size={18} className="text-orange-500" /> Dane Projektu
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Pracownik
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Adres Projektu
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  placeholder="np. Kerkstraat 12, Amsterdam"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* CONDITIONAL TEMPLATE-SPECIFIC FIELDS */}
          {/* ============================================ */}

          {/* PROJECT-BASED Template Fields */}
          {templateCategory === "project_based" && (
            <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-blue-700">
                <Building2 size={18} className="text-blue-500" /> Informacje o
                Projekcie
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Numer Projektu
                  </label>
                  <input
                    type="text"
                    value={projectRef}
                    onChange={(e) => setProjectRef(e.target.value)}
                    placeholder="PRJ-2024-001"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Manager Projektu
                  </label>
                  <input
                    type="text"
                    value={projectManager}
                    onChange={(e) => setProjectManager(e.target.value)}
                    placeholder="Jan Kowalski"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Nazwa Projektu
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Renowacja biurowca przy Kerkstraat"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Ukończenie: {completionPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={completionPercentage}
                  onChange={(e) =>
                    setCompletionPercentage(Number(e.target.value))
                  }
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          {/* WITH KILOMETERS Template Fields */}
          {templateCategory === "with_kilometers" && (
            <div className="bg-violet-50 p-6 rounded-2xl border-2 border-violet-200 shadow-sm space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-violet-700">
                <MapPin size={18} className="text-violet-500" /> Koszty Dojazdu
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Wyjazd z (adres start)
                </label>
                <input
                  type="text"
                  value={departureAddress}
                  onChange={(e) => setDepartureAddress(e.target.value)}
                  placeholder="Weteranów 12, Amsterdam"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-violet-300 focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Przyjazd do (adres cel)
                </label>
                <input
                  type="text"
                  value={arrivalAddress}
                  onChange={(e) => setArrivalAddress(e.target.value)}
                  placeholder="Kerkstraat 45, Rotterdam"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-violet-300 focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Kilometry
                  </label>
                  <input
                    type="number"
                    value={kilometers}
                    onChange={(e) => setKilometers(Number(e.target.value))}
                    step="0.1"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-violet-300 focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Stawka €/km
                  </label>
                  <input
                    type="number"
                    value={ratePerKm}
                    onChange={(e) => setRatePerKm(Number(e.target.value))}
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-violet-300 focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="bg-violet-100 px-4 py-3 rounded-lg flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">
                  Razem Koszty Dojazdu:
                </span>
                <span className="text-2xl font-bold text-violet-700">
                  €{(kilometers * ratePerKm).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Week Selector */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
              Okres Rozliczeniowy
            </label>
            <div className="flex items-center justify-between bg-white/10 p-2 rounded-xl mb-4">
              <button
                onClick={handlePrevWeek}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  Tydzień {weekInfo.weekNumber}
                </div>
                <div className="text-xs text-slate-400">
                  {weekInfo.start.toLocaleDateString()} -{" "}
                  {weekInfo.end.toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={handleNextWeek}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Simple stats display */}
            <div className="space-y-3 px-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-300">Suma godzin:</div>
                <div className="text-3xl font-bold text-orange-400">
                  {totalWeekHours.toFixed(2)} godz.
                </div>
              </div>

              {/* Simple hourly rate input */}
              <div className="flex justify-between items-center gap-3 pt-3 border-t border-white/10">
                <label className="text-sm text-slate-300 whitespace-nowrap">
                  Stawka €/h:
                </label>
                <input
                  type="number"
                  value={hourlyRate || ""}
                  onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.50"
                  min="0"
                  className="w-32 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-right font-bold focus:bg-white/20 focus:border-orange-400 outline-none"
                />
              </div>

              {/* Total earnings - only show if rate is set */}
              {hourlyRate > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-orange-400/30">
                  <div className="text-sm text-slate-300">Zarobki:</div>
                  <div className="text-2xl font-black text-green-400">
                    {totalEarnings.toFixed(2)} €
                  </div>
                </div>
              )}

              {/* Toggle: Show rate on print */}
              {hourlyRate > 0 && (
                <div className="flex items-center gap-3 pt-3 mt-2 border-t border-white/10">
                  <input
                    type="checkbox"
                    id="showRateOnPrint"
                    checked={showRateOnPrint}
                    onChange={(e) => setShowRateOnPrint(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-white/10 text-orange-500 focus:ring-orange-400"
                  />
                  <label
                    htmlFor="showRateOnPrint"
                    className="text-xs text-slate-300 cursor-pointer"
                  >
                    📄 Pokaż stawkę i zarobki na wydruku PDF
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Data Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-orange-500" /> Ewidencja Czasu
              Pracy
            </h3>
            <button
              onClick={handleQuickFill}
              className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Wand2 size={12} /> Auto-Wypełnij (Standard)
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left pl-6">Dzień</th>
                  <th className="px-2 py-3 text-center">Start</th>
                  <th className="px-2 py-3 text-center">Stop</th>
                  <th className="px-2 py-3 text-center">Przerwa</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-700">
                    Suma
                  </th>
                  <th className="px-4 py-3 text-left w-1/3">Opis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS.map((day, idx) => {
                  const date = new Date(weekInfo.start);
                  date.setDate(date.getDate() + idx);
                  const isWeekend = idx >= 5;

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isWeekend ? "bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3 pl-6">
                        <div className="flex flex-col">
                          <span
                            className={`font-bold text-sm ${
                              isWeekend ? "text-red-400" : "text-slate-700"
                            }`}
                          >
                            {day}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {date.toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="time"
                          value={entries[idx].start}
                          onChange={(e) =>
                            handleEntryChange(idx, "start", e.target.value)
                          }
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none w-24 text-center"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="time"
                          value={entries[idx].end}
                          onChange={(e) =>
                            handleEntryChange(idx, "end", e.target.value)
                          }
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none w-24 text-center"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <div className="relative w-20 mx-auto">
                          <input
                            type="number"
                            value={entries[idx].breakMins}
                            onChange={(e) =>
                              handleEntryChange(
                                idx,
                                "breakMins",
                                e.target.value
                              )
                            }
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-center"
                          />
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                            min
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-bold font-mono text-lg ${
                            entries[idx].total > 0
                              ? "text-slate-800"
                              : "text-slate-300"
                          }`}
                        >
                          {entries[idx].total.toFixed(2)}h
                        </span>
                      </td>
                      <td className="px-4 py-3 pr-6">
                        <input
                          type="text"
                          value={entries[idx].desc}
                          onChange={(e) =>
                            handleEntryChange(idx, "desc", e.target.value)
                          }
                          placeholder="Opis prac..."
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-500 outline-none py-1 text-sm transition-colors placeholder:text-slate-300"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-right font-bold text-slate-500 uppercase text-xs tracking-wider"
                  >
                    Suma Tygodniowa
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-2xl font-black text-orange-600">
                      {totalWeekHours.toFixed(2)}h
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FULL-WIDTH CONDITIONAL SECTIONS (Below Grid) */}
      {/* ============================================ */}

      {/* WITH MATERIALS Template Fields */}
      {templateCategory === "with_materials" && (
        <div className="bg-emerald-50 p-8 rounded-2xl border-2 border-emerald-200 shadow-lg space-y-4 animate-in slide-in-from-bottom">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-emerald-700 text-xl">
              <Calculator size={20} className="text-emerald-500" /> Materiały
              Użyte
            </h3>
            <button
              onClick={() =>
                setMaterials([
                  ...materials,
                  { name: "", quantity: 1, unitPrice: 0, total: 0 },
                ])
              }
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors text-sm"
            >
              + Dodaj Materiał
            </button>
          </div>

          {materials.length === 0 ? (
            <p className="text-slate-500 italic text-center py-8">
              Kliknij "Dodaj Materiał" aby dodać materiały do karty pracy
            </p>
          ) : (
            <div className="space-y-3">
              {materials.map((mat, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-3 bg-white p-4 rounded-lg border border-emerald-300"
                >
                  <div className="col-span-5">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Nazwa Materiału
                    </label>
                    <input
                      type="text"
                      value={mat.name}
                      onChange={(e) => {
                        const newMats = [...materials];
                        newMats[idx].name = e.target.value;
                        setMaterials(newMats);
                      }}
                      placeholder="np. Farba lateksowa biała"
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Ilość
                    </label>
                    <input
                      type="number"
                      value={mat.quantity}
                      onChange={(e) => {
                        const newMats = [...materials];
                        newMats[idx].quantity = Number(e.target.value);
                        newMats[idx].total =
                          newMats[idx].quantity * newMats[idx].unitPrice;
                        setMaterials(newMats);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Cena €/szt
                    </label>
                    <input
                      type="number"
                      value={mat.unitPrice}
                      onChange={(e) => {
                        const newMats = [...materials];
                        newMats[idx].unitPrice = Number(e.target.value);
                        newMats[idx].total =
                          newMats[idx].quantity * newMats[idx].unitPrice;
                        setMaterials(newMats);
                      }}
                      step="0.01"
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Razem €
                    </label>
                    <div className="w-full px-3 py-2 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-800 font-bold text-sm flex items-center justify-center">
                      €{mat.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button
                      onClick={() =>
                        setMaterials(materials.filter((_, i) => i !== idx))
                      }
                      className="w-full px-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-emerald-200 px-6 py-4 rounded-xl flex justify-between items-center">
                <span className="text-lg font-bold text-slate-800">
                  Suma Materiałów:
                </span>
                <span className="text-3xl font-black text-emerald-700">
                  €{materials.reduce((acc, m) => acc + m.total, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MULTI LOCATION Template Fields */}
      {templateCategory === "multi_location" && (
        <div className="bg-pink-50 p-8 rounded-2xl border-2 border-pink-200 shadow-lg space-y-4 animate-in slide-in-from-bottom">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-pink-700 text-xl">
              <MapPin size={20} className="text-pink-500" /> Wiele Lokalizacji
            </h3>
            <button
              onClick={() =>
                setLocations([
                  ...locations,
                  {
                    date: new Date().toISOString().split("T")[0],
                    address: "",
                    start: "08:00",
                    end: "16:00",
                    workType: "",
                    hours: 8,
                  },
                ])
              }
              className="px-4 py-2 bg-pink-500 text-white rounded-lg font-bold hover:bg-pink-600 transition-colors text-sm"
            >
              + Dodaj Lokalizację
            </button>
          </div>

          {locations.length === 0 ? (
            <p className="text-slate-500 italic text-center py-8">
              Kliknij "Dodaj Lokalizację" aby dodać miejsca pracy
            </p>
          ) : (
            <div className="space-y-3">
              {locations.map((loc, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-3 bg-white p-4 rounded-lg border border-pink-300"
                >
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={loc.date}
                      onChange={(e) => {
                        const newLocs = [...locations];
                        newLocs[idx].date = e.target.value;
                        setLocations(newLocs);
                      }}
                      className="w-full px-2 py-2 rounded-lg border border-pink-300 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Adres Lokalizacji
                    </label>
                    <input
                      type="text"
                      value={loc.address}
                      onChange={(e) => {
                        const newLocs = [...locations];
                        newLocs[idx].address = e.target.value;
                        setLocations(newLocs);
                      }}
                      placeholder="np. Hoofdstraat 123, Utrecht"
                      className="w-full px-3 py-2 rounded-lg border border-pink-300 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Od
                    </label>
                    <input
                      type="time"
                      value={loc.start}
                      onChange={(e) => {
                        const newLocs = [...locations];
                        newLocs[idx].start = e.target.value;
                        // Auto-calculate hours
                        const [sh, sm] = newLocs[idx].start
                          .split(":")
                          .map(Number);
                        const [eh, em] = newLocs[idx].end
                          .split(":")
                          .map(Number);
                        const diff = eh * 60 + em - (sh * 60 + sm);
                        newLocs[idx].hours = Number((diff / 60).toFixed(2));
                        setLocations(newLocs);
                      }}
                      className="w-full px-2 py-2 rounded-lg border border-pink-300 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Do
                    </label>
                    <input
                      type="time"
                      value={loc.end}
                      onChange={(e) => {
                        const newLocs = [...locations];
                        newLocs[idx].end = e.target.value;
                        // Auto-calculate hours
                        const [sh, sm] = newLocs[idx].start
                          .split(":")
                          .map(Number);
                        const [eh, em] = newLocs[idx].end
                          .split(":")
                          .map(Number);
                        const diff = eh * 60 + em - (sh * 60 + sm);
                        newLocs[idx].hours = Number((diff / 60).toFixed(2));
                        setLocations(newLocs);
                      }}
                      className="w-full px-2 py-2 rounded-lg border border-pink-300 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Typ Pracy
                    </label>
                    <input
                      type="text"
                      value={loc.workType}
                      onChange={(e) => {
                        const newLocs = [...locations];
                        newLocs[idx].workType = e.target.value;
                        setLocations(newLocs);
                      }}
                      placeholder="np. Malowanie"
                      className="w-full px-3 py-2 rounded-lg border border-pink-300 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Godz.
                    </label>
                    <div className="w-full px-2 py-2 rounded-lg bg-pink-100 border border-pink-400 text-pink-800 font-bold text-sm text-center">
                      {loc.hours}h
                    </div>
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button
                      onClick={() =>
                        setLocations(locations.filter((_, i) => i !== idx))
                      }
                      className="w-full px-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-pink-200 px-6 py-4 rounded-xl flex justify-between items-center">
                <span className="text-lg font-bold text-slate-800">
                  Suma Godzin (Wszystkie Lokalizacje):
                </span>
                <span className="text-3xl font-black text-pink-700">
                  {locations.reduce((acc, l) => acc + l.hours, 0).toFixed(2)}h
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Hidden/Preview PDF Container --- */}
      <div
        className={`${
          showPreview ? "flex justify-center" : "hidden"
        } animate-in fade-in`}
      >
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl overflow-auto max-h-[80vh] border border-slate-700">
          {/* THE A4 PAPER */}
          <div
            id="timesheet-print-area"
            className="bg-white relative shadow-xl mx-auto"
            style={{
              width: "210mm",
              minHeight: "297mm",
              fontFamily: "Inter",
            }}
          >
            <div className="p-[15mm] h-full flex flex-col relative z-10">
              {/* Header */}
              <div className="flex justify-between items-start mb-12 border-b-2 pb-6 border-orange-500">
                <div className="flex gap-6 items-center">
                  <div>
                    <h1 className="text-4xl font-black uppercase leading-none text-orange-600">
                      WERKBON
                    </h1>
                    <p className="text-sm opacity-60 font-bold mt-2">
                      WEEK: {weekInfo.weekNumber} /{" "}
                      {weekInfo.start.getFullYear()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="grid grid-cols-2 gap-8 mb-8 p-6 rounded-xl bg-slate-50/50 border border-slate-100">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">
                    PRACOWNIK
                  </h3>
                  <p className="font-bold text-lg">{employeeName}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">
                    ADRES PROJEKTU
                  </h3>
                  <p className="font-bold text-lg">{projectAddress || "---"}</p>
                </div>
              </div>

              {/* Dates Range */}
              <div className="flex justify-center mb-6">
                <div className="px-6 py-2 rounded-full text-sm font-bold border border-orange-500 text-orange-600 bg-orange-50">
                  Okres: {weekInfo.start.toLocaleDateString()} -{" "}
                  {weekInfo.end.toLocaleDateString()}
                </div>
              </div>

              {/* The Table */}
              <div className="flex-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-orange-600 text-white">
                      <th className="p-3 text-left text-xs uppercase font-bold rounded-tl-lg">
                        DZIEŃ
                      </th>
                      <th className="p-3 text-left text-xs uppercase font-bold">
                        DATA
                      </th>
                      <th className="p-3 text-center text-xs uppercase font-bold">
                        START
                      </th>
                      <th className="p-3 text-center text-xs uppercase font-bold">
                        KONIEC
                      </th>
                      <th className="p-3 text-center text-xs uppercase font-bold">
                        PRZERWA
                      </th>
                      <th className="p-3 text-right text-xs uppercase font-bold">
                        UREN
                      </th>
                      <th className="p-3 text-left text-xs uppercase font-bold rounded-tr-lg w-1/3">
                        OPIS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {DAYS.map((day, idx) => {
                      const date = new Date(weekInfo.start);
                      date.setDate(date.getDate() + idx);
                      const entry = entries[idx];
                      const isWeekend = idx >= 5;

                      return (
                        <tr
                          key={idx}
                          className={`border-b border-slate-100 ${
                            isWeekend ? "bg-slate-50/50" : ""
                          }`}
                        >
                          <td className="p-3 font-bold">{day}</td>
                          <td className="p-3 font-mono opacity-70">
                            {date.toLocaleDateString()}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {entry.start || "-"}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {entry.end || "-"}
                          </td>
                          <td className="p-3 text-center opacity-70">
                            {entry.breakMins ? entry.breakMins + "m" : "-"}
                          </td>
                          <td className="p-3 text-right font-bold">
                            {entry.total > 0 ? entry.total + "h" : "-"}
                          </td>
                          <td className="p-3 opacity-80 italic">
                            {entry.desc}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td
                        colSpan={5}
                        className="p-4 text-right font-bold uppercase text-xs tracking-widest opacity-60"
                      >
                        Totaal Uren
                      </td>
                      <td className="p-4 text-right font-black text-xl text-orange-600">
                        {totalWeekHours.toFixed(2)}h
                      </td>
                      <td className="p-4 text-right">
                        {showRateOnPrint && hourlyRate > 0 && (
                          <span className="font-black text-xl text-green-600">
                            €{totalEarnings.toFixed(2)}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Template-Specific Sections in PDF */}
              {templateCategory === "project_based" && (
                <div className="mt-8 p-6 bg-slate-50 rounded-lg">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    Informacje o projekcie
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Referencja projektu:
                      </p>
                      <p className="font-semibold text-slate-900">
                        {projectRef || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Nazwa projektu:
                      </p>
                      <p className="font-semibold text-slate-900">
                        {projectName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Kierownik projektu:
                      </p>
                      <p className="font-semibold text-slate-900">
                        {projectManager || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Procent ukończenia:
                      </p>
                      <p className="font-semibold text-slate-900">
                        {completionPercentage || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {templateCategory === "with_materials" &&
                materials.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                      Użyte materiały
                    </h3>
                    <table className="w-full border border-slate-300">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2 text-left text-xs font-bold text-slate-700 border-r border-slate-300">
                            Nazwa
                          </th>
                          <th className="p-2 text-left text-xs font-bold text-slate-700 border-r border-slate-300">
                            Ilość
                          </th>
                          <th className="p-2 text-right text-xs font-bold text-slate-700">
                            Cena jednostkowa
                          </th>
                          <th className="p-2 text-right text-xs font-bold text-slate-700">
                            Suma
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((mat, idx) => (
                          <tr key={idx} className="border-t border-slate-300">
                            <td className="p-2 border-r border-slate-300">
                              {mat.name}
                            </td>
                            <td className="p-2 border-r border-slate-300">
                              {mat.quantity}
                            </td>
                            <td className="p-2 text-right border-r border-slate-300">
                              €{Number(mat.unitPrice || 0).toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              €
                              {(
                                Number(mat.quantity || 0) *
                                Number(mat.unitPrice || 0)
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-400 bg-slate-50">
                          <td colSpan={3} className="p-2 text-right font-bold">
                            Suma materiałów:
                          </td>
                          <td className="p-2 text-right font-bold text-orange-600">
                            €{totalMaterialsCost.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

              {templateCategory === "with_kilometers" && (
                <div className="mt-8 p-6 bg-slate-50 rounded-lg">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    Informacje o podróży
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Adres wyjazdu:
                      </p>
                      <p className="font-semibold text-slate-900">
                        {departureAddress || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Adres przyjazdu:
                      </p>
                      <p className="font-semibold text-slate-900">
                        {arrivalAddress || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Kilometry:</p>
                      <p className="font-semibold text-slate-900">
                        {kilometers || 0} km
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Koszt podróży:
                      </p>
                      <p className="font-semibold text-orange-600">
                        €{((kilometers || 0) * (ratePerKm || 0.21)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {templateCategory === "multi_location" &&
                locations.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                      Praca w wielu lokalizacjach
                    </h3>
                    <table className="w-full border border-slate-300">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2 text-left text-xs font-bold text-slate-700 border-r border-slate-300">
                            Data
                          </th>
                          <th className="p-2 text-left text-xs font-bold text-slate-700 border-r border-slate-300">
                            Adres
                          </th>
                          <th className="p-2 text-right text-xs font-bold text-slate-700">
                            Godziny
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations.map((loc, idx) => (
                          <tr key={idx} className="border-t border-slate-300">
                            <td className="p-2 border-r border-slate-300">
                              {loc.date || "-"}
                            </td>
                            <td className="p-2 border-r border-slate-300">
                              {loc.address || "-"}
                            </td>
                            <td className="p-2 text-right">
                              {Number(loc.hours || 0).toFixed(2)}h
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-400 bg-slate-50">
                          <td colSpan={2} className="p-2 text-right font-bold">
                            Suma lokalizacji:
                          </td>
                          <td className="p-2 text-right font-bold text-orange-600">
                            {totalLocationHours.toFixed(2)}h
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Signatures */}
              <div className="mt-12 flex justify-between gap-12">
                <div className="flex-1 border-t border-slate-300 pt-2">
                  <p className="text-xs uppercase font-bold opacity-50 mb-8">
                    Podpis Pracownika
                  </p>
                </div>
                <div className="flex-1 border-t border-slate-300 pt-2">
                  <p className="text-xs uppercase font-bold opacity-50 mb-8">
                    Podpis Klienta
                  </p>
                </div>
              </div>

              {/* Footer Strip */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-orange-600"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
