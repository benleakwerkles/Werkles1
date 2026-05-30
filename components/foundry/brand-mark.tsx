"use client";

import { useState } from "react";

export const brandMarkAssetPath = "/assets/werkles-app-icon-board.png";

type BrandMarkPresentation = "board" | "soft" | "blend";

type BrandMarkProps = {
  size?: "header" | "sm" | "md";
  presentation?: BrandMarkPresentation;
  className?: string;
};

function BrandMarkSvgFallback() {
  return (
    <svg viewBox="0 0 48 48" role="presentation" focusable="false">
      <defs>
        <linearGradient id="werkles-header-w-fallback" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#3D16CA" />
          <stop offset="45%" stopColor="#672EED" />
          <stop offset="55%" stopColor="#18C5AE" />
          <stop offset="100%" stopColor="#02917E" />
        </linearGradient>
      </defs>
      <path
        fill="url(#werkles-header-w-fallback)"
        d="M6 10  L16 38  L24 22  L32 38  L42 10  L36 10  L24 30  L12 10  Z"
      />
    </svg>
  );
}

export function BrandMark({
  size = "header",
  presentation = "board",
  className = ""
}: BrandMarkProps) {
  const [useFallback, setUseFallback] = useState(false);
  const classes = [
    "brand-mark",
    `brand-mark--${size}`,
    presentation === "soft" ? "brand-mark--soft" : "",
    presentation === "blend" ? "brand-mark--blend" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} aria-hidden="true">
      {useFallback ? (
        <BrandMarkSvgFallback />
      ) : (
        <img
          className="brand-mark__image"
          src={brandMarkAssetPath}
          alt=""
          onError={() => setUseFallback(true)}
        />
      )}
    </span>
  );
}
