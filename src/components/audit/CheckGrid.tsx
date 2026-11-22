import type { CheckResult } from "@/lib/audit/types";
import { auditResultCopy } from "@/content/audit";
import { cx } from "@/components/ui/cx";
import { CATEGORIES } from "./format";
import { auditUi } from "./labels";
import { StatusIcon, statusText } from "./StatusIcon";

export type CheckItem = Pick<CheckResult, "id" | "category" | "label" | "status"> & { summary?: string };

/** Checks grouped by category, each a chip with a status glyph + text (never color alone). */
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
  const groups = CATEGORIES.map((category) => ({ category, items: checks.filter((c) => c.category === category) })).filter(
    (g) => g.items.length > 0,
  );
  const detailed = checks.some((c) => c.summary);

  return (
    <div className={cx("space-y-8", className)}>
      {groups.map(({ category, items }) => {
        const count = (s: CheckItem["status"]) => items.filter((c) => c.status === s).length;
        return (
          <div key={category}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
              <H className="text-sm font-semibold text-ink">{auditResultCopy.categoryLabels[category]}</H>
              <p className="text-xs text-muted tabular-nums">{auditUi.checkCounts(count("pass"), count("warn"), count("fail"))}</p>
            </div>
            <ul className={cx("mt-3 grid gap-2", detailed ? "md:grid-cols-2" : "sm:grid-cols-2")}>
              {items.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl bg-white px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--color-line)]"
                >
                  <StatusIcon status={c.status} className="mt-px" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-sm leading-snug font-medium text-ink">{c.label}</span>
                      <span className={cx("text-xs font-semibold", statusText[c.status])}>{auditUi.checkStatus[c.status]}</span>
                    </div>
                    {c.summary ? <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">{c.summary}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
