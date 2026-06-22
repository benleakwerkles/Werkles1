import { spawnSync } from "node:child_process";

export type ClipboardResult = {
  ok: boolean;
  error: string | null;
};

export function copyToClipboard(text: string): ClipboardResult {
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-Command", "$input | Set-Clipboard"],
    {
      input: text,
      encoding: "utf8",
      windowsHide: true
    }
  );

  if (result.status === 0) {
    return { ok: true, error: null };
  }

  return {
    ok: false,
    error: result.stderr?.toString().trim() || result.error?.message || "Set-Clipboard failed"
  };
}
