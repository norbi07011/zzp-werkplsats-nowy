/**
 * Stripe Configuration
 *
 * IMPORTANT: Before using in production:
 * 1. Create Stripe account at https://stripe.com
 * 2. Add publishable key to .env: VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
 * 3. Add secret key to backend: STRIPE_SECRET_KEY=sk_test_...
 * 4. Create products in Stripe Dashboard
 */

export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",

  // Product IDs (will be created in Stripe Dashboard)
  products: {
    // Worker subscriptions
    workerPremium: {
      priceId: import.meta.env.VITE_STRIPE_PRICE_WORKER_PREMIUM || "",
      amount: 13,
      currency: "eur",
      interval: "month",
      name: "Premium Worker Subscription",
      description:
        "Maandelijks abonnement: Meer zichtbaarheid, prioriteit in zoekresultaten",
    },

    // ZZP Exam & Certification (ONE-TIME payment!)
    zzpExam: {
      priceId: import.meta.env.VITE_STRIPE_PRICE_ZZP_EXAM || "",
      amount: 230, // €190 + 21% BTW
      currency: "eur",
      interval: "one_time",
      name: "ZZP Exam & Certification",
      description:
        "Egzamin praktyczny + Certyfikat Doświadczenia ZZP (ważny 7 lat)",
    },

    // Employer subscriptions
    employerBasic: {
      priceId: import.meta.env.VITE_STRIPE_PRICE_EMPLOYER_BASIC || "",
      amount: 13,
      currency: "eur",
      interval: "month",
      name: "Basic Plan (Employer)",
      description:
        "Basis toegang tot platform - 50 searches, 5 contacten per maand",
    },

    employerPremium: {
      priceId: import.meta.env.VITE_STRIPE_PRICE_EMPLOYER_PREMIUM || "",
      amount: 25,
      currency: "eur",
      interval: "month",
      name: "Premium Plan (Employer)",
      description:
        "Volledige toegang - Unlimited searches, contacten, Premium workers",
    },

    // Regular User Premium
    regularUserPremium: {
      priceId: import.meta.env.VITE_STRIPE_PRICE_REGULAR_USER_PREMIUM || "",
      amount: 9.99,
      currency: "eur",
      interval: "month",
      name: "Premium Plan (Regular User)",
      description:
        "Nielimitowane zlecenia, wyszukiwarka ekspertów, system wiadomości",
    },
  },

  // Webhook configuration (for backend)
  webhookSecret: import.meta.env.STRIPE_WEBHOOK_SECRET || "",

  // Success/Cancel URLs
  urls: {
    success: `${window.location.origin}/payment-success`,
    cancel: `${window.location.origin}/dashboard/worker`,
  },
} as const;

// Validate configuration
export const isStripeConfigured = (): boolean => {
  return Boolean(
    STRIPE_CONFIG.publishableKey &&
      (STRIPE_CONFIG.products.workerPremium.priceId ||
        STRIPE_CONFIG.products.employerBasic.priceId ||
        STRIPE_CONFIG.products.employerPremium.priceId)
  );
};
