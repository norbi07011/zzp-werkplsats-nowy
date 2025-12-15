/**
 * SUPABASE EDGE FUNCTION: stripe-webhook
 * Handles Stripe webhook events for subscription lifecycle
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login: supabase login
 * 3. Link project: supabase link --project-ref your-project-ref
 * 4. Deploy: supabase functions deploy stripe-webhook
 * 5. Set secrets:
 *    supabase secrets set STRIPE_SECRET_KEY=sk_test_...
 *    supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
 *    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
 * 6. Get function URL: https://your-project.functions.supabase.co/stripe-webhook
 * 7. Add URL to Stripe Webhook Dashboard
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-09-30.clover",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  try {
    const body = await req.text();

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log("✅ Webhook verified:", event.type);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
});

/**
 * Handle completed checkout session
 * Creates subscription record in database OR processes ZZP exam payment
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("💳 Checkout completed:", session.id);

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const paymentType = session.metadata?.type;

  // Get worker ID from metadata
  const workerId = session.metadata?.userId;

  if (!workerId) {
    console.error("❌ No userId in session metadata");
    return;
  }

  // Check if this is a ZZP exam payment (one-time) or subscription
  if (paymentType === "zzp_exam") {
    console.log("📝 Processing ZZP exam payment");

    const applicationId = session.metadata?.applicationId;

    if (!applicationId) {
      console.error("❌ No applicationId in session metadata");
      return;
    }

    // Update zzp_exam_applications status
    const { error: appError } = await supabase
      .from("zzp_exam_applications")
      .update({
        status: "payment_completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (appError) {
      console.error("❌ Error updating exam application:", appError);
    } else {
      console.log("✅ Exam application payment completed:", applicationId);
    }

    // Update payments table record
    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        payment_date: new Date().toISOString(),
        transaction_id: (session.payment_intent as string) || session.id,
      })
      .eq("transaction_id", session.id); // Find by session ID stored in transaction_id

    if (paymentError) {
      console.error("❌ Error updating payment record:", paymentError);
    } else {
      console.log("✅ Payment record marked as completed");
    }

    return;
  }

  // Get userType from metadata to determine which table to update
  const userType = session.metadata?.userType || "worker";

  // Update based on user type
  if (userType === "regular_user") {
    // Calculate subscription end date (+1 month from now)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    // Update regular_users table
    const { error: updateError } = await supabase
      .from("regular_users")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        is_premium: true,
        subscription_status: "active",
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: subscriptionEndDate.toISOString(), // ← ADD THIS
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", workerId);

    if (updateError) {
      console.error("❌ Error updating regular_user:", updateError);
      return;
    }

    console.log("✅ Regular user updated with subscription:", workerId);
  } else if (userType === "cleaning_company") {
    // Update cleaning_companies table
    const { error: updateError } = await supabase
      .from("cleaning_companies")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_tier: "premium",
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", workerId); // workerId is actually profile_id for cleaning companies

    if (updateError) {
      console.error("❌ Error updating cleaning_company:", updateError);
      return;
    }

    console.log("✅ Cleaning company updated with subscription:", workerId);
  } else if (userType === "employer") {
    // Update employers table
    const plan = session.metadata?.plan || "premium";
    const { error: updateError } = await supabase
      .from("employers")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_tier: plan,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", workerId);

    if (updateError) {
      console.error("❌ Error updating employer:", updateError);
      return;
    }

    console.log("✅ Employer updated with subscription:", workerId);
  } else {
    // Default: Update workers table (original logic)
    const { error: updateError } = await supabase
      .from("workers")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_tier: "premium",
        subscription_status: "active",
        subscription_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId);

    if (updateError) {
      console.error("❌ Error updating worker:", updateError);
      return;
    }

    console.log("✅ Worker updated with subscription:", workerId);
  }

  // TODO: Send welcome email (FAZA 7)
  // await sendWelcomeEmail(workerId);
}

/**
 * Handle subscription update
 * Updates subscription status and tier
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log("🔄 Subscription updated:", subscription.id);

  const customerId = subscription.customer as string;

  const status =
    subscription.status === "active"
      ? "active"
      : subscription.status === "canceled"
      ? "cancelled"
      : "inactive";

  // Update workers
  const { error } = await supabase
    .from("workers")
    .update({
      subscription_status: status,
      subscription_end_date: new Date(
        (subscription as any).current_period_end * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  // Update regular_users
  await supabase
    .from("regular_users")
    .update({
      subscription_status: status,
      is_premium: status === "active",
      subscription_end_date: new Date(
        (subscription as any).current_period_end * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("❌ Error updating subscription:", error);
    return;
  }

  console.log("✅ Subscription updated for customer:", customerId);
}

/**
 * Handle subscription cancellation
 * Downgrades to basic tier
 */
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log("❌ Subscription cancelled:", subscription.id);

  const customerId = subscription.customer as string;

  // Cancel for workers
  const { error } = await supabase
    .from("workers")
    .update({
      subscription_tier: "basic",
      subscription_status: "cancelled",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  // Cancel for regular_users
  await supabase
    .from("regular_users")
    .update({
      is_premium: false,
      subscription_status: "cancelled",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("❌ Error cancelling subscription:", error);
    return;
  }

  console.log("✅ Subscription cancelled for customer:", customerId);

  // TODO: Send cancellation confirmation email (FAZA 7)
}

/**
 * Handle successful payment
 * Records payment in database
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("💰 Payment succeeded:", invoice.id);

  const customerId = invoice.customer as string;

  // Try to find user in different tables
  let userId: string | null = null;
  let userType = "worker";

  // Check workers
  const { data: worker } = await supabase
    .from("workers")
    .select("id, profile_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (worker) {
    userId = worker.profile_id;
    userType = "worker";
  } else {
    // Check regular_users
    const { data: regularUser } = await supabase
      .from("regular_users")
      .select("id, profile_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (regularUser) {
      userId = regularUser.profile_id;
      userType = "regular_user";
    } else {
      // Check employers
      const { data: employer } = await supabase
        .from("employers")
        .select("profile_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (employer) {
        userId = employer.profile_id;
        userType = "employer";
      } else {
        // Check cleaning companies
        const { data: cleaning } = await supabase
          .from("cleaning_companies")
          .select("profile_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (cleaning) {
          userId = cleaning.profile_id;
          userType = "cleaning_company";
        } else {
          // Check accountants
          const { data: accountant } = await supabase
            .from("accountants")
            .select("profile_id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (accountant) {
            userId = accountant.profile_id;
            userType = "accountant";
          }
        }
      }
    }
  }

  if (!userId) {
    console.error("❌ User not found for customer:", customerId);
    return;
  }

  // Record payment in payments table
  const { error } = await supabase.from("payments").insert({
    user_id: userId,
    profile_id: userId,
    payment_type:
      userType === "regular_user"
        ? "regular_user_subscription"
        : `${userType}_subscription`,
    amount: (invoice.amount_paid / 100).toFixed(2), // Convert cents to euros
    currency: invoice.currency.toUpperCase(),
    payment_method: "stripe_card",
    status: "completed",
    description: `Subscription payment - ${userType}`,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: invoice.subscription as string,
    payment_date: new Date(invoice.created * 1000).toISOString(),
    completed_at: new Date(invoice.created * 1000).toISOString(),
    created_at: new Date(invoice.created * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("❌ Error recording payment:", error);
    return;
  }

  // Update last_payment_date based on user type
  if (userType === "worker" && worker) {
    await supabase
      .from("workers")
      .update({
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", worker.id);
  } else if (userType === "regular_user") {
    await supabase
      .from("regular_users")
      .update({
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", customerId);
  }

  console.log("✅ Payment recorded for user:", userId);
}

/**
 * Handle failed payment
 * Updates subscription status and sends alert
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("⚠️ Payment failed:", invoice.id);

  const customerId = invoice.customer as string;

  // Try to find user
  let userId: string | null = null;

  const { data: worker } = await supabase
    .from("workers")
    .select("id, profile_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (worker) {
    userId = worker.profile_id;
  } else {
    // Check regular_users
    const { data: regularUser } = await supabase
      .from("regular_users")
      .select("id, profile_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (regularUser) {
      userId = regularUser.profile_id;
    }
  }

  if (!userId) {
    console.error("❌ User not found for customer:", customerId);
    return;
  }

  // Record failed payment in payments table
  await supabase.from("payments").insert({
    user_id: userId,
    profile_id: userId,
    payment_type: worker ? "worker_subscription" : "regular_user_subscription",
    amount: (invoice.amount_due / 100).toFixed(2),
    currency: invoice.currency.toUpperCase(),
    payment_method: "stripe_card",
    status: "failed",
    description: "Failed subscription payment",
    stripe_invoice_id: invoice.id,
    stripe_customer_id: customerId,
    failed_at: new Date().toISOString(),
    failure_reason: invoice.status_transitions?.payment_failed_at
      ? "Payment method declined"
      : "Unknown",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log("⚠️ Failed payment recorded for user:", userId);

  // TODO: Send payment failed email (FAZA 7)
}
