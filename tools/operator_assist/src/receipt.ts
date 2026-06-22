import fs from "node:fs";
import path from "node:path";

export type ReceiptWriteResult = {
  receiptPath: string;
};

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "Z");
}

export function writeJsonReceipt(
  outDir: string,
  kind: "snapshot" | "packet",
  payload: Record<string, unknown>
): ReceiptWriteResult {
  const receiptDir = path.join(outDir, "receipts");
  fs.mkdirSync(receiptDir, { recursive: true });

  const receiptPath = path.join(receiptDir, `${stamp()}_${kind}.json`);
  const body = {
    kind,
    created_at: new Date().toISOString(),
    ...payload
  };
  fs.writeFileSync(receiptPath, `${JSON.stringify(body, null, 2)}\n`, "utf8");

  return { receiptPath };
}

export function writePacketFile(outDir: string, packet: string): string {
  const packetDir = path.join(outDir, "packets");
  fs.mkdirSync(packetDir, { recursive: true });

  const packetPath = path.join(packetDir, `${stamp()}_packet.md`);
  fs.writeFileSync(packetPath, `${packet.trim()}\n`, "utf8");
  return packetPath;
}
