import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NERDKLE_ROOT = path.join(process.cwd(), "data", "organism", "nerdkle");
const OBJECTS_DIR = path.join(NERDKLE_ROOT, "objects");
const RECEIPTS_DIR = path.join(NERDKLE_ROOT, "receipts");
const EVENTS_PATH = path.join(NERDKLE_ROOT, "events.jsonl");

type AssembleRequest = {
  intent?: string;
  owner?: string;
  output_type?: string;
};

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "nerdkle-object";
}

function sha256(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function writeJsonAtomic(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(`${filePath}.tmp`, filePath);
}

async function appendJsonl(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function repoRelative(filePath: string) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

function extractUnresolvedFields(intent: string) {
  const fields = [];
  if (!/\b(for|to)\s+[^.?!,]{3,}/i.test(intent)) {
    fields.push("target user / beneficiary");
  }
  if (!/\b(by|before|deadline|date|today|tomorrow|week|month|year)\b/i.test(intent)) {
    fields.push("timeline");
  }
  if (!/\b(budget|money|cost|free|\$|hours?|days?|weeks?)\b/i.test(intent)) {
    fields.push("constraints / budget");
  }
  if (!/\b(receipt|proof|evidence|validate|test|ship|launch|publish)\b/i.test(intent)) {
    fields.push("evidence of completion");
  }
  return fields;
}

function classifyHumanGates(intent: string) {
  const gates = [];
  if (/\b(pay|payment|buy|purchase|spend|billing|card|invoice|contract)\b/i.test(intent)) {
    gates.push("money / contract approval");
  }
  if (/\b(login|oauth|password|credential|account|secret|token)\b/i.test(intent)) {
    gates.push("credential or account access");
  }
  if (/\b(deploy|publish|public|send|email|post|launch|push|merge)\b/i.test(intent)) {
    gates.push("external send / publish / deploy");
  }
  if (/\b(sql|database|schema|rls|production data|delete|destructive)\b/i.test(intent)) {
    gates.push("production data or destructive action");
  }
  return gates;
}

function chooseOwner(intent: string, requestedOwner?: string) {
  if (requestedOwner && requestedOwner.trim()) return requestedOwner.trim();
  if (/\b(schema|infra|script|automation|database|api|route)\b/i.test(intent)) return "Dink";
  if (/\b(visual|copy|ux|story|brand|page)\b/i.test(intent)) return "Maker";
  if (/\b(audit|risk|security|trust|compliance)\b/i.test(intent)) return "Bean";
  if (/\b(strategy|market|position|why)\b/i.test(intent)) return "Skybro";
  return "Maker";
}

function chooseOutputType(intent: string, requestedType?: string) {
  if (requestedType && requestedType.trim()) return requestedType.trim();
  if (/\b(checklist|steps|sop)\b/i.test(intent)) return "checklist";
  if (/\b(form|intake|fields)\b/i.test(intent)) return "form";
  if (/\b(packet|handoff|aeye)\b/i.test(intent)) return "packet";
  return "operating_object";
}

export async function POST(request: NextRequest) {
  const body = await request.json() as AssembleRequest;
  const intent = typeof body.intent === "string" ? body.intent.trim() : "";

  if (!intent) {
    return NextResponse.json({ ok: false, error: "intent is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const objectId = `nerdkle_${slug(intent)}_${Date.now().toString(36)}`;
  const outputType = chooseOutputType(intent, body.output_type);
  const executionOwner = chooseOwner(intent, body.owner);
  const unresolvedFields = extractUnresolvedFields(intent);
  const humanGates = classifyHumanGates(intent);
  const object = {
    id: objectId,
    object_type: outputType,
    source: "Nerdkle Operator Intake",
    operator_intent: intent,
    artifact_created: `data/organism/nerdkle/objects/${objectId}.json`,
    unresolved_fields: unresolvedFields,
    human_gates: humanGates.length > 0 ? humanGates : ["none"],
    execution_owner: executionOwner,
    receipt_required: {
      required: "Y",
      destination: "data/organism/nerdkle/receipts"
    },
    next_action: unresolvedFields.length > 0
      ? `Resolve ${unresolvedFields[0]} so ${executionOwner} can execute.`
      : `${executionOwner} can execute the first build step and return a receipt.`,
    status: {
      stage: unresolvedFields.length > 0
        ? "needs_clarification"
        : humanGates.length > 0
          ? "waiting_on_human_gate"
          : "ready_for_execution",
      updated_at: now
    },
    evidence_required: [
      "artifact path exists",
      "execution owner named",
      "human gates named",
      "receipt written"
    ],
    failure_condition: "Operator has to restate context already provided, or execution proceeds without a receipt.",
    created_at: now
  };
  const objectPath = path.join(OBJECTS_DIR, `${objectId}.json`);
  await writeJsonAtomic(objectPath, object);

  const receipt = {
    id: `receipt_${objectId}`,
    object_id: objectId,
    pass: true,
    artifact_path: repoRelative(objectPath),
    object_hash: sha256(object),
    receipt_required: true,
    created_at: now
  };
  const receiptPath = path.join(RECEIPTS_DIR, `${receipt.id}.json`);
  await writeJsonAtomic(receiptPath, receipt);
  await appendJsonl(EVENTS_PATH, {
    event_type: "nerdkle_object_created",
    object_id: objectId,
    artifact_path: repoRelative(objectPath),
    receipt_path: repoRelative(receiptPath),
    execution_owner: executionOwner,
    created_at: now
  });

  return NextResponse.json({
    ok: true,
    object,
    receipt,
    artifact_path: repoRelative(objectPath),
    receipt_path: repoRelative(receiptPath)
  });
}
