import { lifeSkillById } from "./life-skills";
import { chance, hashString, mulberry32, pickOne } from "./rng";
import { clampStat } from "./summons";
import type { LifeSkillId, ReligionId, Summon, SummonStats } from "./types";

const namePrefixes = [
  "Glim",
  "Murk",
  "Brass",
  "Loom",
  "Thrum",
  "Soot",
  "Vial",
  "Knurl",
  "Pith",
  "Wisp"
];

const nameSuffixes = [
  "ling",
  "maw",
  "coil",
  "wight",
  "pup",
  "scribe",
  "anvil",
  "choir",
  "goop",
  "knocker"
];

export type FusionInput = {
  parentA: Summon;
  parentB: Summon;
  religionId: ReligionId | null;
  skillLevels: Partial<Record<LifeSkillId, number>>;
  catalystBonus?: number;
};

export function fuseSummons(input: FusionInput): Summon {
  const { parentA, parentB, religionId, skillLevels, catalystBonus = 0 } = input;
  if (parentA.id === parentB.id) {
    throw new Error("Cannot fuse a summon with itself.");
  }

  const seed = hashString(`${parentA.essence}|${parentB.essence}|${parentA.id}|${parentB.id}`);
  const beastLevel = skillLevels.beastkeeping ?? 1;
  const alchemyLevel = skillLevels.alchemy ?? 1;
  const mutationBoost = catalystBonus * 4 + beastLevel * 0.6 + alchemyLevel * 0.4;

  const stats = blendStats(parentA.stats, parentB.stats, seed, mutationBoost);
  const traits = inheritTraits(parentA, parentB, seed, skillLevels);
  const generation = Math.max(parentA.generation, parentB.generation) + 1;
  const essence = `fuse:${parentA.essence}+${parentB.essence}:g${generation}`;
  const id = `offspring-${hashString(essence).toString(16)}`;

  return {
    id,
    name: uniqueFusionName(parentA, parentB, seed),
    essence,
    generation,
    stats,
    traits,
    parentAId: parentA.id,
    parentBId: parentB.id,
    level: 1,
    xp: 0,
    religionAffinity: religionId
  };
}

function blendStats(a: SummonStats, b: SummonStats, seed: number, mutationBoost: number): SummonStats {
  const rand = mulberry32(seed);
  const keys: (keyof SummonStats)[] = ["might", "wit", "ward", "flux"];
  const out = {} as SummonStats;
  for (const key of keys) {
    const avg = (a[key] + b[key]) / 2;
    const swing = (rand() - 0.35) * (10 + mutationBoost);
    const spike = chance(seed + key.length, 0.12 + mutationBoost * 0.01) ? 8 + rand() * 10 : 0;
    out[key] = clampStat(Math.round(avg + swing + spike));
  }
  return out;
}

function inheritTraits(
  parentA: Summon,
  parentB: Summon,
  seed: number,
  skillLevels: Partial<Record<LifeSkillId, number>>
): string[] {
  const pool = [...new Set([...parentA.traits, ...parentB.traits])];
  const picked: string[] = [];
  const rand = mulberry32(seed ^ 0xabc);

  for (const trait of pool) {
    if (rand() > 0.45) picked.push(trait);
  }

  if (picked.length < 2) {
    picked.push(...pool.slice(0, 2 - picked.length));
  }

  if (chance(seed ^ 99, 0.22 + (skillLevels.alchemy ?? 1) * 0.02)) {
    const mutantPools = Object.values(lifeSkillById).flatMap((s) => s.fusionTraitPool);
    const mutant = pickOne(mutantPools, seed ^ 1234);
    if (!picked.includes(mutant)) picked.push(mutant);
  }

  return [...new Set(picked)].slice(0, 5);
}

function uniqueFusionName(parentA: Summon, parentB: Summon, seed: number): string {
  const prefix = pickOne(namePrefixes, seed);
  const suffix = pickOne(nameSuffixes, seed ^ 0x9e);
  const tag = hashString(`${parentA.name}${parentB.name}${seed}`).toString(36).slice(0, 4);
  return `${prefix}${suffix}-${tag}`;
}

export function fusionPreviewLine(parentA: Summon, parentB: Summon): string {
  return `${parentA.name} × ${parentB.name} → new essence thread (gen ${Math.max(parentA.generation, parentB.generation) + 1})`;
}
