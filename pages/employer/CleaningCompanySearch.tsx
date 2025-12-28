import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../src/lib/supabase";
import { useToasts } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  saveProfile,
  removeSavedProfile,
  getSavedProfileRecord,
  getSavedProfileIds,
} from "../../services/savedProfilesService";

interface CleaningCompany {
  id: string;
  company_name: string;
  specialization: string[] | null;
  availability: any | null; // JSON field
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  years_experience: number | null;
  team_size: number | null;
  bio: string | null;
  portfolio_images: string[] | null;
  average_rating: number | null;
  total_reviews: number | null;
  accepting_new_clients: boolean;
  created_at: string;

  location_city: string | null;
  service_radius_km: number | null;
}

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Pon",
  tuesday: "Wt",
  wednesday: "Śr",
  thursday: "Czw",
  friday: "Pt",
  saturday: "Sob",
  sunday: "Niedz",
};

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface CleaningCompanySearchProps {
  defaultCity?: string;
}

export const CleaningCompanySearch: React.FC<CleaningCompanySearchProps> = ({
  defaultCity,
}) => {
  const { addToast } = useToasts();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CleaningCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedCompanies, setSavedCompanies] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    city: defaultCity || "",
    requiredDays: [] as DayOfWeek[],
    minRating: 0,
  });

  // ✅ UPDATED: Load saved cleaning companies using universal savedProfilesService
  useEffect(() => {
    const loadSavedCompanies = async () => {
      if (!user?.id) return;
      try {
        const savedIds = await getSavedProfileIds(user.id, "cleaning_company");
        setSavedCompanies(savedIds);
      } catch (err) {
        console.error("Error loading saved cleaning companies:", err);
      }
    };
    loadSavedCompanies();
  }, [user?.id]);

  // ✅ UPDATED: Toggle save company using universal savedProfilesService
  const toggleSaveCompany = async (companyId: string) => {
    if (!user?.id) {
      addToast("Zaloguj się, aby zapisać firmę", "error");
      return;
    }
    try {
      const isSaved = savedCompanies.includes(companyId);
      if (isSaved) {
        const savedRecord = await getSavedProfileRecord(
          user.id,
          "cleaning_company",
          companyId
        );
        if (savedRecord) {
          const removed = await removeSavedProfile(savedRecord.id);
          if (removed) {
            setSavedCompanies((prev) => prev.filter((id) => id !== companyId));
            addToast("✅ Usunięto z zapisanych", "success");
          }
        }
      } else {
        const saved = await saveProfile(user.id, "cleaning_company", companyId);
        if (saved) {
          setSavedCompanies((prev) => [...prev, companyId]);
          addToast("✅ Zapisano firmę sprzątającą", "success");
        }
      }
    } catch (err) {
      addToast("❌ Błąd podczas zapisywania", "error");
    }
  };

  useEffect(() => {
    fetchCleaningCompanies();
  }, [filters.city, filters.minRating]);

  const fetchCleaningCompanies = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from("cleaning_companies")
        .select("*")
        .eq("accepting_new_clients", true)
        .order("created_at", { ascending: false });

      if (filters.city) {
        query = query.ilike("location_city", `%${filters.city}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log("✅ Loaded cleaning companies:", data?.length || 0);
      setCompanies((data || []) as CleaningCompany[]);
    } catch (error) {
      console.error("❌ Error fetching cleaning companies:", error);
      addToast("Błąd podczas ładowania firm sprzątających", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleRequiredDay = (day: DayOfWeek) => {
    setFilters((prev) => ({
      ...prev,
      requiredDays: prev.requiredDays.includes(day)
        ? prev.requiredDays.filter((d) => d !== day)
        : [...prev.requiredDays, day],
    }));
  };

  const checkAvailability = (company: CleaningCompany): boolean => {
    if (filters.requiredDays.length === 0) return true;
    if (!company.availability) return false;

    return filters.requiredDays.every(
      (day) => company.availability[day] === true
    );
  };

  const countAvailableDays = (availability: any): number => {
    if (!availability) return 0;
    return Object.values(availability).filter((v) => v === true).length;
  };

  const filteredCompanies = companies.filter((company) => {
    if (!checkAvailability(company)) return false;
    if (company.average_rating && company.average_rating < filters.minRating)
      return false;
    return true;
  });

  return (
    <div
      className="max-w-7xl mx-auto p-6 relative"
      style={{
        opacity: 1,
        background: "none",
        color: "#111",
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      {/* Header */}
      <div className="mb-8 relative" style={{ opacity: 1, zIndex: 100 }}>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Firmy Sprzątające
        </h1>
        <p className="text-slate-700 dark:text-slate-300">
          Znajdź firmę sprzątającą dostępną w dni, które Cię interesują
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filtry - Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtry</h2>

            {/* Miasto */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miasto
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, city: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="np. Amsterdam"
              />
            </div>

            {/* Wybór wymaganych dni */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Potrzebuję firmy w te dni:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleRequiredDay(day)}
                    className={`
                      px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all
                      ${
                        filters.requiredDays.includes(day)
                          ? "bg-blue-500 border-blue-600 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }
                    `}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
              {filters.requiredDays.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Wybrano {filters.requiredDays.length}{" "}
                  {filters.requiredDays.length === 1 ? "dzień" : "dni"}
                </p>
              )}
            </div>

            {/* Minimalna ocena */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimalna ocena
              </label>
              <select
                value={filters.minRating}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minRating: parseFloat(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="0">Wszystkie</option>
                <option value="3.5">3.5+ ⭐</option>
                <option value="4.0">4.0+ ⭐⭐</option>
                <option value="4.5">4.5+ ⭐⭐⭐</option>
              </select>
            </div>

            {/* Reset */}
            <button
              onClick={() =>
                setFilters({ city: "", requiredDays: [], minRating: 0 })
              }
              className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Wyczyść filtry
            </button>
          </div>
        </aside>

        {/* Lista firm */}
        <div
          className="lg:col-span-3 relative"
          style={{ opacity: 1, background: "none", color: "#111", zIndex: 100 }}
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Ładowanie...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">
                {companies.length === 0
                  ? "Brak firm sprzątających w bazie danych"
                  : "Nie znaleziono firm spełniających kryteria"}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {companies.length > 0 && "Spróbuj zmienić filtry"}
              </p>
            </div>
          ) : (
            <div>
              <div className="text-sm text-gray-600 mb-6">
                Znaleziono {filteredCompanies.length}{" "}
                {filteredCompanies.length === 1 ? "firma" : "firm"}
              </div>

              {/* GRID PIONOWYCH KART */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col"
                  >
                    {/* DUŻE ZDJĘCIE NA GÓRZE */}
                    <div className="relative w-full h-72 bg-gradient-to-br from-blue-500 to-purple-600">
                      {company.portfolio_images &&
                      company.portfolio_images.length > 0 ? (
                        <img
                          src={company.portfolio_images[0]}
                          alt={company.company_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white text-6xl font-bold">
                            {company.company_name
                              ?.substring(0, 1)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Rating badge - TOP RIGHT */}
                      {company.average_rating && company.total_reviews && (
                        <div className="absolute top-3 right-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg px-3 py-2 text-center shadow-lg">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <span className="text-xl font-bold">
                              {company.average_rating.toFixed(1)}
                            </span>
                            <span className="text-lg">⭐</span>
                          </div>
                          <p className="text-xs text-gray-600 font-medium">
                            {company.total_reviews}{" "}
                            {company.total_reviews === 1 ? "op." : "op."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Company name */}
                      <Link to={`/cleaning-company/profile/${company.id}`}>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2">
                          {company.company_name}
                        </h3>
                      </Link>

                      {/* Location */}
                      {company.location_city && (
                        <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 flex items-center gap-1">
                          <span>📍</span>
                          {company.location_city}
                          {company.service_radius_km &&
                            ` • ${company.service_radius_km}km`}
                        </p>
                      )}

                      {/* AVAILABILITY DAYS */}
                      {company.availability && (
                        <div className="mb-4 flex-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wide">
                            📅 Dostępne dni (
                            {countAvailableDays(company.availability)})
                          </h4>
                          <div className="grid grid-cols-4 gap-1.5">
                            {DAYS.map((day) => (
                              <span
                                key={day}
                                className={`
                                  px-2 py-1.5 text-xs text-center rounded font-semibold transition-all
                                  ${
                                    company.availability[day]
                                      ? "bg-green-100 text-green-800 border border-green-300"
                                      : "bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-300"
                                  }
                                `}
                              >
                                {DAY_LABELS[day]}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ACTION BUTTONS */}
                      <div className="flex flex-col gap-2 mt-auto">
                        <Link
                          to={`/cleaning-company/profile/${company.id}`}
                          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center shadow-sm"
                        >
                          Zobacz profil
                        </Link>
                        {user && (
                          <button
                            onClick={() => toggleSaveCompany(company.id)}
                            className={`w-full py-3 px-4 border-2 rounded-lg transition-colors font-bold shadow-sm ${
                              savedCompanies.includes(company.id)
                                ? "border-amber-500 bg-amber-100 text-amber-900"
                                : "border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            }`}
                          >
                            ⭐{" "}
                            {savedCompanies.includes(company.id)
                              ? "Zapisano"
                              : "Zapisz"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleaningCompanySearch;
