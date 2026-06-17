import { DenPortrait } from "@/components/goop-cycle/den-portrait";
import { religionById } from "@/lib/goop-cycle/religions";
import type { DenFighter } from "@/lib/goop-cycle/fighters";

type DenCastStripProps = {
  fighters: DenFighter[];
  activeReligionId?: string | null;
  onSelect?: (fighter: DenFighter) => void;
};

export function DenCastStrip({ fighters, activeReligionId, onSelect }: DenCastStripProps) {
  return (
    <div className="den-cast-strip">
      <p className="den-cast-strip__kicker">Den regulars · real crews</p>
      <ul className="den-cast-strip__list">
        {fighters.map((fighter) => {
          const religion = religionById[fighter.religionId];
          const isActive = activeReligionId === fighter.religionId;
          return (
            <li key={fighter.id}>
              <button
                type="button"
                className={`den-cast-strip__card${isActive ? " is-active" : ""}`}
                onClick={() => onSelect?.(fighter)}
                style={{ "--cast-accent": religion.color } as React.CSSProperties}
              >
                <DenPortrait seed={fighter.portraitSeed} name={fighter.name} accent={religion.color} size="lg" />
                <div className="den-cast-strip__copy">
                  <strong>{fighter.name}</strong>
                  <span>{fighter.title}</span>
                  <small>
                    {fighter.lane} · {fighter.city}
                  </small>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
