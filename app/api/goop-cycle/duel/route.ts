import { NextRequest, NextResponse } from "next/server";
import { resolveDuel } from "@/lib/goop-cycle/duel";
import type { LifeSkillId, ReligionId, Summon } from "@/lib/goop-cycle/types";

type DuelBody = {
  summonA: Summon;
  summonB: Summon;
  religionA: ReligionId;
  religionB: ReligionId;
  skillLevelsA?: Partial<Record<LifeSkillId, number>>;
  skillLevelsB?: Partial<Record<LifeSkillId, number>>;
  seed?: string;
};

export async function POST(request: NextRequest) {
  let body: DuelBody;
  try {
    body = (await request.json()) as DuelBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.summonA?.id || !body.summonB?.id || !body.religionA || !body.religionB) {
    return NextResponse.json({ error: "summons and religions are required" }, { status: 400 });
  }

  const result = resolveDuel({
    summonA: body.summonA,
    summonB: body.summonB,
    religionA: body.religionA,
    religionB: body.religionB,
    skillLevelsA: body.skillLevelsA ?? {},
    skillLevelsB: body.skillLevelsB ?? {},
    seed: body.seed
  });

  return NextResponse.json({ result, draft: true });
}
