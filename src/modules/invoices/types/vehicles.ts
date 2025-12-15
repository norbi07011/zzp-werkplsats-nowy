// =====================================================
// VEHICLES - TypeScript Types
// =====================================================
// Multi-vehicle management for kilometer tracking
// =====================================================

export type VehicleType =
  | "car"
  | "motorcycle"
  | "bike"
  | "scooter"
  | "electric_bike";
export type FuelType =
  | "petrol"
  | "diesel"
  | "electric"
  | "hybrid"
  | "lpg"
  | "none";

// =====================================================
// VEHICLE
// =====================================================
export interface Vehicle {
  id: string;
  user_id: string;

  // Basic info
  name: string; // e.g. "Mercedes Sprinter", "Honda CBR", "Gazelle E-bike"
  brand?: string;
  model?: string;
  vehicle_type: VehicleType;

  // Registration
  license_plate?: string; // NL format: XX-123-YY
  registration_year?: number;
  registration_country: string; // Default: "NL"

  // Technical
  fuel_type?: FuelType;
  current_odometer: number; // Current km reading
  is_company_vehicle: boolean; // false = private, true = company

  // Tax rate (overrides default if set)
  custom_rate_per_km?: number; // Optional custom rate, otherwise use defaults

  // Status
  is_active: boolean; // Active vehicles shown in trip form
  is_default: boolean; // Default selected vehicle

  // Notes
  notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// VEHICLE KILOMETER RATES (Netherlands 2025)
// =====================================================
// Source: Belastingdienst + NIBUD 2025
export interface VehicleRates {
  car_company: number; // €0.23/km (zakelijke auto)
  car_private: number; // €0.19/km (privé auto)
  motorcycle: number; // €0.21/km (motor)
  bike: number; // €0.27/km (fiets)
  electric_bike: number; // €0.27/km (e-bike, zelfde als fiets)
  scooter: number; // €0.21/km (scooter)
}

export const DUTCH_RATES_2025: VehicleRates = {
  car_company: 0.23,
  car_private: 0.19,
  motorcycle: 0.21,
  bike: 0.27,
  electric_bike: 0.27,
  scooter: 0.21,
};

// Helper: Get rate for vehicle
export function getVehicleRate(vehicle: Vehicle): number {
  // Custom rate has priority
  if (vehicle.custom_rate_per_km) {
    return vehicle.custom_rate_per_km;
  }

  // Auto/Car
  if (vehicle.vehicle_type === "car") {
    return vehicle.is_company_vehicle
      ? DUTCH_RATES_2025.car_company
      : DUTCH_RATES_2025.car_private;
  }

  // Motor
  if (vehicle.vehicle_type === "motorcycle") {
    return DUTCH_RATES_2025.motorcycle;
  }

  // Fiets/Bike
  if (vehicle.vehicle_type === "bike") {
    return DUTCH_RATES_2025.bike;
  }

  // E-bike
  if (vehicle.vehicle_type === "electric_bike") {
    return DUTCH_RATES_2025.electric_bike;
  }

  // Scooter
  if (vehicle.vehicle_type === "scooter") {
    return DUTCH_RATES_2025.scooter;
  }

  return 0;
}

// Helper: Format license plate (NL standard)
export function formatDutchPlate(plate: string): string {
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // NL formats: XX-99-99, 99-XX-99, 99-99-XX, XX-99-XX, 99-XX-XX, XX-XX-99
  if (clean.length >= 6) {
    const part1 = clean.substring(0, 2);
    const part2 = clean.substring(2, 4);
    const part3 = clean.substring(4, 6);
    return `${part1}-${part2}-${part3}`;
  }

  return clean;
}

// =====================================================
// VEHICLE STATISTICS
// =====================================================
export interface VehicleStats {
  vehicle_id: string;
  vehicle_name: string;
  total_trips: number;
  total_kilometers: number;
  total_amount: number; // €
  business_km: number;
  commute_km: number;
  private_km: number;
  avg_trip_distance: number;
  last_trip_date?: string;
}
