import type { CSSProperties } from "react";
import { portraitFeaturesFromSeed } from "@/lib/goop-cycle/portrait-features";
import type { PortraitFeatures } from "@/lib/goop-cycle/portrait-features";

type DenPortraitProps = {
  seed: string;
  name: string;
  accent?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  framed?: boolean;
};

const sizes = { sm: 48, md: 72, lg: 96, xl: 128 } as const;

function hairPath(style: PortraitFeatures["hairStyle"], features: PortraitFeatures) {
  switch (style) {
    case 1:
      return (
        <>
          <path
            d="M24 38 C18 22, 34 14, 50 18 C66 14, 82 24, 78 40 C74 28, 62 24, 50 26 C38 24, 28 30, 24 38 Z"
            fill={features.hair}
          />
          <path
            d="M26 36 C30 26, 42 22, 50 24 C58 22, 70 28, 74 38"
            stroke={features.hairHighlight}
            strokeWidth="2"
            fill="none"
            opacity="0.55"
          />
        </>
      );
    case 2:
      return (
        <path
          d="M22 42 C20 18, 36 10, 50 12 C64 10, 80 20, 78 44 L72 52 C68 34, 58 30, 50 30 C42 30, 32 36, 28 50 Z"
          fill={features.hair}
        />
      );
    case 3:
      return (
        <>
          <ellipse cx="34" cy="30" rx="12" ry="16" fill={features.hair} />
          <ellipse cx="66" cy="30" rx="12" ry="16" fill={features.hair} />
          <path d="M24 34 C30 18, 70 18, 76 34 L76 42 C68 28, 32 28, 24 42 Z" fill={features.hair} />
        </>
      );
    case 4:
      return (
        <path
          d="M26 40 C24 16, 76 16, 74 40 C70 26, 58 22, 50 24 C42 22, 30 28, 26 40 Z"
          fill={features.hair}
        />
      );
    default:
      return (
        <path
          d="M28 38 C26 24, 40 16, 50 18 C60 16, 74 26, 72 40 C66 30, 58 26, 50 28 C42 26, 34 32, 28 38 Z"
          fill={features.hair}
        />
      );
  }
}

/** Illustrated workshop portrait — human, warm, not letter avatars. */
export function DenPortrait({
  seed,
  name,
  accent = "#9f6633",
  size = "md",
  className = "",
  framed = true
}: DenPortraitProps) {
  const px = sizes[size];
  const features = portraitFeaturesFromSeed(seed, accent);

  return (
    <div
      className={`den-portrait den-portrait--${size}${framed ? " den-portrait--framed" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--portrait-accent": accent, width: px, height: px } as CSSProperties}
    >
      <svg viewBox="0 0 100 100" role="img" aria-label={`Portrait of ${name}`}>
        <defs>
          <radialGradient id={`lamp-${seed}`} cx="50%" cy="20%" r="70%">
            <stop offset="0%" stopColor="rgba(251,195,104,0.35)" />
            <stop offset="100%" stopColor="rgba(5,4,4,0)" />
          </radialGradient>
          <linearGradient id={`shirt-${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={features.collar} />
            <stop offset="100%" stopColor={features.shirt} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="#2c231d" rx="12" />
        <rect width="100" height="100" fill={`url(#lamp-${seed})`} rx="12" />
        <ellipse cx="50" cy="108" rx="42" ry="28" fill={`url(#shirt-${seed})`} />
        <path d="M34 78 C38 68, 62 68, 66 78 L70 100 L30 100 Z" fill={`url(#shirt-${seed})`} />
        <ellipse cx="50" cy="54" rx="22" ry="26" fill={features.skin} />
        <ellipse cx="50" cy="58" rx="18" ry="20" fill={features.skinShadow} opacity="0.18" />
        <ellipse cx="38" cy="56" rx="5" ry="3.5" fill={`rgba(224,120,90,${features.cheekWarmth})`} />
        <ellipse cx="62" cy="56" rx="5" ry="3.5" fill={`rgba(224,120,90,${features.cheekWarmth})`} />
        {hairPath(features.hairStyle, features)}
        <ellipse cx="42" cy="52" rx="3.2" ry="4" fill="#fff" />
        <ellipse cx="58" cy="52" rx="3.2" ry="4" fill="#fff" />
        <circle cx="42.5" cy="53" r="1.8" fill={features.eye} />
        <circle cx="58.5" cy="53" r="1.8" fill={features.eye} />
        <path d="M46 60 Q50 63 54 60" stroke={features.skinShadow} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M48 64 Q50 65 52 64" stroke="#8a5a45" strokeWidth="1.2" fill="none" opacity="0.5" />
        {features.hasBeard ? (
          <path
            d="M40 60 C42 70, 58 70, 60 60 C56 66, 44 66, 40 60 Z"
            fill={features.hair}
            opacity="0.85"
          />
        ) : null}
        {features.hasGlasses ? (
          <g stroke="#3b342a" strokeWidth="1.4" fill="none" opacity="0.85">
            <circle cx="42" cy="52" r="6" />
            <circle cx="58" cy="52" r="6" />
            <path d="M48 52 H52" />
            <path d="M36 51 C34 48, 30 48, 28 50" />
            <path d="M64 51 C66 48, 70 48, 72 50" />
          </g>
        ) : null}
      </svg>
      <div className="den-portrait__grain" aria-hidden="true" />
    </div>
  );
}
