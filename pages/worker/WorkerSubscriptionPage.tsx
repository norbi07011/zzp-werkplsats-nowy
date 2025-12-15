/**
 * WORKER SUBSCRIPTION PAGE
 * Wybór planu subskrypcji dla pracowników:
 * - Basic (€0/miesiąc) - brak widoczności dla pracodawców
 * - Premium (€13/miesiąc) - pełna widoczność + dostęp do ofert
 * + Opcja zakupu certyfikatu ZZP (€230 jednorazowo)
 *
 * Wzorowane na EmployerSubscriptionPage / AccountantSubscriptionPage
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
import User from "lucide-react/dist/esm/icons/user";
import Star from "lucide-react/dist/esm/icons/star";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Eye from "lucide-react/dist/esm/icons/eye";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Award from "lucide-react/dist/esm/icons/award";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import { handleUpgradeToPremium } from "../../src/services/stripe";
import { STRIPE_CONFIG } from "../../src/config/stripe";

interface WorkerData {
  id: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  zzp_certificate_issued: boolean | null;
  zzp_certificate_number: string | null;
}

export const WorkerSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerData, setWorkerData] = useState<WorkerData | null>(null);
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
    const loadWorkerData = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log("[Worker Subscription] Waiting for auth to complete...");
        return;
      }

      // If no user after auth loaded and payment success - try to get user from saved session
      if (!user) {
        if (paymentSuccess) {
          console.log(
            "[Worker Subscription] Payment success but no user after auth - checking session..."
          );
          // Try to get session directly
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session?.user) {
            console.log(
              "[Worker Subscription] No session found, showing success view"
            );
            setLoadingData(false);
            return;
          }
          // Session exists, continue with that user
          const sessionUser = sessionData.session.user;
          try {
            const { data, error } = await supabase
              .from("workers")
              .select(
                "id, subscription_tier, subscription_status, zzp_certificate_issued, zzp_certificate_number"
              )
              .eq("profile_id", sessionUser.id)
              .single();

            if (error) throw error;
            setWorkerData(data);

            if (data?.subscription_tier === "premium") {
              setSelectedPlan("premium");
            } else {
              setSelectedPlan("basic");
            }
          } catch (err) {
            console.error("Error loading worker data from session:", err);
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
          .from("workers")
          .select(
            "id, subscription_tier, subscription_status, zzp_certificate_issued, zzp_certificate_number"
          )
          .eq("profile_id", user.id)
          .single();

        if (error) throw error;
        setWorkerData(data);

        // Pre-select current plan
        if (data?.subscription_tier === "premium") {
          setSelectedPlan("premium");
        } else {
          setSelectedPlan("basic");
        }
      } catch (err) {
        console.error("Error loading worker data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadWorkerData();
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
        console.log("[Worker Subscription] No user found for payment update");
        return;
      }

      console.log(
        "[Worker Subscription] Payment success/completed detected, updating database for user:",
        userId
      );

      try {
        // Update subscription status in database
        const { error: updateError } = await supabase
          .from("workers")
          .update({
            subscription_tier: "premium",
            subscription_status: "active",
            subscription_start_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", userId);

        if (updateError) {
          console.error(
            "[Worker Subscription] Error updating subscription:",
            updateError
          );
        } else {
          console.log("[Worker Subscription] Subscription updated to premium!");
          // Reload worker data to reflect changes
          const { data } = await supabase
            .from("workers")
            .select(
              "id, subscription_tier, subscription_status, zzp_certificate_issued, zzp_certificate_number"
            )
            .eq("profile_id", userId)
            .single();

          if (data) {
            setWorkerData(data);
            setSelectedPlan("premium");
          }
        }
      } catch (err) {
        console.error(
          "[Worker Subscription] Error handling payment success:",
          err
        );
      }
    };

    handlePaymentSuccess();
  }, [paymentSuccess, paymentCompleted, user, authLoading]);

  const handleSelectBasic = async () => {
    if (!user || !workerData) {
      setError("Brak danych konta");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("workers")
        .update({
          subscription_tier: "basic",
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", user.id);

      if (updateError) throw updateError;

      // Navigate to dashboard
      navigate("/worker");
    } catch (err) {
      console.error("Error selecting basic plan:", err);
      setError("Błąd podczas zapisywania planu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPremium = async () => {
    if (!user || !workerData) {
      setError("Brak danych konta");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Redirect to Stripe Checkout for €13/month Premium subscription
      await handleUpgradeToPremium(user.id);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50">
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
      "/worker/subscription?payment_completed=true"
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
            Twoja subskrypcja Premium została aktywowana! Zaloguj się ponownie,
            aby korzystać z pełnej funkcjonalności.
          </p>
          <button
            onClick={() => navigate(`/login?redirect=${redirectUrl}`)}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg"
          >
            Zaloguj się
          </button>
        </div>
      </div>
    );
  }

  const isPremium = workerData?.subscription_tier === "premium";
  const isBasic =
    workerData?.subscription_tier === "basic" || !workerData?.subscription_tier;
  const hasCertificate = workerData?.zzp_certificate_issued;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/worker")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Wróć do panelu
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="w-10 h-10 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Wybierz swój plan 🎯
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isPremium
              ? "Zarządzaj swoją subskrypcją Premium"
              : "Wybierz plan, który najlepiej odpowiada Twoim potrzebom"}
          </p>
          {workerData && (
            <p className="mt-2 text-orange-600 font-medium">
              {user?.email || "Twój profil"}
            </p>
          )}
        </div>

        {/* ✅ Payment Success Banner */}
        {showSuccessBanner && (
          <div className="max-w-2xl mx-auto mb-8 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl p-6 shadow-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">
                  🎉 Płatność zakończona sukcesem!
                </h2>
                <p className="text-orange-100">
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
          <div className="max-w-md mx-auto mb-8 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl p-4 flex items-center gap-3">
            <Crown className="w-8 h-8" />
            <div>
              <p className="font-bold">Aktualny plan: Premium</p>
              <p className="text-sm opacity-90">
                Masz pełną widoczność dla pracodawców
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
          {/* BASIC PLAN - €0/month */}
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
                100% gratis, na zawsze
              </p>
            </div>

            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Profil pracownika</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Możliwość zgłoszenia na certyfikat ZZP
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Przeglądanie platformy</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">
                    Widoczność dla pracodawców
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">
                    Pracodawcy NIE widzą Twojego profilu
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">
                    Otrzymywanie ofert pracy
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Kontakt od pracodawców</span>
                </li>
              </ul>

              <button
                onClick={handleSelectBasic}
                disabled={isLoading || isBasic}
                className={`w-full mt-6 py-3 px-6 rounded-xl font-semibold transition-all ${
                  isBasic
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Ładowanie...
                  </span>
                ) : isBasic && !isPremium ? (
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

          {/* PREMIUM PLAN - €13/month */}
          <div
            className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all cursor-pointer relative ${
              selectedPlan === "premium"
                ? "border-orange-500 ring-4 ring-orange-200"
                : "border-orange-300 hover:border-orange-500"
            } ${isPremium ? "ring-4 ring-orange-200" : ""}`}
            onClick={() => setSelectedPlan("premium")}
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" />
              🔥 POLECANY
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-center text-white">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Crown className="w-6 h-6" />
                Premium
              </h3>
              <div className="mt-4">
                <span className="text-5xl font-bold">€13</span>
                <span className="text-orange-100">/miesiąc</span>
              </div>
              <p className="mt-2 text-sm text-orange-100">
                Pełna widoczność dla pracodawców
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
                  <Eye className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Pełna widoczność</strong> dla pracodawców
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Wyższa pozycja</strong> w wynikach wyszukiwania
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Premium badge</strong> na profilu
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Kontakt</strong> od pracodawców
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Oferty pracy</strong> bezpośrednio
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Powiadomienia email</strong> o nowych ofertach
                  </span>
                </li>
              </ul>

              <button
                onClick={handleSelectPremium}
                disabled={isLoading || isPremium}
                className={`w-full mt-6 py-3 px-6 rounded-xl font-semibold transition-all ${
                  isPremium
                    ? "bg-orange-100 text-orange-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Przekierowanie do płatności...
                  </span>
                ) : isPremium ? (
                  <span className="flex items-center justify-center gap-2">
                    <Crown className="w-5 h-5" />
                    Aktualny plan
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Upgrade do Premium
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ZZP Certificate Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border-2 border-blue-300">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Zdobądź Certyfikat ZZP! 🏆
                </h3>
                <p className="text-gray-700 mb-4">
                  Oficjalny certyfikat ZZP Werkplaats po zdaniu egzaminu
                  praktycznego:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span>
                      <strong>Egzamin praktyczny</strong> w magazynie (wózki
                      widłowe, logistyka)
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span>
                      <strong>Ocena przez właściciela</strong> (umiejętności
                      1-10)
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span>
                      <strong>Oficjalny certyfikat</strong> z unikalnym numerem
                      (ZZP-2025-XXXXX)
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span>
                      <strong>Ważny 7 lat</strong> na Twoim profilu
                    </span>
                  </li>
                </ul>

                <div className="bg-white p-6 rounded-lg border border-blue-300 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">€230</p>
                      <p className="text-sm text-gray-600">(€190 + 21% BTW)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Jednorazowa opłata
                      </p>
                    </div>
                  </div>
                  {hasCertificate && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-700 font-medium flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Masz już certyfikat:{" "}
                        {workerData?.zzp_certificate_number}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate("/worker/zzp-exam-application")}
                  disabled={!!hasCertificate}
                  className={`w-full px-8 py-4 rounded-xl font-bold transition-all ${
                    hasCertificate
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                  }`}
                >
                  {hasCertificate ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Certyfikat aktywny
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Zgłoś się na egzamin ZZP
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </button>
              </div>
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
            <strong>Uwaga:</strong> Certyfikat ZZP (€230) NIE jest wliczony w
            subskrypcję Premium. To oddzielna opłata za egzamin praktyczny.
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

export default WorkerSubscriptionPage;
