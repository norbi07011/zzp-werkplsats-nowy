/**
 * WORKER SUBSCRIPTION SELECTION PAGE
 * Wybór planu po rejestracji:
 * - Basic (€0) - brak widoczności dla pracodawców
 * - Premium (€13/miesiąc) - pełna widoczność + dostęp do ofert
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { CheckCircle, XCircle, Crown, ArrowRight, Loader2 } from "lucide-react";
import { STRIPE_CONFIG } from "../../src/config/stripe";
import { handleUpgradeToPremium } from "../../src/services/stripe";

export const WorkerSubscriptionSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectBasic = () => {
    // Basic = gratis, kontynuuj bez płatności
    setIsLoading(true);

    // TODO: Update worker_profiles.subscription_tier = 'basic', subscription_status = 'active'
    // For now, just redirect
    setTimeout(() => {
      navigate("/worker");
    }, 1000);
  };

  const handleSelectPremium = async () => {
    if (!user) {
      setError("Użytkownik nie jest zalogowany");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Redirect to Stripe Checkout for €13/month Premium subscription
      await handleUpgradeToPremium(user.id);
      // User will be redirected to Stripe, then back to /payment-success
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Płatność nie powiodła się"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kies je plan 🎯
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Registratie voltooid! Kies nu het plan dat bij je past.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 max-w-3xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg mb-2">
                Hoe werkt het?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Basic (€0):</strong> Je kunt gratis registreren en
                    je profiel invullen, maar werkgevers zien je NIET in
                    zoekresultaten. Geen zichtbaarheid = geen contacten.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Premium (€13/maand):</strong> Je profiel wordt
                    zichtbaar voor werkgevers, je krijgt hogere positie in
                    zoekopdrachten, en je kunt opdrachten ontvangen.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Je kunt altijd upgraden!</strong> Start met Basic en
                    upgrade later naar Premium wanneer je klaar bent.
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
                ? "border-orange-500 ring-4 ring-orange-200"
                : "border-gray-200 hover:border-orange-300"
            }`}
            onClick={() => setSelectedPlan("basic")}
          >
            <div className="bg-gray-100 p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900">Basic</h3>
              <div className="mt-4">
                <span className="text-5xl font-bold text-gray-900">€0</span>
                <span className="text-gray-600">/maand</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">100% gratis, altijd</p>
            </div>

            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Profiel aanmaken en beheren
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    ZZP Certificaat aanvragen (€230)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Platform verkennen</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Zichtbaar voor werkgevers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Werkgevers zien je profiel NIET
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Contact van werkgevers ontvangen
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-500 line-through">
                    Opdrachten ontvangen
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
                    Bezig...
                  </>
                ) : (
                  <>
                    Start met Basic
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
                ? "border-orange-500 ring-4 ring-orange-200"
                : "border-orange-300 hover:border-orange-500"
            }`}
            onClick={() => setSelectedPlan("premium")}
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              🔥 AANBEVOLEN
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-center text-white">
              <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Crown className="w-6 h-6" />
                Premium
              </h3>
              <div className="mt-4">
                <span className="text-5xl font-bold">€13</span>
                <span className="text-orange-100">/maand</span>
              </div>
              <p className="mt-2 text-sm text-orange-100">
                Volledige zichtbaarheid
              </p>
            </div>

            <div className="p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-semibold">
                    Alles van Basic +
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Volledig zichtbaar</strong> voor werkgevers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Hogere positie</strong> in zoekresultaten
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Premium badge</strong> op je profiel
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Ontvang contactverzoeken</strong> van werkgevers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>Direct opdrachten ontvangen</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <strong>E-mail notificaties</strong> bij nieuwe opdrachten
                  </span>
                </li>
              </ul>

              <button
                onClick={handleSelectPremium}
                disabled={isLoading && selectedPlan === "premium"}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-yellow-600 transition transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && selectedPlan === "premium" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Doorsturen naar betaling...
                  </>
                ) : (
                  <>
                    Upgrade naar Premium
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
            ❓ Veelgestelde vragen
          </h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold">
                Kan ik later upgraden naar Premium?
              </p>
              <p className="text-gray-600">
                Ja! Je kunt altijd upgraden via je dashboard. Je betaalt dan
                vanaf dat moment €13/maand.
              </p>
            </div>
            <div>
              <p className="font-semibold">Kan ik Premium opzeggen?</p>
              <p className="text-gray-600">
                Ja, je kunt je Premium abonnement op elk moment opzeggen. Je
                profiel blijft dan beschikbaar maar wordt niet meer zichtbaar
                voor werkgevers.
              </p>
            </div>
            <div>
              <p className="font-semibold">Wat gebeurt er als ik Basic kies?</p>
              <p className="text-gray-600">
                Je krijgt toegang tot het platform en kunt je profiel invullen,
                maar werkgevers zien je NIET in hun zoekresultaten. Je ontvangt
                geen opdrachten tot je upgrade naar Premium.
              </p>
            </div>
            <div>
              <p className="font-semibold">
                Is het ZZP Certificaat (€230) inbegrepen?
              </p>
              <p className="text-gray-600">
                Nee, het ZZP Certificaat is een aparte betaling van €230 (€190 +
                BTW). Dit certificaat krijg je na een fysiek examen op locatie.
              </p>
            </div>
          </div>
        </div>

        {/* Skip for now */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/worker")}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            Ik beslis later, ga naar dashboard →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerSubscriptionSelectionPage;
