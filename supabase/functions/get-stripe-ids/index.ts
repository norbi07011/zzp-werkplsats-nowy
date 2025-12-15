import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sessionId, userType } = await req.json();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Retrieve Stripe session to get customer_id and subscription_id
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const userId = session.metadata?.userId;

    if (!customerId || !userId) {
      return new Response(JSON.stringify({ error: "Invalid session data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `[GET-STRIPE-IDS] Customer: ${customerId}, Subscription: ${subscriptionId}, User: ${userId}`
    );

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the appropriate table based on userType
    if (userType === "regular_user") {
      const { error } = await supabase
        .from("regular_users")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .eq("profile_id", userId);

      if (error) {
        console.error("[GET-STRIPE-IDS] Error updating regular_users:", error);
      } else {
        console.log(
          `[GET-STRIPE-IDS] Updated regular_user ${userId} with Stripe IDs`
        );
      }
    } else if (userType === "worker") {
      const { error } = await supabase
        .from("workers")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .eq("profile_id", userId);

      if (error) {
        console.error("[GET-STRIPE-IDS] Error updating workers:", error);
      }
    } else if (userType === "cleaning_company") {
      const { error } = await supabase
        .from("cleaning_companies")
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .eq("profile_id", userId);

      if (error) {
        console.error(
          "[GET-STRIPE-IDS] Error updating cleaning_companies:",
          error
        );
      }
    }

    return new Response(
      JSON.stringify({
        customerId,
        subscriptionId,
        success: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("[GET-STRIPE-IDS] Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: err?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
