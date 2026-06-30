import { NextRequest, NextResponse } from "next/server";
import {
  appendJsonl,
  EVENTS_PATH,
  findObjectFile,
  questionsForObject,
  repoRelative,
  stageForObject,
  writeJsonAtomic
} from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResolveRequest = {
  object_id?: string;
  answers?: Record<string, string>;
};

export async function POST(request: NextRequest) {
  const body = await request.json() as ResolveRequest;
  const objectId = typeof body.object_id === "string" ? body.object_id : "";
  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

  if (!objectId) {
    return NextResponse.json({ ok: false, error: "object_id is required" }, { status: 400 });
  }

  const { filePath, object } = await findObjectFile(objectId);
  const normalizedAnswers = Object.fromEntries(
    Object.entries(answers)
      .map(([field, answer]) => [field, String(answer).trim()])
      .filter(([, answer]) => answer.length > 0)
  );

  if (Object.keys(normalizedAnswers).length === 0) {
    return NextResponse.json({ ok: false, error: "at least one answer is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const unresolvedFields = (object.unresolved_fields ?? []).filter((field) => !normalizedAnswers[field]);
  const updatedObject = {
    ...object,
    unresolved_fields: unresolvedFields,
    resolved_fields: {
      ...(object.resolved_fields ?? {}),
      ...normalizedAnswers
    },
    status: {
      stage: stageForObject({ ...object, unresolved_fields: unresolvedFields }),
      updated_at: now,
      last_receipt_path: object.status?.last_receipt_path
    },
    next_action: unresolvedFields.length > 0
      ? `Resolve ${unresolvedFields[0]} so ${object.execution_owner} can execute.`
      : `${object.execution_owner} can execute the first build step and return a receipt.`
  };

  await writeJsonAtomic(filePath, updatedObject);
  await appendJsonl(EVENTS_PATH, {
    event_type: "nerdkle_object_resolved",
    object_id: object.id,
    artifact_path: repoRelative(filePath),
    resolved_fields: Object.keys(normalizedAnswers),
    remaining_fields: unresolvedFields,
    stage: updatedObject.status.stage,
    created_at: now
  });

  return NextResponse.json({
    ok: true,
    object: updatedObject,
    artifact_path: repoRelative(filePath),
    questions: questionsForObject(updatedObject)
  });
}
