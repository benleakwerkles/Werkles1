export const discoveryStateValues = [
  "Received",
  "Thinking",
  "Blocked",
  "Response Incoming",
  "Complete",
  "Failed"
] as const;

export const discoveryLaneValues = [
  "Builder",
  "Operator",
  "Backer",
  "Connector",
  "Spark",
  "Unsure"
] as const;

export const discoveryAssetValues = [
  "Skills",
  "Time",
  "Money",
  "Network",
  "Tools",
  "Customers",
  "Place",
  "Idea"
] as const;

export const discoveryResponseSpeedValues = ["ASAP", "Few days", "No rush"] as const;

export type DiscoveryState = (typeof discoveryStateValues)[number];
export type DiscoveryLane = (typeof discoveryLaneValues)[number];
export type DiscoveryAsset = (typeof discoveryAssetValues)[number];
export type DiscoveryResponseSpeed = (typeof discoveryResponseSpeedValues)[number];

export type DiscoveryIntakeInput = {
  name: string;
  contact: string;
  situation: string;
  goal: string;
  why_now: string;
  assets: DiscoveryAsset[];
  stated_blocker: string;
  tried: string;
  constraints: string;
  one_thing: string;
  lane: DiscoveryLane;
  response_speed: DiscoveryResponseSpeed;
  notes: string;
};

export type DiscoveryIntakeRecord = DiscoveryIntakeInput & {
  user_id: string;
  intake_date: string;
  state: DiscoveryState;
  record_path: string;
  schema: "werkles_discovery_intake_v1";
};
