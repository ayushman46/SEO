import type { AuditIssue, Category, Effort, Severity } from "@/lib/audit/types";
import { Badge } from "./Badge";
import { cx } from "./cx";
import { Icon } from "./Icon";

export const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const effortLabel: Record<Effort, string> = {
  quick: "Quick fix",
  moderate: "Moderate",
  involved: "Involved",
};

export const categoryLabel: Record<Category, string> = {
  seo: "SEO",
  geo: "GEO",
  performance: "Performance",
};

const effortDots: Record<Effort, number> = { quick: 1, moderate: 2, involved: 3 };

export type IssueRowData = Pick<AuditIssue, "title" | "severity" | "category"> &
  Partial<Pick<AuditIssue, "effort" | "impact">>;

/** Severity pill + title + effort (+ category, + recoverable points). `locked` for gated teasers. */
export function IssueRow({
  issue,
  locked = false,
  dense = false,
  as: Tag = "div",
  className,
}: {
  issue: IssueRowData;
  locked?: boolean;
  dense?: boolean;
  as?: "div" | "li";
  className?: string;
}) {
  return (
    <Tag
      className={cx(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl shadow-[inset_0_0_0_1px_var(--color-line)]",
        // Locked teasers read as "dimmed" through a paper fill, never opacity, so text keeps AA contrast.
        locked ? "bg-paper" : "bg-white",
        dense ? "px-3 py-2.5" : "px-4 py-3 sm:flex-nowrap",
        className,
      )}
    >
      <Badge tone={issue.severity} dot className="w-[4.75rem] justify-center">
        {severityLabel[issue.severity]}
      </Badge>
      <span
        className={cx(
          // a basis so on narrow cards the meta group wraps below the title instead of squeezing it (R5 #6)
          "min-w-0 flex-1 basis-[11rem] text-sm leading-snug font-medium",
          locked ? "text-muted" : "text-ink",
        )}
      >
        {locked ? (
          <span className="inline-flex items-baseline gap-1.5">
            <Icon name="lock" size={14} className="shrink-0 translate-y-0.5" />
            <span className="sr-only">Locked: </span>
            {issue.title}
          </span>
        ) : (
          issue.title
        )}
      </span>
      <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
        <span
          className={cx(
            "rounded-md px-1.5 py-0.5 font-medium text-ink-2",
            locked ? "bg-white" : "bg-paper",
          )}
        >
          {categoryLabel[issue.category]}
        </span>
        {issue.effort ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="flex gap-0.5">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={cx(
                    "h-2.5 w-1 rounded-full",
                    n <= effortDots[issue.effort!] ? "bg-ink-2" : "bg-line-strong",
                  )}
                />
              ))}
            </span>
            {effortLabel[issue.effort]}
          </span>
        ) : null}
        {typeof issue.impact === "number" ? (
          <span className="font-medium text-accent-ink tabular-nums">+{issue.impact} pts</span>
        ) : null}
      </span>
    </Tag>
  );
}
