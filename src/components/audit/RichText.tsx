import { Fragment } from "react";
import { cx } from "@/components/ui/cx";
import { splitInlineCode } from "./format";

/**
 * Renders engine-provided text safely as React text nodes. Backtick spans
 * become <code>. Never uses dangerouslySetInnerHTML.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cx("whitespace-pre-line", className)}>
      {splitInlineCode(text).map((part, i) =>
        part.code ? (
          <code
            key={i}
            className="rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink [overflow-wrap:anywhere] shadow-[inset_0_0_0_1px_var(--color-line)]"
          >
            {part.text}
          </code>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </span>
  );
}
