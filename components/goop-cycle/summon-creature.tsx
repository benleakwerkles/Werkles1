import { hashString } from "@/lib/goop-cycle/rng";

type SummonCreatureProps = {
  seed: string;
  name: string;
  size?: number;
};

/** Small creature thumb for summons — distinct from human portraits. */
export function SummonCreature({ seed, name, size = 44 }: SummonCreatureProps) {
  const hue = hashString(seed) % 360;
  const body = `hsl(${hue} 42% 42%)`;
  const belly = `hsl(${(hue + 40) % 360} 50% 62%)`;

  return (
    <div className="summon-creature" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img" aria-label={`Creature ${name}`}>
        <rect width="64" height="64" rx="10" fill="rgba(44,35,29,0.12)" />
        <ellipse cx="32" cy="38" rx="18" ry="16" fill={body} />
        <ellipse cx="32" cy="42" rx="12" ry="10" fill={belly} opacity="0.85" />
        <circle cx="32" cy="24" r="14" fill={body} />
        <circle cx="26" cy="22" r="3" fill="#f6efe5" />
        <circle cx="38" cy="22" r="3" fill="#f6efe5" />
        <circle cx="26.5" cy="22.5" r="1.5" fill="#2c231d" />
        <circle cx="38.5" cy="22.5" r="1.5" fill="#2c231d" />
        <ellipse cx="22" cy="34" rx="6" ry="4" fill={body} opacity="0.9" />
        <ellipse cx="42" cy="34" rx="6" ry="4" fill={body} opacity="0.9" />
      </svg>
    </div>
  );
}
