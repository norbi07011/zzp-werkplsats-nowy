import React, { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Building2,
  Users,
  X,
  Save,
  Loader2,
} from "lucide-react";
interface CleaningCompany {
  id: string;
  company_name: string;
  owner_name: string;
  phone: string | null;
  email: string | null;
  kvk_number: string | null;
  location_city: string | null;
  location_province: string | null;
  service_radius_km: number;
  specialization: string[];
  bio: string | null;
  team_size: number;
  profile_visibility: string;
}

interface EditCleaningCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CleaningCompany | null;
  onSuccess?: () => void;
}

const SPECIALIZATIONS = [
  { value: "cleaning_after_construction", label: "Sprzątanie po remoncie" },
  { value: "office_cleaning", label: "Sprzątanie biur" },
  { value: "house_cleaning", label: "Sprzątanie domów" },
  { value: "window_cleaning", label: "Mycie okien" },
  { value: "deep_cleaning", label: "Głębokie czyszczenie" },
  { value: "carpet_cleaning", label: "Pranie dywanów" },
  { value: "move_in_out", label: "Sprzątanie przed/po przeprowadzce" },
  { value: "industrial_cleaning", label: "Sprzątanie przemysłowe" },
];

export function EditCleaningCompanyModal({
  isOpen,
  onClose,
  company,
  onSuccess,
}: EditCleaningCompanyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_name: "",
    owner_name: "",
    phone: "",
    email: "",
    kvk_number: "",
    location_city: "",
    location_province: "",
    service_radius_km: 20,
    bio: "",
    team_size: 1,
    specialization: ["cleaning_after_construction"],
    profile_visibility: "public" as "public" | "private" | "contacts_only",
  });

  // Load company data when modal opens
  useEffect(() => {
    if (company && isOpen) {
      setFormData({
        company_name: company.company_name,
        owner_name: company.owner_name,
        phone: company.phone || "",
        email: company.email || "",
        kvk_number: company.kvk_number || "",
        location_city: company.location_city || "",
        location_province: company.location_province || "",
        service_radius_km: company.service_radius_km,
        bio: company.bio || "",
        team_size: company.team_size,
        specialization: company.specialization || [
          "cleaning_after_construction",
        ],
        profile_visibility: (company.profile_visibility as any) || "public",
      });
    }
  }, [company, isOpen]);

  const handleSpecializationToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(value)
        ? prev.specialization.filter((s) => s !== value)
        : [...prev.specialization, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company) return;

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Musisz być zalogowany");

      // UPDATE cleaning company
      const { error: updateError } = await (supabase as any)
        .from("cleaning_companies")
        .update({
          company_name: formData.company_name,
          owner_name: formData.owner_name,
          phone: formData.phone || null,
          email: formData.email || null,
          kvk_number: formData.kvk_number || null,
          location_city: formData.location_city || null,
          location_province: formData.location_province || null,
          service_radius_km: formData.service_radius_km,
          specialization: formData.specialization,
          bio: formData.bio || null,
          team_size: formData.team_size,
          profile_visibility: formData.profile_visibility,
          updated_at: new Date().toISOString(),
        })
        .eq("id", company.id)
        .eq("profile_id", user.id); // Security: only owner can edit

      if (updateError) throw updateError;

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Error updating cleaning company:", err);
      setError(err.message || "Nie udało się zaktualizować firmy");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Edytuj firmę sprzątającą
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4" />
              Nazwa firmy <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Właściciel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.owner_name}
              onChange={(e) =>
                setFormData({ ...formData, owner_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                Miasto
              </label>
              <input
                type="text"
                value={formData.location_city}
                onChange={(e) =>
                  setFormData({ ...formData, location_city: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Promień działania (km)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.service_radius_km}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    service_radius_km: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Specializations */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Specjalizacje <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SPECIALIZATIONS.map((spec) => (
                <label
                  key={spec.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.specialization.includes(spec.value)}
                    onChange={() => handleSpecializationToggle(spec.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{spec.label}</span>
                </label>
              ))}
            </div>
            {formData.specialization.length === 0 && (
              <p className="text-xs text-red-600 mt-2">
                Wybierz przynajmniej jedną specjalizację
              </p>
            )}
          </div>

          {/* Team Size */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4" />
              Liczba osób w zespole
            </label>
            <input
              type="number"
              min="1"
              value={formData.team_size}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  team_size: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              Opis firmy
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Opisz swoją firmę, doświadczenie, certyfikaty..."
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Widoczność profilu
            </label>
            <select
              value={formData.profile_visibility}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  profile_visibility: e.target.value as any,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Publiczny</option>
              <option value="contacts_only">Tylko kontakty</option>
              <option value="private">Prywatny</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || formData.specialization.length === 0}
            >
              {loading ? "Zapisuję..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
