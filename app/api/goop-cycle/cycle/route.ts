import { NextResponse } from "next/server";
import { cycleLeader, daysRemainingInCycle, getCurrentCycle } from "@/lib/goop-cycle/religion-war";
import { religions } from "@/lib/goop-cycle/religions";

export async function GET() {
  const cycle = getCurrentCycle();
  const leader = cycleLeader(cycle.standings);

  return NextResponse.json({
    cycle,
    daysRemaining: daysRemainingInCycle(),
    religions,
    leader,
    draft: true,
    note: "Biweekly fresh start — all religions reset to 0 at cycle boundary. Prizes follow the active goop theme."
  });
}
