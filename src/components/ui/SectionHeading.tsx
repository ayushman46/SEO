import type { ReactNode } from "react";
import { cx } from "./cx";

/** Kicker + serif title (+ optional body). `tone="night"` for the dark section. */
export function SectionHeading({
  kicker,
  title,
  body,
  as: Tag = "h2",
  id,
  align = "left",
  size = "md",
  tone = "light",
  className,
  children,
}: {
  kicker?: string;
  title: ReactNode;
  body?: ReactNode;
  as?: "h1" | "h2" | "h3";
  id?: string;
  align?: "left" | "center";
  size?: "sm" | "md" | "lg";
  tone?: "light" | "night";
  className?: string;
  children?: ReactNode;
}) {
  const night = tone === "night";
  return (
    <div className={cx("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {kicker ? (
        <p
          className={cx(
            "mb-4 inline-flex items-center gap-2.5 text-kicker font-semibold uppercase",
            night ? "text-night-muted" : "text-muted",
          )}
        >
          <span aria-hidden className={cx("h-px w-6", night ? "bg-night-muted/60" : "bg-ink/30")} />
          {kicker}
        </p>
      ) : null}
      <Tag
        id={id}
        className={cx(
          "font-serif text-balance",
          size === "lg" ? "text-display-lg" : size === "md" ? "text-display-md" : "text-display-sm",
          night ? "text-night-ink" : "text-ink",
        )}
      >
        {title}
      </Tag>
      {body ? (
        <p
          className={cx(
            "mt-5 max-w-[60ch] text-[1.0625rem] leading-relaxed text-pretty",
            align === "center" && "mx-auto",
            night ? "text-night-muted" : "text-muted",
          )}
        >
          {body}
        </p>
      ) : null}
      {children}
    </div>
  );
}
