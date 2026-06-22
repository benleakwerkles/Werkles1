import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type ScreenshotResult = {
  ok: boolean;
  screenshotPath: string;
  error: string | null;
};

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "Z");
}

export function captureScreenshot(outDir: string): ScreenshotResult {
  const screenshotsDir = path.join(outDir, "screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const screenshotPath = path.join(screenshotsDir, `workspace_${stamp()}.png`);
  const script = `
$ErrorActionPreference = 'Stop'
$out = [Environment]::GetEnvironmentVariable('OPERATOR_ASSIST_SCREENSHOT_OUT')
if (-not $out) {
  throw 'OPERATOR_ASSIST_SCREENSHOT_OUT is not set'
}
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bounds.Size)
$bitmap.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
`;

  try {
    execFileSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      {
        env: {
          ...process.env,
          OPERATOR_ASSIST_SCREENSHOT_OUT: screenshotPath,
        },
        stdio: "pipe",
        windowsHide: true,
      }
    );
    return { ok: true, screenshotPath, error: null };
  } catch (err) {
    return {
      ok: false,
      screenshotPath,
      error: err instanceof Error ? err.message : "screenshot failed"
    };
  }
}
