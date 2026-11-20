import type { Metadata } from "next";
import { Tower } from "@/components/Tower";

export const metadata: Metadata = { title: "Check a codebase · Runway" };

export default function CheckPage() {
  return <Tower />;
}
