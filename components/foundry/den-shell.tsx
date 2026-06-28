import type { CSSProperties, ReactNode } from "react";
import { denAtmosphere, denLampGradient } from "@/lib/den-atmosphere";

type DenShellProps = {
  children: ReactNode;
  className?: string;
  /** Lamp focus point for the warm pool — percent strings, e.g. "62%" "38%". */
  lampFocus?: { x: string; y: string };
};

/** Immersive inventor-den wrapper — hobbit-hole workshop, not cockpit. */
export function DenShell({ children, className = "", lampFocus }: DenShellProps) {
  const style = {
    "--den-lamp-gradient": denLampGradient(lampFocus?.x, lampFocus?.y)
  } as CSSProperties;

  return (
    <div
      className={`${denAtmosphere.shellClass} ${denAtmosphere.facetClass}${className ? ` ${className}` : ""}`}
      style={style}
    >
      <div className="den-shell__lamp" aria-hidden="true" />
      <div className="den-shell__alcove" aria-hidden="true" />
      <div className="den-shell__content">{children}</div>
    </div>
  );
}
