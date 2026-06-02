/**
 * APP_INFRA-01 functional surface preview gate.
 * Keeps auth, crucible, billing, and checkout read-only until human APPROVE.
 * Flip to false only after APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW closes with APPROVE.
 */
export const APP_INFRA_PREVIEW = true;

export function isAppInfraPreview(): boolean {
  return APP_INFRA_PREVIEW;
}
