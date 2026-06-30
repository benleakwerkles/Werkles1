import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  appendJsonl,
  EVENTS_PATH,
  executionPlanBody,
  findObjectFile,
  PLANS_DIR,
  repoRelative,
  writeTextAtomic
} from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanRequest = {
  object_id?: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json() as PlanRequest;
  const objectId = typeof body.object_id === "string" ? body.object_id : "";
  if (!objectId) {
    return NextResponse.json({ ok: false, error: "object_id is required" }, { status: 400 });
  }

  const { filePath, object } = await findObjectFile(objectId);
  const planPath = path.join(PLANS_DIR, `${object.id}.md`);
  await writeTextAtomic(planPath, executionPlanBody(object, filePath));
  await appendJsonl(EVENTS_PATH, {
    event_type: "nerdkle_execution_plan_created",
    object_id: object.id,
    object_path: repoRelative(filePath),
    plan_path: repoRelative(planPath),
    execution_owner: object.execution_owner,
    created_at: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    object_id: object.id,
    execution_owner: object.execution_owner,
    plan_path: repoRelative(planPath)
  });
}
