import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const templates = [
  {
    id: "build-proof",
    label: "Build a proof",
    intent: "I want to bring a small local proof into the world for a specific user by tomorrow, with no spend, and a receipt showing the artifact path and verification result."
  },
  {
    id: "handoff-work",
    label: "Handoff work",
    intent: "I want to turn this messy idea into a handoff packet for the right execution owner, with unresolved fields named, human gates called out, and a receipt required when the work returns."
  },
  {
    id: "ship-page",
    label: "Shape a page",
    intent: "I want to create a simple user-facing page for a named audience this week, using existing project patterns, with visual proof and a completion receipt before anything is published."
  },
  {
    id: "audit-risk",
    label: "Audit risk",
    intent: "I want to audit a workflow for security, trust, or compliance risk for the operator, with clear blockers, required human gates, and evidence of what was checked."
  }
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    count: templates.length,
    templates
  });
}
