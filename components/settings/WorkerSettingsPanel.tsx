/**
 * ================================================================
 * WORKER SETTINGS PANEL - All settings in one beautiful place
 * ================================================================
 * Consolidates all worker settings:
 * - Profile (avatar, cover image)
 * - Availability (weekly schedule, blocked dates)
 * - Notifications (email, sms, push)
 * - Privacy (visibility, contact info)
 * - Language & Preferences
 */

import React, { useState } from "react";



















import { CoverImageUploader } from "../../src/components/common/CoverImageUploader";
import DateBlocker from "../../src/components/common/DateBlocker";
import { GlowButton } from "../ui/GlowButton";
import type { UnavailableDate } from "../../types";

// ================================================================
// TYPES
// ================================================================

interface WorkerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  cover_image_url?: string;
  availability?: Record<string, boolean>;
  preferred_days_per_week?: number;
  is_available?: boolean;
  // Extended profile fields
  specialization?: string;
  bio?: string;
  years_experience?: number;
  hourly_rate?: number;
  hourly_rate_max?: number | null;
  rate_negotiable?: boolean;
  location_city?: string;
  address?: string;
  postal_code?: string;
  location_country?: string;
  service_radius_km?: number;
  kvk_number?: string;
  btw_number?: string;
  languages?: string[];
  skills?: string[];
  certifications?: string[];
  own_tools?: string[];
  own_vehicle?: boolean;
  vehicle_type?: string;
}

// Extended profile data for editing
interface ProfileFormData {
  full_name: string;
  phone: string;
  specialization: string;
  bio: string;
  years_experience: number;
  hourly_rate: number;
  hourly_rate_max: number | null;
  rate_negotiable: boolean;
  location_city: string;
  address: string;
  postal_code: string;
  location_country: string;
  service_radius_km: number;
  kvk_number: string;
  btw_number: string;
  languages: string[];
  certifications: string[];
  own_tools: string[];
  own_vehicle: boolean;
  vehicle_type: string;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  job_alerts: boolean;
  message_alerts: boolean;
  review_alerts: boolean;
}

interface PrivacySettings {
  profile_visibility: "public" | "contacts" | "private";
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  allow_messages: boolean;
}

type SettingsSection =
  | "profile"
  | "profile_data"
  | "availability"
  | "notifications"
  | "privacy"
  | "language";

interface WorkerSettingsPanelProps {
  workerProfile: WorkerProfile | null;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  language: string;
  blockedDates: UnavailableDate[];
  saving: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverImageUpload: (url: string) => void;
  onAvailabilityChange: (day: string) => void;
  onAvailabilityToggle: (isAvailable: boolean) => void;
  onBlockDate: (date: UnavailableDate) => void;
  onUnblockDate: (date: string | UnavailableDate) => void;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
  onNotificationSettingsSave: () => void;
  onPrivacySettingsChange: (settings: PrivacySettings) => void;
  onPrivacySettingsSave: () => void;
  onLanguageChange: (lang: string) => void;
  // NEW: Profile data editing
  onProfileDataSave: (data: ProfileFormData) => Promise<void>;
  isMobile?: boolean;
}

// ================================================================
// CONSTANTS
// ================================================================

const WEEK_DAYS_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const WEEK_DAYS_DB = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

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
    id: "profile_data",
    label: "Dane Profilowe",
    icon: FileText,
    description: "Edytuj informacje",
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
  {
    id: "language",
    label: "Język",
    icon: Globe,
    description: "Preferencje regionalne",
  },
];

// ================================================================
// COMPONENT
// ================================================================

export const WorkerSettingsPanel: React.FC<WorkerSettingsPanelProps> = ({
  workerProfile,
  notificationSettings,
  privacySettings,
  language,
  blockedDates,
  saving,
  onAvatarUpload,
  onCoverImageUpload,
  onAvailabilityChange,
  onAvailabilityToggle,
  onBlockDate,
  onUnblockDate,
  onNotificationSettingsChange,
  onNotificationSettingsSave,
  onPrivacySettingsChange,
  onPrivacySettingsSave,
  onLanguageChange,
  onProfileDataSave,
  isMobile = false,
}) => {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  const [savedSections, setSavedSections] = useState<Set<SettingsSection>>(
    new Set()
  );

  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    full_name: workerProfile?.full_name || "",
    phone: workerProfile?.phone || "",
    specialization: workerProfile?.specialization || "",
    bio: workerProfile?.bio || "",
    years_experience: workerProfile?.years_experience || 0,
    hourly_rate: workerProfile?.hourly_rate || 0,
    hourly_rate_max: workerProfile?.hourly_rate_max || null,
    rate_negotiable: workerProfile?.rate_negotiable || false,
    location_city: workerProfile?.location_city || "",
    address: workerProfile?.address || "",
    postal_code: workerProfile?.postal_code || "",
    location_country: workerProfile?.location_country || "NL",
    service_radius_km: workerProfile?.service_radius_km || 50,
    kvk_number: workerProfile?.kvk_number || "",
    btw_number: workerProfile?.btw_number || "",
    languages: workerProfile?.languages || ["nl"],
    certifications: workerProfile?.certifications || [],
    own_tools: workerProfile?.own_tools || [],
    own_vehicle: workerProfile?.own_vehicle || false,
    vehicle_type: workerProfile?.vehicle_type || "",
  });

  // Input state for adding items
  const [newLanguage, setNewLanguage] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newTool, setNewTool] = useState("");

  const markAsSaved = (section: SettingsSection) => {
    setSavedSections((prev) => new Set([...prev, section]));
    setTimeout(() => {
      setSavedSections((prev) => {
        const next = new Set(prev);
        next.delete(section);
        return next;
      });
    }, 2000);
  };

  // ================================================================
  // RENDER SECTIONS
  // ================================================================

  const renderProfileSection = () => (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Camera size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Zdjęcie profilowe</h3>
            <p className="text-sm text-gray-500">Twoja twarz w serwisie</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative">
            {workerProfile?.avatar_url ? (
              <img
                src={workerProfile.avatar_url}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-5xl border-4 border-white shadow-xl">
                {workerProfile?.full_name?.[0]?.toUpperCase() || "W"}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
              <label className="cursor-pointer">
                <Camera size={18} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarUpload}
                />
              </label>
            </div>
          </div>

          {/* Avatar Instructions */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-gray-600 mb-2">Zalecany rozmiar: 400x400 px</p>
            <p className="text-sm text-gray-500">Format: JPG, PNG (max 5MB)</p>
            <label className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium cursor-pointer hover:shadow-lg transition-all">
              📷 Zmień zdjęcie
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarUpload}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Image size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Zdjęcie w tle</h3>
            <p className="text-sm text-gray-500">Baner na Twoim profilu</p>
          </div>
        </div>

        {workerProfile && (
          <CoverImageUploader
            currentCoverUrl={workerProfile.cover_image_url}
            onUploadSuccess={onCoverImageUpload}
            profileType="worker"
            profileId={workerProfile.id}
          />
        )}
      </div>
    </div>
  );

  // ================================================================
  // PROFILE DATA SECTION - Full profile editing
  // ================================================================

  const handleProfileDataSubmit = async () => {
    await onProfileDataSave(profileForm);
    markAsSaved("profile_data");
  };

  const addLanguage = () => {
    if (
      newLanguage.trim() &&
      !profileForm.languages.includes(newLanguage.trim())
    ) {
      setProfileForm({
        ...profileForm,
        languages: [...profileForm.languages, newLanguage.trim()],
      });
      setNewLanguage("");
    }
  };

  const removeLanguage = (lang: string) => {
    setProfileForm({
      ...profileForm,
      languages: profileForm.languages.filter((l) => l !== lang),
    });
  };

  const addCertification = () => {
    if (
      newCertification.trim() &&
      !profileForm.certifications.includes(newCertification.trim())
    ) {
      setProfileForm({
        ...profileForm,
        certifications: [
          ...profileForm.certifications,
          newCertification.trim(),
        ],
      });
      setNewCertification("");
    }
  };

  const removeCertification = (cert: string) => {
    setProfileForm({
      ...profileForm,
      certifications: profileForm.certifications.filter((c) => c !== cert),
    });
  };

  const addTool = () => {
    if (newTool.trim() && !profileForm.own_tools.includes(newTool.trim())) {
      setProfileForm({
        ...profileForm,
        own_tools: [...profileForm.own_tools, newTool.trim()],
      });
      setNewTool("");
    }
  };

  const removeTool = (tool: string) => {
    setProfileForm({
      ...profileForm,
      own_tools: profileForm.own_tools.filter((t) => t !== tool),
    });
  };

  const renderProfileDataSection = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Podstawowe informacje</h3>
            <p className="text-sm text-gray-500">
              Imię, specjalizacja, doświadczenie
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imię i nazwisko
            </label>
            <input
              type="text"
              value={profileForm.full_name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, full_name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Jan Kowalski"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+31 6 12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specjalizacja
            </label>
            <select
              value={profileForm.specialization}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  specialization: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Wybierz specjalizację</option>
              <option value="construction">🏗️ Budownictwo</option>
              <option value="renovation">🔨 Remonty</option>
              <option value="electrical">⚡ Elektryka</option>
              <option value="plumbing">🔧 Hydraulika</option>
              <option value="painting">🎨 Malarstwo</option>
              <option value="flooring">🪵 Podłogi</option>
              <option value="roofing">🏠 Dachy</option>
              <option value="carpentry">🪚 Stolarstwo</option>
              <option value="welding">🔥 Spawanie</option>
              <option value="hvac">❄️ HVAC/Klimatyzacja</option>
              <option value="landscaping">🌳 Ogrodnictwo</option>
              <option value="cleaning">🧹 Sprzątanie</option>
              <option value="other">📦 Inne</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lata doświadczenia
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={profileForm.years_experience}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  years_experience: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            O mnie (bio)
          </label>
          <textarea
            rows={4}
            value={profileForm.bio}
            onChange={(e) =>
              setProfileForm({ ...profileForm, bio: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Opisz swoje doświadczenie, umiejętności i co wyróżnia Cię jako pracownika..."
          />
        </div>
      </div>

      {/* Rates */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Euro size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Stawki</h3>
            <p className="text-sm text-gray-500">Stawka godzinowa i warunki</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stawka min (€/h)
            </label>
            <input
              type="number"
              min="0"
              step="0.50"
              value={profileForm.hourly_rate}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  hourly_rate: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="25.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stawka max (€/h)
            </label>
            <input
              type="number"
              min="0"
              step="0.50"
              value={profileForm.hourly_rate_max || ""}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  hourly_rate_max: e.target.value
                    ? parseFloat(e.target.value)
                    : null,
                })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="45.00 (opcjonalnie)"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors w-full">
              <input
                type="checkbox"
                checked={profileForm.rate_negotiable}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    rate_negotiable: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-700">Stawka do negocjacji</span>
            </label>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Lokalizacja</h3>
            <p className="text-sm text-gray-500">Adres i obszar pracy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miasto
            </label>
            <input
              type="text"
              value={profileForm.location_city}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  location_city: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Amsterdam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kod pocztowy
            </label>
            <input
              type="text"
              value={profileForm.postal_code}
              onChange={(e) =>
                setProfileForm({ ...profileForm, postal_code: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="1012 AB"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adres
            </label>
            <input
              type="text"
              value={profileForm.address}
              onChange={(e) =>
                setProfileForm({ ...profileForm, address: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Damrak 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zasięg pracy (km)
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={profileForm.service_radius_km}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  service_radius_km: parseInt(e.target.value) || 50,
                })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kraj
            </label>
            <select
              value={profileForm.location_country}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  location_country: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="NL">🇳🇱 Holandia</option>
              <option value="BE">🇧🇪 Belgia</option>
              <option value="DE">🇩🇪 Niemcy</option>
              <option value="PL">🇵🇱 Polska</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Dane firmy</h3>
            <p className="text-sm text-gray-500">KVK, BTW i informacje ZZP</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numer KVK
            </label>
            <input
              type="text"
              value={profileForm.kvk_number}
              onChange={(e) =>
                setProfileForm({ ...profileForm, kvk_number: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numer BTW
            </label>
            <input
              type="text"
              value={profileForm.btw_number}
              onChange={(e) =>
                setProfileForm({ ...profileForm, btw_number: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="NL123456789B01"
            />
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <Languages size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Języki</h3>
            <p className="text-sm text-gray-500">Jakie języki znasz</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {profileForm.languages.map((lang) => (
            <span
              key={lang}
              className="inline-flex items-center gap-2 px-3 py-2 bg-teal-100 text-teal-700 rounded-lg"
            >
              {lang}
              <button
                onClick={() => removeLanguage(lang)}
                className="hover:text-teal-900"
              >
                <X size={16} />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Wybierz język</option>
            <option value="Nederlands">🇳🇱 Nederlands</option>
            <option value="Engels">🇬🇧 Engels</option>
            <option value="Pools">🇵🇱 Pools</option>
            <option value="Duits">🇩🇪 Duits</option>
            <option value="Frans">🇫🇷 Frans</option>
            <option value="Spaans">🇪🇸 Spaans</option>
            <option value="Turks">🇹🇷 Turks</option>
            <option value="Arabisch">🇸🇦 Arabisch</option>
          </select>
          <button
            onClick={addLanguage}
            className="px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Certyfikaty</h3>
            <p className="text-sm text-gray-500">
              Posiadane certyfikaty i uprawnienia
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {profileForm.certifications.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg"
            >
              🏆 {cert}
              <button
                onClick={() => removeCertification(cert)}
                className="hover:text-amber-900"
              >
                <X size={16} />
              </button>
            </span>
          ))}
          {profileForm.certifications.length === 0 && (
            <span className="text-gray-400 text-sm">Brak certyfikatów</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addCertification()}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Wpisz nazwę certyfikatu..."
          />
          <button
            onClick={addCertification}
            className="px-4 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Tools & Vehicle */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
            <Wrench size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Narzędzia i pojazd</h3>
            <p className="text-sm text-gray-500">Własne wyposażenie</p>
          </div>
        </div>

        {/* Vehicle */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={profileForm.own_vehicle}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  own_vehicle: e.target.checked,
                })
              }
              className="w-5 h-5 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
            />
            <Car size={20} className="text-gray-600" />
            <span className="font-medium text-gray-700">
              Posiadam własny pojazd
            </span>
          </label>

          {profileForm.own_vehicle && (
            <select
              value={profileForm.vehicle_type}
              onChange={(e) =>
                setProfileForm({ ...profileForm, vehicle_type: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="">Wybierz typ pojazdu</option>
              <option value="car">🚗 Samochód osobowy</option>
              <option value="van">🚐 Van / Bus</option>
              <option value="truck">🚛 Ciężarówka</option>
              <option value="motorcycle">🏍️ Motocykl</option>
              <option value="bike">🚲 Rower</option>
            </select>
          )}
        </div>

        {/* Tools */}
        <div>
          <p className="font-medium text-gray-700 mb-3">Własne narzędzia:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {profileForm.own_tools.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg"
              >
                🔧 {tool}
                <button
                  onClick={() => removeTool(tool)}
                  className="hover:text-gray-900"
                >
                  <X size={16} />
                </button>
              </span>
            ))}
            {profileForm.own_tools.length === 0 && (
              <span className="text-gray-400 text-sm">
                Brak dodanych narzędzi
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTool}
              onChange={(e) => setNewTool(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTool()}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Wpisz narzędzie (np. wiertarka, spawarka)..."
            />
            <button
              onClick={addTool}
              className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <GlowButton
          onClick={handleProfileDataSubmit}
          disabled={saving}
          variant="primary"
          size="lg"
        >
          {savedSections.has("profile_data") ? (
            <>
              <Check size={20} className="mr-2" />
              Zapisano!
            </>
          ) : (
            <>
              <Save size={20} className="mr-2" />
              Zapisz dane profilowe
            </>
          )}
        </GlowButton>
      </div>
    </div>
  );

  const renderAvailabilitySection = () => (
    <div className="space-y-8">
      {/* Main Availability Toggle */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                workerProfile?.is_available
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200"
                  : "bg-gradient-to-br from-gray-400 to-gray-500"
              }`}
            >
              <span className="text-2xl">
                {workerProfile?.is_available ? "✓" : "✗"}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {workerProfile?.is_available
                  ? "Dostępny do pracy"
                  : "Niedostępny"}
              </h3>
              <p className="text-sm text-gray-500">
                {workerProfile?.is_available
                  ? "Twój profil jest widoczny dla pracodawców"
                  : "Twój profil jest ukryty w wyszukiwarce"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onAvailabilityToggle(!workerProfile?.is_available)}
            disabled={saving}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
              workerProfile?.is_available
                ? "bg-gradient-to-r from-green-500 to-emerald-600 focus:ring-green-200"
                : "bg-gray-300 focus:ring-gray-200"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                workerProfile?.is_available ? "translate-x-9" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Harmonogram tygodniowy</h3>
            <p className="text-sm text-gray-500">
              Zaznacz dni kiedy możesz pracować
            </p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-6">
          {WEEK_DAYS_PL.map((day, index) => {
            const dbDayKey = WEEK_DAYS_DB[index];
            const isAvailable =
              workerProfile?.availability?.[dbDayKey] ?? index < 5;

            return (
              <div key={day} className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-2">{day}</p>
                <button
                  onClick={() => onAvailabilityChange(day)}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${
                    isAvailable
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {isAvailable ? "✓" : "—"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm text-green-600 mb-1">Dostępne dni</p>
            <p className="text-3xl font-bold text-green-700">
              {workerProfile?.availability
                ? Object.values(workerProfile.availability).filter(Boolean)
                    .length
                : 5}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Preferowane</p>
            <p className="text-3xl font-bold text-blue-700">
              {workerProfile?.preferred_days_per_week || 5} dni/tyg
            </p>
          </div>
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Lock size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Zablokowane daty</h3>
            <p className="text-sm text-gray-500">Urlopy, święta, dni wolne</p>
          </div>
        </div>

        <DateBlocker
          blockedDates={blockedDates}
          onBlock={onBlockDate}
          onUnblock={onUnblockDate}
        />
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Kanały powiadomień</h3>
            <p className="text-sm text-gray-500">
              Jak chcesz otrzymywać informacje
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              key: "email_enabled",
              label: "Email",
              description: "Powiadomienia na email",
              icon: "📧",
            },
            {
              key: "sms_enabled",
              label: "SMS",
              description: "Wiadomości tekstowe",
              icon: "📱",
            },
            {
              key: "push_enabled",
              label: "Push",
              description: "Powiadomienia w przeglądarce",
              icon: "🔔",
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={
                    notificationSettings[
                      item.key as keyof NotificationSettings
                    ] as boolean
                  }
                  onChange={(e) =>
                    onNotificationSettingsChange({
                      ...notificationSettings,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-14 h-8 rounded-full transition-colors ${
                    notificationSettings[item.key as keyof NotificationSettings]
                      ? "bg-gradient-to-r from-green-500 to-emerald-600"
                      : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform mt-1 ${
                      notificationSettings[
                        item.key as keyof NotificationSettings
                      ]
                        ? "translate-x-7"
                        : "translate-x-1"
                    }`}
                  />
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Rodzaje alertów</h4>
          <div className="space-y-3">
            {[
              { key: "job_alerts", label: "Nowe oferty pracy", icon: "💼" },
              { key: "message_alerts", label: "Nowe wiadomości", icon: "💬" },
              { key: "review_alerts", label: "Nowe opinie", icon: "⭐" },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={
                    notificationSettings[
                      item.key as keyof NotificationSettings
                    ] as boolean
                  }
                  onChange={(e) =>
                    onNotificationSettingsChange({
                      ...notificationSettings,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">{item.icon}</span>
                <span className="text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <GlowButton
            onClick={() => {
              onNotificationSettingsSave();
              markAsSaved("notifications");
            }}
            disabled={saving}
            variant="primary"
            size="md"
          >
            {savedSections.has("notifications") ? (
              <>
                <Check size={18} className="mr-2" />
                Zapisano!
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Zapisz powiadomienia
              </>
            )}
          </GlowButton>
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Widoczność profilu</h3>
            <p className="text-sm text-gray-500">
              Kto może zobaczyć Twój profil
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            {
              value: "public",
              label: "Publiczny",
              icon: "🌍",
              description: "Wszyscy",
            },
            {
              value: "contacts",
              label: "Kontakty",
              icon: "👥",
              description: "Tylko znajomi",
            },
            {
              value: "private",
              label: "Prywatny",
              icon: "🔒",
              description: "Nikt",
            },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() =>
                onPrivacySettingsChange({
                  ...privacySettings,
                  profile_visibility: option.value as any,
                })
              }
              className={`p-4 rounded-xl border-2 transition-all ${
                privacySettings.profile_visibility === option.value
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-3xl mb-2">{option.icon}</div>
              <p className="font-medium text-gray-900">{option.label}</p>
              <p className="text-xs text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Pokaż publicznie:</h4>
          {[
            { key: "show_email", label: "Adres email", icon: "📧" },
            { key: "show_phone", label: "Numer telefonu", icon: "📱" },
            { key: "show_location", label: "Lokalizacja", icon: "📍" },
            {
              key: "allow_messages",
              label: "Zezwól na wiadomości",
              icon: "💬",
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-gray-700">{item.label}</span>
              </div>
              <input
                type="checkbox"
                checked={
                  privacySettings[item.key as keyof PrivacySettings] as boolean
                }
                onChange={(e) =>
                  onPrivacySettingsChange({
                    ...privacySettings,
                    [item.key]: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          ))}
        </div>

        <div className="mt-6">
          <GlowButton
            onClick={() => {
              onPrivacySettingsSave();
              markAsSaved("privacy");
            }}
            disabled={saving}
            variant="purple"
            size="md"
          >
            {savedSections.has("privacy") ? (
              <>
                <Check size={18} className="mr-2" />
                Zapisano!
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Zapisz prywatność
              </>
            )}
          </GlowButton>
        </div>
      </div>
    </div>
  );

  const renderLanguageSection = () => (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Język interfejsu</h3>
            <p className="text-sm text-gray-500">Wybierz preferowany język</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { code: "nl", label: "Nederlands", flag: "🇳🇱" },
            { code: "en", label: "English", flag: "🇬🇧" },
            { code: "pl", label: "Polski", flag: "🇵🇱" },
            { code: "de", label: "Deutsch", flag: "🇩🇪" },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                language === lang.code
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-4xl mb-2">{lang.flag}</div>
              <p className="font-medium text-gray-900">{lang.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ================================================================
  // MAIN RENDER
  // ================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            ⚙️ Ustawienia
          </h1>
          <p className="text-gray-600">
            Zarządzaj swoim kontem, dostępnością i preferencjami
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-2 sticky top-4">
              <div
                className={`flex ${
                  isMobile ? "flex-row overflow-x-auto" : "flex-col"
                } gap-1`}
              >
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={isActive ? "text-white" : "text-gray-500"}
                      />
                      <div
                        className={`${
                          isMobile ? "hidden sm:block" : ""
                        } text-left`}
                      >
                        <p className="font-medium">{section.label}</p>
                        {!isMobile && (
                          <p
                            className={`text-xs ${
                              isActive ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {section.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {activeSection === "profile" && renderProfileSection()}
            {activeSection === "profile_data" && renderProfileDataSection()}
            {activeSection === "availability" && renderAvailabilitySection()}
            {activeSection === "notifications" && renderNotificationsSection()}
            {activeSection === "privacy" && renderPrivacySection()}
            {activeSection === "language" && renderLanguageSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerSettingsPanel;
