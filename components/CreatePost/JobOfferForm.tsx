/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                 💼 JOB OFFER FORM COMPONENT 💼                    ║
 * ║                                                                   ║
 * ║  Enhanced form for creating job offer posts                       ║
 * ║  Fields: job_type, hours, start_date, benefits, contacts          ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import React from "react";
import { Calendar, Mail, Phone, MapPin } from "../icons";

interface JobOfferFormProps {
  formData: {
    job_type?: "full_time" | "part_time" | "contract" | "temporary";
    job_hours_per_week?: number;
    job_start_date?: string;
    job_benefits?: string[];
    job_contact_email?: string;
    job_contact_phone?: string;
    job_location?: string;
  };
  onChange: (field: string, value: any) => void;
}

export const JobOfferForm: React.FC<JobOfferFormProps> = ({
  formData,
  onChange,
}) => {
  const [newBenefit, setNewBenefit] = React.useState("");

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      const current = formData.job_benefits || [];
      if (!current.includes(newBenefit.trim())) {
        onChange("job_benefits", [...current, newBenefit.trim()]);
      }
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (benefit: string) => {
    const current = formData.job_benefits || [];
    onChange(
      "job_benefits",
      current.filter((b) => b !== benefit)
    );
  };

  const predefinedBenefits = [
    "🚗 Samochód służbowy",
    "💰 Premia kwartalna",
    "🏥 Ubezpieczenie zdrowotne",
    "🎓 Szkolenia",
    "📱 Telefon służbowy",
    "🏖️ Dodatkowe urlopy",
    "🍕 Posiłki",
    "💻 Praca zdalna",
  ];

  const handleQuickBenefit = (benefit: string) => {
    const current = formData.job_benefits || [];
    if (!current.includes(benefit)) {
      onChange("job_benefits", [...current, benefit]);
    }
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-3xl border-2 border-blue-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">💼</span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900">
            Oferta Pracy - Szczegóły
          </h3>
          <p className="text-sm text-gray-600">
            Uzupełnij informacje o oferowanej pracy
          </p>
        </div>
      </div>

      {/* Job Type */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            💼 Typ zatrudnienia
            <span className="text-red-500">*</span>
            <span className="text-xs font-normal text-gray-500">
              (Pomaga użytkownikom szybciej znaleźć ofertę)
            </span>
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["full_time", "part_time", "contract", "temporary"] as const).map(
            (type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange("job_type", type)}
                className={`px-6 py-4 rounded-xl text-sm font-bold transition-all transform ${
                  formData.job_type === type
                    ? "bg-blue-500 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105 border-2 border-gray-200"
                }`}
              >
                {type === "full_time" && "⏰ Pełny etat"}
                {type === "part_time" && "⏱️ Część etatu"}
                {type === "contract" && "📋 Kontrakt"}
                {type === "temporary" && "🔄 Tymczasowa"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Hours Per Week */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <span className="text-base">⏰</span> Godziny tygodniowo
            <span className="text-amber-500 text-xs font-normal">
              (Rekomendowane)
            </span>
          </span>
        </label>
        <input
          type="number"
          min="1"
          max="168"
          value={formData.job_hours_per_week || ""}
          onChange={(e) =>
            onChange("job_hours_per_week", parseInt(e.target.value) || null)
          }
          placeholder="np. 40 godzin - zwiększa widoczność oferty!"
          title="Oferty z określonymi godzinami są 2x częściej otwierane"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
        />
        <p className="text-xs text-gray-600 mt-2">
          Zakres: 1-168 godzin tygodniowo
        </p>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Data rozpoczęcia (opcjonalna)
          </span>
        </label>
        <input
          type="date"
          value={formData.job_start_date || ""}
          onChange={(e) => onChange("job_start_date", e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
        />
        <p className="text-xs text-gray-600 mt-2">
          Planowana data rozpoczęcia pracy
        </p>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Lokalizacja
            <span className="text-red-500">*</span>
            <span className="text-xs font-normal text-gray-500">
              (Wymagane do wyświetlenia w wynikach wyszukiwania)
            </span>
          </span>
        </label>
        <input
          type="text"
          value={formData.job_location || ""}
          onChange={(e) => onChange("job_location", e.target.value)}
          placeholder="np. Amsterdam, Rotterdam, Utrecht lub Praca zdalna"
          title="Lokalizacja pomaga kandydatom znaleźć ofertę w ich regionie"
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
        />
      </div>

      {/* Benefits - Quick Add */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <span className="text-base">🎁</span> Benefity - szybki wybór
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {predefinedBenefits.map((benefit) => (
            <button
              key={benefit}
              type="button"
              onClick={() => handleQuickBenefit(benefit)}
              disabled={formData.job_benefits?.includes(benefit)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.job_benefits?.includes(benefit)
                  ? "bg-blue-100 text-blue-800 cursor-not-allowed"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {benefit}
            </button>
          ))}
        </div>
      </div>

      {/* Benefits - Custom */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <span className="text-base">🎁</span> Benefity - własne
          </span>
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newBenefit}
            onChange={(e) => setNewBenefit(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddBenefit())
            }
            placeholder="Dodaj własny benefit..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
          />
          <button
            type="button"
            onClick={handleAddBenefit}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all"
          >
            + Dodaj
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.job_benefits?.map((benefit) => (
            <span
              key={benefit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-bold"
            >
              {benefit}
              <button
                type="button"
                onClick={() => handleRemoveBenefit(benefit)}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          📞 Informacje kontaktowe
        </h4>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email kontaktowy
              <span className="text-amber-500 text-xs font-normal">
                (Rekomendowane)
              </span>
            </span>
          </label>
          <input
            type="email"
            value={formData.job_contact_email || ""}
            onChange={(e) => onChange("job_contact_email", e.target.value)}
            placeholder="rekrutacja@firma.com - kandydaci będą mogli się skontaktować"
            title="Email zwiększa liczbę aplikacji o 40%"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> Numer telefonu
            </span>
          </label>
          <input
            type="tel"
            value={formData.job_contact_phone || ""}
            onChange={(e) => onChange("job_contact_phone", e.target.value)}
            placeholder="+31 XX XXX XXXX"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {/* Info box */}
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl p-4">
        <p className="text-sm text-blue-900 mb-2">
          <strong>💡 Wskazówka:</strong> Oferty z jasno określonymi benefitami i
          danymi kontaktowymi otrzymują 3x więcej aplikacji!
        </p>
        <div className="text-xs text-blue-800 space-y-1 mt-3">
          <p>
            ✅ <span className="text-red-600 font-bold">Pola wymagane (*)</span>{" "}
            - bez nich oferta nie będzie widoczna
          </p>
          <p>
            ⚠️{" "}
            <span className="text-amber-600 font-bold">Pola rekomendowane</span>{" "}
            - zwiększają szansę na aplikacje o 40-60%
          </p>
        </div>
      </div>
    </div>
  );
};
