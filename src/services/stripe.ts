/**
 * Stripe Service
 * Handles all Stripe-related operations
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";
import { STRIPE_CONFIG } from "../config/stripe";
import { supabase } from "@/lib/supabase";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get Stripe instance (singleton pattern)
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
};

/**
 * Create Checkout Session
 * Calls Supabase Edge Function to create Stripe Checkout Session
 */
export const createCheckoutSession = async (
  priceId: string,
  userId: string,
  userType:
    | "worker"
    | "cleaning_company"
    | "employer"
    | "accountant"
    | "regular_user" = "worker"
): Promise<string> => {
  try {
    const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

    if (!functionsUrl) {
      throw new Error("VITE_SUPABASE_FUNCTIONS_URL not configured in .env");
    }

    // Get current session token for authorization
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated. Please log in.");
    }

    // ✅ CRITICAL: Save session tokens to localStorage BEFORE Stripe redirect
    // This prevents session loss when returning from external Stripe domain
    localStorage.setItem(
      "stripe_payment_session",
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user_id: userId,
        user_type: userType,
        timestamp: Date.now(),
      })
    );
    console.log(
      "[Stripe] Session saved to localStorage before payment redirect"
    );

    // Get current user email
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email || `user-${userId}@zzp-werkplaats.nl`;

    const response = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
      },
      body: JSON.stringify({
        priceId,
        userId,
        userType,
        email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to create checkout session";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    throw error;
  }
};

/**
 * Redirect to Stripe Checkout
 * Note: In newer Stripe versions, use the Checkout Session URL directly
 */
export const redirectToCheckout = async (sessionUrl: string): Promise<void> => {
  // Simply redirect to the Stripe Checkout URL
  window.location.href = sessionUrl;
};

/**
 * Handle upgrade to Premium (Worker)
 * Main function called from Worker Dashboard
 */
export const handleUpgradeToPremium = async (userId: string): Promise<void> => {
  try {
    const priceId = STRIPE_CONFIG.products.workerPremium.priceId;

    if (!priceId) {
      throw new Error("Stripe Price ID not configured. Check .env file.");
    }

    // Create checkout session and get URL
    const checkoutUrl = await createCheckoutSession(priceId, userId, "worker");

    // Redirect to Stripe Checkout
    await redirectToCheckout(checkoutUrl);
  } catch (error) {
    console.error("Error handling upgrade:", error);
    throw error;
  }
};

/**
 * Handle upgrade to Premium (Regular User)
 * Main function called from Regular User Dashboard
 */
export const handleRegularUserUpgradeToPremium = async (
  userId: string
): Promise<void> => {
  try {
    const priceId = STRIPE_CONFIG.products.regularUserPremium.priceId;

    if (!priceId) {
      throw new Error("Stripe Price ID not configured. Check .env file.");
    }

    // Create checkout session and get URL
    const checkoutUrl = await createCheckoutSession(
      priceId,
      userId,
      "regular_user"
    );

    // Redirect to Stripe Checkout
    await redirectToCheckout(checkoutUrl);
  } catch (error) {
    console.error("Error handling Regular User upgrade:", error);
    throw error;
  }
};

/**
 * Handle upgrade to Premium (Cleaning Company)
 * Main function called from Cleaning Company Dashboard
 */
export const handleCleaningCompanyUpgradeToPremium = async (
  userId: string
): Promise<void> => {
  try {
    const priceId = STRIPE_CONFIG.products.workerPremium.priceId; // Same price as worker

    if (!priceId) {
      throw new Error("Stripe Price ID not configured. Check .env file.");
    }

    // ✅ SAVE email to localStorage BEFORE redirect - for session recovery after Stripe
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      localStorage.setItem("pending_payment_email", user.email);
      localStorage.setItem("pending_payment_user_type", "cleaning_company");
      console.log("[Stripe] Saved email for session recovery:", user.email);
    }

    // Create checkout session with cleaning_company userType
    const checkoutUrl = await createCheckoutSession(
      priceId,
      userId,
      "cleaning_company"
    );

    // Redirect to Stripe Checkout
    await redirectToCheckout(checkoutUrl);
  } catch (error) {
    console.error("Error handling cleaning company upgrade:", error);
    throw error;
  }
};

/**
 * Handle upgrade to Premium (Accountant)
 * Main function called from Accountant Dashboard/Subscription page
 */
export const handleAccountantUpgradeToPremium = async (
  userId: string
): Promise<void> => {
  try {
    const priceId = STRIPE_CONFIG.products.workerPremium.priceId; // Same price as worker/cleaning company

    if (!priceId) {
      throw new Error("Stripe Price ID not configured. Check .env file.");
    }

    // ✅ SAVE email to localStorage BEFORE redirect - for session recovery after Stripe
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      localStorage.setItem("pending_payment_email", user.email);
      localStorage.setItem("pending_payment_user_type", "accountant");
      console.log("[Stripe] Saved email for session recovery:", user.email);
    }

    // Create checkout session with accountant userType
    const checkoutUrl = await createCheckoutSession(
      priceId,
      userId,
      "accountant"
    );

    // Redirect to Stripe Checkout
    await redirectToCheckout(checkoutUrl);
  } catch (error) {
    console.error("Error handling accountant upgrade:", error);
    throw error;
  }
};

/**
 * Create Checkout Session for Employer
 * Calls Supabase Edge Function with employer-specific parameters
 */
export const createEmployerCheckoutSession = async (
  priceId: string,
  employerId: string,
  plan: "basic" | "premium"
): Promise<string> => {
  try {
    const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

    if (!functionsUrl) {
      throw new Error("VITE_SUPABASE_FUNCTIONS_URL not configured in .env");
    }

    // Get current session token for authorization
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated. Please log in.");
    }

    // Get current user email
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email || `employer-${employerId}@zzp-werkplaats.nl`;

    const response = await fetch(`${functionsUrl}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
      },
      body: JSON.stringify({
        priceId,
        userId: employerId,
        userType: "employer",
        plan,
        email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to create checkout session";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error("❌ Error creating employer checkout session:", error);
    throw error;
  }
};

/**
 * Handle employer subscription (Basic or Premium)
 * Main function called from Employer Dashboard
 */
export const handleEmployerSubscription = async (
  employerId: string,
  plan: "basic" | "premium"
): Promise<void> => {
  try {
    const priceId =
      plan === "basic"
        ? STRIPE_CONFIG.products.employerBasic.priceId
        : STRIPE_CONFIG.products.employerPremium.priceId;

    if (!priceId) {
      throw new Error(
        `Stripe Price ID for ${plan} not configured. Check .env file.`
      );
    }

    // Create checkout session and get URL
    const checkoutUrl = await createEmployerCheckoutSession(
      priceId,
      employerId,
      plan
    );

    // Redirect to Stripe Checkout
    await redirectToCheckout(checkoutUrl);
  } catch (error) {
    console.error("Error handling employer subscription:", error);
    throw error;
  }
};

/**
 * Create Customer Portal Session
 * For managing subscriptions (cancel, update payment method)
 */
export const createPortalSession = async (
  customerId: string
): Promise<string> => {
  try {
    // TODO: Implement backend API call
    // const response = await fetch('/api/create-portal-session', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ customerId })
    // });
    // const { url } = await response.json();
    // return url;

    console.warn("🚨 MOCK PORTAL SESSION - Implement backend API");
    throw new Error("Backend API not implemented");
  } catch (error) {
    console.error("Error creating portal session:", error);
    throw error;
  }
};

/**
 * Verify webhook signature (backend only)
 * This should be implemented in your Supabase Edge Function
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string
): boolean => {
  // This runs on backend only
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  // return true;
  return false;
};
