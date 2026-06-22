import { getConfig } from "./config.ts";
import { captureScreenshot } from "./screenshot.ts";
import { analyzeScreenshot } from "./vision.ts";
import { buildPacket } from "./packet.ts";
import { copyToClipboard } from "./clipboard.ts";
import { writeJsonReceipt, writePacketFile } from "./receipt.ts";

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage(): never {
  process.stderr.write(
    [
      "Usage:",
      "  npm run snapshot",
      "  npm run packet -- Dink@Betsy \"mission text\""
    ].join("\n") + "\n"
  );
  process.exit(1);
}

async function runSnapshot(): Promise<void> {
  const config = getConfig();
  const screenshot = captureScreenshot(config.outDir);

  const vision = screenshot.ok
    ? await analyzeScreenshot(config, screenshot.screenshotPath)
    : {
        ok: false,
        provider: config.provider,
        model: null,
        analysis: "Screenshot capture failed; vision analysis skipped.",
        error: screenshot.error
      };

  const receipt = writeJsonReceipt(config.outDir, "snapshot", {
    ok: screenshot.ok && vision.ok,
    screenshot_ok: screenshot.ok,
    screenshot_path: screenshot.screenshotPath,
    screenshot_error: screenshot.error,
    provider: vision.provider,
    model: vision.model,
    analysis_ok: vision.ok,
    analysis: vision.analysis,
    analysis_error: vision.error,
    notes_kind: "PowerToys Workspaces/FancyZones build notes"
  });

  printJson({
    ok: screenshot.ok,
    screenshot_path: screenshot.screenshotPath,
    receipt_path: receipt.receiptPath,
    provider: vision.provider,
    analysis_ok: vision.ok,
    analysis_error: vision.error
  });
}

async function runPacket(args: string[]): Promise<void> {
  const [destination, ...missionParts] = args;
  const missionText = missionParts.join(" ").trim();
  if (!destination || !missionText) usage();

  const config = getConfig();
  const built = buildPacket(destination, missionText);
  const packetPath = writePacketFile(config.outDir, built.packet);
  const clipboard = copyToClipboard(built.packet);
  const receipt = writeJsonReceipt(config.outDir, "packet", {
    ok: clipboard.ok,
    destination: built.destination,
    packet_path: packetPath,
    copied_to_clipboard: clipboard.ok,
    clipboard_error: clipboard.error,
    auto_send: false,
    auto_paste: false
  });

  printJson({
    ok: clipboard.ok,
    destination: built.destination,
    packet_path: packetPath,
    receipt_path: receipt.receiptPath,
    copied_to_clipboard: clipboard.ok,
    clipboard_error: clipboard.error
  });
}

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  if (command === "snapshot") {
    await runSnapshot();
    return;
  }

  if (command === "packet") {
    await runPacket(args);
    return;
  }

  usage();
}

main().catch((err) => {
  printJson({
    ok: false,
    error: err instanceof Error ? err.message : "operator assist failed"
  });
  process.exit(1);
});
