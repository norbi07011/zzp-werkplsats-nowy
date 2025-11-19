// =====================================================
// SUPABASE BTW DECLARATIONS HOOK
// =====================================================
// Manages quarterly BTW/VAT declarations with Supabase
// Replaces useElectronDB for BTW declarations
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import type {
  BTWDeclaration,
  BTWPeriod,
  BTWCalculationData,
} from "../types/btw.js";
import { BTW_RATES } from "../types/btw.js";

interface UseBTWReturn {
  declarations: BTWDeclaration[];
  loading: boolean;
  error: string | null;
  createDeclaration: (
    data: Omit<
      BTWDeclaration,
      | "id"
      | "user_id"
      | "created_at"
      | "updated_at"
      | "output_vat_21"
      | "output_vat_9"
      | "total_output_vat"
      | "balance"
    >
  ) => Promise<BTWDeclaration>;
  updateDeclaration: (
    id: string,
    data: Partial<BTWDeclaration>
  ) => Promise<void>;
  deleteDeclaration: (id: string) => Promise<void>;
  calculateBTW: (data: {
    revenue_21: number;
    revenue_9: number;
    input_vat: number;
  }) => {
    output_vat_21: number;
    output_vat_9: number;
    total_output_vat: number;
    balance: number;
  };
  refetch: () => Promise<void>;
}

export function useSupabaseBTW(userId: string, year?: number): UseBTWReturn {
  const [declarations, setDeclarations] = useState<BTWDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH DECLARATIONS
  // =====================================================
  const fetchDeclarations = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("invoice_btw_declarations")
        .select("*")
        .eq("user_id", userId);

      if (year) {
        query = query.eq("year", year);
      }

      const { data, error: fetchError } = await query
        .order("year", { ascending: false })
        .order("quarter", { ascending: false });

      if (fetchError) throw fetchError;

      setDeclarations(data || []);
    } catch (err) {
      console.error("Error fetching BTW declarations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch BTW declarations"
      );
    } finally {
      setLoading(false);
    }
  }, [userId, year]);

  // =====================================================
  // CALCULATE BTW
  // =====================================================
  const calculateBTW = (data: {
    revenue_21: number;
    revenue_9: number;
    input_vat: number;
  }) => {
    const output_vat_21 = data.revenue_21 * (BTW_RATES.HIGH / 100);
    const output_vat_9 = data.revenue_9 * (BTW_RATES.LOW / 100);
    const total_output_vat = output_vat_21 + output_vat_9;
    const balance = total_output_vat - data.input_vat;

    return {
      output_vat_21,
      output_vat_9,
      total_output_vat,
      balance,
    };
  };

  // =====================================================
  // CREATE DECLARATION
  // =====================================================
  const createDeclaration = async (
    data: Omit<
      BTWDeclaration,
      | "id"
      | "user_id"
      | "created_at"
      | "updated_at"
      | "output_vat_21"
      | "output_vat_9"
      | "total_output_vat"
      | "balance"
    >
  ): Promise<BTWDeclaration> => {
    try {
      setError(null);

      // Calculate BTW amounts
      const calculated = calculateBTW({
        revenue_21: data.revenue_21,
        revenue_9: data.revenue_9,
        input_vat: data.input_vat,
      });

      const { data: declaration, error: createError } = await supabase
        .from("invoice_btw_declarations")
        .insert({
          ...data,
          ...calculated,
          user_id: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchDeclarations();
      return declaration;
    } catch (err) {
      console.error("Error creating BTW declaration:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create BTW declaration";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // UPDATE DECLARATION
  // =====================================================
  const updateDeclaration = async (
    id: string,
    updates: Partial<BTWDeclaration>
  ): Promise<void> => {
    try {
      setError(null);

      // Find current declaration
      const current = declarations.find((d) => d.id === id);
      if (!current) throw new Error("Declaration not found");

      // Recalculate if revenue or input_vat changed
      let calculated = {};
      if (
        updates.revenue_21 !== undefined ||
        updates.revenue_9 !== undefined ||
        updates.input_vat !== undefined
      ) {
        calculated = calculateBTW({
          revenue_21: updates.revenue_21 ?? current.revenue_21,
          revenue_9: updates.revenue_9 ?? current.revenue_9,
          input_vat: updates.input_vat ?? current.input_vat,
        });
      }

      const { error: updateError } = await supabase
        .from("invoice_btw_declarations")
        .update({
          ...updates,
          ...calculated,
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchDeclarations();
    } catch (err) {
      console.error("Error updating BTW declaration:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update BTW declaration";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // DELETE DECLARATION
  // =====================================================
  const deleteDeclaration = async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("invoice_btw_declarations")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      await fetchDeclarations();
    } catch (err) {
      console.error("Error deleting BTW declaration:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete BTW declaration";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // REFETCH
  // =====================================================
  const refetch = async () => {
    await fetchDeclarations();
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  return {
    declarations,
    loading,
    error,
    createDeclaration,
    updateDeclaration,
    deleteDeclaration,
    calculateBTW,
    refetch,
  };
}
