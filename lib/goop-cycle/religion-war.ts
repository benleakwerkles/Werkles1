import { religions } from "./religions";
import type { GoopCycle, ReligionId, ReligionStanding } from "./types";

const CYCLE_DAYS = 14;

const goopThemes = [
  { theme: "Amber Slag Goop", prize: "Brass Halo frame + +5% fusion mutation" },
  { theme: "Violet Spore Goop", prize: "Inkveil dossier skin + lore quest double XP" },
  { theme: "Teal Brine Goop", prize: "Salt Psalm ward charm + tide duel opener" },
  { theme: "Copper Mud Goop", prize: "Mirror Debt trick card + rhetoric bonus" },
  { theme: "Moss Heart Goop", prize: "Loam Oath seed summon + root ward bump" },
  { theme: "Coil Ash Goop", prize: "Spark Choir flux coil + unique trait unlock" }
];

export function getCurrentCycle(now = new Date()): GoopCycle {
  const epoch = Date.UTC(2026, 0, 5);
  const ms = now.getTime() - epoch;
  const dayIndex = Math.floor(ms / 86_400_000);
  const cycleIndex = Math.floor(dayIndex / CYCLE_DAYS);
  const cycleStartDay = cycleIndex * CYCLE_DAYS;
  const startsAt = new Date(epoch + cycleStartDay * 86_400_000);
  const endsAt = new Date(startsAt.getTime() + CYCLE_DAYS * 86_400_000);
  const themePack = goopThemes[cycleIndex % goopThemes.length]!;

  return {
    cycleId: `goop-${cycleIndex}`,
    cycleIndex,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    goopTheme: themePack.theme,
    goopPrize: themePack.prize,
    standings: freshStandings(),
    freshStartApplied: true
  };
}

export function freshStandings(): ReligionStanding[] {
  return religions.map((r) => ({
    religionId: r.id,
    points: 0,
    duelsWon: 0,
    questsClaimed: 0
  }));
}

export function applyWarPoints(
  standings: ReligionStanding[],
  religionId: ReligionId,
  points: number,
  source: "duel" | "quest"
): ReligionStanding[] {
  return standings.map((row) => {
    if (row.religionId !== religionId) return row;
    return {
      ...row,
      points: row.points + points,
      duelsWon: source === "duel" ? row.duelsWon + 1 : row.duelsWon,
      questsClaimed: source === "quest" ? row.questsClaimed + 1 : row.questsClaimed
    };
  });
}

export function cycleLeader(standings: ReligionStanding[]): ReligionStanding | null {
  if (!standings.length) return null;
  return [...standings].sort((a, b) => b.points - a.points)[0] ?? null;
}

export function daysRemainingInCycle(now = new Date()): number {
  const cycle = getCurrentCycle(now);
  const end = new Date(cycle.endsAt).getTime();
  return Math.max(0, Math.ceil((end - now.getTime()) / 86_400_000));
}

export function mergeCycleStandings(
  base: ReligionStanding[],
  delta: ReligionStanding[]
): ReligionStanding[] {
  const map = new Map(base.map((r) => [r.religionId, { ...r }]));
  for (const row of delta) {
    const current = map.get(row.religionId);
    if (!current) {
      map.set(row.religionId, { ...row });
      continue;
    }
    current.points += row.points;
    current.duelsWon += row.duelsWon;
    current.questsClaimed += row.questsClaimed;
  }
  return religions.map((r) => map.get(r.id) ?? { religionId: r.id, points: 0, duelsWon: 0, questsClaimed: 0 });
}
