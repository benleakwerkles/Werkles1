/** Den atmosphere tokens — cozy inventor nook (Connector / wonka facet). Draft review only. */

export const denAtmosphere = {
  version: "0.1-draft",
  source: "foreman/design/WONKA_DEN_MOOD_REFERENCE.md",
  facetClass: "workshop-facet--den",
  shellClass: "den-shell",
  routeClass: "workshop-route--den",
  immersionRefs: ["black-desert-menus", "gta-diegetic-ui", "dark-souls-inspect"],
  colors: {
    lampCore: "rgba(251, 195, 104, 0.42)",
    lampHalo: "rgba(224, 181, 105, 0.18)",
    alcoveShadow: "rgba(5, 4, 4, 0.72)",
    paperWarm: "#f6efe5",
    pegboard: "#2c231d",
    felt: "#3b342a",
    inventionSpark: "rgba(103, 46, 237, 0.12)"
  },
  motion: {
    lampSweepMs: 400,
    inspectLiftPx: 4,
    objectWobbleDeg: 2
  },
  rejects: ["throne", "enterprise-dashboard", "spaceship-cockpit", "full-bleed-hud"]
} as const;

export type DenAtmosphere = typeof denAtmosphere;

export const denNavObjects = [
  { href: "/dashboard/profile", label: "Profile", object: "pocket notebook" },
  { href: "/dashboard/blueprints", label: "Blueprints", object: "rolled plans" },
  { href: "/dashboard/intros", label: "Intros", object: "door knockers" },
  { href: "/dashboard/crucible", label: "Crucible", object: "inspection loupe" },
  { href: "/dashboard/billing", label: "Billing", object: "receipt spike" }
] as const;

export function denLampGradient(focusX = "62%", focusY = "38%") {
  return `radial-gradient(circle at ${focusX} ${focusY}, ${denAtmosphere.colors.lampCore}, ${denAtmosphere.colors.lampHalo} 28%, transparent 58%)`;
}
