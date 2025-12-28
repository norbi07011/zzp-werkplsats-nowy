// =====================================================
// BTW AANGIFTE (VAT DECLARATIONS) PAGE
// =====================================================
// Complete Dutch VAT declarations with all Belastingdienst rubrieken
// Includes: EU purchases, reverse charge, kilometers integration
// ENHANCED: KOR Calculator, Health Score, Deadlines, Video Header
// =====================================================

import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "../i18n";
import {
  useSupabaseBTW,
  useSupabaseInvoices,
  useSupabaseExpenses,
  useSupabaseKilometers,
  useKOR,
  useBTWHealthScore,
  useBTWAnalytics,
  useBTWDeadlines,
} from "../hooks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { SuccessCelebration } from "../components/ui/SuccessCelebration";
import { formatCurrency } from "../lib";
import { useAuth } from "../../../../contexts/AuthContext";
import { StatChipsGrid, StatChipItem } from "../../../../components/StatChips";
import { BarChart3, TrendingUp, Receipt, Percent } from "lucide-react";
import type { BTWDeclaration, BTWPeriod, BTWStatus } from "../types";

interface BTWAangifteProps {
  onNavigate: (page: string, id?: string) => void;
}

const QUARTERS: BTWPeriod[] = ["Q1", "Q2", "Q3", "Q4"];

const QUARTER_DATES = {
  Q1: { start: "-01-01", end: "-03-31" },
  Q2: { start: "-04-01", end: "-06-30" },
  Q3: { start: "-07-01", end: "-09-30" },
  Q4: { start: "-10-01", end: "-12-31" },
} as const;

export default function BTWAangifte({ onNavigate }: BTWAangifteProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as
    | 1
    | 2
    | 3
    | 4;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState<BTWPeriod>(
    `Q${currentQuarter}` as BTWPeriod
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeclaration, setEditingDeclaration] =
    useState<BTWDeclaration | null>(null);
  const [showRubrieken, setShowRubrieken] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const {
    declarations,
    createDeclaration,
    updateDeclaration,
    deleteDeclaration,
  } = useSupabaseBTW(user?.id || "");
  const { invoices } = useSupabaseInvoices(user?.id || "");
  const { expenses } = useSupabaseExpenses(user?.id || "");
  const { entries: kilometers } = useSupabaseKilometers(
    user?.id || "",
    selectedYear
  );

  // Advanced hooks
  const { korStatus, calculation: korCalculation } = useKOR(
    user?.id || "",
    selectedYear
  );
  const healthScore = useBTWHealthScore(user?.id || "");
  const analytics = useBTWAnalytics(
    user?.id || "",
    `${selectedYear}-01-01`,
    `${selectedYear}-12-31`
  );
  const deadlines = useBTWDeadlines();

  // Success celebration state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    title: string;
    message: string;
    icon: "🎉" | "✅" | "🏆" | "⭐" | "💰" | "📄" | "👤";
  }>({ title: "", message: "", icon: "🎉" });

  const [formData, setFormData] = useState({
    year: selectedYear,
    quarter: selectedPeriod,
    status: "draft" as BTWStatus,
    revenue_21: 0,
    revenue_9: 0,
    revenue_0: 0,
    revenue_eu: 0,
    revenue_export: 0,
    input_vat: 0,
    output_vat_21: 0,
    output_vat_9: 0,
    total_output_vat: 0,
    balance: 0,
    notes: "",
  });

  // Calculate BTW data from invoices, expenses and EU purchases
  const calculatedData = useMemo(() => {
    const dates = QUARTER_DATES[selectedPeriod];
    const startDate = `${selectedYear}${dates.start}`;
    const endDate = `${selectedYear}${dates.end}`;

    // Filter invoices for selected period
    const periodInvoices = (invoices || []).filter((inv) => {
      return inv.invoice_date >= startDate && inv.invoice_date <= endDate;
    });

    // Calculate revenue by VAT rate
    let vat21 = 0;
    let vat9 = 0;
    let vat0 = 0;
    let reverseCharge = 0;
    let euDeliveries = 0;
    let exports = 0;

    periodInvoices.forEach((inv) => {
      const clientCountry = inv.client_snapshot?.country || "NL";

      if (inv.is_reverse_charge) {
        reverseCharge += inv.total_net;
      } else if (clientCountry !== "NL") {
        // EU or export based on country
        const euCountries = [
          "BE",
          "DE",
          "FR",
          "IT",
          "ES",
          "AT",
          "PL",
          "CZ",
          "DK",
          "SE",
          "FI",
          "PT",
          "IE",
          "GR",
          "HU",
          "RO",
          "BG",
          "HR",
          "SK",
          "SI",
          "LT",
          "LV",
          "EE",
          "CY",
          "MT",
          "LU",
        ];
        if (euCountries.includes(clientCountry)) {
          euDeliveries += inv.total_net;
        } else {
          exports += inv.total_net;
        }
      } else {
        const vatRate =
          inv.total_net > 0 ? (inv.total_vat / inv.total_net) * 100 : 0;
        if (vatRate > 20) {
          vat21 += inv.total_net;
        } else if (vatRate > 8 && vatRate < 20) {
          vat9 += inv.total_net;
        } else {
          vat0 += inv.total_net;
        }
      }
    });

    // Filter expenses for selected period
    const periodExpenses = (expenses || []).filter((exp) => {
      return exp.date >= startDate && exp.date <= endDate;
    });

    // Calculate deductible VAT from expenses
    const deductibleVat = periodExpenses.reduce((sum, exp) => {
      if (exp.is_deductible) {
        return sum + exp.vat_amount * (exp.deductible_percentage / 100);
      }
      return sum;
    }, 0);

    // Calculate EU purchases (intracommunautaire verwervingen) - Rubriek 4a/4b
    const euPurchases = periodExpenses.reduce((sum, exp) => {
      const supplier = (exp.supplier || "").toLowerCase();
      const isEu =
        supplier.includes(".de") ||
        supplier.includes(".fr") ||
        supplier.includes(".be");
      if (isEu) {
        return sum + (exp.amount - exp.vat_amount);
      }
      return sum;
    }, 0);

    // EU purchase VAT (you must declare AND deduct)
    const euPurchaseVat = euPurchases * 0.21;

    // Reverse charge from services purchased (Rubriek 4a alternativ)
    const reverseChargeServices = periodExpenses.reduce((sum, exp) => {
      const supplier = (exp.supplier || "").toLowerCase();
      const isForeign =
        exp.vat_rate === 0 &&
        (supplier.includes(".de") || supplier.includes(".uk"));
      if (isForeign) {
        return sum + exp.amount;
      }
      return sum;
    }, 0);

    // Filter kilometers for selected YEAR
    const yearKilometers = (kilometers || []).filter((km) => {
      return (
        km.date >= `${selectedYear}-01-01` && km.date <= `${selectedYear}-12-31`
      );
    });

    const kilometerVatDeduction = yearKilometers.reduce((sum, km) => {
      return sum + km.amount * 0.21;
    }, 0);

    const totalKilometers = yearKilometers.reduce(
      (sum, km) => sum + km.kilometers,
      0
    );
    const totalKilometerAmount = yearKilometers.reduce(
      (sum, km) => sum + km.amount,
      0
    );

    // Total deductible VAT = expenses + kilometers + EU purchase VAT (reverse charge)
    const totalDeductibleVat =
      deductibleVat + kilometerVatDeduction + euPurchaseVat;

    // VAT to pay = output VAT + EU purchase VAT (must declare)
    const vatToPay = vat21 * 0.21 + vat9 * 0.09 + euPurchaseVat;

    // Balance = VAT to pay - VAT to deduct (including EU purchase VAT back)
    const balance = vatToPay - totalDeductibleVat;

    // Build complete Rubrieken object
    const rubrieken = {
      // Rubriek 1: Leveringen/diensten belast met Nederlandse BTW
      "1a": {
        desc: "Leveringen/diensten belast met hoog tarief",
        amount: vat21,
        vat: vat21 * 0.21,
      },
      "1b": { desc: "BTW over 1a", amount: vat21 * 0.21, vat: 0 },
      "1c": {
        desc: "Leveringen/diensten belast met laag tarief",
        amount: vat9,
        vat: vat9 * 0.09,
      },
      "1d": { desc: "BTW over 1c", amount: vat9 * 0.09, vat: 0 },
      "1e": {
        desc: "Leveringen/diensten belast met overige tarieven",
        amount: reverseCharge,
        vat: 0,
      },

      // Rubriek 3: Leveringen naar landen buiten de EU / 0% tarief
      "3a": {
        desc: "Leveringen naar landen buiten de EU",
        amount: exports,
        vat: 0,
      },
      "3b": {
        desc: "Leveringen naar/diensten in landen binnen de EU",
        amount: euDeliveries,
        vat: 0,
      },
      "3c": {
        desc: "Installatie/afstandsverkopen binnen de EU",
        amount: 0,
        vat: 0,
      },

      // Rubriek 4: Leveringen/diensten uit landen binnen de EU aan u verricht
      "4a": {
        desc: "Verwervingen van goederen uit landen binnen de EU",
        amount: euPurchases,
        vat: euPurchaseVat,
      },
      "4b": { desc: "BTW over 4a", amount: euPurchaseVat, vat: 0 },

      // Rubriek 5: Voorbelasting en totalen
      "5a": {
        desc: "Verschuldigde BTW (1b + 1d + 4b)",
        amount: vat21 * 0.21 + vat9 * 0.09 + euPurchaseVat,
        vat: 0,
      },
      "5b": { desc: "Voorbelasting", amount: totalDeductibleVat, vat: 0 },
      "5c": {
        desc: "Subtotaal (5a - 5b)",
        amount: vat21 * 0.21 + vat9 * 0.09 + euPurchaseVat - totalDeductibleVat,
        vat: 0,
      },
      "5d": { desc: "Vermindering volgens KOR", amount: 0, vat: 0 },
      "5e": { desc: "Schatting vorige tijdvakken", amount: 0, vat: 0 },
      "5f": { desc: "Schatting dit tijdvak", amount: 0, vat: 0 },
      "5g": {
        desc: "Totaal te betalen/terug te ontvangen",
        amount: balance,
        vat: 0,
      },
    };

    return {
      invoices: { vat21, vat9, vat0, reverseCharge, euDeliveries, exports },
      expenses: {
        deductibleVat,
        euPurchases,
        euPurchaseVat,
        reverseChargeServices,
      },
      kilometers: {
        count: yearKilometers.length,
        totalKilometers,
        totalAmount: totalKilometerAmount,
        vatDeduction: kilometerVatDeduction,
      },
      totalDeductibleVat,
      vatToPay,
      balance,
      rubrieken,
    };
  }, [selectedYear, selectedPeriod, invoices, expenses, kilometers]);

  // Get invoice count for selected quarter
  const quarterInvoiceCount = useMemo(() => {
    const dates = QUARTER_DATES[selectedPeriod];
    const startDate = `${selectedYear}${dates.start}`;
    const endDate = `${selectedYear}${dates.end}`;

    return (invoices || []).filter((inv) => {
      return inv.invoice_date >= startDate && inv.invoice_date <= endDate;
    }).length;
  }, [selectedYear, selectedPeriod, invoices]);

  // Auto-fill form with calculated data
  const handleAutoFill = () => {
    if (quarterInvoiceCount === 0) {
      const confirmProceed = confirm(
        `⚠️ UWAGA: Brak faktur w okresie ${selectedPeriod} ${selectedYear}.\n\n` +
          `Czy na pewno chcesz zapisać pustą deklarację?`
      );
      if (!confirmProceed) return;
    }

    const outputVat21 =
      Math.round(calculatedData.invoices.vat21 * 0.21 * 100) / 100;
    const outputVat9 =
      Math.round(calculatedData.invoices.vat9 * 0.09 * 100) / 100;
    const totalOutput = outputVat21 + outputVat9;
    const balance = totalOutput - calculatedData.totalDeductibleVat;

    setFormData({
      ...formData,
      year: selectedYear,
      quarter: selectedPeriod,
      revenue_21: Math.round(calculatedData.invoices.vat21 * 100) / 100,
      revenue_9: Math.round(calculatedData.invoices.vat9 * 100) / 100,
      revenue_0: Math.round(calculatedData.invoices.vat0 * 100) / 100,
      revenue_eu: Math.round(calculatedData.invoices.reverseCharge * 100) / 100,
      input_vat: Math.round(calculatedData.totalDeductibleVat * 100) / 100,
      output_vat_21: outputVat21,
      output_vat_9: outputVat9,
      total_output_vat: totalOutput,
      balance: balance,
    });
  };

  // Recalculate totals when form changes
  useEffect(() => {
    const outputVat21 = (formData.revenue_21 || 0) * 0.21;
    const outputVat9 = (formData.revenue_9 || 0) * 0.09;
    const totalOutput = outputVat21 + outputVat9;
    const balance = totalOutput - (formData.input_vat || 0);

    setFormData((prev) => ({
      ...prev,
      output_vat_21: Math.round(outputVat21 * 100) / 100,
      output_vat_9: Math.round(outputVat9 * 100) / 100,
      total_output_vat: Math.round(totalOutput * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    }));
  }, [formData.revenue_21, formData.revenue_9, formData.input_vat]);

  const handleOpenDialog = (declaration?: BTWDeclaration) => {
    if (declaration) {
      setEditingDeclaration(declaration);
      setFormData({
        year: declaration.year,
        quarter: declaration.quarter,
        status: declaration.status,
        revenue_21: declaration.revenue_21,
        revenue_9: declaration.revenue_9,
        revenue_0: declaration.revenue_0,
        revenue_eu: declaration.revenue_eu,
        revenue_export: declaration.revenue_export,
        input_vat: declaration.input_vat,
        output_vat_21: declaration.output_vat_21,
        output_vat_9: declaration.output_vat_9,
        total_output_vat: declaration.total_output_vat,
        balance: declaration.balance,
        notes: declaration.notes || "",
      });
    } else {
      setEditingDeclaration(null);
      setFormData({
        year: selectedYear,
        quarter: selectedPeriod,
        status: "draft",
        revenue_21: 0,
        revenue_9: 0,
        revenue_0: 0,
        revenue_eu: 0,
        revenue_export: 0,
        input_vat: 0,
        output_vat_21: 0,
        output_vat_9: 0,
        total_output_vat: 0,
        balance: 0,
        notes: "",
      });
      handleAutoFill();
    }
    setIsDialogOpen(true);
  };

  // Download XML for Belastingdienst
  const handleDownloadXML = () => {
    const r = calculatedData.rubrieken;
    const quarterDates = QUARTER_DATES[selectedPeriod];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Aangifte xmlns="http://www.belastingdienst.nl/wus/btwv/2024">
  <Administratie>
    <Periode>
      <Kwartaal>${selectedPeriod}</Kwartaal>
      <Jaar>${selectedYear}</Jaar>
      <StartDatum>${selectedYear}${quarterDates.start}</StartDatum>
      <EindDatum>${selectedYear}${quarterDates.end}</EindDatum>
    </Periode>
  </Administratie>
  <Opgaaf>
    <!-- Rubriek 1: Binnenlandse omzet -->
    <Rubriek_1a>${r["1a"].amount.toFixed(2)}</Rubriek_1a>
    <Rubriek_1b>${r["1b"].amount.toFixed(2)}</Rubriek_1b>
    <Rubriek_1c>${r["1c"].amount.toFixed(2)}</Rubriek_1c>
    <Rubriek_1d>${r["1d"].amount.toFixed(2)}</Rubriek_1d>
    <Rubriek_1e>${r["1e"].amount.toFixed(2)}</Rubriek_1e>
    
    <!-- Rubriek 3: EU en export -->
    <Rubriek_3a>${r["3a"].amount.toFixed(2)}</Rubriek_3a>
    <Rubriek_3b>${r["3b"].amount.toFixed(2)}</Rubriek_3b>
    <Rubriek_3c>${r["3c"].amount.toFixed(2)}</Rubriek_3c>
    
    <!-- Rubriek 4: EU verwervingen -->
    <Rubriek_4a>${r["4a"].amount.toFixed(2)}</Rubriek_4a>
    <Rubriek_4b>${r["4b"].amount.toFixed(2)}</Rubriek_4b>
    
    <!-- Rubriek 5: Totalen -->
    <Rubriek_5a>${r["5a"].amount.toFixed(2)}</Rubriek_5a>
    <Rubriek_5b>${r["5b"].amount.toFixed(2)}</Rubriek_5b>
    <Rubriek_5c>${r["5c"].amount.toFixed(2)}</Rubriek_5c>
    <Rubriek_5d>${r["5d"].amount.toFixed(2)}</Rubriek_5d>
    <Rubriek_5e>${r["5e"].amount.toFixed(2)}</Rubriek_5e>
    <Rubriek_5f>${r["5f"].amount.toFixed(2)}</Rubriek_5f>
    <Rubriek_5g>${r["5g"].amount.toFixed(2)}</Rubriek_5g>
  </Opgaaf>
  <Metadata>
    <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
    <Source>ZZP Werkplaats Invoice System</Source>
    <KilometerDeduction>${calculatedData.kilometers.vatDeduction.toFixed(
      2
    )}</KilometerDeduction>
    <TotalKilometers>${
      calculatedData.kilometers.totalKilometers
    }</TotalKilometers>
  </Metadata>
</Aangifte>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BTW_Aangifte_${selectedPeriod}_${selectedYear}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download CSV for bookkeeping
  const handleDownloadCSV = () => {
    const r = calculatedData.rubrieken;

    const csvRows = [
      ["Rubriek", "Omschrijving", "Bedrag EUR"],
      ["1a", r["1a"].desc, r["1a"].amount.toFixed(2)],
      ["1b", r["1b"].desc, r["1b"].amount.toFixed(2)],
      ["1c", r["1c"].desc, r["1c"].amount.toFixed(2)],
      ["1d", r["1d"].desc, r["1d"].amount.toFixed(2)],
      ["1e", r["1e"].desc, r["1e"].amount.toFixed(2)],
      ["3a", r["3a"].desc, r["3a"].amount.toFixed(2)],
      ["3b", r["3b"].desc, r["3b"].amount.toFixed(2)],
      ["3c", r["3c"].desc, r["3c"].amount.toFixed(2)],
      ["4a", r["4a"].desc, r["4a"].amount.toFixed(2)],
      ["4b", r["4b"].desc, r["4b"].amount.toFixed(2)],
      ["5a", r["5a"].desc, r["5a"].amount.toFixed(2)],
      ["5b", r["5b"].desc, r["5b"].amount.toFixed(2)],
      ["5c", r["5c"].desc, r["5c"].amount.toFixed(2)],
      ["5d", r["5d"].desc, r["5d"].amount.toFixed(2)],
      ["5e", r["5e"].desc, r["5e"].amount.toFixed(2)],
      ["5f", r["5f"].desc, r["5f"].amount.toFixed(2)],
      ["5g", r["5g"].desc, r["5g"].amount.toFixed(2)],
      ["", "", ""],
      ["Periode", `${selectedPeriod} ${selectedYear}`, ""],
      [
        "Kilometer aftrek",
        calculatedData.kilometers.vatDeduction.toFixed(2),
        "",
      ],
      [
        "Totaal kilometers",
        calculatedData.kilometers.totalKilometers.toString(),
        "",
      ],
    ];

    const csvContent = csvRows.map((row) => row.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BTW_Overzicht_${selectedPeriod}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    try {
      const declarationData = {
        ...formData,
        user_id: user?.id || "",
        submitted_at:
          formData.status === "submitted" || formData.status === "paid"
            ? new Date().toISOString()
            : undefined,
        paid_at:
          formData.status === "paid" ? new Date().toISOString() : undefined,
      };

      if (editingDeclaration) {
        await updateDeclaration(editingDeclaration.id, declarationData);
        setSuccessData({
          title: "Zaktualizowano! 🎊",
          message: `Deklaracja BTW za ${formData.quarter} ${formData.year} została zaktualizowana`,
          icon: "✅",
        });
      } else {
        await createDeclaration(declarationData);
        setSuccessData({
          title: "Deklaracja Utworzona! 🎉",
          message: `Nowa deklaracja BTW za ${formData.quarter} ${formData.year} została pomyślnie utworzona`,
          icon: "🏆",
        });
      }
      setShowSuccess(true);
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string, quarter: string) => {
    if (
      confirm(`Czy na pewno usunąć deklarację za ${quarter}/${formData.year}?`)
    ) {
      try {
        await deleteDeclaration(id);
        alert("Deklaracja usunięta");
      } catch (error) {
        alert("Błąd usuwania");
        console.error(error);
      }
    }
  };

  const filteredDeclarations = useMemo(() => {
    return (declarations || [])
      .filter((d) => d.year === selectedYear)
      .sort((a, b) => {
        const quarterA = parseInt(a.quarter.replace("Q", ""));
        const quarterB = parseInt(b.quarter.replace("Q", ""));
        return quarterB - quarterA;
      });
  }, [declarations, selectedYear]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Video Header - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video */}
          <div className="relative overflow-hidden rounded-3xl bg-black border-4 border-sky-300 shadow-lg shadow-sky-200/50 h-64 md:h-72 lg:h-80">
            <video
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="absolute top-0 left-0 w-full h-full object-contain"
              onClick={() => setIsMuted(!isMuted)}
            >
              <source src="/btw angifte.mp4" type="video/mp4" />
            </video>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>

          {/* Header Text & Button */}
          <div className="flex flex-col justify-center px-4 md:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 mb-3 md:mb-4 tracking-tight">
              📊 {t.btw.title}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-700 mb-6 md:mb-8 font-medium">
              Kwartalne rozliczenia VAT • Belastingdienst Format
            </p>
            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={() => handleOpenDialog()}
                className="px-10 py-5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-2xl font-black text-lg shadow-2xl transition-all duration-500 hover:scale-105"
              >
                ➕ Nowa deklaracja
              </Button>
              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-6 py-5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-xl"
              >
                {showAdvanced ? "📊 Ukryj analizy" : "📊 Pokaż analizy"}
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Analytics Section */}
        {showAdvanced && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* KOR Calculator */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🧮</span>
                <h3 className="text-lg font-bold text-gray-900">KOR Status</h3>
              </div>
              {korStatus && (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Próg KOR: €20,000
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        {((korStatus.annual_turnover / 20000) * 100).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          korStatus.annual_turnover < 16000
                            ? "bg-green-500"
                            : korStatus.annual_turnover < 19000
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (korStatus.annual_turnover / 20000) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                      <div className="absolute top-0 left-[80%] w-0.5 h-4 bg-orange-400"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>€0</span>
                      <span className="text-orange-600">€16k (80%)</span>
                      <span className="font-bold">€20k</span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg ${
                      korStatus.isEligible
                        ? "bg-green-100 border-green-300"
                        : "bg-red-100 border-red-300"
                    } border`}
                  >
                    <p className="text-sm font-medium">
                      {korStatus.isEligible
                        ? "✅ Kwalifikujesz się"
                        : "❌ Przekroczono próg"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Obrót: {formatCurrency(korStatus.annual_turnover)}
                    </p>
                  </div>

                  {korCalculation && korCalculation.reasons.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {korCalculation.reasons.slice(0, 2).map((reason, idx) => (
                        <p key={idx}>{reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Health Score */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🛡️</span>
                <h3 className="text-lg font-bold text-gray-900">
                  Health Score
                </h3>
              </div>
              {healthScore && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div
                      className={`text-5xl font-black ${
                        healthScore.overall_score >= 80
                          ? "text-green-600"
                          : healthScore.overall_score >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {healthScore.overall_score}
                    </div>
                    <p className="text-sm text-gray-600">Wynik zgodności</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-blue-50 rounded text-center">
                      <p className="text-xs text-gray-500">Compliance</p>
                      <p className="font-bold text-blue-700">
                        {healthScore.components.compliance}%
                      </p>
                    </div>
                    <div className="p-2 bg-green-50 rounded text-center">
                      <p className="text-xs text-gray-500">Accuracy</p>
                      <p className="font-bold text-green-700">
                        {healthScore.components.accuracy}%
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded text-center">
                      <p className="text-xs text-gray-500">Timeliness</p>
                      <p className="font-bold text-yellow-700">
                        {healthScore.components.timeliness}%
                      </p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded text-center">
                      <p className="text-xs text-gray-500">Optimization</p>
                      <p className="font-bold text-purple-700">
                        {healthScore.components.optimization}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Deadlines */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📅</span>
                <h3 className="text-lg font-bold text-gray-900">Terminy</h3>
              </div>
              <div className="space-y-3">
                {deadlines
                  .filter((d) => d.days_remaining > -30)
                  .slice(0, 3)
                  .map((deadline) => (
                    <div
                      key={deadline.id}
                      className={`p-3 rounded-lg border ${
                        deadline.status === "overdue"
                          ? "bg-red-100 border-red-300"
                          : deadline.status === "due_soon"
                          ? "bg-orange-100 border-orange-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">
                          {deadline.quarter} / {deadline.year}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            deadline.status === "overdue"
                              ? "bg-red-200 text-red-800"
                              : deadline.status === "due_soon"
                              ? "bg-orange-200 text-orange-800"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {deadline.days_remaining > 0
                            ? `${deadline.days_remaining} dni`
                            : "Spóźnione!"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Termin:{" "}
                        {new Date(deadline.payment_due).toLocaleDateString(
                          "pl-PL"
                        )}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Analytics KPI */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📈</span>
                <h3 className="text-lg font-bold text-gray-900">
                  Analytics {selectedYear}
                </h3>
              </div>
              {analytics && (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500">
                      Efektywna stawka VAT
                    </p>
                    <p className="text-2xl font-bold text-purple-700">
                      {(analytics.kpis.effective_vat_rate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500">Wskaźnik odliczeń</p>
                    <p className="text-2xl font-bold text-green-700">
                      {(analytics.kpis.deduction_rate * 100).toFixed(1)}%
                    </p>
                  </div>
                  {analytics.top_expense_categories.length > 0 && (
                    <div className="text-xs">
                      <p className="font-medium text-gray-700 mb-1">
                        Top wydatki:
                      </p>
                      {analytics.top_expense_categories
                        .slice(0, 2)
                        .map((cat, idx) => (
                          <p key={idx} className="text-gray-600 truncate">
                            • {cat.category}: {formatCurrency(cat.amount)}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Calculation Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-4xl">🤖</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Automatyczne Rozliczenie VAT - {selectedPeriod} / {selectedYear}
              </h3>
              <p className="text-gray-700 mb-3">
                System zbiera dane z <strong>faktur</strong>,{" "}
                <strong>wydatków</strong> i <strong>zakupów EU</strong>.
              </p>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                  ✅ {quarterInvoiceCount} faktur
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                  🇪🇺 {formatCurrency(calculatedData.expenses.euPurchases)} EU
                  zakupy
                </span>
                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full font-medium">
                  🚗{" "}
                  {calculatedData.kilometers.totalKilometers.toLocaleString()}{" "}
                  km
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatChipsGrid
              items={
                [
                  {
                    id: "vat21",
                    label: "📈 Obroty 21% VAT",
                    value: formatCurrency(calculatedData.invoices.vat21),
                    tone: "emerald",
                    hint: `VAT: ${formatCurrency(
                      calculatedData.invoices.vat21 * 0.21
                    )}`,
                    icon: <TrendingUp className="w-4 h-4" />,
                  },
                  {
                    id: "vat9",
                    label: "📊 Obroty 9% VAT",
                    value: formatCurrency(calculatedData.invoices.vat9),
                    tone: "cyan",
                    hint: `VAT: ${formatCurrency(
                      calculatedData.invoices.vat9 * 0.09
                    )}`,
                    icon: <BarChart3 className="w-4 h-4" />,
                  },
                  {
                    id: "euPurchases",
                    label: "🇪🇺 EU zakupy (4a)",
                    value: formatCurrency(calculatedData.expenses.euPurchases),
                    tone: "violet",
                    hint: `VAT: ${formatCurrency(
                      calculatedData.expenses.euPurchaseVat
                    )}`,
                    icon: <Receipt className="w-4 h-4" />,
                  },
                  {
                    id: "voorbelasting",
                    label: "💳 Voorbelasting (5b)",
                    value: `-${formatCurrency(
                      calculatedData.totalDeductibleVat
                    )}`,
                    tone: "cyan",
                    hint: `Inkl. ${formatCurrency(
                      calculatedData.kilometers.vatDeduction
                    )} km`,
                    icon: <Percent className="w-4 h-4" />,
                  },
                  {
                    id: "balance",
                    label: "💰 Saldo (5g)",
                    value: formatCurrency(calculatedData.balance),
                    tone: calculatedData.balance > 0 ? "rose" : "emerald",
                    hint:
                      calculatedData.balance > 0
                        ? "Te betalen"
                        : "Terug te ontvangen",
                    icon: <TrendingUp className="w-4 h-4" />,
                  },
                ] as StatChipItem[]
              }
              columns={5}
            />
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex gap-4 flex-wrap">
            <Button
              onClick={() => handleAutoFill()}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl"
            >
              💾 Zapisz Deklarację
            </Button>
            <Button
              onClick={() => setShowRubrieken(!showRubrieken)}
              className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-xl"
            >
              📋 {showRubrieken ? "Ukryj" : "Pokaż"} Rubrieken
            </Button>
            <Button
              onClick={handleDownloadXML}
              className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-xl"
            >
              📥 XML
            </Button>
            <Button
              onClick={handleDownloadCSV}
              className="px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold shadow-xl"
            >
              📊 CSV
            </Button>
          </div>
        </div>

        {/* Rubrieken Section - Collapsible */}
        {showRubrieken && (
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">🇳🇱</span>
              BTW Rubrieken - {selectedPeriod} / {selectedYear}
            </h2>

            <div className="space-y-6">
              {/* Rubriek 1: Binnenlandse omzet */}
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-4">
                  📗 Rubriek 1: Prestaties binnenland
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["1a", "1b", "1c", "1d", "1e"].map((key) => {
                    const r =
                      calculatedData.rubrieken[
                        key as keyof typeof calculatedData.rubrieken
                      ];
                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center p-3 bg-white rounded-lg border"
                      >
                        <div>
                          <span className="font-bold text-green-700">
                            {key}.
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {r.desc}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-lg">
                          {formatCurrency(r.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rubriek 3: EU en export */}
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-800 mb-4">
                  📘 Rubriek 3: Leveringen naar buitenland
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["3a", "3b", "3c"].map((key) => {
                    const r =
                      calculatedData.rubrieken[
                        key as keyof typeof calculatedData.rubrieken
                      ];
                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center p-3 bg-white rounded-lg border"
                      >
                        <div>
                          <span className="font-bold text-blue-700">
                            {key}.
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {r.desc}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-lg">
                          {formatCurrency(r.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rubriek 4: EU verwervingen */}
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-purple-800 mb-4">
                  📙 Rubriek 4: Verwervingen uit EU (Intracommunautair)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["4a", "4b"].map((key) => {
                    const r =
                      calculatedData.rubrieken[
                        key as keyof typeof calculatedData.rubrieken
                      ];
                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center p-3 bg-white rounded-lg border"
                      >
                        <div>
                          <span className="font-bold text-purple-700">
                            {key}.
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {r.desc}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-lg">
                          {formatCurrency(r.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rubriek 5: Totalen */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-300">
                <h3 className="text-lg font-bold text-amber-800 mb-4">
                  📕 Rubriek 5: Berekening en totalen
                </h3>
                <div className="space-y-3">
                  {["5a", "5b", "5c", "5d", "5e", "5f", "5g"].map((key) => {
                    const r =
                      calculatedData.rubrieken[
                        key as keyof typeof calculatedData.rubrieken
                      ];
                    const isTotal = key === "5g";
                    return (
                      <div
                        key={key}
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          isTotal
                            ? "bg-gradient-to-r from-orange-100 to-red-100 border-orange-400"
                            : "bg-white"
                        }`}
                      >
                        <div>
                          <span
                            className={`font-bold ${
                              isTotal ? "text-orange-700" : "text-amber-700"
                            }`}
                          >
                            {key}.
                          </span>
                          <span
                            className={`ml-2 ${
                              isTotal
                                ? "font-bold text-gray-900"
                                : "text-sm text-gray-600"
                            }`}
                          >
                            {r.desc}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            isTotal
                              ? `text-2xl ${
                                  r.amount > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`
                              : "text-lg"
                          }`}
                        >
                          {formatCurrency(r.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Rok:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex h-10 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Kwartał:
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as BTWPeriod)}
                className="flex h-10 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {QUARTERS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Declarations List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Deklaracje - {selectedYear}
          </h2>

          {filteredDeclarations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Brak deklaracji
              </h3>
              <p className="text-gray-600 mb-6">
                Utwórz pierwszą deklarację VAT dla roku {selectedYear}
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                ➕ Utwórz deklarację
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeclarations.map((declaration) => (
                <div
                  key={declaration.id}
                  className="grid grid-cols-6 gap-4 items-center p-4 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all"
                >
                  <div className="font-bold text-lg text-gray-900">
                    {declaration.quarter} / {declaration.year}
                  </div>
                  <div>
                    <Badge
                      variant={
                        declaration.status === "paid"
                          ? "success"
                          : declaration.status === "submitted"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {declaration.status === "paid"
                        ? "✅ Zapłacone"
                        : declaration.status === "submitted"
                        ? "📤 Wysłane"
                        : "📝 Draft"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Do zapłaty</div>
                    <div className="font-mono font-bold text-gray-900">
                      {formatCurrency(declaration.total_output_vat)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Do odliczenia</div>
                    <div className="font-mono font-bold text-purple-600">
                      {formatCurrency(declaration.input_vat)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Saldo</div>
                    <div className="font-mono font-bold text-red-600">
                      {formatCurrency(declaration.balance)}
                    </div>
                  </div>
                  <div className="text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenDialog(declaration)}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-blue-700 text-xs font-medium"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(declaration.id, declaration.quarter)
                      }
                      className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded-lg transition-colors text-red-700 text-xs font-medium"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDeclaration
                  ? "✏️ Edytuj deklarację"
                  : "➕ Nowa deklaracja VAT"}
              </h2>
              <p className="text-gray-600">
                {formData.quarter} / {formData.year}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <Button
                onClick={handleAutoFill}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                🔄 Autouzupełnij z faktur i wydatków
              </Button>

              {/* Revenue Section */}
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  📈 Obroty (Sprzedaż)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Obrót 21%
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.revenue_21}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          revenue_21: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      VAT 21%
                    </label>
                    <div className="flex h-10 items-center px-3 py-2 bg-gray-100 rounded-md font-mono font-bold">
                      {formatCurrency(formData.output_vat_21)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Obrót 9%
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.revenue_9}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          revenue_9: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      VAT 9%
                    </label>
                    <div className="flex h-10 items-center px-3 py-2 bg-gray-100 rounded-md font-mono font-bold">
                      {formatCurrency(formData.output_vat_9)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  📉 VAT do odliczenia
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    VAT naliczony (voorbelasting)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.input_vat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        input_vat: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  💰 Podsumowanie
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      VAT do zapłaty:
                    </span>
                    <span className="text-2xl font-mono font-bold text-red-600">
                      {formatCurrency(formData.total_output_vat)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      VAT do odliczenia:
                    </span>
                    <span className="text-2xl font-mono font-bold text-green-600">
                      {formatCurrency(formData.input_vat)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t-2 border-blue-300 pt-3">
                    <span className="text-gray-900 font-bold text-lg">
                      Saldo:
                    </span>
                    <span className="text-3xl font-mono font-bold text-blue-600">
                      {formatCurrency(formData.balance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as BTWStatus,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="draft">📝 Draft</option>
                  <option value="submitted">📤 Wysłane</option>
                  <option value="paid">✅ Zapłacone</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notatki
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Dodatkowe informacje..."
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-4 sticky bottom-0 bg-white">
              <Button
                onClick={() => setIsDialogOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                {t.common.cancel}
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t.common.save}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Celebration Modal */}
      <SuccessCelebration
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={successData.title}
        message={successData.message}
        icon={successData.icon}
      />
    </div>
  );
}
