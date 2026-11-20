import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: [
    { path: "../../fonts/Overpass-400.woff", weight: "400" },
    { path: "../../fonts/Overpass-500.woff", weight: "500" },
    { path: "../../fonts/Overpass-600.woff", weight: "600" },
    { path: "../../fonts/Overpass-700.woff", weight: "700" },
    { path: "../../fonts/Overpass-800.woff", weight: "800" },
  ],
  variable: "--font-overpass",
});
const mono = localFont({
  src: [
    { path: "../../fonts/OverpassMono-400.woff", weight: "400" },
    { path: "../../fonts/OverpassMono-600.woff", weight: "600" },
  ],
  variable: "--font-overpass-mono",
});

export const metadata: Metadata = {
  title: "Runway · How long each part of your stack has left",
  description:
    "Paste a GitHub repository. Runway finds every pinned version of Node, Python, Postgres, Redis, Debian and more, checks it against endoflife.date, and writes the upgrade plan and the notice for each owner. Built with Hyper Elements.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
