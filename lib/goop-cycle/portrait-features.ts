import { hashString, mulberry32 } from "./rng";

export type PortraitFeatures = {
  skin: string;
  skinShadow: string;
  hair: string;
  hairHighlight: string;
  shirt: string;
  collar: string;
  eye: string;
  hairStyle: 0 | 1 | 2 | 3 | 4;
  hasBeard: boolean;
  hasGlasses: boolean;
  cheekWarmth: number;
};

const skinTones = [
  { skin: "#f0c8a8", shadow: "#c9956e" },
  { skin: "#e8b896", shadow: "#b88462" },
  { skin: "#d4a574", shadow: "#a0724d" },
  { skin: "#c68642", shadow: "#8f5e30" },
  { skin: "#a5653a", shadow: "#734628" },
  { skin: "#f5d6c6", shadow: "#d4a99a" },
  { skin: "#8d5524", shadow: "#5f3a18" },
  { skin: "#6b4423", shadow: "#4a2f18" }
];

const hairColors = [
  { base: "#2b2118", hi: "#4a3b2d" },
  { base: "#4a3728", hi: "#6a5340" },
  { base: "#6b4c2a", hi: "#8d6840" },
  { base: "#8a6b45", hi: "#b08a5d" },
  { base: "#c49a6c", hi: "#e0bc8e" },
  { base: "#5a6169", hi: "#8a939c" },
  { base: "#2f3f54", hi: "#4f6580" }
];

export function portraitFeaturesFromSeed(seed: string, accent = "#9f6633"): PortraitFeatures {
  const rand = mulberry32(hashString(seed));
  const skin = skinTones[Math.floor(rand() * skinTones.length)]!;
  const hair = hairColors[Math.floor(rand() * hairColors.length)]!;
  const hairStyle = Math.floor(rand() * 5) as PortraitFeatures["hairStyle"];

  return {
    skin: skin.skin,
    skinShadow: skin.shadow,
    hair: hair.base,
    hairHighlight: hair.hi,
    shirt: mixAccent(accent, 0.22),
    collar: mixAccent(accent, 0.42),
    eye: "#2c231d",
    hairStyle,
    hasBeard: rand() > 0.62,
    hasGlasses: rand() > 0.78,
    cheekWarmth: 0.08 + rand() * 0.12
  };
}

function mixAccent(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const blend = (c: number) => Math.round(c + (246 - c) * amount);
  return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`;
}

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
