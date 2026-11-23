import { Fragment } from "react";
import { cx } from "./cx";

const MARKER = /\[PLACEHOLDER(?::\s*([^\]]*))?\]/g;

export function hasPlaceholder(value: string) {
  return value.includes("[PLACEHOLDER");
}

/** The value with every "[PLACEHOLDER…]" marker removed (e.g. for prices or emails). */
export function stripPlaceholder(value: string) {
  return value.replace(MARKER, (_m, hint: string | undefined) => hint ?? "").replace(/\s{2,}/g, " ").trim();
}

/**
 * Renders copy that may contain "[PLACEHOLDER…]" markers from content-seo.
 * Markers become a small dashed tag so the founder can spot what to replace,
 * without the raw bracket text breaking the layout.
 */
export function PlaceholderText({ value, tone = "light", className }: { value: string; tone?: "light" | "night"; className?: string }) {
  if (!hasPlaceholder(value)) return <span className={className}>{value}</span>;
  const parts: Array<{ text: string; marker?: boolean }> = [];
  let last = 0;
  for (const m of value.matchAll(MARKER)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ text: value.slice(last, idx) });
    parts.push({ text: m[1]?.trim() || "placeholder", marker: true });
    last = idx + m[0].length;
  }
  if (last < value.length) parts.push({ text: value.slice(last) });

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.marker ? (
          <span
            key={i}
            title="Placeholder: replace before launch"
            className={cx(
              "mx-0.5 inline-block rounded-[5px] border border-dashed px-1.5 align-[0.1em] font-sans text-xs leading-[1.35] font-semibold tracking-[0.06em] uppercase",
              tone === "night" ? "border-white/40 text-night-muted" : "border-ink/35 text-muted",
            )}
          >
            {p.text}
          </span>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </span>
  );
}
