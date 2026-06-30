import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import {
  appendJsonl,
  EVENTS_PATH,
  findObjectFile,
  RECEIPTS_DIR,
  repoRelative,
  sha256,
  writeJsonAtomic
} from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReceiptRequest = {
  object_id?: string;
  pass?: boolean;
  outcome?: string;
  artifact_path?: string;
  notes?: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json() as ReceiptRequest;
  const objectId = typeof body.object_id === "string" ? body.object_id : "";
  if (!objectId) {
    return NextResponse.json({ ok: false, error: "object_id is required" }, { status: 400 });
  }

  const { filePath, object } = await findObjectFile(objectId);
  const now = new Date().toISOString();
  const pass = body.pass !== false;
  const receipt = {
    id: `execution_receipt_${object.id}_${Date.now().toString(36)}`,
    object_id: object.id,
    pass,
    outcome: typeof body.outcome === "string" && body.outcome.trim() ? body.outcome.trim() : "execution receipt recorded",
    artifact_path: typeof body.artifact_path === "string" && body.artifact_path.trim()
      ? body.artifact_path.trim()
      : object.artifact_created,
    notes: typeof body.notes === "string" ? body.notes.trim() : "",
    object_hash: sha256(object),
    created_at: now
  };
  const receiptPath = path.join(RECEIPTS_DIR, `${receipt.id}.json`);
  await writeJsonAtomic(receiptPath, receipt);

  const updatedObject = {
    ...object,
    status: {
      stage: pass ? "completed" : "blocked",
      updated_at: now,
      last_receipt_path: repoRelative(receiptPath)
    },
    next_action: pass
      ? "Receipt recorded. Object loop is closed."
      : "Receipt recorded as blocked. Operator or owner needs to clear the blocker."
  };
  await writeJsonAtomic(filePath, updatedObject);
  await appendJsonl(EVENTS_PATH, {
    event_type: "nerdkle_execution_receipt_recorded",
    object_id: object.id,
    object_path: repoRelative(filePath),
    receipt_path: repoRelative(receiptPath),
    pass,
    stage: updatedObject.status.stage,
    created_at: now
  });

  return NextResponse.json({
    ok: true,
    object: updatedObject,
    receipt,
    artifact_path: repoRelative(filePath),
    receipt_path: repoRelative(receiptPath)
  });
}
