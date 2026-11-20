"use client";

import { renderLocal } from "@/lib/render-local";
import NextLink from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Download01, FileCheck02, Image01, LinkExternal01, Mail01, Upload01, XClose } from "@untitledui/icons";
import { STATUS_LABEL, resolve, runway, toPlan, type Item, type Release, type Status } from "../../templates/_shared/eol.ts";
import { datesFor, fromFiles, fromGitHub, fromInventory, fromSnapshot, type Scan } from "@/lib/sources";
import { Mark } from "./Mark";

type Out = "plan" | "notice" | "board";
const OUTS: Array<{ key: Out; label: string; icon: ReactNode; file: string }> = [
  { key: "plan", label: "Upgrade plan", icon: <FileCheck02 size={16} />, file: "upgrade-plan.pdf" },
  { key: "notice", label: "Owner notice", icon: <Mail01 size={16} />, file: "eol-notice.html" },
  { key: "board", label: "Board", icon: <Image01 size={16} />, file: "runway-board.png" },
];
const TONE: Record<Status, string> = {
  ended: "bg-red text-white",
  soon: "bg-signal text-ink",
  watch: "bg-signal-soft text-ink",
  unpinned: "bg-wash text-ink-2 border border-rule",
  ok: "bg-green-soft text-green",
  unknown: "bg-wash text-muted",
};
const keyOf = (i: Item) => `${i.product}@${i.cycle ?? i.version}`;
const ownersKey = (project: string) => `runway:owners:${project.toLowerCase()}`;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function Tower() {
  const [scan, setScan] = useState<Scan | null>(null);
  const [releases, setReleases] = useState<Record<string, Release[]>>({});
  const [asOf, setAsOf] = useState("");
  const [owners, setOwners] = useState<Record<string, string>>({});
  const [project, setProject] = useState("");
  const [team, setTeam] = useState("");
  const [tab, setTab] = useState<"board" | "timeline">("board");
  const [sheet, setSheet] = useState<Out | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function open(get: () => Promise<Scan>, label: string) {
    setBusy(label);
    setError(null);
    try {
      const s = await get();
      const r = await datesFor(s);
      let saved: Record<string, string> = {};
      try {
        saved = JSON.parse(localStorage.getItem(ownersKey(s.project)) ?? "{}");
      } catch {}
      setScan(s);
      setReleases(r);
      setAsOf(s.asOf ?? today());
      setOwners(saved);
      setProject(s.project);
      setTab("board");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (!project) return;
    try {
      localStorage.setItem(ownersKey(project), JSON.stringify(owners));
    } catch {}
  }, [owners, project]);

  const items = useMemo(() => {
    if (!scan) return [];
    return resolve(scan.findings, (p) => releases[p], asOf).map((i) => ({ ...i, owner: owners[keyOf(i)] ?? i.owner }));
  }, [scan, releases, asOf, owners]);

  if (!scan) return <Start busy={busy} error={error} open={open} />;

  const count = (s: Status) => items.filter((i) => i.status === s).length;
  const ownerList = [...new Set(items.map((i) => i.owner).filter(Boolean) as string[])].sort();
  const meta = { project: project || scan.project, source: scan.source, asOf, team };

  return (
    <div className="min-h-dvh flex flex-col bg-paper">
      <header className="h-14 shrink-0 bg-ink text-white flex items-center gap-3 px-4 md:px-6">
        <NextLink href="/" className="flex items-center gap-2 font-extrabold text-[19px] tracking-tight" aria-label="Runway home">
          <Mark /> <span className="max-[400px]:hidden">Runway</span>
        </NextLink>
        <span className="hidden md:inline font-mono text-[12px] text-white/60 truncate">{scan.source}</span>
        {scan.link ? (
          <a href={scan.link} target="_blank" rel="noreferrer" className="hidden md:inline text-white/60 hover:text-white" aria-label="Open the repository at this commit">
            <LinkExternal01 size={14} />
          </a>
        ) : null}
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {OUTS.map((o) => (
            <button key={o.key} className={`btn !py-1.5 max-lg:!px-2.5 ${o.key === "plan" ? "btn-signal" : "bg-white/10 text-white hover:bg-white/20"}`} onClick={() => setSheet(o.key)} aria-label={o.label}>
              {o.icon} <span className="hidden lg:inline">{o.label}</span>
            </button>
          ))}
        </div>
        <button className="btn bg-white/10 text-white hover:bg-white/20 !py-1.5 max-sm:!px-2.5" onClick={() => setScan(null)} aria-label="Check another codebase">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Another</span>
        </button>
      </header>

      <section className="border-b border-line">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 pt-6 pb-5">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="min-w-0">
              <p className="sign">Runway · as of {fmt(asOf)}</p>
              <input className="mt-1 w-full bg-transparent font-extrabold text-[30px] md:text-[38px] leading-tight tracking-tight outline-none focus:bg-wash rounded" value={project} onChange={(e) => setProject(e.target.value)} aria-label="Project name" />
            </div>
            <div className="flex-1" />
            <label className="block w-full sm:w-[240px]">
              <span className="sign">Team on the plan</span>
              <input className="input mt-1 !py-1.5" placeholder="Platform team" value={team} onChange={(e) => setTeam(e.target.value)} />
            </label>
          </div>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-5 border-2 border-ink">
            {(["ended", "soon", "watch", "unpinned", "ok"] as Status[]).map((s) => (
              <div key={s} className={`p-3 md:p-4 border-ink [&:not(:last-child)]:md:border-r-2 max-md:[&:nth-child(odd)]:border-r-2 max-md:[&:not(:nth-last-child(-n+1))]:border-b-2 ${count(s) && (s === "ended" || s === "soon") ? (s === "ended" ? "bg-red text-white" : "bg-signal") : ""}`}>
                <p className="font-mono font-semibold text-[30px] leading-none">{count(s)}</p>
                <p className="mt-1.5 text-[12.5px] font-semibold">{STATUS_LABEL[s]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6">
        <div className="flex gap-6 border-b border-line">
          {(["board", "timeline"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`py-3 -mb-px border-b-[3px] text-[14px] font-bold ${tab === t ? "border-ink" : "border-transparent text-muted hover:text-ink"}`}>
              {t === "board" ? "Departures board" : "Timeline"}
            </button>
          ))}
          <div className="flex-1" />
          <p className="self-center text-[12.5px] text-muted hidden sm:block">
            {scan.files.length} files read • dates from{" "}
            <a className="underline underline-offset-2 hover:text-ink" href="https://endoflife.date" target="_blank" rel="noreferrer">
              endoflife.date
            </a>
          </p>
        </div>
        {error ? (
          <p className="mt-4 flex gap-2 rounded bg-red-soft px-4 py-3 text-[13px]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red" /> {error}
          </p>
        ) : null}
        {tab === "board" ? (
          <BoardTable items={items} asOf={asOf} ownerList={ownerList} setOwner={(k, v) => setOwners((o) => ({ ...o, [k]: v }))} />
        ) : (
          <TimelineView items={items} asOf={asOf} />
        )}
        <p className="py-6 text-[12.5px] text-muted max-w-[860px] leading-relaxed">
          Past its end of life a version gets no security fixes from its maintainers. &ldquo;Move to&rdquo; is the newest release still supported (an LTS release where the project has them). Owners you type here are kept in this browser.
        </p>
      </div>

      {sheet ? <Sheet out={sheet} setOut={setSheet} plan={toPlan(items, meta)} owners={ownerList} onClose={() => setSheet(null)} /> : null}
    </div>
  );
}

/* ---------- start ---------- */

function Start({ busy, error, open }: { busy: string | null; error: string | null; open: (get: () => Promise<Scan>, label: string) => void }) {
  const [repo, setRepo] = useState("");
  const files = useRef<HTMLInputElement>(null);
  const csv = useRef<HTMLInputElement>(null);
  return (
    <div className="min-h-dvh grid place-items-center p-4 md:p-8 bg-wash">
      <div className="w-full max-w-[680px] bg-paper border-2 border-ink shadow-[8px_8px_0_var(--ink)]">
        <div className="h-3 stripes" aria-hidden="true" />
        <div className="px-6 md:px-8 pt-6 pb-5 border-b-2 border-ink">
          <NextLink href="/" className="flex items-center gap-2 font-extrabold text-[19px]">
            <Mark /> Runway
          </NextLink>
          <h1 className="mt-6 font-extrabold text-[32px] md:text-[38px] leading-[1.05] tracking-tight">Which codebase are we checking?</h1>
          <p className="mt-2 text-[15px] text-muted leading-relaxed">Runway reads the versions your code pins and asks endoflife.date how long each one has left.</p>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (repo.trim()) open(() => fromGitHub(repo), repo.trim());
            }}
          >
            <input className="input font-mono !text-[13px]" placeholder="github.com/owner/repo" value={repo} onChange={(e) => setRepo(e.target.value)} aria-label="Public GitHub repository" />
            <button className="btn btn-ink" disabled={!!busy}>
              Scan
            </button>
          </form>
          <div>
            <p className="sign mb-2">Try it on a real repository</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <button onClick={() => open(fromSnapshot, "Mastodon, frozen")} className="text-left border-2 border-ink hover:bg-signal-soft p-3.5 transition-colors">
                <span className="block font-bold">Mastodon, 20 Nov 2026</span>
                <span className="block text-[12.5px] text-muted">A saved scan, so the numbers match the README.</span>
              </button>
              <button onClick={() => open(() => fromGitHub("mastodon/mastodon"), "Mastodon, live")} className="text-left border-2 border-line hover:border-ink p-3.5 transition-colors">
                <span className="block font-bold">Mastodon, live</span>
                <span className="block font-mono text-[12px] text-muted">github.com/mastodon/mastodon</span>
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <button onClick={() => files.current?.click()} className="flex items-center justify-center gap-2 border-2 border-line hover:border-ink py-3 text-[14px] font-bold transition-colors">
              <Upload01 size={16} /> Upload files
            </button>
            <button onClick={() => csv.current?.click()} className="flex items-center justify-center gap-2 border-2 border-line hover:border-ink py-3 text-[14px] font-bold transition-colors">
              <Upload01 size={16} /> Inventory CSV
            </button>
          </div>
          <p className="text-[12.5px] text-muted leading-relaxed -mt-3">
            Files: Dockerfiles, compose files, workflows, <code className="font-mono">.nvmrc</code>, <code className="font-mono">.python-version</code>, <code className="font-mono">go.mod</code>… CSV: <code className="font-mono">component, version, owner, where</code> for what isn&apos;t in code (a managed database, a cluster).{" "}
            <a className="underline underline-offset-2 hover:text-ink" href="/samples/inventory-format.csv" download>
              Sample CSV
            </a>
          </p>
          <input
            ref={files}
            type="file"
            multiple
            className="hidden"
            onChange={async (e) => {
              const list = [...(e.target.files ?? [])];
              if (list.length) {
                const read = await Promise.all(list.map(async (f) => ({ path: f.name, text: await f.text() })));
                open(async () => fromFiles(read), `${list.length} files`);
              }
            }}
          />
          <input
            ref={csv}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) {
                const text = await f.text();
                open(() => fromInventory(text, f.name), f.name);
              }
            }}
          />
          {busy ? <p className="text-[13px] text-muted font-mono">Reading {busy}…</p> : null}
          {error ? (
            <p className="text-[13px] text-red flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- board ---------- */

function BoardTable({ items, asOf, ownerList, setOwner }: { items: Item[]; asOf: string; ownerList: string[]; setOwner: (key: string, v: string) => void }) {
  const [openRow, setOpenRow] = useState<string | null>(null);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-[14px]">
        <thead>
          <tr className="text-left border-b-2 border-ink">
            {["Status", "Component", "Pinned in", "Support ends", "Move to", "Owner"].map((h) => (
              <th key={h} className="sign font-normal py-2.5 pr-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => {
            const k = keyOf(i);
            const places = i.where.split(", ");
            return (
              <tr key={k} className="border-b border-line align-top">
                <td className="py-3 pr-3 w-[190px]">
                  <span className={`inline-block font-mono text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-sm ${TONE[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                </td>
                <td className="py-3 pr-3">
                  <p className="font-extrabold text-[16px] leading-tight">
                    {i.component} {i.cycle ?? i.version}
                  </p>
                  <p className="font-mono text-[11.5px] text-muted">{i.evidence.length > 48 ? `${i.evidence.slice(0, 47)}…` : i.evidence}</p>
                </td>
                <td className="py-3 pr-3 font-mono text-[12px] text-ink-2">
                  {(openRow === k ? places : places.slice(0, 1)).map((p) => (
                    <p key={p} className="truncate max-w-[300px]">
                      {p}
                    </p>
                  ))}
                  {places.length > 1 ? (
                    <button className="text-muted hover:text-ink underline underline-offset-2" onClick={() => setOpenRow(openRow === k ? null : k)}>
                      {openRow === k ? "show less" : `+${places.length - 1} more`}
                    </button>
                  ) : null}
                </td>
                <td className="py-3 pr-3 w-[180px]">
                  {i.eol ? (
                    <>
                      <p className="font-mono text-[13px]">{fmt(i.eol)}</p>
                      <p className={`text-[12.5px] font-semibold ${i.status === "ended" ? "text-red" : i.status === "ok" ? "text-green" : "text-amber"}`}>{runway(asOf, i.eol)}</p>
                    </>
                  ) : (
                    <p className="text-[12.5px] text-muted">{i.status === "unpinned" ? "No version pinned" : "No published date"}</p>
                  )}
                </td>
                <td className="py-3 pr-3 w-[110px] font-mono font-semibold text-[14px] text-green">{i.target ?? <span className="text-faint">—</span>}</td>
                <td className="py-2 w-[180px]">
                  <input className="cell-input" list="owners" placeholder="Add owner" value={i.owner ?? ""} onChange={(e) => setOwner(k, e.target.value)} aria-label={`Owner of ${i.component} ${i.cycle ?? i.version}`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <datalist id="owners">
        {ownerList.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </div>
  );
}

/* ---------- timeline ---------- */

function TimelineView({ items, asOf }: { items: Item[]; asOf: string }) {
  const dated = items.filter((i) => i.eol);
  const now = Date.parse(asOf);
  const y0 = new Date(now).getUTCFullYear() - 1;
  const start = Date.UTC(y0, 0, 1);
  const end = Date.UTC(y0 + 6, 0, 1);
  const L = 190;
  const W = 1180;
  const row = 34;
  const x = (ms: number) => L + Math.max(0, Math.min(W - L, ((ms - start) / (end - start)) * (W - L)));
  const TOP = 18;
  const H = TOP + dated.length * row + 30;
  return (
    <div className="overflow-x-auto py-5">
      <svg width={W} height={H} className="block min-w-[900px]" role="img" aria-label="Support timeline">
        {Array.from({ length: 7 }, (_, k) => Date.UTC(y0 + k, 0, 1)).map((y) => (
          <g key={y}>
            <line x1={x(y)} y1={TOP} x2={x(y)} y2={H - 22} stroke="var(--line)" />
            <text x={x(y) + 4} y={H - 6} fontSize={11} fontFamily="var(--font-overpass-mono)" fill="var(--muted)">
              {new Date(y).getUTCFullYear()}
            </text>
          </g>
        ))}
        {dated.map((i, k) => {
          const e = Date.parse(i.eol!);
          const y = TOP + k * row + 8;
          const past = e <= now;
          return (
            <g key={keyOf(i)}>
              <text x={0} y={y + 14} fontSize={13} fontWeight={700} fill="var(--ink)">
                {i.component} {i.cycle}
              </text>
              <rect x={L} y={y} width={Math.max(2, x(Math.min(e, now)) - L)} height={18} fill={past ? "var(--red)" : "var(--ink)"} />
              {!past ? <rect x={x(now)} y={y} width={Math.max(2, x(e) - x(now))} height={18} fill={i.status === "soon" || i.status === "watch" ? "var(--signal)" : "var(--rule)"} /> : null}
              <text x={Math.min(x(e) + 6, W - 80)} y={y + 13} fontSize={11} fontFamily="var(--font-overpass-mono)" fill={past ? "var(--red)" : "var(--ink-2)"}>
                {fmt(i.eol!)}
              </text>
            </g>
          );
        })}
        <rect x={x(now) - 1} y={TOP - 4} width={2} height={H - 18 - TOP} fill="var(--ink)" />
        <text x={x(now) - 18} y={10} fontSize={10.5} fontFamily="var(--font-overpass-mono)" fontWeight={600} fill="var(--ink)">
          TODAY
        </text>
      </svg>
    </div>
  );
}

/* ---------- outputs ---------- */

function Sheet({ out, setOut, plan, owners, onClose }: { out: Out; setOut: (o: Out) => void; plan: ReturnType<typeof toPlan>; owners: string[]; onClose: () => void }) {
  const [recipient, setRecipient] = useState(owners.find((o) => plan.items.some((i) => i.owner === o && (i.status === "ended" || i.status === "soon"))) ?? "");
  const [view, setView] = useState<{ url?: string; html?: string; issues?: string[] } | null>(null);
  const values = { ...plan, recipient: recipient || undefined };
  const key = JSON.stringify(values);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const res = await renderLocal({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ output: out, values }) });
      const type = res.headers.get("Content-Type") ?? "";
      const next = type.includes("json")
        ? await res.json().then((j) => (res.ok ? { html: j.html as string } : { issues: (j.diagnostics ?? [{ message: j.error }]).map((d: { message: string; path?: string }) => `${d.path ? `${d.path.replace(/^values\./, "")}: ` : ""}${d.message}`) }))
        : { url: URL.createObjectURL(await res.blob()) };
      if (!alive) return;
      setView((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return next;
      });
    }, 150);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out, key]);

  async function download() {
    const res = await renderLocal({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ output: out, values }) });
    if (!res.ok) return;
    const a = document.createElement("a");
    a.href = out === "notice" ? URL.createObjectURL(new Blob([(await res.json()).html], { type: "text/html" })) : URL.createObjectURL(await res.blob());
    a.download = `${plan.project.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${OUTS.find((o) => o.key === out)!.file}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/40" onClick={onClose}>
      <div className="w-full md:w-[min(1040px,94vw)] h-full bg-paper border-l-2 border-ink flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="shrink-0 border-b-2 border-ink flex flex-wrap items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5">
          {OUTS.map((o) => (
            <button key={o.key} onClick={() => o.key !== out && (setOut(o.key), setView(null))} className={`px-3 py-1.5 rounded-sm text-[13.5px] font-bold ${out === o.key ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
              {o.label}
            </button>
          ))}
          <div className="flex-1" />
          {out === "notice" ? (
            <select className="input !w-auto !py-1.5 !text-[13px]" value={recipient} onChange={(e) => setRecipient(e.target.value)} aria-label="Notice for">
              <option value="">Everyone</option>
              {owners.map((o) => (
                <option key={o} value={o}>
                  For {o}
                </option>
              ))}
            </select>
          ) : null}
          <button className="btn btn-signal" onClick={() => void download()} aria-label="Download">
            <Download01 size={16} /> <span className="hidden sm:inline">Download</span>
          </button>
          <button className="text-muted hover:text-ink ml-1" onClick={onClose} aria-label="Close">
            <XClose size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-wash flex">
          {view?.issues ? (
            <div className="m-6 rounded bg-red-soft p-4 space-y-1 self-start">
              <p className="font-bold text-red text-[14px]">The template refused these values</p>
              {view.issues.map((m) => (
                <p key={m} className="text-[13px]">
                  {m}
                </p>
              ))}
            </div>
          ) : view?.url && out === "plan" ? (
            <iframe title="Upgrade plan" src={view.url} className="flex-1" />
          ) : view?.url ? (
            <div className="flex-1 grid place-items-center p-6 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={view.url} alt="Runway board" className="max-w-full border-2 border-ink" />
            </div>
          ) : view?.html ? (
            <iframe title="Owner notice" srcDoc={view.html} className="flex-1" />
          ) : (
            <p className="m-auto text-[14px] text-muted">Rendering with Hyper Elements…</p>
          )}
        </div>
      </div>
    </div>
  );
}
