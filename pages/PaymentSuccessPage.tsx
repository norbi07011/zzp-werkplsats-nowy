/**
 * PAYMENT SUCCESS PAGE
 * Wyświetla po udanej płatności Stripe i przekierowuje na właściwy panel
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  console.log("[PaymentSuccess] 🚀 COMPONENT RENDERED");

  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  console.log("[PaymentSuccess] 🔍 URL Params:", {
    session_id: searchParams.get("session_id"),
    user_type: searchParams.get("user_type"),
  });
  console.log("[PaymentSuccess] 👤 Auth state:", {
    user: user?.email,
    authLoading,
  });

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "no-session"
  >("loading");
  const [userType, setUserType] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [waitingForAuth, setWaitingForAuth] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  // Czekaj na załadowanie auth - CRITICAL: Force session refresh after Stripe redirect
  useEffect(() => {
    console.log(
      "[PaymentSuccess] ⚙️ useEffect #1 triggered (session recovery)"
    );

    const recoverSession = async () => {
      console.log("[PaymentSuccess] Starting session recovery...", {
        authLoading,
        hasUser: !!user,
      });

      // KROK 1: Wymuś odświeżenie sesji z Supabase
      try {
        // Spróbuj odświeżyć sesję (może token wygasł podczas płatności)
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();
        console.log("[PaymentSuccess] Session refresh result:", {
          hasSession: !!refreshData?.session,
          error: refreshError?.message,
        });

        if (refreshData?.session) {
          // Sesja odświeżona pomyślnie - poczekaj chwilę na AuthContext
          console.log("[PaymentSuccess] Session refreshed successfully!");
          setTimeout(() => setWaitingForAuth(false), 500);
          return;
        }
      } catch (err) {
        console.log("[PaymentSuccess] Refresh failed, trying getSession...");
      }

      // KROK 2: Sprawdź czy sesja istnieje w storage
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("[PaymentSuccess] getSession result:", {
        hasSession: !!session,
        userId: session?.user?.id,
      });

      if (session) {
        // Sesja istnieje - poczekaj na AuthContext
        setTimeout(() => setWaitingForAuth(false), 500);
        return;
      }

      // KROK 3: Brak sesji - użytkownik musi się ponownie zalogować
      // Ale płatność się udała (mamy user_type z URL)
      console.log(
        "[PaymentSuccess] No session found - payment succeeded but user must re-login"
      );
      setWaitingForAuth(false);
    };

    if (!authLoading) {
      if (user) {
        // User już jest - nie trzeba nic robić
        console.log("[PaymentSuccess] User already loaded:", user.email);
        setWaitingForAuth(false);
      } else {
        // Brak user - spróbuj odzyskać sesję
        recoverSession();
      }
    }
  }, [authLoading, user]);

  useEffect(() => {
    console.log("[PaymentSuccess] ⚙️ useEffect #2 triggered (verify payment)");
    console.log("[PaymentSuccess] waitingForAuth:", waitingForAuth);

    if (waitingForAuth) return; // Poczekaj na auth

    const verifyPaymentAndRedirect = async () => {
      // Sprawdź sesję bezpośrednio z Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Pobierz user_type z URL (ustawiony przez Stripe)
      const urlUserType = searchParams.get("user_type");

      if (!session && !user) {
        // ⚠️ BRAK SESJI - płatność się udała, ale sesja wygasła/zgubiła się
        // Użytkownik musi się ponownie zalogować
        console.log("[PaymentSuccess] NO SESSION - showing re-login prompt");
        if (urlUserType) {
          setUserType(urlUserType);
          setHasValidSession(false);
          setStatus("no-session"); // Specjalny status - sukces ale bez sesji
          return;
        }
        // Brak user_type - przekieruj na login
        navigate("/login");
        return;
      }

      // ✅ MAMY SESJĘ
      setHasValidSession(true);

      const userId = user?.id || session?.user?.id;
      if (!userId) {
        // Fallback na URL user_type
        if (urlUserType) {
          setUserType(urlUserType);
          setStatus("success");
          return;
        }
        navigate("/login");
        return;
      }

      try {
        // Sprawdź typ użytkownika
        // Sprawdź czy to cleaning_company
        const { data: cleaningCompany } = await supabase
          .from("cleaning_companies")
          .select("id, subscription_tier, subscription_status")
          .eq("profile_id", userId)
          .single();

        if (cleaningCompany) {
          setUserType("cleaning_company");

          // Aktualizuj status subskrypcji (webhook może to też zrobić, ale dla pewności)
          await supabase
            .from("cleaning_companies")
            .update({
              subscription_tier: "premium",
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("profile_id", userId);

          setStatus("success");
          return;
        }

        // Sprawdź czy to worker
        const { data: worker } = await supabase
          .from("workers")
          .select("id, subscription_tier, subscription_status")
          .eq("profile_id", userId)
          .single();

        if (worker) {
          setUserType("worker");

          // Aktualizuj status subskrypcji
          await supabase
            .from("workers")
            .update({
              subscription_tier: "premium",
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("profile_id", userId);

          setStatus("success");
          return;
        }

        // Sprawdź czy to employer
        const { data: employer } = await supabase
          .from("employers")
          .select("id, subscription_tier, subscription_status")
          .eq("profile_id", userId)
          .single();

        if (employer) {
          setUserType("employer");
          setStatus("success");
          return;
        }

        // Sprawdź czy to regular_user
        const { data: regularUser, error: regularUserError } = await supabase
          .from("regular_users")
          .select("id, is_premium, subscription_end_date")
          .eq("profile_id", userId)
          .maybeSingle();

        if (regularUser) {
          setUserType("regular_user");

          // Get session_id from URL params
          const sessionId = searchParams.get("session_id");

          // Aktualizuj status Premium dla Regular User
          const subscriptionEndDate = new Date();
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // +30 dni
          const now = new Date().toISOString();

          // 1. Update regular_users table
          await supabase
            .from("regular_users")
            .update({
              is_premium: true,
              subscription_end_date: subscriptionEndDate.toISOString(),
              subscription_status: "active",
              subscription_start_date: now,
              last_payment_date: now,
              updated_at: now,
            })
            .eq("profile_id", userId);

          // 2. If we have session_id, get Stripe customer_id and subscription_id
          if (sessionId) {
            try {
              const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
              const {
                data: { session },
              } = await supabase.auth.getSession();

              const response = await fetch(`${functionsUrl}/get-stripe-ids`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                  sessionId,
                  userType: "regular_user",
                }),
              });

              if (response.ok) {
                console.log("[PaymentSuccess] Stripe IDs saved successfully");
              }
            } catch (err) {
              console.error("[PaymentSuccess] Error saving Stripe IDs:", err);
              // Don't fail the whole process if this fails
            }
          }

          // 3. Insert payment record for history tracking
          await supabase.from("payments").insert({
            user_id: userId,
            profile_id: userId,
            payment_type: "regular_user_subscription",
            amount: 9.99,
            currency: "EUR",
            status: "completed",
            description: "Regular User Premium - Monthly Subscription",
            payment_date: now,
            completed_at: now,
            metadata: {
              subscription_tier: "premium",
              duration: "1_month",
              auto_created: true,
            },
          });

          setStatus("success");
          return;
        }

        // Fallback - nie znaleziono profilu, ale płatność się udała
        // Przekieruj na stronę główną po zalogowaniu
        console.log("No profile found, defaulting to worker");
        setUserType("worker");
        setStatus("success");
      } catch (err) {
        console.error("Error verifying payment:", err);
        // Nawet przy błędzie, spróbuj przekierować
        setUserType("worker");
        setStatus("success");
      }
    };

    verifyPaymentAndRedirect();
  }, [waitingForAuth, user, navigate]);

  // Countdown i automatyczne przekierowanie
  useEffect(() => {
    if ((status === "success" || status === "no-session") && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if ((status === "success" || status === "no-session") && countdown === 0) {
      if (hasValidSession) {
        // ✅ Mamy sesję - przekieruj na panel
        const redirectPath = getRedirectPath();
        window.location.href = redirectPath;
      } else {
        // ⚠️ Brak sesji - przekieruj na login z parametrem success
        window.location.href = `/login?payment_success=true&user_type=${userType}`;
      }
    }
  }, [status, countdown, userType, hasValidSession]);

  const getRedirectPath = () => {
    switch (userType) {
      case "cleaning_company":
        return "/cleaning-company";
      case "employer":
        return "/employer";
      case "regular_user":
        return "/regular-user?tab=subscription";
      case "worker":
      default:
        return "/worker";
    }
  };

  const getUserTypeName = () => {
    switch (userType) {
      case "cleaning_company":
        return "firmy sprzątającej";
      case "employer":
        return "pracodawcy";
      case "regular_user":
        return "użytkownika";
      case "worker":
      default:
        return "pracownika";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-green-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Weryfikacja płatności...
          </h2>
          <p className="text-gray-600">
            Proszę czekać, sprawdzamy status Twojej transakcji
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Wystąpił problem
          </h2>
          <p className="text-gray-600 mb-6">
            Nie mogliśmy zweryfikować Twojej płatności. Jeśli środki zostały
            pobrane, skontaktuj się z naszym wsparciem.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Wróć na stronę główną
          </button>
        </div>
      </div>
    );
  }

  // Status no-session: płatność OK ale sesja wygasła
  if (status === "no-session") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header - nadal sukces */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Płatność zakończona!</h1>
              <p className="text-green-100">
                Twoja subskrypcja Premium została aktywowana
              </p>
            </div>

            {/* Content - informacja o ponownym logowaniu */}
            <div className="p-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full">
                  <Crown className="w-5 h-5" />
                  <span className="font-bold">Premium Member</span>
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <h3 className="font-bold text-amber-800 mb-2">
                      Wymagane ponowne logowanie
                    </h3>
                    <p className="text-amber-700 text-sm">
                      Z powodów bezpieczeństwa sesja wygasła podczas
                      przetwarzania płatności. Zaloguj się ponownie, aby uzyskać
                      dostęp do panelu Premium.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Przekierowanie do strony logowania za{" "}
                  <span className="font-bold text-green-600">{countdown}</span>{" "}
                  sekund...
                </p>
                <button
                  onClick={() => {
                    window.location.href = `/login?payment_success=true&user_type=${userType}`;
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition shadow-lg"
                >
                  Zaloguj się teraz →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Płatność zakończona!</h1>
            <p className="text-green-100">
              Twoja subskrypcja Premium jest aktywna
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Premium Badge */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full">
                <Crown className="w-5 h-5" />
                <span className="font-bold">Premium Member</span>
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-4 text-center">
                Teraz masz dostęp do:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    Pełna widoczność dla pracodawców
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    Wyższa pozycja w wyszukiwaniach
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    Badge Premium na profilu
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">
                    Dostęp do wszystkich funkcji
                  </span>
                </li>
              </ul>
            </div>

            {/* Redirect Info */}
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Przekierowanie do panelu {getUserTypeName()} za{" "}
                <span className="font-bold text-green-600">{countdown}</span>{" "}
                sekund...
              </p>
              <button
                onClick={() => {
                  // Użyj window.location.href żeby wymusić pełne przeładowanie
                  window.location.href = getRedirectPath();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition shadow-lg"
              >
                Przejdź do panelu teraz →
              </button>
            </div>
          </div>
        </div>

        {/* Session ID (debug info) */}
        {searchParams.get("session_id") && (
          <p className="text-center text-gray-400 text-xs mt-4">
            ID sesji: {searchParams.get("session_id")?.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
