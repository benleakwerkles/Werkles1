import "server-only";
import Stripe from "stripe";
import { requireEnv } from "@/lib/supabase/env";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  }

  return stripeClient;
}

export function getFoundryDuesPriceId(plan: "monthly" | "annual") {
  return plan === "annual"
    ? requireEnv("STRIPE_YEARLY_PRICE_ID")
    : requireEnv("STRIPE_MONTHLY_PRICE_ID");
}
