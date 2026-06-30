import type { Religion, ReligionId } from "./types";

export const religions: Religion[] = [
  {
    id: "ember_covenant",
    name: "Ember Covenant",
    motto: "What breaks can be re-forged.",
    magicSchool: "forge",
    magicName: "Hearthbrand",
    color: "#e07a3a",
    duelBonus: "might",
    weakAgainst: "tide",
    strongAgainst: "root"
  },
  {
    id: "tide_canticle",
    name: "Tide Canticle",
    motto: "Return what was borrowed.",
    magicSchool: "tide",
    magicName: "Salt Psalm",
    color: "#18c5ae",
    duelBonus: "ward",
    weakAgainst: "root",
    strongAgainst: "forge"
  },
  {
    id: "copper_veil",
    name: "Copper Veil",
    motto: "Truth wears a mask first.",
    magicSchool: "veil",
    magicName: "Mirror Debt",
    color: "#c08b52",
    duelBonus: "wit",
    weakAgainst: "spark",
    strongAgainst: "tide"
  },
  {
    id: "root_compact",
    name: "Root Compact",
    motto: "Grow slow, hold fast.",
    magicSchool: "root",
    magicName: "Loam Oath",
    color: "#5fd178",
    duelBonus: "ward",
    weakAgainst: "forge",
    strongAgainst: "veil"
  },
  {
    id: "spark_choir",
    name: "Spark Choir",
    motto: "Invention is prayer with smoke.",
    magicSchool: "spark",
    magicName: "Coil Cant",
    color: "#672eed",
    duelBonus: "flux",
    weakAgainst: "veil",
    strongAgainst: "root"
  }
];

export const religionById = Object.fromEntries(religions.map((r) => [r.id, r])) as Record<
  ReligionId,
  Religion
>;

export function magicAdvantage(attacker: Religion, defender: Religion): number {
  if (attacker.strongAgainst === defender.magicSchool) return 1.15;
  if (attacker.weakAgainst === defender.magicSchool) return 0.88;
  return 1;
}
