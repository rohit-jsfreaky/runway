/**
 * Runway's core, with no imports so the browser, the server and the templates share it: find the versions a
 * codebase pins, match them to endoflife.date releases, and say how much runway each one has left.
 */

export type Finding = { component: string; product: string; version: string; where: string; evidence: string; owner?: string };
export type File = { path: string; text: string };
/** One release cycle from endoflife.date API v1 (the fields we use). */
export type Release = { name: string; label?: string; isLts?: boolean; isEol?: boolean; eolFrom: string | null; eoasFrom?: string | null; latest?: { name: string } | null };
export type Status = "ended" | "soon" | "watch" | "ok" | "unpinned" | "unknown";

/* ------------------------------------------------------------ products */

/** Docker image (or tool) name → endoflife.date product. shortcut: common images only, extend as repos need. */
export const IMAGE_PRODUCT: Record<string, string> = {
  node: "nodejs", nodejs: "nodejs", python: "python", ruby: "ruby", golang: "go", go: "go", postgres: "postgresql", postgresql: "postgresql",
  redis: "redis", valkey: "valkey", mysql: "mysql", mariadb: "mariadb", mongo: "mongodb", mongodb: "mongodb", nginx: "nginx",
  alpine: "alpine-linux", debian: "debian", ubuntu: "ubuntu", php: "php", openjdk: "eclipse-temurin", "eclipse-temurin": "eclipse-temurin",
  elasticsearch: "elasticsearch", rabbitmq: "rabbitmq", memcached: "memcached", haproxy: "haproxy", traefik: "traefik", kafka: "apache-kafka",
  "cp-kafka": "confluent-platform", clickhouse: "clickhouse", "clickhouse-server": "clickhouse", deno: "deno", bun: "bun", dotnet: "dotnet",
  "dotnet/sdk": "dotnet", "dotnet/aspnet": "dotnet", rust: "rust", erlang: "erlang", elixir: "elixir",
};
export const PRODUCT_LABEL: Record<string, string> = {
  nodejs: "Node.js", python: "Python", ruby: "Ruby", go: "Go", postgresql: "PostgreSQL", redis: "Redis", valkey: "Valkey", mysql: "MySQL",
  mariadb: "MariaDB", mongodb: "MongoDB", nginx: "nginx", "alpine-linux": "Alpine Linux", debian: "Debian", ubuntu: "Ubuntu", php: "PHP",
  "eclipse-temurin": "Java (Temurin)", elasticsearch: "Elasticsearch", rabbitmq: "RabbitMQ", memcached: "Memcached", haproxy: "HAProxy",
  traefik: "Traefik", "apache-kafka": "Kafka", "confluent-platform": "Confluent Platform", clickhouse: "ClickHouse", deno: "Deno", bun: "Bun",
  dotnet: ".NET", rust: "Rust", erlang: "Erlang", elixir: "Elixir", kubernetes: "Kubernetes", "amazon-eks": "Amazon EKS",
};
export const labelOf = (product: string) => PRODUCT_LABEL[product] ?? product;

/** Debian and Ubuntu codenames inside image tags. */
const CODENAME: Record<string, [string, string]> = {
  buster: ["debian", "10"], bullseye: ["debian", "11"], bookworm: ["debian", "12"], trixie: ["debian", "13"], forky: ["debian", "14"],
  bionic: ["ubuntu", "18.04"], focal: ["ubuntu", "20.04"], jammy: ["ubuntu", "22.04"], noble: ["ubuntu", "24.04"], plucky: ["ubuntu", "25.04"],
};

/* ------------------------------------------------------------ detection */

const lineOf = (text: string, index: number) => text.slice(0, index).split("\n").length;
const base = (path: string) => path.split("/").pop()!.toLowerCase();
const majorMinor = (v: string) => v.replace(/^v/i, "").match(/^\d+(?:\.\d+)?/)?.[0] ?? "";

/** An image reference ("docker.io/library/postgres:14-alpine") → findings for the product and the OS in its tag. */
export function fromImage(ref: string, where: string): Finding[] {
  const clean = ref.trim().replace(/^["']|["']$/g, "").replace(/@sha256:.*$/, "");
  if (!clean || clean.includes("$")) return [];
  const slash = clean.split("/");
  // A first segment is a registry only when more segments follow ("docker.io/node:26", not "postgres:14").
  const registry = slash.length > 1 && (/[.:]/.test(slash[0]) || slash[0] === "localhost");
  const nameTag = slash.slice(registry ? 1 : 0).join("/");
  const [rawName, tag = ""] = nameTag.split(":");
  const name = rawName.replace(/^library\//, "");
  const product = IMAGE_PRODUCT[name] ?? IMAGE_PRODUCT[name.split("/").pop()!];
  if (!product) return [];
  const out: Finding[] = [];
  const version = majorMinor(tag);
  out.push({ component: labelOf(product), product, version: version || "", where, evidence: clean });
  // The OS under the image: "-alpine3.20", "-bookworm", "-trixie-slim".
  const alpine = tag.match(/alpine(\d+\.\d+)/);
  if (alpine) out.push({ component: labelOf("alpine-linux"), product: "alpine-linux", version: alpine[1], where, evidence: clean });
  for (const [code, [os, v]] of Object.entries(CODENAME)) if (new RegExp(`(^|[-.])${code}($|[-.])`).test(tag)) out.push({ component: labelOf(os), product: os, version: v, where, evidence: clean });
  return out;
}

/** Every pinned version in a set of files. `where` is "path:line". */
export function detect(files: File[]): Finding[] {
  const out: Finding[] = [];
  const push = (f: Finding) => out.push(f);
  for (const { path, text } of files) {
    const name = base(path);
    const at = (i: number) => `${path}:${lineOf(text, i)}`;
    if (name === ".nvmrc" || name === ".node-version") {
      const v = majorMinor(text.trim());
      push({ component: "Node.js", product: "nodejs", version: v, where: `${path}:1`, evidence: text.trim() });
    } else if (name === ".python-version") {
      push({ component: "Python", product: "python", version: majorMinor(text.trim()), where: `${path}:1`, evidence: text.trim().split("\n")[0] });
    } else if (name === ".ruby-version") {
      push({ component: "Ruby", product: "ruby", version: majorMinor(text.trim().replace(/^ruby-/, "")), where: `${path}:1`, evidence: text.trim() });
    } else if (name === ".tool-versions") {
      for (const m of text.matchAll(/^(\S+)\s+(\S+)/gm)) {
        const product = IMAGE_PRODUCT[m[1]] ?? m[1];
        push({ component: labelOf(product), product, version: majorMinor(m[2]), where: at(m.index!), evidence: m[0] });
      }
    } else if (name === "go.mod") {
      const m = text.match(/^go\s+(\d+\.\d+)/m);
      if (m) push({ component: "Go", product: "go", version: m[1], where: at(m.index!), evidence: m[0] });
    } else if (name === "package.json") {
      try {
        const node = JSON.parse(text)?.engines?.node as string | undefined;
        const v = node?.match(/\d+(?:\.\d+)?/)?.[0];
        if (node && v) push({ component: "Node.js", product: "nodejs", version: v.split(".")[0], where: `${path}:${lineOf(text, text.indexOf('"engines"'))}`, evidence: `engines.node "${node}"` });
      } catch {}
    } else if (/(^|\.)dockerfile$|^dockerfile/.test(name)) {
      // ARG defaults first, so FROM node:${NODE_VERSION} resolves.
      const args = new Map<string, string>();
      for (const m of text.matchAll(/^ARG\s+(\w+)\s*=\s*["']?([^"'\s]+)/gm)) args.set(m[1], m[2]);
      const stages = new Set<string>();
      for (const m of text.matchAll(/^FROM\s+(?:--platform=\S+\s+)?(\S+)(?:\s+AS\s+(\S+))?/gim)) {
        if (m[2]) stages.add(m[2].toLowerCase());
        if (stages.has(m[1].toLowerCase()) && !m[1].includes(":")) continue; // an earlier build stage, not an image
        const ref = m[1].replace(/\$\{?(\w+)\}?/g, (_, k) => args.get(k) ?? `$${k}`);
        if (/\$/.test(ref.split("/").pop()!.split(":")[0])) continue; // a registry variable alone is fine; the image name must resolve
        out.push(...fromImage(ref.replace(/^\$\w+\//, ""), at(m.index!)));
      }
    } else if (/(^|[-.])(docker-)?compose[\w.-]*\.ya?ml$/.test(name) || /\.github\/workflows\/.+\.ya?ml$/.test(path)) {
      for (const m of text.matchAll(/^\s*(?:-\s*)?image:\s*(\S+)/gm)) {
        if (text.slice(text.lastIndexOf("\n", m.index!) + 1, m.index! + 1).trimStart().startsWith("#")) continue;
        const ref = m[1].replace(/^["']|["']$/g, "");
        if (!ref.includes(":") && !ref.includes("$")) {
          const product = IMAGE_PRODUCT[ref.split("/").pop()!];
          if (product) push({ component: labelOf(product), product, version: "", where: at(m.index!), evidence: ref });
          continue;
        }
        out.push(...fromImage(ref, at(m.index!)));
      }
      for (const m of text.matchAll(/^\s*(node|python)-version:\s*["']?([\w.]+)/gm)) {
        const product = m[1] === "node" ? "nodejs" : "python";
        push({ component: labelOf(product), product, version: majorMinor(m[2].replace(/\.x$/, "")), where: at(m.index!), evidence: m[0].trim() });
      }
      for (const m of text.matchAll(/runs-on:\s*["']?ubuntu-(\d+\.\d+)/g)) push({ component: "Ubuntu", product: "ubuntu", version: m[1], where: at(m.index!), evidence: `ubuntu-${m[1]}` });
    }
  }
  // Same product and version found in several places: keep one row, list the places.
  const seen = new Map<string, Finding>();
  for (const f of out) {
    const key = `${f.product}@${f.version}`;
    const prev = seen.get(key);
    if (prev) prev.where = prev.where.split(", ").includes(f.where) ? prev.where : `${prev.where}, ${f.where}`;
    else seen.set(key, { ...f });
  }
  return [...seen.values()];
}

/** The files worth fetching from a repository listing (paths relative to its root). */
export const WANTED = (path: string) =>
  /^(\.nvmrc|\.node-version|\.python-version|\.ruby-version|\.tool-versions|go\.mod|package\.json)$/i.test(path) ||
  /(^|\/)(dockerfile[\w.-]*|[\w.-]*\.dockerfile)$/i.test(path) ||
  /(^|\/)(docker-)?compose[\w.-]*\.ya?ml$/i.test(path) ||
  /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(path);

/* ------------------------------------------------------------ matching */

/** The release cycle a pinned version belongs to: "14" → "14", "3.12.4" → "3.12", "7" → newest "7.x". */
export function matchRelease(releases: Release[], version: string): Release | undefined {
  if (!version) return undefined;
  const exact = releases.find((r) => r.name === version);
  if (exact) return exact;
  const parent = releases.filter((r) => version.startsWith(`${r.name}.`)).sort((a, b) => b.name.length - a.name.length)[0];
  if (parent) return parent;
  // Releases are newest first in the API.
  return releases.find((r) => r.name.startsWith(`${version}.`));
}

/** The release to move to: the newest still supported, LTS when the product has LTS releases. */
export function targetRelease(releases: Release[], today: string): Release | undefined {
  const alive = releases.filter((r) => !r.eolFrom || r.eolFrom > today);
  const lts = alive.filter((r) => r.isLts);
  return (releases.some((r) => r.isLts) && lts.length ? lts : alive)[0];
}

export const DAY = 86_400_000;
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);

export function statusOf(version: string, release: Release | undefined, today: string): Status {
  if (!version) return "unpinned";
  if (!release) return "unknown";
  if (!release.eolFrom) return "ok";
  const left = daysBetween(today, release.eolFrom);
  return left <= 0 ? "ended" : left <= 183 ? "soon" : left <= 365 ? "watch" : "ok";
}

export const STATUS_LABEL: Record<Status, string> = {
  ended: "Past end of life",
  soon: "Ends within 6 months",
  watch: "Ends within a year",
  ok: "Supported",
  unpinned: "Not pinned",
  unknown: "No dates",
};
export const STATUS_ORDER: Status[] = ["ended", "soon", "watch", "unpinned", "ok", "unknown"];

/** "in 142 days", "8 days ago", "today". */
export function runway(today: string, date: string) {
  const d = daysBetween(today, date);
  if (d === 0) return "today";
  const n = Math.abs(d);
  const span = n >= 730 ? `${Math.round(n / 365)} years` : n >= 60 ? `${Math.round(n / 30.4)} months` : `${n} ${n === 1 ? "day" : "days"}`;
  return d > 0 ? `in ${span}` : `${span} ago`;
}

/** Inventory CSV: component (or product), version, and optionally owner and where. */
export function fromCsv(text: string, resolve: (name: string) => string | undefined): Finding[] {
  const rows = text.trim().split(/\r?\n/).map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one row.");
  const head = rows[0].map((h) => h.toLowerCase());
  const col = (...n: string[]) => head.findIndex((h) => n.includes(h));
  const [c, v, o, w] = [col("component", "product", "name", "technology"), col("version", "cycle"), col("owner", "team"), col("where", "service", "location", "system")];
  if (c < 0 || v < 0) throw new Error("The CSV needs a component column and a version column.");
  return rows.slice(1).flatMap((r, i) => {
    const name = r[c];
    if (!name) return [];
    const product = resolve(name) ?? name.toLowerCase();
    return [{ component: labelOf(product) === product ? name : labelOf(product), product, version: majorMinor(r[v] ?? ""), where: r[w] || `row ${i + 2}`, evidence: `${name} ${r[v] ?? ""}`.trim(), owner: r[o] || undefined }];
  });
}

/* ------------------------------------------------------------ the runway */

export type Item = Finding & {
  cycle?: string; // the release cycle matched, e.g. "14"
  status: Status;
  eol?: string;
  eoas?: string;
  lts?: boolean;
  latest?: string;
  target?: string; // the release to move to
  targetEol?: string;
};

/** Findings + each product's releases → one row per product and release cycle, most urgent first. */
export function resolve(findings: Finding[], releasesOf: (product: string) => Release[] | undefined, today: string): Item[] {
  const rows = new Map<string, Item>();
  for (const f of findings) {
    const releases = releasesOf(f.product);
    const r = releases ? matchRelease(releases, f.version) : undefined;
    const key = `${f.product}@${r?.name ?? f.version}`;
    const prev = rows.get(key);
    if (prev) {
      for (const w of f.where.split(", ")) if (!prev.where.split(", ").includes(w)) prev.where += `, ${w}`;
      prev.owner ??= f.owner;
      continue;
    }
    const status = releases ? statusOf(f.version, r, today) : f.version ? "unknown" : "unpinned";
    const t = releases && (status === "ended" || status === "soon" || status === "watch" || status === "unpinned") ? targetRelease(releases, today) : undefined;
    rows.set(key, {
      ...f,
      cycle: r?.name,
      status,
      eol: r?.eolFrom ?? undefined,
      eoas: r?.eoasFrom ?? undefined,
      lts: r?.isLts,
      latest: r?.latest?.name,
      target: t && t.name !== r?.name ? t.name : undefined,
      targetEol: t && t.name !== r?.name ? (t.eolFrom ?? undefined) : undefined,
    });
  }
  const rank = (s: Status) => STATUS_ORDER.indexOf(s);
  return [...rows.values()].sort((a, b) => rank(a.status) - rank(b.status) || (a.eol ?? "9999").localeCompare(b.eol ?? "9999") || a.component.localeCompare(b.component));
}

/** Rows → the values the templates take. */
export function toPlan(items: Item[], meta: { project: string; source: string; asOf: string; team?: string; recipient?: string }) {
  return {
    project: meta.project.slice(0, 60),
    source: meta.source.slice(0, 200),
    asOf: meta.asOf,
    team: meta.team?.trim().slice(0, 80) || undefined,
    recipient: meta.recipient?.trim().slice(0, 80) || undefined,
    items: items.slice(0, 80).map((i) => ({
      component: i.component.slice(0, 40),
      version: i.version.slice(0, 20) || undefined,
      cycle: i.cycle?.slice(0, 20),
      where: (i.where.split(", ").slice(0, 3).join(", ")).slice(0, 120),
      places: i.where.split(", ").length,
      status: i.status,
      eol: i.eol,
      eoas: i.eoas,
      target: i.target,
      targetEol: i.targetEol,
      owner: i.owner?.trim().slice(0, 60) || undefined,
    })),
  };
}
