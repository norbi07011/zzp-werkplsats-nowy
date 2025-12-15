/**
 * CREATE CUSTOMER PORTAL SESSION
 *
 * Edge Function do tworzenia Stripe Customer Portal Session
 * Umożliwia użytkownikom zarządzanie subskrypcją (anulowanie, zmiana karty, faktury)
 *
 * @param {string} customerId - Stripe Customer ID (z regular_users.stripe_customer_id)
 * @param {string} returnUrl - URL powrotu po zamknięciu portalu
 * @returns {string} url - Link do Stripe Customer Portal
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[CustomerPortal] Creating portal session...");

    // Parse request body
    const { customerId, returnUrl } = await req.json();

    if (!customerId) {
      console.error("[CustomerPortal] Missing customerId");
      return new Response(
        JSON.stringify({
          error: "customerId is required",
          message: "Nie znaleziono ID klienta Stripe",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!returnUrl) {
      console.error("[CustomerPortal] Missing returnUrl");
      return new Response(
        JSON.stringify({
          error: "returnUrl is required",
          message: "Nie podano URL powrotu",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(
      `[CustomerPortal] Creating session for customer: ${customerId}`
    );
    console.log(`[CustomerPortal] Return URL: ${returnUrl}`);

    // Create Stripe Customer Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log(`[CustomerPortal] Session created: ${portalSession.id}`);
    console.log(`[CustomerPortal] Portal URL: ${portalSession.url}`);

    return new Response(
      JSON.stringify({
        url: portalSession.url,
        sessionId: portalSession.id,
        success: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[CustomerPortal] Error creating portal session:", error);

    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      return new Response(
        JSON.stringify({
          error: "Invalid Stripe customer ID",
          message:
            "Nieprawidłowy ID klienta Stripe. Skontaktuj się z supportem.",
          details: (error as any)?.message || "Unknown error",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      return new Response(
        JSON.stringify({
          error: "Stripe authentication failed",
          message: "Błąd autoryzacji Stripe",
          details: (error as any)?.message || "Unknown error",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: "Failed to create portal session",
        message: "Nie udało się otworzyć portalu zarządzania subskrypcją",
        details: (error as any)?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
