/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                      📣 AD FORM COMPONENT 📣                      ║
 * ║                                                                   ║
 * ║  Enhanced form for creating advertisement posts                  ║
 * ║  Fields: budget, duration, target audience, CTA, contact          ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import React from "react";
import { Calendar, Users, ExternalLink, Mail, Phone, Globe } from "../icons";

interface AdFormProps {
  formData: {
    ad_type?: "product" | "service" | "event" | "promotion";
    ad_budget?: number;
    ad_duration_days?: number;
    ad_target_audience?: string[];
    ad_cta_text?: string;
    ad_cta_url?: string;
    ad_website?: string;
    ad_contact_email?: string;
    ad_contact_phone?: string;
  };
  onChange: (field: string, value: any) => void;
}

export const AdForm: React.FC<AdFormProps> = ({ formData, onChange }) => {
  const handleAudienceAdd = (audience: string) => {
    const current = formData.ad_target_audience || [];
    if (!current.includes(audience)) {
      onChange("ad_target_audience", [...current, audience]);
    }
  };

  const handleAudienceRemove = (audience: string) => {
    const current = formData.ad_target_audience || [];
    onChange(
      "ad_target_audience",
      current.filter((a) => a !== audience)
    );
  };

  const audienceOptions = [
    "Pracownicy ZZP",
    "Firmy sprzątające",
    "Pracodawcy",
    "Księgowi",
    "Wszyscy użytkownicy",
  ];

  return (
    <div className="space-y-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8 rounded-3xl border-2 border-purple-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">📣</span>
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900">
            Reklama - Szczegóły
          </h3>
          <p className="text-sm text-gray-600">
            Dostosuj swoją reklamę dla maksymalnego zasięgu
          </p>
        </div>
      </div>

      {/* Ad Type */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            📦 Typ Reklamy
            <span className="text-red-500">*</span>
            <span className="text-xs font-normal text-gray-500">
              (Określa kategorię i algorytm targetowania)
            </span>
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["product", "service", "event", "promotion"] as const).map(
            (type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange("ad_type", type)}
                className={`px-6 py-4 rounded-xl text-sm font-bold transition-all transform ${
                  formData.ad_type === type
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 hover:scale-105 border-2 border-gray-200"
                }`}
              >
                {type === "product" && "🛍️ Produkt"}
                {type === "service" && "🛠️ Usługa"}
                {type === "event" && "🎉 Wydarzenie"}
                {type === "promotion" && "🎁 Promocja"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Budget & Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            <span className="flex items-center gap-2">
              <span className="text-base">💰</span> Budżet (EUR)
              <span className="text-amber-500 text-xs font-normal">
                (Rekomendowane)
              </span>
            </span>
          </label>
          <input
            type="number"
            value={formData.ad_budget || ""}
            onChange={(e) =>
              onChange("ad_budget", parseFloat(e.target.value) || 0)
            }
            placeholder="np. 500 - zwiększa zasięg reklamy"
            title="Budżet pomaga użytkownikom ocenić skalę oferty"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Czas trwania (dni)
            </span>
          </label>
          <input
            type="number"
            value={formData.ad_duration_days || 30}
            onChange={(e) =>
              onChange("ad_duration_days", parseInt(e.target.value) || 30)
            }
            placeholder="30"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
          />
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Grupa docelowa
          </span>
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {audienceOptions.map((audience) => (
            <button
              key={audience}
              type="button"
              onClick={() =>
                formData.ad_target_audience?.includes(audience)
                  ? handleAudienceRemove(audience)
                  : handleAudienceAdd(audience)
              }
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                formData.ad_target_audience?.includes(audience)
                  ? "bg-purple-500 text-white"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300"
              }`}
            >
              {audience}
            </button>
          ))}
        </div>
      </div>

      {/* CTA (Call to Action) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            <span className="flex items-center gap-2">
              📢 Tekst przycisku CTA
              <span className="text-amber-500 text-xs font-normal">
                (Rekomendowane)
              </span>
            </span>
          </label>
          <input
            type="text"
            value={formData.ad_cta_text || ""}
            onChange={(e) => onChange("ad_cta_text", e.target.value)}
            placeholder="np. Sprawdź ofertę, Kup teraz, Zarejestruj się"
            title="Jasny CTA zwiększa klikalność o 40%"
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Link CTA
            </span>
          </label>
          <input
            type="url"
            value={formData.ad_cta_url || ""}
            onChange={(e) => onChange("ad_cta_url", e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          📞 Dane kontaktowe
        </h4>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" /> Strona internetowa
              <span className="text-amber-500 text-xs font-normal">
                (Rekomendowane)
              </span>
            </span>
          </label>
          <input
            type="url"
            value={formData.ad_website || ""}
            onChange={(e) => onChange("ad_website", e.target.value)}
            placeholder="https://twoja-firma.com - link buduje zaufanie"
            title="Strona www zwiększa wiarygodność reklamy o 50%"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email kontaktowy
              </span>
            </label>
            <input
              type="email"
              value={formData.ad_contact_email || ""}
              onChange={(e) => onChange("ad_contact_email", e.target.value)}
              placeholder="kontakt@firma.pl"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Telefon
              </span>
            </label>
            <input
              type="tel"
              value={formData.ad_contact_phone || ""}
              onChange={(e) => onChange("ad_contact_phone", e.target.value)}
              placeholder="+31 6 12345678"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl p-4">
        <p className="text-sm text-purple-900 mb-2">
          <strong>💡 Wskazówka:</strong> Dobrze skierowana reklama z jasnym CTA
          może zwiększyć zaangażowanie nawet o 300%!
        </p>
        <div className="text-xs text-purple-800 space-y-1 mt-3">
          <p>
            ✅ <span className="text-red-600 font-bold">Pola wymagane (*)</span>{" "}
            - bez nich reklama nie osiągnie pełnego zasięgu
          </p>
          <p>
            ⚠️{" "}
            <span className="text-amber-600 font-bold">Pola rekomendowane</span>{" "}
            - zwiększają CTR o 40-60%
          </p>
          <p>
            📈 <strong>Analytics:</strong> Tracking kliknięć, wyświetleń i CTR
            dostępny po publikacji
          </p>
        </div>
      </div>
    </div>
  );
};
