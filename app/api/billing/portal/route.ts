import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/request";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  return NextResponse.json(
    {
      error:
        "Billing portal is prepared as a shell only. APPROVE PAID CHECKOUT GO-LIVE is required before live portal sessions."
    },
    { status: 501 }
  );
}
