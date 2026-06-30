"use client";

import { useEffect, useMemo, useState } from "react";
import { DenCastStrip } from "@/components/goop-cycle/den-cast-strip";
import { DuelStage } from "@/components/goop-cycle/duel-stage";
import { DenPortrait } from "@/components/goop-cycle/den-portrait";
import { SummonCreature } from "@/components/goop-cycle/summon-creature";
import {
  applyDuelXp,
  bumpQuest,
  contributeWarPoints,
  createInitialPlayerState,
  createStarterSummon,
  daysRemainingInCycle,
  cycleLeader,
  defaultOpponent,
  denFighters,
  fighterById,
  fuseSummons,
  getCurrentCycle,
  loadPlayerState,
  playerHerald,
  questCatalog,
  religionById,
  religions,
  resolveDuel,
  savePlayerState,
  skillLevelsMap,
  unlockNextQuests,
  addSkillXp,
  type DenFighter,
  type GoopCycle,
  type LifeSkillId,
  type PlayerGoopState,
  type ReligionId,
  type Summon
} from "@/lib/goop-cycle";

function fighterSummon(fighter: DenFighter): Summon {
  const index = denFighters.findIndex((f) => f.id === fighter.id);
  const base = createStarterSummon(Math.max(0, index), fighter.religionId);
  return {
    ...base,
    id: `summon-${fighter.id}`,
    name: fighter.summonName,
    level: 2 + (index % 3),
    stats: {
      might: 44 + (index % 5) * 2,
      wit: 42 + (index % 4) * 2,
      ward: 45 + (index % 3) * 2,
      flux: 40 + (index % 6) * 2
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
  const [opponentId, setOpponentId] = useState<string>(defaultOpponent("tide_canticle").id);
  const [lastClash, setLastClash] = useState<string>("");
  const [log, setLog] = useState<string[]>(["Welcome to the Goop Cycle — pick a religion, meet the crew, fuse, duel."]);
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
  const herald = useMemo(() => playerHerald(player.religionId, player.heraldSeed), [player.religionId, player.heraldSeed]);
  const opponent = useMemo(
    () => fighterById[opponentId] ?? defaultOpponent(opponentReligion),
    [opponentId, opponentReligion]
  );
  const playerSummon = useMemo(
    () => player.summons.find((s) => s.id === duelA) ?? player.summons[0],
    [player.summons, duelA]
  );
  const opponentSummon = useMemo(() => fighterSummon(opponent), [opponent]);

  function pushLog(lines: string[]) {
    setLog((prev) => [...lines, ...prev].slice(0, 12));
  }

  function joinReligion(religionId: ReligionId) {
    setPlayer((prev) => {
      const next = unlockNextQuests(
        bumpQuest({ ...prev, religionId, heraldSeed: prev.heraldSeed ?? `herald-${Date.now()}` }, "cycle_pledge", 1)
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
    const summon = playerSummon;
    if (!summon) return;

    const foeSummon = opponentSummon;
    const result = resolveDuel({
      summonA: summon,
      summonB: foeSummon,
      religionA: player.religionId,
      religionB: opponent.religionId,
      skillLevelsA: skills,
      skillLevelsB: { smithing: 2, rhetoric: 2 },
      seed: `${summon.id}:${foeSummon.id}:${cycle.cycleId}`
    });

    const won = result.winnerSummonId === summon.id;
    const clash = result.rounds[result.rounds.length - 1]?.magicClash ?? "";
    setLastClash(clash);

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
    pushLog([
      `${herald.name} vs ${opponent.name}`,
      ...result.log
    ]);
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

  function pickOpponent(fighter: DenFighter) {
    setOpponentId(fighter.id);
    setOpponentReligion(fighter.religionId);
    pushLog([`Called out ${fighter.name} (${fighter.city}).`]);
  }

  return (
    <div className="goop-cycle goop-cycle--textured">
      <header className="goop-cycle__hero goop-cycle__panel--paper">
        <div className="goop-cycle__hero-row">
          <DenPortrait seed={herald.portraitSeed} name={herald.name} accent={player.religionId ? religionById[player.religionId].color : "#9f6633"} size="xl" />
          <div>
            <p className="eyebrow">Den game layer · draft review</p>
            <h1>Goop Cycle</h1>
            <p className="goop-cycle__lede">
              Real crews, real grudges. Fuse Azure Dreams summons, fight for your religion in duels, and chase the
              biweekly goop prize.
            </p>
            <p className="goop-cycle__herald-line">
              <strong>{herald.name}</strong> — {herald.title}
            </p>
          </div>
        </div>
        <div className="goop-cycle__cycle-banner goop-cycle__panel--felt">
          <span className="goop-cycle__goop">{cycle.goopTheme}</span>
          <span>{daysRemainingInCycle()} days left</span>
          <span>Prize: {cycle.goopPrize}</span>
        </div>
      </header>

      <DenCastStrip
        fighters={denFighters}
        activeReligionId={player.religionId}
        onSelect={pickOpponent}
      />

      <div className="goop-cycle__grid">
        <section className="goop-cycle__panel goop-cycle__panel--wood" aria-labelledby="religion-heading">
          <h2 id="religion-heading">Religions &amp; magics</h2>
          <ul className="goop-cycle__religion-list">
            {religions.map((r) => {
              const heraldNpc = denFighters.find((f) => f.religionId === r.id);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`goop-cycle__religion${player.religionId === r.id ? " is-active" : ""}`}
                    style={{ "--religion-color": r.color } as React.CSSProperties}
                    onClick={() => joinReligion(r.id)}
                  >
                    {heraldNpc ? (
                      <DenPortrait seed={heraldNpc.portraitSeed} name={heraldNpc.name} accent={r.color} size="sm" framed={false} />
                    ) : null}
                    <div>
                      <strong>{r.name}</strong>
                      <span>{r.magicName}</span>
                      <small>{heraldNpc ? `Herald: ${heraldNpc.name}` : r.motto}</small>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="goop-cycle__panel goop-cycle__panel--felt" aria-labelledby="war-heading">
          <h2 id="war-heading">Rolling religion war</h2>
          <p className="goop-cycle__hint">Biweekly reset — all religions to 0 at cycle boundary.</p>
          <ol className="goop-cycle__standings">
            {[...standings]
              .sort((a, b) => b.points - a.points)
              .map((row, idx) => {
                const heraldNpc = denFighters.find((f) => f.religionId === row.religionId);
                return (
                  <li key={row.religionId}>
                    {heraldNpc ? (
                      <DenPortrait
                        seed={heraldNpc.portraitSeed}
                        name={heraldNpc.name}
                        accent={religionById[row.religionId].color}
                        size="sm"
                        framed={false}
                      />
                    ) : null}
                    <span style={{ color: religionById[row.religionId].color }}>
                      #{idx + 1} {religionById[row.religionId].name}
                    </span>
                    <span>{row.points} pts</span>
                    <small>{row.duelsWon} wins</small>
                  </li>
                );
              })}
          </ol>
          {leader ? (
            <p className="goop-cycle__leader">
              Leading: <strong style={{ color: religionById[leader.religionId].color }}>
                {religionById[leader.religionId].name}
              </strong>
            </p>
          ) : null}
        </section>

        <section className="goop-cycle__panel goop-cycle__panel--wide goop-cycle__panel--paper" aria-labelledby="arena-heading">
          <h2 id="arena-heading">Duel arena</h2>
          <DuelStage
            player={herald}
            opponent={opponent}
            playerSummon={playerSummon}
            opponentSummon={opponentSummon}
            lastRound={lastClash}
          />
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
              Opponent
              <select
                value={opponentId}
                onChange={(e) => {
                  const f = fighterById[e.target.value];
                  if (f) pickOpponent(f);
                }}
              >
                {denFighters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} · {religionById[f.religionId].name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="button button-dark" onClick={runDuel}>
              Fight duel
            </button>
          </div>
        </section>

        <section className="goop-cycle__panel goop-cycle__panel--wide goop-cycle__panel--paper" aria-labelledby="quest-heading">
          <h2 id="quest-heading">Quests</h2>
          <div className="goop-cycle__quest-grid">
            {questCatalog.map((quest) => {
              const progress = player.quests.find((q) => q.questId === quest.id);
              const status = progress?.status ?? "locked";
              const questGiver = denFighters.find((f) => f.lane.toLowerCase() === quest.skill.replace("beastkeeping", "builder")) ?? denFighters[0];
              return (
                <article key={quest.id} className={`goop-cycle__quest goop-cycle__quest--${status}`}>
                  <div className="goop-cycle__quest-top">
                    <DenPortrait seed={`quest-${quest.id}`} name={quest.title} accent="#9f6633" size="sm" framed={false} />
                    <div>
                      <h3>{quest.title}</h3>
                      <small>Posted by {questGiver?.name ?? "Den clerk"}</small>
                    </div>
                  </div>
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

        <section className="goop-cycle__panel goop-cycle__panel--wood" aria-labelledby="skills-heading">
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

        <section className="goop-cycle__panel goop-cycle__panel--wide goop-cycle__panel--felt" aria-labelledby="summon-heading">
          <h2 id="summon-heading">Summons &amp; fusion crib</h2>
          <ul className="goop-cycle__summons">
            {player.summons.map((s) => (
              <li key={s.id} className="goop-cycle__summon">
                <SummonCreature seed={s.id} name={s.name} />
                <div>
                  <strong>{s.name}</strong>
                  <span>Gen {s.generation} · Lv {s.level}</span>
                  <span>
                    M{s.stats.might} W{s.stats.wit} R{s.stats.ward} F{s.stats.flux}
                  </span>
                  <span className="goop-cycle__traits">{s.traits.join(" · ")}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="goop-cycle__lab">
            <h3>Azure Dreams fusion</h3>
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
        </section>

        <section className="goop-cycle__panel goop-cycle__panel--wide goop-cycle__panel--paper" aria-labelledby="log-heading">
          <h2 id="log-heading">Battle log</h2>
          <ul className="goop-cycle__log">
            {log.map((line, i) => (
              <li key={`${line}-${i}`}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
