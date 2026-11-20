import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detect, fromCsv, fromImage, matchRelease, resolve, runway, statusOf, targetRelease, type Release } from "../templates/_shared/eol.ts";

const snap = JSON.parse(readFileSync(new URL("../public/samples/mastodon-2026-11-20.json", import.meta.url), "utf8"));
const rel = (p: string) => snap.releases[p] as Release[] | undefined;

test("image references: registry, tag, OS codename, alpine", () => {
  assert.deepEqual(fromImage("postgres:14-alpine", "c.yml:7").map((f) => [f.product, f.version]), [["postgresql", "14"]]);
  assert.deepEqual(fromImage("docker.io/node:26-trixie-slim", "D:1").map((f) => [f.product, f.version]), [["nodejs", "26"], ["debian", "13"]]);
  assert.deepEqual(fromImage("python:3.12.4-alpine3.20", "D:1").map((f) => [f.product, f.version]), [["python", "3.12"], ["alpine-linux", "3.20"]]);
  assert.deepEqual(fromImage("ghcr.io/acme/app:1.2", "D:1"), []);
});

test("Dockerfile ARGs resolve, build stages are not images, compose comments are skipped", () => {
  const found = detect([
    { path: "Dockerfile", text: 'ARG NODE="20"\nFROM node:${NODE}-bookworm AS base\nFROM base AS build\nFROM ruby AS r' },
    { path: "docker-compose.yml", text: "services:\n  db:\n    image: postgres:13\n  # image: redis:6\n  cache:\n    image: redis" },
    { path: ".github/workflows/ci.yml", text: "jobs:\n  t:\n    runs-on: ubuntu-20.04\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '18.x'" },
  ]);
  const rows = found.map((f) => `${f.product}@${f.version}`);
  assert.deepEqual(rows.sort(), ["debian@12", "nodejs@18", "nodejs@20", "postgresql@13", "redis@", "ruby@", "ubuntu@20.04"].sort());
  assert.equal(found.find((f) => f.product === "postgresql")!.where, "docker-compose.yml:3");
});

test("matching a release: exact, a patch version, and a bare major", () => {
  const redis = rel("redis")!;
  assert.equal(matchRelease(rel("postgresql")!, "14")?.name, "14");
  assert.equal(matchRelease(rel("ruby")!, "4.0.10")?.name, "4.0");
  assert.match(matchRelease(redis, "7")!.name, /^7\./);
  assert.equal(matchRelease(redis, ""), undefined);
});

test("status and runway text against 20 Nov 2026", () => {
  const pg14 = matchRelease(rel("postgresql")!, "14");
  assert.equal(statusOf("14", pg14, "2026-11-20"), "ended");
  assert.equal(statusOf("", undefined, "2026-11-20"), "unpinned");
  assert.equal(runway("2026-11-20", "2026-11-12"), "8 days ago");
  assert.equal(runway("2026-11-20", "2027-07-15"), "in 8 months");
  // Node's move-to is an LTS release that's still supported.
  assert.equal(targetRelease(rel("nodejs")!, "2026-11-20")?.isLts, true);
});

test("Mastodon, frozen 20 Nov 2026: PostgreSQL 14 is past end of life, in five places", () => {
  const items = resolve(snap.findings, rel, "2026-11-20");
  const pg = items[0];
  assert.deepEqual([pg.component, pg.cycle, pg.status, pg.eol], ["PostgreSQL", "14", "ended", "2026-11-12"]);
  assert.equal(pg.where.split(", ").length, 5);
  // 26.13 in .nvmrc and 26 in the Dockerfile are one row.
  assert.equal(items.filter((i) => i.component === "Node.js" && i.cycle === "26").length, 1);
});

test("inventory CSV", () => {
  const rows = fromCsv("component,version,owner,where\nPostgres,13.4,Data team,orders-db\nKubernetes,1.29,Platform,prod cluster", (n) => ({ postgres: "postgresql", kubernetes: "kubernetes" })[n.toLowerCase()]);
  assert.deepEqual(rows.map((r) => [r.product, r.version, r.owner, r.where]), [["postgresql", "13.4", "Data team", "orders-db"], ["kubernetes", "1.29", "Platform", "prod cluster"]]);
});
