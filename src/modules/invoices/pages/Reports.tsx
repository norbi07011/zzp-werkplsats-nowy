// =====================================================
// REPORTS PAGE - PREMIUM VERSION WITH CHARTS
// =====================================================
// Advanced financial reporting with 10+ interactive charts
// Based on MESSU-BOUW Premium system
// Dutch tax calculations (KOR, ZZP, BTW thresholds)
// =====================================================

import { useState, useMemo, useEffect, Suspense, lazy } from "react";
import { useTranslation } from "../i18n";
import {
  useSupabaseInvoices,
  useSupabaseExpenses,
  useSupabaseBTW,
  useSupabaseKilometers,
} from "../hooks";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs.js";
import { formatCurrency, formatDate } from "../lib";
import { useAuth } from "../../../../contexts/AuthContext";
import { StatChipsGrid, StatChipItem } from "../../../../components/StatChips";
import {
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  Info,
  BarChart3,
  Receipt,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import type { BTWDeclaration } from "../types";
import ChipLoader from "../components/ChipLoader";
// Lazy load charts for better performance
const RevenueVsExpensesBar = lazy(() =>
  import("../components/charts/RevenueVsExpensesBar").then((m) => ({
    default: m.RevenueVsExpensesBar,
  }))
);
const ExpensePieChart = lazy(() =>
  import("../components/charts/ExpensePieChart").then((m) => ({
    default: m.ExpensePieChart,
  }))
);
const CashFlowArea = lazy(() =>
  import("../components/charts/CashFlowArea").then((m) => ({
    default: m.CashFlowArea,
  }))
);
const ProfitWaterfall = lazy(() =>
  import("../components/charts/ProfitWaterfall").then((m) => ({
    default: m.ProfitWaterfall,
  }))
);
const VATLineChart = lazy(() =>
  import("../components/charts/VATLineChart").then((m) => ({
    default: m.VATLineChart,
  }))
);
const VATReturnsBar = lazy(() =>
  import("../components/charts/VATReturnsBar").then((m) => ({
    default: m.VATReturnsBar,
  }))
);
const KORProgressChart = lazy(() =>
  import("../components/charts/KORProgressChart").then((m) => ({
    default: m.KORProgressChart,
  }))
);
const BTWGaugeChart = lazy(() =>
  import("../components/charts/BTWGaugeChart").then((m) => ({
    default: m.BTWGaugeChart,
  }))
);
const MileageLineChart = lazy(() =>
  import("../components/charts/MileageLineChart").then((m) => ({
    default: m.MileageLineChart,
  }))
);
const TransportCostsBar = lazy(() =>
  import("../components/charts/TransportCostsBar").then((m) => ({
    default: m.TransportCostsBar,
  }))
);
import { ChartSkeleton } from "../components/charts/ChartSkeleton";

// =====================================================
// DUTCH TAX THRESHOLDS 2024/2025
// =====================================================
const DUTCH_TAX_THRESHOLDS = {
  ZZP_LOWER_THRESHOLD: 23000,
  ZZP_UPPER_THRESHOLD: 100000,
  VAT_SMALL_BUSINESS_THRESHOLD: 25000,
  KOR_LOWER: 20000,
  KOR_UPPER: 1500000,
  INCOME_TAX_BOX1_BRACKET1: 73031,
  ZELFSTANDIGENAFTREK: 3750,
  MKBWINSTVRIJSTELLING: 0.14,
  MILEAGE_RATE: 0.21,
};

const TAX_RATES = {
  INCOME_TAX_BRACKET1: 36.93,
  INCOME_TAX_BRACKET2: 49.5,
  VAT_STANDARD: 21,
  VAT_REDUCED: 9,
};

interface ReportsProps {
  onNavigate: (page: string) => void;
}

export default function Reports({ onNavigate }: ReportsProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { invoices, loading: invoicesLoading } = useSupabaseInvoices(
    user?.id || ""
  );
  const { expenses, loading: expensesLoading } = useSupabaseExpenses(
    user?.id || ""
  );
  const { declarations } = useSupabaseBTW(user?.id || "");
  const { entries: kilometerEntries } = useSupabaseKilometers(user?.id || "");

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [activeTab, setActiveTab] = useState("charts");
  const [initialLoading, setInitialLoading] = useState(true);

  // Show loading animation for minimum 1.5 seconds on page entry
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // =====================================================
  // AVAILABLE YEARS
  // =====================================================
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    (invoices || []).forEach((inv) => {
      const year = new Date(inv.invoice_date).getFullYear();
      years.add(year);
    });
    if (years.size === 0) years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices, currentYear]);

  // =====================================================
  // YEAR DATA CALCULATIONS
  // =====================================================
  const yearData = useMemo(() => {
    const year = parseInt(selectedYear);
    const yearInvoices = (invoices || []).filter((inv) => {
      const invYear = new Date(inv.invoice_date).getFullYear();
      return invYear === year;
    });
    const yearExpenses = (expenses || []).filter((exp) => {
      const expYear = new Date(exp.date).getFullYear();
      return expYear === year;
    });
    const yearKilometers = (kilometerEntries || []).filter((km) => {
      const kmYear = new Date(km.date).getFullYear();
      return kmYear === year;
    });

    const totalRevenue = yearInvoices.reduce(
      (sum, inv) => sum + (inv.total_gross || 0),
      0
    );
    const totalNet = yearInvoices.reduce(
      (sum, inv) => sum + (inv.total_net || 0),
      0
    );
    const totalVat = yearInvoices.reduce(
      (sum, inv) => sum + (inv.total_vat || 0),
      0
    );

    const totalExpenses = yearExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );
    const totalExpensesVat = yearExpenses.reduce((sum, exp) => {
      const vat = (exp.amount || 0) * ((exp.vat_rate || 0) / 100);
      const deductible = exp.is_deductible
        ? (exp.deductible_percentage || 100) / 100
        : 0;
      return sum + vat * deductible;
    }, 0);

    const totalKilometers = yearKilometers.reduce(
      (sum, km) => sum + (km.kilometers || 0),
      0
    );
    const mileageDeduction =
      totalKilometers * DUTCH_TAX_THRESHOLDS.MILEAGE_RATE;

    const profit = totalNet - totalExpenses;

    // Paid vs unpaid invoices
    const paidInvoices = yearInvoices.filter((inv) => inv.status === "paid");
    const unpaidInvoices = yearInvoices.filter((inv) => inv.status !== "paid");
    const totalPaid = paidInvoices.reduce(
      (sum, inv) => sum + (inv.total_gross || 0),
      0
    );
    const totalUnpaid = unpaidInvoices.reduce(
      (sum, inv) => sum + (inv.total_gross || 0),
      0
    );

    return {
      totalRevenue,
      totalNet,
      totalVat,
      totalExpenses,
      totalExpensesVat,
      totalKilometers,
      mileageDeduction,
      profit,
      invoicesCount: yearInvoices.length,
      expensesCount: yearExpenses.length,
      paidCount: paidInvoices.length,
      unpaidCount: unpaidInvoices.length,
      totalPaid,
      totalUnpaid,
    };
  }, [selectedYear, invoices, expenses, kilometerEntries]);

  // =====================================================
  // MONTHLY DATA FOR CHARTS
  // =====================================================
  const monthlyData = useMemo(() => {
    const year = parseInt(selectedYear);
    const monthNames = [
      "Sty",
      "Lut",
      "Mar",
      "Kwi",
      "Maj",
      "Cze",
      "Lip",
      "Sie",
      "Wrz",
      "Paź",
      "Lis",
      "Gru",
    ];

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthInvoices = (invoices || []).filter((inv) => {
        const invDate = new Date(inv.invoice_date);
        return (
          invDate.getFullYear() === year && invDate.getMonth() + 1 === month
        );
      });
      const monthExpenses = (expenses || []).filter((exp) => {
        const expDate = new Date(exp.date);
        return (
          expDate.getFullYear() === year && expDate.getMonth() + 1 === month
        );
      });
      const monthKilometers = (kilometerEntries || []).filter((km) => {
        const kmDate = new Date(km.date);
        return kmDate.getFullYear() === year && kmDate.getMonth() + 1 === month;
      });

      const revenue = monthInvoices.reduce(
        (sum, inv) => sum + (inv.total_net || 0),
        0
      );
      const vatOwed = monthInvoices.reduce(
        (sum, inv) => sum + (inv.total_vat || 0),
        0
      );
      const expensesTotal = monthExpenses.reduce(
        (sum, exp) => sum + (exp.amount || 0),
        0
      );
      const vatPaid = monthExpenses.reduce((sum, exp) => {
        const vat = (exp.amount || 0) * ((exp.vat_rate || 0) / 100);
        const deductible = exp.is_deductible
          ? (exp.deductible_percentage || 100) / 100
          : 0;
        return sum + vat * deductible;
      }, 0);
      const kilometers = monthKilometers.reduce(
        (sum, km) => sum + (km.kilometers || 0),
        0
      );
      const profit = revenue - expensesTotal;

      return {
        month,
        monthName: monthNames[i],
        revenue,
        expenses: expensesTotal,
        profit,
        vatOwed,
        vatPaid,
        vatBalance: vatOwed - vatPaid,
        kilometers,
        mileageDeduction: kilometers * DUTCH_TAX_THRESHOLDS.MILEAGE_RATE,
        count: monthInvoices.length,
      };
    });
    return months;
  }, [selectedYear, invoices, expenses, kilometerEntries]);

  // =====================================================
  // VAT RETURNS DATA FOR CHARTS
  // =====================================================
  const vatReturnsData = useMemo(() => {
    return monthlyData.map((m) => {
      const netVAT = m.vatOwed - m.vatPaid;
      return {
        month: m.monthName,
        amount: Math.abs(netVAT),
        type: netVAT >= 0 ? ("payment" as const) : ("refund" as const),
        vatOwed: m.vatOwed,
        vatPaid: m.vatPaid,
        netVAT,
      };
    });
  }, [monthlyData]);

  // =====================================================
  // EXPENSE CATEGORIES FOR PIE CHART
  // =====================================================
  const expenseCategories = useMemo(() => {
    const year = parseInt(selectedYear);
    const yearExpenses = (expenses || []).filter((exp) => {
      const expYear = new Date(exp.date).getFullYear();
      return expYear === year;
    });

    const categoryTotals: Record<string, number> = {};
    yearExpenses.forEach((exp) => {
      const category = exp.category || "Inne";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + (exp.amount || 0);
    });

    const total = Object.values(categoryTotals).reduce(
      (sum, val) => sum + val,
      0
    );

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [selectedYear, expenses]);

  // =====================================================
  // MILEAGE DATA FOR CHARTS
  // =====================================================
  const mileageData = useMemo(() => {
    return monthlyData.map((m) => ({
      month: m.monthName,
      kilometers: m.kilometers,
      deduction: m.mileageDeduction,
      avgPerDay: m.kilometers / 22,
    }));
  }, [monthlyData]);

  // =====================================================
  // TRANSPORT COSTS DATA
  // =====================================================
  const transportData = useMemo(() => {
    const year = parseInt(selectedYear);

    return monthlyData.map((m) => {
      const monthExpenses = (expenses || []).filter((exp) => {
        const expDate = new Date(exp.date);
        return (
          expDate.getFullYear() === year &&
          expDate.getMonth() + 1 === m.month &&
          (exp.category?.toLowerCase().includes("paliwo") ||
            exp.category?.toLowerCase().includes("fuel") ||
            exp.category?.toLowerCase().includes("transport"))
        );
      });

      const fuelCosts = monthExpenses.reduce(
        (sum, exp) => sum + (exp.amount || 0),
        0
      );

      return {
        month: m.monthName,
        fuelCosts,
        mileageDeduction: m.mileageDeduction,
        totalTransport: fuelCosts + m.mileageDeduction,
      };
    });
  }, [selectedYear, expenses, monthlyData]);

  // =====================================================
  // TAX ANALYSIS (Dutch)
  // =====================================================
  const taxAnalysis = useMemo(() => {
    const taxableIncome = Math.max(
      0,
      yearData.totalNet - DUTCH_TAX_THRESHOLDS.ZELFSTANDIGENAFTREK
    );
    const mkbWinstvrijstelling =
      yearData.totalNet * DUTCH_TAX_THRESHOLDS.MKBWINSTVRIJSTELLING;

    let estimatedIncomeTax = 0;
    if (taxableIncome <= DUTCH_TAX_THRESHOLDS.INCOME_TAX_BOX1_BRACKET1) {
      estimatedIncomeTax =
        taxableIncome * (TAX_RATES.INCOME_TAX_BRACKET1 / 100);
    } else {
      const bracket1Tax =
        DUTCH_TAX_THRESHOLDS.INCOME_TAX_BOX1_BRACKET1 *
        (TAX_RATES.INCOME_TAX_BRACKET1 / 100);
      const bracket2Tax =
        (taxableIncome - DUTCH_TAX_THRESHOLDS.INCOME_TAX_BOX1_BRACKET1) *
        (TAX_RATES.INCOME_TAX_BRACKET2 / 100);
      estimatedIncomeTax = bracket1Tax + bracket2Tax;
    }

    const netAfterTax =
      yearData.totalNet - estimatedIncomeTax + mkbWinstvrijstelling;

    return {
      taxableIncome,
      zelfstandigenaftrek: DUTCH_TAX_THRESHOLDS.ZELFSTANDIGENAFTREK,
      mkbWinstvrijstelling,
      estimatedIncomeTax,
      netAfterTax,
      vatToReturn: yearData.totalVat - yearData.totalExpensesVat,
    };
  }, [yearData]);

  // =====================================================
  // STATUS WARNINGS
  // =====================================================
  const statusWarnings = useMemo(() => {
    const warnings: Array<{ type: "info" | "warning"; message: string }> = [];

    if (yearData.totalRevenue >= DUTCH_TAX_THRESHOLDS.ZZP_UPPER_THRESHOLD) {
      warnings.push({
        type: "info",
        message: `Przychody przekroczyły €${DUTCH_TAX_THRESHOLDS.ZZP_UPPER_THRESHOLD.toLocaleString()} - Rozważ wymagania VAR (Verklaring Arbeidsrelatie)`,
      });
    }

    if (
      yearData.totalNet >= DUTCH_TAX_THRESHOLDS.VAT_SMALL_BUSINESS_THRESHOLD
    ) {
      warnings.push({
        type: "warning",
        message: `Przychody netto przekroczyły €${DUTCH_TAX_THRESHOLDS.VAT_SMALL_BUSINESS_THRESHOLD.toLocaleString()} - Zwolnienie VAT dla małych firm (KOR) nie ma zastosowania`,
      });
    }

    if (yearData.unpaidCount > 3) {
      warnings.push({
        type: "warning",
        message: `Masz ${
          yearData.unpaidCount
        } nieopłaconych faktur na łączną kwotę €${yearData.totalUnpaid.toLocaleString()}`,
      });
    }

    return warnings;
  }, [yearData]);

  // =====================================================
  // EXPORT CSV
  // =====================================================
  const handleExportCSV = () => {
    let csv = "Raport Finansowy - ZZP Werkplaats\n";
    csv += `Rok: ${selectedYear}\n`;
    csv += `Data generowania: ${new Date().toLocaleDateString("pl-PL")}\n\n`;

    csv += "=== PODSUMOWANIE ROCZNE ===\n";
    csv += `Przychody brutto,€${yearData.totalRevenue}\n`;
    csv += `Przychody netto,€${yearData.totalNet}\n`;
    csv += `VAT należny,€${yearData.totalVat}\n`;
    csv += `Wydatki,€${yearData.totalExpenses}\n`;
    csv += `VAT naliczony,€${yearData.totalExpensesVat}\n`;
    csv += `Zysk,€${yearData.profit}\n`;
    csv += `Kilometry,${yearData.totalKilometers} km\n`;
    csv += `Odliczenie km,€${yearData.mileageDeduction}\n\n`;

    csv += "=== DANE MIESIĘCZNE ===\n";
    csv += "Miesiąc,Przychody,Wydatki,VAT należny,VAT naliczony,Zysk\n";
    monthlyData.forEach((m) => {
      csv += `${m.monthName},${m.revenue},${m.expenses},${m.vatOwed},${m.vatPaid},${m.profit}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `raport-finansowy-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("✅ Eksport CSV zakończony");
  };

  // =====================================================
  // EXPORT PDF
  // =====================================================
  const handleExportPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    pdf.setFontSize(20);
    pdf.text("Raport Finansowy - ZZP Werkplaats", pageWidth / 2, y, {
      align: "center",
    });
    y += 10;

    pdf.setFontSize(12);
    pdf.text(`Rok: ${selectedYear}`, pageWidth / 2, y, { align: "center" });
    y += 5;
    pdf.text(
      `Data: ${new Date().toLocaleDateString("pl-PL")}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 15;

    pdf.setFontSize(14);
    pdf.text("Podsumowanie roczne", 15, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.text(`Przychody brutto: €${yearData.totalRevenue.toFixed(2)}`, 20, y);
    y += 6;
    pdf.text(`Przychody netto: €${yearData.totalNet.toFixed(2)}`, 20, y);
    y += 6;
    pdf.text(`VAT należny: €${yearData.totalVat.toFixed(2)}`, 20, y);
    y += 6;
    pdf.text(`Wydatki: €${yearData.totalExpenses.toFixed(2)}`, 20, y);
    y += 6;
    pdf.text(`VAT naliczony: €${yearData.totalExpensesVat.toFixed(2)}`, 20, y);
    y += 6;
    pdf.text(`Zysk: €${yearData.profit.toFixed(2)}`, 20, y);
    y += 6;
    pdf.text(
      `Kilometry: ${
        yearData.totalKilometers
      } km (€${yearData.mileageDeduction.toFixed(2)} odliczenie)`,
      20,
      y
    );
    y += 15;

    pdf.setFontSize(14);
    pdf.text("Analiza podatkowa (NL)", 15, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.text(
      `Zelfstandigenaftrek: €${taxAnalysis.zelfstandigenaftrek.toFixed(2)}`,
      20,
      y
    );
    y += 6;
    pdf.text(
      `MKB-winstvrijstelling: €${taxAnalysis.mkbWinstvrijstelling.toFixed(2)}`,
      20,
      y
    );
    y += 6;
    pdf.text(
      `Szacowany podatek dochodowy: €${taxAnalysis.estimatedIncomeTax.toFixed(
        2
      )}`,
      20,
      y
    );
    y += 6;
    pdf.text(
      `VAT do zapłaty/zwrotu: €${taxAnalysis.vatToReturn.toFixed(2)}`,
      20,
      y
    );

    pdf.save(`raport-finansowy-${selectedYear}.pdf`);
    toast.success("✅ PDF wygenerowany");
  };

  // =====================================================
  // RENDER
  // =====================================================

  // Show loading animation on initial page load (minimum 1.5s)
  if (initialLoading || invoicesLoading || expensesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <ChipLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <BarChart3 className="w-10 h-10" />
                📊 {t.reports.title}
              </h1>
              <p className="text-purple-100 text-lg">
                Kompleksowa analiza finansowa dla ZZP
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-xl text-white font-bold border-2 border-white/30"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year} className="text-gray-900">
                    {year}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleExportCSV}
                className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                onClick={handleExportPDF}
                className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Status Warnings */}
        {statusWarnings.length > 0 && (
          <div className="space-y-2">
            {statusWarnings.map((warning, idx) => (
              <Card
                key={idx}
                className={`border-2 ${
                  warning.type === "warning"
                    ? "border-orange-400 bg-orange-50"
                    : "border-blue-400 bg-blue-50"
                }`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  {warning.type === "warning" ? (
                    <AlertTriangle className="text-orange-600 shrink-0 mt-0.5 w-5 h-5" />
                  ) : (
                    <Info className="text-blue-600 shrink-0 mt-0.5 w-5 h-5" />
                  )}
                  <p className="text-sm text-gray-800">{warning.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Cards */}
        <StatChipsGrid
          items={
            [
              {
                id: "revenue",
                label: "Przychody brutto",
                value: formatCurrency(yearData.totalRevenue),
                tone: "cyan",
                hint: `${yearData.invoicesCount} faktur`,
                icon: <TrendingUp className="w-4 h-4" />,
              },
              {
                id: "expenses",
                label: "Wydatki",
                value: formatCurrency(yearData.totalExpenses),
                tone: "rose",
                hint: `${yearData.expensesCount} pozycji`,
                icon: <Wallet className="w-4 h-4" />,
              },
              {
                id: "profit",
                label: "Zysk netto",
                value: formatCurrency(yearData.profit),
                tone: yearData.profit >= 0 ? "emerald" : "rose",
                hint: yearData.profit >= 0 ? "Dodatni" : "Ujemny",
                icon: <BarChart3 className="w-4 h-4" />,
              },
              {
                id: "vat",
                label: "VAT saldo",
                value: formatCurrency(
                  yearData.totalVat - yearData.totalExpensesVat
                ),
                tone: "violet",
                hint:
                  yearData.totalVat - yearData.totalExpensesVat >= 0
                    ? "Do zapłaty"
                    : "Do zwrotu",
                icon: <Receipt className="w-4 h-4" />,
              },
            ] as StatChipItem[]
          }
          columns={4}
        />

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="charts">📊 Wykresy</TabsTrigger>
            <TabsTrigger value="vat">💶 VAT/BTW</TabsTrigger>
            <TabsTrigger value="mileage">🚗 Kilometry</TabsTrigger>
            <TabsTrigger value="tax">🧮 Podatki NL</TabsTrigger>
            <TabsTrigger value="quarterly" className="hidden lg:flex">
              📅 Kwartały
            </TabsTrigger>
            <TabsTrigger value="monthly" className="hidden lg:flex">
              📆 Miesiące
            </TabsTrigger>
          </TabsList>

          {/* CHARTS TAB */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<ChartSkeleton />}>
                <RevenueVsExpensesBar
                  data={monthlyData.map((m) => ({
                    month: m.monthName,
                    revenue: m.revenue,
                    expenses: m.expenses,
                    profit: m.profit,
                  }))}
                />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <ExpensePieChart data={expenseCategories} />
              </Suspense>
            </div>

            <Suspense fallback={<ChartSkeleton />}>
              <CashFlowArea
                data={monthlyData.map((m, idx) => ({
                  month: m.monthName,
                  cashFlow: m.profit,
                  cumulative: monthlyData
                    .slice(0, idx + 1)
                    .reduce((sum, month) => sum + month.profit, 0),
                }))}
              />
            </Suspense>

            <Suspense fallback={<ChartSkeleton />}>
              <ProfitWaterfall
                revenue={yearData.totalNet}
                expenses={yearData.totalExpenses}
                vat={yearData.totalVat - yearData.totalExpensesVat}
              />
            </Suspense>
          </TabsContent>

          {/* VAT TAB */}
          <TabsContent value="vat" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-rose-50 border-rose-200">
                <div className="text-xs text-rose-600 font-semibold mb-1">
                  VAT NALEŻNY
                </div>
                <div className="text-2xl font-bold text-rose-700">
                  {formatCurrency(yearData.totalVat)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Ze sprzedaży</div>
              </Card>
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <div className="text-xs text-emerald-600 font-semibold mb-1">
                  VAT NALICZONY
                </div>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(yearData.totalExpensesVat)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Z zakupów</div>
              </Card>
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="text-xs text-blue-600 font-semibold mb-1">
                  SALDO VAT
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(
                    yearData.totalVat - yearData.totalExpensesVat
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {yearData.totalVat - yearData.totalExpensesVat >= 0
                    ? "Do Belastingdienst"
                    : "Zwrot"}
                </div>
              </Card>
              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="text-xs text-purple-600 font-semibold mb-1">
                  KILOMETRÓWKA VAT
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(yearData.mileageDeduction * 0.21)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {yearData.totalKilometers} km × €0.21 × 21%
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<ChartSkeleton />}>
                <VATLineChart
                  data={monthlyData.map((m) => ({
                    month: m.monthName,
                    vatOwed: m.vatOwed,
                    vatPaid: m.vatPaid,
                    balance: m.vatBalance,
                  }))}
                />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <VATReturnsBar data={vatReturnsData} />
              </Suspense>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<ChartSkeleton />}>
                <KORProgressChart currentRevenue={yearData.totalNet} />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <BTWGaugeChart vatRate={21} recommendedRate={21} />
              </Suspense>
            </div>

            {/* VAT Education Box */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex gap-3 mb-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-white font-bold shadow-lg">
                    💡
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2">
                      Kleineondernemersregeling (KOR) - Zwolnienie z VAT
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>✅ Kiedy możesz skorzystać:</strong> Roczny
                        obrót poniżej €20,000, aplikujesz do Belastingdienst,
                        ważne minimum 3 lata.
                      </p>
                      <p>
                        <strong>💰 Korzyści:</strong> Nie składasz deklaracji
                        VAT, nie pobierasz VAT od klientów, prostsza księgowość.
                      </p>
                      <p>
                        <strong>⚠️ Wady:</strong> Nie możesz odliczyć VAT z
                        zakupów - jeśli wydajesz dużo, stracisz więcej niż
                        zyskasz!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MILEAGE TAB */}
          <TabsContent value="mileage" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="text-xs text-blue-600 font-semibold mb-1">
                  SUMA KILOMETRÓW
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {yearData.totalKilometers.toLocaleString()} km
                </div>
              </Card>
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <div className="text-xs text-emerald-600 font-semibold mb-1">
                  ODLICZENIE
                </div>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(yearData.mileageDeduction)}
                </div>
                <div className="text-xs text-gray-500 mt-1">€0.21/km</div>
              </Card>
              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="text-xs text-purple-600 font-semibold mb-1">
                  ŚREDNIO/MIESIĄC
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {Math.round(yearData.totalKilometers / 12)} km
                </div>
              </Card>
              <Card className="p-4 bg-orange-50 border-orange-200">
                <div className="text-xs text-orange-600 font-semibold mb-1">
                  OSZCZĘDNOŚĆ PODATKOWA
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {formatCurrency(yearData.mileageDeduction * 0.37)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ~37% z odliczenia
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<ChartSkeleton />}>
                <MileageLineChart data={mileageData} />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <TransportCostsBar data={transportData} />
              </Suspense>
            </div>

            {/* Mileage Education */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="pt-6">
                <div className="flex gap-3 mb-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold shadow-lg">
                    🚗
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 mb-2">
                      Rozliczenie kilometrówki w Holandii (2025)
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>📋 Stawka:</strong> €0.21/km za samochód
                        prywatny używany służbowo.
                      </p>
                      <p>
                        <strong>✅ Co się liczy:</strong> Dojazd do klienta,
                        zakup materiałów, spotkania biznesowe, szkolenia.
                      </p>
                      <p>
                        <strong>❌ Co się NIE liczy:</strong> Dojazd dom ↔ stałe
                        miejsce pracy, zakupy prywatne, wakacje.
                      </p>
                      <p>
                        <strong>💡 Pro tip:</strong> Przy 15,000 km służbowych
                        rocznie odliczasz €3,150 + ~€500 VAT z paliwa ={" "}
                        <strong>€3,650 oszczędności!</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAX TAB */}
          <TabsContent value="tax" className="space-y-6">
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  🧮 Analiza podatkowa (Holandia 2024/2025)
                </CardTitle>
                <CardDescription>
                  Szacunkowe obliczenia podatkowe dla ZZP (Zelfstandige Zonder
                  Personeel)
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-sm text-blue-600 font-semibold mb-1">
                      Przychód netto
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(yearData.totalNet)}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-sm text-green-600 font-semibold mb-1">
                      Zelfstandigenaftrek
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      -{formatCurrency(taxAnalysis.zelfstandigenaftrek)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Odliczenie dla samozatrudnionych
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-sm text-emerald-600 font-semibold mb-1">
                      MKB-winstvrijstelling (14%)
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">
                      +{formatCurrency(taxAnalysis.mkbWinstvrijstelling)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Zwolnienie dla MŚP
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="text-sm text-orange-600 font-semibold mb-1">
                      Dochód do opodatkowania
                    </div>
                    <div className="text-2xl font-bold text-orange-700">
                      {formatCurrency(taxAnalysis.taxableIncome)}
                    </div>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                    <div className="text-sm text-rose-600 font-semibold mb-1">
                      Szacowany podatek dochodowy
                    </div>
                    <div className="text-2xl font-bold text-rose-700">
                      {formatCurrency(taxAnalysis.estimatedIncomeTax)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {taxAnalysis.taxableIncome <=
                      DUTCH_TAX_THRESHOLDS.INCOME_TAX_BOX1_BRACKET1
                        ? `${TAX_RATES.INCOME_TAX_BRACKET1}% (Bracket 1)`
                        : `${TAX_RATES.INCOME_TAX_BRACKET1}% + ${TAX_RATES.INCOME_TAX_BRACKET2}%`}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-sm text-purple-600 font-semibold mb-1">
                      VAT do rozliczenia
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {formatCurrency(taxAnalysis.vatToReturn)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {taxAnalysis.vatToReturn >= 0
                        ? "Do zapłaty"
                        : "Do zwrotu"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border-2 border-blue-300">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">💰</div>
                    <div>
                      <div className="text-sm text-gray-600">
                        Szacowany dochód netto po podatkach
                      </div>
                      <div className="text-3xl font-bold text-blue-700">
                        {formatCurrency(taxAnalysis.netAfterTax)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Brackets Info */}
                <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h4 className="font-bold text-yellow-800 mb-3">
                    📊 Progi podatkowe Holandia 2024
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-700">
                        <strong>Bracket 1:</strong> Do €
                        {DUTCH_TAX_THRESHOLDS.INCOME_TAX_BOX1_BRACKET1.toLocaleString()}{" "}
                        → {TAX_RATES.INCOME_TAX_BRACKET1}%
                      </p>
                      <p className="text-gray-700">
                        <strong>Bracket 2:</strong> Powyżej €
                        {DUTCH_TAX_THRESHOLDS.INCOME_TAX_BOX1_BRACKET1.toLocaleString()}{" "}
                        → {TAX_RATES.INCOME_TAX_BRACKET2}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-700">
                        <strong>Zelfstandigenaftrek:</strong> €
                        {DUTCH_TAX_THRESHOLDS.ZELFSTANDIGENAFTREK.toLocaleString()}
                      </p>
                      <p className="text-gray-700">
                        <strong>MKB-winstvrijstelling:</strong> 14% zysku
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QUARTERLY TAB */}
          <TabsContent value="quarterly" className="space-y-6">
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>📅 Rozliczenie kwartalne</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4 p-4 bg-gradient-to-r from-slate-100 to-gray-100 rounded-xl font-bold text-gray-700 text-sm">
                    <div>Kwartał</div>
                    <div className="text-right">Przychody</div>
                    <div className="text-right">Wydatki</div>
                    <div className="text-right">Zysk</div>
                    <div className="text-right">Faktury</div>
                  </div>

                  {[
                    { quarter: "Q1", months: [0, 1, 2] },
                    { quarter: "Q2", months: [3, 4, 5] },
                    { quarter: "Q3", months: [6, 7, 8] },
                    { quarter: "Q4", months: [9, 10, 11] },
                  ].map((q) => {
                    const qData = q.months.map((i) => monthlyData[i]);
                    const revenue = qData.reduce(
                      (sum, m) => sum + m.revenue,
                      0
                    );
                    const expensesTotal = qData.reduce(
                      (sum, m) => sum + m.expenses,
                      0
                    );
                    const profit = revenue - expensesTotal;
                    const count = qData.reduce((sum, m) => sum + m.count, 0);

                    return (
                      <div
                        key={q.quarter}
                        className="grid grid-cols-5 gap-4 items-center p-4 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/80 transition-all"
                      >
                        <div className="font-bold text-gray-900">
                          {q.quarter}
                        </div>
                        <div className="text-right font-mono text-blue-600">
                          {formatCurrency(revenue)}
                        </div>
                        <div className="text-right font-mono text-red-600">
                          {formatCurrency(expensesTotal)}
                        </div>
                        <div
                          className={`text-right font-mono font-bold ${
                            profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(profit)}
                        </div>
                        <div className="text-right text-gray-700">{count}</div>
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-5 gap-4 items-center p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl font-bold border-2 border-blue-300">
                    <div className="text-gray-900">RAZEM</div>
                    <div className="text-right font-mono text-blue-700">
                      {formatCurrency(yearData.totalNet)}
                    </div>
                    <div className="text-right font-mono text-red-700">
                      {formatCurrency(yearData.totalExpenses)}
                    </div>
                    <div
                      className={`text-right font-mono ${
                        yearData.profit >= 0 ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {formatCurrency(yearData.profit)}
                    </div>
                    <div className="text-right text-gray-900">
                      {yearData.invoicesCount}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MONTHLY TAB */}
          <TabsContent value="monthly" className="space-y-6">
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>📆 Rozliczenie miesięczne</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 p-4 bg-gradient-to-r from-slate-100 to-gray-100 rounded-xl font-bold text-gray-700 text-sm">
                    <div>Miesiąc</div>
                    <div className="text-right">Przychody</div>
                    <div className="text-right">Wydatki</div>
                    <div className="text-right">VAT</div>
                    <div className="text-right">Zysk</div>
                    <div className="text-right">Faktury</div>
                  </div>

                  {monthlyData
                    .filter((m) => m.revenue > 0 || m.expenses > 0)
                    .map((m) => (
                      <div
                        key={m.month}
                        className="grid grid-cols-6 gap-4 items-center p-4 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/80 transition-all text-sm"
                      >
                        <div className="font-bold text-gray-900 capitalize">
                          {m.monthName}
                        </div>
                        <div className="text-right font-mono text-blue-600">
                          {formatCurrency(m.revenue)}
                        </div>
                        <div className="text-right font-mono text-red-600">
                          {formatCurrency(m.expenses)}
                        </div>
                        <div className="text-right font-mono text-purple-600">
                          {formatCurrency(m.vatBalance)}
                        </div>
                        <div
                          className={`text-right font-mono font-bold ${
                            m.profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(m.profit)}
                        </div>
                        <div className="text-right text-gray-700">
                          {m.count}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
