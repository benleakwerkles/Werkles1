import type { ReligionId, Summon, SummonStats } from "./types";
import { mulberry32, hashString } from "./rng";

export const starterSpecies = [
  { name: "Candle Mole", traits: ["lamployal", "denburrow"] },
  { name: "Paper Wren", traits: ["inkveil", "trailnose"] },
  { name: "Brass Tick", traits: ["rivetback", "emberplate"] },
  { name: "Goop Kit", traits: ["goopskin", "sporekin"] },
  { name: "Coil Mouse", traits: ["catalystmaw", "glyphmaw"] }
] as const;

const baseStats: SummonStats = { might: 42, wit: 38, ward: 40, flux: 36 };

export function createStarterSummon(index: number, religionId: ReligionId | null = null): Summon {
  const species = starterSpecies[index % starterSpecies.length];
  const id = `starter-${index}-${hashString(species.name).toString(16).slice(0, 8)}`;
  return {
    id,
    name: species.name,
    essence: `seed:${species.name}`,
    generation: 0,
    stats: jitterStats(baseStats, hashString(id)),
    traits: [...species.traits],
    parentAId: null,
    parentBId: null,
    level: 1,
    xp: 0,
    religionAffinity: religionId
  };
}

export function jitterStats(stats: SummonStats, seed: number): SummonStats {
  const rand = mulberry32(seed);
  const jitter = () => Math.round((rand() - 0.5) * 14);
  return {
    might: clampStat(stats.might + jitter()),
    wit: clampStat(stats.wit + jitter()),
    ward: clampStat(stats.ward + jitter()),
    flux: clampStat(stats.flux + jitter())
  };
}

export function clampStat(n: number): number {
  return Math.max(8, Math.min(99, n));
}

export function summonCombatPower(summon: Summon): number {
  const { might, wit, ward, flux } = summon.stats;
  return might * 0.35 + wit * 0.2 + ward * 0.25 + flux * 0.2 + summon.level * 2.2;
}

export function grantSummonXp(summon: Summon, xp: number): Summon {
  const nextXp = summon.xp + xp;
  const nextLevel = Math.floor(nextXp / 80) + 1;
  const levelDelta = nextLevel - summon.level;
  const stats =
    levelDelta > 0
      ? {
          might: clampStat(summon.stats.might + levelDelta * 2),
          wit: clampStat(summon.stats.wit + levelDelta * 2),
          ward: clampStat(summon.stats.ward + levelDelta * 2),
          flux: clampStat(summon.stats.flux + levelDelta * 2)
        }
      : summon.stats;
  return { ...summon, xp: nextXp, level: nextLevel, stats };
}
