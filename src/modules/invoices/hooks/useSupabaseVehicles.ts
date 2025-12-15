import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import type { Vehicle } from "../types";
import { getVehicleRate } from "../types";

interface UseVehiclesReturn {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  defaultVehicle: Vehicle | null;
  createVehicle: (vehicle: Partial<Vehicle>) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  setDefaultVehicle: (id: string) => Promise<void>;
  refreshVehicles: () => Promise<void>;
}

export function useSupabaseVehicles(userId: string): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultVehicle =
    vehicles.find((v) => v.is_default) || vehicles[0] || null;

  // Fetch vehicles
  const fetchVehicles = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("invoice_vehicles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const typedData = (data || []) as unknown as Vehicle[];
      setVehicles(typedData);

      // AUTO-CREATE DEFAULT VEHICLE if none exists
      if (typedData.length === 0 && userId) {
        console.log(
          "🚗 [AUTO-CREATE] No vehicles found, creating default vehicle..."
        );
        await createDefaultVehicle(userId);
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  // AUTO-CREATE DEFAULT VEHICLE
  const createDefaultVehicle = async (userId: string) => {
    try {
      const defaultVehicleData = {
        user_id: userId,
        name: "Mój Samochód",
        brand: "Generyczny",
        model: "Samochód Służbowy",
        vehicle_type: "car" as const,
        license_plate: "XX-00-XX",
        registration_year: new Date().getFullYear(),
        registration_country: "NL",
        fuel_type: "benzyna",
        current_odometer: 0,
        is_company_vehicle: true,
        custom_rate_per_km: null,
        is_active: true,
        is_default: true,
        notes: "Automatycznie utworzony pojazd - edytuj w ustawieniach",
      };

      const { error: insertError } = await supabase
        .from("invoice_vehicles")
        .insert([defaultVehicleData]);

      if (insertError) throw insertError;

      console.log("✅ [AUTO-CREATE] Default vehicle created successfully");
      await fetchVehicles(); // Refresh after creation
    } catch (err) {
      console.error("❌ [AUTO-CREATE] Failed to create default vehicle:", err);
    }
  };

  // Create vehicle
  const createVehicle = async (vehicle: Partial<Vehicle>) => {
    if (!userId) return;

    try {
      const rate =
        vehicle.custom_rate_per_km ||
        (vehicle.vehicle_type
          ? vehicle.vehicle_type === "car"
            ? vehicle.is_company_vehicle
              ? 0.23
              : 0.19
            : vehicle.vehicle_type === "motorcycle"
            ? 0.21
            : 0.27
          : 0.19);

      const newVehicle = {
        user_id: userId,
        name: vehicle.name || "Nowy pojazd",
        brand: vehicle.brand,
        model: vehicle.model,
        vehicle_type: vehicle.vehicle_type || "car",
        license_plate: vehicle.license_plate,
        registration_year: vehicle.registration_year,
        registration_country: vehicle.registration_country || "NL",
        fuel_type: vehicle.fuel_type,
        current_odometer: vehicle.current_odometer || 0,
        is_company_vehicle: vehicle.is_company_vehicle || false,
        custom_rate_per_km: vehicle.custom_rate_per_km,
        is_active: true,
        is_default: vehicles.length === 0, // First vehicle is default
        notes: vehicle.notes,
      };

      const { error: insertError } = await supabase
        .from("invoice_vehicles")
        .insert([newVehicle]);

      if (insertError) throw insertError;

      await fetchVehicles();
    } catch (err) {
      console.error("Error creating vehicle:", err);
      throw err;
    }
  };

  // Update vehicle
  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const { error: updateError } = await supabase
        .from("invoice_vehicles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchVehicles();
    } catch (err) {
      console.error("Error updating vehicle:", err);
      throw err;
    }
  };

  // Delete vehicle
  const deleteVehicle = async (id: string) => {
    try {
      // Soft delete: set is_active to false
      const { error: deleteError } = await supabase
        .from("invoice_vehicles")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      await fetchVehicles();
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      throw err;
    }
  };

  // Set default vehicle
  const setDefaultVehicle = async (id: string) => {
    try {
      // Trigger will handle unsetting other defaults
      const { error: updateError } = await supabase
        .from("invoice_vehicles")
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await fetchVehicles();
    } catch (err) {
      console.error("Error setting default vehicle:", err);
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchVehicles();
  }, [userId]);

  return {
    vehicles,
    loading,
    error,
    defaultVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    setDefaultVehicle,
    refreshVehicles: fetchVehicles,
  };
}
