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
  if (plan === "annual") {
    return process.env.STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID || requireEnv("STRIPE_YEARLY_PRICE_ID");
  }

  return process.env.STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID || requireEnv("STRIPE_MONTHLY_PRICE_ID");
}
