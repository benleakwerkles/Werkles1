import { DenPortrait } from "@/components/goop-cycle/den-portrait";
import { religionById } from "@/lib/goop-cycle/religions";
import type { DenFighter } from "@/lib/goop-cycle/fighters";
import type { Summon } from "@/lib/goop-cycle/types";

type DuelStageProps = {
  player: DenFighter;
  opponent: DenFighter;
  playerSummon?: Summon;
  opponentSummon?: Summon;
  lastRound?: string;
};

export function DuelStage({ player, opponent, playerSummon, opponentSummon, lastRound }: DuelStageProps) {
  const playerRel = religionById[player.religionId];
  const foeRel = religionById[opponent.religionId];

  return (
    <div className="duel-stage">
      <div className="duel-stage__felt" aria-hidden="true" />
      <div className="duel-stage__fighter duel-stage__fighter--left">
        <DenPortrait seed={player.portraitSeed} name={player.name} accent={playerRel.color} size="xl" />
        <div className="duel-stage__meta">
          <strong>{player.name}</strong>
          <span>{player.title}</span>
          {playerSummon ? (
            <span className="duel-stage__summon">
              with <em>{playerSummon.name}</em> · Lv {playerSummon.level}
            </span>
          ) : null}
        </div>
      </div>

      <div className="duel-stage__center" aria-hidden="true">
        <span className="duel-stage__vs">vs</span>
        {lastRound ? <p className="duel-stage__clash">{lastRound}</p> : null}
      </div>

      <div className="duel-stage__fighter duel-stage__fighter--right">
        <DenPortrait seed={opponent.portraitSeed} name={opponent.name} accent={foeRel.color} size="xl" />
        <div className="duel-stage__meta">
          <strong>{opponent.name}</strong>
          <span>{opponent.title}</span>
          {opponentSummon ? (
            <span className="duel-stage__summon">
              with <em>{opponentSummon.name}</em> · Lv {opponentSummon.level}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
