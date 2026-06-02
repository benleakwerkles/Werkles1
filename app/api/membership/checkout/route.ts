import { NextRequest, NextResponse } from "next/server";
import { isAppInfraPreview } from "@/lib/app-infra-preview";
import { getFoundryDuesPriceId, getStripe } from "@/lib/stripe";
import { getSupabaseService } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/request";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (isAppInfraPreview()) {
    return NextResponse.json(
      { error: "Paid checkout is disabled during APP_INFRA preview." },
      { status: 403 }
    );
  }

  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const plan = body?.plan === "annual" ? "annual" : "monthly";
  const priceId = getFoundryDuesPriceId(plan);
  const origin = request.nextUrl.origin;
  const supabase = getSupabaseService();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, stripe_customer_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Open your dossier before paying dues." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  let customerId = profile.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email || auth.user.email || undefined,
      name: profile.display_name || undefined,
      metadata: {
        user_id: auth.user.id
      }
    });
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", auth.user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: auth.user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/membership?checkout=cancelled`,
    subscription_data: {
      metadata: {
        user_id: auth.user.id,
        plan
      }
    },
    metadata: {
      user_id: auth.user.id,
      plan
    }
  });

  return NextResponse.json({ url: session.url });
}
