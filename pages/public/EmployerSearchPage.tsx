import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { LoadingOverlay } from "../../components/Loading";
import { MapPin, Briefcase, Star, User } from "../../components/icons";
import { AddToTeamButton } from "../../components/AddToTeamButton";
import { useAuth } from "../../contexts/AuthContext";
import { useToasts } from "../../contexts/ToastContext";
import {
  saveProfile,
  removeSavedProfile,
  getSavedProfileRecord,
  getSavedProfileIds,
} from "../../services/savedProfilesService";

// Constants for filters
const CITIES = [
  "Amsterdam",
  "Rotterdam",
  "Den Haag",
  "Utrecht",
  "Eindhoven",
  "Groningen",
  "Tilburg",
  "Almere",
  "Breda",
  "Nijmegen",
];

const INDUSTRIES = [
  "Bouw",
  "Renovatie",
  "Installatie",
  "Schoonmaak",
  "Transport",
  "IT & Technology",
  "Horeca",
  "Retail",
  "Zorg",
  "Overig",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 werknemers" },
  { value: "11-50", label: "11-50 werknemers" },
  { value: "51-200", label: "51-200 werknemers" },
  { value: "200+", label: "200+ werknemers" },
];

interface Employer {
  id: string;
  company_name: string | null;
  industry: string | null;
  company_size: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  verified: boolean;
  created_at: string;
  // Dodatkowe kolumny z bazy
  profile_id: string;
  kvk_number: string | null;
  subscription_tier: string;
  subscription_status: string;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  avg_rating: number | null;
  rating: number | null;
  rating_count: number | null;
}

export default function EmployerSearchPage() {
  const { user: authUser } = useAuth();
  const { success, error: showError } = useToasts();
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [companySizeFilter, setCompanySizeFilter] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [savedEmployers, setSavedEmployers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load saved employers when user is logged in
  useEffect(() => {
    if (authUser?.id) {
      loadSavedEmployers();
    }
  }, [authUser?.id]);

  const loadSavedEmployers = async () => {
    if (!authUser?.id) return;
    try {
      const ids = await getSavedProfileIds(authUser.id, "employer");
      setSavedEmployers(ids);
    } catch (err) {
      console.error("Error loading saved employers:", err);
    }
  };

  const toggleSaveEmployer = async (targetEmployerId: string) => {
    if (!authUser?.id) {
      showError("Musisz być zalogowany");
      return;
    }
    try {
      const isSaved = savedEmployers.includes(targetEmployerId);
      if (isSaved) {
        const savedRecord = await getSavedProfileRecord(
          authUser.id,
          "employer",
          targetEmployerId
        );
        if (savedRecord) {
          const removed = await removeSavedProfile(savedRecord.id);
          if (removed) {
            setSavedEmployers((prev) =>
              prev.filter((id) => id !== targetEmployerId)
            );
            success("✅ Usunięto z zapisanych");
          }
        }
      } else {
        const saved = await saveProfile(
          authUser.id,
          "employer",
          targetEmployerId
        );
        if (saved) {
          setSavedEmployers((prev) => [...prev, targetEmployerId]);
          success("✅ Zapisano pracodawcę");
        }
      }
    } catch (err) {
      showError("❌ Błąd podczas zapisywania");
    }
  };

  useEffect(() => {
    loadEmployers();
  }, []);

  const loadEmployers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("employers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEmployers((data || []) as any);
    } catch (error) {
      console.error("Error loading employers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployers = employers.filter((employer) => {
    // Search term
    const matchesSearch =
      !searchQuery ||
      employer.company_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      employer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employer.city?.toLowerCase().includes(searchQuery.toLowerCase());

    // Industry
    const matchesIndustry =
      !industryFilter || employer.industry === industryFilter;

    // City
    const matchesCity = !cityFilter || employer.city === cityFilter;

    // Company size
    const matchesSize =
      !companySizeFilter || employer.company_size === companySizeFilter;

    // Rating
    const rating = employer.avg_rating || employer.rating || 0;
    const matchesRating = minRating === 0 || rating >= minRating;

    // Verified
    const matchesVerified = !verifiedOnly || employer.verified;

    return (
      matchesSearch &&
      matchesIndustry &&
      matchesCity &&
      matchesSize &&
      matchesRating &&
      matchesVerified
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredEmployers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployers = filteredEmployers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const clearFilters = () => {
    setSearchQuery("");
    setIndustryFilter("");
    setCityFilter("");
    setCompanySizeFilter("");
    setMinRating(0);
    setVerifiedOnly(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    industryFilter ||
    cityFilter ||
    companySizeFilter ||
    minRating > 0 ||
    verifiedOnly;

  // Get unique cities from data
  const availableCities = Array.from(
    new Set(employers.map((e) => e.city).filter(Boolean))
  ) as string[];

  const industries = Array.from(
    new Set(employers.map((e) => e.industry).filter(Boolean))
  ) as string[];

  if (loading) {
    return (
      <LoadingOverlay isLoading={true} message="Ładowanie pracodawców..." />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Znajdź Pracodawcę
          </h1>
          <p className="text-gray-600">
            Znaleziono {filteredEmployers.length}{" "}
            {filteredEmployers.length === 1 ? "pracodawcę" : "pracodawców"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Wyczyść
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Szukaj
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Nazwa firmy, miasto..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* City */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miasto
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Wszystkie miasta</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branża
                </label>
                <select
                  value={industryFilter}
                  onChange={(e) => {
                    setIndustryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Wszystkie branże</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wielkość firmy
                </label>
                <select
                  value={companySizeFilter}
                  onChange={(e) => {
                    setCompanySizeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Wszystkie wielkości</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimalna ocena
                </label>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === rating}
                        onChange={() => {
                          setMinRating(rating);
                          setCurrentPage(1);
                        }}
                        className="border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="ml-2 flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-700">{rating}+</span>
                      </span>
                    </label>
                  ))}
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === 0}
                      onChange={() => {
                        setMinRating(0);
                        setCurrentPage(1);
                      }}
                      className="border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Wszystkie
                    </span>
                  </label>
                </div>
              </div>

              {/* Verified Only */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => {
                      setVerifiedOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Tylko zweryfikowane firmy
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {paginatedEmployers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Briefcase className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Brak wyników
                </h3>
                <p className="text-gray-600">
                  Nie znaleziono pracodawców spełniających kryteria
                  wyszukiwania.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Wyczyść filtry
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedEmployers.map((employer) => (
                    <div
                      key={employer.id}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow relative overflow-hidden"
                    >
                      {/* Rating badge - top right - TYLKO jeśli są opinie */}
                      {employer.rating_count != null &&
                        employer.rating_count > 0 && (
                          <div className="absolute top-4 right-4 z-10">
                            <div className="bg-white rounded-full shadow-lg px-3 py-2 flex items-center gap-1">
                              <span className="text-lg font-bold">
                                {Number(
                                  employer.avg_rating || employer.rating || 0
                                ).toFixed(1)}
                              </span>
                              <span className="text-yellow-500">⭐</span>
                              <span className="text-xs text-gray-500 ml-1">
                                ({employer.rating_count})
                              </span>
                            </div>
                          </div>
                        )}

                      {/* LARGE RECTANGULAR PHOTO - 256px height */}
                      <div className="relative h-64 bg-gradient-to-br from-amber-400 to-orange-600">
                        {employer.logo_url ? (
                          <img
                            src={employer.logo_url}
                            alt={employer.company_name || "Company logo"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="w-24 h-24 text-white opacity-50" />
                          </div>
                        )}

                        {/* Verification badge on photo */}
                        {employer.verified && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                            <span className="bg-green-500 text-white px-5 py-2 rounded-full whitespace-nowrap flex items-center gap-2">
                              <span className="w-2 h-2 bg-white rounded-full"></span>
                              Zweryfikowany
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Employer info - centered */}
                      <div className="px-6 py-4 text-center">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                          {employer.company_name || "Nazwa firmy niedostępna"}
                        </h3>
                        {employer.city && (
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            📍 {employer.city}
                          </p>
                        )}
                        {employer.industry && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {employer.industry}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="px-6 pb-6 flex gap-3">
                        <Link
                          to={`/employer/profile/${employer.id}`}
                          className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors text-center"
                        >
                          Zobacz profil
                        </Link>
                        {/* Save button - only for logged-in users */}
                        {authUser && (
                          <button
                            onClick={() => toggleSaveEmployer(employer.id)}
                            className={`px-4 py-3 rounded-xl transition-colors ${
                              savedEmployers.includes(employer.id)
                                ? "bg-amber-100 text-amber-600"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            aria-label={
                              savedEmployers.includes(employer.id)
                                ? "Usuń z zapisanych"
                                : "Zapisz pracodawcę"
                            }
                          >
                            <span className="text-xl">⭐</span>
                          </button>
                        )}
                        {authUser?.role === "accountant" &&
                          employer.profile_id &&
                          employer.contact_email && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <AddToTeamButton
                                userId={employer.profile_id}
                                userEmail={employer.contact_email}
                                userType="employer"
                                displayName={
                                  employer.company_name ||
                                  employer.contact_person ||
                                  employer.contact_email
                                }
                                avatarUrl={employer.logo_url || undefined}
                                className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200"
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Poprzednia
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-600">
                        Strona {currentPage} z {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Następna
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
