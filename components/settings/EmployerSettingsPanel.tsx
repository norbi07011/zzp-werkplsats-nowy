/**
 * ================================================================
 * EMPLOYER SETTINGS PANEL - All employer settings in one place
 * ================================================================
 * Consolidates all employer settings:
 * - Company Profile (logo, cover image)
 * - Company Data (name, KVK, BTW, description, industry)
 * - Contact Information (person, phone, email, address)
 * - Notifications (email, sms, push)
 * - Privacy (visibility, contact info)
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
  Globe,
  Loader2,
  X,
  Plus,
  Check,
  Briefcase,
} from "lucide-react";















import { CoverImageUploader } from "../../src/components/common/CoverImageUploader";
import { GlowButton } from "../ui/GlowButton";

// ================================================================
// TYPES
// ================================================================

interface EmployerProfile {
  id: string;
  profile_id: string;
  company_name: string;
  kvk_number?: string;
  btw_number?: string;
  logo_url?: string;
  cover_image_url?: string;
  website?: string;
  description?: string;
  industry?: string;
  company_size?: string;
  company_type?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  verified?: boolean;
}

interface CompanyFormData {
  company_name: string;
  kvk_number: string;
  btw_number: string;
  website: string;
  description: string;
  industry: string;
  company_size: string;
  company_type: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  application_alerts: boolean;
  message_alerts: boolean;
  review_alerts: boolean;
}

interface PrivacySettings {
  profile_visibility: "public" | "contacts" | "private";
  show_email: boolean;
  show_phone: boolean;
  show_address: boolean;
  allow_messages: boolean;
}

type SettingsSection = "profile" | "company_data" | "notifications" | "privacy";

interface EmployerSettingsPanelProps {
  employerProfile: EmployerProfile | null;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  saving: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverImageUpload: (url: string) => void;
  onNotificationSettingsChange: (settings: NotificationSettings) => void;
  onNotificationSettingsSave: () => void;
  onPrivacySettingsChange: (settings: PrivacySettings) => void;
  onPrivacySettingsSave: () => void;
  onCompanyDataSave: (data: CompanyFormData) => Promise<void>;
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
    label: "Logo & Okładka",
    icon: Camera,
    description: "Zdjęcia firmy",
  },
  {
    id: "company_data",
    label: "Dane Firmy",
    icon: Building2,
    description: "Informacje o firmie",
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

const INDUSTRY_OPTIONS = [
  { value: "", label: "Wybierz branżę..." },
  { value: "construction", label: "Budownictwo" },
  { value: "it", label: "IT & Technologia" },
  { value: "finance", label: "Finanse & Księgowość" },
  { value: "healthcare", label: "Opieka zdrowotna" },
  { value: "retail", label: "Handel detaliczny" },
  { value: "manufacturing", label: "Produkcja" },
  { value: "hospitality", label: "Hotelarstwo & Gastronomia" },
  { value: "logistics", label: "Logistyka & Transport" },
  { value: "education", label: "Edukacja" },
  { value: "cleaning", label: "Usługi sprzątania" },
  { value: "other", label: "Inna" },
];

const COMPANY_SIZE_OPTIONS = [
  { value: "", label: "Wybierz wielkość..." },
  { value: "1-10", label: "1-10 pracowników" },
  { value: "11-50", label: "11-50 pracowników" },
  { value: "51-200", label: "51-200 pracowników" },
  { value: "201-500", label: "201-500 pracowników" },
  { value: "500+", label: "Ponad 500 pracowników" },
];

const COMPANY_TYPE_OPTIONS = [
  { value: "", label: "Wybierz typ..." },
  { value: "eenmanszaak", label: "Jednoosobowa działalność (Eenmanszaak)" },
  { value: "vof", label: "Spółka jawna (VOF)" },
  { value: "bv", label: "Spółka z o.o. (BV)" },
  { value: "nv", label: "Spółka akcyjna (NV)" },
  { value: "stichting", label: "Fundacja (Stichting)" },
  { value: "other", label: "Inna" },
];

// ================================================================
// COMPONENT
// ================================================================

export const EmployerSettingsPanel: React.FC<EmployerSettingsPanelProps> = ({
  employerProfile,
  notificationSettings,
  privacySettings,
  saving,
  onLogoUpload,
  onCoverImageUpload,
  onNotificationSettingsChange,
  onNotificationSettingsSave,
  onPrivacySettingsChange,
  onPrivacySettingsSave,
  onCompanyDataSave,
  isMobile = false,
}) => {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  const [savedSections, setSavedSections] = useState<Set<SettingsSection>>(
    new Set()
  );

  // Company form state
  const [companyForm, setCompanyForm] = useState<CompanyFormData>({
    company_name: employerProfile?.company_name || "",
    kvk_number: employerProfile?.kvk_number || "",
    btw_number: employerProfile?.btw_number || "",
    website: employerProfile?.website || "",
    description: employerProfile?.description || "",
    industry: employerProfile?.industry || "",
    company_size: employerProfile?.company_size || "",
    company_type: employerProfile?.company_type || "",
    address: employerProfile?.address || "",
    city: employerProfile?.city || "",
    postal_code: employerProfile?.postal_code || "",
    country: employerProfile?.country || "NL",
    contact_person: employerProfile?.contact_person || "",
    contact_phone: employerProfile?.contact_phone || "",
    contact_email: employerProfile?.contact_email || "",
  });

  // Update form when profile changes
  useEffect(() => {
    if (employerProfile) {
      setCompanyForm({
        company_name: employerProfile.company_name || "",
        kvk_number: employerProfile.kvk_number || "",
        btw_number: employerProfile.btw_number || "",
        website: employerProfile.website || "",
        description: employerProfile.description || "",
        industry: employerProfile.industry || "",
        company_size: employerProfile.company_size || "",
        company_type: employerProfile.company_type || "",
        address: employerProfile.address || "",
        city: employerProfile.city || "",
        postal_code: employerProfile.postal_code || "",
        country: employerProfile.country || "NL",
        contact_person: employerProfile.contact_person || "",
        contact_phone: employerProfile.contact_phone || "",
        contact_email: employerProfile.contact_email || "",
      });
    }
  }, [employerProfile]);

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
      {/* Logo */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Camera size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Logo firmy</h3>
            <p className="text-sm text-gray-500">Wizerunek Twojej firmy</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Logo Preview */}
          <div className="relative">
            {employerProfile?.logo_url ? (
              <img
                src={employerProfile.logo_url}
                alt="Logo"
                className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-xl">
                {employerProfile?.company_name?.[0]?.toUpperCase() || "F"}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
              <label className="cursor-pointer">
                <Camera size={18} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onLogoUpload}
                />
              </label>
            </div>
          </div>

          {/* Logo Instructions */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-gray-600 mb-2">Zalecany rozmiar: 400x400 px</p>
            <p className="text-sm text-gray-500">Format: JPG, PNG (max 5MB)</p>
            <label className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium cursor-pointer hover:shadow-lg transition-all">
              📷 Zmień logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onLogoUpload}
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
            <p className="text-sm text-gray-500">Baner na profilu firmy</p>
          </div>
        </div>

        {employerProfile && (
          <CoverImageUploader
            currentCoverUrl={employerProfile.cover_image_url}
            onUploadSuccess={onCoverImageUpload}
            profileType="employer"
            profileId={employerProfile.id}
          />
        )}
      </div>
    </div>
  );

  // ================================================================
  // COMPANY DATA SECTION
  // ================================================================

  const handleCompanyDataSubmit = async () => {
    await onCompanyDataSave(companyForm);
    markAsSaved("company_data");
  };

  const renderCompanyDataSection = () => (
    <div className="space-y-6">
      {/* Basic Company Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Informacje o firmie</h3>
            <p className="text-sm text-gray-500">Podstawowe dane firmy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa firmy *
            </label>
            <input
              type="text"
              value={companyForm.company_name}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, company_name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Nazwa Twojej firmy"
            />
          </div>

          {/* KVK Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numer KVK
            </label>
            <input
              type="text"
              value={companyForm.kvk_number}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, kvk_number: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
              value={companyForm.btw_number}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, btw_number: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="NL123456789B01"
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
              value={companyForm.website}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, website: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="https://www.twoja-firma.nl"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Briefcase className="inline w-4 h-4 mr-1" />
              Branża
            </label>
            <select
              value={companyForm.industry}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, industry: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="inline w-4 h-4 mr-1" />
              Wielkość firmy
            </label>
            <select
              value={companyForm.company_size}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, company_size: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              {COMPANY_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Company Type */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ działalności
            </label>
            <select
              value={companyForm.company_type}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, company_type: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              {COMPANY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis firmy
            </label>
            <textarea
              value={companyForm.description}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              placeholder="Opisz czym zajmuje się Twoja firma..."
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Phone size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Dane kontaktowe</h3>
            <p className="text-sm text-gray-500">Informacje do kontaktu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Person */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline w-4 h-4 mr-1" />
              Osoba kontaktowa
            </label>
            <input
              type="text"
              value={companyForm.contact_person}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  contact_person: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Jan Kowalski"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline w-4 h-4 mr-1" />
              Telefon kontaktowy
            </label>
            <input
              type="tel"
              value={companyForm.contact_phone}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  contact_phone: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="+31 6 12345678"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline w-4 h-4 mr-1" />
              Email kontaktowy
            </label>
            <input
              type="email"
              value={companyForm.contact_email}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  contact_email: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="kontakt@firma.nl"
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
            <h3 className="font-bold text-gray-900">Adres firmy</h3>
            <p className="text-sm text-gray-500">Lokalizacja siedziby</p>
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
              value={companyForm.address}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, address: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
              value={companyForm.city}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, city: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
              value={companyForm.postal_code}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, postal_code: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
              value={companyForm.country}
              onChange={(e) =>
                setCompanyForm({ ...companyForm, country: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="NL">Holandia 🇳🇱</option>
              <option value="BE">Belgia 🇧🇪</option>
              <option value="DE">Niemcy 🇩🇪</option>
              <option value="PL">Polska 🇵🇱</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <GlowButton
          onClick={handleCompanyDataSubmit}
          disabled={saving}
          className="px-8"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Zapisywanie...
            </span>
          ) : savedSections.has("company_data") ? (
            <span className="flex items-center gap-2">
              <Check size={18} />
              Zapisano!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={18} />
              Zapisz dane firmy
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Alert Types */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
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
          {/* Application Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Zgłoszenia</p>
              <p className="text-sm text-gray-500">
                Nowe aplikacje na oferty pracy
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.application_alerts}
                onChange={(e) =>
                  onNotificationSettingsChange({
                    ...notificationSettings,
                    application_alerts: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Message Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Wiadomości</p>
              <p className="text-sm text-gray-500">
                Nowe wiadomości od pracowników
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Review Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Opinie</p>
              <p className="text-sm text-gray-500">Nowe opinie o firmie</p>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
              Kto może widzieć profil firmy
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              value: "public" as const,
              label: "Publiczny",
              description: "Wszyscy mogą widzieć profil firmy",
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
                  ? "bg-blue-50 border-2 border-blue-500"
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
                className="w-4 h-4 text-blue-600"
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
                  Widoczny na profilu firmy
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Show Phone */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Pokaż telefon</p>
                <p className="text-sm text-gray-500">
                  Widoczny na profilu firmy
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Show Address */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Pokaż adres</p>
                <p className="text-sm text-gray-500">
                  Lokalizacja firmy widoczna
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                  Pracownicy mogą wysyłać wiadomości
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
      case "company_data":
        return renderCompanyDataSection();
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
          <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
            <h2 className="text-white font-bold text-lg">Ustawienia firmy</h2>
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
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
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

export default EmployerSettingsPanel;
