import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { OBJECTS_DIR, repoRelative, stageForObject } from "../_lib";
import type { NerdkleObject } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "into", "want", "bring", "world", "object", "receipt"
]);

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
  );
}

function overlap(left: Set<string>, right: Set<string>) {
  const shared = [...left].filter((word) => right.has(word));
  const denominator = Math.max(1, Math.min(left.size, right.size));
  return {
    shared,
    score: Math.round((shared.length / denominator) * 100)
  };
}

async function readObjects() {
  try {
    const names = await fs.readdir(OBJECTS_DIR);
    return Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const filePath = path.join(OBJECTS_DIR, name);
          const object = JSON.parse(await fs.readFile(filePath, "utf8")) as NerdkleObject;
          return {
            path: repoRelative(filePath),
            object,
            stage: stageForObject(object),
            tokens: tokens(object.operator_intent)
          };
        })
    );
  } catch {
    return [];
  }
}

export async function GET() {
  const objects = await readObjects();
  const duplicates = [];

  for (let leftIndex = 0; leftIndex < objects.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < objects.length; rightIndex += 1) {
      const left = objects[leftIndex];
      const right = objects[rightIndex];
      if (!left || !right) continue;
      const result = overlap(left.tokens, right.tokens);
      if (result.score >= 60 && result.shared.length >= 3) {
        duplicates.push({
          score: result.score,
          shared_terms: result.shared,
          left: {
            object_id: left.object.id,
            object_path: left.path,
            stage: left.stage,
            execution_owner: left.object.execution_owner
          },
          right: {
            object_id: right.object.id,
            object_path: right.path,
            stage: right.stage,
            execution_owner: right.object.execution_owner
          }
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    count: duplicates.length,
    duplicates
  });
}
