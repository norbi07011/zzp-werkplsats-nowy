import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  searchAccountants,
  type Accountant,
} from "../../src/services/accountantService";
import {
  Star,
  MapPin,
  Briefcase,
  CheckCircleIcon,
  Award,
  Languages as LanguagesIcon,
} from "../../components/icons";
import { LoadingOverlay } from "../../components/Loading";
import { AddToTeamButton } from "../../components/AddToTeamButton";
import { useAuth } from "../../contexts/AuthContext";
import { useToasts } from "../../contexts/ToastContext";
import { supabase } from "../../src/lib/supabase";
import {
  saveProfile,
  removeSavedProfile,
  getSavedProfileRecord,
  getSavedProfileIds,
} from "../../services/savedProfilesService";

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

const SPECIALIZATIONS = [
  "Salarisadministratie",
  "BTW-aangifte",
  "Jaaraangifte",
  "Boekhouden",
  "Belastingadvies",
  "Bedrijfsadministratie",
  "Financiële planning",
  "ZZP-begeleiding",
];

const LANGUAGES = ["Nederlands", "English", "Polski", "Deutsch", "Français"];

type SortOption = "popular" | "rating" | "experience" | "name";

export default function AccountantSearchPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToasts();
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<
    string[]
  >([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [savedAccountants, setSavedAccountants] = useState<string[]>([]);

  // Load saved accountants when user is logged in
  useEffect(() => {
    if (user?.id) {
      loadSavedAccountants();
    }
  }, [user?.id]);

  const loadSavedAccountants = async () => {
    if (!user?.id) return;
    try {
      const ids = await getSavedProfileIds(user.id, "accountant");
      setSavedAccountants(ids);
    } catch (err) {
      console.error("Error loading saved accountants:", err);
    }
  };

  const toggleSaveAccountant = async (accountantId: string) => {
    if (!user?.id) {
      showError("Musisz być zalogowany");
      return;
    }
    try {
      const isSaved = savedAccountants.includes(accountantId);
      if (isSaved) {
        const savedRecord = await getSavedProfileRecord(
          user.id,
          "accountant",
          accountantId
        );
        if (savedRecord) {
          const removed = await removeSavedProfile(savedRecord.id);
          if (removed) {
            setSavedAccountants((prev) =>
              prev.filter((id) => id !== accountantId)
            );
            success("✅ Usunięto z zapisanych");
          }
        }
      } else {
        const saved = await saveProfile(user.id, "accountant", accountantId);
        if (saved) {
          setSavedAccountants((prev) => [...prev, accountantId]);
          success("✅ Zapisano księgowego");
        }
      }
    } catch (err) {
      showError("❌ Błąd podczas zapisywania");
    }
  };

  useEffect(() => {
    loadAccountants();
  }, []);

  const loadAccountants = async () => {
    try {
      setLoading(true);
      const result = await searchAccountants({
        // Bez filtrów - pokaż wszystkich aktywnych
      });
      setAccountants(result.accountants);
    } catch (error) {
      console.error("Error loading accountants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrowanie
  const filteredAccountants = accountants.filter((accountant) => {
    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = accountant.full_name.toLowerCase().includes(term);
      const matchesCompany = accountant.company_name
        ?.toLowerCase()
        .includes(term);
      const matchesCity = accountant.city?.toLowerCase().includes(term);
      if (!matchesName && !matchesCompany && !matchesCity) return false;
    }

    // City
    if (selectedCity && accountant.city !== selectedCity) return false;

    // Specializations
    if (selectedSpecializations.length > 0) {
      const hasSpecialization = selectedSpecializations.some((spec) =>
        accountant.specializations.includes(spec)
      );
      if (!hasSpecialization) return false;
    }

    // Languages
    if (selectedLanguages.length > 0) {
      const hasLanguage = selectedLanguages.some((lang) =>
        accountant.languages.includes(lang)
      );
      if (!hasLanguage) return false;
    }

    // Rating
    if (minRating > 0 && accountant.rating < minRating) return false;

    return true;
  });

  // Sortowanie
  const sortedAccountants = [...filteredAccountants].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.total_clients - a.total_clients;
      case "rating":
        return b.rating - a.rating;
      case "experience":
        return b.years_experience - a.years_experience;
      case "name":
        return a.full_name.localeCompare(b.full_name);
      default:
        return 0;
    }
  });

  // Paginacja
  const totalPages = Math.ceil(sortedAccountants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccountants = sortedAccountants.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
    setCurrentPage(1);
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCity("");
    setSelectedSpecializations([]);
    setSelectedLanguages([]);
    setMinRating(0);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCity ||
    selectedSpecializations.length > 0 ||
    selectedLanguages.length > 0 ||
    minRating > 0;

  if (loading) {
    return <LoadingOverlay isLoading={true} message="Boekhouders laden..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Vind jouw boekhouder
          </h1>
          <p className="text-lg text-gray-600">
            {sortedAccountants.length}{" "}
            {sortedAccountants.length === 1 ? "boekhouder" : "boekhouders"}{" "}
            beschikbaar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Wissen
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoeken
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Naam, bedrijf, stad..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* City */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locatie
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Alle steden</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specializations */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialisaties
                </label>
                <div className="space-y-2">
                  {SPECIALIZATIONS.map((spec) => (
                    <label key={spec} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSpecializations.includes(spec)}
                        onChange={() => toggleSpecialization(spec)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Talen
                </label>
                <div className="space-y-2">
                  {LANGUAGES.map((lang) => (
                    <label key={lang} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimale beoordeling
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
                    <span className="ml-2 text-sm text-gray-700">Alle</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Sort Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sorteren op:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="popular">Populariteit</option>
                  <option value="rating">Hoogste beoordeling</option>
                  <option value="experience">Meeste ervaring</option>
                  <option value="name">Naam (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Accountant Grid */}
            {paginatedAccountants.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Briefcase className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Geen boekhouders gevonden
                </h3>
                <p className="text-gray-600 mb-4">
                  Probeer je zoekopdracht aan te passen of filters te wissen
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Wis alle filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedAccountants.map((accountant) => (
                    <div
                      key={accountant.id}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow relative"
                    >
                      {/* Rating badge - top right - TYLKO jeśli są opinie */}
                      {accountant.rating_count > 0 && (
                        <div className="absolute top-4 right-4 z-10">
                          <div className="bg-white rounded-full shadow-lg px-3 py-2 flex items-center gap-1">
                            <span className="text-lg font-bold">
                              {accountant.rating.toFixed(1)}
                            </span>
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({accountant.rating_count})
                            </span>
                          </div>
                        </div>
                      )}

                      {/* LARGE RECTANGULAR PHOTO - 256px height */}
                      <div className="relative h-64 bg-gradient-to-br from-amber-50 to-amber-100">
                        <div className="w-full h-full flex items-center justify-center">
                          {accountant.avatar_url ? (
                            <img
                              src={accountant.avatar_url}
                              alt={accountant.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                              {accountant.full_name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Verification badge on photo */}
                        {accountant.is_verified && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                            <span className="bg-green-500 text-white px-5 py-2 rounded-full whitespace-nowrap flex items-center gap-2">
                              <span className="w-2 h-2 bg-white rounded-full"></span>
                              Zweryfikowany
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Accountant info - centered */}
                      <div className="px-6 py-4 text-center">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                          {accountant.full_name}
                        </h3>
                        {accountant.city && (
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            📍 {accountant.city}
                          </p>
                        )}
                        {accountant.company_name && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {accountant.company_name}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="px-6 pb-6 flex gap-3">
                        <Link
                          to={`/accountant/profile/${accountant.id}`}
                          className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors text-center"
                        >
                          Zobacz profil
                        </Link>
                        {/* Save button - only for logged-in employers */}
                        {user && (
                          <button
                            onClick={() => toggleSaveAccountant(accountant.id)}
                            className={`px-4 py-3 rounded-xl transition-colors ${
                              savedAccountants.includes(accountant.id)
                                ? "bg-amber-100 text-amber-600"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            aria-label={
                              savedAccountants.includes(accountant.id)
                                ? "Usuń z zapisanych"
                                : "Zapisz księgowego"
                            }
                          >
                            <span className="text-xl">⭐</span>
                          </button>
                        )}
                        <div onClick={(e) => e.stopPropagation()}>
                          <AddToTeamButton
                            userId={accountant.profile_id || accountant.id}
                            userEmail={accountant.email}
                            userType="accountant"
                            displayName={accountant.full_name}
                            className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Vorige
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-amber-600 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Volgende
                    </button>
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
