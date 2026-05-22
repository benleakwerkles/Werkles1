import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/request";
import { copy } from "@/lib/copy";
import { canRequestIntro, requireActiveMembership } from "@/lib/access-weight";

const writableStatuses = new Set(copy.introStatuses);

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const { data, error } = await auth.supabase
    .from("intro_requests")
    .select("*")
    .or(
      `scout_user_id.eq.${auth.user.id},co_sign_user_id.eq.${auth.user.id},target_user_id.eq.${auth.user.id}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ intros: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const blueprintId = String(body?.blueprint_id || "");
  const targetUserId = String(body?.target_user_id || "");
  const coSignUserId = String(body?.co_sign_user_id || "");
  const message = body?.message ? String(body.message).slice(0, 2000) : null;

  if (!blueprintId || !targetUserId || !coSignUserId) {
    return NextResponse.json(
      { error: "blueprint_id, target_user_id, and co_sign_user_id are required" },
      { status: 400 }
    );
  }

  const membership = await requireActiveMembership(auth.user.id);
  if (!membership.ok) {
    return NextResponse.json({ error: copy.access.membershipRequired }, { status: 402 });
  }

  const access = await canRequestIntro(auth.user.id, targetUserId);
  if (!access.ok) {
    return NextResponse.json(
      {
        error: copy.access.insufficientWeight,
        title: copy.access.insufficientWeightTitle,
        scout_weight: access.scoutWeight,
        target_weight: access.targetWeight
      },
      { status: 403 }
    );
  }

  const { data, error } = await auth.supabase
    .from("intro_requests")
    .insert({
      blueprint_id: blueprintId,
      scout_user_id: auth.user.id,
      target_user_id: targetUserId,
      co_sign_user_id: coSignUserId,
      message
    })
    .select()
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("lightweight")) {
      return NextResponse.json(
        { error: copy.access.insufficientWeight, title: copy.access.insufficientWeightTitle },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ intro: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const id = String(body?.id || "");
  const status = String(body?.status || "");

  if (!id || !writableStatuses.has(status as (typeof copy.introStatuses)[number])) {
    return NextResponse.json({ error: "Valid id and status are required" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("intro_requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ intro: data });
}
