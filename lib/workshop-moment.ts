export type WorkshopMoment = "morning" | "afternoon" | "evening" | "night";

export type WorkshopMomentCopy = {
  heroEyebrow: string;
  trustRail: string;
};

const momentCopy: Record<WorkshopMoment, WorkshopMomentCopy> = {
  morning: {
    heroEyebrow: "Morning bench light on a warm foundry floor",
    trustRail: "Proof before polish. Fit before fog."
  },
  afternoon: {
    heroEyebrow: "A warm foundry floor for people who actually build",
    trustRail: "Inspect the signal, not the fairy tale."
  },
  evening: {
    heroEyebrow: "Late shift on the floor — still building",
    trustRail: "Private knocks. Visible proof. No guru fog."
  },
  night: {
    heroEyebrow: "Quiet floor, serious intent",
    trustRail: "Create with trust. Build to thrive."
  }
};

export function getWorkshopMoment(date = new Date()): WorkshopMoment {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getWorkshopMomentCopy(moment: WorkshopMoment = getWorkshopMoment()): WorkshopMomentCopy {
  return momentCopy[moment];
}

/** Stable bucket for future lane/RNG/location variants without storing PII. */
export function getWorkshopVisitorBucket(seed = ""): number {
  let hash = 0;
  const input = seed || "werkles-floor";
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash % 5;
}
