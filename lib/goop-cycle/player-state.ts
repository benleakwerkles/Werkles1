import { initialQuestProgress } from "./quests";
import { createStarterSummon } from "./summons";
import type { LifeSkillId, PlayerGoopState, ReligionId, ReligionStanding } from "./types";
import { lifeSkills, xpToLevel } from "./life-skills";
import { applyWarPoints } from "./religion-war";

const STORAGE_KEY = "werkles-goop-cycle-preview-v1";

export function createInitialPlayerState(religionId: ReligionId | null = null): PlayerGoopState {
  return {
    religionId,
    summons: [createStarterSummon(0, religionId), createStarterSummon(2, religionId)],
    skills: Object.fromEntries(lifeSkills.map((s) => [s.id, { level: 1, xp: 0 }])) as PlayerGoopState["skills"],
    quests: initialQuestProgress(),
    warPointsContributed: 0,
    fusionCatalysts: 1
  };
}

export function loadPlayerState(): PlayerGoopState {
  if (typeof window === "undefined") return createInitialPlayerState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialPlayerState();
    return JSON.parse(raw) as PlayerGoopState;
  } catch {
    return createInitialPlayerState();
  }
}

export function savePlayerState(state: PlayerGoopState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function skillLevelsMap(state: PlayerGoopState): Partial<Record<LifeSkillId, number>> {
  return Object.fromEntries(
    Object.entries(state.skills).map(([id, row]) => [id, xpToLevel(row.xp)])
  ) as Partial<Record<LifeSkillId, number>>;
}

export function addSkillXp(state: PlayerGoopState, skillId: LifeSkillId, xp: number): PlayerGoopState {
  const row = state.skills[skillId];
  const nextXp = row.xp + xp;
  return {
    ...state,
    skills: {
      ...state.skills,
      [skillId]: { xp: nextXp, level: xpToLevel(nextXp) }
    }
  };
}

export function bumpQuest(
  state: PlayerGoopState,
  questId: string,
  amount = 1
): PlayerGoopState {
  const quests = state.quests.map((q) => {
    if (q.questId !== questId || q.status === "complete" || q.status === "claimed") return q;
    const progress = Math.min(q.target, q.progress + amount);
    const status = progress >= q.target ? ("complete" as const) : q.status;
    return { ...q, progress, status };
  });
  return { ...state, quests };
}

export function unlockNextQuests(state: PlayerGoopState): PlayerGoopState {
  const completed = new Set(state.quests.filter((q) => q.status === "complete" || q.status === "claimed").map((q) => q.questId));
  const unlockMap: Record<string, string[]> = {
    lamp_sweep: ["azure_nap", "marginal_heresy"],
    azure_nap: ["rivet_rosary"],
    rivet_rosary: ["religion_rumble"],
    marginal_heresy: ["goop_stir"],
    cycle_pledge: ["knock_script"]
  };
  const toUnlock = new Set<string>();
  for (const [parent, children] of Object.entries(unlockMap)) {
    if (completed.has(parent)) children.forEach((c) => toUnlock.add(c));
  }
  const quests = state.quests.map((q) =>
    q.status === "locked" && toUnlock.has(q.questId) ? { ...q, status: "active" as const } : q
  );
  return { ...state, quests };
}

export function contributeWarPoints(
  state: PlayerGoopState,
  standings: ReligionStanding[],
  points: number,
  source: "duel" | "quest"
): { state: PlayerGoopState; standings: ReligionStanding[] } {
  if (!state.religionId) return { state, standings };
  return {
    state: { ...state, warPointsContributed: state.warPointsContributed + points },
    standings: applyWarPoints(standings, state.religionId, points, source)
  };
}
