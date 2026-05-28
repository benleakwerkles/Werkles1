import type { ReactNode } from "react";
import { DraftReviewBadge } from "./draft-review-badge";

type CockpitShellProps = {
  children: ReactNode;
  showDraftBadge?: boolean;
  className?: string;
};

export function CockpitShell({
  children,
  showDraftBadge = true,
  className = ""
}: CockpitShellProps) {
  return (
    <div className={`foundry-cockpit${className ? ` ${className}` : ""}`}>
      {showDraftBadge ? <DraftReviewBadge /> : null}
      {children}
    </div>
  );
}
