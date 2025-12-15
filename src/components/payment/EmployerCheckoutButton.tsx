/**
 * Employer Checkout Button Component
 * Handles employer subscription upgrades (Basic/Premium)
 */

import React, { useState } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { handleEmployerSubscription } from '../../services/stripe';
import { isStripeConfigured } from '../../config/stripe';

interface EmployerCheckoutButtonProps {
  employerId: string;
  plan: 'basic' | 'premium';
  currentPlan?: 'basic' | 'premium';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const EmployerCheckoutButton: React.FC<EmployerCheckoutButtonProps> = ({
  employerId,
  plan,
  currentPlan,
  className = '',
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentPlan = currentPlan === plan;
  const isConfigured = isStripeConfigured();

  const planDetails = {
    basic: {
      name: 'Basic',
      price: '€13',
      label: 'Koop Basic - €13/maand'
    },
    premium: {
      name: 'Premium',
      price: '€25',
      label: 'Upgrade do Premium - €25/maand'
    }
  };

  const handleClick = async () => {
    if (isCurrentPlan) {
      return;
    }

    if (!isConfigured) {
      const configError = new Error('Stripe is niet geconfigureerd. Neem contact op met support.');
      setError(configError.message);
      onError?.(configError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await handleEmployerSubscription(employerId, plan);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er is iets misgegaan';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  if (isCurrentPlan) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-500 font-medium cursor-not-allowed ${className}`}
      >
        <CheckCircle className="w-5 h-5" />
        Bieżący plan
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading || !isConfigured}
        className={`
          flex items-center justify-center gap-2 px-6 py-3 rounded-xl
          ${plan === 'premium' 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          }
          font-medium
          hover:shadow-lg hover:scale-105 transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          ${className}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Laden...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {planDetails[plan].label}
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!isConfigured && (
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-400">
            Betalingen zijn momenteel niet beschikbaar. Configureer Stripe om door te gaan.
          </p>
        </div>
      )}
    </div>
  );
};
