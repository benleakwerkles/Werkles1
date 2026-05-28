import type { ReactNode } from "react";
import type { SiteIconId } from "@/lib/site-icons";

const ink = "#2c231d";
const copper = "#9f6633";
const brass = "#c08b52";
const teal = "#02917e";
const violet = "#672eed";
const green = "#5fd178";
const amber = "#f6ad55";

function IconBase({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" role="presentation" className="icon-fallback-svg">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="rgba(255,252,247,0.92)" stroke={copper} strokeWidth="1.2" />
      {children}
    </svg>
  );
}

export function IconFallback({ icon }: { icon: SiteIconId }) {
  if (icon === "lane-builder" || icon === "nav-people") {
    return (
      <IconBase>
        <rect x="14" y="8" width="4" height="12" rx="1" fill={copper} />
        <rect x="9" y="18" width="14" height="3" rx="1" fill={brass} />
        <path d="M8 11h4M20 11h4" stroke={teal} strokeWidth="1.5" />
        <circle cx="23" cy="9" r="2" fill={green} />
      </IconBase>
    );
  }

  if (icon === "lane-operator") {
    return (
      <IconBase>
        <circle cx="16" cy="16" r="7" fill="none" stroke={brass} strokeWidth="2.2" />
        <circle cx="16" cy="16" r="2.5" fill={copper} />
        <rect x="21" y="9" width="5" height="7" rx="1" fill={ink} stroke={copper} />
        <path d="M22 11h3M22 13h2" stroke={teal} strokeWidth="1" />
      </IconBase>
    );
  }

  if (icon === "lane-backer") {
    return (
      <IconBase>
        <rect x="11" y="10" width="10" height="14" rx="3" fill={ink} stroke={brass} strokeWidth="1.5" />
        <rect x="13.5" y="13" width="5" height="4" rx="1" fill={copper} />
        <path d="M13 21h6" stroke={green} strokeWidth="1.5" />
      </IconBase>
    );
  }

  if (icon === "lane-connector") {
    return (
      <IconBase>
        <circle cx="10" cy="16" r="3.5" fill={copper} />
        <circle cx="22" cy="10" r="3.5" fill={brass} />
        <circle cx="22" cy="22" r="3.5" fill={brass} />
        <path d="M13.5 15.5 L18.5 12 M13.5 16.5 L18.5 20" stroke={violet} strokeWidth="1.8" />
        <circle cx="16" cy="16" r="1.2" fill={green} />
      </IconBase>
    );
  }

  if (icon === "lane-spark") {
    return (
      <IconBase>
        <rect x="14.5" y="10" width="3" height="11" rx="1" fill={ink} stroke={copper} />
        <path d="M16 7 L18.5 11 H13.5 Z" fill={amber} />
        <circle cx="16" cy="23" r="2.5" fill={green} />
        <path d="M10 14h2M20 18h2" stroke={violet} strokeWidth="1.2" />
      </IconBase>
    );
  }

  if (icon === "nav-how" || icon === "step-dossier" || icon === "icon-dossier") {
    return (
      <IconBase>
        <rect x="9" y="8" width="14" height="16" rx="2" fill={ink} stroke={brass} strokeWidth="1.5" />
        <rect x="12" y="12" width="8" height="1.5" fill={copper} />
        <rect x="12" y="16" width="6" height="1.5" fill={copper} />
        <circle cx="21" cy="11" r="1.5" fill={teal} />
      </IconBase>
    );
  }

  if (icon === "step-fit" || icon === "check-funds") {
    return (
      <IconBase>
        <path d="M8 22 L13 12 L18 17 L24 9" fill="none" stroke={green} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="13" cy="12" r="1.8" fill={brass} />
        <rect x="20" y="8" width="4" height="4" rx="0.5" fill={violet} opacity="0.85" />
      </IconBase>
    );
  }

  if (icon === "nav-proof" || icon === "check-reference") {
    return (
      <IconBase>
        <path d="M16 8 L22 11 V17 C22 21 16 24 16 24 C16 24 10 21 10 17 V11 Z" fill={ink} stroke={copper} strokeWidth="1.5" />
        <path d="M13 16 L15.5 18.5 L20 14" fill="none" stroke={green} strokeWidth="2" />
      </IconBase>
    );
  }

  if (icon === "step-knock" || icon === "icon-knock") {
    return (
      <IconBase>
        <rect x="11" y="9" width="10" height="14" rx="1" fill={ink} stroke={copper} />
        <circle cx="16" cy="15" r="3" fill="none" stroke={brass} strokeWidth="1.8" />
        <path d="M16 12 V10" stroke={amber} strokeWidth="1.5" />
      </IconBase>
    );
  }

  if (icon === "nav-deck" || icon === "icon-deck") {
    return (
      <IconBase>
        <rect x="9" y="11" width="10" height="12" rx="1.5" fill={ink} stroke={copper} />
        <rect x="13" y="9" width="10" height="12" rx="1.5" fill={ink} stroke={brass} opacity="0.85" />
        <path d="M15 14h6M15 17h4" stroke={teal} strokeWidth="1.2" />
      </IconBase>
    );
  }

  if (icon === "nav-dues" || icon === "icon-register") {
    return (
      <IconBase>
        <rect x="9" y="11" width="14" height="10" rx="2" fill={ink} stroke={brass} strokeWidth="1.5" />
        <rect x="12" y="14" width="8" height="3" rx="1" fill={copper} />
        <circle cx="21" cy="10" r="2" fill={green} />
      </IconBase>
    );
  }

  if (icon === "icon-armory") {
    return (
      <IconBase>
        <rect x="8" y="10" width="16" height="12" rx="1" fill={ink} stroke={copper} />
        <rect x="10" y="12" width="4" height="3" fill={brass} />
        <rect x="15" y="12" width="4" height="3" fill={brass} />
        <rect x="20" y="12" width="2" height="3" fill={brass} />
        <circle cx="16" cy="21" r="1.5" fill={violet} />
      </IconBase>
    );
  }

  if (icon === "icon-blueprint") {
    return (
      <IconBase>
        <rect x="10" y="9" width="12" height="14" rx="1" fill="#eef4ff" stroke={teal} strokeWidth="1.2" />
        <path d="M12 13h8M12 16h6M12 19h7" stroke={violet} strokeWidth="1" opacity="0.7" />
        <circle cx="21" cy="11" r="2" fill={copper} />
      </IconBase>
    );
  }

  if (icon === "check-identity") {
    return (
      <IconBase>
        <rect x="10" y="9" width="12" height="14" rx="2" fill={ink} stroke={brass} />
        <circle cx="16" cy="14" r="2.5" fill={copper} />
        <rect x="12.5" y="18.5" width="7" height="1.5" rx="0.5" fill={green} />
      </IconBase>
    );
  }

  if (icon === "check-license") {
    return (
      <IconBase>
        <rect x="8" y="12" width="16" height="9" rx="1.5" fill={ink} stroke={copper} />
        <rect x="11" y="15" width="10" height="2" fill={brass} />
        <path d="M8 15h16" stroke={teal} strokeWidth="0.8" opacity="0.6" />
      </IconBase>
    );
  }

  if (icon === "check-employment") {
    return (
      <IconBase>
        <rect x="9" y="9" width="14" height="14" rx="1.5" fill={ink} stroke={brass} />
        <path d="M12 14h8M12 17.5h6" stroke={copper} strokeWidth="1.5" />
        <rect x="20" y="10" width="3" height="3" rx="0.5" fill={violet} />
      </IconBase>
    );
  }

  return (
    <IconBase>
      <circle cx="16" cy="16" r="6" fill="none" stroke={brass} strokeWidth="2" />
      <circle cx="16" cy="16" r="2" fill={green} />
    </IconBase>
  );
}
