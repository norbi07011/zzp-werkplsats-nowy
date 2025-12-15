/**
 * ================================================================
 * CLEANING COMPANY SETTINGS PANEL - All settings in one place
 * ================================================================
 * Consolidates all cleaning company settings:
 * - Profile Images (avatar, cover image)
 * - Company Data (name, owner, KVK, contact, location)
 * - Services (specializations, additional services, rates)
 * - Availability (weekly schedule, blocked dates)
 * - Notifications (email, sms, push)
 * - Privacy (visibility, accepting clients)
 */

import React, { useState, useEffect } from "react";
import {
  Camera,
  FileText,
  Bell,
  Shield,
  Save,
  ChevronDown,
  ChevronUp,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Loader2,
  X,
  Plus,
  Check,
  Calendar,
  Clock,
  Briefcase,
} from "lucide-react";


















import { CoverImageUploader } from "../../src/components/common/CoverImageUploader";
import { GlowButton } from "../ui/GlowButton";
import type {
  CleaningCompany,
  UnavailableDate,
  CleaningSpecialization,
} from "../../types";

// ================================================================
// TYPES
// ================================================================

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  new_project_alerts: boolean;
  message_alerts: boolean;
  review_alerts: boolean;
}

interface PrivacySettings {
  profile_visibility: "public" | "contacts" | "private";
  show_email: boolean;
  show_phone: boolean;
  show_address: boolean;
  accepting_new_clients: boolean;
}

type SettingsSection =
  | "profile"
  | "company_data"
  | "services"
  | "availability"
  | "notifications"
  | "privacy";

interface CleaningCompanySettingsPanelProps {
  companyData: CleaningCompany | null;
  blockedDates: UnavailableDate[];
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  saving: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverImageUpload: (url: string) => void;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
  onNotificationSettingsSave: () => void;
  onPrivacySettingsChange: (settings: PrivacySettings) => void;
  onPrivacySettingsSave: () => void;
  onCompanyDataSave: (data: Partial<CleaningCompany>) => Promise<void>;
  onAvailabilityChange: (day: string, checked: boolean) => void;
  onBlockDate: (date: UnavailableDate) => void;
  onUnblockDate: (dateString: string) => void;
  isMobile?: boolean;
}

// ================================================================
// CONSTANTS
// ================================================================

const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: "profile",
    label: "Zdjęcia",
    icon: Camera,
    description: "Avatar i okładka",
  },
  {
    id: "company_data",
    label: "Dane Firmy",
    icon: Building2,
    description: "Informacje o firmie",
  },
  {
    id: "services",
    label: "Usługi",
    icon: Briefcase,
    description: "Specjalizacje i stawki",
  },
  {
    id: "availability",
    label: "Dostępność",
    icon: Calendar,
    description: "Harmonogram pracy",
  },
  {
    id: "notifications",
    label: "Powiadomienia",
    icon: Bell,
    description: "Email, SMS, Push",
  },
  {
    id: "privacy",
    label: "Prywatność",
    icon: Shield,
    description: "Widoczność profilu",
  },
];

const SPECIALIZATION_OPTIONS: CleaningSpecialization[] = [
  "cleaning_after_construction",
  "deep_cleaning",
  "office_cleaning",
  "window_cleaning",
  "maintenance_cleaning",
];

const ADDITIONAL_SERVICES_OPTIONS = [
  "waste_removal",
  "pressure_washing",
  "floor_polishing",
  "disinfection",
  "graffiti_removal",
  "air_duct_cleaning",
];

const DAYS_OF_WEEK = [
  { key: "monday", label: "Poniedziałek" },
  { key: "tuesday", label: "Wtorek" },
  { key: "wednesday", label: "Środa" },
  { key: "thursday", label: "Czwartek" },
  { key: "friday", label: "Piątek" },
  { key: "saturday", label: "Sobota" },
  { key: "sunday", label: "Niedziela" },
];

// ================================================================
// COMPONENT
// ================================================================

export const CleaningCompanySettingsPanel: React.FC<
  CleaningCompanySettingsPanelProps
> = ({
  companyData,
  blockedDates,
  notificationSettings,
  privacySettings,
  saving,
  onAvatarUpload,
  onCoverImageUpload,
  onNotificationSettingsChange,
  onNotificationSettingsSave,
  onPrivacySettingsChange,
  onPrivacySettingsSave,
  onCompanyDataSave,
  onAvailabilityChange,
  onBlockDate,
  onUnblockDate,
  isMobile = false,
}) => {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  const [localSaving, setLocalSaving] = useState(false);

  // Local form state for company data
  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    owner_name: "",
    email: "",
    phone: "",
    kvk_number: "",
    location_city: "",
    location_province: "",
    bio: "",
    team_size: 1,
    years_experience: 0,
    service_radius_km: 20,
    hourly_rate_min: 0,
    hourly_rate_max: 0,
    rate_negotiable: true,
    specialization: [] as CleaningSpecialization[],
    additional_services: [] as string[],
  });

  // New blocked date form
  const [newBlockedDate, setNewBlockedDate] = useState({
    date: "",
    reason: "",
  });

  // Initialize form from company data
  useEffect(() => {
    if (companyData) {
      setCompanyForm({
        company_name: companyData.company_name || "",
        owner_name: companyData.owner_name || "",
        email: companyData.email || "",
        phone: companyData.phone || "",
        kvk_number: companyData.kvk_number || "",
        location_city: companyData.location_city || "",
        location_province: companyData.location_province || "",
        bio: companyData.bio || "",
        team_size: companyData.team_size || 1,
        years_experience: companyData.years_experience || 0,
        service_radius_km: companyData.service_radius_km || 20,
        hourly_rate_min: companyData.hourly_rate_min || 0,
        hourly_rate_max: companyData.hourly_rate_max || 0,
        rate_negotiable: companyData.rate_negotiable ?? true,
        specialization: companyData.specialization || [],
        additional_services: companyData.additional_services || [],
      });
    }
  }, [companyData]);

  const handleCompanyFormSave = async () => {
    setLocalSaving(true);
    try {
      await onCompanyDataSave(companyForm);
    } finally {
      setLocalSaving(false);
    }
  };

  const handleServicesSave = async () => {
    setLocalSaving(true);
    try {
      await onCompanyDataSave({
        specialization: companyForm.specialization,
        additional_services: companyForm.additional_services,
        hourly_rate_min: companyForm.hourly_rate_min,
        hourly_rate_max: companyForm.hourly_rate_max,
        rate_negotiable: companyForm.rate_negotiable,
        service_radius_km: companyForm.service_radius_km,
      });
    } finally {
      setLocalSaving(false);
    }
  };

  const toggleSpecialization = (spec: CleaningSpecialization) => {
    setCompanyForm((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  };

  const toggleAdditionalService = (service: string) => {
    setCompanyForm((prev) => ({
      ...prev,
      additional_services: prev.additional_services.includes(service)
        ? prev.additional_services.filter((s) => s !== service)
        : [...prev.additional_services, service],
    }));
  };

  const handleAddBlockedDate = () => {
    if (newBlockedDate.date) {
      onBlockDate({
        date: newBlockedDate.date,
        reason: newBlockedDate.reason || "Niedostępny",
        type: "other",
      });
      setNewBlockedDate({ date: "", reason: "" });
    }
  };

  // ================================================================
  // RENDER SECTIONS
  // ================================================================

  const renderProfileSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Camera className="w-5 h-5 text-blue-500" />
        Zdjęcia Profilu
      </h3>

      {/* Avatar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Logo / Avatar
        </h4>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center overflow-hidden">
              {companyData?.avatar_url ? (
                <img
                  src={companyData.avatar_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-12 h-12 text-white" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarUpload}
              />
            </label>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Zalecany rozmiar: 200x200 px</p>
            <p>Maksymalny rozmiar: 2 MB</p>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Zdjęcie Okładki
        </h4>
        <CoverImageUploader
          currentCoverUrl={companyData?.cover_image_url}
          onUploadSuccess={onCoverImageUpload}
          profileType="cleaning_company"
          profileId={companyData?.id || ""}
        />
      </div>
    </div>
  );

  const renderCompanyDataSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Building2 className="w-5 h-5 text-blue-500" />
        Dane Firmy
      </h3>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nazwa Firmy *
          </label>
          <input
            type="text"
            value={companyForm.company_name}
            onChange={(e) =>
              setCompanyForm({ ...companyForm, company_name: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Nazwa firmy sprzątającej"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Właściciel
          </label>
          <input
            type="text"
            value={companyForm.owner_name}
            onChange={(e) =>
              setCompanyForm({ ...companyForm, owner_name: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Imię i nazwisko właściciela"
          />
        </div>

        {/* KVK */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Numer KVK
          </label>
          <input
            type="text"
            value={companyForm.kvk_number}
            onChange={(e) =>
              setCompanyForm({ ...companyForm, kvk_number: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="12345678"
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={companyForm.email}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, email: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="firma@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Telefon
            </label>
            <input
              type="tel"
              value={companyForm.phone}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, phone: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="+31 6 12345678"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Miasto
            </label>
            <input
              type="text"
              value={companyForm.location_city}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  location_city: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Amsterdam"
            />
          </div>
        </div>

        {/* Team & Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Wielkość Zespołu
            </label>
            <input
              type="number"
              min="1"
              value={companyForm.team_size}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  team_size: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lata Doświadczenia
            </label>
            <input
              type="number"
              min="0"
              value={companyForm.years_experience}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  years_experience: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Opis Firmy
          </label>
          <textarea
            value={companyForm.bio}
            onChange={(e) =>
              setCompanyForm({ ...companyForm, bio: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            placeholder="Opisz swoją firmę..."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <GlowButton
            onClick={handleCompanyFormSave}
            disabled={saving || localSaving}
            className="flex items-center gap-2"
          >
            {saving || localSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Zapisz Dane Firmy
              </>
            )}
          </GlowButton>
        </div>
      </div>
    </div>
  );

  const renderServicesSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-blue-500" />
        Usługi i Stawki
      </h3>

      {/* Specializations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Specjalizacje
        </h4>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATION_OPTIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => toggleSpecialization(spec)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                companyForm.specialization.includes(spec)
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {spec.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Services */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Dodatkowe Usługi
        </h4>
        <div className="flex flex-wrap gap-2">
          {ADDITIONAL_SERVICES_OPTIONS.map((service) => (
            <button
              key={service}
              onClick={() => toggleAdditionalService(service)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                companyForm.additional_services.includes(service)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {service.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Rates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Stawki
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Euro className="w-4 h-4 inline mr-1" />
              Stawka Min (€/h)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={companyForm.hourly_rate_min}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  hourly_rate_min: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Euro className="w-4 h-4 inline mr-1" />
              Stawka Max (€/h)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={companyForm.hourly_rate_max}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  hourly_rate_max: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rate_negotiable"
            checked={companyForm.rate_negotiable}
            onChange={(e) =>
              setCompanyForm({
                ...companyForm,
                rate_negotiable: e.target.checked,
              })
            }
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label
            htmlFor="rate_negotiable"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Stawka do negocjacji
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Promień Obsługi (km)
          </label>
          <input
            type="number"
            min="1"
            max="200"
            value={companyForm.service_radius_km}
            onChange={(e) =>
              setCompanyForm({
                ...companyForm,
                service_radius_km: parseInt(e.target.value) || 20,
              })
            }
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <GlowButton
            onClick={handleServicesSave}
            disabled={saving || localSaving}
            className="flex items-center gap-2"
          >
            {saving || localSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Zapisz Usługi
              </>
            )}
          </GlowButton>
        </div>
      </div>
    </div>
  );

  const renderAvailabilitySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-500" />
        Dostępność
      </h3>

      {/* Weekly Availability */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Harmonogram Tygodniowy
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const isAvailable =
              companyData?.availability?.[
                day.key as keyof typeof companyData.availability
              ] ?? false;
            return (
              <button
                key={day.key}
                onClick={() => onAvailabilityChange(day.key, !isAvailable)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  isAvailable
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-2 border-transparent"
                }`}
              >
                <div className="font-medium text-sm">{day.label}</div>
                <div className="text-xs mt-1">
                  {isAvailable ? "✓ Dostępny" : "✗ Niedostępny"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Zablokowane Daty
        </h4>

        {/* Add new blocked date */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="date"
            value={newBlockedDate.date}
            onChange={(e) =>
              setNewBlockedDate({ ...newBlockedDate, date: e.target.value })
            }
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <input
            type="text"
            value={newBlockedDate.reason}
            onChange={(e) =>
              setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })
            }
            placeholder="Powód (opcjonalnie)"
            className="flex-1 min-w-[150px] px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={handleAddBlockedDate}
            disabled={!newBlockedDate.date}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Zablokuj
          </button>
        </div>

        {/* List blocked dates */}
        {blockedDates.length > 0 ? (
          <div className="space-y-2">
            {blockedDates.map((date, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <div>
                  <span className="font-medium text-red-700 dark:text-red-400">
                    {new Date(date.date).toLocaleDateString("pl-PL")}
                  </span>
                  {date.reason && (
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      - {date.reason}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onUnblockDate(date.date)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Brak zablokowanych dat
          </p>
        )}
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-500" />
        Powiadomienia
      </h3>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        {/* Email */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Powiadomienia Email
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Otrzymuj powiadomienia na email
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.email_enabled}
              onChange={(e) =>
                onNotificationSettingsChange({
                  ...notificationSettings,
                  email_enabled: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* SMS */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Powiadomienia SMS
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Otrzymuj SMS z ważnymi alertami
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.sms_enabled}
              onChange={(e) =>
                onNotificationSettingsChange({
                  ...notificationSettings,
                  sms_enabled: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Push */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Powiadomienia Push
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Powiadomienia w przeglądarce
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.push_enabled}
              onChange={(e) =>
                onNotificationSettingsChange({
                  ...notificationSettings,
                  push_enabled: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Specific alerts */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Nowe projekty
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Alert o nowych zleceniach
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.new_project_alerts}
              onChange={(e) =>
                onNotificationSettingsChange({
                  ...notificationSettings,
                  new_project_alerts: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Nowe wiadomości
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Powiadomienia o nowych wiadomościach
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.message_alerts}
              onChange={(e) =>
                onNotificationSettingsChange({
                  ...notificationSettings,
                  message_alerts: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Nowe opinie
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Powiadomienia o nowych opiniach
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationSettings.review_alerts}
              onChange={(e) =>
                onNotificationSettingsChange({
                  ...notificationSettings,
                  review_alerts: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <GlowButton
            onClick={onNotificationSettingsSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Zapisz Powiadomienia
              </>
            )}
          </GlowButton>
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-500" />
        Prywatność
      </h3>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
        {/* Profile Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Widoczność Profilu
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["public", "contacts", "private"] as const).map((visibility) => (
              <button
                key={visibility}
                onClick={() =>
                  onPrivacySettingsChange({
                    ...privacySettings,
                    profile_visibility: visibility,
                  })
                }
                className={`p-3 rounded-lg text-center transition-colors ${
                  privacySettings.profile_visibility === visibility
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-500"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent"
                }`}
              >
                {visibility === "public" && "🌍 Publiczny"}
                {visibility === "contacts" && "👥 Kontakty"}
                {visibility === "private" && "🔒 Prywatny"}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Show Email */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Pokaż Email
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Widoczny na profilu publicznym
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacySettings.show_email}
              onChange={(e) =>
                onPrivacySettingsChange({
                  ...privacySettings,
                  show_email: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Show Phone */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Pokaż Telefon
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Widoczny na profilu publicznym
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacySettings.show_phone}
              onChange={(e) =>
                onPrivacySettingsChange({
                  ...privacySettings,
                  show_phone: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Show Address */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Pokaż Adres
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Widoczny na profilu publicznym
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacySettings.show_address}
              onChange={(e) =>
                onPrivacySettingsChange({
                  ...privacySettings,
                  show_address: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Accepting New Clients */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Przyjmuję Nowych Klientów
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Widoczne w wyszukiwaniu
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacySettings.accepting_new_clients}
              onChange={(e) =>
                onPrivacySettingsChange({
                  ...privacySettings,
                  accepting_new_clients: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <GlowButton
            onClick={onPrivacySettingsSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Zapisz Prywatność
              </>
            )}
          </GlowButton>
        </div>
      </div>
    </div>
  );

  // ================================================================
  // MAIN RENDER
  // ================================================================

  return (
    <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-6`}>
      {/* Sidebar Navigation */}
      <div className={`${isMobile ? "w-full" : "w-64 flex-shrink-0"}`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Ustawienia
            </h2>
          </div>
          <nav
            className={`${
              isMobile ? "flex overflow-x-auto" : "flex flex-col"
            } p-2`}
          >
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`${
                    isMobile ? "flex-shrink-0" : "w-full"
                  } flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-blue-500" : ""}`}
                  />
                  <div className="text-left">
                    <div className="font-medium">{section.label}</div>
                    {!isMobile && (
                      <div className="text-xs opacity-70">
                        {section.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeSection === "profile" && renderProfileSection()}
        {activeSection === "company_data" && renderCompanyDataSection()}
        {activeSection === "services" && renderServicesSection()}
        {activeSection === "availability" && renderAvailabilitySection()}
        {activeSection === "notifications" && renderNotificationsSection()}
        {activeSection === "privacy" && renderPrivacySection()}
      </div>
    </div>
  );
};

export default CleaningCompanySettingsPanel;
