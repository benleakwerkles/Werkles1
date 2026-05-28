import { pricing } from "@/lib/pricing";

export type CrucibleState =
  | "not_started"
  | "membership_required"
  | "payment_required"
  | "ready_to_start"
  | "provider_redirect"
  | "pending"
  | "verified"
  | "failed"
  | "expired"
  | "manual_review"
  | "unavailable";

export const crucibleStateCopy: Record<CrucibleState, string> = {
  not_started: "No steel inspected yet.",
  membership_required: "Foundry Dues unlocks this workflow. It does not buy the result.",
  payment_required: "This check passes through provider cost plus the published handling fee.",
  ready_to_start: "Ready for inspection.",
  provider_redirect: "The provider handles the sensitive parts. Werkles waits for the receipt.",
  pending: "Inspecting the steel.",
  verified: "Claim checked. Receipt filed.",
  failed: "Something did not hold. Fix the claim or pull it out.",
  expired: "This proof has gone cold. Refresh it before leaning on it.",
  manual_review: "This one needs human eyes.",
  unavailable: "The forge is not wired for this check yet."
};

export const crucibleTrustCopy = [
  "Membership unlocks access to our verification providers. It does not unlock verification itself.",
  "Werkles cannot make anyone trustworthy. We make claims harder to fake.",
  "Paid status alone is not a proof signal.",
  "We store receipts and statuses, not raw sensitive material."
] as const;

export const crucibleChecks = pricing.crucible.map((check) => {
  const active = check.key === "identity" || check.key === "funds";

  return {
    ...check,
    state: active ? "ready_to_start" : "unavailable",
    route:
      check.key === "identity"
        ? "/api/verification/identity"
        : check.key === "funds"
          ? "/api/verification/funds"
          : null,
    stores:
      check.key === "funds"
        ? "Receipt and status only. No account numbers."
        : check.key === "identity"
          ? "Receipt and status only. No ID images."
          : "Receipt and status only when provider wiring is approved."
  };
});

export type CrucibleCheck = (typeof crucibleChecks)[number];
