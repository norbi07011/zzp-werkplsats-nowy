// =====================================================
// KILOMETERS - TypeScript Types
// =====================================================
// Kilometer tracking for tax deductions (Netherlands 2025)
// Aligned with invoice_kilometer_entries table
// UPDATED: Now uses vehicle_id to reference vehicles table
// =====================================================

export type TripType = "BUSINESS" | "COMMUTE" | "PRIVATE";

// =====================================================
// KILOMETER ENTRY
// =====================================================
export interface KilometerEntry {
  id: string;
  user_id: string;

  // Trip info
  date: string; // ISO date string
  start_location: string;
  end_location: string;
  purpose: string;
  kilometers: number;
  trip_type: TripType; // BUSINESS (Zakelijk) / COMMUTE (Woon-werk) / PRIVATE (Privé)

  // Vehicle info (NEW: references vehicles table)
  vehicle_id?: string; // Link to vehicles table
  vehicle_type: "car" | "bike" | "motorcycle" | "scooter" | "electric_bike"; // All vehicle types
  is_private_vehicle: boolean; // DEPRECATED: use vehicle.is_company_vehicle

  // Rate (NL 2025)
  rate: number; // €/km
  amount: number; // kilometers * rate

  // Client/Project reference
  client_id?: string;
  project_id?: string;

  // Notes
  notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// KILOMETER RATES (Netherlands 2025)
// =====================================================
export interface KilometerRates {
  car_company: number; // Company car: €0.23/km
  car_private: number; // Private car: €0.19/km
  bike: number; // Bike: €0.27/km
  motorcycle: number; // Motorcycle: €0.21/km
}

export const KILOMETER_RATES_2025: KilometerRates = {
  car_company: 0.23,
  car_private: 0.19,
  bike: 0.27,
  motorcycle: 0.21,
};

// Helper function to get rate
export function getKilometerRate(
  vehicleType: "car" | "bike" | "motorcycle",
  isPrivateVehicle: boolean
): number {
  if (vehicleType === "car") {
    return isPrivateVehicle
      ? KILOMETER_RATES_2025.car_private
      : KILOMETER_RATES_2025.car_company;
  }
  if (vehicleType === "bike") {
    return KILOMETER_RATES_2025.bike;
  }
  if (vehicleType === "motorcycle") {
    return KILOMETER_RATES_2025.motorcycle;
  }
  return 0;
}

// =====================================================
// KILOMETER REPORT
// =====================================================
export interface KilometerReport {
  year: number;
  total_kilometers: number;
  total_amount: number;
  tax_free_limit: number; // €3000 in Netherlands
  amount_exceeding_limit: number;

  by_vehicle_type: {
    vehicle_type: "car" | "bike" | "motorcycle";
    kilometers: number;
    amount: number;
    trips: number;
  }[];

  by_client: {
    client_id: string;
    client_name: string;
    kilometers: number;
    amount: number;
    trips: number;
  }[];

  by_month: {
    month: string; // YYYY-MM
    kilometers: number;
    amount: number;
    trips: number;
  }[];
}

// =====================================================
// TAX-FREE LIMIT (Netherlands)
// =====================================================
export const TAX_FREE_LIMIT_NL = 3000; // €3000 per year
