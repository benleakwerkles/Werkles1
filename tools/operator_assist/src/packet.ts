export type PacketBuildResult = {
  destination: string;
  packet: string;
};

function validateDestination(destination: string): void {
  if (!/^[A-Za-z][A-Za-z0-9_-]*@[A-Za-z][A-Za-z0-9_-]*$/.test(destination)) {
    throw new Error("Destination must be in Aeye@Machine form, e.g. Dink@Betsy.");
  }
}

function compactMission(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function buildPacket(destination: string, missionText: string): PacketBuildResult {
  const target = destination.trim();
  const mission = compactMission(missionText);

  validateDestination(target);
  if (!mission) {
    throw new Error("Mission text is required.");
  }

  const packet = [
    `TO: ${target}`,
    "FROM: OperatorAssist@Betsy",
    `CREATED_AT: ${new Date().toISOString()}`,
    "",
    "MISSION:",
    mission,
    "",
    "RULES:",
    "- No auto-send.",
    "- Act only within repo cockpit/doctrine gates.",
    "- Return receipt with files changed, blockers, and next action."
  ].join("\n");

  return { destination: target, packet };
}
