/**
 * =====================================================
 * ZAAWANSOWANE HOOKI BTW
 * =====================================================
 * KOR Calculator, Health Score, Analytics, Deadlines
 * Dostosowane do Supabase + ZZP Werkplaats
 * =====================================================
 */

import { useState, useEffect, useMemo } from "react";
import {
  useSupabaseInvoices,
  useSupabaseExpenses,
  useSupabaseBTW,
} from "./index";

// ============================================
// TYPES
// ============================================

export interface KORStatus {
  isEligible: boolean;
  year: number;
  annual_turnover: number;
  threshold: number;
  vat_exemption_amount: number;
  notes: string;
}

export interface KORCalculation {
  previous_year_turnover: number;
  current_year_forecast: number;
  savings_estimate: number;
  recommendation: "apply" | "borderline" | "not_applicable";
  reasons: string[];
}

export interface BTWHealthScore {
  overall_score: number;
  components: {
    compliance: number;
    accuracy: number;
    timeliness: number;
    optimization: number;
  };
  issues: Array<{
    severity: "critical" | "warning" | "info";
    category: string;
    description: string;
    fix_suggestion: string;
  }>;
  calculated_at: string;
}

export interface BTWAnalytics {
  period: {
    start: string;
    end: string;
    type: "quarterly" | "yearly";
  };
  top_expense_categories: Array<{
    category: string;
    amount: number;
    vat: number;
    percentage: number;
  }>;
  kpis: {
    effective_vat_rate: number;
    vat_to_revenue_ratio: number;
    deduction_rate: number;
    average_monthly_vat: number;
  };
}

export interface BTWDeadline {
  id: string;
  year: number;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  declaration_due: string;
  payment_due: string;
  status: "upcoming" | "due_soon" | "overdue" | "completed";
  days_remaining: number;
  penalties: {
    late_filing_fee: number;
    late_payment_interest: number;
    total_penalty: number;
  };
}

// ============================================
// HOOK: KOR (Kleineondernemersregeling)
// ============================================

export function useKOR(userId: string, year: number) {
  const { invoices } = useSupabaseInvoices(userId);
  const [korStatus, setKorStatus] = useState<KORStatus | null>(null);
  const [calculation, setCalculation] = useState<KORCalculation | null>(null);

  // PROGI BTW HOLANDIA
  const KOR_THRESHOLD = 20000; // €20,000 - próg zwolnienia
  const QUARTERLY_THRESHOLD = 1500000; // €1,500,000 - powyżej = miesięczne

  const VAT_RATES = {
    standard: 0.21,
    reduced: 0.09,
    zero: 0.0,
  } as const;

  useEffect(() => {
    if (!invoices?.length) {
      setKorStatus(null);
      setCalculation(null);
      return;
    }

    // Oblicz roczny obrót
    const yearInvoices = invoices.filter((inv) =>
      inv.invoice_date?.startsWith(year.toString())
    );

    const annualTurnover = yearInvoices.reduce(
      (sum, inv) => sum + (inv.total_net || 0),
      0
    );

    const isEligible = annualTurnover < KOR_THRESHOLD;
    const savingsEstimate = isEligible
      ? annualTurnover * VAT_RATES.standard
      : 0;
    const declarationType =
      annualTurnover > QUARTERLY_THRESHOLD ? "monthly" : "quarterly";
    const distanceToThreshold = KOR_THRESHOLD - annualTurnover;
    const utilizationPercent = (annualTurnover / KOR_THRESHOLD) * 100;

    setKorStatus({
      isEligible,
      year,
      annual_turnover: annualTurnover,
      threshold: KOR_THRESHOLD,
      vat_exemption_amount: savingsEstimate,
      notes: isEligible
        ? utilizationPercent > 90
          ? `⚠️ UWAGA! ${utilizationPercent.toFixed(
              1
            )}% progu KOR. Zostało €${distanceToThreshold.toFixed(2)}.`
          : `✅ Kwalifikujesz się do KOR! Oszczędzasz ~€${savingsEstimate.toFixed(
              2
            )} rocznie.`
        : `❌ Obrót przekracza próg KOR (€${annualTurnover.toFixed(
            2
          )} > €${KOR_THRESHOLD}).`,
    });

    // Poprzedni rok
    const prevYearInvoices = invoices.filter((inv) =>
      inv.invoice_date?.startsWith((year - 1).toString())
    );
    const prevYearTurnover = prevYearInvoices.reduce(
      (sum, inv) => sum + (inv.total_net || 0),
      0
    );

    // Prognoza
    const currentMonth = new Date().getMonth() + 1;
    const forecastAnnual =
      currentMonth > 0 ? (annualTurnover / currentMonth) * 12 : annualTurnover;

    const reasons: string[] = [];

    if (forecastAnnual < KOR_THRESHOLD * 0.5) {
      reasons.push(
        `✅ Bardzo niski obrót (${(
          (forecastAnnual / KOR_THRESHOLD) *
          100
        ).toFixed(0)}% progu KOR)`
      );
      reasons.push("💡 KOR jest IDEALNY - oszczędzasz BTW");
      reasons.push(
        `💰 Szacowana oszczędność: €${(
          forecastAnnual * VAT_RATES.standard
        ).toFixed(2)}/rok`
      );
    } else if (forecastAnnual < KOR_THRESHOLD * 0.8) {
      reasons.push(
        `✅ Obrót bezpieczny (${(
          (forecastAnnual / KOR_THRESHOLD) *
          100
        ).toFixed(0)}% progu)`
      );
      reasons.push("💡 KOR zalecany JEŚLI masz niskie wydatki");
    } else if (forecastAnnual < KOR_THRESHOLD * 0.95) {
      reasons.push(
        `⚠️ STREFA GRANICZNA! (${(
          (forecastAnnual / KOR_THRESHOLD) *
          100
        ).toFixed(0)}% progu)`
      );
      reasons.push(
        `🚨 Zostało tylko €${(KOR_THRESHOLD - forecastAnnual).toFixed(
          2
        )} do przekroczenia!`
      );
      reasons.push("💡 Rozważ REZYGNACJĘ z KOR");
    } else if (forecastAnnual < KOR_THRESHOLD) {
      reasons.push(
        `🔴 BARDZO BLISKO PROGU! (${(
          (forecastAnnual / KOR_THRESHOLD) *
          100
        ).toFixed(0)}%)`
      );
      reasons.push("🚨 PILNE: Przejdź na Standard VAT");
    } else {
      reasons.push(`❌ Przekroczono próg KOR`);
      reasons.push("✅ Możesz odliczać BTW z WSZYSTKICH wydatków!");
      if (forecastAnnual > QUARTERLY_THRESHOLD) {
        reasons.push("🗓️ WYMAGANE MIESIĘCZNE deklaracje BTW!");
      }
    }

    const growthRate =
      prevYearTurnover > 0
        ? ((forecastAnnual - prevYearTurnover) / prevYearTurnover) * 100
        : 0;

    if (Math.abs(growthRate) > 5) {
      reasons.push(
        `📈 ${growthRate > 0 ? "Wzrost" : "Spadek"} r/r: ${Math.abs(
          growthRate
        ).toFixed(1)}%`
      );
    }

    setCalculation({
      previous_year_turnover: prevYearTurnover,
      current_year_forecast: forecastAnnual,
      savings_estimate:
        forecastAnnual < KOR_THRESHOLD
          ? forecastAnnual * VAT_RATES.standard
          : 0,
      recommendation:
        forecastAnnual < KOR_THRESHOLD * 0.5
          ? "apply"
          : forecastAnnual < KOR_THRESHOLD
          ? "borderline"
          : "not_applicable",
      reasons,
    });
  }, [invoices, year]);

  return { korStatus, calculation };
}

// ============================================
// HOOK: BTW HEALTH SCORE
// ============================================

export function useBTWHealthScore(userId: string) {
  const { declarations } = useSupabaseBTW(userId);
  const [healthScore, setHealthScore] = useState<BTWHealthScore | null>(null);

  useEffect(() => {
    if (!declarations?.length) {
      setHealthScore({
        overall_score: 100,
        components: {
          compliance: 100,
          accuracy: 100,
          timeliness: 100,
          optimization: 50,
        },
        issues: [
          {
            severity: "info",
            category: "Dane",
            description: "Brak deklaracji do analizy",
            fix_suggestion: "Utwórz pierwszą deklarację BTW",
          },
        ],
        calculated_at: new Date().toISOString(),
      });
      return;
    }

    // Compliance: czy wszystkie deklaracje złożone
    const submitted = declarations.filter(
      (d) => d.status === "submitted" || d.status === "paid"
    );
    const complianceScore =
      declarations.length > 0
        ? (submitted.length / declarations.length) * 100
        : 100;

    // Accuracy: czy bilans się zgadza
    const accuracyScore = declarations.every(
      (d) => Math.abs(d.balance - (d.total_output_vat - d.input_vat)) < 1
    )
      ? 100
      : 70;

    // Timeliness
    const timelinessScore = 90;

    // Optimization: wskaźnik odliczeń
    const totalOutput = declarations.reduce(
      (sum, d) => sum + d.total_output_vat,
      0
    );
    const totalInput = declarations.reduce((sum, d) => sum + d.input_vat, 0);
    const optimizationScore =
      totalOutput > 0 ? Math.min((totalInput / totalOutput) * 100, 100) : 50;

    const overall =
      (complianceScore + accuracyScore + timelinessScore + optimizationScore) /
      4;

    const issues: BTWHealthScore["issues"] = [];
    if (complianceScore < 100) {
      issues.push({
        severity: "critical",
        category: "Compliance",
        description: "Nie wszystkie deklaracje złożone",
        fix_suggestion: "Złóż brakujące deklaracje BTW",
      });
    }
    if (optimizationScore < 30) {
      issues.push({
        severity: "warning",
        category: "Optymalizacja",
        description: "Niski poziom odliczeń VAT",
        fix_suggestion: "Sprawdź czy wszystkie wydatki są zarejestrowane",
      });
    }

    setHealthScore({
      overall_score: Math.round(overall),
      components: {
        compliance: Math.round(complianceScore),
        accuracy: Math.round(accuracyScore),
        timeliness: Math.round(timelinessScore),
        optimization: Math.round(optimizationScore),
      },
      issues,
      calculated_at: new Date().toISOString(),
    });
  }, [declarations]);

  return healthScore;
}

// ============================================
// HOOK: BTW ANALYTICS
// ============================================

export function useBTWAnalytics(
  userId: string,
  startDate: string,
  endDate: string
) {
  const { invoices } = useSupabaseInvoices(userId);
  const { expenses } = useSupabaseExpenses(userId);
  const [analytics, setAnalytics] = useState<BTWAnalytics | null>(null);

  useEffect(() => {
    const periodInvoices = (invoices || []).filter(
      (inv) => inv.invoice_date >= startDate && inv.invoice_date <= endDate
    );

    const periodExpenses = (expenses || []).filter(
      (exp) => exp.date >= startDate && exp.date <= endDate
    );

    // Top kategorie wydatków
    const categoryMap = new Map<string, { amount: number; vat: number }>();
    periodExpenses.forEach((exp) => {
      const category = exp.category || "Inne";
      const existing = categoryMap.get(category) || { amount: 0, vat: 0 };
      categoryMap.set(category, {
        amount: existing.amount + exp.amount,
        vat: existing.vat + exp.vat_amount,
      });
    });

    const totalExpenses = periodExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const topExpenseCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        vat: data.vat,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // KPIs
    const totalRevenue = periodInvoices.reduce(
      (sum, inv) => sum + (inv.total_net || 0),
      0
    );
    const totalVAT = periodInvoices.reduce(
      (sum, inv) => sum + (inv.total_vat || 0),
      0
    );
    const totalDeductible = periodExpenses.reduce(
      (sum, exp) =>
        exp.is_deductible
          ? sum + exp.vat_amount * (exp.deductible_percentage / 100)
          : sum,
      0
    );

    setAnalytics({
      period: { start: startDate, end: endDate, type: "quarterly" },
      top_expense_categories: topExpenseCategories,
      kpis: {
        effective_vat_rate: totalRevenue > 0 ? totalVAT / totalRevenue : 0,
        vat_to_revenue_ratio: totalRevenue > 0 ? totalVAT / totalRevenue : 0,
        deduction_rate: totalVAT > 0 ? totalDeductible / totalVAT : 0,
        average_monthly_vat: totalVAT / 3,
      },
    });
  }, [invoices, expenses, startDate, endDate]);

  return analytics;
}

// ============================================
// HOOK: DEADLINE TRACKING
// ============================================

export function useBTWDeadlines() {
  const [deadlines, setDeadlines] = useState<BTWDeadline[]>([]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const quarters: Array<"Q1" | "Q2" | "Q3" | "Q4"> = ["Q1", "Q2", "Q3", "Q4"];

    const generatedDeadlines: BTWDeadline[] = quarters.map((q, i) => {
      // Deadline: ostatni dzień miesiąca po końcu kwartału
      const deadlineMonth = (i + 1) * 3 + 1;
      let deadlineDate: string;

      if (deadlineMonth > 12) {
        deadlineDate = `${currentYear + 1}-01-31`;
      } else {
        const lastDay = new Date(currentYear, deadlineMonth, 0).getDate();
        deadlineDate = `${currentYear}-${String(deadlineMonth).padStart(
          2,
          "0"
        )}-${lastDay}`;
      }

      const daysRemaining = Math.floor(
        (new Date(deadlineDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let status: BTWDeadline["status"] = "upcoming";
      if (daysRemaining < 0) status = "overdue";
      else if (daysRemaining < 7) status = "due_soon";

      return {
        id: `${currentYear}-${q}`,
        year: currentYear,
        quarter: q,
        declaration_due: deadlineDate,
        payment_due: deadlineDate,
        status,
        days_remaining: daysRemaining,
        penalties: {
          late_filing_fee: status === "overdue" ? 369 : 0,
          late_payment_interest: 0,
          total_penalty: status === "overdue" ? 369 : 0,
        },
      };
    });

    setDeadlines(generatedDeadlines);
  }, []);

  return deadlines;
}
