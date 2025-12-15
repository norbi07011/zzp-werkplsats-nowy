/**
 * SUBSCRIPTION PANEL - Regular User Dashboard
 * Wyświetla plan Premium (€9.99/mies), historię płatności i upgrade CTA
 */

import React, { useState, useEffect } from "react";
import { Crown, CreditCard, CheckCircle } from "lucide-react";
import { ClockIcon, StarIcon, MessageSquare, Search } from "./icons";
import { supabase } from "../src/lib/supabase";
import { toast } from "sonner";

interface RegularUserSubscriptionPanelProps {
  userId: string;
  isPremium: boolean;
  premiumUntil: string | null;
  onUpgradeClick?: () => void;
}

export function RegularUserSubscriptionPanel({
  userId,
  isPremium,
  premiumUntil,
  onUpgradeClick,
}: RegularUserSubscriptionPanelProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentHistory();
    fetchStripeCustomerId();
  }, [userId]);

  const fetchPaymentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("profile_id", userId)
        .in("payment_type", ["regular_user_subscription"]) // ← Filter only regular user subscription payments
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("[SUBSCRIPTION] Error fetching payments:", error);
      } else {
        setPayments(data || []);
      }
    } catch (err) {
      console.error("[SUBSCRIPTION] Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStripeCustomerId = async () => {
    try {
      const { data, error } = await supabase
        .from("regular_users")
        .select("stripe_customer_id")
        .eq("profile_id", userId)
        .single();

      if (error) {
        console.error(
          "[SUBSCRIPTION] Error fetching stripe_customer_id:",
          error
        );
      } else {
        setStripeCustomerId(data?.stripe_customer_id || null);
      }
    } catch (err) {
      console.error(
        "[SUBSCRIPTION] Unexpected error fetching customer ID:",
        err
      );
    }
  };

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      toast.error(
        "Nie znaleziono ID klienta Stripe. Skontaktuj się z supportem."
      );
      return;
    }

    setPortalLoading(true);
    try {
      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Musisz być zalogowany aby zarządzać subskrypcją");
        return;
      }

      const returnUrl = `${window.location.origin}/regular-user/dashboard`;

      const response = await fetch(
        `${functionsUrl}/create-customer-portal-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            customerId: stripeCustomerId,
            returnUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[SUBSCRIPTION] Portal error:", errorData);
        toast.error(
          errorData.message || "Nie udało się otworzyć portalu zarządzania"
        );
        return;
      }

      const { url } = await response.json();

      if (!url) {
        toast.error("Nie otrzymano URL portalu");
        return;
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (err) {
      console.error("[SUBSCRIPTION] Error opening portal:", err);
      toast.error("Wystąpił błąd podczas otwierania portalu zarządzania");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return 0;
    const endDate = new Date(dateString);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      toast.info("Funkcja płatności będzie wkrótce dostępna!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {isPremium ? "🎉 Premium Aktywny" : "⭐ Upgrade do Premium"}
            </h2>
            <p className="text-purple-100 text-lg">
              {isPremium && premiumUntil ? (
                <>
                  Odnowienie: {formatDate(premiumUntil)} (
                  {getDaysRemaining(premiumUntil)} dni)
                </>
              ) : (
                "Odblokuj wszystkie funkcje za €9.99/miesiąc"
              )}
            </p>
          </div>
          <Crown className="w-16 h-16 text-yellow-300" />
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Aktualny Plan
        </h3>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {isPremium ? "Premium" : "Free"}
            </p>
            <p className="text-gray-600">
              {isPremium ? "€9.99/miesiąc" : "0 zł"}
            </p>
          </div>
          {isPremium ? (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
              ✓ Aktywny
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full font-medium">
              Darmowy
            </div>
          )}
        </div>

        {/* Premium Subscription Details */}
        {isPremium && premiumUntil && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <ClockIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900">Aktywna</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 rounded-full p-2">
                  <ClockIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Następne odnowienie</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(premiumUntil)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>Płatność automatyczna przez Stripe</span>
            </div>
          </div>
        )}

        {!isPremium && (
          <button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            Przejdź na Premium
          </button>
        )}

        {isPremium && (
          <div className="space-y-3">
            <button
              disabled
              className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
            >
              ✓ Subskrypcja Aktywna
            </button>
            <p className="text-sm text-gray-600 text-center">
              Twoja subskrypcja odnowi się automatycznie{" "}
              {formatDate(premiumUntil)}
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading || !stripeCustomerId}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {portalLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Otwieranie portalu...</span>
                </>
              ) : stripeCustomerId ? (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Zarządzaj subskrypcją</span>
                </>
              ) : (
                <>
                  <span>⚠️</span>
                  <span>Brak ID klienta Stripe</span>
                </>
              )}
            </button>
            {!stripeCustomerId && (
              <p className="text-xs text-red-600 text-center">
                Skontaktuj się z supportem w celu aktywacji portalu zarządzania
              </p>
            )}
          </div>
        )}
      </div>

      {/* Premium Benefits */}
      {!isPremium && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Co zyskujesz z Premium?
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Nielimitowane zlecenia
                </h4>
                <p className="text-sm text-gray-600">
                  Dodawaj dowolną liczbę zleceń miesięcznie (Free: 3/miesiąc)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Wyszukiwarka ekspertów
                </h4>
                <p className="text-sm text-gray-600">
                  Znajdź workerów, księgowych, pracodawców i firmy sprzątające
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  System wiadomości
                </h4>
                <p className="text-sm text-gray-600">
                  Pisz bezpośrednio z ekspertami przez platformę
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <StarIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Priorytet w listingu
                </h4>
                <p className="text-sm text-gray-600">
                  Twoje zlecenia wyświetlane na górze wyników
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <p className="text-center text-purple-900 font-medium">
              🎁 Tylko <span className="text-2xl font-bold">€9.99/miesiąc</span>
            </p>
            <p className="text-center text-purple-700 text-sm mt-1">
              Anuluj w każdej chwili, bez ukrytych opłat
            </p>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Historia płatności
          </h3>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {payment.description || "Płatność Premium"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    €{payment.amount}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      payment.status === "completed"
                        ? "text-green-600"
                        : payment.status === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {payment.status === "completed"
                      ? "✓ Opłacone"
                      : payment.status === "pending"
                      ? "⏳ Oczekuje"
                      : "✗ Błąd"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Często zadawane pytania
        </h3>
        <div className="space-y-4">
          <details className="group">
            <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
              <span>Jak anulować subskrypcję?</span>
              <span className="transition group-open:rotate-180">▼</span>
            </summary>
            <p className="mt-2 text-sm text-gray-600 pl-4">
              Możesz anulować subskrypcję w każdej chwili. Po anulowaniu
              będziesz mieć dostęp do funkcji Premium do końca opłaconego
              okresu.
            </p>
          </details>

          <details className="group">
            <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
              <span>Czy płatność jest bezpieczna?</span>
              <span className="transition group-open:rotate-180">▼</span>
            </summary>
            <p className="mt-2 text-sm text-gray-600 pl-4">
              Tak! Wszystkie płatności są przetwarzane przez Stripe - wiodący
              system płatności online. Nie przechowujemy danych Twojej karty.
            </p>
          </details>

          <details className="group">
            <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
              <span>Co się stanie po anulowaniu?</span>
              <span className="transition group-open:rotate-180">▼</span>
            </summary>
            <p className="mt-2 text-sm text-gray-600 pl-4">
              Po wygaśnięciu Premium Twoje konto przejdzie na plan Free z
              limitem 3 zleceń/miesiąc. Istniejące zlecenia pozostaną aktywne.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
