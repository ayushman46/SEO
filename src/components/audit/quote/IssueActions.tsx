"use client";

import { auditQuoteCopy } from "@/content/audit";
import { issueFixInfo } from "@/lib/quote";
import { buttonClass } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { useQuote } from "./QuoteContext";

const btn = buttonClass({
  variant: "secondary",
  size: "sm",
  className: "h-auto! min-h-10 w-full justify-center py-2 text-center whitespace-normal! sm:w-auto",
});

/**
 * Per-issue choice: "Fix it myself" (moves focus to the fix steps, which are always visible) and
 * "Have us fix this · <price>" (adds the issue to the fix list). Both have the same size and style.
 * When the issue is a quick DIY fix, the paid option becomes a quiet text button; when nothing
 * needs fixing (fixer "none"), it is not offered. Renders nothing outside a QuoteProvider.
 */
export function IssueActions({ issue, fixStepsId }: { issue: { id: string; checkId?: string; title: string }; fixStepsId: string }) {
  const q = useQuote();
  if (!q) return null;
  const info = issueFixInfo(issue, q.currency);
  const selected = q.isSelected(issue.id);
  const showPaid = info.fixer !== "none";

  function fixMyself() {
    const el = document.getElementById(fixStepsId);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }

  // Constant label with aria-pressed: the pressed state, not the text, says it is in the fix list.
  const paidLabel = auditQuoteCopy.haveUsFix(info.priceText);

  return (
    <div className={cx("mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", info.diy && "sm:gap-x-5")}>
      <button type="button" className={btn} onClick={fixMyself}>
        <Icon name="list" size={15} className="shrink-0" />
        {auditQuoteCopy.fixMyself}
      </button>
      {showPaid ? (
        info.diy ? (
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => q.toggle(issue.id)}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 self-center rounded-sm px-1 text-sm font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:self-auto"
          >
            {selected ? <Icon name="check" size={14} className="shrink-0" /> : null}
            {paidLabel}
          </button>
        ) : (
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => q.toggle(issue.id)}
            className={cx(btn, selected && "bg-accent-soft! text-accent-ink shadow-[inset_0_0_0_1px_var(--color-accent)]!")}
          >
            <Icon name={selected ? "check" : "plus"} size={15} className="shrink-0" />
            <span className="tabular-nums">{paidLabel}</span>
          </button>
        )
      ) : null}
    </div>
  );
}
