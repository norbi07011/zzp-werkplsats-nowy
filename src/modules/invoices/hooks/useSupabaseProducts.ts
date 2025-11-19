// =====================================================
// SUPABASE PRODUCTS HOOK
// =====================================================
// Manages all product/service operations with Supabase
// Replaces useElectronDB for products
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import type { Product } from "../types/index.js";

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  createProduct: (
    data: Omit<Product, "id" | "created_at" | "updated_at">
  ) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSupabaseProducts(userId: string): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH ALL PRODUCTS
  // =====================================================
  const fetchProducts = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("invoice_products")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // =====================================================
  // CREATE PRODUCT
  // =====================================================
  const createProduct = async (
    data: Omit<Product, "id" | "created_at" | "updated_at">
  ): Promise<Product> => {
    try {
      setError(null);

      const { data: product, error: createError } = await supabase
        .from("invoice_products")
        .insert({
          ...data,
          user_id: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchProducts();
      return product;
    } catch (err) {
      console.error("Error creating product:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create product";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // UPDATE PRODUCT
  // =====================================================
  const updateProduct = async (
    id: string,
    updates: Partial<Product>
  ): Promise<void> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from("invoice_products")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchProducts();
    } catch (err) {
      console.error("Error updating product:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update product";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================
  const deleteProduct = async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("invoice_products")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete product";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // REFETCH
  // =====================================================
  const refetch = async () => {
    await fetchProducts();
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
  };
}
