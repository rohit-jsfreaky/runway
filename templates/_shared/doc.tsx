/**
 * What every Runway template shares: the fields (one codebase's pinned versions and their support dates), the
 * wayfinding look, and the timeline both the PDF and the card draw.
 */
import { Line, Rect, Svg, defineTheme, prop } from "@hyper-elements/react";
import { formatDate } from "@hyper-elements/react/template";
import { STATUS_LABEL, runway, type Status } from "./eol.ts";
import sample from "./example.ts";

export const STATUSES = ["ended", "soon", "watch", "unpinned", "ok", "unknown"] as const;

export const fields = {
  project: prop.text({ label: "Project", required: true, maxLength: 60 }),
  source: prop.text({ label: "Read from", required: true, maxLength: 200, guidance: "The repository link or the file names." }),
  asOf: prop.date({ label: "As of", required: true }),
  team: prop.text({ label: "Team", maxLength: 80 }),
  recipient: prop.text({ label: "Notice for (owner)", maxLength: 80, guidance: "The notice lists only this owner's items. Empty: every item." }),
  items: prop.list(
    prop.object(
      {
        component: prop.text({ label: "Component", required: true, maxLength: 40 }),
        version: prop.text({ label: "Version pinned", maxLength: 20 }),
        cycle: prop.text({ label: "Release cycle", maxLength: 20 }),
        where: prop.text({ label: "Where (file:line)", required: true, maxLength: 120 }),
        places: prop.number({ label: "Places pinned", required: true, min: 1, integer: true }),
        status: prop.choice([...STATUSES], { label: "Status", required: true }),
        eol: prop.date({ label: "End of life" }),
        eoas: prop.date({ label: "End of active support" }),
        target: prop.text({ label: "Move to", maxLength: 20 }),
        targetEol: prop.date({ label: "Move-to end of life" }),
        owner: prop.text({ label: "Owner", maxLength: 60 }),
      },
      { label: "Item" },
    ),
    { label: "Items", required: true, min: 1, max: 80 },
  ),
};

export type ItemV = {
  component: string;
  version?: string;
  cycle?: string;
  where: string;
  places: number;
  status: Status;
  eol?: string;
  eoas?: string;
  target?: string;
  targetEol?: string;
  owner?: string;
};
export type Plan = { project: string; source: string; asOf: string; team?: string; recipient?: string; items: ItemV[] };

/** The sample: Mastodon's repository as read on 20 Nov 2026, dates from endoflife.date. Owners are made up. */
export const example = sample as unknown as Plan;

/* ---------- look: airport wayfinding ---------- */

export const INK = "#15171A";
export const INK2 = "#3B4048";
export const MUTED = "#5F6670";
export const LINE = "#E2E4E8";
export const WASH = "#F4F5F6";
export const PAPER = "#FFFFFF";
export const SIGNAL = "#FFCC00";
export const RED = "#B8142B";
export const AMBER = "#8F5A00";
export const GREEN = "#1D7347";

export const SANS = "'Overpass', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'Overpass Mono', Menlo, Consolas, monospace";

export const FONT_FILES = [400, 500, 600, 700, 800].map((w) => ({ family: "Overpass", src: `../fonts/Overpass-${w}.woff`, weight: w })).concat([400, 600].map((w) => ({ family: "Overpass Mono", src: `../fonts/OverpassMono-${w}.woff`, weight: w })));
const CDN = "https://cdn.jsdelivr.net/npm/@fontsource";
export const FONT_URLS = [
  { family: "Overpass", src: `${CDN}/overpass@5.3.0/files/overpass-latin-400-normal.woff2`, weight: 400 },
  { family: "Overpass", src: `${CDN}/overpass@5.3.0/files/overpass-latin-700-normal.woff2`, weight: 700 },
  { family: "Overpass Mono", src: `${CDN}/overpass-mono@5.3.0/files/overpass-mono-latin-400-normal.woff2`, weight: 400 },
];

export const theme = defineTheme({
  colors: { background: WASH, foreground: INK, primary: INK, primaryForeground: PAPER, muted: MUTED, border: LINE, paper: PAPER, signal: SIGNAL, red: RED },
  fonts: { body: SANS, heading: SANS },
  fontSizes: { body: 16 },
  lineHeights: { body: 1.55 },
  elements: {
    Heading: { fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.12, by: { level: { 1: { fontSize: 30, mobile: { fontSize: 25 } }, 2: { fontSize: 19 } } } },
  },
  styles: {
    label: { fontFamily: MONO, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED },
    sheet: { backgroundColor: PAPER, padding: 32, gap: 18, border: `1px solid ${LINE}` },
  },
});

/* ---------- helpers ---------- */

export const longDate = (iso: string) => formatDate(iso, "en-GB", { day: "numeric", month: "long", year: "numeric" });
export const shortDate = (iso: string) => formatDate(iso, "en-GB", { day: "numeric", month: "short", year: "numeric" });
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const statusLabel = (s: Status) => STATUS_LABEL[s];
export const statusColor = (s: Status) => (s === "ended" ? RED : s === "soon" || s === "watch" ? AMBER : s === "ok" ? GREEN : MUTED);
export const act = (p: Pick<Plan, "items">) => p.items.filter((i) => i.status === "ended" || i.status === "soon");
export const count = (p: Pick<Plan, "items">, s: Status) => p.items.filter((i) => i.status === s).length;
export const name = (i: ItemV) => `${i.component} ${i.cycle ?? i.version ?? ""}`.trim();
export const placesText = (i: ItemV) => `${i.where.split(", ")[0]}${i.places > 1 ? ` +${i.places - 1} more` : ""}`;
/** "Ended 12 Nov 2026, 8 days ago" / "Ends 15 Jul 2027, in 8 months". */
export const endsText = (i: ItemV, asOf: string) => (i.eol ? `${i.eol <= asOf ? "Ended" : "Ends"} ${shortDate(i.eol)}, ${runway(asOf, i.eol)}` : i.status === "unpinned" ? "No version pinned" : "No published date");

/* ---------- the timeline ---------- */

/**
 * Each dated item as a bar ending at its end of life, on a shared axis from a year before today to four years after.
 * Today is a black line; past it, the bar is red. A notch marks the end of active support.
 */
export function Timeline({ items, asOf, width, rowH = 22, labelW = 150 }: { items: ItemV[]; asOf: string; width: number; rowH?: number; labelW?: number }) {
  const dated = items.filter((i) => i.eol);
  const now = Date.parse(asOf);
  const start = Date.UTC(new Date(now).getUTCFullYear() - 1, 0, 1);
  const end = Date.UTC(new Date(now).getUTCFullYear() + 4, 0, 1);
  const plot = width - labelW;
  const x = (ms: number) => labelW + Math.max(0, Math.min(plot, ((ms - start) / (end - start)) * plot));
  const H = dated.length * rowH + 18;
  const years = Array.from({ length: 6 }, (_, k) => Date.UTC(new Date(now).getUTCFullYear() - 1 + k, 0, 1));
  return (
    <Svg width={width} height={H} title={`Support timeline for ${plural(dated.length, "component")}, today ${asOf}`}>
      {years.map((y) => (
        <Line key={`y${y}`} x1={x(y)} y1={0} x2={x(y)} y2={H - 16} style={{ stroke: LINE, strokeWidth: 1 }} />
      ))}
      {dated.map((i, k) => {
        const e = Date.parse(i.eol!);
        const y = k * rowH + 5;
        const h = rowH - 10;
        const past = e <= now;
        return [
          <Rect key={`b${k}`} x={labelW} y={y} width={Math.max(2, x(Math.min(e, now)) - labelW)} height={h} style={{ fill: past ? RED : INK }} />,
          !past ? <Rect key={`f${k}`} x={x(now)} y={y} width={Math.max(2, x(e) - x(now))} height={h} style={{ fill: i.status === "soon" || i.status === "watch" ? SIGNAL : "#C9CED6" }} /> : null,
          i.eoas && Date.parse(i.eoas) > start && Date.parse(i.eoas) < e ? <Rect key={`s${k}`} x={x(Date.parse(i.eoas)) - 1} y={y - 2} width={2} height={h + 4} style={{ fill: INK }} /> : null,
        ];
      })}
      <Rect x={x(now) - 1} y={0} width={2} height={H - 16} style={{ fill: INK }} />
    </Svg>
  );
}
