// Renders a plan with the same Hyper Elements templates the CLI uses (templates/*.tsx).
// POST { output: "plan" | "notice" | "board", values } -> a PDF, a PNG, or { html, text }.
// Values a template refuses come back as 422 with the template's own diagnostics.
import { createElement } from "react";
import { ElementsError, render } from "@hyper-elements/react";
import { renderImage } from "@hyper-elements/react/image";
import { renderPdf } from "@hyper-elements/react/pdf";
import Board from "@templates/board";
import Notice from "@templates/notice";
import Plan from "@templates/plan";

// In the browser: fonts and the resvg WebAssembly come from /public; Buffer (used for base64) from the buffer package.
let ready: Promise<void> | undefined;
async function fontFile(file: string) {
  ready ??= (async () => {
    const { Buffer } = await import("buffer");
    (globalThis as { Buffer?: unknown }).Buffer ??= Buffer;
    const { initWasm } = await import("@resvg/resvg-wasm");
    await initWasm(fetch("/resvg.wasm"));
  })();
  await ready;
  return new Uint8Array(await (await fetch(`/fonts/${file}`)).arrayBuffer());
}


type Diagnostic = { severity: string; code: string; message: string; path?: string };

const FONT_FILES: Array<[string, string, number, ("italic" | undefined)?]> = [
  ...[400, 500, 600, 700, 800].map((w): [string, string, number] => ["Overpass", `Overpass-${w}.woff`, w]),
  ["Overpass Mono", "OverpassMono-400.woff", 400],
  ["Overpass Mono", "OverpassMono-600.woff", 600],
];
let fonts: Promise<Array<{ family: string; src: Uint8Array; weight: number; style?: "italic" }>> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all(
    FONT_FILES.map(async ([family, file, weight, style]) => ({ family, weight, ...(style ? { style } : {}), src: await fontFile(file) })),
  ));

const brief = (list: readonly unknown[] = []): Diagnostic[] =>
  (list as Diagnostic[]).filter((d) => d.severity === "error" || d.severity === "warning").map(({ severity, code, message, path }) => ({ severity, code, message, path }));

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { output?: string; values?: Record<string, unknown> } | null;
  if (!body?.values || !["plan", "notice", "board"].includes(body.output ?? "")) {
    return Response.json({ error: 'Send { output: "plan" | "notice" | "board", values }' }, { status: 400 });
  }
  const { output, values } = body;
  try {
    if (output === "plan") {
      const { pdf } = await renderPdf(createElement(Plan as never, { ...values, format: "a4" }), { fonts: await loadFonts() });
      return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf" } });
    }
    if (output === "board") {
      const { image } = await renderImage(createElement(Board as never, { ...values, format: "og" }), { fonts: await loadFonts() });
      return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
    }
    const { html, text, diagnostics } = await render(createElement(Notice as never, values));
    return Response.json({ html, text, diagnostics: brief(diagnostics) });
  } catch (e) {
    if (e instanceof ElementsError) return Response.json({ diagnostics: brief(e.diagnostics) }, { status: 422 });
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
