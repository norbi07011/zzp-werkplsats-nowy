// =====================================================
// SUPABASE KILOMETERS HOOK
// =====================================================
// Manages kilometer tracking with Supabase
// Replaces useElectronDB for kilometers
// =====================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import type {
  KilometerEntry,
  KilometerReport,
  VehicleType,
} from "../types/kilometers.js";
import {
  getKilometerRate,
  KILOMETER_RATES_2025,
  TAX_FREE_LIMIT_NL,
} from "../types/kilometers.js";

interface UseKilometersReturn {
  entries: KilometerEntry[];
  loading: boolean;
  error: string | null;
  report: KilometerReport | null;
  createEntry: (
    data: Omit<
      KilometerEntry,
      "id" | "user_id" | "created_at" | "updated_at" | "rate" | "amount"
    > & { custom_rate?: number }
  ) => Promise<KilometerEntry>;
  updateEntry: (
    id: string,
    data: Partial<KilometerEntry> & { custom_rate?: number }
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSupabaseKilometers(
  userId: string,
  year?: number,
  month?: number
): UseKilometersReturn {
  const [entries, setEntries] = useState<KilometerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<KilometerReport | null>(null);

  // =====================================================
  // FETCH ENTRIES
  // =====================================================
  const fetchEntries = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("invoice_kilometer_entries")
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

      // Type assertion: database types (null) -> app types (undefined)
      const typedData = data as unknown as KilometerEntry[];
      setEntries(typedData || []);
      calculateReport(typedData || []);
    } catch (err) {
      console.error("Error fetching kilometers:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch kilometers"
      );
    } finally {
      setLoading(false);
    }
  }, [userId, year, month]);

  // =====================================================
  // CALCULATE REPORT
  // =====================================================
  const calculateReport = (entryList: KilometerEntry[]) => {
    const totalKilometers = entryList.reduce(
      (sum, entry) => sum + entry.kilometers,
      0
    );
    const totalAmount = entryList.reduce((sum, entry) => sum + entry.amount, 0);

    // Determine year from entries
    const reportYear =
      year ||
      (entryList.length > 0
        ? new Date(entryList[0].date).getFullYear()
        : new Date().getFullYear());

    // By vehicle type
    const byVehicleMap: Record<
      string,
      { kilometers: number; amount: number; count: number }
    > = {};
    entryList.forEach((entry) => {
      if (!byVehicleMap[entry.vehicle_type]) {
        byVehicleMap[entry.vehicle_type] = {
          kilometers: 0,
          amount: 0,
          count: 0,
        };
      }
      byVehicleMap[entry.vehicle_type].kilometers += entry.kilometers;
      byVehicleMap[entry.vehicle_type].amount += entry.amount;
      byVehicleMap[entry.vehicle_type].count++;
    });

    const byVehicle = Object.entries(byVehicleMap).map(([type, data]) => ({
      vehicle_type: type as VehicleType,
      kilometers: data.kilometers,
      amount: data.amount,
      trips: data.count,
    }));

    // By client
    const byClientMap: Record<
      string,
      { kilometers: number; amount: number; count: number }
    > = {};
    entryList.forEach((entry) => {
      if (!entry.client_id) return;
      if (!byClientMap[entry.client_id]) {
        byClientMap[entry.client_id] = { kilometers: 0, amount: 0, count: 0 };
      }
      byClientMap[entry.client_id].kilometers += entry.kilometers;
      byClientMap[entry.client_id].amount += entry.amount;
      byClientMap[entry.client_id].count++;
    });

    const byClient = Object.entries(byClientMap).map(([clientId, data]) => ({
      client_id: clientId,
      client_name: "", // Will be populated by UI component via join
      kilometers: data.kilometers,
      amount: data.amount,
      trips: data.count,
    }));

    // By month
    const byMonthMap: Record<
      string,
      { kilometers: number; amount: number; count: number }
    > = {};
    entryList.forEach((entry) => {
      const month = entry.date.substring(0, 7); // YYYY-MM
      if (!byMonthMap[month]) {
        byMonthMap[month] = { kilometers: 0, amount: 0, count: 0 };
      }
      byMonthMap[month].kilometers += entry.kilometers;
      byMonthMap[month].amount += entry.amount;
      byMonthMap[month].count++;
    });

    const byMonth = Object.entries(byMonthMap).map(([month, data]) => ({
      month,
      kilometers: data.kilometers,
      amount: data.amount,
      trips: data.count,
    }));

    setReport({
      year: reportYear,
      total_kilometers: totalKilometers,
      total_amount: totalAmount,
      tax_free_limit: TAX_FREE_LIMIT_NL,
      amount_exceeding_limit: Math.max(0, totalAmount - TAX_FREE_LIMIT_NL),
      by_vehicle_type: byVehicle,
      by_client: byClient,
      by_month: byMonth,
    });
  };

  // =====================================================
  // CREATE ENTRY
  // =====================================================
  const createEntry = async (
    data: Omit<
      KilometerEntry,
      "id" | "user_id" | "created_at" | "updated_at" | "rate" | "amount"
    > & { custom_rate?: number } // Optional custom rate from vehicle
  ): Promise<KilometerEntry> => {
    try {
      setError(null);

      // Use custom rate if provided (from vehicle), otherwise calculate default
      const { custom_rate, ...entryData } = data;
      const rate =
        custom_rate ??
        getKilometerRate(data.vehicle_type, data.is_private_vehicle);
      const amount = data.kilometers * rate;

      const { data: entry, error: createError } = await supabase
        .from("invoice_kilometer_entries")
        .insert({
          ...entryData,
          user_id: userId,
          rate,
          amount,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchEntries();
      // Type assertion for database -> app types
      return entry as unknown as KilometerEntry;
    } catch (err) {
      console.error("Error creating kilometer entry:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create kilometer entry";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // UPDATE ENTRY
  // =====================================================
  const updateEntry = async (
    id: string,
    updates: Partial<KilometerEntry>
  ): Promise<void> => {
    try {
      setError(null);

      // Find current entry
      const current = entries.find((e) => e.id === id);
      if (!current) throw new Error("Entry not found");

      // Extract custom_rate from updates (it's only for calculation, not for saving)
      const { custom_rate: customRate, ...updateData } = updates as any;

      // Recalculate if vehicle type, kilometers, is_private_vehicle, or custom_rate changed
      let calculated = {};
      if (
        updates.vehicle_type !== undefined ||
        updates.kilometers !== undefined ||
        updates.is_private_vehicle !== undefined ||
        customRate !== undefined
      ) {
        const vehicleType = updates.vehicle_type ?? current.vehicle_type;
        const isPrivate =
          updates.is_private_vehicle ?? current.is_private_vehicle;
        const kilometers = updates.kilometers ?? current.kilometers;

        // Use custom rate if provided (from vehicle), otherwise calculate default
        const rate = customRate ?? getKilometerRate(vehicleType, isPrivate);
        const amount = kilometers * rate;

        calculated = { rate, amount };
      }

      const { error: updateError } = await supabase
        .from("invoice_kilometer_entries")
        .update({
          ...updateData,
          ...calculated,
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchEntries();
    } catch (err) {
      console.error("Error updating kilometer entry:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update kilometer entry";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // DELETE ENTRY
  // =====================================================
  const deleteEntry = async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("invoice_kilometer_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      await fetchEntries();
    } catch (err) {
      console.error("Error deleting kilometer entry:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete kilometer entry";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // =====================================================
  // REFETCH
  // =====================================================
  const refetch = async () => {
    await fetchEntries();
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    report,
    createEntry,
    updateEntry,
    deleteEntry,
    refetch,
  };
}
