/**
 * ZZP Exam Application Form
 * Worker wypełnia formularz i opłaca egzamin (€230)
 */

import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { STRIPE_CONFIG } from "../../config/stripe";
import { supabase } from "@/lib/supabase";

interface ZZPExamApplicationFormProps {
  userId: string;
  userEmail: string;
  onSuccess?: () => void;
}

const WAREHOUSE_LOCATIONS = [
  "Amsterdam Warehouse",
  "Rotterdam Warehouse",
  "Utrecht Warehouse",
  "Eindhoven Warehouse",
];

const SPECIALIZATIONS = [
  { id: "forklift", label: "Wózki widłowe", icon: "🚜" },
  { id: "warehouse", label: "Prace magazynowe", icon: "📦" },
  { id: "logistics", label: "Logistyka", icon: "🚚" },
  { id: "heavy_machinery", label: "Ciężki sprzęt", icon: "🏗️" },
  { id: "inventory", label: "Zarządzanie zapasami", icon: "📊" },
  { id: "quality_control", label: "Kontrola jakości", icon: "✅" },
];

export const ZZPExamApplicationForm: React.FC<ZZPExamApplicationFormProps> = ({
  userId,
  userEmail,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    examDate: "",
    warehouseLocation: "",
    experienceDescription: "",
    specializations: [] as string[],
    contactPhone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examPriceId = STRIPE_CONFIG.products.zzpExam.priceId;
  const examAmount = STRIPE_CONFIG.products.zzpExam.amount;

  const handleSpecializationToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(id)
        ? prev.specializations.filter((s) => s !== id)
        : [...prev.specializations, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.examDate) {
      setError("Wybierz preferowaną datę egzaminu");
      return;
    }

    if (!formData.warehouseLocation) {
      setError("Wybierz lokalizację magazynu");
      return;
    }

    if (!formData.experienceDescription.trim()) {
      setError("Opisz swoje doświadczenie");
      return;
    }

    if (formData.specializations.length === 0) {
      setError("Wybierz przynajmniej jedną specjalizację");
      return;
    }

    if (!examPriceId) {
      setError(
        "Stripe nie jest skonfigurowany. Skontaktuj się z administracją."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current session token for authorization
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Nie jesteś zalogowany. Zaloguj się ponownie.");
      }

      // Call Supabase Edge Function to create exam payment session
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

      if (!functionsUrl) {
        throw new Error("Konfiguracja Supabase jest nieprawidłowa.");
      }

      console.log("🔵 Creating exam payment session...", {
        functionsUrl,
        examPriceId,
        userId,
      });

      const response = await fetch(`${functionsUrl}/create-exam-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
          priceId: examPriceId,
          examData: formData,
        }),
      });

      console.log("🔵 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        let errorMessage = "Nie udało się utworzyć sesji płatności";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("✅ Payment session created:", responseData);

      const { url } = responseData;

      if (!url) {
        throw new Error("Nie otrzymano adresu URL płatności");
      }

      // Redirect to Stripe Checkout
      console.log("🔵 Redirecting to:", url);
      window.location.href = url;

      onSuccess?.();
    } catch (err) {
      console.error("❌ Error creating exam payment:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Wystąpił błąd podczas przetwarzania"
      );
      setLoading(false); // IMPORTANT: Reset loading state on error!
    }
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Zgłoszenie na Egzamin ZZP 🏆
        </h2>
        <p className="text-amber-50">
          Zdobądź Certyfikat Doświadczenia ZZP Werkplaats
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Date Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4" />
            Preferowana data egzaminu
          </label>
          <input
            type="date"
            min={minDateString}
            value={formData.examDate}
            onChange={(e) =>
              setFormData({ ...formData, examDate: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Skontaktujemy się z Tobą aby potwierdzić termin
          </p>
        </div>

        {/* Warehouse Location */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4" />
            Lokalizacja magazynu
          </label>
          <select
            value={formData.warehouseLocation}
            onChange={(e) =>
              setFormData({ ...formData, warehouseLocation: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          >
            <option value="">Wybierz magazyn...</option>
            {WAREHOUSE_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Specializations */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <CheckCircle className="w-4 h-4" />
            Specjalizacje (wybierz wszystkie, które posiadasz)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {SPECIALIZATIONS.map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() => handleSpecializationToggle(spec.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                  ${
                    formData.specializations.includes(spec.id)
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-gray-200 hover:border-amber-300 text-gray-700"
                  }
                `}
              >
                <span className="text-2xl">{spec.icon}</span>
                <span className="text-sm font-medium">{spec.label}</span>
                {formData.specializations.includes(spec.id) && (
                  <CheckCircle className="w-4 h-4 ml-auto text-amber-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Description */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4" />
            Opisz swoje doświadczenie
          </label>
          <textarea
            value={formData.experienceDescription}
            onChange={(e) =>
              setFormData({
                ...formData,
                experienceDescription: e.target.value,
              })
            }
            rows={4}
            placeholder="Opisz swoje doświadczenie w pracy magazynowej, obsłudze wózków widłowych, logistyce, itp."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            required
          />
          <p className="mt-1 text-sm text-gray-500">Min. 50 znaków</p>
        </div>

        {/* Contact Phone (optional) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            📞 Numer telefonu (opcjonalnie)
          </label>
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) =>
              setFormData({ ...formData, contactPhone: e.target.value })
            }
            placeholder="+31 6 1234 5678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Koszt egzaminu:</span>
            <span className="text-lg font-bold text-gray-900">
              €{examAmount}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Obejmuje: Egzamin praktyczny + Certyfikat ZZP (ważny 7 lat) + €190 +
            21% BTW
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Przetwarzanie...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Opłać i zarezerwuj egzamin - €{examAmount}
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          Po opłaceniu skontaktujemy się z Tobą aby potwierdzić termin egzaminu
        </p>
      </form>
    </div>
  );
};
