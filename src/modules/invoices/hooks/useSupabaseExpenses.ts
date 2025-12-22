// =====================================================
// SUPABASE EXPENSES HOOK
// =====================================================
// Manages all expense operations with Supabase
// Replaces useElectronDB for expenses
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import type { Expense, ExpenseReport } from "../types/expenses.js";

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  report: ExpenseReport | null;
  createExpense: (
    data: Omit<Expense, "id" | "created_at" | "updated_at">
  ) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSupabaseExpenses(
  userId: string,
  year?: number,
  month?: number
): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ExpenseReport | null>(null);

  // =====================================================
  // FETCH EXPENSES
  // =====================================================
  const fetchExpenses = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("invoice_expenses")
        .select("*")
        .eq("user_id", userId);

      // Filter by year and month if provided
      if (year && month) {
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
        query = query.gte("date", startDate).lte("date", endDate);
      } else if (year) {
        query = query.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);
      }

      const { data, error: fetchError } = await query.order("date", {
        ascending: false,
      });

      if (fetchError) throw fetchError;

      // Convert database types (string/null) to app types (number/undefined)
      // PostgreSQL NUMERIC returns as string, we need to convert to number
      const typedData: Expense[] = (data || []).map(
        (row: Record<string, unknown>) => ({
          ...row,
          amount:
            typeof row.amount === "string"
              ? parseFloat(row.amount)
              : (row.amount as number) || 0,
          vat_amount:
            typeof row.vat_amount === "string"
              ? parseFloat(row.vat_amount)
              : (row.vat_amount as number) || 0,
        })
      ) as Expense[];

      setExpenses(typedData);
      calculateReport(typedData);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [userId, year, month]);

  // =====================================================
  // CALCULATE REPORT
  // =====================================================
  const calculateReport = (expenseList: Expense[]) => {
    const totalExpenses = expenseList.reduce((sum, exp) => sum + exp.amount, 0);
    const totalVat = expenseList.reduce(
      (sum, exp) => sum + (exp.vat_amount || 0),
      0
    );
    const deductibleExpenses = expenseList
      .filter((exp) => exp.is_deductible)
      .reduce(
        (sum, exp) =>
          sum + (exp.amount * (exp.deductible_percentage || 100)) / 100,
        0
      );

    // Group by category
    const byCategoryMap: Record<string, { count: number; total: number }> = {};
    expenseList.forEach((exp) => {
      if (!byCategoryMap[exp.category]) {
        byCategoryMap[exp.category] = { count: 0, total: 0 };
      }
      byCategoryMap[exp.category].count++;
      byCategoryMap[exp.category].total += exp.amount;
    });

    // Convert to array
    const byCategory = Object.entries(byCategoryMap).map(
      ([category, data]) => ({
        category: category as any, // ExpenseCategory
        amount: data.total,
        count: data.count,
      })
    );

    // Group by month
    const byMonthMap: Record<string, { count: number; total: number }> = {};
    expenseList.forEach((exp) => {
      const month = exp.date.substring(0, 7); // YYYY-MM
      if (!byMonthMap[month]) {
        byMonthMap[month] = { count: 0, total: 0 };
      }
      byMonthMap[month].count++;
      byMonthMap[month].total += exp.amount;
    });

    // Convert to array
    const byMonth = Object.entries(byMonthMap).map(([month, data]) => ({
      month,
      amount: data.total,
      count: data.count,
    }));

    setReport({
      total_expenses: totalExpenses,
      total_vat: totalVat,
      total_deductible: deductibleExpenses,
      by_category: byCategory,
      by_month: byMonth,
    });
  };

  // =====================================================
  // CREATE EXPENSE
  // =====================================================
  const createExpense = async (
    data: Omit<Expense, "id" | "created_at" | "updated_at">
  ): Promise<Expense> => {
    try {
      setError(null);

      const { data: expense, error: createError } = await supabase
        .from("invoice_expenses")
        .insert({
          ...data,
          user_id: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchExpenses();
      // Type assertion for database -> app types
      return expense as unknown as Expense;
    } catch (err) {
      console.error("Error creating expense:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create expense";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // UPDATE EXPENSE
  // =====================================================
  const updateExpense = async (
    id: string,
    updates: Partial<Expense>
  ): Promise<void> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from("invoice_expenses")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchExpenses();
    } catch (err) {
      console.error("Error updating expense:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update expense";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // DELETE EXPENSE
  // =====================================================
  const deleteExpense = async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("invoice_expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      await fetchExpenses();
    } catch (err) {
      console.error("Error deleting expense:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete expense";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // REFETCH
  // =====================================================
  const refetch = async () => {
    await fetchExpenses();
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    report,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch,
  };
}
