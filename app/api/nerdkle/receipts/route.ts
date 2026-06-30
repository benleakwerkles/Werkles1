import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { RECEIPTS_DIR, repoRelative } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readReceipts() {
  try {
    const names = await fs.readdir(RECEIPTS_DIR);
    const receipts = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const filePath = path.join(RECEIPTS_DIR, name);
          const stat = await fs.stat(filePath);
          return {
            path: repoRelative(filePath),
            mtime: stat.mtime.toISOString(),
            receipt: JSON.parse(await fs.readFile(filePath, "utf8"))
          };
        })
    );
    return receipts.sort((a, b) => b.mtime.localeCompare(a.mtime));
  } catch {
    return [];
  }
}

export async function GET() {
  const receipts = await readReceipts();
  return NextResponse.json({
    ok: true,
    count: receipts.length,
    execution_receipts: receipts.filter((item) => String(item.receipt?.id ?? "").startsWith("execution_receipt_")).length,
    receipts
  });
}
