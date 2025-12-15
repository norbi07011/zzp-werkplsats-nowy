/**
 * CLEANING COMPANY SUBSCRIPTION SELECTION PAGE
 * Wybór planu subskrypcji dla firm sprzątających:
 * - Basic (€0) - brak widoczności dla pracodawców
 * - Premium (€13/miesiąc) - pełna widoczność + dostęp do projektów
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import {
  Building2,
  CheckCircle,
  Crown,
  Star,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import { handleCleaningCompanyUpgradeToPremium } from "../../src/services/stripe";
import { STRIPE_CONFIG } from "../../src/config/stripe";

interface CompanyData {
  id: string;
  company_name: string;
  subscription_tier: string | null;
  subscription_status: string | null;
}

export const CleaningCompanySubscriptionSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // ✅ Check if returning from successful Stripe payment (support both formats)
  const paymentSuccess =
    searchParams.get("payment_success") === "true" ||
    searchParams.get("success") === "true";
  const paymentCompleted = searchParams.get("payment_completed") === "true"; // After re-login
  const showSuccessBanner = paymentSuccess || paymentCompleted;
  const sessionId = searchParams.get("session_id");

  // Note: Session recovery is now handled globally in AuthContext
  // This component just waits for user to be available

  // Load current subscription data
  useEffect(() => {
    const loadCompanyData = async () => {
      // If no user and payment success - show success message instead of loading forever
      if (!user) {
        if (paymentSuccess) {
          console.log(
            "[Subscription] Payment success but no user - showing success view"
          );
          setLoadingData(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("cleaning_companies")
          .select("id, company_name, subscription_tier, subscription_status")
          .eq("profile_id", user.id)
          .single();

        if (error) throw error;
        setCompanyData(data);

        // Pre-select current plan
        if (data?.subscription_tier === "premium") {
          setSelectedPlan("premium");
        } else {
          setSelectedPlan("basic");
        }
      } catch (err) {
        console.error("Error loading company data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadCompanyData();
  }, [user, paymentSuccess]);

  // ✅ Handle successful payment - update subscription in database
  // This triggers for BOTH: direct Stripe return (paymentSuccess) AND post-login return (paymentCompleted)
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      // ✅ Trigger for BOTH paymentSuccess AND paymentCompleted
      if ((!paymentSuccess && !paymentCompleted) || !user) return;

      console.log(
        "[Subscription] Payment success/completed detected, updating database..."
      );

      try {
        // Update subscription status in database
        const { error: updateError } = await supabase
          .from("cleaning_companies")
          .update({
            subscription_tier: "premium",
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", user.id);

        if (updateError) {
          console.error(
            "[Subscription] Error updating subscription:",
            updateError
          );
        } else {
          console.log("[Subscription] Subscription updated to premium!");
          // Reload company data to reflect changes
          const { data } = await supabase
            .from("cleaning_companies")
            .select("id, company_name, subscription_tier, subscription_status")
            .eq("profile_id", user.id)
            .single();

          if (data) {
            setCompanyData(data);
            setSelectedPlan("premium");
          }
        }
      } catch (err) {
        console.error("[Subscription] Error handling payment success:", err);
      }
    };

    handlePaymentSuccess();
  }, [paymentSuccess, paymentCompleted, user]);

  const handleSelectBasic = async () => {
    if (!user || !companyData) {
      setError("Brak danych firmy");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update subscription to basic
      const { error: updateError } = await supabase
        .from("cleaning_companies")
        .update({
          subscription_tier: "basic",
          subscription_status: "active",
        })
        .eq("profile_id", user.id);

      if (updateError) throw updateError;

      // Redirect to dashboard
      navigate("/cleaning-company");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się zaktualizować planu"
      );
      setIsLoading(false);
    }
  };

  const handleSelectPremium = async () => {
    if (!user) {
      setError("Użytkownik nie jest zalogowany");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Redirect to Stripe Checkout for €13/month Premium subscription for cleaning companies
      await handleCleaningCompanyUpgradeToPremium(user.id);
      // User will be redirected to Stripe, then back to /payment-success
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Płatność nie powiodła się"
      );
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-600">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  // ✅ Payment success but no session - show success with login button
  if ((paymentSuccess || paymentCompleted) && !user) {
    // Encode the redirect URL to preserve the payment_completed parameter
    const redirectUrl = encodeURIComponent(
      "/cleaning-company/subscription?payment_completed=true"
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Płatność zakończona sukcesem! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Twoja subskrypcja Premium została aktywowana! Zaloguj się ponownie,
            aby korzystać z pełnej funkcjonalności.
          </p>
          <button
            onClick={() => navigate(`/login?redirect=${redirectUrl}`)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
          >
            Zaloguj się
          </button>
        </div>
      </div>
    );
  }

  const isPremium = companyData?.subscription_tier === "premium";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/cleaning-company")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Wróć do panelu
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Wybierz plan dla Twojej firmy 🧹
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isPremium
              ? "Zarządzaj swoją subskrypcją Premium"
              : "Wybierz plan, który najlepiej odpowiada Twoim potrzebom"}
          </p>
          {companyData && (
            <p className="mt-2 text-blue-600 font-medium">
              Firma: {companyData.company_name}
            </p>
          )}
        </div>

        {/* ✅ Payment Success Banner */}
        {showSuccessBanner && (
          <div className="max-w-2xl mx-auto mb-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-6 shadow-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">
                  🎉 Płatność zakończona sukcesem!
                </h2>
                <p className="text-green-100">
                  Twoja subskrypcja Premium została aktywowana. Teraz masz pełny
                  dostęp do wszystkich funkcji!
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-8 h-8 text-yellow-300" />
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </div>
            </div>
          </div>
        )}

        {/* Current Plan Badge */}
        {isPremium && !showSuccessBanner && (
          <div className="max-w-md mx-auto mb-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-4 flex items-center gap-3">
            <Crown className="w-8 h-8" />
            <div>
              <p className="font-bold">Aktualny plan: Premium</p>
              <p className="text-sm opacity-90">
                Masz pełny dostęp do wszystkich funkcji
              </p>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 max-w-3xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg mb-2">
                Jak działa subskrypcja?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Basic (€0):</strong> Możesz założyć profil firmy,
                    ale pracodawcy NIE widzą Cię w wyszukiwaniach. Brak
                    widoczności = brak zleceń.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Premium (€13/miesiąc):</strong> Pełna widoczność dla
                    pracodawców, wyższa pozycja w wyszukiwaniach, badge Premium
                    i dostęp do projektów budowlanych.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Możesz zmienić plan w każdej chwili!</strong> Start
                    z Basic i upgrade do Premium gdy będziesz gotowy.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* BASIC PLAN - FREE */}
          <div
            className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all cursor-pointer ${
              selectedPlan === "basic"
                ? "border-blue-500 ring-4 ring-blue-200"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setSelectedPlan("basic")}
          >
            <div className="bg-gray-100 p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900">Basic</h3>
              <div className="mt-4">
                <span className="text-5xl font-bold text-gray-900">€0</span>
                <span className="text-gray-600">/miesiąc</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                100% za darmo, zawsze
              </p>
            </div>

            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Profil firmy - tworzenie i edycja
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Portfolio usług</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Przeglądanie platformy</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Widoczność dla pracodawców
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Pracodawcy widzą Twój profil
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Zaproszenia do projektów
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Kontakt od pracodawców
                  </span>
                </li>
              </ul>

              <button
                onClick={handleSelectBasic}
                disabled={isLoading && selectedPlan === "basic"}
                className="w-full mt-6 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && selectedPlan === "basic" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Zapisywanie...
                  </>
                ) : isPremium ? (
                  "Zmień na Basic"
                ) : (
                  <>
                    Zostań przy Basic
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* PREMIUM PLAN - €13/month */}
          <div
            className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all cursor-pointer relative ${
              selectedPlan === "premium"
                ? "border-blue-500 ring-4 ring-blue-200"
                : "border-blue-300 hover:border-blue-500"
            }`}
            onClick={() => setSelectedPlan("premium")}
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              POLECANY
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-center text-white">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Crown className="w-6 h-6" />
                Premium
              </h3>
              <div className="mt-4">
                <span className="text-5xl font-bold">€13</span>
                <span className="text-blue-100">/miesiąc</span>
              </div>
              <p className="mt-2 text-sm text-blue-100">
                Pełna widoczność i priorytet
              </p>
            </div>

            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-semibold">
                    Wszystko z Basic +
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Pełna widoczność</strong> dla pracodawców
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Wyższa pozycja</strong> w wynikach wyszukiwania
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Badge Premium</strong> na profilu
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Zaproszenia do projektów</strong> budowlanych
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Bezpośredni kontakt</strong> od pracodawców
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Powiadomienia email</strong> o nowych projektach
                  </span>
                </li>
              </ul>

              <button
                onClick={handleSelectPremium}
                disabled={
                  (isLoading && selectedPlan === "premium") || isPremium
                }
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-600 transition transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && selectedPlan === "premium" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Przekierowuję do płatności...
                  </>
                ) : isPremium ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Aktualny plan
                  </>
                ) : (
                  <>
                    Upgrade do Premium
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-12 max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            ❓ Często zadawane pytania
          </h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold">
                Czy mogę później przejść na Premium?
              </p>
              <p className="text-gray-600">
                Tak! Możesz w każdej chwili zmienić plan przez panel ustawień.
                Płacisz od momentu aktywacji €13/miesiąc.
              </p>
            </div>
            <div>
              <p className="font-semibold">Czy mogę anulować Premium?</p>
              <p className="text-gray-600">
                Tak, możesz anulować subskrypcję w dowolnym momencie. Twój
                profil pozostanie dostępny, ale nie będzie widoczny dla
                pracodawców.
              </p>
            </div>
            <div>
              <p className="font-semibold">Co się stanie, gdy wybiorę Basic?</p>
              <p className="text-gray-600">
                Masz dostęp do platformy i możesz wypełnić profil, ale
                pracodawcy NIE zobaczą Twojej firmy w wynikach wyszukiwania. Nie
                otrzymasz zapytań o zlecenia, dopóki nie przejdziesz na Premium.
              </p>
            </div>
            <div>
              <p className="font-semibold">
                Dlaczego Premium dla firm sprzątających kosztuje €13?
              </p>
              <p className="text-gray-600">
                To taka sama cena jak dla indywidualnych pracowników.
                €13/miesiąc to inwestycja, która zwraca się przy pierwszym
                zleceniu.
              </p>
            </div>
          </div>
        </div>

        {/* Skip for now */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/cleaning-company")}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            Zdecyduję później, przejdź do panelu →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CleaningCompanySubscriptionSelectionPage;
