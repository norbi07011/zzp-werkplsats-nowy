import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useSupabaseKilometers, useSupabaseVehicles } from "../hooks";
import type { KilometerEntry, TripType, Vehicle } from "../types";
import { Modal } from "../components/Modal";
import { VehicleManager } from "../components/VehicleManager";
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

// --- Page Loader (New Scanning Text Animation) ---
const PageLoader = () => {
  const text = "ZZP Werkplaats";
  const letters = text.split("");

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1e1e] flex items-center justify-center overflow-hidden">
      <style>{`
          .loader-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 120px;
            width: auto;
            margin: 2rem;
            font-family: "Inter", sans-serif;
            font-size: 1.6em;
            font-weight: 600;
            user-select: none;
            color: #140e08;
            transform: scale(2);
          }

          .loader {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            z-index: 1;
            background-color: transparent;
            mask-image: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 6px, black 9px);
            -webkit-mask-image: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 6px, black 9px);
          }

          .loader::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(circle at 50% 50%, #ff0 0%, transparent 50%),
              radial-gradient(circle at 45% 45%, #f00 0%, transparent 45%),
              radial-gradient(circle at 55% 55%, #0ff 0%, transparent 45%),
              radial-gradient(circle at 45% 55%, #0f0 0%, transparent 45%),
              radial-gradient(circle at 55% 45%, #00f 0%, transparent 45%);
            mask-image: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
            -webkit-mask-image: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
            animation: transform-animation 2s infinite alternate, opacity-animation 4s infinite;
            animation-timing-function: cubic-bezier(0.6, 0.8, 0.5, 1);
          }

          @keyframes transform-animation {
            0% { transform: translate(-55%); }
            100% { transform: translate(55%); }
          }

          @keyframes opacity-animation {
            0%, 100% { opacity: 0; }
            15% { opacity: 1; }
            65% { opacity: 0; }
          }

          .loader-letter {
            display: inline-block;
            opacity: 0;
            animation: loader-letter-anim 4s infinite linear;
            z-index: 2;
            color: white;
          }

          @keyframes loader-letter-anim {
            0% { filter: blur(0px); opacity: 0; }
            5% { opacity: 1; text-shadow: 0 0 4px #8d8379; filter: blur(0px); transform: scale(1.1) translateY(-2px); }
            20% { opacity: 0.2; filter: blur(0px); }
            100% { filter: blur(5px); opacity: 0; }
          }
       `}</style>

      <div className="loader-wrapper">
        {letters.map((char, i) => (
          <span
            key={i}
            className="loader-letter"
            style={{
              animationDelay: `${0.1 + i * 0.1}s`,
              marginRight: char === " " ? "0.4em" : "0",
            }}
          >
            {char === " " ? "" : char}
          </span>
        ))}
        <div className="loader" />
      </div>
    </div>
  );
};

// --- Truck Animation Component (Used in UI Card) ---
const TruckAnimation = () => {
  return (
    <div className="truck-wrapper">
      <style>{`
        .truck-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        .truck {
            --width: 200;
            position: relative;
            width: calc(var(--width) * 1px);
            height: calc(var(--width) * 0.33px);
            transform: scale(0.8); 
        }
        .truck * {
            transition: all 0.25s ease;
        }
        .truck:after {
            content: "";
            height: 5%;
            width: 100%;
            background: #000;
            position: absolute;
            left: 0;
            bottom: 5%;
            border-radius: 100%;
            filter: blur(10px);
            opacity: 0.5;
        }
        .truck__indicator {
            height: 2%;
            width: 3%;
            position: absolute;
            right: 1.5%;
            background: #915d08;
            top: 64%;
            opacity: 0.45;
            z-index: 10;
        }
        .truck__foglight {
            height: 2%;
            width: 1%;
            position: absolute;
            left: 2%;
            background: #911308;
            top: 58%;
            opacity: 0.45;
            z-index: 10;
        }
        .truck__taillight {
            height: 2%;
            width: 1%;
            background: radial-gradient(circle at center, #ffebeb, #f00), #f00;
            box-shadow: 0 0 30px 5px #f33;
            position: absolute;
            top: 25%;
            z-index: 10;
            left: 0;
        }
        .truck__taillight:after {
            content: "";
            height: 100%;
            width: 800%;
            background: #ff4d4d;
            position: absolute;
            right: 0;
            top: 0;
            border-radius: 25%;
            filter: blur(8px);
            box-shadow: 0 0 60px 5px #ff8080;
        }
        .truck__headlight {
            height: 5%;
            width: 4%;
            position: absolute;
            right: 0;
            border-radius: 25%;
            top: 42%;
            z-index: 10;
            transform: rotate(4deg);
            background: #fff;
            box-shadow: 0 0 40px 5px #9bf, 0 0 2px 2px #b3ccff inset;
        }
        .truck__wheel {
            position: absolute;
        }
        .truck__wheel--front {
            height: 57%;
            width: 21%;
            bottom: 0;
            left: 75%;
            z-index: 4;
            transform: rotate(2deg);
        }
        .truck__wheel--rear {
            height: 57%;
            width: 21%;
            bottom: 2%;
            left: 10%;
            z-index: 4;
            transform: rotate(2deg);
        }
        .truck-wheel {
            border-radius: 100%;
            height: calc(var(--width) * 0.15px);
            width: calc(var(--width) * 0.15px);
            background: #242424;
            border-top: 1px solid #ccc;
            position: absolute;
            bottom: 0;
            left: 52%;
            transform: translate(-50%, 0);
        }
        .truck-wheel__rim {
            height: 60%;
            width: 60%;
            background: radial-gradient(circle at center, transparent, #666), #0d0d0d;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 100%;
            animation: spin 0.35s infinite linear;
        }
        .truck-wheel__rim:after {
            content: "";
            height: 35%;
            width: 35%;
            background: radial-gradient(circle at center, #0d0d0d, #0d0d0d 40%, transparent 40%), radial-gradient(circle at center, #262626, #262626 40%, transparent), #8c8c8c;
            border: 1px solid #1a1a1a;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 100%;
            z-index: 2;
        }
        @keyframes spin {
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .truck-wheel__spoke {
            position: absolute;
            height: 60%;
            width: 20%;
            background: linear-gradient(0deg, transparent, #1a1a1a 50%), #808080;
            border-left: 1px solid #4d4d4d;
            border-right: 1px solid #333;
            border-radius: 0 0 25% 25%;
            top: 50%;
            left: 50%;
            transform-origin: top center;
            transform: translate(-50%, 0) rotate(calc(360 / 7 * var(--index) * 1deg));
        }
        .truck__wheel-arch {
            background: #080808;
            position: absolute;
            top: 0;
            left: 0;
            right: 1%;
            height: 54%;
            clip-path: polygon(0 100%, 23% 0, 81% 0%, 95% 60%, 95% 100%);
        }
        .truck__wheel-arch-trim { position: absolute; }
        .truck__wheel-arch-trim--top {
            top: 0; left: 25%; background: #8c8c8c; height: 5%; width: 53%; z-index: 2;
        }
        .truck__wheel-arch-trim--left {
            top: 0; left: -20%; background: linear-gradient(160deg, transparent, #666), #333; height: 5%; width: 44%; transform-origin: top right; transform: rotate(-60deg);
        }
        .truck__wheel-arch-trim--right {
            top: 0; left: 79%; background: linear-gradient(-158deg, transparent, #666), #333; height: 5%; width: 35%; transform-origin: top left; transform: rotate(58deg);
        }
        .truck__body { position: absolute; height: 100%; width: 100%; }
        .truck__body--top {
            background: linear-gradient(90deg, #f4f1f1, #bfbfbf 50%), #e8e3e3;
            height: 33%; width: 100%; top: 0; transform: rotate(3deg);
            clip-path: polygon(0 100%, 58% 0, 98% 100%);
        }
        .truck__body--top:before {
            --groove: #999;
            content: "";
            background: linear-gradient(95deg, transparent, transparent 2%, var(--groove) 2%, var(--groove) 3%, transparent 3%),
                        linear-gradient(75deg, transparent, transparent 47%, var(--groove) 47%, var(--groove) 48%, transparent 48%),
                        linear-gradient(78deg, transparent, transparent 95%, var(--groove) 95%, var(--groove) 96%, transparent 96%);
            position: absolute; height: 55%; width: 40%; left: 36%; bottom: 0;
            clip-path: polygon(0 100%, 0 0, 100% 58%, 100% 100%);
        }
        .truck__body--mid {
            position: absolute; width: 100%; height: 36%; top: 25%; transform: rotate(3deg); transform-origin: top left; z-index: 2;
        }
        .truck__body--mid:after {
            content: ""; position: absolute; background: #1f1f1f; height: 20%; width: 5%; bottom: 20%; right: -0.25%; border-left: 1px solid #1a1a1a;
        }
        .truck__body--mid:before {
            content: ""; position: absolute; background: #0f0f0f; height: 20%; width: 5%; bottom: 5%; right: 0%; border-radius: 0 0 50% 25%; border-left: 1px solid #141414;
        }
        .truck__body--bottom { top: 50%; height: 32%; }
        .truck__rear-bumper {
            position: absolute; height: 1px; width: 9%; background: #808080; top: 38%; left: 2.5%; transform-origin: top left; transform: rotate(3deg);
        }
        .truck__side-skirt {
            height: 1px; width: 43%; position: absolute; bottom: 19%; left: 32%; transform-origin: top left; transform: rotate(1deg); background: #808080;
        }
        .truck__underpanel {
            background: #080808; height: 65%; width: 100%; position: absolute; bottom: 0;
            clip-path: polygon(2% 0, 14% 100%, 88% 100%, 99% 60%, 99% 40%);
        }
        .truck__mid-body {
            --groove: #262626;
            height: 100%; width: 100%;
            background: linear-gradient(84deg, transparent, transparent 36.75%, var(--groove) 36.75%, var(--groove) 37.25%, transparent 37.25%),
                        linear-gradient(83deg, transparent, transparent 55.75%, var(--groove) 55.75%, var(--groove) 56.25%, transparent 56.25%),
                        linear-gradient(88deg, transparent, transparent 75%, var(--groove) 75%, var(--groove) 75.5%, transparent 75.5%),
                        linear-gradient(90deg, transparent, transparent 96%, #1f1f1f 96%),
                        linear-gradient(90deg, transparent, #262626), #333;
            clip-path: polygon(0 0, 3% 100%, 80% 84%, 99.5% 78%, 100% 10%, 98% 0);
        }
        .truck__mid-body:after, .truck__mid-body:before {
            content: ""; position: absolute; width: 4%; height: 4%; left: 38%; top: 6%; border: 1px solid #4d4d4d; border-radius: 25%;
        }
        .truck__mid-body:before { left: 58%; }
        .truck__window {
            --window-black: rgba(0, 0, 0, 0.85);
            --window-white: rgba(255, 255, 255, 0.3);
            position: absolute; height: 80%; width: 60%; background: #000; left: 37%; transform: skew(-5deg);
            clip-path: polygon(0 100%, 0 55%, 34.5% 11%, 85% 108%);
        }
        .truck__window-glass {
            background: linear-gradient(0deg, var(--window-black) 0, var(--window-black) 15%, transparent 15%),
                        linear-gradient(90deg, transparent, var(--window-black) 90%),
                        linear-gradient(90deg, var(--window-white), transparent 80%),
                        linear-gradient(68deg, transparent, transparent 30%, var(--window-black) 30%, var(--window-black) 31%, transparent 31%, transparent 55%, var(--window-black) 55%, var(--window-black) 56%, transparent 56%),
                        var(--window-white);
            position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%); height: 88%; width: 98%;
            clip-path: polygon(0 100%, 0 55%, 34.5% 11%, 85% 105%);
        }
        .truck__window:before {
            content: ""; background: #000; position: absolute; height: 10%; width: 100%; bottom: 0; transform: rotate(2deg); z-index: -1;
            clip-path: polygon(40% 100%, 100% -100%, 100% 100%);
        }
      `}</style>

      <div className="truck">
        <div className="truck__body">
          <div className="truck__body truck__body--top">
            <div className="truck__window">
              <div className="truck__window-glass" />
            </div>
          </div>
          <div className="truck__body truck__body--mid">
            <div className="truck__mid-body" />
          </div>
          <div className="truck__body truck__body--bottom">
            <div className="truck__underpanel" />
            <div className="truck__rear-bumper" />
            <div className="truck__side-skirt" />
          </div>
        </div>
        <div className="truck__wheel truck__wheel--front">
          <div className="truck__wheel-arch" />
          <div className="truck__wheel-arch-trim truck__wheel-arch-trim--top" />
          <div className="truck__wheel-arch-trim truck__wheel-arch-trim--left" />
          <div className="truck__wheel-arch-trim truck__wheel-arch-trim--right" />
          <div className="truck-wheel">
            <div className="truck-wheel__rim">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  style={{ "--index": i } as React.CSSProperties}
                  className="truck-wheel__spoke"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="truck__wheel truck__wheel--rear">
          <div className="truck__wheel-arch" />
          <div className="truck__wheel-arch-trim truck__wheel-arch-trim--top" />
          <div className="truck__wheel-arch-trim truck__wheel-arch-trim--left" />
          <div className="truck__wheel-arch-trim truck__wheel-arch-trim--right" />
          <div className="truck-wheel">
            <div className="truck-wheel__rim">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  style={{ "--index": i } as React.CSSProperties}
                  className="truck-wheel__spoke"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="truck__headlight" />
        <div className="truck__taillight" />
        <div className="truck__indicator" />
        <div className="truck__foglight" />
      </div>
    </div>
  );
};

// --- 3D Tilt Card Component (Light Version) ---
const TiltCard = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25; // Reduced sensitivity
    const y = (e.clientY - top - height / 2) / 25;
    setRotate({ x: -y, y: x });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: "transform 0.1s ease-out",
      }}
      className={`relative transition-all duration-300 h-full ${className}`}
    >
      {children}
    </div>
  );
};

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

  // Forms
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
  });

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

  const filteredTrips = useMemo(() => {
    if (filterType === "ALL") return trips;
    return trips.filter((t) => t.trip_type === filterType);
  }, [trips, filterType]);

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
    setTripForm({
      date: new Date().toISOString().split("T")[0],
      from: trips[0]?.end_location || "", // Auto-suggest start from last destination
      to: "",
      distance: 0,
      type: "BUSINESS",
      startOdo: defaultVehicle?.current_odometer || 0,
      endOdo: defaultVehicle?.current_odometer || 0,
      calcMethod: "ODOMETER",
      purpose: "",
      notes: "",
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
      calcMethod: "MANUAL", // Usually safer to edit as manual distance to avoid messing up odometer logic heavily
      purpose: trip.purpose,
      notes: trip.notes || "",
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
    if (tripForm.distance <= 0 || !tripForm.to) return;

    try {
      if (editingTripId) {
        // Update existing
        await updateEntry(editingTripId, {
          date: tripForm.date,
          start_location: tripForm.from,
          end_location: tripForm.to,
          kilometers: tripForm.distance,
          trip_type: tripForm.type as TripType,
          purpose: tripForm.purpose || "",
          vehicle_type: "car", // Default, should be from form
          is_private_vehicle: false, // Default, should be from form
          notes: tripForm.notes,
        });
      } else {
        // Create new
        await createEntry({
          date: tripForm.date,
          start_location: tripForm.from,
          end_location: tripForm.to,
          kilometers: tripForm.distance,
          trip_type: tripForm.type as TripType,
          purpose: tripForm.purpose || "",
          vehicle_type: "car", // Default, should be from form
          is_private_vehicle: false, // Default, should be from form
          notes: tripForm.notes,
        });

        // Note: Vehicle odometer update will be handled separately by VehicleManager
      }

      setIsTripModalOpen(false);
    } catch (err) {
      console.error("Failed to save trip:", err);
      alert("Nie udało się zapisać trasy");
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

        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="hidden md:flex items-center gap-2 px-5 py-3 bg-white text-slate-600 rounded-2xl font-bold border border-slate-200 shadow-sm hover:shadow-md hover:text-ocean-600 transition-all"
          >
            <Download size={20} />
            <span>Eksport CSV</span>
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

      {/* --- 3D Stats & Vehicle Cockpit --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Vehicle Card (With Truck Animation) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <TiltCard>
            <div className="h-full bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 relative overflow-hidden group">
              {/* Animation Header */}
              <div className="absolute top-0 left-0 right-0 h-36 bg-slate-50 rounded-t-[2rem] border-b border-slate-100 overflow-hidden flex items-center justify-center">
                <TruckAnimation />
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between mt-32 pt-4">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                      Aktywny Pojazd
                    </h3>
                    <h4 className="text-xl font-black text-slate-800">
                      {defaultVehicle?.name || "Brak pojazdu"}
                    </h4>
                    {defaultVehicle && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mt-1">
                        <Fuel size={14} className="text-slate-400" />{" "}
                        {defaultVehicle.fuel_type || "N/A"} •{" "}
                        {defaultVehicle.registration_year || "N/A"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dutch License Plate Visualization */}
                {defaultVehicle?.license_plate ? (
                  <div className="my-4 bg-[#ffba00] text-black border-2 border-black rounded-lg px-4 py-3 font-black text-center text-3xl tracking-widest shadow-lg relative max-w-[260px] mx-auto transform group-hover:scale-105 transition-transform duration-300">
                    <div className="absolute left-0 top-0 bottom-0 bg-blue-700 w-8 flex flex-col items-center justify-center rounded-l-md border-r border-black">
                      <span className="text-[8px] text-white font-normal mt-1">
                        EU
                      </span>
                      <span className="text-white text-xs font-bold">NL</span>
                    </div>
                    <span className="ml-6 font-mono">
                      {defaultVehicle.license_plate}
                    </span>
                  </div>
                ) : (
                  <div className="my-4 p-6 bg-slate-50 rounded-xl text-center">
                    <p className="text-slate-400 text-sm">
                      Brak tablicy rejestracyjnej
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">
                      Stan Licznika (ODO)
                    </p>
                    <p className="text-2xl font-black text-slate-800 font-mono">
                      {defaultVehicle?.current_odometer?.toLocaleString() ||
                        "0"}{" "}
                      <span className="text-sm text-slate-400 font-bold">
                        km
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsVehicleModalOpen(true);
                    }}
                    className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-2xl hover:scale-110 font-bold"
                    title="Zarządzaj Pojazdami"
                  >
                    <Settings size={20} />
                  </button>
                </div>
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
                  Przebieg 2024
                </h3>
                <div className="text-4xl font-black text-slate-800 mb-1">
                  {stats.totalDist.toLocaleString()}
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  Kilometrów łącznie
                </p>
              </div>
            </div>
          </TiltCard>

          {/* Allowance */}
          <TiltCard>
            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-lg hover:shadow-xl transition-all h-full group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <FileSpreadsheet size={80} className="text-emerald-800" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                  Zwrot (0.23€)
                </h3>
                <div className="text-4xl font-black text-emerald-600 mb-1">
                  €{stats.reimbursement.toFixed(2)}
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  Wolne od podatku
                </p>
              </div>
            </div>
          </TiltCard>

          {/* Private vs Business */}
          <TiltCard>
            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-lg hover:shadow-xl transition-all h-full group relative overflow-hidden">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-6">
                    Struktura Jazdy
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>{" "}
                        Biznes
                      </span>
                      <span className="font-bold text-slate-800">
                        {stats.businessDist} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>{" "}
                        Dojazd
                      </span>
                      <span className="font-bold text-slate-800">
                        {stats.commuteDist} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm opacity-60">
                      <span className="flex items-center gap-2 font-medium text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>{" "}
                        Prywatne
                      </span>
                      <span className="font-bold text-slate-800">
                        {stats.privateDist} km
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-4 flex overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{
                      width: `${(stats.businessDist / stats.totalDist) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="bg-purple-500 h-full"
                    style={{
                      width: `${(stats.commuteDist / stats.totalDist) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="bg-slate-400 h-full"
                    style={{
                      width: `${(stats.privateDist / stats.totalDist) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>

      {/* --- Trip List (Clean & Modern) --- */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <History className="text-ocean-500" /> Historia Tras
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Szczegółowy rejestr przejazdów
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
        title={editingTripId ? "Edytuj Trasę" : "Nowa Trasa (Nieuwe Rit)"}
      >
        <div className="space-y-8">
          {/* Toggle: Manual vs Odometer */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() =>
                setTripForm((p) => ({ ...p, calcMethod: "ODOMETER" }))
              }
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                tripForm.calcMethod === "ODOMETER"
                  ? "bg-white text-ocean-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Gauge size={16} /> Według Licznika
            </button>
            <button
              onClick={() =>
                setTripForm((p) => ({ ...p, calcMethod: "MANUAL" }))
              }
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                tripForm.calcMethod === "MANUAL"
                  ? "bg-white text-ocean-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Navigation size={16} /> Ręczny Dystans
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Data
                </label>
                <input
                  type="date"
                  value={tripForm.date}
                  onChange={(e) =>
                    setTripForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Rodzaj
                </label>
                <select
                  value={tripForm.type}
                  onChange={(e) =>
                    setTripForm((p) => ({ ...p, type: e.target.value }))
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none font-bold text-slate-800 appearance-none"
                >
                  {TRIP_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative pl-8 space-y-5">
              {/* Timeline Line */}
              <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-slate-200"></div>
              <div className="absolute left-[5px] top-4 w-3 h-3 rounded-full bg-white border-2 border-slate-300 z-10"></div>
              <div className="absolute left-[5px] bottom-4 w-3 h-3 rounded-full bg-ocean-500 border-2 border-white shadow-sm z-10"></div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Początek (Van)
                </label>
                <input
                  type="text"
                  value={tripForm.from}
                  onChange={(e) =>
                    setTripForm((p) => ({ ...p, from: e.target.value }))
                  }
                  placeholder="np. 1012 AB Amsterdam lub Keizersgracht 100, Amsterdam"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none text-sm placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Cel (Naar)
                </label>
                <input
                  type="text"
                  value={tripForm.to}
                  onChange={(e) =>
                    setTripForm((p) => ({ ...p, to: e.target.value }))
                  }
                  placeholder="np. 3011 AB Rotterdam lub Markthal, Rotterdam"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none text-sm placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Auto-calculate TYLKO w trybie MANUAL */}
            {tripForm.calcMethod === "MANUAL" && (
              <>
                {/* Success badge */}
                {distanceCalculated && (
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-900">
                          ✅ Dystans obliczony: {distanceCalculated.km} km
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5 truncate">
                          {distanceCalculated.from} → {distanceCalculated.to}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDistanceCalculated(null)}
                        className="text-emerald-400 hover:text-emerald-600 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-emerald-100"
                        aria-label="Zamknij"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Auto-calculate distance button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={calculateDistance}
                    disabled={
                      isCalculatingDistance || !tripForm.from || !tripForm.to
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                  >
                    {isCalculatingDistance ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Obliczam...
                      </>
                    ) : (
                      <>
                        <Navigation size={16} />
                        Oblicz dystans automatycznie
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {tripForm.calcMethod === "ODOMETER" ? (
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Start ODO
                  </label>
                  <input
                    type="number"
                    value={tripForm.startOdo}
                    onChange={(e) =>
                      setTripForm((p) => ({
                        ...p,
                        startOdo: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-lg font-mono font-bold text-slate-700 focus:ring-2 focus:ring-ocean-500 outline-none"
                  />
                </div>
                <div className="flex items-center justify-center pt-5 text-slate-300">
                  <ArrowRight size={24} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Koniec ODO
                  </label>
                  <input
                    type="number"
                    value={tripForm.endOdo}
                    onChange={(e) =>
                      setTripForm((p) => ({
                        ...p,
                        endOdo: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-ocean-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none text-2xl font-black text-slate-800"
                />
              </div>
            )}

            {/* Result Preview */}
            <div className="flex justify-between items-center p-4 bg-ocean-50 rounded-xl border border-ocean-100">
              <span className="text-sm font-bold text-ocean-800 flex items-center gap-2">
                <CheckCircle2 size={18} /> Obliczony Dystans:
              </span>
              <span className="text-2xl font-black text-ocean-600">
                {tripForm.distance} km
              </span>
            </div>

            {/* Purpose field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Cel podróży (Doel)
              </label>
              <input
                type="text"
                value={tripForm.purpose}
                onChange={(e) =>
                  setTripForm((p) => ({ ...p, purpose: e.target.value }))
                }
                placeholder="np. Wizyta u klienta, spotkanie projektowe"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none text-sm placeholder:text-slate-300"
              />
            </div>

            {/* Notes field */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Notatki (optioneel)
              </label>
              <textarea
                value={tripForm.notes}
                onChange={(e) =>
                  setTripForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Dodatkowe uwagi"
                rows={2}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ocean-500 outline-none text-sm placeholder:text-slate-300 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSaveTrip}
            className="w-full py-4 bg-ocean-600 text-white font-bold rounded-xl shadow-lg shadow-ocean-200 hover:bg-ocean-700 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />{" "}
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
