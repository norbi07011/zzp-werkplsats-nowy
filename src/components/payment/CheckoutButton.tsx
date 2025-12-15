/**
 * Checkout Button Component
 * Handles upgrade to Premium subscription
 */

import React, { useState } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { handleUpgradeToPremium } from '../../services/stripe';
import { isStripeConfigured } from '../../config/stripe';

interface CheckoutButtonProps {
  userId: string;
  currentTier?: 'basic' | 'premium';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  userId,
  currentTier = 'basic',
  className = '',
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyPremium = currentTier === 'premium';
  const isConfigured = isStripeConfigured();

  const handleClick = async () => {
    if (isAlreadyPremium) {
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
      await handleUpgradeToPremium(userId);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er is iets misgegaan';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  if (isAlreadyPremium) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-success text-white font-medium ${className}`}
      >
        <CheckCircle className="w-5 h-5" />
        Premium Actief
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
          bg-gradient-premium text-white font-medium
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
            <TrendingUp className="w-5 h-5" />
            Upgrade naar Premium Abonnement - €13/maand
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
