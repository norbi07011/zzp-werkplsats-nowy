import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useSupabaseKilometers, useSupabaseVehicles } from "../hooks";
import type { KilometerEntry, TripType, Vehicle } from "../types";
import { Modal } from "../components/Modal";
import { VehicleManager } from "../components/VehicleManager";
import { PageLoader } from "../components/PageLoader";
import { TruckAnimation } from "../components/TruckAnimation";
import { VehicleAnimation } from "../components/VehicleAnimations";
import { TiltCard } from "../components/TiltCard";
// Import icons from lucide-react (React 18+ style)
import Plus from "lucide-react/dist/esm/icons/plus";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Navigation from "lucide-react/dist/esm/icons/navigation";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import Gauge from "lucide-react/dist/esm/icons/gauge";
import Fuel from "lucide-react/dist/esm/icons/fuel";
import History from "lucide-react/dist/esm/icons/history";
import Settings from "lucide-react/dist/esm/icons/settings";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Save from "lucide-react/dist/esm/icons/save";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Edit3 from "lucide-react/dist/esm/icons/edit-3";
import Filter from "lucide-react/dist/esm/icons/filter";
import X from "lucide-react/dist/esm/icons/x";
import Download from "lucide-react/dist/esm/icons/download";
import Car from "lucide-react/dist/esm/icons/car";
import FileText from "lucide-react/dist/esm/icons/file-text";
import BarChart from "lucide-react/dist/esm/icons/bar-chart";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import Bike from "lucide-react/dist/esm/icons/bike";
import Zap from "lucide-react/dist/esm/icons/zap";
import User from "lucide-react/dist/esm/icons/user";
import Check from "lucide-react/dist/esm/icons/check";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
const CheckCircle2 = CheckCircle; // Alias for compatibility

// --- Constants & Dutch Tax Rules ---

const TRIP_TYPES = [
  {
    id: "BUSINESS",
    label: "Zakelijk (Biznes)",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  {
    id: "COMMUTE",
    label: "Woon-werk (Dojazd)",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  {
    id: "PRIVATE",
    label: "Privé (Prywatne)",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
];

// --- Components imported from ../components/ ---
// PageLoader, TruckAnimation, TiltCard are now imported from separate files

interface KilometersProps {
  onNavigate?: (page: string) => void;
}

export const Kilometers: React.FC<KilometersProps> = ({ onNavigate }) => {
  console.log(
    "🚗 [KILOMETERS] Component rendering - NEW VERSION with VehicleManager!"
  );
  const { user } = useAuth();
  const {
    entries: trips,
    loading: isLoading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useSupabaseKilometers(user?.id || "");

  // Vehicles hook (NEW!)
  const {
    vehicles,
    loading: vehiclesLoading,
    defaultVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    setDefaultVehicle,
  } = useSupabaseVehicles(user?.id || "");

  console.log(
    "🚗 [VEHICLES HOOK] vehicles:",
    vehicles.length,
    "default:",
    defaultVehicle?.name || "BRAK"
  );

  // Modal States
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceCalculated, setDistanceCalculated] = useState<{
    km: number;
    from: string;
    to: string;
  } | null>(null);

  // Filter State
  const [filterType, setFilterType] = useState<
    "ALL" | "BUSINESS" | "COMMUTE" | "PRIVATE"
  >("ALL");

  // NEW: Quarterly Reports + Annual Export + NIBUD Calculator
  const [showQuarterlyReports, setShowQuarterlyReports] = useState(false);
  const [showNIBUDCalculator, setShowNIBUDCalculator] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterByYear, setFilterByYear] = useState(true); // NEW: Filter trips by year

  // NEW: Selected Vehicle for viewing history (separate from default)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );
  const [showAllVehicles, setShowAllVehicles] = useState(false); // Show combined stats or per-vehicle

  // Set selected vehicle to default when available
  useEffect(() => {
    if (defaultVehicle && !selectedVehicleId) {
      setSelectedVehicleId(defaultVehicle.id);
    }
  }, [defaultVehicle, selectedVehicleId]);

  // Currently selected vehicle for viewing
  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || defaultVehicle;

  // Forms - rozbudowany o vehicle_id i dynamiczne stawki
  const [tripForm, setTripForm] = useState({
    date: new Date().toISOString().split("T")[0],
    from: "",
    to: "",
    distance: 0,
    type: "BUSINESS",
    startOdo: defaultVehicle?.current_odometer || 0,
    endOdo: defaultVehicle?.current_odometer || 0,
    calcMethod: "ODOMETER", // 'ODOMETER' or 'MANUAL'
    purpose: "",
    notes: "",
    vehicleId: defaultVehicle?.id || "", // NEW: Powiązanie z pojazdem
  });

  // Oblicz aktualną stawkę na podstawie wybranego pojazdu
  const currentVehicle =
    vehicles.find((v) => v.id === tripForm.vehicleId) || defaultVehicle;
  const currentRate =
    currentVehicle?.custom_rate_per_km ||
    (currentVehicle?.vehicle_type === "bike" ||
    currentVehicle?.vehicle_type === "electric_bike"
      ? 0.27
      : currentVehicle?.vehicle_type === "motorcycle" ||
        currentVehicle?.vehicle_type === "scooter"
      ? 0.21
      : currentVehicle?.is_company_vehicle
      ? 0.23
      : 0.19);

  // --- Effects ---
  // Auto-calculate distance when odometers change in trip form
  useEffect(() => {
    if (tripForm.calcMethod === "ODOMETER") {
      const dist = tripForm.endOdo - tripForm.startOdo;
      setTripForm((prev) => ({ ...prev, distance: dist > 0 ? dist : 0 }));
    }
  }, [tripForm.startOdo, tripForm.endOdo, tripForm.calcMethod]);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const totalDist = trips.reduce((acc, t) => acc + t.kilometers, 0);
    const businessDist = trips
      .filter((t) => t.trip_type === "BUSINESS")
      .reduce((acc, t) => acc + t.kilometers, 0);
    const commuteDist = trips
      .filter((t) => t.trip_type === "COMMUTE")
      .reduce((acc, t) => acc + t.kilometers, 0);
    const privateDist = trips
      .filter((t) => t.trip_type === "PRIVATE")
      .reduce((acc, t) => acc + t.kilometers, 0);

    // Calculate Tax Free Allowance from database amounts (already calculated with correct rates)
    const reimbursement = trips
      .filter((t) => t.trip_type === "BUSINESS" || t.trip_type === "COMMUTE")
      .reduce((acc, t) => acc + t.amount, 0);

    return { totalDist, businessDist, commuteDist, privateDist, reimbursement };
  }, [trips]);

  // NEW: Trips filtered by selected vehicle
  const vehicleTrips = useMemo(() => {
    if (showAllVehicles || !selectedVehicleId) {
      return trips; // Show all trips from all vehicles
    }
    return trips.filter((t) => t.vehicle_id === selectedVehicleId);
  }, [trips, selectedVehicleId, showAllVehicles]);

  // NEW: Per-vehicle statistics (for selected vehicle in selected year)
  const vehicleStats = useMemo(() => {
    const relevantTrips = vehicleTrips.filter(
      (t) => new Date(t.date).getFullYear() === selectedYear
    );

    const totalKm = relevantTrips.reduce((acc, t) => acc + t.kilometers, 0);
    const businessKm = relevantTrips
      .filter((t) => t.trip_type === "BUSINESS")
      .reduce((acc, t) => acc + t.kilometers, 0);
    const commuteKm = relevantTrips
      .filter((t) => t.trip_type === "COMMUTE")
      .reduce((acc, t) => acc + t.kilometers, 0);
    const privateKm = relevantTrips
      .filter((t) => t.trip_type === "PRIVATE")
      .reduce((acc, t) => acc + t.kilometers, 0);
    const reimbursement = relevantTrips
      .filter((t) => t.trip_type === "BUSINESS" || t.trip_type === "COMMUTE")
      .reduce((acc, t) => acc + t.amount, 0);

    return { totalKm, businessKm, commuteKm, privateKm, reimbursement };
  }, [vehicleTrips, selectedYear]);

  const filteredTrips = useMemo(() => {
    let result = vehicleTrips;

    // Filtruj wg roku jeśli włączone
    if (filterByYear) {
      result = result.filter(
        (t) => new Date(t.date).getFullYear() === selectedYear
      );
    }

    // Filtruj wg typu podróży
    if (filterType !== "ALL") {
      result = result.filter((t) => t.trip_type === filterType);
    }

    return result;
  }, [vehicleTrips, filterType, filterByYear, selectedYear]);

  // NEW: Calculate Quarterly Reports (per selected vehicle)
  const quarterlyData = useMemo(() => {
    const quarters = [
      { q: "Q1", months: [1, 2, 3], label: "Kwartał 1 (Jan-Mar)" },
      { q: "Q2", months: [4, 5, 6], label: "Kwartał 2 (Apr-Jun)" },
      { q: "Q3", months: [7, 8, 9], label: "Kwartał 3 (Jul-Sep)" },
      { q: "Q4", months: [10, 11, 12], label: "Kwartał 4 (Oct-Dec)" },
    ];

    return quarters.map((quarter) => {
      const quarterTrips = vehicleTrips.filter((trip) => {
        const tripDate = new Date(trip.date);
        return (
          tripDate.getFullYear() === selectedYear &&
          quarter.months.includes(tripDate.getMonth() + 1)
        );
      });

      const businessKm = quarterTrips
        .filter((t) => t.trip_type === "BUSINESS")
        .reduce((sum, t) => sum + t.kilometers, 0);
      const commuteKm = quarterTrips
        .filter((t) => t.trip_type === "COMMUTE")
        .reduce((sum, t) => sum + t.kilometers, 0);
      const totalReimbursement = quarterTrips.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      return {
        ...quarter,
        businessKm,
        commuteKm,
        totalKm: businessKm + commuteKm,
        reimbursement: totalReimbursement,
        trips: quarterTrips.length,
      };
    });
  }, [trips, selectedYear]);

  // NEW: Annual Summary (per selected vehicle)
  const annualSummary = useMemo(() => {
    const yearTrips = vehicleTrips.filter(
      (trip) => new Date(trip.date).getFullYear() === selectedYear
    );

    const businessKm = yearTrips
      .filter((t) => t.trip_type === "BUSINESS")
      .reduce((sum, t) => sum + t.kilometers, 0);
    const commuteKm = yearTrips
      .filter((t) => t.trip_type === "COMMUTE")
      .reduce((sum, t) => sum + t.kilometers, 0);
    const privateKm = yearTrips
      .filter((t) => t.trip_type === "PRIVATE")
      .reduce((sum, t) => sum + t.kilometers, 0);

    const totalReimbursement = yearTrips.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalKm: businessKm + commuteKm + privateKm,
      businessKm,
      commuteKm,
      privateKm,
      reimbursement: totalReimbursement,
      trips: yearTrips.length,
      belowTaxLimit: totalReimbursement < 3000,
    };
  }, [vehicleTrips, selectedYear]);

  // NEW: Total reimbursement summary for ALL vehicles
  const allVehiclesReimbursement = useMemo(() => {
    const yearTrips = trips.filter(
      (trip) => new Date(trip.date).getFullYear() === selectedYear
    );

    // Group by vehicle
    const byVehicle = vehicles
      .map((vehicle) => {
        const vehicleTrips = yearTrips.filter(
          (t) => t.vehicle_id === vehicle.id
        );
        return {
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehicleType: vehicle.vehicle_type,
          totalKm: vehicleTrips.reduce((sum, t) => sum + t.kilometers, 0),
          totalAmount: vehicleTrips.reduce((sum, t) => sum + t.amount, 0),
          tripCount: vehicleTrips.length,
        };
      })
      .filter((v) => v.tripCount > 0); // Only vehicles with trips

    // Trips without vehicle_id (old entries)
    const unassignedTrips = yearTrips.filter((t) => !t.vehicle_id);
    if (unassignedTrips.length > 0) {
      byVehicle.push({
        vehicleId: "unassigned",
        vehicleName: "Nieprzypisane",
        vehicleType: "car" as const,
        totalKm: unassignedTrips.reduce((sum, t) => sum + t.kilometers, 0),
        totalAmount: unassignedTrips.reduce((sum, t) => sum + t.amount, 0),
        tripCount: unassignedTrips.length,
      });
    }

    const grandTotalAmount = yearTrips.reduce((sum, t) => sum + t.amount, 0);
    const grandTotalKm = yearTrips.reduce((sum, t) => sum + t.kilometers, 0);

    return {
      byVehicle,
      grandTotalAmount,
      grandTotalKm,
      totalTrips: yearTrips.length,
      belowTaxLimit: grandTotalAmount < 3000,
    };
  }, [trips, vehicles, selectedYear]);

  // --- Actions ---

  const calculateDistance = async () => {
    if (!tripForm.from || !tripForm.to) {
      alert("Wypełnij oba pola: początek i cel podróży");
      return;
    }

    setIsCalculatingDistance(true);

    try {
      // Using OpenStreetMap Nominatim for geocoding (free, no API key)
      const geocodeAddress = async (address: string) => {
        // Detect if address contains Dutch postal code (1234 AB format)
        const postalCodePattern = /\b\d{4}\s*[A-Z]{2}\b/i;
        const hasPostalCode = postalCodePattern.test(address);

        // Try multiple query formats for better results
        const queries = hasPostalCode
          ? [
              // If postal code detected, prioritize it
              `${address}, Netherlands`,
              address,
              `${address}, Nederland`,
            ]
          : [
              // Otherwise try city/street formats
              `${address}, Netherlands`,
              `${address}, Nederland`,
              address,
              // Try removing potential house numbers for broader search
              address.replace(/\d+[a-zA-Z]?\s*$/, "").trim() + ", Netherlands",
            ];

        for (const query of queries) {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              query
            )}&limit=1&countrycodes=nl&addressdetails=1`,
            {
              headers: {
                "User-Agent": "ZZP-Werkplaats-App/1.0",
              },
            }
          );

          if (!response.ok) continue;

          const data = await response.json();
          if (data.length > 0) {
            const result = data[0];
            const displayName = result.address
              ? `${result.address.road || result.address.city || ""} ${
                  result.address.house_number || ""
                }, ${result.address.postcode || ""} ${
                  result.address.city ||
                  result.address.town ||
                  result.address.village ||
                  ""
                }`.trim()
              : result.display_name;

            console.log(`✅ Znaleziono: "${address}" → ${displayName}`);
            return {
              lat: parseFloat(result.lat),
              lon: parseFloat(result.lon),
              name: displayName,
              address: result.address,
            };
          }

          // Rate limiting between tries
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        throw new Error(
          `Nie znaleziono adresu: "${address}".\n\nSpróbuj formatu:\n• Kod pocztowy: "1012 AB Amsterdam"\n• Ulica: "Keizersgracht 100, Amsterdam"\n• Miasto: "Rotterdam"`
        );
      };

      // Geocode both addresses
      console.log("🔍 Szukam:", tripForm.from);
      const fromCoords = await geocodeAddress(tripForm.from);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limiting
      console.log("🔍 Szukam:", tripForm.to);
      const toCoords = await geocodeAddress(tripForm.to);

      // Calculate distance using Haversine formula
      const haversineDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ): number => {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const straightDistance = haversineDistance(
        fromCoords.lat,
        fromCoords.lon,
        toCoords.lat,
        toCoords.lon
      );
      const distanceInKm = Math.round(straightDistance * 1.2); // Add 20% for road distance vs straight line

      setTripForm((p) => ({
        ...p,
        distance: distanceInKm,
        calcMethod: "MANUAL", // Switch to manual after calculation
      }));

      console.log(
        `✅ Obliczony dystans: ${distanceInKm} km (w linii prostej: ${Math.round(
          straightDistance
        )} km)`
      );
      console.log(`📍 Z: ${fromCoords.name}`);
      console.log(`📍 Do: ${toCoords.name}`);

      // Show success badge
      setDistanceCalculated({
        km: distanceInKm,
        from:
          fromCoords.address?.city ||
          fromCoords.address?.town ||
          fromCoords.name.split(",")[0],
        to:
          toCoords.address?.city ||
          toCoords.address?.town ||
          toCoords.name.split(",")[0],
      });

      // Auto-clear after 5 seconds
      setTimeout(() => setDistanceCalculated(null), 5000);
    } catch (err) {
      console.error("❌ Błąd obliczania dystansu:", err);
      alert(`${err instanceof Error ? err.message : "Nieznany błąd"}`);
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  const handleOpenAddTrip = () => {
    setEditingTripId(null);
    // Znajdź ostatnią trasę użytkownika do auto-suggest
    const lastTrip = trips.find((t) => t.user_id === user?.id);
    setTripForm({
      date: new Date().toISOString().split("T")[0],
      from: lastTrip?.end_location || "", // Auto-suggest start from last destination
      to: "",
      distance: 0,
      type: "BUSINESS",
      startOdo:
        selectedVehicle?.current_odometer ||
        defaultVehicle?.current_odometer ||
        0,
      endOdo:
        selectedVehicle?.current_odometer ||
        defaultVehicle?.current_odometer ||
        0,
      calcMethod: "ODOMETER",
      purpose: "",
      notes: "",
      vehicleId: selectedVehicle?.id || defaultVehicle?.id || "", // Use selected vehicle for new trips
    });
    setIsTripModalOpen(true);
  };

  const handleOpenEditTrip = (trip: KilometerEntry) => {
    setEditingTripId(trip.id);
    setTripForm({
      date: trip.date,
      from: trip.start_location,
      to: trip.end_location,
      distance: trip.kilometers,
      type: trip.trip_type,
      startOdo: 0,
      endOdo: 0,
      calcMethod: "MANUAL", // Usually safer to edit as manual distance
      purpose: trip.purpose,
      notes: trip.notes || "",
      vehicleId: trip.vehicle_id || defaultVehicle?.id || "", // NEW: Pobierz z trasy lub domyślny
    });
    setIsTripModalOpen(true);
  };

  const handleDeleteTrip = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć tę trasę?")) {
      try {
        await deleteEntry(id);
      } catch (err) {
        console.error("Failed to delete trip:", err);
        alert("Nie udało się usunąć trasy");
      }
    }
  };

  const handleSaveTrip = async () => {
    // WALIDACJA zgodna z Belastingdienst
    const errors: string[] = [];
    if (tripForm.distance <= 0) errors.push("Dystans musi być większy niż 0");
    if (!tripForm.to.trim()) errors.push("Cel podróży (Naar) jest wymagany");
    if (!tripForm.from.trim())
      errors.push("Początek podróży (Van) jest wymagany");
    if (!tripForm.purpose.trim() && tripForm.type !== "PRIVATE") {
      errors.push("Cel biznesowy (Doel) jest wymagany dla tras służbowych");
    }

    if (errors.length > 0) {
      alert(`⚠️ Walidacja Belastingdienst:\n\n${errors.join("\n")}`);
      return;
    }

    // Pobierz dane pojazdu i oblicz stawkę
    const selectedVehicle =
      vehicles.find((v) => v.id === tripForm.vehicleId) || defaultVehicle;
    const vehicleType = selectedVehicle?.vehicle_type || "car";
    const isPrivate = !selectedVehicle?.is_company_vehicle;

    // Oblicz stawkę na podstawie pojazdu (custom lub standardowa)
    const vehicleRate =
      selectedVehicle?.custom_rate_per_km ||
      (vehicleType === "bike" || vehicleType === "electric_bike"
        ? 0.27
        : vehicleType === "motorcycle" || vehicleType === "scooter"
        ? 0.21
        : selectedVehicle?.is_company_vehicle
        ? 0.23
        : 0.19);

    try {
      if (editingTripId) {
        // Update existing
        await updateEntry(editingTripId, {
          date: tripForm.date,
          start_location: tripForm.from.trim(),
          end_location: tripForm.to.trim(),
          kilometers: tripForm.distance,
          trip_type: tripForm.type as TripType,
          purpose: tripForm.purpose.trim(),
          vehicle_type: vehicleType,
          is_private_vehicle: isPrivate,
          vehicle_id: tripForm.vehicleId || undefined,
          notes: tripForm.notes,
          custom_rate: vehicleRate, // Przekaż stawkę z pojazdu
        });
      } else {
        // Create new
        await createEntry({
          date: tripForm.date,
          start_location: tripForm.from.trim(),
          end_location: tripForm.to.trim(),
          kilometers: tripForm.distance,
          trip_type: tripForm.type as TripType,
          purpose: tripForm.purpose.trim(),
          vehicle_type: vehicleType,
          is_private_vehicle: isPrivate,
          vehicle_id: tripForm.vehicleId || undefined,
          notes: tripForm.notes,
          custom_rate: vehicleRate, // Przekaż stawkę z pojazdu
        });

        // Aktualizuj licznik pojazdu jeśli używamy odometru
        if (
          tripForm.calcMethod === "ODOMETER" &&
          selectedVehicle &&
          tripForm.endOdo > selectedVehicle.current_odometer
        ) {
          await updateVehicle(selectedVehicle.id, {
            current_odometer: tripForm.endOdo,
          });
        }
      }

      setIsTripModalOpen(false);
    } catch (err) {
      console.error("Failed to save trip:", err);
      alert("Nie udało się zapisać trasy. Sprawdź połączenie z bazą danych.");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Data",
      "Typ",
      "Z",
      "Do",
      "Dystans (km)",
      "Cel podróży",
      "Stawka €/km",
      "Kwota €",
    ];
    const csvContent = [
      headers.join(","),
      ...trips.map((t) =>
        [
          t.date,
          t.trip_type,
          `"${t.start_location}"`,
          `"${t.end_location}"`,
          t.kilometers,
          `"${t.purpose}"`,
          t.rate.toFixed(2),
          t.amount.toFixed(2),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Ewidencja_Przebiegu_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  // NEW: Export Annual PDF Report
  const handleExportAnnualPDF = () => {
    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ewidencja Przebiegu ${selectedYear}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #1e40af; color: white; }
          .summary { background-color: #f0f9ff; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .warning { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <h1>Kilometrregistratie ${selectedYear}</h1>
        <div class="summary">
          <h2>Jaaroverzicht</h2>
          <p><strong>Totale zakelijke kilometers:</strong> ${
            annualSummary.businessKm
          } km</p>
          <p><strong>Woon-werk kilometers:</strong> ${
            annualSummary.commuteKm
          } km</p>
          <p><strong>Privé kilometers:</strong> ${
            annualSummary.privateKm
          } km</p>
          <p><strong>Totale vergoeding:</strong> €${annualSummary.reimbursement.toFixed(
            2
          )}</p>
          <p><strong>Aantal ritten:</strong> ${annualSummary.trips}</p>
        </div>
        ${
          !annualSummary.belowTaxLimit
            ? `<div class="warning">
            <strong>⚠️ Let op:</strong> Vergoeding overschrijdt de belastingvrije limiet van €3.000!
          </div>`
            : ""
        }
        <h2>Rittenlijst</h2>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Type</th>
              <th>Van</th>
              <th>Naar</th>
              <th>Afstand (km)</th>
              <th>Vergoeding (€)</th>
            </tr>
          </thead>
          <tbody>
            ${trips
              .filter((t) => new Date(t.date).getFullYear() === selectedYear)
              .map(
                (t) => `
              <tr>
                <td>${t.date}</td>
                <td>${t.trip_type}</td>
                <td>${t.start_location}</td>
                <td>${t.end_location}</td>
                <td>${t.kilometers}</td>
                <td>€${t.amount.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p style="margin-top: 40px; font-size: 12px; color: #666;">
          Gegenereerd op ${new Date().toLocaleDateString(
            "nl-NL"
          )} - ZZP Werkplaats
        </p>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Kilometrregistratie_${selectedYear}.html`;
    link.click();

    alert(
      "📄 Rapport HTML wygenerowany! Możesz otworzyć go w przeglądarce i wydrukować jako PDF (Ctrl+P)."
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Gauge size={14} /> Rittenregistratie
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">
            Ewidencja Przebiegu
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg flex items-center gap-2">
            Zgodność z Belastingdienst{" "}
            <ShieldCheck size={18} className="text-green-500" />
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Year Selector + Filter Toggle */}
          <div className="hidden lg:flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-2 py-1 shadow-sm">
            <button
              onClick={() => setFilterByYear(!filterByYear)}
              className={`p-2 rounded-lg transition-all ${
                filterByYear
                  ? "bg-ocean-100 text-ocean-700"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title={
                filterByYear
                  ? "Filtruj wg roku: WŁĄCZONE"
                  : "Filtruj wg roku: WYŁĄCZONE"
              }
            >
              <Filter size={16} />
            </button>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 py-1 bg-transparent font-bold text-slate-700 cursor-pointer outline-none"
            >
              {[2025, 2024, 2023, 2022].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowQuarterlyReports(true)}
            className="hidden lg:flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <FileSpreadsheet size={20} />
            <span>Kwartalne</span>
          </button>
          <button
            onClick={handleExportAnnualPDF}
            className="hidden lg:flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <FileText size={20} />
            <span>Roczne PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="hidden md:flex items-center gap-2 px-5 py-3 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 shadow-sm hover:shadow-md hover:text-ocean-600 transition-all"
          >
            <Download size={20} />
            <span>CSV</span>
          </button>
          <button
            onClick={handleOpenAddTrip}
            className="group relative overflow-hidden bg-gradient-to-r from-ocean-600 to-cyan-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-ocean-500/30 hover:shadow-ocean-500/50 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Plus size={24} className="relative z-10" />
            <span className="font-bold text-lg relative z-10">Nowa Trasa</span>
          </button>
        </div>
      </div>

      {/* --- VEHICLE TABS: Switch between vehicles --- */}
      {vehicles.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Car size={16} />
              Moje Pojazdy ({vehicles.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllVehicles(!showAllVehicles)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showAllVehicles
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {showAllVehicles
                  ? "📊 Wszystkie pojazdy"
                  : "📊 Pokaż wszystkie"}
              </button>
              <button
                onClick={() => setIsVehicleModalOpen(true)}
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                title="Zarządzaj pojazdami"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>

          {/* Vehicle Cards Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            {vehicles.map((vehicle) => {
              const isSelected = selectedVehicleId === vehicle.id;
              const vehicleStats = trips.filter(
                (t) => t.vehicle_id === vehicle.id
              );
              const vehicleKm = vehicleStats.reduce(
                (sum, t) => sum + t.kilometers,
                0
              );
              const vehicleTripsCount = vehicleStats.length;

              return (
                <button
                  key={vehicle.id}
                  onClick={() => {
                    setSelectedVehicleId(vehicle.id);
                    setShowAllVehicles(false);
                  }}
                  className={`flex-shrink-0 p-4 rounded-xl border-2 transition-all min-w-[200px] text-left ${
                    isSelected && !showAllVehicles
                      ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 shadow-lg scale-[1.02]"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        vehicle.vehicle_type === "car"
                          ? "bg-blue-100 text-blue-600"
                          : vehicle.vehicle_type === "motorcycle"
                          ? "bg-orange-100 text-orange-600"
                          : vehicle.vehicle_type === "bike"
                          ? "bg-green-100 text-green-600"
                          : vehicle.vehicle_type === "electric_bike"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-purple-100 text-purple-600"
                      }`}
                    >
                      {vehicle.vehicle_type === "car" ? (
                        <Car size={18} />
                      ) : vehicle.vehicle_type === "motorcycle" ? (
                        <Bike size={18} />
                      ) : vehicle.vehicle_type === "bike" ? (
                        <Bike size={18} />
                      ) : (
                        <Zap size={18} />
                      )}
                    </div>
                    {vehicle.is_default && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                        Domyślny
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm truncate mb-1">
                    {vehicle.name}
                  </h4>

                  {vehicle.license_plate && (
                    <p className="text-[10px] text-slate-500 font-mono mb-2">
                      🚗 {vehicle.license_plate}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600">
                      <span className="font-bold text-slate-800">
                        {vehicleTripsCount}
                      </span>{" "}
                      tras
                    </span>
                    <span className="text-slate-600">
                      <span className="font-bold text-blue-600">
                        {vehicleKm.toLocaleString()}
                      </span>{" "}
                      km
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Stawka:{" "}
                      <span className="font-bold text-emerald-600">
                        €
                        {vehicle.custom_rate_per_km ||
                          (vehicle.vehicle_type === "bike" ||
                          vehicle.vehicle_type === "electric_bike"
                            ? 0.27
                            : vehicle.vehicle_type === "motorcycle" ||
                              vehicle.vehicle_type === "scooter"
                            ? 0.21
                            : vehicle.is_company_vehicle
                            ? 0.23
                            : 0.19)}
                        /km
                      </span>
                    </span>
                    {isSelected && !showAllVehicles && (
                      <Check size={14} className="text-blue-600" />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Add Vehicle Card */}
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="flex-shrink-0 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all min-w-[140px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600"
            >
              <Plus size={24} />
              <span className="text-xs font-bold">Dodaj pojazd</span>
            </button>
          </div>

          {/* Current Selection Info */}
          {!showAllVehicles && selectedVehicle && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedVehicle.vehicle_type === "car"
                      ? "bg-blue-100 text-blue-600"
                      : selectedVehicle.vehicle_type === "motorcycle"
                      ? "bg-orange-100 text-orange-600"
                      : selectedVehicle.vehicle_type === "bike"
                      ? "bg-green-100 text-green-600"
                      : "bg-purple-100 text-purple-600"
                  }`}
                >
                  {selectedVehicle.vehicle_type === "car" ? (
                    <Car size={16} />
                  ) : selectedVehicle.vehicle_type === "motorcycle" ? (
                    <Bike size={16} />
                  ) : (
                    <Bike size={16} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Wyświetlanie: {selectedVehicle.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Statystyki i historia tylko dla tego pojazdu
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-blue-600">
                  {filteredTrips.length} tras
                </p>
                <p className="text-xs text-slate-500">w {selectedYear}</p>
              </div>
            </div>
          )}

          {showAllVehicles && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <BarChart size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Widok zbiorczy: Wszystkie pojazdy
                </p>
                <p className="text-xs text-slate-500">
                  Łączne statystyki z {vehicles.length} pojazdów •{" "}
                  {filteredTrips.length} tras w {selectedYear}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- 3D Stats & Vehicle Cockpit --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Vehicle Card (With Truck Animation) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <TiltCard>
            <div className="h-full bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 relative overflow-hidden group">
              {/* Animation Header - Dynamic based on vehicle type */}
              <div className="absolute top-0 left-0 right-0 h-36 bg-slate-50 rounded-t-[2rem] border-b border-slate-100 overflow-hidden flex items-center justify-center">
                <VehicleAnimation vehicleType={selectedVehicle?.vehicle_type} />
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between mt-32 pt-4">
                {/* CASE 1: No vehicle - show empty state with add button */}
                {!selectedVehicle ? (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4 animate-pulse">
                      <Car size={40} className="text-blue-500" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">
                      Brak pojazdu
                    </h4>
                    <p className="text-sm text-slate-500 text-center mb-6 max-w-[200px]">
                      Dodaj pojazd, aby śledzić kilometry i obliczać zwroty
                    </p>
                    <button
                      onClick={() => setIsVehicleModalOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                      <Plus size={20} />
                      Dodaj Pojazd
                    </button>
                    <p className="text-xs text-slate-400 mt-4 text-center">
                      Stawki 2025: Auto firmowe €0.23/km, prywatne €0.19/km
                    </p>
                  </div>
                ) : (
                  /* CASE 2: Vehicle exists - show full details */
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            {showAllVehicles
                              ? "Wszystkie Pojazdy"
                              : "Wybrany Pojazd"}
                          </h3>
                          {vehicles.length > 1 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                              {vehicles.findIndex(
                                (v) => v.id === selectedVehicle.id
                              ) + 1}
                              /{vehicles.length}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xl font-black text-slate-800 leading-tight">
                          {selectedVehicle.name}
                        </h4>
                        {(selectedVehicle.brand || selectedVehicle.model) && (
                          <p className="text-sm text-slate-500 font-medium">
                            {selectedVehicle.brand} {selectedVehicle.model}
                          </p>
                        )}
                      </div>
                      {/* Vehicle Type Icon */}
                      <div
                        className={`p-3 rounded-xl ${
                          selectedVehicle.vehicle_type === "car"
                            ? "bg-blue-100 text-blue-600"
                            : selectedVehicle.vehicle_type === "motorcycle"
                            ? "bg-orange-100 text-orange-600"
                            : selectedVehicle.vehicle_type === "bike"
                            ? "bg-green-100 text-green-600"
                            : selectedVehicle.vehicle_type === "electric_bike"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-purple-100 text-purple-600"
                        }`}
                      >
                        {selectedVehicle.vehicle_type === "car" ? (
                          <Car size={24} />
                        ) : selectedVehicle.vehicle_type === "motorcycle" ? (
                          <Bike size={24} />
                        ) : selectedVehicle.vehicle_type === "bike" ? (
                          <Bike size={24} />
                        ) : (
                          <Zap size={24} />
                        )}
                      </div>
                    </div>

                    {/* Vehicle Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                          Typ
                        </p>
                        <p className="text-sm font-bold text-slate-700 capitalize">
                          {selectedVehicle.vehicle_type === "car"
                            ? "Samochód"
                            : selectedVehicle.vehicle_type === "motorcycle"
                            ? "Motocykl"
                            : selectedVehicle.vehicle_type === "bike"
                            ? "Rower"
                            : selectedVehicle.vehicle_type === "electric_bike"
                            ? "E-Rower"
                            : selectedVehicle.vehicle_type === "scooter"
                            ? "Skuter"
                            : "Inny"}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                          Stawka
                        </p>
                        <p className="text-sm font-bold text-emerald-600">
                          €{currentRate}/km
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                          Paliwo
                        </p>
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-1">
                          <Fuel size={12} className="text-slate-400" />
                          {selectedVehicle.fuel_type === "petrol"
                            ? "Benzyna"
                            : selectedVehicle.fuel_type === "diesel"
                            ? "Diesel"
                            : selectedVehicle.fuel_type === "electric"
                            ? "Elektryczny"
                            : selectedVehicle.fuel_type === "hybrid"
                            ? "Hybryda"
                            : selectedVehicle.fuel_type === "lpg"
                            ? "LPG"
                            : selectedVehicle.fuel_type || "N/A"}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                          Rok
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {selectedVehicle.registration_year || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedVehicle.is_company_vehicle && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-bold text-blue-700">
                          <ShieldCheck size={12} />
                          Firmowy (WKR)
                        </div>
                      )}
                      {!selectedVehicle.is_company_vehicle && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700">
                          <User size={12} />
                          Prywatny
                        </div>
                      )}
                      {selectedVehicle.is_default && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-lg text-[10px] font-bold text-green-700">
                          <Check size={12} />
                          Domyślny
                        </div>
                      )}
                    </div>

                    {/* Dutch License Plate Visualization */}
                    {selectedVehicle.license_plate ? (
                      <div className="my-3 bg-[#ffba00] text-black border-2 border-black rounded-lg px-4 py-2.5 font-black text-center text-2xl tracking-widest shadow-lg relative max-w-[240px] mx-auto transform group-hover:scale-105 transition-transform duration-300">
                        <div className="absolute left-0 top-0 bottom-0 bg-blue-700 w-7 flex flex-col items-center justify-center rounded-l-md border-r border-black">
                          <span className="text-[7px] text-white font-normal mt-1">
                            EU
                          </span>
                          <span className="text-white text-[10px] font-bold">
                            NL
                          </span>
                        </div>
                        <span className="ml-5 font-mono">
                          {selectedVehicle.license_plate}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsVehicleModalOpen(true)}
                        className="my-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-center transition-all cursor-pointer border-2 border-dashed border-slate-200 hover:border-blue-300"
                      >
                        <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                          <Plus size={16} />
                          Dodaj tablicę rejestracyjną
                        </p>
                      </button>
                    )}

                    {/* Footer with ODO and Actions */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">
                          Stan Licznika (ODO)
                        </p>
                        <p className="text-xl font-black text-slate-800 font-mono">
                          {selectedVehicle.current_odometer?.toLocaleString() ||
                            "0"}{" "}
                          <span className="text-sm text-slate-400 font-bold">
                            km
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {vehicles.length > 1 && (
                          <button
                            onClick={() => {
                              // Quick switch to next vehicle
                              const currentIndex = vehicles.findIndex(
                                (v) => v.id === selectedVehicle.id
                              );
                              const nextVehicle =
                                vehicles[(currentIndex + 1) % vehicles.length];
                              if (nextVehicle) {
                                setSelectedVehicleId(nextVehicle.id);
                                setShowAllVehicles(false);
                              }
                            }}
                            className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all font-bold"
                            title="Przełącz pojazd"
                          >
                            <RefreshCw size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => setIsVehicleModalOpen(true)}
                          className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg hover:scale-105 font-bold"
                          title="Zarządzaj Pojazdami"
                        >
                          <Settings size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total KM */}
          <TiltCard>
            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-lg hover:shadow-xl transition-all h-full group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Navigation size={80} className="text-slate-800" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                  Przebieg {selectedYear}
                  {!showAllVehicles && selectedVehicle && (
                    <span className="block text-[10px] text-blue-500 font-medium mt-1 normal-case">
                      {selectedVehicle.name}
                    </span>
                  )}
                </h3>
                <div className="text-4xl font-black text-slate-800 mb-1">
                  {annualSummary.totalKm.toLocaleString()}
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  Kilometrów łącznie
                </p>
              </div>
            </div>
          </TiltCard>

          {/* Allowance - WSZYSTKIE POJAZDY */}
          <TiltCard>
            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-lg hover:shadow-xl transition-all h-full group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <FileSpreadsheet size={80} className="text-emerald-800" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                  Vergoeding {selectedYear}
                </h3>

                {/* Lista pojazdów z kwotami */}
                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {allVehiclesReimbursement.byVehicle.map((v) => (
                    <div
                      key={v.vehicleId}
                      className="flex justify-between items-center text-xs py-1 border-b border-slate-50"
                    >
                      <span className="text-slate-600 truncate flex items-center gap-1">
                        {v.vehicleType === "car" && <Car size={12} />}
                        {v.vehicleType === "motorcycle" && <Bike size={12} />}
                        {v.vehicleType === "scooter" && <Bike size={12} />}
                        {v.vehicleType === "bike" && <Bike size={12} />}
                        {v.vehicleType === "electric_bike" && <Zap size={12} />}
                        {v.vehicleName}
                      </span>
                      <span className="font-bold text-emerald-600">
                        €{v.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* SUMA */}
                <div className="pt-3 border-t-2 border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">
                      SUMA:
                    </span>
                    <span className="text-2xl font-black text-emerald-600">
                      €{allVehiclesReimbursement.grandTotalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Tax-Free Limit Warning */}
                <div className="mt-3 pt-3 border-t border-emerald-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Limiet NL:
                    </span>
                    <span className="font-bold text-slate-700">€3.000</span>
                  </div>
                  <div className="mt-1 w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        allVehiclesReimbursement.grandTotalAmount >= 3000
                          ? "bg-red-500"
                          : allVehiclesReimbursement.grandTotalAmount >= 2500
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (allVehiclesReimbursement.grandTotalAmount / 3000) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  {allVehiclesReimbursement.grandTotalAmount >= 3000 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1 text-[10px] text-red-700 font-bold">
                      <span>⚠️</span>
                      <span>Limiet overschreden!</span>
                    </div>
                  )}
                  {allVehiclesReimbursement.grandTotalAmount >= 2500 &&
                    allVehiclesReimbursement.grandTotalAmount < 3000 && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                        <span>⚡</span>
                        <span>Bijna limiet!</span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </TiltCard>

          {/* Private vs Business */}
          <TiltCard>
            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-lg hover:shadow-xl transition-all h-full group relative overflow-hidden">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                      Struktura Jazdy
                    </h3>
                    <button
                      onClick={() =>
                        setShowNIBUDCalculator(!showNIBUDCalculator)
                      }
                      className="p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-all text-xs font-bold"
                      title="NIBUD Kalkulator"
                    >
                      <Calculator size={16} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>{" "}
                        Biznes
                      </span>
                      <span className="font-bold text-slate-800">
                        {annualSummary.businessKm.toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>{" "}
                        Dojazd
                      </span>
                      <span className="font-bold text-slate-800">
                        {annualSummary.commuteKm.toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm opacity-60">
                      <span className="flex items-center gap-2 font-medium text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>{" "}
                        Prywatne
                      </span>
                      <span className="font-bold text-slate-800">
                        {annualSummary.privateKm.toFixed(1)} km
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-4 flex overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{
                      width: `${
                        annualSummary.totalKm > 0
                          ? (annualSummary.businessKm / annualSummary.totalKm) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                  <div
                    className="bg-purple-500 h-full"
                    style={{
                      width: `${
                        annualSummary.totalKm > 0
                          ? (annualSummary.commuteKm / annualSummary.totalKm) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                  <div
                    className="bg-slate-400 h-full"
                    style={{
                      width: `${
                        annualSummary.totalKm > 0
                          ? (annualSummary.privateKm / annualSummary.totalKm) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>

      {/* NEW: Quarterly Reports Panel */}
      {showQuarterlyReports && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[2.5rem] border-2 border-purple-200 shadow-2xl p-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black text-purple-900 flex items-center gap-3">
                <BarChart size={32} className="text-purple-600" />
                Raporty Kwartalne {selectedYear}
              </h3>
              <p className="text-purple-600 mt-2">
                Podsumowanie wg kwartalnych okresów podatkowych (NL)
              </p>
            </div>
            <button
              onClick={() => setShowQuarterlyReports(false)}
              className="p-3 rounded-xl bg-white hover:bg-purple-100 text-purple-600 transition-all shadow-lg"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quarterlyData.map((quarter) => (
              <div
                key={quarter.q}
                className="bg-white rounded-2xl p-8 border-2 border-purple-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-black text-slate-800">
                    {quarter.label}
                  </h4>
                  <span className="text-3xl font-black text-purple-600">
                    {quarter.q}
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Biznes</span>
                    <span className="text-xl font-black text-blue-600">
                      {quarter.businessKm} km
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Dojazd</span>
                    <span className="text-xl font-black text-purple-600">
                      {quarter.commuteKm} km
                    </span>
                  </div>
                  <div className="pt-4 border-t-2 border-purple-100 flex justify-between items-center">
                    <span className="text-slate-800 font-bold">Razem</span>
                    <span className="text-2xl font-black text-slate-900">
                      {quarter.totalKm} km
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between items-center bg-emerald-50 p-4 rounded-xl">
                    <span className="text-emerald-800 font-bold">Zwrot</span>
                    <span className="text-2xl font-black text-emerald-600">
                      €{quarter.reimbursement.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center text-xs text-slate-400 font-bold mt-2">
                    {quarter.trips} tras w tym okresie
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW: NIBUD Cost Comparison Widget */}
      {showNIBUDCalculator && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-[2.5rem] border-2 border-orange-200 shadow-2xl p-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black text-orange-900 flex items-center gap-3">
                <Calculator size={32} className="text-orange-600" />
                NIBUD Werkelijke Kosten Calculator
              </h3>
              <p className="text-orange-600 mt-2">
                Porównaj zwrot z rzeczywistymi kosztami samochodu
              </p>
            </div>
            <button
              onClick={() => setShowNIBUDCalculator(false)}
              className="p-3 rounded-xl bg-white hover:bg-orange-100 text-orange-600 transition-all shadow-lg"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Reimbursement Side */}
            <div className="bg-white rounded-2xl p-8 border-2 border-emerald-200 shadow-xl">
              <h4 className="text-xl font-black text-emerald-800 mb-6 flex items-center gap-2">
                <ShieldCheck size={24} /> Zwrot Kilometrówki {selectedYear}
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Kilometry biznesowe</span>
                  <span className="font-black text-slate-800">
                    {annualSummary.businessKm.toFixed(1)} km
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    Stawka ({currentRate}€)
                  </span>
                  <span className="font-black text-slate-800">
                    €{currentRate}/km
                  </span>
                </div>
                <div className="pt-4 border-t-2 border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-emerald-800">
                      Roczny Zwrot
                    </span>
                    <span className="text-3xl font-black text-emerald-600">
                      €{annualSummary.reimbursement.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actual Costs Side (Simplified NIBUD) */}
            <div className="bg-white rounded-2xl p-8 border-2 border-orange-200 shadow-xl">
              <h4 className="text-xl font-black text-orange-800 mb-6 flex items-center gap-2">
                <Calculator size={24} /> Rzeczywiste Koszty (szacunek)
              </h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Paliwo (€0.10/km)</span>
                  <span className="font-black text-slate-800">
                    €{(annualSummary.totalKm * 0.1).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Amortyzacja (€0.08/km)</span>
                  <span className="font-black text-slate-800">
                    €{(annualSummary.totalKm * 0.08).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">
                    Ubezpieczenie (€800/rok)
                  </span>
                  <span className="font-black text-slate-800">€800</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Konserwacja (€0.05/km)</span>
                  <span className="font-black text-slate-800">
                    €{(annualSummary.totalKm * 0.05).toFixed(2)}
                  </span>
                </div>
                <div className="pt-4 border-t-2 border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-orange-800">
                      Suma Kosztów
                    </span>
                    <span className="text-3xl font-black text-orange-600">
                      €{(annualSummary.totalKm * 0.23 + 800).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-amber-200">
            <h5 className="font-black text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-600" />
              Analiza Rentowności
            </h5>
            <p className="text-slate-600 text-sm leading-relaxed">
              {annualSummary.reimbursement > annualSummary.totalKm * 0.23 + 800
                ? "✅ Zwrot kilometrówki pokrywa szacowane koszty rzeczywiste. Korzystna opcja!"
                : "⚠️ Koszty rzeczywiste mogą przekraczać zwrot. Rozważ negocjację wyższej stawki lub użycie samochodu prywatnego."}
            </p>
          </div>
        </div>
      )}

      {/* --- Trip List (Clean & Modern) --- */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <History className="text-ocean-500" /> Historia Tras
              {selectedVehicle && !showAllVehicles && (
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {selectedVehicle.name}
                </span>
              )}
              {showAllVehicles && vehicles.length > 1 && (
                <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  Wszystkie ({vehicles.length})
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {showAllVehicles
                ? `Rejestr wszystkich pojazdów (${filteredTrips.length} tras)`
                : `Przejazdy: ${selectedVehicle?.name || "Brak pojazdu"} (${
                    filteredTrips.length
                  } tras)`}
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {[
              { id: "ALL", label: "Wszystkie" },
              { id: "BUSINESS", label: "Biznes" },
              { id: "COMMUTE", label: "Dojazd" },
              { id: "PRIVATE", label: "Prywatne" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterType === f.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-4 pl-10">Data / Typ</th>
                <th className="px-6 py-4">Trasa (Van - Naar)</th>
                <th className="px-6 py-4">Licznik (Start - Stop)</th>
                <th className="px-6 py-4 text-right">Dystans</th>
                <th className="px-6 py-4 text-right">Zwrot (€)</th>
                <th className="px-6 py-4 pr-10 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Brak tras w tej kategorii. Dodaj nową trasę.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const tripStyle = TRIP_TYPES.find(
                    (t) => t.id === trip.trip_type
                  );
                  return (
                    <tr
                      key={trip.id}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-8 py-6 pl-10">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 font-bold text-slate-700">
                            <Calendar size={14} className="text-slate-400" />{" "}
                            {trip.date}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md w-fit border ${tripStyle?.color}`}
                          >
                            {tripStyle?.label}
                          </span>
                          {/* Show vehicle name when viewing all vehicles */}
                          {showAllVehicles &&
                            vehicles.length > 1 &&
                            vehicles.find((v) => v.id === trip.vehicle_id) && (
                              <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded w-fit flex items-center gap-1">
                                <Car size={10} />
                                {
                                  vehicles.find((v) => v.id === trip.vehicle_id)
                                    ?.name
                                }
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-3 relative">
                          {/* Connector Line */}
                          <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

                          <div className="flex items-center gap-3 text-slate-500 relative z-10">
                            <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-300"></div>
                            <span className="text-sm font-medium">
                              {trip.start_location}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-800 relative z-10">
                            <div className="w-3 h-3 rounded-full bg-ocean-500 border-2 border-white shadow-sm"></div>
                            <span className="text-sm font-bold">
                              {trip.end_location}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-slate-600 text-sm">
                          {trip.purpose || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-xl font-black text-slate-800">
                          {trip.kilometers}
                        </span>{" "}
                        <span className="text-xs text-slate-400 font-bold">
                          km
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        {["BUSINESS", "COMMUTE"].includes(trip.trip_type) ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            €{trip.amount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-6 pr-10 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditTrip(trip)}
                            className="p-2 text-slate-400 hover:text-ocean-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                            title="Edytuj"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
                            title="Usuń"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Add/Edit Trip Modal --- */}
      <Modal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        title={editingTripId ? "Edytuj Trasę" : "Nowa Trasa"}
      >
        <div className="space-y-4">
          {/* Row 1: Vehicle + Date + Type */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Pojazd
              </label>
              <select
                value={tripForm.vehicleId}
                onChange={(e) =>
                  setTripForm((p) => ({ ...p, vehicleId: e.target.value }))
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-ocean-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} - €
                    {(
                      v.custom_rate_per_km ||
                      (v.vehicle_type === "bike" ||
                      v.vehicle_type === "electric_bike"
                        ? 0.27
                        : v.vehicle_type === "motorcycle" ||
                          v.vehicle_type === "scooter"
                        ? 0.21
                        : v.is_company_vehicle
                        ? 0.23
                        : 0.19)
                    ).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Data
              </label>
              <input
                type="date"
                value={tripForm.date}
                onChange={(e) =>
                  setTripForm((p) => ({ ...p, date: e.target.value }))
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Rodzaj
              </label>
              <select
                value={tripForm.type}
                onChange={(e) =>
                  setTripForm((p) => ({ ...p, type: e.target.value }))
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-ocean-500"
              >
                {TRIP_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Route (From → To) + Calculate button */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <div className="grid grid-cols-5 gap-2 items-end">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Start (Van)
                </label>
                <input
                  type="text"
                  value={tripForm.from}
                  onChange={(e) =>
                    setTripForm((p) => ({ ...p, from: e.target.value }))
                  }
                  placeholder="np. Amsterdam"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Cel (Naar)
                </label>
                <input
                  type="text"
                  value={tripForm.to}
                  onChange={(e) =>
                    setTripForm((p) => ({ ...p, to: e.target.value }))
                  }
                  placeholder="np. Rotterdam"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ocean-500"
                />
              </div>
              <button
                type="button"
                onClick={calculateDistance}
                disabled={
                  isCalculatingDistance || !tripForm.from || !tripForm.to
                }
                className="h-[38px] px-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-lg shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1"
              >
                {isCalculatingDistance ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <>
                    <Navigation size={14} />
                    <span>Oblicz</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 3: Distance + Purpose in one row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Dystans (km)
              </label>
              <input
                type="number"
                value={tripForm.distance}
                onChange={(e) =>
                  setTripForm((p) => ({
                    ...p,
                    distance: Number(e.target.value),
                  }))
                }
                placeholder="0"
                className="w-full bg-white border-2 border-ocean-200 rounded-lg px-3 py-2 text-xl font-mono font-black text-ocean-600 text-center outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Cel podróży (Doel)
              </label>
              <input
                type="text"
                value={tripForm.purpose}
                onChange={(e) =>
                  setTripForm((p) => ({ ...p, purpose: e.target.value }))
                }
                placeholder="np. Wizyta u klienta"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>
          </div>

          {/* Row 4: Notes (optional, smaller) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Notatki (optioneel)
            </label>
            <input
              type="text"
              value={tripForm.notes}
              onChange={(e) =>
                setTripForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Dodatkowe uwagi"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSaveTrip}
            className="w-full py-3 bg-ocean-600 text-white font-bold rounded-xl shadow-lg hover:bg-ocean-700 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {editingTripId ? "Zapisz Zmiany" : "Zapisz Trasę"}
          </button>
        </div>
      </Modal>
      {/* --- Vehicle Settings Modal (NEW MULTI-VEHICLE MANAGER) --- */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        title="Zarządzanie Pojazdami"
      >
        <VehicleManager
          vehicles={vehicles}
          onAdd={createVehicle}
          onEdit={updateVehicle}
          onDelete={deleteVehicle}
          onSetDefault={setDefaultVehicle}
          userId={user?.id || ""}
        />
      </Modal>
    </div>
  );
};

export default Kilometers;
