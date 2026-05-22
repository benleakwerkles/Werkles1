export type AccessWeight = "lightweight" | "middleweight" | "heavyweight";

export type AccessWeightProfile = {
  profile_depth?: string | null;
  membership_tier?: string | null;
  id_status?: string | null;
  funds_status?: string | null;
};

export function deriveAccessWeight(profile?: AccessWeightProfile | null): AccessWeight {
  if (!profile) return "lightweight";

  if (
    profile.id_status === "live_verified" &&
    profile.funds_status === "live_verified" &&
    profile.membership_tier === "member"
  ) {
    return "heavyweight";
  }

  if (
    profile.membership_tier === "member" ||
    profile.profile_depth === "full_audit" ||
    profile.profile_depth === "blueprint"
  ) {
    return "middleweight";
  }

  return "lightweight";
}

export function canContactWeight(actor: AccessWeight, target: AccessWeight) {
  return !(actor === "lightweight" && target === "heavyweight");
}
