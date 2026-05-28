import type { ReactNode } from "react";
import { workshopFacets, type WorkshopFacet } from "@/lib/workshop-facets";

type WorkshopPanelProps = {
  facet: WorkshopFacet;
  className?: string;
  children: ReactNode;
};

/** Warm paper panel with a distinct workshop facet wash behind content. */
export function WorkshopPanel({ facet, className = "", children }: WorkshopPanelProps) {
  return (
    <div className={`workshop-panel ${workshopFacets[facet]}${className ? ` ${className}` : ""}`}>
      <div className="workshop-panel__scrim" aria-hidden="true" />
      <div className="workshop-panel__content">{children}</div>
    </div>
  );
}
