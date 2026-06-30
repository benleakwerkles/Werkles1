import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { questionsForObject, stageForObject } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NERDKLE_ROOT = path.join(process.cwd(), "data", "organism", "nerdkle");
const OBJECTS_DIR = path.join(NERDKLE_ROOT, "objects");
const RECEIPTS_DIR = path.join(NERDKLE_ROOT, "receipts");

async function readJsonFiles(directory: string) {
  try {
    const names = await fs.readdir(directory);
    const files = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const filePath = path.join(directory, name);
          const stat = await fs.stat(filePath);
          const value = JSON.parse(await fs.readFile(filePath, "utf8"));
          return {
            path: path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
            mtime: stat.mtime.toISOString(),
            value
          };
        })
    );
    return files.sort((a, b) => b.mtime.localeCompare(a.mtime));
  } catch {
    return [];
  }
}

export async function GET() {
  const [objects, receipts] = await Promise.all([
    readJsonFiles(OBJECTS_DIR),
    readJsonFiles(RECEIPTS_DIR)
  ]);
  const receiptByObject = new Map(
    receipts.map((receipt) => [receipt.value?.object_id, receipt])
  );

  return NextResponse.json({
    ok: true,
    count: objects.length,
    receipt_count: receipts.length,
    objects: objects.map((object) => ({
      path: object.path,
      mtime: object.mtime,
      object: object.value,
      stage: stageForObject(object.value),
      questions: questionsForObject(object.value),
      receipt: receiptByObject.get(object.value?.id)?.value ?? null,
      receipt_path: receiptByObject.get(object.value?.id)?.path ?? null
    }))
  });
}
