import { cx } from "@/components/ui/cx";

/** The seenhq mark: an open eye on an ink tile, electric-blue iris. */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false" className={cx("shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="var(--color-ink)" />
      <path
        d="M5 16.2c2.9-5 6.7-7.6 11-7.6s8.1 2.6 11 7.6c-2.9 5-6.7 7.4-11 7.4s-8.1-2.4-11-7.4Z"
        fill="#fff"
      />
      <circle cx="16" cy="16.1" r="5" fill="var(--color-accent)" />
      <circle cx="16" cy="16.1" r="2.1" fill="var(--color-ink)" />
      <circle cx="17.7" cy="14.4" r="1" fill="#fff" />
    </svg>
  );
}

/** Mark + lowercase serif wordmark. Brand is always "seenhq". */
export function Logo({ size = "md", tone = "light", className }: { size?: "md" | "lg"; tone?: "light" | "night"; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <LogoMark size={size === "lg" ? 38 : 30} />
      <span
        className={cx(
          "font-serif leading-none tracking-[-0.01em]",
          size === "lg" ? "text-[2.25rem]" : "text-[1.625rem]",
          tone === "night" ? "text-night-ink" : "text-ink",
        )}
      >
        seenhq
      </span>
    </span>
  );
}
