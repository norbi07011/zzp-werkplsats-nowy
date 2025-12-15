/**
 * ================================================================
 * ACCOUNTANT SETTINGS PANEL - All accountant settings in one place
 * ================================================================
 * Consolidates all accountant settings:
 * - Profile Images (avatar, cover image)
 * - Personal & Company Data (name, KVK, BTW, license, bio, etc.)
 * - Contact Information (phone, email, address)
 * - Notifications (email, sms, push)
 * - Privacy (visibility, contact info)
 */

import React, { useState, useEffect } from "react";
import User from "lucide-react/dist/esm/icons/user";
import Bell from "lucide-react/dist/esm/icons/bell";
import Shield from "lucide-react/dist/esm/icons/shield";
import Globe from "lucide-react/dist/esm/icons/globe";
import Camera from "lucide-react/dist/esm/icons/camera";
import Image from "lucide-react/dist/esm/icons/image";
import Save from "lucide-react/dist/esm/icons/save";
import Check from "lucide-react/dist/esm/icons/check";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Phone from "lucide-react/dist/esm/icons/phone";
import Mail from "lucide-react/dist/esm/icons/mail";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Award from "lucide-react/dist/esm/icons/award";
import Languages from "lucide-react/dist/esm/icons/languages";
import X from "lucide-react/dist/esm/icons/x";
import Plus from "lucide-react/dist/esm/icons/plus";
import { CoverImageUploader } from "../../src/components/common/CoverImageUploader";
import { GlowButton } from "../ui/GlowButton";

// ================================================================
// TYPES
// ================================================================

interface AccountantProfile {
  id: string;
  profile_id?: string;
  full_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  kvk_number?: string;
  btw_number?: string;
  license_number?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  country?: string;
  bio?: string;
  specializations?: string[];
  languages?: string[];
  website?: string;
  avatar_url?: string;
  cover_image_url?: string;
  years_experience?: number;
  is_verified?: boolean;
}

interface AccountantFormData {
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  kvk_number: string;
  btw_number: string;
  license_number: string;
  city: string;
  address: string;
  postal_code: string;
  country: string;
  bio: string;
  specializations: string[];
  languages: string[];
  website: string;
  years_experience: number;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  client_alerts: boolean;
  message_alerts: boolean;
  review_alerts: boolean;
  form_submission_alerts: boolean;
}

interface PrivacySettings {
  profile_visibility: "public" | "contacts" | "private";
  show_email: boolean;
  show_phone: boolean;
  show_address: boolean;
  allow_messages: boolean;
}

type SettingsSection =
  | "profile"
  | "personal_data"
  | "notifications"
  | "privacy";

interface AccountantSettingsPanelProps {
  accountantProfile: AccountantProfile | null;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  saving: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverImageUpload: (url: string) => void;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
  onNotificationSettingsSave: () => void;
  onPrivacySettingsChange: (settings: PrivacySettings) => void;
  onPrivacySettingsSave: () => void;
  onAccountantDataSave: (data: AccountantFormData) => Promise<void>;
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
    id: "personal_data",
    label: "Dane Księgowego",
    icon: FileText,
    description: "Informacje osobiste i firmowe",
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

const SPECIALIZATION_OPTIONS = [
  "Boekhouding",
  "Belastingaangifte",
  "BTW-aangifte",
  "Jaarrekening",
  "Salarisadministratie",
  "ZZP administratie",
  "Bedrijfsadvies",
  "Financiële planning",
  "Startende ondernemers",
  "E-commerce",
  "Horeca",
  "Bouw",
  "Transport",
  "Zorg",
];

const LANGUAGE_OPTIONS = [
  "Nederlands",
  "English",
  "Polski",
  "Deutsch",
  "Français",
  "Español",
  "Türkçe",
  "العربية",
];

// ================================================================
// COMPONENT
// ================================================================

export const AccountantSettingsPanel: React.FC<
  AccountantSettingsPanelProps
> = ({
  accountantProfile,
  notificationSettings,
  privacySettings,
  saving,
  onAvatarUpload,
  onCoverImageUpload,
  onNotificationSettingsChange,
  onNotificationSettingsSave,
  onPrivacySettingsChange,
  onPrivacySettingsSave,
  onAccountantDataSave,
  isMobile = false,
}) => {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  const [savedSections, setSavedSections] = useState<Set<SettingsSection>>(
    new Set()
  );

  // Form state
  const [formData, setFormData] = useState<AccountantFormData>({
    full_name: accountantProfile?.full_name || "",
    company_name: accountantProfile?.company_name || "",
    email: accountantProfile?.email || "",
    phone: accountantProfile?.phone || "",
    kvk_number: accountantProfile?.kvk_number || "",
    btw_number: accountantProfile?.btw_number || "",
    license_number: accountantProfile?.license_number || "",
    city: accountantProfile?.city || "",
    address: accountantProfile?.address || "",
    postal_code: accountantProfile?.postal_code || "",
    country: accountantProfile?.country || "Nederland",
    bio: accountantProfile?.bio || "",
    specializations: accountantProfile?.specializations || [],
    languages: accountantProfile?.languages || ["Nederlands"],
    website: accountantProfile?.website || "",
    years_experience: accountantProfile?.years_experience || 0,
  });

  // Update form when profile changes
  useEffect(() => {
    if (accountantProfile) {
      setFormData({
        full_name: accountantProfile.full_name || "",
        company_name: accountantProfile.company_name || "",
        email: accountantProfile.email || "",
        phone: accountantProfile.phone || "",
        kvk_number: accountantProfile.kvk_number || "",
        btw_number: accountantProfile.btw_number || "",
        license_number: accountantProfile.license_number || "",
        city: accountantProfile.city || "",
        address: accountantProfile.address || "",
        postal_code: accountantProfile.postal_code || "",
        country: accountantProfile.country || "Nederland",
        bio: accountantProfile.bio || "",
        specializations: accountantProfile.specializations || [],
        languages: accountantProfile.languages || ["Nederlands"],
        website: accountantProfile.website || "",
        years_experience: accountantProfile.years_experience || 0,
      });
    }
  }, [accountantProfile]);

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
  // PROFILE SECTION
  // ================================================================

  const renderProfileSection = () => (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
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
            {accountantProfile?.avatar_url ? (
              <img
                src={accountantProfile.avatar_url}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-5xl border-4 border-white shadow-xl">
                {accountantProfile?.full_name?.[0]?.toUpperCase() || "K"}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-700 transition-colors">
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
            <label className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium cursor-pointer hover:shadow-lg transition-all">
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

        {accountantProfile && (
          <CoverImageUploader
            currentCoverUrl={accountantProfile.cover_image_url}
            onUploadSuccess={onCoverImageUpload}
            profileType="accountant"
            profileId={accountantProfile.id}
          />
        )}
      </div>
    </div>
  );

  // ================================================================
  // PERSONAL DATA SECTION
  // ================================================================

  const handleDataSubmit = async () => {
    await onAccountantDataSave(formData);
    markAsSaved("personal_data");
  };

  const toggleSpecialization = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const renderPersonalDataSection = () => (
    <div className="space-y-6">
      {/* Personal Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Dane osobowe</h3>
            <p className="text-sm text-gray-500">Twoje podstawowe informacje</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imię i nazwisko *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Jan Kowalski"
            />
          </div>

          {/* Company Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="inline w-4 h-4 mr-1" />
              Nazwa firmy
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Nazwa Twojego biura rachunkowego"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline w-4 h-4 mr-1" />
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="jan@biurorachunkowe.nl"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline w-4 h-4 mr-1" />
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="+31 6 12345678"
            />
          </div>

          {/* Website */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Link2 className="inline w-4 h-4 mr-1" />
              Strona internetowa
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="https://www.twoje-biuro.nl"
            />
          </div>

          {/* Years Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Briefcase className="inline w-4 h-4 mr-1" />
              Lata doświadczenia
            </label>
            <input
              type="number"
              min="0"
              value={formData.years_experience}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  years_experience: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Award size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Dane firmowe</h3>
            <p className="text-sm text-gray-500">
              Numery rejestracyjne i licencje
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KVK Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numer KVK
            </label>
            <input
              type="text"
              value={formData.kvk_number}
              onChange={(e) =>
                setFormData({ ...formData, kvk_number: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="12345678"
            />
          </div>

          {/* BTW Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numer BTW
            </label>
            <input
              type="text"
              value={formData.btw_number}
              onChange={(e) =>
                setFormData({ ...formData, btw_number: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="NL123456789B01"
            />
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numer licencji
            </label>
            <input
              type="text"
              value={formData.license_number}
              onChange={(e) =>
                setFormData({ ...formData, license_number: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="AA-12345"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Adres</h3>
            <p className="text-sm text-gray-500">Lokalizacja biura</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ulica i numer
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Hoofdstraat 123"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miasto
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Amsterdam"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kod pocztowy
            </label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) =>
                setFormData({ ...formData, postal_code: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="1234 AB"
            />
          </div>

          {/* Country */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="inline w-4 h-4 mr-1" />
              Kraj
            </label>
            <select
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="Nederland">Holandia 🇳🇱</option>
              <option value="België">Belgia 🇧🇪</option>
              <option value="Duitsland">Niemcy 🇩🇪</option>
              <option value="Polen">Polska 🇵🇱</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">O mnie / O firmie</h3>
            <p className="text-sm text-gray-500">Opis Twojej działalności</p>
          </div>
        </div>

        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
          placeholder="Opisz swoje doświadczenie, specjalizacje i podejście do klientów..."
        />
      </div>

      {/* Specializations */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Specjalizacje</h3>
            <p className="text-sm text-gray-500">
              Wybierz swoje obszary ekspertyzy
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SPECIALIZATION_OPTIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => toggleSpecialization(spec)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                formData.specializations.includes(spec)
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
            <Languages size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Języki</h3>
            <p className="text-sm text-gray-500">
              W jakich językach obsługujesz klientów
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                formData.languages.includes(lang)
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <GlowButton
          onClick={handleDataSubmit}
          disabled={saving}
          className="px-8"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Zapisywanie...
            </span>
          ) : savedSections.has("personal_data") ? (
            <span className="flex items-center gap-2">
              <Check size={18} />
              Zapisano!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={18} />
              Zapisz dane
            </span>
          )}
        </GlowButton>
      </div>
    </div>
  );

  // ================================================================
  // NOTIFICATIONS SECTION
  // ================================================================

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Kanały powiadomień</h3>
            <p className="text-sm text-gray-500">
              Jak chcesz otrzymywać powiadomienia
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-500">Powiadomienia emailowe</p>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">SMS</p>
                <p className="text-sm text-gray-500">Powiadomienia SMS</p>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Push</p>
                <p className="text-sm text-gray-500">
                  Powiadomienia push w przeglądarce
                </p>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Alert Types */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Typy powiadomień</h3>
            <p className="text-sm text-gray-500">
              O czym chcesz być informowany
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Client Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Nowi klienci</p>
              <p className="text-sm text-gray-500">
                Powiadomienia o nowych klientach
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.client_alerts}
                onChange={(e) =>
                  onNotificationSettingsChange({
                    ...notificationSettings,
                    client_alerts: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Message Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Wiadomości</p>
              <p className="text-sm text-gray-500">
                Nowe wiadomości od klientów
              </p>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Review Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Opinie</p>
              <p className="text-sm text-gray-500">Nowe opinie o Tobie</p>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Form Submission Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Formularze</p>
              <p className="text-sm text-gray-500">
                Nowe wypełnione formularze
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.form_submission_alerts}
                onChange={(e) =>
                  onNotificationSettingsChange({
                    ...notificationSettings,
                    form_submission_alerts: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <GlowButton
          onClick={() => {
            onNotificationSettingsSave();
            markAsSaved("notifications");
          }}
          disabled={saving}
          className="px-8"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Zapisywanie...
            </span>
          ) : savedSections.has("notifications") ? (
            <span className="flex items-center gap-2">
              <Check size={18} />
              Zapisano!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={18} />
              Zapisz ustawienia
            </span>
          )}
        </GlowButton>
      </div>
    </div>
  );

  // ================================================================
  // PRIVACY SECTION
  // ================================================================

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Widoczność profilu</h3>
            <p className="text-sm text-gray-500">
              Kto może widzieć Twój profil
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              value: "public" as const,
              label: "Publiczny",
              description: "Wszyscy mogą widzieć Twój profil",
            },
            {
              value: "contacts" as const,
              label: "Tylko kontakty",
              description: "Tylko osoby z którymi masz kontakt",
            },
            {
              value: "private" as const,
              label: "Prywatny",
              description: "Tylko Ty widzisz swój profil",
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                privacySettings.profile_visibility === option.value
                  ? "bg-emerald-50 border-2 border-emerald-500"
                  : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={privacySettings.profile_visibility === option.value}
                onChange={(e) =>
                  onPrivacySettingsChange({
                    ...privacySettings,
                    profile_visibility: e.target
                      .value as PrivacySettings["profile_visibility"],
                  })
                }
                className="w-4 h-4 text-emerald-600"
              />
              <div className="ml-3">
                <p className="font-medium text-gray-900">{option.label}</p>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Contact Info Visibility */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Dane kontaktowe</h3>
            <p className="text-sm text-gray-500">
              Co pokazywać innym użytkownikom
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Show Email */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Pokaż email</p>
                <p className="text-sm text-gray-500">
                  Widoczny na Twoim profilu
                </p>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Show Phone */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Pokaż telefon</p>
                <p className="text-sm text-gray-500">
                  Widoczny na Twoim profilu
                </p>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Show Address */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Pokaż adres</p>
                <p className="text-sm text-gray-500">
                  Lokalizacja biura widoczna
                </p>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Allow Messages */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  Zezwól na wiadomości
                </p>
                <p className="text-sm text-gray-500">
                  Klienci mogą wysyłać wiadomości
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.allow_messages}
                onChange={(e) =>
                  onPrivacySettingsChange({
                    ...privacySettings,
                    allow_messages: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <GlowButton
          onClick={() => {
            onPrivacySettingsSave();
            markAsSaved("privacy");
          }}
          disabled={saving}
          className="px-8"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Zapisywanie...
            </span>
          ) : savedSections.has("privacy") ? (
            <span className="flex items-center gap-2">
              <Check size={18} />
              Zapisano!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={18} />
              Zapisz ustawienia
            </span>
          )}
        </GlowButton>
      </div>
    </div>
  );

  // ================================================================
  // MAIN RENDER
  // ================================================================

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "personal_data":
        return renderPersonalDataSection();
      case "notifications":
        return renderNotificationsSection();
      case "privacy":
        return renderPrivacySection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-6`}>
      {/* Sidebar Navigation */}
      <div className={`${isMobile ? "w-full" : "w-64 flex-shrink-0"}`}>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600">
            <h2 className="text-white font-bold text-lg">Ustawienia</h2>
            <p className="text-white/80 text-sm">Zarządzaj profilem</p>
          </div>

          <nav className="p-2">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isSaved = savedSections.has(section.id);

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isActive ? "bg-white/20" : "bg-gray-100"
                    }`}
                  >
                    {isSaved ? (
                      <Check
                        size={18}
                        className={isActive ? "text-white" : "text-green-500"}
                      />
                    ) : (
                      <Icon
                        size={18}
                        className={isActive ? "text-white" : "text-gray-600"}
                      />
                    )}
                  </div>
                  <div className="text-left">
                    <p
                      className={`font-medium ${
                        isActive ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {section.label}
                    </p>
                    <p
                      className={`text-xs ${
                        isActive ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">{renderContent()}</div>
    </div>
  );
};

export default AccountantSettingsPanel;
