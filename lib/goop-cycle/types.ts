/** Goop Cycle — draft PvP religion war + summon fusion. Review-only until schema gate. */

export type ReligionId =
  | "ember_covenant"
  | "tide_canticle"
  | "copper_veil"
  | "root_compact"
  | "spark_choir";

export type LifeSkillId =
  | "foraging"
  | "smithing"
  | "lore"
  | "rhetoric"
  | "beastkeeping"
  | "alchemy";

export type MagicSchool = "forge" | "tide" | "veil" | "root" | "spark";

export type QuestStatus = "locked" | "active" | "complete" | "claimed";

export type SummonStats = {
  might: number;
  wit: number;
  ward: number;
  flux: number;
};

export type Summon = {
  id: string;
  name: string;
  essence: string;
  generation: number;
  stats: SummonStats;
  traits: string[];
  parentAId: string | null;
  parentBId: string | null;
  level: number;
  xp: number;
  religionAffinity: ReligionId | null;
};

export type Religion = {
  id: ReligionId;
  name: string;
  motto: string;
  magicSchool: MagicSchool;
  magicName: string;
  color: string;
  duelBonus: keyof SummonStats;
  weakAgainst: MagicSchool;
  strongAgainst: MagicSchool;
};

export type LifeSkill = {
  id: LifeSkillId;
  name: string;
  blurb: string;
  duelStat: keyof SummonStats;
  fusionTraitPool: string[];
};

export type QuestReward = {
  warPoints?: number;
  skillXp?: Partial<Record<LifeSkillId, number>>;
  fusionCatalyst?: number;
};

export type Quest = {
  id: string;
  title: string;
  blurb: string;
  skill: LifeSkillId;
  requirement: string;
  rewards: QuestReward;
  warContribution: number;
};

export type QuestProgress = {
  questId: string;
  status: QuestStatus;
  progress: number;
  target: number;
};

export type DuelResult = {
  winnerSummonId: string;
  loserSummonId: string;
  rounds: DuelRound[];
  warPointsAwarded: number;
  log: string[];
};

export type DuelRound = {
  round: number;
  attackerId: string;
  damage: number;
  magicClash: string;
  remainingHp: { a: number; b: number };
};

export type ReligionStanding = {
  religionId: ReligionId;
  points: number;
  duelsWon: number;
  questsClaimed: number;
};

export type GoopCycle = {
  cycleId: string;
  cycleIndex: number;
  startsAt: string;
  endsAt: string;
  goopTheme: string;
  goopPrize: string;
  standings: ReligionStanding[];
  freshStartApplied: boolean;
};

export type PlayerGoopState = {
  religionId: ReligionId | null;
  heraldSeed?: string;
  summons: Summon[];
  skills: Record<LifeSkillId, { level: number; xp: number }>;
  quests: QuestProgress[];
  warPointsContributed: number;
  fusionCatalysts: number;
};
