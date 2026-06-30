import { NextRequest, NextResponse } from "next/server";
import { fuseSummons, fusionPreviewLine } from "@/lib/goop-cycle/fusion";
import type { LifeSkillId, ReligionId, Summon } from "@/lib/goop-cycle/types";

type FusionBody = {
  parentA: Summon;
  parentB: Summon;
  religionId?: ReligionId | null;
  skillLevels?: Partial<Record<LifeSkillId, number>>;
  catalystBonus?: number;
};

export async function POST(request: NextRequest) {
  let body: FusionBody;
  try {
    body = (await request.json()) as FusionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.parentA?.id || !body.parentB?.id) {
    return NextResponse.json({ error: "parentA and parentB summons are required" }, { status: 400 });
  }

  try {
    const offspring = fuseSummons({
      parentA: body.parentA,
      parentB: body.parentB,
      religionId: body.religionId ?? null,
      skillLevels: body.skillLevels ?? {},
      catalystBonus: body.catalystBonus ?? 0
    });

    return NextResponse.json({
      preview: fusionPreviewLine(body.parentA, body.parentB),
      offspring,
      draft: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fusion failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
