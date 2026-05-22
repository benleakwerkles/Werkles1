import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Werkles | Business partner matching",
  description:
    "Werkles helps builders, operators, backers, connectors, and sparks find the missing piece for a real business.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  },
  icons: {
    icon: "/assets/werkles-app-icon-board.png",
    apple: "/assets/werkles-app-icon-board.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
