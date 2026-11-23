"use client";

import { auditFrontPageCopy, auditQuoteCopy } from "@/content/audit";
import { issueFixInfo } from "@/lib/quote";
import { buttonClass } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { PriceText } from "@/components/pages/PriceText";
import { Icon } from "@/components/ui/Icon";
import { useQuote } from "./QuoteContext";

const btn = buttonClass({
  variant: "secondary",
  size: "sm",
  className: "h-auto! min-h-10 w-full justify-center rounded-control! py-2 text-center whitespace-normal! sm:w-auto",
});

/**
 * Per-issue choice (T026, Fable's ruling on R4 finding 11): the do-it-yourself path is a plain,
 * equally visible text label ("Fix it myself: the steps are above"; the steps are always in the
 * card), and "Have us fix this · <price>" is the one button (adds the issue to the fix list).
 * When the issue is a quick DIY fix, the paid option stays a quiet text button; when nothing
 * needs fixing (fixer "none"), it is not offered. Renders nothing outside a QuoteProvider.
 */
export function IssueActions({ issue }: { issue: { id: string; checkId?: string; title: string } }) {
  const q = useQuote();
  if (!q) return null;
  const info = issueFixInfo(issue, q.currency);
  const selected = q.isSelected(issue.id);
  const showPaid = info.fixer !== "none";

  // Constant label with aria-pressed: the pressed state, not the text, says it is in the fix list.
  const paidLabel = auditQuoteCopy.haveUsFix(info.priceText);

  return (
    <div className="mt-5 flex flex-col gap-x-6 gap-y-3 border-t border-line pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-ink-2">
        <Icon name="list" size={15} className="shrink-0 text-muted" />
        {auditFrontPageCopy.fixMyselfNote}
      </p>
      {showPaid ? (
        info.diy ? (
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => q.toggle(issue.id)}
            className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-sm px-1 text-sm font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:self-auto"
          >
            {selected ? <Icon name="check" size={14} className="shrink-0" /> : null}
            <PriceText value={paidLabel} />
          </button>
        ) : (
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => q.toggle(issue.id)}
            className={cx(btn, selected && "bg-accent-soft! text-accent-ink shadow-[inset_0_0_0_1px_var(--color-accent)]!")}
          >
            <Icon name={selected ? "check" : "plus"} size={15} className="shrink-0" />
            <PriceText value={paidLabel} />
          </button>
        )
      ) : null}
    </div>
  );
}
