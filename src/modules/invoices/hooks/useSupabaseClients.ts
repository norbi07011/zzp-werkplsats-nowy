// =====================================================
// SUPABASE CLIENTS HOOK
// =====================================================
// Manages all client operations with Supabase
// Replaces useElectronDB for clients
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import type { Client } from "../types/index.js";

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  createClient: (
    data: Omit<Client, "id" | "created_at" | "updated_at">
  ) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSupabaseClients(userId: string): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH ALL CLIENTS
  // =====================================================
  const fetchClients = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("invoice_clients")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      // Type assertion: database types (null) -> app types (undefined)
      setClients((data as unknown as Client[]) || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // =====================================================
  // CREATE CLIENT
  // =====================================================
  const createClient = async (
    data: Omit<Client, "id" | "created_at" | "updated_at">
  ): Promise<Client> => {
    try {
      setError(null);

      const { data: client, error: createError } = await supabase
        .from("invoice_clients")
        .insert({
          ...data,
          user_id: userId,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchClients();
      // Type assertion for database -> app types
      return client as unknown as Client;
    } catch (err) {
      console.error("Error creating client:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create client";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // UPDATE CLIENT
  // =====================================================
  const updateClient = async (
    id: string,
    updates: Partial<Client>
  ): Promise<void> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from("invoice_clients")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchClients();
    } catch (err) {
      console.error("Error updating client:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update client";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // DELETE CLIENT
  // =====================================================
  const deleteClient = async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("invoice_clients")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      await fetchClients();
    } catch (err) {
      console.error("Error deleting client:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete client";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // REFETCH
  // =====================================================
  const refetch = async () => {
    await fetchClients();
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refetch,
  };
}
