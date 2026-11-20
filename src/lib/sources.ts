// Where pinned versions come from (a public GitHub repo, uploaded files, an inventory CSV, the frozen sample) and
// where their dates come from (endoflife.date API v1, CORS-open). All of it runs in the browser.
import { IMAGE_PRODUCT, WANTED, detect, fromCsv, type File, type Finding, type Release } from "../../templates/_shared/eol.ts";

export type Scan = { project: string; source: string; link?: string; findings: Finding[]; files: string[]; releases?: Record<string, Release[]>; asOf?: string };

const API = "https://endoflife.date/api/v1";
const MAX_FILES = 80;

/** "github.com/owner/repo", "owner/repo", ".../tree/branch" → parts. */
export function parseRepo(input: string) {
  const m = input.trim().replace(/\.git$/, "").match(/^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([\w.-]+)\/([\w.-]+)(?:\/tree\/([^?#]+))?\/?$/);
  if (!m) throw new Error("Paste a public GitHub repository, like github.com/mastodon/mastodon");
  return { owner: m[1], repo: m[2], ref: m[3] };
}

export async function fromGitHub(input: string): Promise<Scan> {
  const { owner, repo, ref } = parseRepo(input);
  const get = async (path: string) => {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}${path ? `/${path}` : ""}`, { headers: { Accept: "application/vnd.github+json" } });
    if (r.status === 403 || r.status === 429) throw new Error("GitHub's hourly limit for anonymous requests is used up. Try again later, or upload the files.");
    if (!r.ok) throw new Error(r.status === 404 ? `${owner}/${repo} isn't a public repository (or that branch doesn't exist).` : `GitHub answered ${r.status}.`);
    return r.json();
  };
  const branch = ref ?? (await get("")).default_branch;
  const commit = await get(`commits/${encodeURIComponent(branch)}`);
  const tree = await get(`git/trees/${commit.sha}?recursive=1`);
  const paths = (tree.tree as Array<{ path: string; type: string }>).filter((t) => t.type === "blob" && WANTED(t.path) && !t.path.includes("node_modules/")).map((t) => t.path).slice(0, MAX_FILES);
  const files: File[] = await Promise.all(paths.map(async (path) => ({ path, text: await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${commit.sha}/${path}`).then((r) => (r.ok ? r.text() : "")) })));
  return { project: repo, source: `github.com/${owner}/${repo} at ${commit.sha.slice(0, 7)}`, link: `https://github.com/${owner}/${repo}/tree/${commit.sha}`, findings: detect(files), files: paths };
}

export function fromFiles(files: File[]): Scan {
  const findings = detect(files);
  if (!findings.length) throw new Error("No pinned versions found. Runway reads .nvmrc, .python-version, .ruby-version, .tool-versions, go.mod, package.json, Dockerfiles, compose files and GitHub workflows.");
  return { project: "Our stack", source: files.map((f) => f.path).join(", ").slice(0, 200), findings, files: files.map((f) => f.path) };
}

export async function fromInventory(text: string, name: string): Promise<Scan> {
  const products = await productIndex();
  const findings = fromCsv(text, (n) => products.get(n.toLowerCase()) ?? IMAGE_PRODUCT[n.toLowerCase()]);
  return { project: name.replace(/\.csv$/i, ""), source: name, findings, files: [name] };
}

export const SNAPSHOT = "/samples/mastodon-2026-11-20.json";
export async function fromSnapshot(): Promise<Scan> {
  const s = await fetch(SNAPSHOT).then((r) => r.json());
  return { project: "Mastodon", source: `github.com/mastodon/mastodon at ${String(s.commit).slice(0, 7)}`, link: `${s.repo}/tree/${s.commit}`, findings: s.findings, files: s.files, releases: s.releases, asOf: s.read };
}

/* ---------- endoflife.date ---------- */

let index: Promise<Map<string, string>> | undefined;
/** Every product's name, aliases and label (lower case) → its id. */
export function productIndex() {
  return (index ??= fetch(`${API}/products`)
    .then((r) => r.json())
    .then((j) => {
      const map = new Map<string, string>();
      for (const p of j.result as Array<{ name: string; aliases: string[]; label: string }>) for (const k of [p.name, p.label, ...p.aliases]) map.set(k.toLowerCase(), p.name);
      return map;
    }));
}

const cache = new Map<string, Promise<Release[] | undefined>>();
export function releasesOf(product: string) {
  if (!cache.has(product)) cache.set(product, fetch(`${API}/products/${product}`).then((r) => (r.ok ? r.json().then((j) => j.result.releases as Release[]) : undefined)).catch(() => undefined));
  return cache.get(product)!;
}

/** Releases for every product in the scan (the frozen sample brings its own). */
export async function datesFor(scan: Scan): Promise<Record<string, Release[]>> {
  if (scan.releases) return scan.releases;
  const products = [...new Set(scan.findings.map((f) => f.product))];
  const out: Record<string, Release[]> = {};
  await Promise.all(products.map(async (p) => {
    const r = await releasesOf(p);
    if (r) out[p] = r;
  }));
  return out;
}
