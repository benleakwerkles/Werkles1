/** CSS facet tokens — each panel/route can feel like a different bench in the same building. */
export const workshopFacets = {
  forge: "workshop-facet--forge",
  tinker: "workshop-facet--tinker",
  chem: "workshop-facet--chem",
  auto: "workshop-facet--auto",
  chip: "workshop-facet--chip",
  factory: "workshop-facet--factory",
  wonka: "workshop-facet--wonka",
  velvet: "workshop-facet--velvet",
  deck: "workshop-facet--deck",
  knock: "workshop-facet--knock",
  blueprint: "workshop-facet--blueprint",
  register: "workshop-facet--register"
} as const;

export type WorkshopFacet = keyof typeof workshopFacets;

export const routeAtmosphere = {
  home: "workshop-route--home",
  pricing: "workshop-route--pricing",
  membership: "workshop-route--membership",
  proof: "workshop-route--proof",
  dashboard: "workshop-route--dashboard",
  crucible: "workshop-route--crucible",
  billing: "workshop-route--billing",
  onboarding: "workshop-route--onboarding",
  auth: "workshop-route--auth"
} as const;

export type RouteAtmosphere = keyof typeof routeAtmosphere;

export const laneFacets: Record<"builder" | "operator" | "backer" | "connector" | "spark", WorkshopFacet> = {
  builder: "tinker",
  operator: "factory",
  backer: "register",
  connector: "wonka",
  spark: "chem"
};

export const stepFacets: WorkshopFacet[] = ["blueprint", "chip", "knock"];
