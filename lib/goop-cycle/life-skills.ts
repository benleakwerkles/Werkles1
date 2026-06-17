import type { LifeSkill, LifeSkillId } from "./types";

export const lifeSkills: LifeSkill[] = [
  {
    id: "foraging",
    name: "Foraging",
    blurb: "Scrape rare reagents from the Den scrap tray.",
    duelStat: "ward",
    fusionTraitPool: ["mosshide", "sporekin", "trailnose"]
  },
  {
    id: "smithing",
    name: "Smithing",
    blurb: "Beat copper till it remembers shape.",
    duelStat: "might",
    fusionTraitPool: ["rivetback", "brassknuckle", "emberplate"]
  },
  {
    id: "lore",
    name: "Lore",
    blurb: "Read the marginalia on forbidden blueprints.",
    duelStat: "wit",
    fusionTraitPool: ["glyphmaw", "codextail", "inkveil"]
  },
  {
    id: "rhetoric",
    name: "Rhetoric",
    blurb: "Win duels before blades leave scabbards.",
    duelStat: "wit",
    fusionTraitPool: ["silver tongue", "crowdcall", "oathbind"]
  },
  {
    id: "beastkeeping",
    name: "Beastkeeping",
    blurb: "Raise summons like Azure Dreams — with love and odd diets.",
    duelStat: "flux",
    fusionTraitPool: ["packsense", "denburrow", "lamployal"]
  },
  {
    id: "alchemy",
    name: "Alchemy",
    blurb: "Stir goop until it chooses a color.",
    duelStat: "flux",
    fusionTraitPool: ["goopskin", "vialheart", "catalystmaw"]
  }
];

export const lifeSkillById = Object.fromEntries(lifeSkills.map((s) => [s.id, s])) as Record<
  LifeSkillId,
  LifeSkill
>;

export function skillLevelBonus(level: number): number {
  return Math.min(12, level * 0.8);
}

export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 40)) + 1;
}

export function levelXpThreshold(level: number): number {
  return Math.pow(Math.max(1, level - 1), 2) * 40;
}
