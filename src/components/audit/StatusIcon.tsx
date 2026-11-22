import type { ReactNode } from "react";
import type { CheckStatus } from "@/lib/audit/types";
import { cx } from "@/components/ui/cx";

const tone: Record<CheckStatus, string> = {
  pass: "bg-pass-soft text-pass",
  warn: "bg-medium-soft text-medium",
  fail: "bg-critical-soft text-critical",
  unavailable: "bg-low-soft text-low",
};

const glyph: Record<CheckStatus, ReactNode> = {
  pass: <path d="m4.5 8.25 2.25 2.25 4.75-5" />,
  warn: <path d="M8 4.5v4.25M8 11.25v.25" />,
  fail: <path d="m5.25 5.25 5.5 5.5m0-5.5-5.5 5.5" />,
  unavailable: <path d="M5 8h6" />,
};

/** Small round status glyph. Decorative: pair it with visible status text. */
export function StatusIcon({ status, className }: { status: CheckStatus; className?: string }) {
  return (
    <span aria-hidden className={cx("grid size-6 shrink-0 place-items-center rounded-full", tone[status], className)}>
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {glyph[status]}
      </svg>
    </span>
  );
}

export const statusText: Record<CheckStatus, string> = {
  pass: "text-pass",
  warn: "text-medium",
  fail: "text-critical",
  unavailable: "text-low",
};
