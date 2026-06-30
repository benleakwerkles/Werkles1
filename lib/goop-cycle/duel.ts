import { magicAdvantage, religionById } from "./religions";
import { skillLevelBonus } from "./life-skills";
import { mulberry32, hashString } from "./rng";
import { grantSummonXp } from "./summons";
import type { DuelResult, LifeSkillId, ReligionId, Summon } from "./types";

export type DuelInput = {
  summonA: Summon;
  summonB: Summon;
  religionA: ReligionId;
  religionB: ReligionId;
  skillLevelsA: Partial<Record<LifeSkillId, number>>;
  skillLevelsB: Partial<Record<LifeSkillId, number>>;
  seed?: string;
};

export function resolveDuel(input: DuelInput): DuelResult {
  const {
    summonA,
    summonB,
    religionA,
    religionB,
    skillLevelsA,
    skillLevelsB,
    seed = `${summonA.id}:${summonB.id}:${Date.now()}`
  } = input;

  const religionAtt = religionById[religionA];
  const religionDef = religionById[religionB];
  const magicMod = magicAdvantage(religionAtt, religionById[religionB]);
  const magicModB = magicAdvantage(religionById[religionB], religionAtt);

  const bonusA = religionStatBonus(summonA, religionAtt.duelBonus, skillLevelsA);
  const bonusB = religionStatBonus(summonB, religionDef.duelBonus, skillLevelsB);

  let hpA = 70 + summonA.stats.ward + bonusA.ward;
  let hpB = 70 + summonB.stats.ward + bonusB.ward;
  const rounds: DuelResult["rounds"] = [];
  const log: string[] = [
    `${summonA.name} (${religionAtt.magicName}) vs ${summonB.name} (${religionDef.magicName})`
  ];

  const rand = mulberry32(hashString(seed));
  let attackerIsA = summonA.stats.wit + bonusA.wit >= summonB.stats.wit + bonusB.wit;

  for (let round = 1; round <= 6 && hpA > 0 && hpB > 0; round += 1) {
    const atk = attackerIsA ? summonA : summonB;
    const def = attackerIsA ? summonB : summonA;
    const atkBonus = attackerIsA ? bonusA : bonusB;
    const defBonus = attackerIsA ? bonusB : bonusA;
    const atkRel = attackerIsA ? religionAtt : religionDef;
    const defRel = attackerIsA ? religionDef : religionAtt;
    const magic = attackerIsA ? magicMod : magicModB;

    const strikeStat = atk.stats.might + atkBonus.might + atk.stats.flux * 0.35;
    const guardStat = def.stats.ward + defBonus.ward + def.stats.wit * 0.2;
    const raw = Math.max(4, strikeStat * magic - guardStat * 0.55);
    const damage = Math.round(raw * (0.85 + rand() * 0.3));

    if (attackerIsA) hpB = Math.max(0, hpB - damage);
    else hpA = Math.max(0, hpA - damage);

    const magicClash = `${atkRel.magicName} cuts ${defRel.magicSchool} for ×${magic.toFixed(2)}`;
    log.push(`Round ${round}: ${atk.name} hits ${def.name} for ${damage} (${magicClash})`);

    rounds.push({
      round,
      attackerId: atk.id,
      damage,
      magicClash,
      remainingHp: { a: hpA, b: hpB }
    });

    attackerIsA = !attackerIsA;
  }

  const aWins = hpA >= hpB;
  const winnerSummonId = aWins ? summonA.id : summonB.id;
  const loserSummonId = aWins ? summonB.id : summonA.id;
  const margin = Math.abs(hpA - hpB);
  const warPointsAwarded = 10 + Math.min(15, Math.round(margin / 4));

  log.push(`Victor: ${aWins ? summonA.name : summonB.name} (+${warPointsAwarded} war points)`);

  return {
    winnerSummonId,
    loserSummonId,
    rounds,
    warPointsAwarded,
    log
  };
}

function religionStatBonus(
  summon: Summon,
  favored: keyof Summon["stats"],
  skills: Partial<Record<LifeSkillId, number>>
) {
  const might = skillLevelBonus(skills.smithing ?? 1);
  const wit = skillLevelBonus(skills.rhetoric ?? 1) + skillLevelBonus(skills.lore ?? 1) * 0.5;
  const ward = skillLevelBonus(skills.foraging ?? 1);
  const flux = skillLevelBonus(skills.beastkeeping ?? 1) + skillLevelBonus(skills.alchemy ?? 1) * 0.5;
  const religionBump = favored === "might" ? might : favored === "wit" ? wit : favored === "ward" ? ward : flux;
  return {
    might: might + (favored === "might" ? religionBump : 0),
    wit: wit + (favored === "wit" ? religionBump : 0),
    ward: ward + (favored === "ward" ? religionBump : 0),
    flux: flux + (favored === "flux" ? religionBump : 0)
  };
}

export function applyDuelXp(summon: Summon, won: boolean): Summon {
  return grantSummonXp(summon, won ? 55 : 28);
}
