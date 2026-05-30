export type DraftAssetStatus = "landed" | "planned" | "manual";

export type DraftAssetRecord = {
  id: string;
  filename: string;
  publicPath: string;
  status: DraftAssetStatus;
  source: "ghost-forge" | "mascot" | "brand";
  route?: string;
};

/** Mechanical inventory — filenames only, no voice copy. */
export const draftAssetInventory: DraftAssetRecord[] = [
  {
    id: "hero-v01",
    filename: "werkles-draft-hero-foundry-v0.1.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.1.png",
    status: "landed",
    source: "ghost-forge",
    route: "/"
  },
  {
    id: "proof-v01",
    filename: "werkles-draft-proof-trust-v0.1.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.1.png",
    status: "landed",
    source: "ghost-forge",
    route: "/proof"
  },
  {
    id: "hero-ben-workshop",
    filename: "werkles-draft-workshop-interior-ben-pass.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-workshop-interior-ben-pass.png",
    status: "landed",
    source: "ghost-forge",
    route: "home hero (Ben pass)"
  },
  {
    id: "hero-ben-conservatory",
    filename: "werkles-draft-conservatory-ben-pass.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-conservatory-ben-pass.png",
    status: "landed",
    source: "ghost-forge",
    route: "#people strip (Ben pass)"
  },
  {
    id: "hero-v02",
    filename: "werkles-draft-hero-foundry-v0.2.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.2.png",
    status: "landed",
    source: "ghost-forge",
    route: "/"
  },
  {
    id: "proof-v02",
    filename: "werkles-draft-proof-trust-v0.2.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.2.png",
    status: "landed",
    source: "ghost-forge",
    route: "/proof"
  },
  {
    id: "workbench-01",
    filename: "werkles-draft-workbench-hook-01.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-workbench-hook-01.png",
    status: "planned",
    source: "ghost-forge",
    route: "/"
  },
  {
    id: "workbench-02",
    filename: "werkles-draft-workbench-hook-02.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-workbench-hook-02.png",
    status: "planned",
    source: "ghost-forge",
    route: "/"
  },
  {
    id: "workbench-03",
    filename: "werkles-draft-workbench-hook-03.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-workbench-hook-03.png",
    status: "planned",
    source: "ghost-forge",
    route: "/"
  },
  {
    id: "workbench-04",
    filename: "werkles-draft-workbench-hook-04.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-workbench-hook-04.png",
    status: "planned",
    source: "ghost-forge",
    route: "/"
  },
  {
    id: "workbench-05",
    filename: "werkles-draft-workbench-hook-05.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-workbench-hook-05.png",
    status: "planned",
    source: "ghost-forge",
    route: "/"
  },
  {
    id: "brass-full",
    filename: "brass-foreman-full.png",
    publicPath: "/assets/mascot/brass-foreman-full.png",
    status: "manual",
    source: "mascot",
    route: "/membership/success"
  },
  {
    id: "brass-bust",
    filename: "brass-foreman-bust.png",
    publicPath: "/assets/mascot/brass-foreman-bust.png",
    status: "manual",
    source: "mascot",
    route: "/dashboard/crucible"
  }
];

export const ghostForgeDraftFolder = "public/assets/draft/ghost-forge";
export const mascotFolder = "public/assets/mascot";
export const iconDraftFolder = "public/assets/draft/icons";

const styleVariantStyles = ["line", "enamel", "blueprint", "etched"] as const;

const styleVariantIconAssets = [
  { key: "builder", filename: (s: string) => `icon-lane-builder-style-${s}-v0.1.png`, route: "lane builder" },
  { key: "operator", filename: (s: string) => `icon-lane-operator-style-${s}-v0.1.png`, route: "lane operator" },
  { key: "backer", filename: (s: string) => `icon-lane-backer-style-${s}-v0.1.png`, route: "lane backer" },
  { key: "connector", filename: (s: string) => `icon-lane-connector-style-${s}-v0.1.png`, route: "lane connector" },
  { key: "spark", filename: (s: string) => `icon-lane-spark-style-${s}-v0.1.png`, route: "lane spark" },
  { key: "proof", filename: (s: string) => `icon-proof-style-${s}-v0.1.png`, route: "nav proof" },
  { key: "knock", filename: (s: string) => `icon-knock-style-${s}-v0.1.png`, route: "nav knock" },
  { key: "dossier", filename: (s: string) => `icon-dossier-style-${s}-v0.1.png`, route: "nav dossier" },
  { key: "step-fit", filename: (s: string) => `icon-step-fit-style-${s}-v0.1.png`, route: "how step fit" }
] as const;

/** Gate 05 style-variant filenames for review grid (landed when file exists on disk). */
export const styleVariantInventory: DraftAssetRecord[] = [
  ...styleVariantStyles.flatMap((style) => {
    const logoFile = `werkles-draft-logo-w-style-${style}-v0.1.png`;
    return [
      {
        id: `logo-w-${style}`,
        filename: logoFile,
        publicPath: `/assets/draft/ghost-forge/${logoFile}`,
        status: "planned" as const,
        source: "ghost-forge" as const,
        route: `logo W · ${style}`
      },
      ...styleVariantIconAssets.map((asset) => {
        const filename = asset.filename(style);
        return {
          id: `${asset.key}-${style}`,
          filename,
          publicPath: `/assets/draft/icons/${filename}`,
          status: "planned" as const,
          source: "ghost-forge" as const,
          route: `${asset.route} · ${style}`
        };
      })
    ];
  })
];
