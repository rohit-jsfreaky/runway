/**
 * The runway board: a 1200 × 630 card for the team channel, like a departures board: the most urgent rows first.
 */
import { Canvas, Column, Row, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { runway } from "./_shared/eol.ts";
import { FONT_FILES, INK, LINE, MONO, MUTED, PAPER, SANS, SIGNAL, count, example, fields, name, shortDate, statusColor, statusLabel, type Plan } from "./_shared/doc.tsx";

const W = 1200;
const H = 630;
const PAD = 56;
const COLS = [300, 330, 220, W - PAD * 2 - 850];

export default template({
  id: "runway.Board",
  version: "1.0.0",
  label: "Runway board (PNG)",
  guidance: "Post it in the team channel. The seven most urgent rows fit.",
  root: "Canvas",
  formats: { og: { width: W, height: H, scale: 1 } },
  fields,
  rules: { require: { core: ["image/overflow", "image/glyph", "image/fit"] } },
  example,
  render(input) {
    const p = input as unknown as Plan;
    const rows = p.items.slice(0, 7);
    return (
      <Canvas width={W} height={H} fonts={FONT_FILES} style={{ backgroundColor: PAPER, fontFamily: SANS, color: INK, padding: 0, gap: 0 }}>
        <Row style={{ width: W, backgroundColor: SIGNAL, padding: [22, PAD], alignItems: "center" }}>
          <Column style={{ width: 640 }}>
            <Text fit={{ sizes: [34, 30, 26], maxLines: 1 }} style={{ width: 640, fontWeight: 800, letterSpacing: -0.8 }}>
              {`${p.project}: the runway`}
            </Text>
          </Column>
          <Column style={{ width: W - PAD * 2 - 640 }}>
            <Text style={{ width: W - PAD * 2 - 640, textAlign: "right", fontFamily: MONO, fontSize: 18, fontWeight: 600 }}>{shortDate(p.asOf).toUpperCase()}</Text>
          </Column>
        </Row>
        <Row style={{ width: W, padding: [22, PAD, 8] }}>
          {["Status", "Component", "Support ends", "In"].map((h, k) => (
            <Column key={h} style={{ width: COLS[k] }}>
              <Text style={{ width: COLS[k], fontFamily: MONO, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", color: MUTED }}>{h}</Text>
            </Column>
          ))}
        </Row>
        {rows.map((i) => (
          <Row key={name(i)} style={{ width: W, padding: [0, PAD] }}>
            <Row style={{ width: W - PAD * 2, padding: [10, 0], border: { top: `1px solid ${LINE}` } }}>
              <Column style={{ width: COLS[0] }}>
                <Text style={{ width: COLS[0], fontFamily: MONO, fontSize: 19, fontWeight: 600, color: statusColor(i.status) }}>{statusLabel(i.status).toUpperCase()}</Text>
              </Column>
              <Column style={{ width: COLS[1] }}>
                <Text fit={{ sizes: [27, 24, 21], maxLines: 1 }} style={{ width: COLS[1], fontWeight: 700 }}>
                  {name(i)}
                </Text>
              </Column>
              <Column style={{ width: COLS[2] }}>
                <Text style={{ width: COLS[2], fontFamily: MONO, fontSize: 21 }}>{i.eol ? shortDate(i.eol) : "—"}</Text>
              </Column>
              <Column style={{ width: COLS[3] }}>
                <Text style={{ width: COLS[3], fontFamily: MONO, fontSize: 21, color: statusColor(i.status) }}>{i.eol ? runway(p.asOf, i.eol) : "—"}</Text>
              </Column>
            </Row>
          </Row>
        ))}
        <Row style={{ width: W, padding: [14, PAD, 0] }}>
          <Text style={{ width: W - PAD * 2, fontSize: 17, color: MUTED }}>
            {`${count(p, "ended")} past end of life • ${count(p, "soon")} within 6 months • ${count(p, "watch")} within a year • ${p.items.length} tracked • dates from endoflife.date`}
          </Text>
        </Row>
      </Canvas>
    );
  },
});
