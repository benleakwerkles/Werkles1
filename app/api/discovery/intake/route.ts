import { NextRequest, NextResponse } from "next/server";
import {
  normalizeDiscoveryIntake,
  validateDiscoveryIntake,
  writeDiscoveryIntake
} from "@/lib/discovery/concierge";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = normalizeDiscoveryIntake(await request.json());
    const missing = validateDiscoveryIntake(input);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Required intake fields are missing.",
          missing
        },
        { status: 400 }
      );
    }

    const record = await writeDiscoveryIntake(input);

    return NextResponse.json({
      success: true,
      intake_id: record.user_id,
      state: record.state,
      record_path: record.record_path,
      meaning: "Received for human review. No automated matching, scoring, or recommendation has been performed."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save discovery intake.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
