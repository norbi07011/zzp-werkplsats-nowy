// =====================================================
// BTW AANGIFTE (VAT DECLARATIONS) PAGE - PROFESSIONAL VERSION
// =====================================================
// Based on official Belastingdienst format with all rubrieken
// Designed like professional accounting software (Exact, Informer, etc.)
// =====================================================

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "../i18n";
import {
  useSupabaseBTW,
  useSupabaseInvoices,
  useSupabaseExpenses,
  useSupabaseKilometers,
} from "../hooks";
import {
  useKOROptimized,
  useBTWHealthScoreOptimized,
  useBTWAnalyticsOptimized,
  useBTWDeadlinesOptimized,
} from "../hooks/useBTWAdvancedOptimized";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatCurrency } from "../lib";
import { useAuth } from "../../../../contexts/AuthContext";
import type { BTWDeclaration, BTWPeriod, BTWStatus } from "../types";

interface BTWAangifteProps {
  onNavigate: (page: string, id?: string) => void;
}

// Official Belastingdienst rubrieken structure
interface BTWRubriek {
  code: string;
  description_nl: string;
  description_pl: string;
  amount: number;
  btw: number;
  isVatField: boolean;
  isEditable: boolean;
  linkedTo?: string;
  category: "binnenland" | "buitenland" | "eu_verwerving" | "totalen";
}

// Dutch BTW tarieven 2024/2025
const BTW_RATES = {
  HIGH: 0.21,
  LOW: 0.09,
  ZERO: 0,
} as const;

const QUARTERS: BTWPeriod[] = ["Q1", "Q2", "Q3", "Q4"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];

const QUARTER_DATES = {
  Q1: { start: "-01-01", end: "-03-31", months: [0, 1, 2] },
  Q2: { start: "-04-01", end: "-06-30", months: [3, 4, 5] },
  Q3: { start: "-07-01", end: "-09-30", months: [6, 7, 8] },
  Q4: { start: "-10-01", end: "-12-31", months: [9, 10, 11] },
} as const;

// Deadline calculation (BTW must be filed by last day of month following quarter)
const getQuarterDeadline = (quarter: BTWPeriod, year: number): Date => {
  const deadlines: Record<BTWPeriod, string> = {
    Q1: `${year}-04-30`,
    Q2: `${year}-07-31`,
    Q3: `${year}-10-31`,
    Q4: `${year + 1}-01-31`,
  };
  return new Date(deadlines[quarter]);
};

// EU countries for ICP (Intracommunautaire Prestaties)
const EU_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
];

export default function BTWAangifteNew({ onNavigate }: BTWAangifteProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as
    | 1
    | 2
    | 3
    | 4;

  // State
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState<BTWPeriod>(
    `Q${currentQuarter}` as BTWPeriod
  );
  const [viewMode, setViewMode] = useState<"form" | "overview" | "history">(
    "form"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Editable rubrieken values
  const [editableValues, setEditableValues] = useState<Record<string, number>>(
    {}
  );

  // Data hooks - with loading states
  const {
    declarations,
    loading: loadingDeclarations,
    createDeclaration,
    updateDeclaration,
    deleteDeclaration,
  } = useSupabaseBTW(user?.id || "");
  const { invoices, loading: loadingInvoices } = useSupabaseInvoices(
    user?.id || ""
  );
  const { expenses, loading: loadingExpenses } = useSupabaseExpenses(
    user?.id || ""
  );
  const { entries: kilometers, loading: loadingKilometers } =
    useSupabaseKilometers(user?.id || "", selectedYear);

  // Combined loading state
  const isLoadingData =
    loadingDeclarations ||
    loadingInvoices ||
    loadingExpenses ||
    loadingKilometers;

  // Advanced hooks - OPTIMIZED (receive data instead of fetching)
  const { korStatus, calculation: korCalculation } = useKOROptimized(
    invoices || [],
    selectedYear
  );
  const healthScore = useBTWHealthScoreOptimized(declarations || []);
  const analytics = useBTWAnalyticsOptimized(
    invoices || [],
    expenses || [],
    `${selectedYear}-01-01`,
    `${selectedYear}-12-31`
  );
  const deadlines = useBTWDeadlinesOptimized();

  // Calculate deadline status
  const deadline = getQuarterDeadline(selectedPeriod, selectedYear);
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysUntilDeadline < 0;
  const isDueSoon = daysUntilDeadline <= 14 && daysUntilDeadline >= 0;

  // Check if declaration already exists for this period
  const existingDeclaration = useMemo(() => {
    return declarations?.find(
      (d) => d.year === selectedYear && d.quarter === selectedPeriod
    );
  }, [declarations, selectedYear, selectedPeriod]);

  // Calculate all rubrieken based on invoices and expenses
  const calculatedRubrieken = useMemo(() => {
    const dates = QUARTER_DATES[selectedPeriod];
    const startDate = `${selectedYear}${dates.start}`;
    const endDate = `${selectedYear}${dates.end}`;

    // Filter invoices for period
    const periodInvoices = (invoices || []).filter((inv) => {
      return inv.invoice_date >= startDate && inv.invoice_date <= endDate;
    });

    // Initialize values
    let leveringen21 = 0; // 1a
    let leveringen9 = 0; // 1c
    let leveringenOverig = 0; // 1e
    let verleggingNaarU = 0; // 2a - BTW verlegd naar u (ontvangen reverse charge)
    let exportBuitenEU = 0; // 3a
    let leveringenEU = 0; // 3b - ICP leveringen
    let installatieEU = 0; // 3c
    let verwervingEU = 0; // 4a - intracommunautaire verwervingen
    let verleggingVanU = 0; // 4b - BTW verlegd van u

    // Process invoices
    periodInvoices.forEach((inv) => {
      const clientCountry = inv.client_snapshot?.country || "NL";
      const netAmount = inv.total_net || 0;

      if (inv.is_reverse_charge) {
        // Reverse charge services - go to 1e
        leveringenOverig += netAmount;
      } else if (clientCountry === "NL") {
        // Dutch clients - check VAT rate
        const vatRate = inv.total_net > 0 ? inv.total_vat / inv.total_net : 0;
        if (vatRate >= 0.2) {
          leveringen21 += netAmount;
        } else if (vatRate >= 0.08) {
          leveringen9 += netAmount;
        } else {
          leveringenOverig += netAmount;
        }
      } else if (EU_COUNTRIES.includes(clientCountry)) {
        // EU clients - intracommunautaire leveringen (ICP)
        leveringenEU += netAmount;
      } else {
        // Non-EU clients - export
        exportBuitenEU += netAmount;
      }
    });

    // Filter expenses for period
    const periodExpenses = (expenses || []).filter((exp) => {
      return exp.date >= startDate && exp.date <= endDate;
    });

    // Calculate voorbelasting (deductible VAT)
    let voorbelasting = 0;

    periodExpenses.forEach((exp) => {
      if (exp.is_deductible) {
        const deductibleVat =
          exp.vat_amount * (exp.deductible_percentage / 100);
        voorbelasting += deductibleVat;

        // Check for EU purchases (intracommunautaire verwervingen)
        const supplier = (exp.supplier || "").toLowerCase();
        const isEUPurchase =
          supplier.includes(".de") ||
          supplier.includes(".fr") ||
          supplier.includes(".be") ||
          supplier.includes(".at") ||
          (exp.vat_rate === 0 && exp.amount > 100); // Likely reverse charge

        if (isEUPurchase) {
          verwervingEU += exp.amount - exp.vat_amount;
        }
      }
    });

    // Kilometers VAT deduction (only for annual declaration or yearly total)
    // Filter by selected year
    const yearKilometers = (kilometers || []).filter((km) => {
      return (
        km.date >= `${selectedYear}-01-01` && km.date <= `${selectedYear}-12-31`
      );
    });

    // Filter by selected quarter for proper period calculation
    const quarterKilometers = yearKilometers.filter((km) => {
      return km.date >= startDate && km.date <= endDate;
    });

    // Calculate kilometer deduction for this quarter
    // km.amount is already calculated (kilometers * rate per km)
    // This represents the tax-deductible travel cost
    const kilometerCostDeduction = quarterKilometers.reduce((sum, km) => {
      return sum + km.amount;
    }, 0);

    // For VAT purposes, we deduct the VAT component from business travel costs
    // Only BUSINESS trips are VAT deductible (not COMMUTE or PRIVATE)
    const businessKilometers = quarterKilometers.filter(
      (km) => km.trip_type === "BUSINESS"
    );

    const kilometerVatDeduction = businessKilometers.reduce((sum, km) => {
      // VAT on fuel/vehicle costs - using effective rate of ~21% of the cost
      return sum + km.amount * BTW_RATES.HIGH;
    }, 0);

    voorbelasting += kilometerVatDeduction;

    // Calculate BTW amounts
    const btw1a = leveringen21 * BTW_RATES.HIGH;
    const btw1c = leveringen9 * BTW_RATES.LOW;
    const btw4a = verwervingEU * BTW_RATES.HIGH;

    // Totalen (Rubriek 5)
    const verschuldigd = btw1a + btw1c + btw4a; // 5a
    const subtotaal = verschuldigd - voorbelasting; // 5c

    // KOR vermindering (if applicable)
    const korVermindering =
      korStatus?.isEligible && subtotaal > 0 ? subtotaal : 0;

    // Final balance
    const totaal = subtotaal - korVermindering;

    // Build rubrieken object
    return {
      // Rubriek 1: Prestaties binnenland
      "1a": {
        code: "1a",
        description_nl: "Leveringen/diensten belast met hoog tarief",
        description_pl: "Dostawy/usługi opodatkowane stawką wysoką (21%)",
        amount: leveringen21,
        btw: btw1a,
        isVatField: false,
        isEditable: true,
        category: "binnenland" as const,
      },
      "1b": {
        code: "1b",
        description_nl: "Omzetbelasting over 1a",
        description_pl: "VAT od 1a",
        amount: btw1a,
        btw: 0,
        isVatField: true,
        isEditable: false,
        linkedTo: "1a",
        category: "binnenland" as const,
      },
      "1c": {
        code: "1c",
        description_nl: "Leveringen/diensten belast met laag tarief",
        description_pl: "Dostawy/usługi opodatkowane stawką niską (9%)",
        amount: leveringen9,
        btw: btw1c,
        isVatField: false,
        isEditable: true,
        category: "binnenland" as const,
      },
      "1d": {
        code: "1d",
        description_nl: "Omzetbelasting over 1c",
        description_pl: "VAT od 1c",
        amount: btw1c,
        btw: 0,
        isVatField: true,
        isEditable: false,
        linkedTo: "1c",
        category: "binnenland" as const,
      },
      "1e": {
        code: "1e",
        description_nl:
          "Leveringen/diensten belast met overige tarieven, behalve 0%",
        description_pl: "Dostawy/usługi z innymi stawkami (nie 0%)",
        amount: leveringenOverig,
        btw: 0,
        isVatField: false,
        isEditable: true,
        category: "binnenland" as const,
      },

      // Rubriek 2: Verleggingsregelingen binnenland
      "2a": {
        code: "2a",
        description_nl:
          "Leveringen/diensten waarbij de omzetbelasting naar u is verlegd",
        description_pl: "Odwrotne obciążenie - VAT przeniesiony na Ciebie",
        amount: verleggingNaarU,
        btw: verleggingNaarU * BTW_RATES.HIGH,
        isVatField: false,
        isEditable: true,
        category: "binnenland" as const,
      },

      // Rubriek 3: Leveringen naar het buitenland
      "3a": {
        code: "3a",
        description_nl: "Leveringen naar landen buiten de EU (uitvoer)",
        description_pl: "Eksport poza UE",
        amount: exportBuitenEU,
        btw: 0,
        isVatField: false,
        isEditable: true,
        category: "buitenland" as const,
      },
      "3b": {
        code: "3b",
        description_nl: "Leveringen naar/diensten in landen binnen de EU",
        description_pl: "Wewnątrzwspólnotowe dostawy towarów/usług (ICP)",
        amount: leveringenEU,
        btw: 0,
        isVatField: false,
        isEditable: true,
        category: "buitenland" as const,
      },
      "3c": {
        code: "3c",
        description_nl: "Installatie/afstandsverkopen binnen de EU",
        description_pl: "Instalacja/sprzedaż na odległość w UE",
        amount: installatieEU,
        btw: 0,
        isVatField: false,
        isEditable: true,
        category: "buitenland" as const,
      },

      // Rubriek 4: Leveringen/diensten uit het buitenland aan u verricht
      "4a": {
        code: "4a",
        description_nl: "Leveringen/diensten uit landen binnen de EU",
        description_pl: "Wewnątrzwspólnotowe nabycia towarów/usług (WNT)",
        amount: verwervingEU,
        btw: btw4a,
        isVatField: false,
        isEditable: true,
        category: "eu_verwerving" as const,
      },
      "4b": {
        code: "4b",
        description_nl: "Omzetbelasting over 4a",
        description_pl: "VAT od 4a (do zapłaty i odliczenia)",
        amount: btw4a,
        btw: 0,
        isVatField: true,
        isEditable: false,
        linkedTo: "4a",
        category: "eu_verwerving" as const,
      },

      // Rubriek 5: Voorbelasting en totalen
      "5a": {
        code: "5a",
        description_nl:
          "Verschuldigde omzetbelasting (rubrieken 1b + 1d + 2a + 4b)",
        description_pl: "Należny VAT (suma 1b + 1d + 2a + 4b)",
        amount: verschuldigd,
        btw: 0,
        isVatField: false,
        isEditable: false,
        category: "totalen" as const,
      },
      "5b": {
        code: "5b",
        description_nl: "Voorbelasting",
        description_pl: "Naliczony VAT (do odliczenia)",
        amount: voorbelasting,
        btw: 0,
        isVatField: false,
        isEditable: true,
        category: "totalen" as const,
      },
      "5c": {
        code: "5c",
        description_nl: "Subtotaal (rubriek 5a min rubriek 5b)",
        description_pl: "Suma częściowa (5a - 5b)",
        amount: subtotaal,
        btw: 0,
        isVatField: false,
        isEditable: false,
        category: "totalen" as const,
      },
      "5d": {
        code: "5d",
        description_nl: "Vermindering volgens de kleineondernemersregeling",
        description_pl: "Ulga KOR (dla małych przedsiębiorców)",
        amount: korVermindering,
        btw: 0,
        isVatField: false,
        isEditable: true,
        category: "totalen" as const,
      },
      "5e": {
        code: "5e",
        description_nl: "Schatting vorige tijdvak(ken)",
        description_pl: "Korekta z poprzednich okresów",
        amount: 0,
        btw: 0,
        isVatField: false,
        isEditable: true,
        category: "totalen" as const,
      },
      "5f": {
        code: "5f",
        description_nl: "Schatting dit tijdvak",
        description_pl: "Szacunek dla tego okresu",
        amount: 0,
        btw: 0,
        isVatField: false,
        isEditable: true,
        category: "totalen" as const,
      },
      "5g": {
        code: "5g",
        description_nl: "Totaal te betalen of terug te ontvangen",
        description_pl: "SUMA DO ZAPŁATY / ZWROTU",
        amount: totaal,
        btw: 0,
        isVatField: false,
        isEditable: false,
        category: "totalen" as const,
      },

      // Summary data
      _summary: {
        totalInvoices: periodInvoices.length,
        totalExpenses: periodExpenses.length,
        kilometerDeduction: kilometerVatDeduction,
        kilometerCost: kilometerCostDeduction,
        totalKilometers: quarterKilometers.reduce(
          (sum, km) => sum + km.kilometers,
          0
        ),
        businessKilometers: businessKilometers.reduce(
          (sum, km) => sum + km.kilometers,
          0
        ),
        tripsCount: quarterKilometers.length,
      },
    };
  }, [selectedYear, selectedPeriod, invoices, expenses, kilometers, korStatus]);

  // Handle editable value change
  const handleValueChange = useCallback((code: string, value: number) => {
    setEditableValues((prev) => ({ ...prev, [code]: value }));
  }, []);

  // Get final value (editable or calculated)
  const getFinalValue = useCallback(
    (code: string) => {
      if (editableValues[code] !== undefined) {
        return editableValues[code];
      }
      const rubriek =
        calculatedRubrieken[code as keyof typeof calculatedRubrieken];
      return rubriek && typeof rubriek === "object" && "amount" in rubriek
        ? rubriek.amount
        : 0;
    },
    [editableValues, calculatedRubrieken]
  );

  // Reset editable values to calculated
  const handleReset = useCallback(() => {
    setEditableValues({});
  }, []);

  // Generate XML for Belastingdienst
  const handleExportXML = useCallback(() => {
    const quarterDates = QUARTER_DATES[selectedPeriod];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<BTWAangifte xmlns="http://www.belastingdienst.nl/wus/btwv/2025">
  <Header>
    <AangifteTijdvak>
      <DatumVan>${selectedYear}${quarterDates.start}</DatumVan>
      <DatumTot>${selectedYear}${quarterDates.end}</DatumTot>
    </AangifteTijdvak>
    <Kwartaal>${selectedPeriod}</Kwartaal>
    <Jaar>${selectedYear}</Jaar>
  </Header>
  <Rubrieken>
    <Rubriek1a>
      <Omzet>${getFinalValue("1a").toFixed(2)}</Omzet>
      <Omzetbelasting>${(getFinalValue("1a") * BTW_RATES.HIGH).toFixed(
        2
      )}</Omzetbelasting>
    </Rubriek1a>
    <Rubriek1c>
      <Omzet>${getFinalValue("1c").toFixed(2)}</Omzet>
      <Omzetbelasting>${(getFinalValue("1c") * BTW_RATES.LOW).toFixed(
        2
      )}</Omzetbelasting>
    </Rubriek1c>
    <Rubriek1e>${getFinalValue("1e").toFixed(2)}</Rubriek1e>
    <Rubriek2a>${getFinalValue("2a").toFixed(2)}</Rubriek2a>
    <Rubriek3a>${getFinalValue("3a").toFixed(2)}</Rubriek3a>
    <Rubriek3b>${getFinalValue("3b").toFixed(2)}</Rubriek3b>
    <Rubriek3c>${getFinalValue("3c").toFixed(2)}</Rubriek3c>
    <Rubriek4a>
      <Omzet>${getFinalValue("4a").toFixed(2)}</Omzet>
      <Omzetbelasting>${(getFinalValue("4a") * BTW_RATES.HIGH).toFixed(
        2
      )}</Omzetbelasting>
    </Rubriek4a>
    <Rubriek5a>${getFinalValue("5a").toFixed(2)}</Rubriek5a>
    <Rubriek5b>${getFinalValue("5b").toFixed(2)}</Rubriek5b>
    <Rubriek5c>${getFinalValue("5c").toFixed(2)}</Rubriek5c>
    <Rubriek5d>${getFinalValue("5d").toFixed(2)}</Rubriek5d>
    <Rubriek5e>${getFinalValue("5e").toFixed(2)}</Rubriek5e>
    <Rubriek5f>${getFinalValue("5f").toFixed(2)}</Rubriek5f>
    <Rubriek5g>${getFinalValue("5g").toFixed(2)}</Rubriek5g>
  </Rubrieken>
  <Metadata>
    <Gegenereerd>${new Date().toISOString()}</Gegenereerd>
    <Bron>ZZP Werkplaats</Bron>
  </Metadata>
</BTWAangifte>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BTW_Aangifte_${selectedPeriod}_${selectedYear}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedPeriod, selectedYear, getFinalValue]);

  // Save declaration
  const handleSaveDeclaration = useCallback(
    async (status: BTWStatus = "draft") => {
      if (!user?.id) return;

      setIsSubmitting(true);
      try {
        const data = {
          user_id: user.id,
          year: selectedYear,
          quarter: selectedPeriod,
          status,
          revenue_21: getFinalValue("1a"),
          revenue_9: getFinalValue("1c"),
          revenue_0: getFinalValue("1e"),
          revenue_eu: getFinalValue("3b"),
          revenue_export: getFinalValue("3a"),
          input_vat: getFinalValue("5b"),
          output_vat_21: getFinalValue("1a") * BTW_RATES.HIGH,
          output_vat_9: getFinalValue("1c") * BTW_RATES.LOW,
          total_output_vat: getFinalValue("5a"),
          balance: getFinalValue("5g"),
          submitted_at:
            status === "submitted" || status === "paid"
              ? new Date().toISOString()
              : undefined,
          paid_at: status === "paid" ? new Date().toISOString() : undefined,
        };

        if (existingDeclaration) {
          await updateDeclaration(existingDeclaration.id, data);
        } else {
          await createDeclaration(data);
        }

        alert(
          status === "submitted"
            ? "✅ Deklaracja wysłana!"
            : "💾 Deklaracja zapisana"
        );
      } catch (error) {
        console.error("Error saving declaration:", error);
        alert("❌ Błąd zapisu deklaracji");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      user,
      selectedYear,
      selectedPeriod,
      getFinalValue,
      existingDeclaration,
      createDeclaration,
      updateDeclaration,
    ]
  );

  // Render rubriek row
  const renderRubriekRow = (code: string) => {
    const rubriek =
      calculatedRubrieken[code as keyof typeof calculatedRubrieken];
    if (!rubriek || typeof rubriek !== "object" || !("amount" in rubriek))
      return null;

    const value = getFinalValue(code);
    const isCalculated = editableValues[code] === undefined;

    return (
      <div
        key={code}
        className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border transition-all ${
          code === "5g"
            ? "bg-gradient-to-r from-orange-100 to-red-100 border-orange-300 shadow-md"
            : "bg-white hover:bg-gray-50 border-gray-200"
        }`}
      >
        {/* Code */}
        <div className="col-span-1">
          <span
            className={`font-mono font-bold ${
              code === "5g" ? "text-orange-700 text-lg" : "text-blue-700"
            }`}
          >
            {code}
          </span>
        </div>

        {/* Description */}
        <div className="col-span-6">
          <p
            className={`text-sm ${
              code === "5g" ? "font-bold text-gray-900" : "text-gray-700"
            }`}
          >
            {rubriek.description_nl}
          </p>
          <p className="text-xs text-gray-500">{rubriek.description_pl}</p>
        </div>

        {/* Amount input */}
        <div className="col-span-3">
          {rubriek.isEditable ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                €
              </span>
              <Input
                type="number"
                value={value.toFixed(2)}
                onChange={(e) =>
                  handleValueChange(code, parseFloat(e.target.value) || 0)
                }
                className={`pl-8 text-right font-mono ${
                  isCalculated ? "bg-blue-50" : "bg-yellow-50"
                }`}
                step="0.01"
              />
              {isCalculated && (
                <span className="absolute -top-1 -right-1 text-xs bg-blue-500 text-white px-1 rounded">
                  auto
                </span>
              )}
            </div>
          ) : (
            <div
              className={`text-right font-mono font-bold px-3 py-2 rounded ${
                code === "5g"
                  ? value > 0
                    ? "text-2xl text-red-600"
                    : "text-2xl text-green-600"
                  : "text-gray-900"
              }`}
            >
              €
              {value.toLocaleString("nl-NL", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          )}
        </div>

        {/* BTW amount (for 1a, 1c, 4a) */}
        <div className="col-span-2 text-right">
          {rubriek.isVatField || rubriek.btw > 0 ? (
            <span className="font-mono text-sm text-purple-600">
              BTW: €
              {rubriek.btw.toLocaleString("nl-NL", {
                minimumFractionDigits: 2,
              })}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
      translate="no"
      suppressHydrationWarning
    >
      {/* Loading overlay */}
      {isLoadingData && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="text-xl font-bold text-gray-700">Laden...</div>
            <div className="text-sm text-gray-500">
              Facturen: {invoices?.length || 0} • Kosten:{" "}
              {expenses?.length || 0} • Kilometers: {kilometers?.length || 0}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                  <span className="text-4xl">🇳🇱</span>
                  BTW Aangifte
                </h1>
                <p className="text-blue-100 mt-1 text-lg">
                  Officieel Belastingdienst formaat • {selectedPeriod} /{" "}
                  {selectedYear}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Deadline indicator */}
                <div
                  className={`px-4 py-2 rounded-xl font-medium ${
                    isOverdue
                      ? "bg-red-500 text-white animate-pulse"
                      : isDueSoon
                      ? "bg-yellow-400 text-yellow-900"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {isOverdue ? (
                    <>⚠️ {Math.abs(daysUntilDeadline)} dagen te laat!</>
                  ) : (
                    <>
                      📅 Deadline: {deadline.toLocaleDateString("nl-NL")} (
                      {daysUntilDeadline} dagen)
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Period selector */}
          <div className="p-4 bg-gray-50 border-b flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Jaar:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Periode:
              </label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {QUARTERS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedPeriod(q)}
                    className={`px-4 py-2 font-medium transition-colors ${
                      selectedPeriod === q
                        ? "bg-blue-600 text-white"
                        : "bg-white hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {existingDeclaration && (
              <Badge
                variant={
                  existingDeclaration.status === "paid"
                    ? "success"
                    : existingDeclaration.status === "submitted"
                    ? "warning"
                    : "secondary"
                }
              >
                {existingDeclaration.status === "paid"
                  ? "✅ Betaald"
                  : existingDeclaration.status === "submitted"
                  ? "📤 Verstuurd"
                  : "📝 Concept"}
              </Badge>
            )}

            <div className="flex-1" />

            <Button
              onClick={() => setShowHelp(!showHelp)}
              variant="outline"
              className="text-sm"
            >
              ❓ Hulp
            </Button>
          </div>
        </div>

        {/* Help panel */}
        {showHelp && (
          <Card className="p-6 bg-blue-50 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              📖 Toelichting BTW Aangifte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">
                  Rubriek 1-2: Binnenland
                </h4>
                <ul className="space-y-1">
                  <li>
                    <strong>1a/1b:</strong> Omzet en BTW tegen 21%
                  </li>
                  <li>
                    <strong>1c/1d:</strong> Omzet en BTW tegen 9%
                  </li>
                  <li>
                    <strong>1e:</strong> Overige tarieven (excl. 0%)
                  </li>
                  <li>
                    <strong>2a:</strong> Verleggingsregeling naar u
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">
                  Rubriek 3-4: Buitenland
                </h4>
                <ul className="space-y-1">
                  <li>
                    <strong>3a:</strong> Export buiten EU (0%)
                  </li>
                  <li>
                    <strong>3b:</strong> Intracommunautaire leveringen EU
                  </li>
                  <li>
                    <strong>4a/4b:</strong> Verwervingen uit EU + BTW
                  </li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <h4 className="font-bold text-gray-900 mb-2">
                  Rubriek 5: Totalen
                </h4>
                <ul className="space-y-1">
                  <li>
                    <strong>5a:</strong> Totaal verschuldigde BTW
                  </li>
                  <li>
                    <strong>5b:</strong> Aftrekbare voorbelasting
                  </li>
                  <li>
                    <strong>5g:</strong> Eindresultaat (te betalen/terug te
                    ontvangen)
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200">
            <div className="text-sm text-gray-600 mb-1">📄 Facturen</div>
            <div className="text-3xl font-bold text-green-600">
              {calculatedRubrieken._summary?.totalInvoices || 0}
            </div>
            <div className="text-xs text-gray-500">in dit kwartaal</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-200">
            <div className="text-sm text-gray-600 mb-1">🧾 Uitgaven</div>
            <div className="text-3xl font-bold text-purple-600">
              {calculatedRubrieken._summary?.totalExpenses || 0}
            </div>
            <div className="text-xs text-gray-500">verwerkt</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-100 border-2 border-blue-200">
            <div className="text-sm text-gray-600 mb-1">🚗 Km aftrek</div>
            <div className="text-2xl font-bold text-blue-600">
              €
              {(calculatedRubrieken._summary?.kilometerDeduction || 0).toFixed(
                2
              )}
            </div>
            <div className="text-xs text-gray-500">
              {calculatedRubrieken._summary?.businessKilometers || 0} km
              zakelijk ({calculatedRubrieken._summary?.tripsCount || 0} ritten)
            </div>
          </Card>
          <Card
            className={`p-4 border-2 ${
              getFinalValue("5g") > 0
                ? "bg-gradient-to-br from-red-50 to-orange-100 border-red-200"
                : "bg-gradient-to-br from-green-50 to-teal-100 border-green-200"
            }`}
          >
            <div className="text-sm text-gray-600 mb-1">💰 Saldo</div>
            <div
              className={`text-3xl font-bold ${
                getFinalValue("5g") > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              €{Math.abs(getFinalValue("5g")).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">
              {getFinalValue("5g") > 0 ? "te betalen" : "terug te ontvangen"}
            </div>
          </Card>
        </div>

        {/* Main form */}
        <Card className="overflow-hidden shadow-xl">
          <div className="bg-gray-100 px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              📋 BTW Rubrieken
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                auto = berekend
              </span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                geel = handmatig
              </span>
              <Button onClick={handleReset} variant="outline" size="sm">
                🔄 Reset
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Rubriek 1: Binnenland */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📗</span>
                <h3 className="text-lg font-bold text-green-800">
                  Rubriek 1 & 2: Prestaties binnenland
                </h3>
              </div>
              <div className="space-y-2">
                {["1a", "1b", "1c", "1d", "1e", "2a"].map((code) =>
                  renderRubriekRow(code)
                )}
              </div>
            </div>

            {/* Rubriek 3: Buitenland */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📘</span>
                <h3 className="text-lg font-bold text-blue-800">
                  Rubriek 3: Leveringen naar het buitenland
                </h3>
              </div>
              <div className="space-y-2">
                {["3a", "3b", "3c"].map((code) => renderRubriekRow(code))}
              </div>
            </div>

            {/* Rubriek 4: EU verwervingen */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📙</span>
                <h3 className="text-lg font-bold text-purple-800">
                  Rubriek 4: Leveringen uit EU-landen aan u
                </h3>
              </div>
              <div className="space-y-2">
                {["4a", "4b"].map((code) => renderRubriekRow(code))}
              </div>
            </div>

            {/* Rubriek 5: Totalen */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-300">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📕</span>
                <h3 className="text-lg font-bold text-amber-800">
                  Rubriek 5: Voorbelasting en totalen
                </h3>
              </div>
              <div className="space-y-2">
                {["5a", "5b", "5c", "5d", "5e", "5f", "5g"].map((code) =>
                  renderRubriekRow(code)
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* KOR Status (if applicable) */}
        {korStatus && (
          <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🧮</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  Kleineondernemersregeling (KOR)
                </h3>
                <p className="text-gray-600 text-sm">
                  Jaaromzet: {formatCurrency(korStatus.annual_turnover)} /
                  €20.000 limiet
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      korStatus.isEligible ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (korStatus.annual_turnover / 20000) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-xl font-bold ${
                  korStatus.isEligible
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {korStatus.isEligible
                  ? "✅ Komt in aanmerking"
                  : "❌ Niet van toepassing"}
              </div>
            </div>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => handleSaveDeclaration("draft")}
            disabled={isSubmitting}
            className="flex-1 min-w-[200px] py-6 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-bold text-lg shadow-xl"
          >
            💾 Opslaan als concept
          </Button>
          <Button
            onClick={() => handleSaveDeclaration("submitted")}
            disabled={isSubmitting}
            className="flex-1 min-w-[200px] py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl"
          >
            📤 Markeer als verstuurd
          </Button>
          <Button
            onClick={handleExportXML}
            className="py-6 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-xl"
          >
            📥 Export XML
          </Button>
          <Button
            onClick={() => handleSaveDeclaration("paid")}
            disabled={isSubmitting}
            className="py-6 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-xl"
          >
            ✅ Markeer als betaald
          </Button>
        </div>

        {/* Declaration history */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            📋 Deklaracje {selectedYear}
          </h2>

          {declarations &&
          declarations.filter((d) => d.year === selectedYear).length > 0 ? (
            <div className="space-y-3">
              {declarations
                .filter((d) => d.year === selectedYear)
                .sort((a, b) => b.quarter.localeCompare(a.quarter))
                .map((declaration) => (
                  <div
                    key={declaration.id}
                    className={`grid grid-cols-6 gap-4 items-center p-4 rounded-xl border-2 transition-all ${
                      declaration.quarter === selectedPeriod
                        ? "bg-blue-50 border-blue-300 shadow-md"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
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
                          ? "✅ Betaald"
                          : declaration.status === "submitted"
                          ? "📤 Verstuurd"
                          : "📝 Concept"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        BTW af te dragen
                      </div>
                      <div className="font-mono font-bold">
                        {formatCurrency(declaration.total_output_vat)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Voorbelasting</div>
                      <div className="font-mono font-bold text-purple-600">
                        {formatCurrency(declaration.input_vat)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Saldo</div>
                      <div
                        className={`font-mono font-bold ${
                          declaration.balance > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatCurrency(declaration.balance)}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setSelectedPeriod(declaration.quarter)}
                        variant="outline"
                        size="sm"
                      >
                        👁️
                      </Button>
                      <Button
                        onClick={() => deleteDeclaration(declaration.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">📊</div>
              <p>Geen deklaraties voor {selectedYear}</p>
            </div>
          )}
        </Card>

        {/* Footer info */}
        <div className="text-center text-sm text-gray-500 pb-8">
          <p>
            🔒 Gegevens worden veilig opgeslagen • 📋 Formaat conform
            Belastingdienst eisen • 💡 Tip: Gebruik XML export voor Mijn
            Belastingdienst Zakelijk
          </p>
        </div>
      </div>
    </div>
  );
}
