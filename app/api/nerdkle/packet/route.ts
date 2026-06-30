import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  appendJsonl,
  executionPacketBody,
  EXECUTION_PACKETS_PATH,
  findObjectFile,
  HANDOFF_OUTBOX_DIR,
  repoRelative,
  safeOwnerName,
  writeTextAtomic
} from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PacketRequest = {
  object_id?: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json() as PacketRequest;
  const objectId = typeof body.object_id === "string" ? body.object_id : "";
  if (!objectId) {
    return NextResponse.json({ ok: false, error: "object_id is required" }, { status: 400 });
  }

  const { filePath, object } = await findObjectFile(objectId);
  const packetPath = path.join(
    HANDOFF_OUTBOX_DIR,
    `TO_${safeOwnerName(object.execution_owner)}_NERDKLE_EXECUTE_${object.id}.md`
  );
  await writeTextAtomic(packetPath, executionPacketBody(object, filePath));
  await appendJsonl(EXECUTION_PACKETS_PATH, {
    event_type: "nerdkle_execution_packet_created",
    object_id: object.id,
    object_path: repoRelative(filePath),
    packet_path: repoRelative(packetPath),
    execution_owner: object.execution_owner,
    created_at: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    object_id: object.id,
    execution_owner: object.execution_owner,
    packet_path: repoRelative(packetPath)
  });
}
