// supabase/functions/stripe-webhook/index.ts
//
// Deploy with:  supabase functions deploy stripe-webhook --no-verify-jwt
// Then in Stripe Dashboard > Developers > Webhooks, add an endpoint pointing to:
//   https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
// Subscribe it to these events:
//   checkout.session.completed
//   customer.subscription.updated
//   customer.subscription.deleted
//
// Required secrets (set with `supabase secrets set KEY=value`):
//   STRIPE_SECRET_KEY        - your Stripe secret key (sk_...)
//   STRIPE_WEBHOOK_SECRET    - the signing secret Stripe gives you for this endpoint (whsec_...)
//   SUPABASE_URL             - auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY - auto-provided by Supabase (Project Settings > API)

import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Map your actual Stripe Price IDs to a plan label. Fill these in from your
// Stripe Dashboard > Product catalog > (your product) > pricing.
const PRICE_PLAN_MAP: Record<string, string> = {
  // "price_XXXXXXXXXXXXXX": "monthly",
  // "price_YYYYYYYYYYYYYY": "annual",
};

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  if (!signature) {
    return new Response("Missing Stripe-Signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email ?? session.customer_email;
        if (!email) break;

        let plan: string | null = null;
        let periodEnd: string | null = null;

        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = sub.items.data[0]?.price.id;
          plan = (priceId && PRICE_PLAN_MAP[priceId]) || sub.items.data[0]?.price.recurring?.interval || null;
          periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        }

        await supabaseAdmin.from("subscriptions").upsert(
          {
            email,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: (session.subscription as string) ?? null,
            status: "active",
            plan,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string);
        const email = (customer as Stripe.Customer).email;
        if (!email) break;

        await supabaseAdmin.from("subscriptions").upsert(
          {
            email,
            stripe_customer_id: sub.customer as string,
            stripe_subscription_id: sub.id,
            status: sub.status === "active" || sub.status === "trialing" ? "active" : sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string);
        const email = (customer as Stripe.Customer).email;
        if (!email) break;

        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("email", email);
        break;
      }

      default:
        // Ignore anything we don't handle explicitly.
        break;
    }
  } catch (err) {
    console.error("Error handling webhook event:", err);
    return new Response("Internal error handling webhook", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
