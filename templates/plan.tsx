/**
 * The upgrade plan: an A4 PDF. Page 1 is what needs action, the counts and the timeline; then every pinned
 * component with where it's pinned, when its support ends, what to move to, and who owns it.
 */
import { Fragment } from "react";
import { Column, Document, Heading, Layer, LineBreak, PageBreak, PageFooter, PageNumber, Row, Span, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { FONT_FILES, GREEN, INK, INK2, LINE, MONO, MUTED, RED, SANS, SIGNAL, Timeline, act, count, endsText, example, fields, longDate, name, placesText, plural, shortDate, statusColor, statusLabel, type Plan } from "./_shared/doc.tsx";

const W = 698; // A4 at 96 px/in (794) less 48 px margins
const ROWS = 22;
const ROW_H = 22;
const LABEL_W = 150;
const label = { fontFamily: MONO, fontSize: 8, fontWeight: 400, letterSpacing: 0.8, textTransform: "uppercase", color: MUTED } as const;

export default template({
  id: "runway.Plan",
  version: "1.0.0",
  label: "Upgrade plan (PDF)",
  guidance: "Dates come from endoflife.date. Bring it to quarterly planning; the owners column says who moves what.",
  root: "Document",
  formats: { a4: { size: "A4", orientation: "portrait" } },
  fields,
  example,
  render(input) {
    const p = input as unknown as Plan;
    const now = act(p);
    const dated = p.items.filter((i) => i.eol).slice(0, 18);
    const pages: Plan["items"][] = [];
    for (let i = 0; i < p.items.length; i += ROWS) pages.push(p.items.slice(i, i + ROWS));
    const years = Array.from({ length: 5 }, (_, k) => new Date(Date.parse(p.asOf)).getUTCFullYear() - 1 + k);

    return (
      <Document size="A4" margin={48} title={`${p.project}: upgrade plan`} lang="en" fonts={FONT_FILES} style={{ fontFamily: SANS, fontSize: 10, color: INK, gap: 14 }}>
        <Row style={{ alignItems: "center" }}>
          <Column style={{ width: 150, backgroundColor: SIGNAL, padding: [6, 10] }}>
            <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: 10, letterSpacing: 1.2 }}>UPGRADE PLAN</Text>
          </Column>
          <Column>
            <Text style={{ ...label, textAlign: "right" }}>
              As of {longDate(p.asOf)}
              {p.team ? ` · ${p.team}` : ""}
            </Text>
          </Column>
        </Row>
        <Heading level={1} style={{ fontWeight: 800, fontSize: 34, lineHeight: 1.1, letterSpacing: -1 }}>
          {p.project}: the runway
        </Heading>
        <Text style={{ color: INK2, lineHeight: 1.5 }}>Every version pinned in {p.source}, checked against endoflife.date.</Text>

        <Row style={{ gap: 10 }}>
          {(
            [
              ["ended", "Past end of life"],
              ["soon", "Ends within 6 months"],
              ["watch", "Ends within a year"],
              ["ok", "Supported"],
            ] as const
          ).map(([s, what]) => (
            <Column key={s} style={{ gap: 2, padding: [8, 0, 0], border: { top: `3px solid ${count(p, s) ? statusColor(s) : LINE}` } }}>
              <Text style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1, color: count(p, s) ? statusColor(s) : MUTED }}>{String(count(p, s))}</Text>
              <Text style={{ fontSize: 9, color: MUTED }}>{what}</Text>
            </Column>
          ))}
        </Row>

        <Column style={{ gap: 0 }}>
          <Text style={{ ...label, color: INK, padding: [0, 0, 6] }}>{now.length ? "Act now" : "Nothing needs action in the next 6 months"}</Text>
          {now.map((i) => (
            <Row key={name(i)} style={{ gap: 12, padding: [9, 0], border: { top: `0.75px solid ${LINE}` }, alignItems: "start" }}>
              <Column style={{ width: 6, backgroundColor: i.status === "ended" ? RED : SIGNAL, height: 34 }} />
              <Column style={{ gap: 2 }}>
                <Text style={{ fontWeight: 700, fontSize: 13 }}>
                  {name(i)}
                  <Span style={{ fontWeight: 400, color: statusColor(i.status) }}>{`  ${endsText(i, p.asOf)}`}</Span>
                </Text>
                <Text style={{ fontSize: 9.5, color: INK2 }}>
                  {i.target ? `Move to ${i.component} ${i.target}${i.targetEol ? ` (supported to ${shortDate(i.targetEol)})` : ""}. ` : ""}
                  Pinned in {plural(i.places, "place")}: {placesText(i)}.
                </Text>
              </Column>
              <Column style={{ width: 110 }}>
                <Text style={{ fontSize: 9, color: MUTED, textAlign: "right" }}>{i.owner ?? "No owner"}</Text>
              </Column>
            </Row>
          ))}
        </Column>

        {dated.length ? (
          <Column style={{ gap: 4 }}>
            <Text style={{ ...label, color: INK }}>Support left, from today</Text>
            <Layer style={{ width: W }}>
              <Timeline items={dated} asOf={p.asOf} width={W} rowH={ROW_H} labelW={LABEL_W} />
              <Column style={{ gap: 0 }}>
                {dated.map((i) => (
                  <Text key={name(i)} style={{ width: LABEL_W - 8, fontSize: 9, lineHeight: ROW_H / 9, color: INK }}>
                    {name(i)}
                  </Text>
                ))}
              </Column>
            </Layer>
            <Row style={{ padding: [0, 0, 0, LABEL_W] }}>
              {years.map((y) => (
                <Column key={y}>
                  <Text style={{ fontFamily: MONO, fontSize: 8, color: MUTED }}>{String(y)}</Text>
                </Column>
              ))}
            </Row>
            <Text style={{ fontSize: 8.5, color: MUTED }}>
              Black: support already used. Yellow: ends within a year. Grey: further out. The notch marks the end of active support; the line is today.
            </Text>
          </Column>
        ) : null}

        {pages.map((rows, k) => (
          <Fragment key={k}>
            <PageBreak />
            <Text style={{ ...label, color: INK }}>Everything pinned{pages.length > 1 ? ` · ${k + 1} of ${pages.length}` : ""}</Text>
            <Table style={{ width: W, cellPadding: [5, 5], rowBorder: { width: 0.5, style: "solid", color: LINE } }}>
              <TableRow header>
                <TableCell style={{ ...label, width: 120 }}>Component</TableCell>
                <TableCell style={label}>Where</TableCell>
                <TableCell style={{ ...label, width: 150 }}>Support</TableCell>
                <TableCell style={{ ...label, width: 60 }}>Move to</TableCell>
                <TableCell style={{ ...label, width: 90 }}>Owner</TableCell>
              </TableRow>
              {rows.map((i, n) => (
                <TableRow key={n}>
                  <TableCell style={{ fontSize: 9.5, fontWeight: 700, verticalAlign: "top" }}>{name(i)}</TableCell>
                  <TableCell style={{ fontFamily: MONO, fontSize: 7.5, color: INK2, verticalAlign: "top" }}>{placesText(i)}</TableCell>
                  <TableCell style={{ fontSize: 9, verticalAlign: "top", color: statusColor(i.status) }}>
                    {statusLabel(i.status)}
                    {i.eol ? (
                      <>
                        <LineBreak />
                        <Span style={{ color: MUTED }}>{endsText(i, p.asOf)}</Span>
                      </>
                    ) : null}
                  </TableCell>
                  <TableCell style={{ fontSize: 9.5, verticalAlign: "top", color: i.target ? GREEN : MUTED }}>{i.target ?? "—"}</TableCell>
                  <TableCell style={{ fontSize: 9, verticalAlign: "top", color: INK2 }}>{i.owner ?? "—"}</TableCell>
                </TableRow>
              ))}
            </Table>
          </Fragment>
        ))}

        <PageFooter style={{ padding: [8, 0, 0], border: { top: `0.75px solid ${LINE}` } }}>
          <Row>
            <Column>
              <Text style={{ fontSize: 7.5, color: MUTED }}>
                {p.project} • upgrade plan • dates from endoflife.date, {shortDate(p.asOf)}
              </Text>
            </Column>
            <Column>
              <Text style={{ fontSize: 7.5, color: MUTED, textAlign: "right" }}>
                Page <PageNumber /> of <PageNumber total />
              </Text>
            </Column>
          </Row>
        </PageFooter>
      </Document>
    );
  },
});
