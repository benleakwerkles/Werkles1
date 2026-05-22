import { NextRequest, NextResponse } from "next/server";
import { requireActiveMembership } from "@/lib/access-weight";
import { copy } from "@/lib/copy";
import { getSupabaseService } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/request";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const gate = await requireActiveMembership(auth.user.id);
  if (!gate.ok) return gate.response;

  const assetReportToken = `sandbox_asset_report_${auth.user.id}_${Date.now()}`;
  const { error } = await getSupabaseService()
    .from("profiles")
    .update({ funds_status: "sandbox_pending" })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    mode: "sandbox",
    status: "sandbox_pending",
    label: copy.verification.prepared,
    asset_report_token: assetReportToken
  });
}
