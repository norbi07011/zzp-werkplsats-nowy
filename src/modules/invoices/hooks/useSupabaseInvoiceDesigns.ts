// =====================================================
// SUPABASE INVOICE DESIGNS HOOK
// =====================================================
// Manages all template operations with Supabase
// Replaces localStorage for template persistence
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import type {
  InvoiceDesign,
  CreateInvoiceDesignData,
  UpdateInvoiceDesignData,
} from "../types/InvoiceDesign";

interface UseInvoiceDesignsReturn {
  designs: InvoiceDesign[];
  loading: boolean;
  error: string | null;
  createDesign: (data: CreateInvoiceDesignData) => Promise<InvoiceDesign>;
  updateDesign: (id: string, data: UpdateInvoiceDesignData) => Promise<void>;
  deleteDesign: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSupabaseInvoiceDesigns(
  userId: string
): UseInvoiceDesignsReturn {
  const [designs, setDesigns] = useState<InvoiceDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH ALL DESIGNS
  // =====================================================
  const fetchDesigns = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("invoice_designs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Type assertion: database types -> app types
      setDesigns((data as unknown as InvoiceDesign[]) || []);
    } catch (err) {
      console.error("Error fetching designs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch designs");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // =====================================================
  // CREATE DESIGN
  // =====================================================
  const createDesign = async (
    data: CreateInvoiceDesignData
  ): Promise<InvoiceDesign> => {
    try {
      setError(null);

      // CRITICAL: Remove any id field to let database generate new UUID
      // Also remove fields that should not be copied from templates
      const {
        id: _id,
        created_at: _createdAt,
        updated_at: _updatedAt,
        ...cleanData
      } = data as any;

      console.log("[createDesign] Inserting new design:", {
        name: cleanData.name,
        type: cleanData.type,
      });

      const { data: design, error: createError } = await supabase
        .from("invoice_designs")
        .insert({
          ...cleanData,
          user_id: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchDesigns();
      // Type assertion for database -> app types
      return design as unknown as InvoiceDesign;
    } catch (err) {
      console.error("Error creating design:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create design";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // UPDATE DESIGN
  // =====================================================
  const updateDesign = async (
    id: string,
    updates: UpdateInvoiceDesignData
  ): Promise<void> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from("invoice_designs")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchDesigns();
    } catch (err) {
      console.error("Error updating design:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update design";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // DELETE DESIGN
  // =====================================================
  const deleteDesign = async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("invoice_designs")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      await fetchDesigns();
    } catch (err) {
      console.error("Error deleting design:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete design";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // REFETCH
  // =====================================================
  const refetch = async () => {
    await fetchDesigns();
  };

  // =====================================================
  // INITIAL LOAD + REAL-TIME SUBSCRIPTION
  // =====================================================
  useEffect(() => {
    fetchDesigns();

    // Real-time subscription for changes
    const subscription = supabase
      .channel("invoice_designs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoice_designs",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          console.log("Design changed, refetching...");
          fetchDesigns();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDesigns, userId]);

  return {
    designs,
    loading,
    error,
    createDesign,
    updateDesign,
    deleteDesign,
    refetch,
  };
}
