"use client";

import { useState } from "react";
import { IconFallback } from "@/components/foundry/icon-fallback";
import { siteIcons, type SiteIconId, type SiteIconSize } from "@/lib/site-icons";

type SiteIconProps = {
  icon: SiteIconId;
  size?: SiteIconSize;
  label?: string;
  showLabel?: boolean;
  className?: string;
};

const sizeClass: Record<SiteIconSize, string> = {
  sm: "site-icon--sm",
  md: "site-icon--md",
  lg: "site-icon--lg"
};

export function SiteIcon({
  icon,
  size = "md",
  label,
  showLabel = false,
  className = ""
}: SiteIconProps) {
  const [useFallback, setUseFallback] = useState(false);
  const record = siteIcons[icon];

  return (
    <span className={`site-icon ${sizeClass[size]} ${className}`.trim()}>
      <span className="site-icon__frame">
        {!useFallback ? (
          <img
            src={record.publicPath}
            alt=""
            loading="lazy"
            onError={() => setUseFallback(true)}
          />
        ) : (
          <IconFallback icon={icon} />
        )}
      </span>
      {showLabel && label ? <span className="site-icon__label">{label}</span> : null}
    </span>
  );
}

export function LaneSigil({
  lane,
  label
}: {
  lane: "builder" | "operator" | "backer" | "connector" | "spark";
  label: string;
}) {
  const iconMap = {
    builder: "lane-builder",
    operator: "lane-operator",
    backer: "lane-backer",
    connector: "lane-connector",
    spark: "lane-spark"
  } as const;

  return <SiteIcon icon={iconMap[lane]} size="lg" label={label} showLabel className="lane-sigil" />;
}

export function NavIcon({ icon }: { icon: "nav-people" | "nav-how" | "nav-proof" | "nav-dues" }) {
  return <SiteIcon icon={icon} size="sm" className="nav-icon-wrap" />;
}
