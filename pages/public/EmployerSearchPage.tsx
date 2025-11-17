import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { LoadingOverlay } from "../../components/Loading";
import { MapPin, Briefcase, Star, User } from "../../components/icons";
import { AddToTeamButton } from "../../components/AddToTeamButton";
import { useAuth } from "../../contexts/AuthContext";

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
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

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
    const matchesSearch =
      !searchQuery ||
      employer.company_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      employer.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      !industryFilter || employer.industry === industryFilter;

    return matchesSearch && matchesIndustry;
  });

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
          <p className="text-gray-600">Przeglądaj firmy i oferty pracy</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Szukaj
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nazwa firmy, opis..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Industry Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branża
              </label>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
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
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Znaleziono {filteredEmployers.length}{" "}
            {filteredEmployers.length === 1 ? "pracodawcę" : "pracodawców"}
          </div>
        </div>

        {/* Employers Grid */}
        {filteredEmployers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Briefcase className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Brak wyników
            </h3>
            <p className="text-gray-600">
              Nie znaleziono pracodawców spełniających kryteria wyszukiwania.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployers.map((employer) => (
              <div
                key={employer.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow relative overflow-hidden"
              >
                {/* Rating badge - top right - TYLKO jeśli są opinie */}
                {employer.rating_count != null && employer.rating_count > 0 && (
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {employer.company_name || "Nazwa firmy niedostępna"}
                  </h3>
                  {employer.city && (
                    <p className="text-gray-600">📍 {employer.city}</p>
                  )}
                  {employer.industry && (
                    <p className="text-sm text-gray-500 mt-1">
                      {employer.industry}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="px-6 pb-6 flex gap-3">
                  <Link
                    to={`/public/employer/${employer.id}`}
                    className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors text-center"
                  >
                    Zobacz profil
                  </Link>
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
        )}
      </div>
    </div>
  );
}
