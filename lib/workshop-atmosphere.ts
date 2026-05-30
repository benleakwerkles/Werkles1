import type { CSSProperties } from "react";
import { getWorkshopVisitorBucket } from "@/lib/workshop-moment";

/** Draft atmosphere PNGs — rotation pool only; not final brand lock. */
export const workshopAtmospherePlates = {
  foundry: [
    "/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.2.png",
    "/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.1.png",
    "/assets/draft/ghost-forge/werkles-draft-workshop-interior-ben-pass.png",
    "/assets/draft/ghost-forge/werkles-draft-conservatory-ben-pass.png"
  ],
  proof: [
    "/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.2.png",
    "/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.1.png"
  ],
  workshop: [
    "/assets/draft/ghost-forge/werkles-draft-workshop-interior-ben-pass.png",
    "/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.2.png",
    "/assets/draft/ghost-forge/werkles-draft-conservatory-ben-pass.png"
  ]
} as const;

export type WorkshopBandTone = keyof typeof workshopAtmospherePlates;

/** Daily-stable pick — same plate all day, rotates by UTC date. */
export function pickWorkshopAtmospherePlate(
  tone: WorkshopBandTone,
  date = new Date()
): string {
  const seed = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
  const bucket = getWorkshopVisitorBucket(seed);
  const plates = workshopAtmospherePlates[tone];
  return plates[bucket % plates.length];
}

export function workshopBandImageStyle(tone: WorkshopBandTone, date = new Date()): CSSProperties {
  const plate = pickWorkshopAtmospherePlate(tone, date);
  return { ["--workshop-band-image" as string]: `url("${plate}")` };
}
