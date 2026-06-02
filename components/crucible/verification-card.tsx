import type { CrucibleCheck, CrucibleState } from "@/lib/crucible";
import { crucibleStateCopy } from "@/lib/crucible";
import { SiteIcon } from "@/components/foundry/site-icon";
import { crucibleIconId } from "@/lib/site-icons";

type VerificationCardProps = {
  check: CrucibleCheck;
  state?: CrucibleState;
  onStart?: (check: CrucibleCheck) => void;
  busy?: boolean;
  previewDisabled?: boolean;
};

export function VerificationCard({
  check,
  state = check.state as CrucibleState,
  onStart,
  busy = false,
  previewDisabled = false
}: VerificationCardProps) {
  const canStart = Boolean(check.route && onStart && !busy && !previewDisabled);

  return (
    <article className="ops-card verification-workflow-card">
      <SiteIcon icon={crucibleIconId(check.key)} size="lg" className="verification-card-icon" />
      <div>
        <p className="plan-kicker">{check.price}</p>
        <h2>{check.title}</h2>
        <p>{check.detail}</p>
      </div>
      <div className="verification-card-meta">
        <span>{crucibleStateCopy[state]}</span>
        <span>{check.stores}</span>
      </div>
      <button
        className={canStart ? "button button-dark" : "button button-outline"}
        type="button"
        disabled={!canStart}
        onClick={() => onStart?.(check)}
      >
        {previewDisabled
          ? "Sandbox action disabled in preview"
          : busy
            ? "Inspecting..."
            : check.cta}
      </button>
    </article>
  );
}
