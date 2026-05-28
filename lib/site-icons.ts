export type SiteIconId =
  | "lane-builder"
  | "lane-operator"
  | "lane-backer"
  | "lane-connector"
  | "lane-spark"
  | "nav-people"
  | "nav-how"
  | "nav-proof"
  | "nav-dues"
  | "nav-deck"
  | "step-dossier"
  | "step-fit"
  | "step-knock"
  | "icon-armory"
  | "icon-blueprint"
  | "icon-deck"
  | "icon-dossier"
  | "icon-knock"
  | "icon-register"
  | "check-identity"
  | "check-funds"
  | "check-license"
  | "check-employment"
  | "check-reference";

export type SiteIconSize = "sm" | "md" | "lg";

type SiteIconRecord = {
  id: SiteIconId;
  filename: string;
  publicPath: string;
};

const iconRoot = "/assets/draft/icons";

export const siteIcons: Record<SiteIconId, SiteIconRecord> = {
  "lane-builder": { id: "lane-builder", filename: "icon-lane-builder-v0.1.png", publicPath: `${iconRoot}/icon-lane-builder-v0.1.png` },
  "lane-operator": { id: "lane-operator", filename: "icon-lane-operator-v0.1.png", publicPath: `${iconRoot}/icon-lane-operator-v0.1.png` },
  "lane-backer": { id: "lane-backer", filename: "icon-lane-backer-v0.1.png", publicPath: `${iconRoot}/icon-lane-backer-v0.1.png` },
  "lane-connector": { id: "lane-connector", filename: "icon-lane-connector-v0.1.png", publicPath: `${iconRoot}/icon-lane-connector-v0.1.png` },
  "lane-spark": { id: "lane-spark", filename: "icon-lane-spark-v0.1.png", publicPath: `${iconRoot}/icon-lane-spark-v0.1.png` },
  "nav-people": { id: "nav-people", filename: "icon-lane-builder-v0.1.png", publicPath: `${iconRoot}/icon-lane-builder-v0.1.png` },
  "nav-how": { id: "nav-how", filename: "icon-step-dossier-v0.1.png", publicPath: `${iconRoot}/icon-step-dossier-v0.1.png` },
  "nav-proof": { id: "nav-proof", filename: "icon-proof-v0.1.png", publicPath: `${iconRoot}/icon-proof-v0.1.png` },
  "nav-dues": { id: "nav-dues", filename: "icon-dues-v0.1.png", publicPath: `${iconRoot}/icon-dues-v0.1.png` },
  "nav-deck": { id: "nav-deck", filename: "icon-deck-v0.1.png", publicPath: `${iconRoot}/icon-deck-v0.1.png` },
  "step-dossier": { id: "step-dossier", filename: "icon-step-dossier-v0.1.png", publicPath: `${iconRoot}/icon-step-dossier-v0.1.png` },
  "step-fit": { id: "step-fit", filename: "icon-step-fit-v0.1.png", publicPath: `${iconRoot}/icon-step-fit-v0.1.png` },
  "step-knock": { id: "step-knock", filename: "icon-step-knock-v0.1.png", publicPath: `${iconRoot}/icon-step-knock-v0.1.png` },
  "check-identity": { id: "check-identity", filename: "icon-check-identity-v0.1.png", publicPath: `${iconRoot}/icon-check-identity-v0.1.png` },
  "check-funds": { id: "check-funds", filename: "icon-check-funds-v0.1.png", publicPath: `${iconRoot}/icon-check-funds-v0.1.png` },
  "check-license": { id: "check-license", filename: "icon-check-license-v0.1.png", publicPath: `${iconRoot}/icon-check-license-v0.1.png` },
  "check-employment": { id: "check-employment", filename: "icon-check-employment-v0.1.png", publicPath: `${iconRoot}/icon-check-employment-v0.1.png` },
  "check-reference": { id: "check-reference", filename: "icon-check-reference-v0.1.png", publicPath: `${iconRoot}/icon-check-reference-v0.1.png` },
  "icon-armory": { id: "icon-armory", filename: "icon-armory-v0.1.png", publicPath: `${iconRoot}/icon-armory-v0.1.png` },
  "icon-blueprint": { id: "icon-blueprint", filename: "icon-blueprint-v0.1.png", publicPath: `${iconRoot}/icon-blueprint-v0.1.png` },
  "icon-deck": { id: "icon-deck", filename: "icon-deck-v0.1.png", publicPath: `${iconRoot}/icon-deck-v0.1.png` },
  "icon-dossier": { id: "icon-dossier", filename: "icon-dossier-v0.1.png", publicPath: `${iconRoot}/icon-dossier-v0.1.png` },
  "icon-knock": { id: "icon-knock", filename: "icon-knock-v0.1.png", publicPath: `${iconRoot}/icon-knock-v0.1.png` },
  "icon-register": { id: "icon-register", filename: "icon-register-v0.1.png", publicPath: `${iconRoot}/icon-register-v0.1.png` }
};

/** Tier 3 micro icons — PNG slots in `public/assets/draft/icons/` (SVG fallback until landed). */
export const tier3IconManifest = [
  "lane-builder",
  "lane-operator",
  "lane-backer",
  "lane-connector",
  "lane-spark",
  "nav-proof",
  "nav-dues",
  "icon-armory",
  "icon-deck",
  "icon-dossier",
  "icon-knock",
  "icon-register",
  "icon-blueprint",
  "step-dossier",
  "step-fit",
  "step-knock",
  "check-identity",
  "check-funds",
  "check-license",
  "check-employment",
  "check-reference"
] as const satisfies readonly SiteIconId[];

export const homeStepIcons: SiteIconId[] = ["step-dossier", "step-fit", "step-knock"];

export const laneIconIds: Record<"builder" | "operator" | "backer" | "connector" | "spark", SiteIconId> = {
  builder: "lane-builder",
  operator: "lane-operator",
  backer: "lane-backer",
  connector: "lane-connector",
  spark: "lane-spark"
};

export function crucibleIconId(checkKey: string): SiteIconId {
  if (checkKey.startsWith("identity") || checkKey === "phone") return "check-identity";
  if (checkKey.startsWith("funds")) return "check-funds";
  if (checkKey === "license") return "check-license";
  if (checkKey === "employment") return "check-employment";
  if (checkKey === "reference") return "check-reference";
  return "nav-proof";
}

export const iconDropFolder = "public/assets/draft/icons";
