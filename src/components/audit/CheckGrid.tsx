import type { CheckResult } from "@/lib/audit/types";
import { auditResultCopy } from "@/content/audit";
import { cx } from "@/components/ui/cx";
import { CATEGORIES } from "./format";
import { auditUi } from "./labels";
import { StatusIcon, statusText } from "./StatusIcon";

export type CheckItem = Pick<CheckResult, "id" | "category" | "label" | "status"> & { summary?: string };

const KNOWN_STATUS = new Set(["pass", "warn", "fail", "unavailable"]);

/** Engine label, else a known friendly name, else the id made readable ("geo.ai-crawler-probe" -> "Ai crawler probe"). */
export function checkLabel(c: Pick<CheckItem, "id" | "label">): string {
  const label = typeof c.label === "string" ? c.label.trim() : "";
  if (label) return label;
  const known = auditUi.checkLabelFallback[c.id];
  if (known) return known;
  const tail = (c.id.split(".").pop() ?? c.id).replace(/[-_]+/g, " ").trim();
  return tail ? tail.charAt(0).toUpperCase() + tail.slice(1) : c.id;
}

/** Groups by known category; anything else (a category added later) lands in a trailing "Other" group. */
export function groupChecks(checks: CheckItem[]) {
  const known = new Set<string>(CATEGORIES);
  const groups: { key: string; label: string; items: CheckItem[] }[] = CATEGORIES.map((category) => ({
    key: category,
    label: auditResultCopy.categoryLabels[category],
    items: checks.filter((c) => c.category === category),
  }));
  groups.push({ key: "other", label: auditUi.otherChecks, items: checks.filter((c) => !known.has(c.category)) });
  return groups.filter((g) => g.items.length > 0);
}

/**
 * Checks grouped by category (T026): failures, warnings and not-run checks as hairline rows,
 * passes folded into a native disclosure. Status is a glyph + text (never color alone).
 */
export function CheckGrid({
  checks,
  headingLevel = 4,
  className,
}: {
  checks: CheckItem[];
  headingLevel?: 3 | 4 | 5;
  className?: string;
}) {
  const H = `h${headingLevel}` as "h3" | "h4" | "h5";
  // An unknown status from a newer engine reads as "Not run" rather than breaking the glyph lookup.
  const normalized = checks.map((c) => (KNOWN_STATUS.has(c.status) ? c : { ...c, status: "unavailable" as const }));
  const groups = groupChecks(normalized);

  return (
    <div className={cx("space-y-8", className)}>
      {groups.map(({ key, label, items }) => {
        const count = (s: CheckItem["status"]) => items.filter((c) => c.status === s).length;
        // T026: what needs attention first as hairline rows; passes fold into "<n> passed"
        const open = items.filter((c) => c.status !== "pass");
        const passed = items.filter((c) => c.status === "pass");
        const row = (c: CheckItem) => (
          <li key={c.id} className="flex items-start gap-3 py-3">
            <StatusIcon status={c.status} className="mt-px" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-sm leading-snug font-medium text-ink [overflow-wrap:anywhere]">{checkLabel(c)}</span>
                <span className={cx("text-xs font-semibold", statusText[c.status])}>{auditUi.checkStatus[c.status]}</span>
              </div>
              {c.summary ? <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-pretty text-muted">{c.summary}</p> : null}
            </div>
          </li>
        );
        return (
          <div key={key}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
              <H className="text-sm font-semibold text-ink">{label}</H>
              <p className="text-xs text-muted tabular-nums">
                {auditUi.checkCounts(count("pass"), count("warn"), count("fail"), count("unavailable"))}
              </p>
            </div>
            {open.length ? <ul className="divide-y divide-line">{open.map(row)}</ul> : null}
            {passed.length ? (
              <details className="group/pass">
                <summary className="inline-flex cursor-pointer items-center gap-2 rounded-sm py-3 text-sm font-medium text-ink-2 hover:text-ink">
                  {auditUi.checkCounts(passed.length, 0, 0).split(" · ")[0]}
                  <span aria-hidden className="text-muted transition-transform duration-200 group-open/pass:rotate-90">
                    ›
                  </span>
                </summary>
                <ul className="divide-y divide-line border-t border-line">{passed.map(row)}</ul>
              </details>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
