import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./soledash.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f1419"
};

export const metadata: Metadata = {
  title: "Starship Explode | AEYE",
  description: "Starship Explode — AEYE operator command surface. Company options, parallel salvo, reactive reinform.",
  applicationName: "Starship Explode",
  icons: {
    icon: [{ url: "/assets/soledash/branding/soledash-favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/assets/soledash/branding/soledash-icon-192.png", sizes: "192x192", type: "image/png" }]
  }
};

export default function SoleDashLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="sole-dash-layout">{children}</div>;
}
