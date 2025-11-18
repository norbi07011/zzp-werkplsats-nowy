import { useState, useEffect } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { CompanyInfoEditModal } from "../../src/components/cleaning/CompanyInfoEditModal";
import PortfolioUploadModal from "../../src/components/cleaning/PortfolioUploadModal";
import DateBlocker from "../../src/components/cleaning/DateBlocker";
import type { CleaningCompany, UnavailableDate } from "../../types";

type Tab = "panel" | "profile" | "portfolio" | "opinie" | "kalendarz";

const CleaningCompanyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("panel");
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<CleaningCompany | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [acceptingClients, setAcceptingClients] = useState(true);
  const [blockedDates, setBlockedDates] = useState<UnavailableDate[]>([]);

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    loadCompanyData();
  }, [user]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);

      const { data: company, error } = await supabase
        .from("cleaning_companies")
        .select("*")
        .eq("profile_id", user!.id)
        .single();

      if (error) throw error;

      // Transform database data to CleaningCompany type
      const transformedData = {
        ...company,
        user_id: company.profile_id,
        unavailable_dates: [],
        phone: company.phone ?? undefined,
        email: company.email ?? undefined,
        kvk_number: company.kvk_number ?? undefined,
        location_city: company.location_city ?? undefined,
        location_province: company.location_province ?? undefined,
        bio: company.bio ?? undefined,
        avatar_url: company.avatar_url ?? undefined,
        cover_image_url: company.cover_image_url ?? undefined,
        availability: company.availability as any,
      } as CleaningCompany;

      setCompanyData(transformedData);
      setAcceptingClients(company.accepting_new_clients || false);
      setLoading(false);
    } catch (error) {
      console.error("Error loading company:", error);
      setLoading(false);
    }
  };

  const handleSaveCompanyInfo = async (
    updatedData: Partial<CleaningCompany>
  ) => {
    try {
      // Transform CleaningCompany type to database format
      const { user_id, unavailable_dates, ...dbData } = updatedData;

      const { error } = await supabase
        .from("cleaning_companies")
        .update(dbData as any)
        .eq("profile_id", user!.id);

      if (error) throw error;

      await loadCompanyData();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating company:", error);
    }
  };

  const handleBlockDate = async (date: UnavailableDate) => {
    setBlockedDates([...blockedDates, date]);
    // TODO: Save to database
  };

  const handleUnblockDate = async (date: string) => {
    setBlockedDates(blockedDates.filter((d) => d.date !== date));
    // TODO: Remove from database
  };

  const handlePortfolioSuccess = (newImages: string[]) => {
    if (companyData) {
      setCompanyData({ ...companyData, portfolio_images: newImages });
    }
    setShowPortfolioModal(false);
  };

  const handleToggleAccepting = async () => {
    try {
      const newValue = !acceptingClients;

      const { error } = await supabase
        .from("cleaning_companies")
        .update({ accepting_new_clients: newValue })
        .eq("profile_id", user!.id);

      if (error) throw error;

      setAcceptingClients(newValue);
    } catch (error) {
      console.error("Error updating:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">⚠️ Nie znaleziono danych firmy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.png" alt="ZZP Werkplaats" className="h-10" />
              <span className="text-xl font-bold">ZZP Werkplaats</span>
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-white hover:text-gray-200">
                GB angielski ▼
              </button>
              <button className="bg-purple-700 px-4 py-2 rounded-lg hover:bg-purple-800">
                ⚡ Wyloguj
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Witajcie, {companyData.company_name}!
              </h1>
              <p className="text-purple-100">
                Panel informacyjny firmy sprzątającej
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm">Przyjmowanie nowych klientów</span>
              <button
                onClick={handleToggleAccepting}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  acceptingClients ? "bg-green-400" : "bg-gray-400"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    acceptingClients ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 mb-1">Opinie łącznie</p>
                <p className="text-3xl font-bold text-orange-900">
                  {companyData.total_reviews || 1}
                </p>
              </div>
              <span className="text-4xl">⭐</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 mb-1">Średnia ocena</p>
                <p className="text-3xl font-bold text-purple-900">
                  {companyData.average_rating || "5,0"} / 5,0
                </p>
              </div>
              <span className="text-4xl">📊</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 mb-1">Wysłane profile</p>
                <p className="text-3xl font-bold text-blue-900">20</p>
              </div>
              <span className="text-4xl">💬</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 mb-1">
                  Kontakty z firm miesięczn
                </p>
                <p className="text-3xl font-bold text-green-900">0</p>
              </div>
              <span className="text-4xl">📞</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">📸 Zdjęcie profilowe</h3>
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={companyData.avatar_url || "/default-avatar.png"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-purple-200"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Adres URL przekierowany poprawnie do profilu rozszerzonego
                  firmy
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  https://zzp-werkplaats.nl/firma/vsvs
                </p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    📝 Edytuj dane firmy
                  </button>
                  <button className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                    🗑️ Usuń
                  </button>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">📅 Twoja dostępność</h3>
              <p className="text-sm text-gray-600 mb-4">
                Wybierz dni w których możesz przyjąć zlecenia (pracujesz)
              </p>
              <div className="space-y-2">
                {[
                  "Poniedziałek",
                  "Wtorek",
                  "Środa",
                  "Czwartek",
                  "Piątek",
                  "Sobota",
                  "Niedziela",
                ].map((day, index) => (
                  <label
                    key={day}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            {/* Dane firmy */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">ℹ️ Dane firmy</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Kontakt</p>
                  <p className="font-semibold">{companyData.email || "Brak"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Zespół</p>
                  <p className="font-semibold">
                    {companyData.team_size || 1} osoba
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Miasto</p>
                  <p className="font-semibold">
                    {companyData.location_city || "Brak"}
                  </p>
                </div>
              </div>
              <button className="mt-4 text-blue-600 hover:text-blue-800 text-sm">
                Zobacz wszystkie →
              </button>
            </div>

            {/* Zarezerwowane daty */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">📅 Zarezerwuj datami</h3>
              <p className="text-sm text-gray-600 mb-4">
                Zablokuj daty, kiedy się nie pojawicie (np. przerwa, urlop)
              </p>
              <DateBlocker
                blockedDates={blockedDates}
                onBlock={handleBlockDate}
                onUnblock={handleUnblockDate}
              />
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Dostępne dni:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {blockedDates.length > 0
                    ? Math.max(0, 30 - blockedDates.length)
                    : 30}
                </p>
                <p className="text-sm font-semibold mt-4 mb-2">Preferowane:</p>
                <p className="text-lg text-gray-700">
                  {companyData?.preferred_days_per_week || 2} dni/tydzień
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Portfolio */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">
                  🎨 Portfolio zdjęć (
                  {companyData.portfolio_images?.length || 0} zdjęć)
                </h3>
                <button
                  onClick={() => setShowPortfolioModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Dodaj zdjęcia
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Pokazuj swoją pracę - dodaj zdjęcia projektów gotowe
              </p>
              <div className="grid grid-cols-2 gap-4">
                {companyData.portfolio_images
                  ?.slice(0, 2)
                  .map((img: string, i: number) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Portfolio ${i + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">⭐ Opinie od klientów</h3>
              <p className="text-sm text-gray-600 mb-4">
                1 opinia - Średnia: {companyData.average_rating || "5"} 😊
              </p>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      F
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Firma medfaza</p>
                      <p className="text-xs text-gray-500">5 stycznia 2025</p>
                    </div>
                  </div>
                  <div className="flex text-yellow-400 mb-2">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i}>{star}</span>
                    ))}
                    <span className="ml-2 text-gray-600 text-sm">3,3</span>
                  </div>
                  <p className="text-sm text-gray-700">Super</p>
                  <button className="text-blue-600 text-sm mt-2 hover:text-blue-800">
                    💬 Odpowiedz na opinię
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">📬 Ostatnie wiadomości</h3>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  1 nieprzeczytana
                </span>
              </div>
              <div className="space-y-3">
                <div className="border-b pb-3">
                  <p className="font-semibold text-sm">
                    Re: Zapytanie o usługę - vsvs
                  </p>
                  <p className="text-xs text-gray-500">do siebie (tutaj)</p>
                </div>
                <div className="border-b pb-3">
                  <p className="font-semibold text-sm">
                    Zapytanie o usługę - vsvs
                  </p>
                  <p className="text-xs text-gray-500">do siebie (tutaj)</p>
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    Re: Zapytanie o usługę - vsvs
                  </p>
                  <p className="text-xs text-gray-500">do siebie (tutaj)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 text-9xl opacity-20">🏆</div>
            <div className="relative z-10">
              <span className="text-4xl font-bold">1</span>
              <h3 className="text-xl font-bold mt-2">Tytuł abonament</h3>
              <p className="text-sm mt-2 opacity-90">
                Opis planu abonamentowego
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 text-9xl opacity-20">💎</div>
            <div className="relative z-10">
              <span className="text-4xl font-bold">2</span>
              <h3 className="text-xl font-bold mt-2">Plan średni</h3>
              <p className="text-sm mt-2 opacity-90">
                Pakiet dla średnich firm
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-teal-400 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 text-9xl opacity-20">🚀</div>
            <div className="relative z-10">
              <span className="text-4xl font-bold">3</span>
              <h3 className="text-xl font-bold mt-2">Maksymalny pakiet</h3>
              <p className="text-sm mt-2 opacity-90">
                Wszystkie funkcje premium
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && companyData && (
        <CompanyInfoEditModal
          company={companyData}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveCompanyInfo}
        />
      )}

      {showPortfolioModal && companyData && (
        <PortfolioUploadModal
          companyId={companyData.id}
          currentImages={companyData.portfolio_images || []}
          isOpen={showPortfolioModal}
          onClose={() => setShowPortfolioModal(false)}
          onSuccess={handlePortfolioSuccess}
        />
      )}
    </div>
  );
};

export default CleaningCompanyDashboard;
