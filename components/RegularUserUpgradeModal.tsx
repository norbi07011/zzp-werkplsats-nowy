/**
 * UPGRADE MODAL - Regular User Premium
 * Modal z checkoutem Stripe dla Regular User (€9.99/mies)
 */

import React, { useState } from "react";
import { Crown } from "lucide-react";
import { XMarkIcon, CheckIcon } from "./icons";
import { handleRegularUserUpgradeToPremium } from "../src/services/stripe";
import { toast } from "sonner";

interface RegularUserUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isPremium?: boolean;
  premiumUntil?: string | null;
}

export function RegularUserUpgradeModal({
  isOpen,
  onClose,
  userId,
  isPremium = false,
  premiumUntil = null,
}: RegularUserUpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (isPremium) {
      toast.info("Masz już aktywną subskrypcję Premium!");
      return;
    }

    setLoading(true);
    try {
      await handleRegularUserUpgradeToPremium(userId);
      toast.success("🚀 Przekierowanie do płatności...");
      // User zostanie przekierowany do Stripe Checkout
    } catch (error) {
      console.error("[UPGRADE MODAL] Error:", error);
      toast.error(
        "❌ Nie udało się uruchomić płatności. Sprawdź konfigurację Stripe."
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-8 rounded-t-2xl text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-10 h-10 text-yellow-300" />
            <h2 className="text-3xl font-bold">Przejdź na Premium</h2>
          </div>
          <p className="text-purple-100 text-lg">
            Odblokuj wszystkie funkcje platformy
          </p>
        </div>

        {/* Pricing */}
        <div className="p-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-200">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Miesięczna subskrypcja</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-purple-600">
                  €9.99
                </span>
                <span className="text-xl text-gray-500">/miesiąc</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Anuluj w każdej chwili
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">
              Co zyskujesz z Premium:
            </h3>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-1 mt-0.5">
                <CheckIcon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Nielimitowane zlecenia
                </p>
                <p className="text-sm text-gray-600">
                  Dodawaj dowolną liczbę zleceń (Free: 3/miesiąc)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-1 mt-0.5">
                <CheckIcon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Wyszukiwarka ekspertów
                </p>
                <p className="text-sm text-gray-600">
                  Znajdź najlepszych workerów, księgowych, pracodawców i firmy
                  sprzątające
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-1 mt-0.5">
                <CheckIcon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">System wiadomości</p>
                <p className="text-sm text-gray-600">
                  Pisz bezpośrednio z ekspertami przez naszą platformę
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-1 mt-0.5">
                <CheckIcon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Priorytet w listingu
                </p>
                <p className="text-sm text-gray-600">
                  Twoje zlecenia wyświetlane na górze wyników wyszukiwania
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={loading || isPremium}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isPremium ? (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Subskrypcja już aktywna
                </>
              ) : loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Przekierowanie do płatności...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Aktywuj Premium za €9.99/mies
                </>
              )}
            </button>

            {isPremium && premiumUntil && (
              <p className="text-sm text-gray-600 text-center">
                Twoja subskrypcja odnowi się automatycznie{" "}
                {new Date(premiumUntil).toLocaleDateString("pl-PL")}
              </p>
            )}

            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Może później
            </button>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center mt-6">
            💳 Bezpieczne płatności przez Stripe
            <br />
            🔒 Możesz anulować subskrypcję w każdej chwili
          </p>
        </div>
      </div>
    </div>
  );
}
