import { NextRequest, NextResponse } from "next/server";
import { findObjectFile, qualityForObject, questionsForObject, stageForObject } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const objectId = request.nextUrl.searchParams.get("object_id") ?? "";
  if (!objectId) {
    return NextResponse.json({ ok: false, error: "object_id is required" }, { status: 400 });
  }

  const { object } = await findObjectFile(objectId);
  const stage = stageForObject(object);
  const quality = qualityForObject(object);
  const questions = questionsForObject(object);
  const preview = stage === "needs_clarification"
    ? {
        would_do: "resolve_fields",
        inputs_needed: questions,
        resulting_stage: questions.length === 1 ? "ready_for_execution_or_human_gate_review" : "needs_clarification"
      }
    : stage === "waiting_on_human_gate"
      ? {
          would_do: "review_human_gate",
          inputs_needed: (object.human_gates ?? []).filter((gate) => gate !== "none"),
          resulting_stage: "ready_for_execution_after_operator_approval"
        }
      : stage === "ready_for_execution"
        ? {
            would_do: "create_plan_or_packet",
            inputs_needed: [],
            resulting_stage: "ready_for_execution"
          }
        : {
            would_do: "record_or_review_receipt",
            inputs_needed: [],
            resulting_stage: stage
          };

  return NextResponse.json({
    ok: true,
    object_id: object.id,
    stage,
    quality,
    preview
  });
}
