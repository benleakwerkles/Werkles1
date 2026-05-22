import "server-only";
import { NextResponse } from "next/server";
import { copy } from "@/lib/copy";
import { getSupabaseService } from "@/lib/supabase/server";
import type { AccessWeight } from "@/lib/access-weight-client";

type MembershipGate =
  | { ok: true }
  | { ok: false; response: NextResponse };

export async function getAccessWeight(userId: string): Promise<AccessWeight> {
  const supabase = getSupabaseService();
  const { data, error } = await supabase.rpc("access_weight", { p_user_id: userId });

  if (error || !data) return "lightweight";
  return data as AccessWeight;
}

export async function canRequestIntro(scoutUserId: string, targetUserId: string) {
  const [scoutWeight, targetWeight] = await Promise.all([
    getAccessWeight(scoutUserId),
    getAccessWeight(targetUserId)
  ]);

  return {
    ok: !(scoutWeight === "lightweight" && targetWeight === "heavyweight"),
    scoutWeight,
    targetWeight
  };
}

export async function requireActiveMembership(userId: string): Promise<MembershipGate> {
  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("profiles")
    .select("membership_tier, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: error.message }, { status: 500 })
    };
  }

  if (data?.membership_tier === "member" && data?.subscription_status === "active") {
    return { ok: true };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: copy.verification.requiresMembership }, { status: 402 })
  };
}
