import React, { useState } from "react";
import { supabase } from "../src/lib/supabase";
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Building2,
  X,
  Plus,
  Loader2,
} from "lucide-react";
interface AddCleaningCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function AddCleaningCompanyModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCleaningCompanyModalProps) {
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
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Musisz być zalogowany");
      }

      // Insert cleaning company (using any to bypass type checking)
      const { data, error: insertError } = await (supabase as any)
        .from("cleaning_companies")
        .insert([
          {
            profile_id: user.id,
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
            accepting_new_clients: true,
            average_rating: 0,
            total_reviews: 0,
            subscription_tier: "basic",
            subscription_status: "active",
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Success!
      onSuccess?.();
      onClose();

      // Reset form
      setFormData({
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
        profile_visibility: "public",
      });
    } catch (err: any) {
      console.error("Error adding cleaning company:", err);
      setError(err.message || "Nie udało się dodać firmy sprzątającej");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Dodaj firmę sprzątającą
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
              placeholder="np. CleanPro Services"
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Imię i nazwisko właściciela{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.owner_name}
              onChange={(e) =>
                setFormData({ ...formData, owner_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Jan Kowalski"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="+31 6 12345678"
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
                placeholder="kontakt@cleanpro.nl"
              />
            </div>
          </div>

          {/* KVK Number */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              Numer KVK (opcjonalny)
            </label>
            <input
              type="text"
              value={formData.kvk_number}
              onChange={(e) =>
                setFormData({ ...formData, kvk_number: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12345678"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Amsterdam"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                Prowincja
              </label>
              <input
                type="text"
                value={formData.location_province}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location_province: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Noord-Holland"
              />
            </div>
          </div>

          {/* Service Radius & Team Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
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
                    service_radius_km: parseInt(e.target.value) || 20,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4" />
                Wielkość zespołu
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.team_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    team_size: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Specialization */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Specjalizacja <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <label
                  key={spec.value}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Opis firmy (opcjonalny)
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Krótki opis firmy, doświadczenia, wartości..."
            />
          </div>

          {/* Profile Visibility */}
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
              <option value="public">Publiczny - wszyscy widzą</option>
              <option value="contacts_only">Tylko kontakty</option>
              <option value="private">Prywatny - ukryty</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.company_name ||
                !formData.owner_name ||
                formData.specialization.length === 0
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Dodawanie..." : "Dodaj firmę"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
