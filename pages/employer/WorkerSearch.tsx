import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/Modal";
import { useToasts } from "../../contexts/ToastContext";
import { SubscriptionBadge } from "../../src/components/SubscriptionBadge";
import { ReviewWorkerModal } from "../../src/components/employer/ReviewWorkerModal";
import { WorkerReviews } from "../../src/components/WorkerReviews"; // NEW: Worker reviews display
import type { SubscriptionTier } from "../../src/types/subscription";
import {
  fetchWorkers,
  type WorkerWithProfile,
} from "../../src/services/workers";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AddToTeamButton } from "../../components/AddToTeamButton";
import {
  saveProfile,
  removeSavedProfile,
  getSavedProfileRecord,
  getSavedProfileIds,
} from "../../services/savedProfilesService";

interface Worker {
  id: string;
  profile_id?: string; // ✅ NEW: Profile ID for FK constraints
  fullName: string;
  photo: string;
  categories: Array<{
    category: string;
    level: "Junior" | "Mid" | "Senior";
    yearsExperience: number;
    preferredRate: number;
  }>;
  city: string;
  workLanguages: string[];
  rating: number;
  reviewsCount: number;
  certificateId: string;
  availability: "active" | "busy";
  is_available: boolean; // ✅ NEW: Real availability from database
  // NEW: Subscription system
  subscription_tier: SubscriptionTier;
  zzp_certificate_issued: boolean;
  zzp_certificate_number: string | null;
  // ✅ FAZA 3: Admin-verified categories (NOT self-declared!)
  approved_categories?: string[]; // From workers.approved_categories column
  email?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  // Team/Duo fields
  worker_type?:
    | "individual"
    | "team_leader"
    | "duo_partner"
    | "helper_available";
  team_size?: number;
  team_description?: string;
  team_hourly_rate?: number;
  is_on_demand_available?: boolean;
}

// Mock data - 15 categories z specyfikacji
const MOCK_WORKERS: Worker[] = [
  {
    id: "1",
    fullName: "Maria Silva",
    photo: "https://i.pravatar.cc/150?img=1",
    categories: [
      {
        category: "malowanie",
        level: "Senior",
        yearsExperience: 8,
        preferredRate: 45,
      },
    ],
    city: "Amsterdam",
    workLanguages: ["nl", "en", "pl"],
    rating: 4.8,
    reviewsCount: 24,
    certificateId: "CERT-2025-001",
    availability: "active",
    // NEW: Subscription info
    subscription_tier: "premium",
    zzp_certificate_issued: true,
    zzp_certificate_number: "ZZP-20250001",
    email: "maria.silva@example.com",
    phone: "+31 6 1234 5678",
    bio: "Doświadczona malarka z 8-letnim stażem. Specjalizuję się w wysokiej jakości wykończeniach wewnętrznych i zewnętrznych. Perfekcjonistka z dbałością o szczegóły.",
    skills: [
      "Malowanie wewnętrzne",
      "Elewacje",
      "Tapetowanie",
      "Szpachlowanie",
      "Techniki dekoracyjne",
    ],
  },
  {
    id: "2",
    fullName: "Jan Kowalski",
    photo: "https://i.pravatar.cc/150?img=2",
    categories: [
      {
        category: "murarz_tynkarz",
        level: "Mid",
        yearsExperience: 5,
        preferredRate: 40,
      },
    ],
    city: "Rotterdam",
    workLanguages: ["pl", "nl"],
    rating: 4.6,
    reviewsCount: 18,
    certificateId: "CERT-2025-002",
    availability: "active",
    // NEW: Basic tier (bez certyfikatu)
    subscription_tier: "basic",
    zzp_certificate_issued: false,
    zzp_certificate_number: null,
    email: "jan.kowalski@example.com",
    phone: "+31 6 2345 6789",
    bio: "Solidny murarz z 5-letnim doświadczeniem w Holandii. Pracowałem przy projektach mieszkaniowych i komercyjnych. Punktualny i rzetelny.",
    skills: [
      "Murowanie tradycyjne",
      "Tynkowanie maszynowe",
      "Ściany działowe",
      "Elewacje",
      "Izolacje",
    ],
  },
  {
    id: "3",
    fullName: "Ahmed Hassan",
    photo: "https://i.pravatar.cc/150?img=3",
    categories: [
      {
        category: "elektryk",
        level: "Senior",
        yearsExperience: 10,
        preferredRate: 55,
      },
    ],
    city: "Utrecht",
    workLanguages: ["ar", "nl", "en"],
    rating: 4.9,
    reviewsCount: 32,
    certificateId: "CERT-2025-003",
    availability: "active",
    // NEW: Premium tier
    subscription_tier: "premium",
    zzp_certificate_issued: true,
    zzp_certificate_number: "ZZP-20250002",
    email: "ahmed.hassan@example.com",
    phone: "+31 6 3456 7890",
    bio: "Certyfikowany elektryk SEP z 10-letnim doświadczeniem. Specjalizuję się w instalacjach przemysłowych i inteligentnych systemach domowych.",
    skills: [
      "Instalacje elektryczne",
      "SEP certyfikat",
      "Smart home",
      "Panele fotowoltaiczne",
      "Rozdzielnie elektryczne",
    ],
  },
  {
    id: "4",
    fullName: "Peter van Dam",
    photo: "https://i.pravatar.cc/150?img=4",
    categories: [
      {
        category: "hydraulik_hvac",
        level: "Senior",
        yearsExperience: 12,
        preferredRate: 50,
      },
    ],
    city: "Den Haag",
    workLanguages: ["nl", "en"],
    rating: 4.7,
    reviewsCount: 28,
    certificateId: "CERT-2025-004",
    availability: "busy",
    // NEW: Premium tier
    subscription_tier: "premium",
    zzp_certificate_issued: true,
    zzp_certificate_number: "ZZP-2025-003",
    email: "peter.vandam@example.com",
    phone: "+31 6 4567 8901",
    bio: "Ekspert w zakresie instalacji sanitarnych i HVAC. 12 lat doświadczenia w projektach komercyjnych i mieszkaniowych. Znany z wysokiej jakości pracy.",
    skills: [
      "Instalacje wod-kan",
      "Ogrzewanie podłogowe",
      "Systemy HVAC",
      "Pompy ciepła",
      "Klimatyzacja",
    ],
  },
];

const BUILDING_CATEGORIES = [
  { value: "murarz_tynkarz", label: "Murarz/Tynkarz" },
  { value: "ciesla_dekarz", label: "Cieśla/Dekarz" },
  { value: "elektryk", label: "Elektryk SEP" },
  { value: "hydraulik_hvac", label: "Hydraulik/HVAC" },
  { value: "malowanie", label: "Malowanie" },
  { value: "stolarka", label: "Stolarka" },
  { value: "sucha_zabudowa", label: "Sucha zabudowa" },
  // ❌ REMOVED 2025-01-16: { value: "sprzatanie", label: "Sprzątanie" } - moved to CleaningCompanySearch
  { value: "ogrodzenia", label: "Ogrodzenia/Bramy" },
  { value: "kierownik", label: "Kierownik budowy" },
  { value: "posadzkarz", label: "Posadzkarz" },
  { value: "elewacje", label: "Elewacje" },
  { value: "fotowoltaika", label: "Fotowoltaika" },
  { value: "brukarz", label: "Brukarz" },
  { value: "glazurnik", label: "Glazurnik" },
  { value: "other", label: "Inne" },
];

const WORK_LANGUAGES = [
  { value: "nl", label: "Nederlands" },
  { value: "en", label: "English" },
  { value: "pl", label: "Polski" },
  { value: "tr", label: "Türkçe" },
  { value: "bg", label: "Български" },
  { value: "ar", label: "العربية" },
  { value: "de", label: "Deutsch" },
  { value: "hu", label: "Magyar" },
  { value: "fr", label: "Français" },
];

export const WorkerSearch = () => {
  const { t } = useTranslation();
  const { success, error: showError } = useToasts();
  const { user } = useAuth();
  const navigate = useNavigate();

  // NEW: Load real workers from database
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [employerId, setEmployerId] = useState<string | null>(null); // NEW: Store employer ID

  // ✅ FAZA 3: Employer subscription state (Basic vs Premium paywall)
  const [employerSubscription, setEmployerSubscription] = useState<
    "basic" | "premium" | null
  >(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLevel, setFilterLevel] = useState<string[]>([]);
  const [filterCity, setFilterCity] = useState("");
  const [filterLanguages, setFilterLanguages] = useState<string[]>([]);
  const [rateMin, setRateMin] = useState(5);
  const [rateMax, setRateMax] = useState(200);
  // NEW: Subscription filter
  const [filterSubscriptionTier, setFilterSubscriptionTier] = useState<
    "all" | "premium" | "basic"
  >("all");
  // NEW: Worker type filter (Team/Solo/Springer)
  const [filterWorkerType, setFilterWorkerType] = useState<
    "all" | "individual" | "team" | "springer"
  >("all");
  const [savedWorkers, setSavedWorkers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const workersPerPage = 12;

  // Modal states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubject, setContactSubject] = useState("");

  // NEW: Fetch employer ID on mount
  useEffect(() => {
    async function fetchEmployerId() {
      if (!user) return;

      try {
        const { getEmployerByUserId } = await import(
          "../../services/employerService"
        );
        const employer = await getEmployerByUserId(user.id);

        if (employer) {
          setEmployerId(employer.id);
          console.log("[WORKER-SEARCH] Employer ID:", employer.id);

          // ✅ FAZA 3: Load employer subscription tier
          const { data: employerData, error: subError } = await supabase
            .from("employers")
            .select("subscription_tier, subscription_status")
            .eq("id", employer.id)
            .single();

          if (subError) {
            console.error(
              "[WORKER-SEARCH] Error loading subscription:",
              subError
            );
            setEmployerSubscription("basic"); // Default to basic on error
          } else if (employerData?.subscription_status === "active") {
            setEmployerSubscription(
              employerData.subscription_tier as "basic" | "premium"
            );
            console.log(
              "[WORKER-SEARCH] 🎟️ Subscription:",
              employerData.subscription_tier
            );
          } else {
            setEmployerSubscription("basic"); // Inactive/expired = basic
            console.log(
              "[WORKER-SEARCH] ⚠️ No active subscription, defaulting to basic"
            );
          }
        } else {
          console.warn("[WORKER-SEARCH] No employer found for user:", user.id);
        }
      } catch (err) {
        console.error("[WORKER-SEARCH] Error fetching employer ID:", err);
      }
    }

    fetchEmployerId();
  }, [user]);

  // ✅ UPDATED: Load saved workers using universal savedProfilesService
  useEffect(() => {
    async function loadSavedWorkers() {
      if (!user?.id) return;

      try {
        const savedIds = await getSavedProfileIds(user.id, "worker");
        setSavedWorkers(savedIds);
        console.log("[WORKER-SEARCH] Loaded saved workers:", savedIds.length);
      } catch (err) {
        console.error("[WORKER-SEARCH] Error loading saved workers:", err);
      }
    }

    loadSavedWorkers();
  }, [user?.id]);

  // NEW: Fetch workers from database on component mount
  useEffect(() => {
    async function loadWorkers() {
      try {
        setLoading(true);
        const workersData = await fetchWorkers();

        // Transform database workers to match Worker interface
        const transformedWorkers: Worker[] = workersData.map(
          (w: WorkerWithProfile) => ({
            id: w.id,
            profile_id: w.profile_id, // ✅ NEW: Include profile_id for FK constraints
            fullName: w.profile?.full_name || "Unknown",
            photo:
              w.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                w.id
              )}`,
            categories: [
              {
                category: w.specialization || "other",
                level: "Mid" as const, // Default level - TODO: add experience_level to workers table
                yearsExperience: w.experience_years || 0,
                preferredRate: w.hourly_rate || 0,
              },
            ],
            city: w.location_city || "Unknown",
            workLanguages: w.languages || ["nl"],
            rating: w.rating || 0,
            reviewsCount: w.rating_count || 0,
            certificateId: w.zzp_certificate_number || "N/A",
            availability: w.is_available ? "active" : "busy", // ✅ Real status from DB
            is_available: w.is_available ?? true, // ✅ Real availability from database
            subscription_tier:
              (w.subscription_tier as SubscriptionTier) || "basic",
            zzp_certificate_issued: w.zzp_certificate_issued || false,
            zzp_certificate_number: w.zzp_certificate_number || null,
            // ✅ FAZA 3: Admin-verified categories (certification system)
            approved_categories: w.approved_categories || [],
            email: w.profile?.email,
            phone: w.phone || undefined,
            bio: w.bio || undefined,
            skills: w.certifications || [],
            // Team/Duo fields
            worker_type: (w as any).worker_type || "individual",
            team_size: (w as any).team_size || 1,
            team_description: (w as any).team_description || undefined,
            team_hourly_rate: (w as any).team_hourly_rate || undefined,
            is_on_demand_available: (w as any).is_on_demand_available || false,
          })
        );

        setWorkers(transformedWorkers);
        console.log(
          "[WORKER-SEARCH] Loaded workers:",
          transformedWorkers.length
        );
      } catch (err) {
        console.error("[WORKER-SEARCH] Error loading workers:", err);
        showError("Nie udało się załadować pracowników");
      } finally {
        setLoading(false);
      }
    }

    loadWorkers();
  }, []);

  const filteredWorkers = workers.filter((worker) => {
    // ✅ FAZA 3: Basic vs Premium Paywall (FILTER FIRST before other filters!)
    if (employerSubscription === "basic") {
      // Basic employer: HIDE certified workers (paywall)
      if (worker.zzp_certificate_issued) {
        return false; // Skip certified workers
      }
    }
    // Premium employer: sees ALL workers (no paywall)

    const matchesSearch =
      worker.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.city.toLowerCase().includes(searchTerm.toLowerCase());

    // ✅ FAZA 3: FIX - Use approved_categories (admin-verified) instead of self-declared
    const matchesCategory =
      filterCategory === "all" ||
      (worker.approved_categories &&
        worker.approved_categories.includes(filterCategory)) || // Admin-verified categories
      worker.categories.some((cat) => cat.category === filterCategory); // Fallback to self-declared (for non-certified workers)

    const matchesLevel =
      filterLevel.length === 0 ||
      worker.categories.some((cat) => filterLevel.includes(cat.level));

    const matchesCity =
      !filterCity ||
      worker.city.toLowerCase().includes(filterCity.toLowerCase());

    const matchesLanguages =
      filterLanguages.length === 0 ||
      filterLanguages.every((lang) => worker.workLanguages.includes(lang));

    const matchesRate = worker.categories.some(
      (cat) => cat.preferredRate >= rateMin && cat.preferredRate <= rateMax
    );

    // NEW: Subscription tier filter
    const matchesSubscription =
      filterSubscriptionTier === "all" ||
      worker.subscription_tier === filterSubscriptionTier;

    // NEW: Worker type filter (Team/Solo/Springer)
    const matchesWorkerType = (() => {
      if (filterWorkerType === "all") return true;
      if (filterWorkerType === "individual")
        return worker.worker_type === "individual" || !worker.worker_type;
      if (filterWorkerType === "team")
        return (
          worker.worker_type === "team_leader" ||
          worker.worker_type === "duo_partner"
        );
      if (filterWorkerType === "springer")
        return worker.is_on_demand_available === true;
      return true;
    })();

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesCity &&
      matchesLanguages &&
      matchesRate &&
      matchesSubscription &&
      matchesWorkerType
    );
  });

  // NEW: Sort Premium first (when "all" selected)
  const sortedWorkers =
    filterSubscriptionTier === "all"
      ? [...filteredWorkers].sort((a, b) => {
          if (
            a.subscription_tier === "premium" &&
            b.subscription_tier === "basic"
          )
            return -1;
          if (
            a.subscription_tier === "basic" &&
            b.subscription_tier === "premium"
          )
            return 1;
          return b.rating - a.rating; // Secondary sort by rating
        })
      : filteredWorkers;

  const indexOfLastWorker = currentPage * workersPerPage;
  const indexOfFirstWorker = indexOfLastWorker - workersPerPage;
  const currentWorkers = sortedWorkers.slice(
    indexOfFirstWorker,
    indexOfLastWorker
  );
  const totalPages = Math.ceil(sortedWorkers.length / workersPerPage);

  // ✅ UPDATED: Real save/unsave worker using universal savedProfilesService
  const toggleSaveWorker = async (workerId: string) => {
    if (!user?.id) {
      showError("Zaloguj się, aby zapisać pracownika");
      return;
    }

    try {
      const isSaved = savedWorkers.includes(workerId);

      if (isSaved) {
        // Find and remove saved record
        const savedRecord = await getSavedProfileRecord(
          user.id,
          "worker",
          workerId
        );

        if (savedRecord) {
          const removed = await removeSavedProfile(savedRecord.id);

          if (removed) {
            setSavedWorkers((prev) => prev.filter((id) => id !== workerId));
            success("✅ Usunięto z zapisanych");
          }
        }
      } else {
        // Save worker
        const saved = await saveProfile(user.id, "worker", workerId);

        if (saved) {
          setSavedWorkers((prev) => [...prev, workerId]);
          success("✅ Zapisano pracownika");
        }
      }
    } catch (error) {
      console.error("Error toggling save worker:", error);
      showError("❌ Błąd podczas zapisywania");
    }
  };

  const handleLevelChange = (level: string) => {
    setFilterLevel((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleLanguageChange = (lang: string) => {
    setFilterLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleOpenProfile = async (worker: Worker) => {
    console.log("🔗 WORKER CARD CLICKED:", {
      workerId: worker.id,
      workerName: worker.fullName,
      navigateTo: `/worker/profile/${worker.id}`,
    });

    // Navigate to full profile page instead of modal
    navigate(`/worker/profile/${worker.id}`);

    // Increment profile view count
    try {
      const { error } = await supabase.rpc("increment_profile_views" as any, {
        p_worker_id: worker.id,
      });

      if (error) {
        console.error("Error incrementing profile views:", error);
      } else {
        console.log("✅ Profile view counted for worker:", worker.fullName);
      }
    } catch (err) {
      console.error("Error calling increment_profile_views:", err);
    }
  };

  const handleOpenContact = (worker: Worker) => {
    setSelectedWorker(worker);
    setContactSubject(`Zapytanie o projekt - ${worker.fullName}`);
    setContactMessage("");
    setIsContactModalOpen(true);
  };

  const handleSendContact = () => {
    if (!contactSubject || !contactMessage) {
      showError("Proszę wypełnić wszystkie pola");
      return;
    }
    success(`✅ Wiadomość wysłana do ${selectedWorker?.fullName}!`);
    setIsContactModalOpen(false);
    setContactSubject("");
    setContactMessage("");
  };

  // NEW: Handle opening review modal
  const handleOpenReview = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsReviewModalOpen(true);
  };

  // NEW: Handle successful review submission
  const handleReviewSuccess = () => {
    success(
      `✅ Dziękujemy za wystawienie opinii dla ${selectedWorker?.fullName}!`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Wyszukiwarka Pracowników
          </h1>
          <p className="mt-2 text-gray-600">
            Znajdź wykwalifikowanych pracowników budowlanych z certyfikatami
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Filtry</h2>

              {/* Search */}
              <div className="mb-6">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Szukaj
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Imię, nazwisko, miasto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Kategoria
                </label>
                <select
                  id="category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Wszystkie kategorie</option>
                  {BUILDING_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Poziom doświadczenia
                </p>
                {["Junior", "Mid", "Senior"].map((level) => (
                  <label key={level} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={filterLevel.includes(level)}
                      onChange={() => handleLevelChange(level)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{level}</span>
                  </label>
                ))}
              </div>

              {/* City */}
              <div className="mb-6">
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Miasto
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder="np. Amsterdam"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Languages */}
              <div className="mb-6">
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Języki pracy
                </p>
                <div className="max-h-40 overflow-y-auto">
                  {WORK_LANGUAGES.map((lang) => (
                    <label key={lang.value} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={filterLanguages.includes(lang.value)}
                        onChange={() => handleLanguageChange(lang.value)}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {lang.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subscription Tier */}
              <div className="mb-6">
                <label
                  htmlFor="subscription-tier"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Typ subskrypcji
                </label>
                <select
                  id="subscription-tier"
                  value={filterSubscriptionTier}
                  onChange={(e) =>
                    setFilterSubscriptionTier(
                      e.target.value as "all" | "premium" | "basic"
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Wszyscy pracownicy</option>
                  <option value="premium">🏆 Premium - Zweryfikowani</option>
                  <option value="basic">🔵 Basic Members</option>
                </select>
              </div>

              {/* Worker Type (Team/Solo/Springer) */}
              <div className="mb-6">
                <label
                  htmlFor="worker-type"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sposób pracy
                </label>
                <select
                  id="worker-type"
                  value={filterWorkerType}
                  onChange={(e) =>
                    setFilterWorkerType(
                      e.target.value as
                        | "all"
                        | "individual"
                        | "team"
                        | "springer"
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Wszyscy</option>
                  <option value="individual">🧑 Solo - Samodzielny</option>
                  <option value="team">👥 Zespół / Duo</option>
                  <option value="springer">⚡ Springer - Na żądanie</option>
                </select>
              </div>

              {/* Hourly Rate */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stawka godzinowa: €{rateMin} - €{rateMax}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="5"
                    max="200"
                    value={rateMin}
                    onChange={(e) => setRateMin(Number(e.target.value))}
                    className="w-full"
                    aria-label="Minimalna stawka godzinowa"
                  />
                  <input
                    type="range"
                    min="5"
                    max="200"
                    value={rateMax}
                    onChange={(e) => setRateMax(Number(e.target.value))}
                    className="w-full"
                    aria-label="Maksymalna stawka godzinowa"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("all");
                  setFilterLevel([]);
                  setFilterCity("");
                  setFilterLanguages([]);
                  setRateMin(5);
                  setRateMax(200);
                  setFilterSubscriptionTier("all");
                  setFilterWorkerType("all");
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Wyczyść filtry
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* ✅ FAZA 3: Basic vs Premium Paywall Banner */}
            {employerSubscription === "basic" && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400/50 rounded-xl p-6 mb-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">🔒</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-yellow-900 mb-2">
                      Upgrade do Premium (€25/miesiąc)
                    </h3>
                    <p className="text-yellow-800 mb-3">
                      Aktualnie korzystasz z <strong>konta Basic</strong> i
                      widzisz tylko{" "}
                      <strong>niecertyfikowanych pracowników</strong>. Aby
                      zobaczyć{" "}
                      <strong>wszystkich certyfikowanych ZZP'ers</strong> z
                      potwierdzonymi kwalifikacjami, uaktualnij do Premium.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate("/employer/subscription")}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:shadow-xl transition-all hover:scale-105"
                      >
                        ⚡ Upgrade Now
                      </button>
                      <button
                        onClick={() =>
                          navigate("/employer/subscription#benefits")
                        }
                        className="px-6 py-3 bg-white text-yellow-800 font-medium rounded-lg border-2 border-yellow-400 hover:bg-yellow-50 transition-colors"
                      >
                        Zobacz korzyści Premium
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Workers Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Premium ZZP'ers zichtbaar
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    U ziet alleen gecertificeerde ZZP'ers met een Premium
                    abonnement. Deze professionals hebben hun expertise laten
                    toetsen en zijn volledig geverifieerd.
                  </p>
                </div>
              </div>
            </div>

            {/* Results Header */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-700">
                  Znaleziono{" "}
                  <span className="font-bold">{filteredWorkers.length}</span>{" "}
                  pracowników
                </p>
                <p className="text-sm text-gray-500">
                  Zapisanych:{" "}
                  <span className="font-medium">{savedWorkers.length}</span>
                </p>
              </div>
            </div>

            {/* Workers Grid */}
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                  <p className="text-gray-600">Ładowanie pracowników...</p>
                </div>
              </div>
            ) : workers.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Brak pracowników
                </h3>
                <p className="text-gray-600">
                  Nie znaleziono żadnych pracowników w bazie danych.
                </p>
              </div>
            ) : currentWorkers.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Brak wyników
                </h3>
                <p className="text-gray-600">
                  Nie znaleziono pracowników spełniających wybrane kryteria.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("all");
                    setFilterLevel([]);
                    setFilterCity("");
                    setFilterLanguages([]);
                    setRateMin(5);
                    setRateMax(200);
                    setFilterSubscriptionTier("all");
                    setFilterWorkerType("all");
                  }}
                  className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Wyczyść filtry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow relative"
                  >
                    {/* Rating badge - top right - TYLKO jeśli są opinie */}
                    {worker.reviewsCount > 0 && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-white rounded-full shadow-lg px-3 py-2 flex items-center gap-1">
                          <span className="text-lg font-bold">
                            {parseFloat(worker.rating.toString()).toFixed(1)}
                          </span>
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({worker.reviewsCount})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* LARGE RECTANGULAR PHOTO - 256px height */}
                    <div className="relative h-64 bg-gradient-to-br from-orange-50 to-orange-100">
                      <img
                        src={worker.photo}
                        alt={worker.fullName}
                        className="w-full h-full object-cover"
                      />

                      {/* Availability badge on photo */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        {worker.is_available ? (
                          <span className="bg-green-500 text-white px-5 py-2 rounded-full whitespace-nowrap flex items-center gap-2">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            Dostępny
                          </span>
                        ) : (
                          <span className="bg-gray-600 text-white px-5 py-2 rounded-full whitespace-nowrap">
                            Niedostępny
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Worker info - centered */}
                    <div className="px-6 py-4 text-center">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {worker.fullName}
                      </h3>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        📍 {worker.city}
                      </p>

                      {/* Badges row */}
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        {worker.subscription_tier === "premium" && (
                          <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                            ✓ Zweryfikowany
                          </span>
                        )}
                        {/* Team/Duo badges */}
                        {worker.worker_type === "team_leader" && (
                          <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium border border-orange-200">
                            👥 Zespół {worker.team_size || 2}os.
                          </span>
                        )}
                        {worker.worker_type === "duo_partner" && (
                          <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200">
                            🤝 Duo
                          </span>
                        )}
                        {worker.worker_type === "helper_available" && (
                          <span className="inline-block bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full text-sm font-medium border border-teal-200">
                            🆘 Helper
                          </span>
                        )}
                        {worker.is_on_demand_available && (
                          <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-sm font-medium border border-yellow-200">
                            ⚡ Springer
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-6 pb-6 flex gap-3">
                      <button
                        onClick={() => handleOpenProfile(worker)}
                        className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                      >
                        Zobacz profil
                      </button>
                      <button
                        onClick={() => toggleSaveWorker(worker.id)}
                        className={`px-4 py-3 rounded-xl transition-colors ${
                          savedWorkers.includes(worker.id)
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        aria-label={
                          savedWorkers.includes(worker.id)
                            ? "Usuń z zapisanych"
                            : "Zapisz pracownika"
                        }
                      >
                        <span className="text-xl">⭐</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Poprzednia
                </button>
                <span className="text-sm text-gray-700">
                  Strona {currentPage} z {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Następna
                </button>
              </div>
            )}

            {filteredWorkers.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">
                  Nie znaleziono pracowników spełniających kryteria.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Spróbuj zmienić filtry wyszukiwania.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Worker Profile */}
      {selectedWorker && (
        <Modal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          title={selectedWorker.fullName}
          size="xl"
        >
          <div className="space-y-6">
            {/* Header with photo and basic info */}
            <div className="flex items-start gap-6 pb-6 border-b">
              <img
                src={selectedWorker.photo}
                alt={selectedWorker.fullName}
                className="w-32 h-32 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedWorker.fullName}
                </h3>
                <p className="text-gray-600 mb-3">📍 {selectedWorker.city}</p>
                <div className="flex items-center gap-4 mb-3">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      selectedWorker.is_available
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedWorker.is_available
                      ? "✓ Dostępny"
                      : "✗ Niedostępny"}
                  </span>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 font-medium text-gray-900">
                      {selectedWorker.rating}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({selectedWorker.reviewsCount} opinii)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {selectedWorker.bio && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">O mnie</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedWorker.bio}
                </p>
              </div>
            )}

            {/* Categories & Rates */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Specjalizacje
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedWorker.categories.map((cat, idx) => (
                  <div key={idx} className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-blue-900">
                      {BUILDING_CATEGORIES.find((c) => c.value === cat.category)
                        ?.label || cat.category}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Poziom: <span className="font-semibold">{cat.level}</span>
                    </p>
                    <p className="text-sm text-blue-700">
                      Doświadczenie:{" "}
                      <span className="font-semibold">
                        {cat.yearsExperience}+ lat
                      </span>
                    </p>
                    <p className="text-lg font-bold text-blue-900 mt-2">
                      €{cat.preferredRate}/h
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            {selectedWorker.skills && selectedWorker.skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Umiejętności
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedWorker.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Języki pracy</h4>
              <div className="flex flex-wrap gap-2">
                {selectedWorker.workLanguages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium"
                  >
                    {WORK_LANGUAGES.find((l) => l.value === lang)?.label ||
                      lang.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">
                Dane kontaktowe
              </h4>
              <p className="text-sm text-orange-800">
                📧 {selectedWorker.email}
              </p>
              <p className="text-sm text-orange-800">
                📱 {selectedWorker.phone}
              </p>
              <p className="text-sm text-orange-800 mt-2">
                🔖 Certyfikat:{" "}
                <span className="font-mono">
                  {selectedWorker.certificateId}
                </span>
              </p>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-gray-200 pt-6">
              <WorkerReviews workerId={selectedWorker.id} showStats={true} />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Zamknij
            </button>
            {selectedWorker.is_available && (
              <>
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleOpenReview(selectedWorker);
                  }}
                  className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                >
                  ⭐ Wystaw opinię
                </button>
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleOpenContact(selectedWorker);
                  }}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                >
                  📨 Wyślij wiadomość
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: Contact Worker */}
      {selectedWorker && (
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          title={`Kontakt: ${selectedWorker.fullName}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Wskazówka:</strong> Napisz konkretną wiadomość
                opisującą projekt, lokalizację i czas trwania. Zwiększysz szanse
                na szybką odpowiedź!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temat *
              </label>
              <input
                type="text"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="np. Projekt wykończenia apartamentów - Amsterdam"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wiadomość *
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={8}
                placeholder={`Cześć ${selectedWorker.fullName},\n\nJestem zainteresowany Twoimi usługami. Mam projekt...\n\nLokalizacja: \nCzas trwania: \nBudżet: €/h\n\nMogę omówić szczegóły telefonicznie lub osobiście.\n\nPozdrawiam`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {contactMessage.length} znaków
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Pracownik otrzyma:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>✓ Email z Twoją wiadomością</li>
                <li>✓ Twoje dane kontaktowe (z profilu firmy)</li>
                <li>✓ Link do Twojego profilu pracodawcy</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              onClick={handleSendContact}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              📨 Wyślij wiadomość
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: Review Worker */}
      {selectedWorker && employerId && (
        <ReviewWorkerModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          workerId={selectedWorker.id}
          workerName={selectedWorker.fullName}
          employerId={employerId} // Using actual employer.id from database
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};
