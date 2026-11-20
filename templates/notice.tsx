/**
 * The owner notice: an email to the team that owns what's running out, before the date (or right after it).
 * Only that owner's items when a recipient is set.
 */
import { Column, Email, Heading, Row, Section, Text, token } from "@hyper-elements/react";
import { lint } from "@hyper-elements/lint";
import { template } from "@hyper-elements/react/template";
import { runway } from "./_shared/eol.ts";
import { FONT_URLS, MONO, example, fields, longDate, name, placesText, plural, shortDate, statusColor, statusLabel, theme, type Plan } from "./_shared/doc.tsx";

const LABEL = { fontFamily: MONO, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: "#5F6670" } as const;

export default template({
  id: "runway.Notice",
  version: "1.0.0",
  label: "End-of-life notice (email)",
  guidance: "Send it to each owner. Set the recipient to list only their items.",
  root: "Email",
  fields,
  rules: { plugins: { lint: lint() }, require: { lint: ["lang", "contrast", "link-text"] }, root: { previewText: true } },
  example,
  render(input) {
    const p = input as unknown as Plan;
    const mine = p.recipient ? p.items.filter((i) => i.owner === p.recipient) : p.items;
    const due = mine.filter((i) => i.status === "ended" || i.status === "soon" || i.status === "watch" || i.status === "unpinned");
    const first = due[0];
    const headline = !first
      ? "Nothing you own runs out of support this year"
      : first.status === "ended" && first.eol
        ? `${name(first)} went out of support ${runway(p.asOf, first.eol)}`
        : first.eol
          ? `${name(first)} runs out of support ${runway(p.asOf, first.eol)}`
          : `${first.component} isn't pinned to a version`;
    return (
      <Email theme={theme} lang="en" width={600} fonts={FONT_URLS} title={`${p.project}: ${headline}`} previewText={`${plural(due.length, "item")} to plan in ${p.project}${p.recipient ? ` for ${p.recipient}` : ""}.`} style={{ gap: 0 }}>
        <Section style={{ padding: [28, 24, 14] }}>
          <Text style={LABEL}>
            Runway · {p.project}
            {p.recipient ? ` · for ${p.recipient}` : ""}
          </Text>
        </Section>
        <Column style={{ apply: ["sheet"] }}>
          <Heading level={1}>{headline}</Heading>
          <Text>
            {due.length
              ? `We checked every version pinned in ${p.source} against endoflife.date on ${longDate(p.asOf)}. ${plural(due.length, "item")} ${due.length === 1 ? "needs" : "need"} a plan:`
              : `We checked every version pinned in ${p.source} against endoflife.date on ${longDate(p.asOf)}. Everything${p.recipient ? " you own" : ""} is supported for at least a year.`}
          </Text>
          <Column style={{ gap: 0 }}>
            {due.map((i) => (
              <Column key={name(i)} style={{ gap: 2, padding: [12, 0], border: { top: { width: 1, style: "solid", color: token("colors.border") } } }}>
                <Row>
                  <Column>
                    <Text style={{ fontWeight: 700 }}>{name(i)}</Text>
                  </Column>
                  <Column style={{ width: 210 }}>
                    <Text style={{ fontSize: 14, textAlign: "right", color: statusColor(i.status) }}>
                      {i.eol ? `${i.eol <= p.asOf ? "Ended" : "Ends"} ${shortDate(i.eol)}` : statusLabel(i.status)}
                    </Text>
                  </Column>
                </Row>
                <Text style={{ fontSize: 14, color: token("colors.muted") }}>
                  {i.target ? `Move to ${i.target}. ` : ""}Pinned in {placesText(i)}
                </Text>
              </Column>
            ))}
          </Column>
          <Text style={{ fontSize: 15, color: token("colors.muted") }}>
            Past its end of life a version gets no security fixes. The attached upgrade plan has every component, the timeline and who owns what.
          </Text>
        </Column>
        <Section style={{ padding: [20, 24, 32] }}>
          <Text style={{ fontSize: 14, color: token("colors.muted") }}>Dates from endoflife.date. Read from {p.source}.</Text>
        </Section>
      </Email>
    );
  },
});
