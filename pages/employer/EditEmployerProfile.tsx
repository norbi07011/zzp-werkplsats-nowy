/**
 * =====================================================
 * EDIT EMPLOYER PROFILE PAGE
 * =====================================================
 * Form for editing employer profile information
 * Created: 2025-10-28
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { geocodeAddress } from "../../services/geocoding";
import employerProfileService, {
  EmployerUpdateData,
} from "../../services/employerProfileService";
import type { Database } from "../../src/lib/database.types";

type Employer = Database["public"]["Tables"]["employers"]["Row"];

export default function EditEmployerProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState<EmployerUpdateData>({});

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await employerProfileService.getEmployerByUserId(user.id);

      if (data) {
        setEmployer(data);
        // @ts-ignore - Database types not yet regenerated after migration
        setFormData({
          company_name: data.company_name || "",
          kvk_number: data.kvk_number || "",
          description: data.description || "",
          industry: data.industry || "",
          company_size: data.company_size || "",
          address: data.address || "",
          postal_code: data.postal_code || "",
          city: data.city || "",
          country: data.country || "Netherlands",
          contact_phone: data.contact_phone || "",
          contact_email: data.contact_email || "",
          contact_person: data.contact_person || "",
          website: data.website || "",
          latitude: (data as any).latitude || null,
          longitude: (data as any).longitude || null,
          // Dutch company verification
          company_type: (data as any).company_type || "",
          btw_number: (data as any).btw_number || "",
          rsin_number: (data as any).rsin_number || "",
          // Google links only
          google_place_id: (data as any).google_place_id || "", // Link do opinii
          google_maps_url: (data as any).google_maps_url || "", // Link do mapy
        });
      }
    } catch (error) {
      console.error("Error loading employer profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employer?.id) return;

    try {
      setSaving(true);

      // Auto-geocoding: jeśli jest adres ale brak GPS, wygeneruj współrzędne
      let dataToSave = { ...formData };
      if (
        formData.address &&
        formData.city &&
        (!formData.latitude || !formData.longitude)
      ) {
        console.log("🗺️ Auto-geocoding address...");
        const geocoded = await geocodeAddress(
          formData.address,
          formData.city,
          formData.postal_code || undefined,
          formData.country || "Netherlands"
        );
        if (geocoded) {
          dataToSave.latitude = geocoded.latitude;
          dataToSave.longitude = geocoded.longitude;
          console.log("✅ Geocoding successful:", geocoded);
        } else {
          console.warn("⚠️ Geocoding failed, saving without coordinates");
        }
      }

      await employerProfileService.updateEmployerProfile(
        employer.id,
        dataToSave
      );
      navigate("/employer/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Błąd podczas zapisywania profilu");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!employer?.id || !e.target.files?.[0]) return;

    try {
      setUploadingLogo(true);
      const file = e.target.files[0];
      const logoUrl = await employerProfileService.uploadCompanyLogo(
        employer.id,
        file
      );

      if (logoUrl) {
        setEmployer({ ...employer, logo_url: logoUrl });
        alert("Logo zaktualizowane pomyślnie!");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Błąd podczas uploadu logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edytuj profil</h1>
        <button
          onClick={() => navigate("/employer/profile")}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-5 h-5"
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
          Anuluj
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Logo firmy</h2>

          <div className="flex items-center gap-6">
            {employer?.logo_url ? (
              <img
                src={employer.logo_url}
                alt="Company logo"
                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            )}

            <div className="flex-1">
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  {uploadingLogo ? "Uploading..." : "Zmień logo"}
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Maksymalny rozmiar: 5MB. Formaty: JPG, PNG, WebP
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Dane podstawowe
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nazwa firmy *"
              value={formData.company_name || ""}
              onChange={(value) =>
                setFormData({ ...formData, company_name: value })
              }
              required
            />

            <FormField
              label="Numer KVK *"
              value={formData.kvk_number || ""}
              onChange={(value) =>
                setFormData({ ...formData, kvk_number: value })
              }
              required
            />

            <FormField
              label="Branża"
              value={formData.industry || ""}
              onChange={(value) =>
                setFormData({ ...formData, industry: value })
              }
            />

            <FormSelect
              label="Wielkość firmy"
              value={formData.company_size || ""}
              onChange={(value) =>
                setFormData({ ...formData, company_size: value })
              }
              options={[
                { value: "", label: "Wybierz wielkość" },
                { value: "1-10", label: "1-10 pracowników" },
                { value: "11-50", label: "11-50 pracowników" },
                { value: "51-200", label: "51-200 pracowników" },
                { value: "201-500", label: "201-500 pracowników" },
                { value: "500+", label: "500+ pracowników" },
              ]}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opis firmy
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Opowiedz o swojej firmie..."
            />
          </div>
        </div>

        {/* Dutch Company Verification */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🇳🇱 Weryfikacja holenderskiej firmy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Forma prawna *"
              value={formData.company_type || ""}
              onChange={(value) =>
                setFormData({ ...formData, company_type: value })
              }
              options={[
                { value: "", label: "Wybierz formę prawną" },
                { value: "B.V.", label: "B.V. (Besloten Vennootschap)" },
                {
                  value: "Uitzendbureau",
                  label: "Uitzendbureau (Agencja pracy)",
                },
                { value: "ZZP", label: "ZZP (Zelfstandige zonder personeel)" },
                {
                  value: "Eenmanszaak",
                  label: "Eenmanszaak (Jednoosobowa działalność)",
                },
                { value: "V.O.F.", label: "V.O.F. (Vennootschap onder firma)" },
                { value: "N.V.", label: "N.V. (Naamloze Vennootschap)" },
              ]}
            />

            <FormField
              label="Numer BTW/VAT *"
              value={formData.btw_number || ""}
              onChange={(value) =>
                setFormData({ ...formData, btw_number: value })
              }
              placeholder="NL123456789B01"
            />

            <FormField
              label="Numer RSIN"
              value={formData.rsin_number || ""}
              onChange={(value) =>
                setFormData({ ...formData, rsin_number: value })
              }
              placeholder="9-cyfrowy numer"
            />
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Wymagania:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Tylko firmy <strong>B.V.</strong> i{" "}
                    <strong>Uitzendbureau</strong> mogą zakładać konta
                    pracodawcy
                  </li>
                  <li>
                    Numer BTW format:{" "}
                    <code className="px-1 py-0.5 bg-blue-100 rounded">
                      NL123456789B01
                    </code>
                  </li>
                  <li>
                    RSIN to 9-cyfrowy unikalny identyfikator osoby prawnej
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Google Maps & Reviews */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            📍 Google Maps i Opinie
          </h2>

          <div className="space-y-4">
            <FormField
              label="Link do Google Maps"
              value={formData.google_maps_url || ""}
              onChange={(value) =>
                setFormData({ ...formData, google_maps_url: value })
              }
              placeholder="https://maps.app.goo.gl/xxxxx"
            />

            <FormField
              label="Link do opinii Google"
              value={formData.google_place_id || ""}
              onChange={(value) =>
                setFormData({ ...formData, google_place_id: value })
              }
              placeholder="https://g.page/r/xxxxx"
            />
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Jak znaleźć linki:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Otwórz{" "}
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      className="underline font-semibold"
                    >
                      Google Maps
                    </a>
                  </li>
                  <li>Znajdź swoją firmę</li>
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

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Dane kontaktowe
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Osoba kontaktowa"
              value={formData.contact_person || ""}
              onChange={(value) =>
                setFormData({ ...formData, contact_person: value })
              }
            />

            <FormField
              label="Email kontaktowy"
              type="email"
              value={formData.contact_email || ""}
              onChange={(value) =>
                setFormData({ ...formData, contact_email: value })
              }
            />

            <FormField
              label="Telefon"
              type="tel"
              value={formData.contact_phone || ""}
              onChange={(value) =>
                setFormData({ ...formData, contact_phone: value })
              }
            />

            <FormField
              label="Strona internetowa"
              type="url"
              value={formData.website || ""}
              onChange={(value) => setFormData({ ...formData, website: value })}
              placeholder="https://"
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Adres</h2>

          <div className="space-y-4">
            <FormField
              label="Ulica i numer"
              value={formData.address || ""}
              onChange={(value) => setFormData({ ...formData, address: value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Kod pocztowy"
                value={formData.postal_code || ""}
                onChange={(value) =>
                  setFormData({ ...formData, postal_code: value })
                }
              />

              <FormField
                label="Miasto"
                value={formData.city || ""}
                onChange={(value) => setFormData({ ...formData, city: value })}
              />

              <FormField
                label="Kraj"
                value={formData.country || ""}
                onChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/employer/profile")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper Components
function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
