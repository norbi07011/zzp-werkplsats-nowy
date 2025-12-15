/**
 * EMPLOYER SUBSCRIPTION PAGE
 * Wybór planu subskrypcji dla pracodawców:
 * - Basic (€13/miesiąc) - podstawowe funkcje
 * - Premium (€25/miesiąc) - pełna funkcjonalność
 *
 * Wzorowane na AccountantSubscriptionPage
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Crown from "lucide-react/dist/esm/icons/crown";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Loader from "lucide-react/dist/esm/icons/loader";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Users from "lucide-react/dist/esm/icons/users";
import Star from "lucide-react/dist/esm/icons/star";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Search from "lucide-react/dist/esm/icons/search";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Bookmark from "lucide-react/dist/esm/icons/bookmark";
import Zap from "lucide-react/dist/esm/icons/zap";
import { handleEmployerSubscription } from "../../src/services/stripe";
import { STRIPE_CONFIG } from "../../src/config/stripe";

interface EmployerData {
  id: string;
  company_name: string | null;
  contact_person: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
}

export const EmployerSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employerData, setEmployerData] = useState<EmployerData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // ✅ Check if returning from successful Stripe payment (support both formats)
  const paymentSuccess =
    searchParams.get("payment_success") === "true" ||
    searchParams.get("success") === "true";
  const paymentCompleted = searchParams.get("payment_completed") === "true";
  const showSuccessBanner = paymentSuccess || paymentCompleted;
  const sessionId = searchParams.get("session_id");

  // Load current subscription data
  useEffect(() => {
    const loadEmployerData = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log("[Employer Subscription] Waiting for auth to complete...");
        return;
      }

      // If no user after auth loaded and payment success - try to get user from saved session
      if (!user) {
        if (paymentSuccess) {
          console.log(
            "[Employer Subscription] Payment success but no user after auth - checking session..."
          );
          // Try to get session directly
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session?.user) {
            console.log(
              "[Employer Subscription] No session found, showing success view"
            );
            setLoadingData(false);
            return;
          }
          // Session exists, continue with that user
          const sessionUser = sessionData.session.user;
          try {
            const { data, error } = await supabase
              .from("employers")
              .select(
                "id, company_name, contact_person, subscription_tier, subscription_status"
              )
              .eq("profile_id", sessionUser.id)
              .single();

            if (error) throw error;
            setEmployerData(data);

            if (data?.subscription_tier === "premium") {
              setSelectedPlan("premium");
            } else if (data?.subscription_tier === "basic") {
              setSelectedPlan("basic");
            } else {
              setSelectedPlan(null);
            }
          } catch (err) {
            console.error("Error loading employer data from session:", err);
          } finally {
            setLoadingData(false);
          }
          return;
        }
        setLoadingData(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("employers")
          .select(
            "id, company_name, contact_person, subscription_tier, subscription_status"
          )
          .eq("profile_id", user.id)
          .single();

        if (error) throw error;
        setEmployerData(data);

        // Pre-select current plan
        if (data?.subscription_tier === "premium") {
          setSelectedPlan("premium");
        } else if (data?.subscription_tier === "basic") {
          setSelectedPlan("basic");
        } else {
          setSelectedPlan(null);
        }
      } catch (err) {
        console.error("Error loading employer data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadEmployerData();
  }, [user, authLoading, paymentSuccess]);

  // ✅ Handle successful payment - update subscription in database
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (!paymentSuccess && !paymentCompleted) return;
      if (authLoading) return; // Wait for auth to finish

      // Get user ID - either from context or from session
      let userId = user?.id;
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession();
        userId = sessionData?.session?.user?.id;
      }

      if (!userId) {
        console.log("[Employer Subscription] No user found for payment update");
        return;
      }

      console.log(
        "[Employer Subscription] Payment success/completed detected, updating database for user:",
        userId
      );

      // Determine which plan was purchased based on session or default to premium
      const purchasedPlan = searchParams.get("plan") || "premium";

      try {
        // Update subscription status in database
        const { error: updateError } = await supabase
          .from("employers")
          .update({
            subscription_tier: purchasedPlan,
            subscription_status: "active",
            subscription_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", userId);

        if (updateError) {
          console.error(
            "[Employer Subscription] Error updating subscription:",
            updateError
          );
        } else {
          console.log(
            `[Employer Subscription] Subscription updated to ${purchasedPlan}!`
          );
          // Reload employer data to reflect changes
          const { data } = await supabase
            .from("employers")
            .select(
              "id, company_name, contact_person, subscription_tier, subscription_status"
            )
            .eq("profile_id", userId)
            .single();

          if (data) {
            setEmployerData(data);
            setSelectedPlan(data.subscription_tier as "basic" | "premium");
          }
        }
      } catch (err) {
        console.error(
          "[Employer Subscription] Error handling payment success:",
          err
        );
      }
    };

    handlePaymentSuccess();
  }, [paymentSuccess, paymentCompleted, user, authLoading, searchParams]);

  const handleSelectBasic = async () => {
    if (!user || !employerData) {
      setError("Brak danych konta");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Redirect to Stripe Checkout for €13/month Basic subscription
      await handleEmployerSubscription(user.id, "basic");
      // Note: The redirect happens in the function above
    } catch (err) {
      console.error("Error initiating payment:", err);
      setError("Błąd podczas inicjowania płatności");
      setIsLoading(false);
    }
  };

  const handleSelectPremium = async () => {
    if (!user || !employerData) {
      setError("Brak danych konta");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Redirect to Stripe Checkout for €25/month Premium subscription
      await handleEmployerSubscription(user.id, "premium");
      // Note: The redirect happens in the function above
    } catch (err) {
      console.error("Error initiating payment:", err);
      setError("Błąd podczas inicjowania płatności");
      setIsLoading(false);
    }
  };

  // Loading state
  if (loadingData && !paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  // ✅ Payment success but no session - show success with login button
  if ((paymentSuccess || paymentCompleted) && !user) {
    const redirectUrl = encodeURIComponent(
      "/employer/subscription?payment_completed=true"
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Płatność zakończona sukcesem! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Twoja subskrypcja została aktywowana! Zaloguj się ponownie, aby
            korzystać z pełnej funkcjonalności.
          </p>
          <button
            onClick={() => navigate(`/login?redirect=${redirectUrl}`)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
          >
            Zaloguj się
          </button>
        </div>
      </div>
    );
  }

  const isPremium = employerData?.subscription_tier === "premium";
  const isBasic = employerData?.subscription_tier === "basic";
  const hasSubscription =
    isPremium || (isBasic && employerData?.subscription_status === "active");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/employer")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Wróć do panelu
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-10 h-10 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Wybierz plan dla Twojej firmy 🏢
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {hasSubscription
              ? "Zarządzaj swoją subskrypcją"
              : "Wybierz plan, który najlepiej odpowiada Twoim potrzebom rekrutacyjnym"}
          </p>
          {employerData && (
            <p className="mt-2 text-orange-600 font-medium">
              {employerData.company_name ||
                employerData.contact_person ||
                "Twoja firma"}
            </p>
          )}
        </div>

        {/* ✅ Payment Success Banner */}
        {showSuccessBanner && (
          <div className="max-w-2xl mx-auto mb-8 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-6 shadow-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">
                  🎉 Płatność zakończona sukcesem!
                </h2>
                <p className="text-orange-100">
                  Twoja subskrypcja została aktywowana. Teraz masz pełny dostęp
                  do wszystkich funkcji!
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
        {hasSubscription && !showSuccessBanner && (
          <div
            className={`max-w-md mx-auto mb-8 ${
              isPremium
                ? "bg-gradient-to-r from-orange-500 to-amber-500"
                : "bg-gradient-to-r from-blue-500 to-indigo-500"
            } text-white rounded-xl p-4 flex items-center gap-3`}
          >
            <Crown className="w-8 h-8" />
            <div>
              <p className="font-bold">
                Aktualny plan: {isPremium ? "Premium" : "Basic"}
              </p>
              <p className="text-sm opacity-90">
                {isPremium
                  ? "Masz pełny dostęp do wszystkich funkcji"
                  : "Podstawowy dostęp do platformy"}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-6 h-6" />
            <p>{error}</p>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* BASIC PLAN - €13/month */}
          <div
            className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all cursor-pointer ${
              selectedPlan === "basic"
                ? "border-blue-500 ring-4 ring-blue-200"
                : "border-gray-200 hover:border-blue-300"
            } ${isBasic ? "ring-4 ring-blue-200" : ""}`}
            onClick={() => setSelectedPlan("basic")}
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center text-white">
              <h3 className="text-2xl font-bold">Basic</h3>
              <div className="mt-4">
                <span className="text-5xl font-bold">€13</span>
                <span className="text-blue-100">/miesiąc</span>
              </div>
              <p className="mt-2 text-sm text-blue-100">
                Podstawowe narzędzia rekrutacyjne
              </p>
            </div>

            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Profil firmy</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Do 50 wyszukiwań/miesiąc
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Do 5 kontaktów/miesiąc</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Do 10 zapisanych pracowników
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Wsparcie email</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">
                    Dostęp do Premium workers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">AI matching</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">
                    Priorytetowe wsparcie 24/7
                  </span>
                </li>
              </ul>

              <button
                onClick={handleSelectBasic}
                disabled={isLoading || isBasic}
                className={`w-full mt-6 py-3 px-6 rounded-xl font-semibold transition-all ${
                  isBasic
                    ? "bg-blue-100 text-blue-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Ładowanie...
                  </span>
                ) : isBasic ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Aktualny plan
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Wybierz Basic
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* PREMIUM PLAN - €25/month */}
          <div
            className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all cursor-pointer relative ${
              selectedPlan === "premium"
                ? "border-orange-500 ring-4 ring-orange-200"
                : "border-gray-200 hover:border-orange-300"
            } ${isPremium ? "ring-4 ring-orange-200" : ""}`}
            onClick={() => setSelectedPlan("premium")}
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" />
              NAJPOPULARNIEJSZY
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-center text-white">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Crown className="w-6 h-6" />
                Premium
              </h3>
              <div className="mt-4">
                <span className="text-5xl font-bold">€25</span>
                <span className="text-orange-100">/miesiąc</span>
              </div>
              <p className="mt-2 text-sm text-orange-100">
                Pełna moc rekrutacyjna
              </p>
            </div>

            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">
                    Wszystko z Basic, plus:
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Nielimitowane</strong> wyszukiwania
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Nielimitowane</strong> kontakty
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Bookmark className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Nielimitowani</strong> zapisani pracownicy
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Dostęp do Premium workers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    AI matching & zaawansowane filtry
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Priorytetowe wsparcie 24/7
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Pełne statystyki & raporty
                  </span>
                </li>
              </ul>

              <button
                onClick={handleSelectPremium}
                disabled={isLoading || isPremium}
                className={`w-full mt-6 py-3 px-6 rounded-xl font-semibold transition-all ${
                  isPremium
                    ? "bg-orange-100 text-orange-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Ładowanie...
                  </span>
                ) : isPremium ? (
                  <span className="flex items-center justify-center gap-2">
                    <Crown className="w-5 h-5" />
                    Aktualny plan
                  </span>
                ) : isBasic ? (
                  <span className="flex items-center justify-center gap-2">
                    Upgrade do Premium
                    <ArrowRight className="w-5 h-5" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Wybierz Premium
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            💳 Bezpieczne płatności przez Stripe • Możesz anulować w każdej
            chwili
          </p>
          <p className="mt-2">
            Masz pytania?{" "}
            <button
              onClick={() => navigate("/contact")}
              className="text-orange-600 hover:underline"
            >
              Skontaktuj się z nami
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployerSubscriptionPage;
