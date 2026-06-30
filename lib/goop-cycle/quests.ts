import type { Quest } from "./types";

export const questCatalog: Quest[] = [
  {
    id: "lamp_sweep",
    title: "Lamp Sweep",
    blurb: "Clear three scrap piles under the desk lamp.",
    skill: "foraging",
    requirement: "Complete 3 foraging actions in the Den.",
    rewards: { warPoints: 8, skillXp: { foraging: 35 } },
    warContribution: 8
  },
  {
    id: "rivet_rosary",
    title: "Rivet Rosary",
    blurb: "Smith five brass tabs for the alcove frame.",
    skill: "smithing",
    requirement: "Win 1 duel using a summon with the rivetback trait.",
    rewards: { warPoints: 12, skillXp: { smithing: 50 }, fusionCatalyst: 1 },
    warContribution: 12
  },
  {
    id: "marginal_heresy",
    title: "Marginal Heresy",
    blurb: "Decode a footnote only your religion was meant to miss.",
    skill: "lore",
    requirement: "Inspect 2 unique fused summons.",
    rewards: { warPoints: 10, skillXp: { lore: 45 } },
    warContribution: 10
  },
  {
    id: "knock_script",
    title: "Knock Script",
    blurb: "Draft intro copy that sounds like a blessing, not a pitch.",
    skill: "rhetoric",
    requirement: "Win a duel by wit advantage 2 rounds in a row.",
    rewards: { warPoints: 14, skillXp: { rhetoric: 55 } },
    warContribution: 14
  },
  {
    id: "azure_nap",
    title: "Azure Nap",
    blurb: "Let two summons dream together in the fusion crib.",
    skill: "beastkeeping",
    requirement: "Fuse 1 new unique offspring.",
    rewards: { warPoints: 16, skillXp: { beastkeeping: 60 }, fusionCatalyst: 1 },
    warContribution: 16
  },
  {
    id: "goop_stir",
    title: "Goop Stir",
    blurb: "Agitate the cycle vat until it reveals this fortnight's hue.",
    skill: "alchemy",
    requirement: "Contribute 25 war points in the current cycle.",
    rewards: { warPoints: 20, skillXp: { alchemy: 70 }, fusionCatalyst: 2 },
    warContribution: 20
  },
  {
    id: "religion_rumble",
    title: "Religion Rumble",
    blurb: "Fight for your faith in the rolling war.",
    skill: "smithing",
    requirement: "Win 3 duels this cycle.",
    rewards: { warPoints: 30, skillXp: { smithing: 40, rhetoric: 40 } },
    warContribution: 30
  },
  {
    id: "cycle_pledge",
    title: "Cycle Pledge",
    blurb: "Swear anew when the goop resets — everyone starts fresh.",
    skill: "lore",
    requirement: "Join a religion at cycle start.",
    rewards: { warPoints: 5, skillXp: { lore: 25 } },
    warContribution: 5
  }
];

export const questById = Object.fromEntries(questCatalog.map((q) => [q.id, q])) as Record<string, Quest>;

export function initialQuestProgress() {
  return questCatalog.map((q) => ({
    questId: q.id,
    status: q.id === "cycle_pledge" || q.id === "lamp_sweep" ? ("active" as const) : ("locked" as const),
    progress: 0,
    target: questTarget(q.id)
  }));
}

export function questTarget(questId: string): number {
  switch (questId) {
    case "lamp_sweep":
      return 3;
    case "rivet_rosary":
      return 1;
    case "marginal_heresy":
      return 2;
    case "knock_script":
      return 1;
    case "azure_nap":
      return 1;
    case "goop_stir":
      return 25;
    case "religion_rumble":
      return 3;
    case "cycle_pledge":
      return 1;
    default:
      return 1;
  }
}
