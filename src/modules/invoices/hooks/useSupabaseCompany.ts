// =====================================================
// SUPABASE COMPANY HOOK
// =====================================================
// Manages company profile (1 per user)
// Replaces useElectronDB for company settings
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import type { Company } from "../types/index.js";

interface UseCompanyReturn {
  company: Company | null;
  loading: boolean;
  error: string | null;
  updateCompany: (data: Partial<Company>) => Promise<void>;
  createCompany: (
    data: Omit<Company, "id" | "user_id" | "created_at" | "updated_at">
  ) => Promise<Company>;
  refetch: () => Promise<void>;
}

export function useSupabaseCompany(userId: string): UseCompanyReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH COMPANY
  // =====================================================
  const fetchCompany = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("invoice_companies")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setCompany(data);
    } catch (err) {
      console.error("Error fetching company:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch company");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // =====================================================
  // CREATE COMPANY
  // =====================================================
  const createCompany = async (
    data: Omit<Company, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<Company> => {
    try {
      setError(null);

      const { data: newCompany, error: createError } = await supabase
        .from("invoice_companies")
        .insert({
          ...data,
          user_id: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchCompany();
      return newCompany;
    } catch (err) {
      console.error("Error creating company:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create company";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // UPDATE COMPANY
  // =====================================================
  const updateCompany = async (updates: Partial<Company>): Promise<void> => {
    try {
      setError(null);

      if (!company) {
        throw new Error("No company profile exists. Create one first.");
      }

      const { error: updateError } = await supabase
        .from("invoice_companies")
        .update(updates)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchCompany();
    } catch (err) {
      console.error("Error updating company:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update company";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // REFETCH
  // =====================================================
  const refetch = async () => {
    await fetchCompany();
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return {
    company,
    loading,
    error,
    updateCompany,
    createCompany,
    refetch,
  };
}
