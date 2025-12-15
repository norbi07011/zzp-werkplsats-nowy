/**
 * ACCOUNTANT SUBSCRIPTION PAGE
 * Wybór planu subskrypcji dla księgowych:
 * - Basic (€0) - brak widoczności dla klientów
 * - Pro (€13/miesiąc) - pełna widoczność + dostęp do klientów
 *
 * Wzorowane na CleaningCompanySubscriptionSelectionPage
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
  ArrowRight,
  XCircle,
  AlertCircle,
  Calculator,
  Sparkles,
  Users,
} from "lucide-react";

import { handleAccountantUpgradeToPremium } from "../../src/services/stripe";
import { STRIPE_CONFIG } from "../../src/config/stripe";

interface AccountantData {
  id: string;
  full_name: string;
  company_name: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
}

export const AccountantSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountantData, setAccountantData] = useState<AccountantData | null>(
    null
  );
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
    const loadAccountantData = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log(
          "[Accountant Subscription] Waiting for auth to complete..."
        );
        return;
      }

      // If no user after auth loaded and payment success - try to get user from saved session
      if (!user) {
        if (paymentSuccess) {
          console.log(
            "[Accountant Subscription] Payment success but no user after auth - checking session..."
          );
          // Try to get session directly
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session?.user) {
            console.log(
              "[Accountant Subscription] No session found, showing success view"
            );
            setLoadingData(false);
            return;
          }
          // Session exists, continue with that user
          const sessionUser = sessionData.session.user;
          try {
            const { data, error } = await supabase
              .from("accountants")
              .select(
                "id, full_name, company_name, subscription_tier, subscription_status"
              )
              .eq("profile_id", sessionUser.id)
              .single();

            if (error) throw error;
            setAccountantData(data);

            if (
              data?.subscription_tier === "pro" ||
              data?.subscription_tier === "premium"
            ) {
              setSelectedPlan("pro");
            } else {
              setSelectedPlan("basic");
            }
          } catch (err) {
            console.error("Error loading accountant data from session:", err);
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
          .from("accountants")
          .select(
            "id, full_name, company_name, subscription_tier, subscription_status"
          )
          .eq("profile_id", user.id)
          .single();

        if (error) throw error;
        setAccountantData(data);

        // Pre-select current plan
        if (
          data?.subscription_tier === "pro" ||
          data?.subscription_tier === "premium"
        ) {
          setSelectedPlan("pro");
        } else {
          setSelectedPlan("basic");
        }
      } catch (err) {
        console.error("Error loading accountant data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadAccountantData();
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
        console.log(
          "[Accountant Subscription] No user found for payment update"
        );
        return;
      }

      console.log(
        "[Accountant Subscription] Payment success/completed detected, updating database for user:",
        userId
      );

      try {
        // Update subscription status in database
        const { error: updateError } = await supabase
          .from("accountants")
          .update({
            subscription_tier: "pro",
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", userId);

        if (updateError) {
          console.error(
            "[Accountant Subscription] Error updating subscription:",
            updateError
          );
        } else {
          console.log("[Accountant Subscription] Subscription updated to pro!");
          // Reload accountant data to reflect changes
          const { data } = await supabase
            .from("accountants")
            .select(
              "id, full_name, company_name, subscription_tier, subscription_status"
            )
            .eq("profile_id", userId)
            .single();

          if (data) {
            setAccountantData(data);
            setSelectedPlan("pro");
          }
        }
      } catch (err) {
        console.error(
          "[Accountant Subscription] Error handling payment success:",
          err
        );
      }
    };

    handlePaymentSuccess();
  }, [paymentSuccess, paymentCompleted, user, authLoading]);

  const handleSelectBasic = async () => {
    if (!user || !accountantData) {
      setError("Brak danych konta");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("accountants")
        .update({
          subscription_tier: "basic",
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", user.id);

      if (updateError) throw updateError;

      // Navigate to dashboard
      navigate("/accountant/dashboard");
    } catch (err) {
      console.error("Error selecting basic plan:", err);
      setError("Błąd podczas zapisywania planu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPro = async () => {
    if (!user || !accountantData) {
      setError("Brak danych konta");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Redirect to Stripe Checkout for €13/month Pro subscription for accountants
      await handleAccountantUpgradeToPremium(user.id);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  // ✅ Payment success but no session - show success with login button
  if ((paymentSuccess || paymentCompleted) && !user) {
    const redirectUrl = encodeURIComponent(
      "/accountant/subscription?payment_completed=true"
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Płatność zakończona sukcesem! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Twoja subskrypcja Pro została aktywowana! Zaloguj się ponownie, aby
            korzystać z pełnej funkcjonalności.
          </p>
          <button
            onClick={() => navigate(`/login?redirect=${redirectUrl}`)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg"
          >
            Zaloguj się
          </button>
        </div>
      </div>
    );
  }

  const isPro =
    accountantData?.subscription_tier === "pro" ||
    accountantData?.subscription_tier === "premium";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/accountant/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Wróć do panelu
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-10 h-10 text-emerald-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Wybierz plan dla Twojego biura 📊
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isPro
              ? "Zarządzaj swoją subskrypcją Pro"
              : "Wybierz plan, który najlepiej odpowiada Twoim potrzebom"}
          </p>
          {accountantData && (
            <p className="mt-2 text-emerald-600 font-medium">
              {accountantData.company_name || accountantData.full_name}
            </p>
          )}
        </div>

        {/* ✅ Payment Success Banner */}
        {showSuccessBanner && (
          <div className="max-w-2xl mx-auto mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-6 shadow-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">
                  🎉 Płatność zakończona sukcesem!
                </h2>
                <p className="text-emerald-100">
                  Twoja subskrypcja Pro została aktywowana. Teraz masz pełny
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
        {isPro && !showSuccessBanner && (
          <div className="max-w-md mx-auto mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-4 flex items-center gap-3">
            <Crown className="w-8 h-8" />
            <div>
              <p className="font-bold">Aktualny plan: Pro</p>
              <p className="text-sm opacity-90">
                Masz pełny dostęp do wszystkich funkcji
              </p>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* BASIC PLAN - Free */}
          <div
            className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all cursor-pointer ${
              selectedPlan === "basic"
                ? "border-gray-500 ring-4 ring-gray-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedPlan("basic")}
          >
            <div className="bg-gray-100 p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-800">Basic</h3>
              <div className="mt-4">
                <span className="text-5xl font-bold text-gray-800">€0</span>
                <span className="text-gray-500">/miesiąc</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Podstawowy dostęp do platformy
              </p>
            </div>

            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Profil księgowego</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Formularze dla klientów</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Kalendarz dostępności</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Widoczność w wyszukiwarce
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Kontakt od nowych klientów
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
                ) : isPro ? (
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

          {/* PRO PLAN - €13/month */}
          <div
            className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all cursor-pointer relative ${
              selectedPlan === "pro"
                ? "border-emerald-500 ring-4 ring-emerald-200"
                : "border-emerald-300 hover:border-emerald-500"
            }`}
            onClick={() => setSelectedPlan("pro")}
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              POLECANY
            </div>

            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center text-white">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Crown className="w-6 h-6" />
                Pro
              </h3>
              <div className="mt-4">
                <span className="text-5xl font-bold">€13</span>
                <span className="text-emerald-100">/miesiąc</span>
              </div>
              <p className="mt-2 text-sm text-emerald-100">
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
                    <strong>Pełna widoczność</strong> w wyszukiwarce
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Wyższa pozycja</strong> w wynikach
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Badge Pro</strong> na profilu
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Nowi klienci</strong> mogą Cię znaleźć
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Bezpośredni kontakt</strong> od klientów
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Powiadomienia email</strong> o zapytaniach
                  </span>
                </li>
              </ul>

              <button
                onClick={handleSelectPro}
                disabled={(isLoading && selectedPlan === "pro") || isPro}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && selectedPlan === "pro" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Przekierowuję do płatności...
                  </>
                ) : isPro ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Aktualny plan
                  </>
                ) : (
                  <>
                    Upgrade do Pro
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
              <p className="font-semibold">Czy mogę później przejść na Pro?</p>
              <p className="text-gray-600">
                Tak! Możesz w każdej chwili zmienić plan przez panel ustawień.
                Płacisz od momentu aktywacji €13/miesiąc.
              </p>
            </div>
            <div>
              <p className="font-semibold">Czy mogę anulować Pro?</p>
              <p className="text-gray-600">
                Tak, możesz anulować subskrypcję w dowolnym momencie. Twój
                profil pozostanie dostępny, ale nie będzie widoczny w
                wyszukiwarce.
              </p>
            </div>
            <div>
              <p className="font-semibold">Co się stanie, gdy wybiorę Basic?</p>
              <p className="text-gray-600">
                Masz dostęp do platformy i możesz obsługiwać istniejących
                klientów, ale NOWI klienci NIE znajdą Cię w wyszukiwarce.
              </p>
            </div>
            <div>
              <p className="font-semibold">
                Dlaczego Pro kosztuje €13/miesiąc?
              </p>
              <p className="text-gray-600">
                To taka sama cena jak dla innych profesjonalistów na platformie.
                €13/miesiąc to inwestycja, która zwraca się przy pierwszym nowym
                kliencie.
              </p>
            </div>
          </div>
        </div>

        {/* Skip for now */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/accountant/dashboard")}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            Zdecyduję później, przejdź do panelu →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountantSubscriptionPage;
