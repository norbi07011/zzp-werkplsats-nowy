/**
 * COMPANY INFO EDIT MODAL - JEDYNY formularz edycji profilu
 * Wszystkie pola: kontakt, lokalizacja, specjalizacja, usługi, dostępność, cennik, zespół, opis
 */

import { useState } from "react";
import { geocodeAddress } from "../../../services/geocoding";
import type {
  CleaningCompany,
  CleaningSpecialization,
  WeeklyAvailability,
  DayOfWeek,
} from "../../../types";

interface CompanyInfoEditModalProps {
  company: CleaningCompany;
  onClose: () => void;
  onSave: (updatedData: Partial<CleaningCompany>) => Promise<void>;
}

const defaultAvailability: WeeklyAvailability = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
};

const DUTCH_PROVINCES = [
  "Noord-Holland",
  "Zuid-Holland",
  "Utrecht",
  "Noord-Brabant",
  "Gelderland",
  "Overijssel",
  "Friesland",
  "Groningen",
  "Drenthe",
  "Flevoland",
  "Zeeland",
  "Limburg",
];

export const CompanyInfoEditModal: React.FC<CompanyInfoEditModalProps> = ({
  company,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    email: company.email || "",
    phone: company.phone || "",
    address: (company as any).address || "",
    postal_code: (company as any).postal_code || "",
    location_city: company.location_city || "",
    location_province: company.location_province || "",
    service_radius_km: company.service_radius_km || 25,
    specialization: company.specialization || [],
    additional_services: company.additional_services || [],
    availability: company.availability || defaultAvailability,
    preferred_days_per_week: company.preferred_days_per_week || 2,
    hourly_rate_min: company.hourly_rate_min || 15,
    hourly_rate_max: company.hourly_rate_max || 30,
    rate_negotiable: company.rate_negotiable || false,
    team_size: company.team_size || 1,
    years_experience: company.years_experience || 0,
    kvk_number: company.kvk_number || "",
    bio: company.bio || "",
    latitude: (company as any).latitude || (null as number | null),
    longitude: (company as any).longitude || (null as number | null),
    google_maps_url: (company as any).google_maps_url || "",
    google_place_id: (company as any).google_place_id || "",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const specializationOptions: {
    value: CleaningSpecialization;
    label: string;
  }[] = [
    { value: "cleaning_after_construction", label: "Sprzątanie po budowach" },
    { value: "deep_cleaning", label: "Gruntowne sprzątanie" },
    { value: "office_cleaning", label: "Sprzątanie biur" },
    { value: "window_cleaning", label: "Mycie okien" },
    { value: "maintenance_cleaning", label: "Utrzymanie czystości" },
  ];

  const additionalServicesOptions = [
    { value: "own_equipment", label: "🧰 Własny sprzęt" },
    { value: "eco_products", label: "🌱 Produkty ekologiczne" },
    { value: "same_day_service", label: "⚡ Tego samego dnia" },
    { value: "weekend_available", label: "📅 Weekendy" },
    { value: "insurance", label: "🛡️ Ubezpieczenie" },
    { value: "invoice", label: "📄 Faktury VAT" },
  ];

  const daysOfWeek: { key: DayOfWeek; label: string }[] = [
    { key: "monday", label: "Pon" },
    { key: "tuesday", label: "Wt" },
    { key: "wednesday", label: "Śr" },
    { key: "thursday", label: "Czw" },
    { key: "friday", label: "Pt" },
    { key: "saturday", label: "Sob" },
    { key: "sunday", label: "Niedz" },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Nieprawidłowy email";
    }
    if (formData.phone && !/^[+]?[\d\s-]{9,}$/.test(formData.phone)) {
      newErrors.phone = "Nieprawidłowy telefon";
    }
    if (formData.hourly_rate_min >= formData.hourly_rate_max) {
      newErrors.hourly_rate_min = "Stawka min < max";
    }
    if (formData.specialization.length === 0) {
      newErrors.specialization = "Wybierz specjalizację";
    }
    if (!formData.location_city.trim()) {
      newErrors.location_city = "Podaj miasto";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);

      // Auto-geocoding: jeśli jest adres ale brak GPS, wygeneruj współrzędne
      let dataToSave = { ...formData };
      if (
        formData.address &&
        formData.location_city &&
        (!formData.latitude || !formData.longitude)
      ) {
        console.log("🗺️ Auto-geocoding address...");
        const geocoded = await geocodeAddress(
          formData.address,
          formData.location_city,
          formData.postal_code || undefined,
          "Netherlands"
        );
        if (geocoded) {
          dataToSave.latitude = geocoded.latitude;
          dataToSave.longitude = geocoded.longitude;
          console.log("✅ Geocoding successful:", geocoded);
        } else {
          console.warn("⚠️ Geocoding failed, saving without coordinates");
        }
      }

      await onSave(dataToSave);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleSpecialization = (spec: CleaningSpecialization) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
    if (errors.specialization) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.specialization;
        return newErrors;
      });
    }
  };

  const toggleAdditionalService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      additional_services: prev.additional_services.includes(service)
        ? prev.additional_services.filter((s) => s !== service)
        : [...prev.additional_services, service],
    }));
  };

  const toggleAvailability = (day: DayOfWeek) => {
    setFormData((prev) => ({
      ...prev,
      availability: { ...prev.availability, [day]: !prev.availability[day] },
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold">✏️ Edytuj profil firmy</h2>
            <p className="text-blue-100 text-sm mt-1">
              Wszystkie dane w jednym miejscu
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto"
        >
          {/* KONTAKT */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">📞 Kontakt</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* LOKALIZACJA */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              📍 Lokalizacja
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miasto *
                </label>
                <input
                  type="text"
                  value={formData.location_city}
                  onChange={(e) =>
                    handleChange("location_city", e.target.value)
                  }
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.location_city ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.location_city && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.location_city}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prowincja
                </label>
                <select
                  value={formData.location_province}
                  onChange={(e) =>
                    handleChange("location_province", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Wybierz</option>
                  {DUTCH_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promień (km)
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formData.service_radius_km}
                  onChange={(e) =>
                    handleChange("service_radius_km", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* ADRES */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              📍 Adres biura
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ulica i numer
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Damstraat 123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kod pocztowy
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                  placeholder="1012 JS"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mt-1">
                  💡 Współrzędne GPS zostaną automatycznie wygenerowane po
                  zapisaniu
                </p>
              </div>
            </div>
          </div>

          {/* SPECJALIZACJA */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              🎯 Specjalizacja *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {specializationOptions.map((spec) => (
                <label
                  key={spec.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${
                    formData.specialization.includes(spec.value)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.specialization.includes(spec.value)}
                    onChange={() => toggleSpecialization(spec.value)}
                    className="w-5 h-5"
                  />
                  <span className="font-medium text-sm">{spec.label}</span>
                </label>
              ))}
            </div>
            {errors.specialization && (
              <p className="text-red-500 text-sm mt-2">
                {errors.specialization}
              </p>
            )}
          </div>

          {/* DODATKOWE USŁUGI */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              ✨ Dodatkowe usługi
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {additionalServicesOptions.map((srv) => (
                <label
                  key={srv.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer text-sm ${
                    formData.additional_services.includes(srv.value)
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.additional_services.includes(srv.value)}
                    onChange={() => toggleAdditionalService(srv.value)}
                    className="w-4 h-4"
                  />
                  <span>{srv.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* DOSTĘPNOŚĆ */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              📅 Dostępność
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Dni pracy:</p>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleAvailability(day.key)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm ${
                      formData.availability[day.key]
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferowane dni/tydzień: {formData.preferred_days_per_week}
              </label>
              <input
                type="range"
                min="1"
                max="7"
                value={formData.preferred_days_per_week}
                onChange={(e) =>
                  handleChange(
                    "preferred_days_per_week",
                    parseInt(e.target.value)
                  )
                }
                className="w-full"
              />
            </div>
          </div>

          {/* CENNIK */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">💰 Cennik</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stawka min (€/h)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={formData.hourly_rate_min}
                  onChange={(e) =>
                    handleChange("hourly_rate_min", parseInt(e.target.value))
                  }
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.hourly_rate_min
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.hourly_rate_min && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.hourly_rate_min}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stawka max (€/h)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={formData.hourly_rate_max}
                  onChange={(e) =>
                    handleChange("hourly_rate_max", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rate_negotiable}
                    onChange={(e) =>
                      handleChange("rate_negotiable", e.target.checked)
                    }
                    className="w-5 h-5"
                  />
                  <span className="font-medium">Stawki negocjowalne</span>
                </label>
              </div>
            </div>
          </div>

          {/* ZESPÓŁ */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">👥 Zespół</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pracowników
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.team_size}
                  onChange={(e) =>
                    handleChange("team_size", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lat doświadczenia
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.years_experience}
                  onChange={(e) =>
                    handleChange("years_experience", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KVK
                </label>
                <input
                  type="text"
                  value={formData.kvk_number}
                  maxLength={8}
                  onChange={(e) => handleChange("kvk_number", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* OPIS */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">📝 Opis</h3>
            <textarea
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Opisz firmę..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/500
            </p>
          </div>

          {/* OPINIE GOOGLE */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">⭐</span>
              Opinie Google (opcjonalne)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Dodaj linki do swoich opinii Google, aby wyświetlić je na
              publicznym profilu i zwiększyć zaufanie klientów.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link do Google Maps
                </label>
                <input
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) =>
                    handleChange("google_maps_url", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://maps.app.goo.gl/xxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link do opinii Google
                </label>
                <input
                  type="url"
                  value={formData.google_place_id}
                  onChange={(e) =>
                    handleChange("google_place_id", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://g.page/r/xxxxx"
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl">💡</span>
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Jak znaleźć linki:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-blue-600">
                    <li>
                      Otwórz{" "}
                      <a
                        href="https://www.google.com/maps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold"
                      >
                        Google Maps
                      </a>
                    </li>
                    <li>Znajdź swoją firmę / profil</li>
                    <li>Kliknij "Udostępnij" → skopiuj link (Maps)</li>
                    <li>
                      Kliknij "Zobacz opinie" → skopiuj link z paska adresu
                      (Opinie)
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* PRZYCISKI */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                saving
                  ? "bg-gray-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {saving ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyInfoEditModal;
