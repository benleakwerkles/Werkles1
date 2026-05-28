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
    id: "hero-v02",
    filename: "werkles-draft-hero-foundry-v0.2.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-hero-foundry-v0.2.png",
    status: "planned",
    source: "ghost-forge",
    route: "/"
  },
  {
    id: "proof-v02",
    filename: "werkles-draft-proof-trust-v0.2.png",
    publicPath: "/assets/draft/ghost-forge/werkles-draft-proof-trust-v0.2.png",
    status: "planned",
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
