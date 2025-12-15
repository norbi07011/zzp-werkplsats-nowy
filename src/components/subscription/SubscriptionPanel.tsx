/**
 * SUBSCRIPTION PANEL - Worker Dashboard
 * Wyświetla status subskrypcji, historię płatności i upgrade CTA
 *
 * NAPRAWIONE: Pobiera RZECZYWISTE dane z Supabase (nie MOCK!)
 */

import React, { useState, useEffect } from "react";
import {
  Crown,
  User,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { SubscriptionBadge } from "../SubscriptionBadge";
import { CheckoutButton } from "../payment/CheckoutButton";
import { supabase } from "../../lib/supabase";
import type {
  WorkerSubscription,
  SubscriptionPayment,
  SubscriptionTier,
} from "../../types/subscription";

interface SubscriptionPanelProps {
  workerId: string;
  onUpgradeClick?: () => void;
}

export function SubscriptionPanel({
  workerId,
  onUpgradeClick,
}: SubscriptionPanelProps) {
  const [subscription, setSubscription] = useState<WorkerSubscription | null>(
    null
  );
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // FIXED: Fetch REAL data from Supabase (not MOCK!)
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!workerId) {
        console.log("[SubscriptionPanel] No workerId provided");
        setLoading(false);
        return;
      }

      console.log("[SubscriptionPanel] Fetching data for workerId:", workerId);

      try {
        // 1. Fetch worker subscription data from database
        // workerId może być profile_id lub worker id, próbujemy obu
        let workerData = null;
        let error = null;

        // Najpierw spróbuj przez profile_id (UUID z auth)
        const { data: byProfileId, error: err1 } = await supabase
          .from("workers")
          .select(
            `
            id,
            subscription_tier,
            subscription_status,
            subscription_start_date,
            subscription_end_date,
            stripe_customer_id,
            stripe_subscription_id,
            zzp_certificate_issued,
            zzp_certificate_number
          `
          )
          .eq("profile_id", workerId)
          .single();

        if (byProfileId) {
          workerData = byProfileId;
          console.log("[SubscriptionPanel] Found by profile_id:", workerData);
        } else {
          // Jeśli nie znaleziono, spróbuj przez worker id
          const { data: byWorkerId, error: err2 } = await supabase
            .from("workers")
            .select(
              `
              id,
              subscription_tier,
              subscription_status,
              subscription_start_date,
              subscription_end_date,
              stripe_customer_id,
              stripe_subscription_id,
              zzp_certificate_issued,
              zzp_certificate_number
            `
            )
            .eq("id", workerId)
            .single();

          if (byWorkerId) {
            workerData = byWorkerId;
            console.log("[SubscriptionPanel] Found by id:", workerData);
          } else {
            error = err2 || err1;
          }
        }

        if (error) {
          console.error("[SubscriptionPanel] Error fetching worker:", error);
          setLoading(false);
          return;
        }

        if (!workerData) {
          console.log("[SubscriptionPanel] No worker data found");
          setLoading(false);
          return;
        }

        // Mapuj dane z bazy na typ WorkerSubscription
        const subscriptionData: Partial<WorkerSubscription> = {
          subscription_tier:
            (workerData.subscription_tier as SubscriptionTier) || "basic",
          subscription_status: workerData.subscription_status || "active",
          subscription_start_date: workerData.subscription_start_date,
          subscription_end_date: workerData.subscription_end_date,
          stripe_customer_id: workerData.stripe_customer_id,
          stripe_subscription_id: workerData.stripe_subscription_id,
          zzp_certificate_issued: workerData.zzp_certificate_issued || false,
          zzp_certificate_number: workerData.zzp_certificate_number,
        };

        console.log("[SubscriptionPanel] Subscription data:", subscriptionData);
        setSubscription(subscriptionData as WorkerSubscription);

        // 2. Fetch payment history
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("worker_id", workerData.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (paymentsError) {
          console.error(
            "[SubscriptionPanel] Error fetching payments:",
            paymentsError
          );
        } else {
          console.log("[SubscriptionPanel] Payments:", paymentsData);
          setPayments((paymentsData as SubscriptionPayment[]) || []);
        }
      } catch (err) {
        console.error("[SubscriptionPanel] Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [workerId]);

  const handleCancelSubscription = async () => {
    // TODO: Implement cancel logic with subscriptions.ts
    alert("Anulowanie subskrypcji - funkcjonalność będzie dostępna wkrótce");
    setShowCancelModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nie znaleziono subskrypcji</p>
        </div>
      </div>
    );
  }

  const isBasic = subscription.subscription_tier === "basic";
  const isPremium = subscription.subscription_tier === "premium";
  const isActive = subscription.subscription_status === "active";

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with gradient */}
        <div
          className={`p-6 ${
            isPremium
              ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
              : "bg-gradient-to-r from-blue-500 to-blue-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isPremium ? (
                <Crown className="w-12 h-12 text-yellow-950" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
              <div>
                <h2
                  className={`text-2xl font-bold ${
                    isPremium ? "text-yellow-950" : "text-white"
                  }`}
                >
                  {isPremium ? "Premium Member" : "Basic Member"}
                </h2>
                <p
                  className={`text-sm ${
                    isPremium ? "text-yellow-900" : "text-blue-100"
                  }`}
                >
                  {isActive ? "✓ Aktywna subskrypcja" : "✗ Nieaktywna"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-3xl font-bold ${
                  isPremium ? "text-yellow-950" : "text-white"
                }`}
              >
                €13<span className="text-lg">/miesiąc</span>
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Start Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Data rozpoczęcia</p>
                <p className="font-semibold text-gray-900">
                  {subscription.subscription_start_date
                    ? new Date(
                        subscription.subscription_start_date
                      ).toLocaleDateString("pl-PL")
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Renewal Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Następne odnowienie</p>
                <p className="font-semibold text-gray-900">
                  {subscription.subscription_end_date
                    ? new Date(
                        subscription.subscription_end_date
                      ).toLocaleDateString("pl-PL")
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Metoda płatności</p>
                <p className="font-semibold text-gray-900">Karta •••• 4242</p>
              </div>
            </div>
          </div>

          {/* Note: Certificate is NOT included in Premium subscription */}
          {isPremium && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">
                    Je hebt Premium abonnement (€13/maand)
                  </p>
                  <p className="text-sm text-blue-700">
                    Voor ZZP Certificaat, zie onderstaande sectie "Haal je ZZP
                    Certificaat" (€230).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj subskrypcję
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade CTA for Basic Users - PREMIUM SUBSCRIPTION (NOT CERTIFICATE!) */}
      {isBasic && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-lg p-8 border-2 border-yellow-200">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Upgrade naar Premium Abonnement! 🚀
              </h3>
              <p className="text-gray-700 mb-4">
                Krijg meer zichtbaarheid en hogere prioriteit in zoekresultaten:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>
                    <strong>Hogere positie</strong> in werkgever zoekopdrachten
                  </span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>
                    <strong>Premium badge</strong> op je profiel
                  </span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>
                    <strong>Eerste resultaten</strong> in werkgever zoekacties
                  </span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>
                    <strong>Meer contacten</strong> van werkgevers
                  </span>
                </li>
              </ul>
              <div className="bg-white p-4 rounded-lg border border-yellow-300 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Let op:</strong> Premium abonnement geeft GEEN
                  certificaat. Voor ZZP Certificaat, zie onderstaande sectie
                  "Haal je ZZP Certificaat".
                </p>
              </div>
              <CheckoutButton
                userId={workerId}
                currentTier={subscription.subscription_tier}
                className="px-8 py-4"
              />
            </div>
          </div>
        </div>
      )}

      {/* ZZP EXAM & CERTIFICATION - SEPARATE SECTION (€230) */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 border-2 border-blue-300">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Haal je ZZP Certificaat! 🏆
            </h3>
            <p className="text-gray-700 mb-4">
              Officieel ZZP Werkplaats Certificaat na fysiek examen op locatie:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>
                  <strong>Fysiek examen</strong> in magazijn (vorklifts,
                  logistiek, kwaliteit)
                </span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>
                  <strong>Beoordeling door eigenaar</strong> (praktische
                  vaardigheden 1-10)
                </span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>
                  <strong>Officieel certificaat</strong> met uniek nummer
                  (ZZP-2025-00XXX)
                </span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span>
                  <strong>1 jaar geldig</strong> op je profiel
                </span>
              </li>
            </ul>
            <div className="bg-white p-6 rounded-lg border border-blue-300 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">€230</p>
                  <p className="text-sm text-gray-600">(€190 + 21% BTW)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Eenmalige betaling</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Inclusief: examenafspraak, praktische test in magazijn,
                beoordeling, en certificaat (geldig 7 jaar).
              </p>
            </div>
            <button
              onClick={() => {
                // Navigate to ZZP Exam Application Form via parent callback
                if (onUpgradeClick) {
                  onUpgradeClick();
                } else {
                  // Fallback: try to navigate directly
                  window.location.href = "/worker/zzp-exam-application";
                }
              }}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Aanmelden voor ZZP Examen →
            </button>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            Historia płatności
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Okres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kwota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faktura
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.payment_date).toLocaleDateString("pl-PL")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(payment.period_start).toLocaleDateString(
                      "pl-PL",
                      { month: "short", year: "numeric" }
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    €{payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.status === "completed" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        Opłacono
                      </span>
                    )}
                    {payment.status === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertCircle className="w-3 h-3" />
                        Oczekuje
                      </span>
                    )}
                    {payment.status === "failed" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        Niepowodzenie
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.stripe_invoice_id && (
                      <a
                        href="#"
                        className="text-orange-600 hover:text-orange-800 font-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          alert(
                            "Pobieranie faktury - funkcjonalność będzie dostępna wkrótce"
                          );
                        }}
                      >
                        Pobierz PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Brak historii płatności
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Anulować subskrypcję?
            </h3>
            <p className="text-gray-600 mb-6">
              Czy na pewno chcesz anulować swoją subskrypcję? Stracisz dostęp
              do:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-gray-700">
                <XCircle className="w-5 h-5 text-red-500" />
                Widoczności w wyszukiwarkach
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <XCircle className="w-5 h-5 text-red-500" />
                Możliwości aplikowania na oferty
              </li>
              {isPremium && (
                <li className="flex items-center gap-2 text-gray-700">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Statusu Premium i certyfikatu
                </li>
              )}
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Nie, zostań
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Tak, anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
