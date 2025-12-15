import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  priceId: string;
  userType:
    | "worker"
    | "employer"
    | "cleaning_company"
    | "accountant"
    | "regular_user";
  userId: string;
  email: string;
  plan?: "basic" | "premium";
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-09-30.clover",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { priceId, userType, userId, email, plan } = body;

    // Validate input
    if (!priceId || !userType || !userId || !email) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: priceId, userType, userId, email",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the origin for success/cancel URLs
    // IMPORTANT: Force correct development port - must match where app runs
    const requestOrigin = req.headers.get("origin");
    const origin = requestOrigin?.includes("localhost")
      ? "http://localhost:3005" // Always use correct dev port
      : requestOrigin || "https://zzp-werkplaats.nl";

    console.log(
      "📍 Using origin for redirect:",
      origin,
      "(from request:",
      requestOrigin,
      ")"
    );

    // Determine cancel URL based on user type
    const getCancelUrl = (type: string) => {
      switch (type) {
        case "cleaning_company":
          return `${origin}/cleaning-company/subscription`;
        case "employer":
          return `${origin}/employer/subscription`;
        case "accountant":
          return `${origin}/accountant/subscription`;
        case "regular_user":
          return `${origin}/regular-user?tab=subscription`;
        case "worker":
        default:
          return `${origin}/worker/subscription`;
      }
    };

    // Determine success URL based on user type - returns to subscription page with success=true
    const getSuccessUrl = (type: string) => {
      switch (type) {
        case "cleaning_company":
          return `${origin}/cleaning-company/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`;
        case "employer":
          return `${origin}/employer/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`;
        case "accountant":
          return `${origin}/accountant/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`;
        case "regular_user":
          return `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&user_type=regular_user`;
        case "worker":
        default:
          return `${origin}/worker/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`;
      }
    };

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "ideal", "bancontact"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: getSuccessUrl(userType),
      cancel_url: getCancelUrl(userType),
      customer_email: email,
      metadata: {
        userId,
        userType,
        plan: plan || "premium",
      },
      subscription_data: {
        metadata: {
          userId,
          userType,
          plan: plan || "premium",
        },
      },
    });

    console.log(
      `✅ Checkout session created for ${userType} ${userId}: ${session.id}`
    );

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
