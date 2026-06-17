"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyDuelXp,
  bumpQuest,
  contributeWarPoints,
  createInitialPlayerState,
  fuseSummons,
  loadPlayerState,
  questCatalog,
  religionById,
  religions,
  resolveDuel,
  savePlayerState,
  skillLevelsMap,
  unlockNextQuests,
  addSkillXp,
  getCurrentCycle,
  daysRemainingInCycle,
  cycleLeader,
  createStarterSummon,
  type GoopCycle,
  type LifeSkillId,
  type PlayerGoopState,
  type ReligionId,
  type Summon
} from "@/lib/goop-cycle";

function sparringShade(religionId: ReligionId): Summon {
  const shade = createStarterSummon(4, religionId);
  return {
    ...shade,
    id: `shade-${religionId}`,
    name: `${religionById[religionId].name} Shade`,
    level: 3,
    stats: {
      might: 48,
      wit: 44,
      ward: 46,
      flux: 50
    }
  };
}

export function GoopCycleScene() {
  const [player, setPlayer] = useState<PlayerGoopState>(() => createInitialPlayerState());
  const [cycle, setCycle] = useState<GoopCycle>(() => getCurrentCycle());
  const [standings, setStandings] = useState(() => getCurrentCycle().standings);
  const [fusionA, setFusionA] = useState<string>("");
  const [fusionB, setFusionB] = useState<string>("");
  const [duelA, setDuelA] = useState<string>("");
  const [opponentReligion, setOpponentReligion] = useState<ReligionId>("tide_canticle");
  const [log, setLog] = useState<string[]>(["Welcome to the Goop Cycle — pick a religion, quest, fuse, duel."]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPlayer(loadPlayerState());
    setHydrated(true);
    void fetch("/api/goop-cycle/cycle")
      .then((r) => r.json())
      .then((data) => {
        if (data?.cycle) setCycle(data.cycle as GoopCycle);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePlayerState(player);
  }, [player, hydrated]);

  const skills = useMemo(() => skillLevelsMap(player), [player]);
  const leader = useMemo(() => cycleLeader(standings), [standings]);

  function pushLog(lines: string[]) {
    setLog((prev) => [...lines, ...prev].slice(0, 12));
  }

  function joinReligion(religionId: ReligionId) {
    setPlayer((prev) => {
      const next = unlockNextQuests(
        bumpQuest({ ...prev, religionId }, "cycle_pledge", 1)
      );
      return next;
    });
    pushLog([`Pledged to ${religionById[religionId].name}. Cycle fresh start acknowledged.`]);
  }

  function forageScrap() {
    setPlayer((prev) => unlockNextQuests(bumpQuest(addSkillXp(prev, "foraging", 12), "lamp_sweep", 1)));
    pushLog(["Foraged scrap under the lamp (+foraging XP)."]);
  }

  function runFusion() {
    if (!fusionA || !fusionB || fusionA === fusionB) {
      pushLog(["Pick two different summons for the fusion crib."]);
      return;
    }
    const parentA = player.summons.find((s) => s.id === fusionA);
    const parentB = player.summons.find((s) => s.id === fusionB);
    if (!parentA || !parentB) return;

    const catalyst = player.fusionCatalysts > 0 ? 1 : 0;
    const offspring = fuseSummons({
      parentA,
      parentB,
      religionId: player.religionId,
      skillLevels: skills,
      catalystBonus: catalyst
    });

    setPlayer((prev) => {
      let next = {
        ...prev,
        summons: [...prev.summons, offspring],
        fusionCatalysts: Math.max(0, prev.fusionCatalysts - catalyst)
      };
      next = addSkillXp(next, "beastkeeping", 40);
      next = addSkillXp(next, "alchemy", 20);
      next = unlockNextQuests(bumpQuest(next, "azure_nap", 1));
      next = unlockNextQuests(bumpQuest(next, "marginal_heresy", 1));
      return next;
    });
    pushLog([`Azure fusion: ${offspring.name} born (gen ${offspring.generation}). Traits: ${offspring.traits.join(", ")}`]);
  }

  function runDuel() {
    if (!player.religionId) {
      pushLog(["Join a religion before dueling for war points."]);
      return;
    }
    const summon = player.summons.find((s) => s.id === duelA) ?? player.summons[0];
    if (!summon) return;

    const foe = sparringShade(opponentReligion);
    const result = resolveDuel({
      summonA: summon,
      summonB: foe,
      religionA: player.religionId,
      religionB: opponentReligion,
      skillLevelsA: skills,
      skillLevelsB: { smithing: 2, rhetoric: 2 },
      seed: `${summon.id}:${foe.id}:${cycle.cycleId}`
    });

    const won = result.winnerSummonId === summon.id;
    const { state: nextPlayer, standings: nextStandings } = contributeWarPoints(
      player,
      standings,
      won ? result.warPointsAwarded : Math.max(3, Math.round(result.warPointsAwarded * 0.35)),
      "duel"
    );

    const updatedSummons = nextPlayer.summons.map((s) =>
      s.id === summon.id ? applyDuelXp(s, won) : s
    );

    let patched = { ...nextPlayer, summons: updatedSummons };
    patched = addSkillXp(patched, "smithing", won ? 18 : 8);
    patched = addSkillXp(patched, "rhetoric", won ? 12 : 6);
    patched = unlockNextQuests(bumpQuest(patched, "religion_rumble", 1));
    if (won) patched = unlockNextQuests(bumpQuest(patched, "rivet_rosary", 1));

    setPlayer(patched);
    setStandings(nextStandings);
    pushLog(result.log);
  }

  function claimQuest(questId: string) {
    const quest = questCatalog.find((q) => q.id === questId);
    const progress = player.quests.find((q) => q.questId === questId);
    if (!quest || !progress || progress.status !== "complete") return;

    let next = { ...player };
    if (quest.rewards.skillXp) {
      for (const [skill, xp] of Object.entries(quest.rewards.skillXp)) {
        next = addSkillXp(next, skill as LifeSkillId, xp);
      }
    }
    if (quest.rewards.fusionCatalyst) {
      next.fusionCatalysts += quest.rewards.fusionCatalyst;
    }

    const { state, standings: war } = contributeWarPoints(
      next,
      standings,
      quest.rewards.warPoints ?? quest.warContribution,
      "quest"
    );

    const quests = state.quests.map((q) =>
      q.questId === questId ? { ...q, status: "claimed" as const } : q
    );

    setPlayer(unlockNextQuests({ ...state, quests }));
    setStandings(war);
    pushLog([`Claimed quest: ${quest.title}`]);
  }

  return (
    <div className="goop-cycle">
      <header className="goop-cycle__hero">
        <p className="eyebrow">Den game layer · draft review</p>
        <h1>Goop Cycle</h1>
        <p className="goop-cycle__lede">
          Religions duel with distinct magics. Fuse Azure Dreams-style summons, level them in duels, and bank war
          points for biweekly religion battles — every faith starts fresh each cycle.
        </p>
        <div className="goop-cycle__cycle-banner">
          <span className="goop-cycle__goop">{cycle.goopTheme}</span>
          <span>{daysRemainingInCycle()} days left</span>
          <span>Prize: {cycle.goopPrize}</span>
        </div>
      </header>

      <div className="goop-cycle__grid">
        <section className="goop-cycle__panel" aria-labelledby="religion-heading">
          <h2 id="religion-heading">Religions &amp; magics</h2>
          <ul className="goop-cycle__religion-list">
            {religions.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={`goop-cycle__religion${player.religionId === r.id ? " is-active" : ""}`}
                  style={{ "--religion-color": r.color } as React.CSSProperties}
                  onClick={() => joinReligion(r.id)}
                >
                  <strong>{r.name}</strong>
                  <span>{r.magicName}</span>
                  <small>{r.motto}</small>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="goop-cycle__panel" aria-labelledby="war-heading">
          <h2 id="war-heading">Rolling religion war</h2>
          <p className="goop-cycle__hint">Biweekly reset — all religions to 0 at cycle boundary.</p>
          <ol className="goop-cycle__standings">
            {[...standings]
              .sort((a, b) => b.points - a.points)
              .map((row) => (
                <li key={row.religionId}>
                  <span style={{ color: religionById[row.religionId].color }}>
                    {religionById[row.religionId].name}
                  </span>
                  <span>{row.points} pts</span>
                  <small>{row.duelsWon} duel wins</small>
                </li>
              ))}
          </ol>
          {leader ? (
            <p className="goop-cycle__leader">
              Leading: <strong style={{ color: religionById[leader.religionId].color }}>
                {religionById[leader.religionId].name}
              </strong>
            </p>
          ) : null}
        </section>

        <section className="goop-cycle__panel goop-cycle__panel--wide" aria-labelledby="quest-heading">
          <h2 id="quest-heading">Quests</h2>
          <div className="goop-cycle__quest-grid">
            {questCatalog.map((quest) => {
              const progress = player.quests.find((q) => q.questId === quest.id);
              const status = progress?.status ?? "locked";
              return (
                <article key={quest.id} className={`goop-cycle__quest goop-cycle__quest--${status}`}>
                  <h3>{quest.title}</h3>
                  <p>{quest.blurb}</p>
                  <p className="goop-cycle__hint">{quest.requirement}</p>
                  <p className="goop-cycle__hint">
                    {progress?.progress ?? 0}/{progress?.target ?? 1} · +{quest.warContribution} war
                  </p>
                  {status === "complete" ? (
                    <button type="button" className="button button-dark" onClick={() => claimQuest(quest.id)}>
                      Claim
                    </button>
                  ) : (
                    <span className="goop-cycle__tag">{status}</span>
                  )}
                </article>
              );
            })}
          </div>
          <button type="button" className="button button-outline" onClick={forageScrap}>
            Forage scrap (lamp sweep)
          </button>
        </section>

        <section className="goop-cycle__panel" aria-labelledby="skills-heading">
          <h2 id="skills-heading">Life skills</h2>
          <ul className="goop-cycle__skills">
            {Object.entries(player.skills).map(([id, row]) => (
              <li key={id}>
                <strong>{id}</strong>
                <span>Lv {row.level}</span>
                <meter value={row.xp % 40} max={40} />
              </li>
            ))}
          </ul>
          <p className="goop-cycle__hint">Catalysts: {player.fusionCatalysts}</p>
        </section>

        <section className="goop-cycle__panel goop-cycle__panel--wide" aria-labelledby="summon-heading">
          <h2 id="summon-heading">Summons</h2>
          <ul className="goop-cycle__summons">
            {player.summons.map((s) => (
              <li key={s.id} className="goop-cycle__summon">
                <strong>{s.name}</strong>
                <span>Gen {s.generation} · Lv {s.level}</span>
                <span>
                  M{s.stats.might} W{s.stats.wit} R{s.stats.ward} F{s.stats.flux}
                </span>
                <span className="goop-cycle__traits">{s.traits.join(" · ")}</span>
              </li>
            ))}
          </ul>

          <div className="goop-cycle__lab">
            <h3>Fusion crib (Azure Dreams)</h3>
            <div className="goop-cycle__pickers">
              <label>
                Parent A
                <select value={fusionA} onChange={(e) => setFusionA(e.target.value)}>
                  <option value="">—</option>
                  {player.summons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Parent B
                <select value={fusionB} onChange={(e) => setFusionB(e.target.value)}>
                  <option value="">—</option>
                  {player.summons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="button button-dark" onClick={runFusion}>
                Fuse unique offspring
              </button>
            </div>
          </div>

          <div className="goop-cycle__arena">
            <h3>Duel arena</h3>
            <div className="goop-cycle__pickers">
              <label>
                Your summon
                <select value={duelA} onChange={(e) => setDuelA(e.target.value)}>
                  <option value="">Auto</option>
                  {player.summons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Opponent religion
                <select
                  value={opponentReligion}
                  onChange={(e) => setOpponentReligion(e.target.value as ReligionId)}
                >
                  {religions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="button button-dark" onClick={runDuel}>
                Fight duel
              </button>
            </div>
          </div>
        </section>

        <section className="goop-cycle__panel goop-cycle__panel--wide" aria-labelledby="log-heading">
          <h2 id="log-heading">Battle log</h2>
          <ul className="goop-cycle__log">
            {log.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
