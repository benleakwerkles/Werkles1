import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseService } from "@/lib/supabase/server";
import { requireEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

type SubscriptionSnapshot = {
  stripe_subscription_id: string;
  subscription_status: string | null;
  membership_tier: "free" | "member";
  current_period_end: string | null;
};

function snapshotSubscription(subscription: Stripe.Subscription): SubscriptionSnapshot {
  const raw = subscription as Stripe.Subscription & { current_period_end?: number };
  const status = subscription.status || null;
  const active = status === "active" || status === "trialing";

  return {
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    membership_tier: active ? "member" : "free",
    current_period_end: raw.current_period_end
      ? new Date(raw.current_period_end * 1000).toISOString()
      : null
  };
}

async function syncSubscription(subscription: Stripe.Subscription, userId?: string | null) {
  const supabase = getSupabaseService();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id || null;

  const update = {
    ...snapshotSubscription(subscription),
    stripe_customer_id: customerId
  };

  if (userId) {
    return supabase.from("profiles").update(update).eq("id", userId);
  }

  if (customerId) {
    return supabase.from("profiles").update(update).eq("stripe_customer_id", customerId);
  }

  return { error: null };
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const { error } = await syncSubscription(
        subscription,
        session.metadata?.user_id || session.client_reference_id
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const { error } = await syncSubscription(
      subscription,
      subscription.metadata?.user_id || null
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
