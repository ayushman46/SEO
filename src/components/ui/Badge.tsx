import type { ReactNode } from "react";
import { cx } from "./cx";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "outline"
  | "night"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "pass";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-paper-2 text-ink-2",
  accent: "bg-accent-soft text-accent-ink",
  outline: "bg-white/85 text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line-strong)]",
  night: "bg-white/[0.08] text-night-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)]",
  critical: "bg-critical-soft text-critical",
  high: "bg-high-soft text-high",
  medium: "bg-medium-soft text-medium",
  low: "bg-low-soft text-low",
  pass: "bg-pass-soft text-pass",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs leading-none font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
