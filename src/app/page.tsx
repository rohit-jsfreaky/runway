import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, FileCheck02, Image01, Mail01 } from "@untitledui/icons";
import { Mark } from "@/components/Mark";

const WRAP = "mx-auto max-w-[1200px] px-6";

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <Nav />
      <Hero />
      <Problem />
      <Example />
      <How />
      <Outputs />
      <Reads />
      <Faq />
      <Close />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-ink text-white">
      <div className={`${WRAP} h-16 flex items-center gap-4 md:gap-8`}>
        <Link href="/" className="flex items-center gap-2 font-extrabold text-[20px] tracking-tight">
          <Mark /> Runway
        </Link>
        <nav className="hidden md:flex gap-6 text-[14px] font-semibold text-white/70">
          <a href="#why" className="hover:text-white">Why</a>
          <a href="#example" className="hover:text-white">Example</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#outputs" className="hover:text-white">What you send</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <div className="flex-1" />
        <Link href="/check" className="btn btn-signal">
          <span className="hidden sm:inline">Check a codebase</span>
          <span className="sm:hidden">Start</span> <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b-2 border-ink">
      <div className="h-3 stripes" aria-hidden="true" />
      <div className={`${WRAP} pt-14 md:pt-20`}>
        <p className="sign">For platform teams and tech leads · free and open source</p>
        <h1 className="mt-5 font-extrabold text-[50px] md:text-[88px] leading-[0.95] tracking-[-0.035em] max-w-[1000px]">
          How long does your stack <span className="bg-signal px-2 -mx-1">have left?</span>
        </h1>
        <div className="mt-8 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <p className="text-[18px] md:text-[19px] leading-relaxed text-ink-2 max-w-[620px]">
            Paste a GitHub repository. Runway finds every version your code pins (Node, Python, Postgres, Redis, Debian and more), checks it against endoflife.date, and writes the upgrade plan and the notice for each owner.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/check" className="btn btn-signal !px-5 !py-3 !text-[15px]">
              Check a codebase <ArrowRight size={17} />
            </Link>
            <a href="/landing/mastodon-upgrade-plan.pdf" className="btn btn-line !px-5 !py-3 !text-[15px]">
              Sample plan (PDF)
            </a>
          </div>
        </div>
        <figure className="mt-12 border-2 border-b-0 border-ink">
          <Image src="/landing/board.png" alt="Runway on Mastodon's repository: PostgreSQL 14 past end of life, Elasticsearch 8.19 ending within a year, six components supported" width={1440} height={900} priority className="w-full h-auto" />
        </figure>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section id="why" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="01" eyebrow="Why" title="End of life arrives in somebody else's inbox." />
        <div className="mt-10 grid md:grid-cols-[1.2fr_1fr] gap-10 items-start">
          <blockquote className="border-l-[6px] border-signal pl-6">
            <p className="font-bold text-[24px] md:text-[30px] leading-snug tracking-tight">
              &ldquo;Each cloud sends its own notices, but they tend to land with account or subscription owners, not the team that owns the workload. And unlike library versions, none of this shows up in Renovate or Dependabot.&rdquo;
            </p>
            <footer className="mt-4 text-[14px] text-muted">
              An infra engineer on{" "}
              <a className="underline underline-offset-2 hover:text-ink" href="https://old.reddit.com/r/devops/comments/1x8ubmw/">
                r/devops
              </a>
              , October 2026
            </footer>
          </blockquote>
          <div className="border-2 border-ink">
            <p className="sign px-5 pt-4">Replies in the same thread</p>
            {[
              "We realise it's broken when loads of tickets start coming in.",
              "Management agrees and then it all happens all over again.",
              "What worked for me is pulling the inventory from the code instead of the inbox.",
            ].map((q) => (
              <p key={q} className="px-5 py-4 border-t border-line first-of-type:border-t-0 text-[16px] leading-relaxed">
                &ldquo;{q}&rdquo;
              </p>
            ))}
          </div>
        </div>
        <p className="mt-10 text-[17px] text-ink-2 max-w-[760px] leading-relaxed">
          That last reply is the whole idea. Your Dockerfiles, compose files, CI workflows and version files already say what you run. Runway reads them, so the list is never out of date.
        </p>
      </div>
    </section>
  );
}

const BOARD = [
  ["Past end of life", "PostgreSQL 14", "12 Nov 2026", "8 days ago", "red"],
  ["Ends within a year", "Elasticsearch 8.19", "15 Jul 2027", "in 8 months", "signal"],
  ["Supported", "Node.js 26", "30 Apr 2029", "in 2 years", "ok"],
  ["Supported", "Redis 7.4", "1 Dec 2029", "in 3 years", "ok"],
  ["Supported", "Debian 13", "30 Jun 2030", "in 4 years", "ok"],
] as const;

function Example() {
  return (
    <section id="example" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="02" eyebrow="A real example" title="Mastodon still pins a Postgres that ended last week.">
          PostgreSQL 14 reached end of life on 12 November 2026. On 20 November, Mastodon&apos;s repository still pinned <code className="font-mono text-[15px]">postgres:14-alpine</code> in five places: the main <code className="font-mono text-[15px]">docker-compose.yml</code>, the dev container, and three test jobs in CI. Runway found all five from the repository link alone.
        </Head>
        <div className="mt-12 bg-ink text-white border-2 border-ink overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[210px_1fr_150px_140px] gap-4 px-5 py-3 font-mono text-[12px] tracking-[0.1em] uppercase text-white/55 border-b border-white/15">
              <span>Status</span>
              <span>Component</span>
              <span>Support ends</span>
              <span>In</span>
            </div>
            {BOARD.map(([s, c, d, r, tone]) => (
              <div key={c} className="grid grid-cols-[210px_1fr_150px_140px] gap-4 px-5 py-3.5 border-b border-white/10 last:border-0 items-center">
                <span className={`font-mono font-semibold text-[13px] uppercase ${tone === "red" ? "text-[#ff6b7f]" : tone === "signal" ? "text-signal" : "text-[#7fd6a4]"}`}>{s}</span>
                <span className="font-extrabold text-[20px]">{c}</span>
                <span className="font-mono text-[15px]">{d}</span>
                <span className={`font-mono text-[15px] ${tone === "red" ? "text-[#ff6b7f]" : tone === "signal" ? "text-signal" : "text-white/70"}`}>{r}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-[13px] text-muted">Mastodon at commit 234e91f, read on 20 November 2026. Dates from endoflife.date.</p>
      </div>
    </section>
  );
}

function How() {
  const steps = [
    ["Scan", "Paste a public GitHub repository, upload files, or upload an inventory CSV for what isn't in code: a managed database, a cluster."],
    ["Check", "Every pinned version is matched to its release on endoflife.date: end of life, end of active support, and the newest supported release to move to."],
    ["Assign", "Add an owner to each row. Owners are remembered in your browser for the next check."],
    ["Send", "Download the upgrade plan for planning, the notice for each owner, and the board for the team channel."],
  ];
  return (
    <section id="how" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="03" eyebrow="How it works" title="From a repository link to a plan." />
        <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ink border-2 border-ink">
          {steps.map(([t, d], i) => (
            <li key={t} className="bg-paper p-6">
              <span className="inline-grid place-items-center size-9 bg-signal font-mono font-semibold text-[15px]">{i + 1}</span>
              <h3 className="mt-4 font-extrabold text-[24px] tracking-tight">{t}</h3>
              <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{d}</p>
            </li>
          ))}
        </ol>
        <figure className="mt-6 border-2 border-ink">
          <Image src="/landing/timeline.png" alt="The timeline: each component's support as a bar, today marked, PostgreSQL 14 already past it" width={1440} height={900} className="w-full h-auto" />
        </figure>
      </div>
    </section>
  );
}

function Outputs() {
  return (
    <section id="outputs" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="04" eyebrow="What you send" title="Three documents, one set of dates.">
          Rendered by shared Hyper Elements templates, in the app or from the command line.
        </Head>
        <div className="mt-12 grid md:grid-cols-12 gap-px bg-ink border-2 border-ink">
          <Tile className="md:col-span-7 md:row-span-2" icon={<FileCheck02 size={17} />} name="The upgrade plan" note="A4 PDF · what to act on, the counts, the timeline, every component">
            <div className="grid grid-cols-2 gap-3">
              <Image src="/landing/plan-1.png" alt="Plan page 1: act now, the counts and the timeline" width={1241} height={1754} className="w-full h-auto border border-line" />
              <Image src="/landing/plan-2.png" alt="Plan page 2: every pinned component with where, support, move to and owner" width={1241} height={1754} className="w-full h-auto border border-line" />
            </div>
          </Tile>
          <Tile className="md:col-span-5" icon={<Image01 size={17} />} name="The board" note="1200 × 630 PNG · for the team channel">
            <Image src="/landing/board-card.png" alt="The runway board card: the most urgent rows first" width={1200} height={630} className="w-full h-auto border border-line" />
          </Tile>
          <Tile className="md:col-span-5" icon={<Mail01 size={17} />} name="The owner notice" note="An email per owner, only their items">
            <div className="h-[260px] overflow-hidden border border-line bg-wash">
              <Image src="/landing/notice.png" alt="Email to the Platform team: PostgreSQL 14 went out of support 8 days ago" width={760} height={600} className="w-full h-auto" />
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ className = "", icon, name, note, children }: { className?: string; icon: ReactNode; name: string; note: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 bg-paper p-5 md:p-6 flex flex-col gap-5 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid place-items-center size-9 bg-ink text-signal">{icon}</span>
        <div>
          <p className="font-extrabold text-[18px] leading-tight">{name}</p>
          <p className="text-[12.5px] text-muted">{note}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const FILES = [
  [".nvmrc, .node-version", "Node.js"],
  [".python-version", "Python"],
  [".ruby-version", "Ruby"],
  [".tool-versions", "every tool asdf/mise pins"],
  ["go.mod", "Go"],
  ["package.json", "engines.node"],
  ["Dockerfile", "FROM images, ARG versions, the OS in the tag"],
  ["compose files", "image: lines (Postgres, Redis, Elasticsearch…)"],
  ["GitHub workflows", "node-version, python-version, runs-on, service images"],
  ["Inventory CSV", "managed databases, clusters, anything else"],
];

function Reads() {
  return (
    <section className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-[1fr_1.2fr] gap-12 items-start`}>
        <Head n="05" eyebrow="What it reads" title="The files that already say what you run.">
          Same version in many places is one row, with every place listed. An image with no version (<code className="font-mono text-[14px]">image: postgres</code>) is flagged too: it moves to a new major the day it&apos;s rebuilt.
        </Head>
        <div className="border-2 border-ink">
          {FILES.map(([f, what]) => (
            <div key={f} className="grid grid-cols-[minmax(0,190px)_1fr] gap-4 px-5 py-3 border-b border-line last:border-0">
              <span className="font-mono text-[13px] font-semibold">{f}</span>
              <span className="text-[14.5px] text-ink-2">{what}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Where do the dates come from?", "endoflife.date, an open-source, community-maintained list of release cycles for hundreds of products, with a public API."],
  ["Does it need a GitHub token?", "No. It reads public repositories through GitHub's public API, from your browser. GitHub allows 60 API requests an hour without a token, and a scan uses three; the files themselves are read from raw.githubusercontent.com. For private code, upload the files."],
  ["Is my code sent anywhere?", "The scan runs in your browser. Only the rows (component, version, where, dates, owner) go to the app's render route when you make a PDF, email or image, and nothing is stored."],
  ["What does \"move to\" mean?", "The newest release that's still supported, or the newest LTS release for products that have LTS (like Node.js). It's a starting point for the plan, not a promise the upgrade is easy."],
  ["What about my managed database or my Kubernetes cluster?", "They aren't in your code, so upload an inventory CSV with component, version, owner and where. Runway checks those rows the same way."],
  ["Why is a version I pinned showing \"No dates\"?", "endoflife.date doesn't list that release yet (a brand-new release), or doesn't track that product. Runway says so instead of guessing."],
  ["Can I run it in CI?", "The outputs are Hyper Elements templates. npm run plan renders the PDF, the email and the board from a JSON file with the Hyper Elements command line tool, so a scheduled job can rebuild the plan every month."],
] as const;

function Faq() {
  return (
    <section id="faq" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-[360px_1fr] gap-12`}>
        <div className="md:sticky md:top-28 self-start">
          <Head n="06" eyebrow="FAQ" title="Questions at the gate." />
        </div>
        <div className="border-t-2 border-ink">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-bold text-[18px]">
                {q}
                <span className="grid place-items-center size-8 shrink-0 bg-ink text-signal font-mono text-[16px] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-6 pr-12 text-[15.5px] text-ink-2 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Close() {
  return (
    <>
      <section className="bg-ink text-white">
        <div className="h-3 stripes" aria-hidden="true" />
        <div className={`${WRAP} py-20 md:py-24 grid md:grid-cols-[1fr_auto] gap-8 items-end`}>
          <div>
            <h2 className="font-extrabold text-[42px] md:text-[68px] leading-[0.98] tracking-[-0.03em] max-w-[760px]">
              Find out before the tickets do.
            </h2>
            <p className="mt-4 text-[17px] text-white/70 max-w-[520px]">Try it on Mastodon, or paste your own repository.</p>
          </div>
          <Link href="/check" className="btn btn-signal !px-6 !py-3.5 !text-[15px]">
            Check a codebase <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <footer className={`${WRAP} py-10 flex flex-col md:flex-row gap-3 justify-between text-[13px] text-muted`}>
        <span className="flex items-center gap-2 font-extrabold text-[18px] text-ink">
          <Mark size={22} /> Runway
        </span>
        <p className="max-w-[720px] md:text-right">
          Built with{" "}
          <a className="underline underline-offset-2 hover:text-ink inline-flex items-center gap-0.5" href="https://github.com/hyper-elements/hyper-elements">
            Hyper Elements <ArrowUpRight size={12} />
          </a>
          . Dates from endoflife.date. Not affiliated with Mastodon or any project shown; the owners in the sample are made up.
        </p>
      </footer>
    </>
  );
}

function Head({ n, eyebrow, title, children }: { n: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-[780px]">
      <p className="sign">
        <span className="bg-ink text-signal px-1.5 py-0.5 mr-2">{n}</span>
        {eyebrow}
      </p>
      <h2 className="mt-4 font-extrabold text-[36px] md:text-[54px] leading-[1.02] tracking-[-0.03em]">{title}</h2>
      {children ? <p className="mt-5 text-[17px] leading-relaxed text-ink-2">{children}</p> : null}
    </div>
  );
}
