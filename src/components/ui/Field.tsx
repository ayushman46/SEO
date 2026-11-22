import type { ReactNode } from "react";
import { cx } from "./cx";

export function fieldIds(id: string) {
  return { helpId: `${id}-help`, errorId: `${id}-error` };
}

/** aria-describedby value for a control inside <Field>. */
export function describedBy(id: string, { help, error }: { help?: ReactNode; error?: ReactNode }) {
  const { helpId, errorId } = fieldIds(id);
  return [error ? errorId : null, help ? helpId : null].filter(Boolean).join(" ") || undefined;
}

/** Label + control + error + help. The control uses the same `id` and `aria-describedby={describedBy(id, …)}`. */
export function Field({
  id,
  label,
  help,
  error,
  hideLabel = false,
  tone = "light",
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  hideLabel?: boolean;
  tone?: "light" | "night";
  className?: string;
  children: ReactNode;
}) {
  const { helpId, errorId } = fieldIds(id);
  const night = tone === "night";
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label
        htmlFor={id}
        className={cx(hideLabel ? "sr-only" : "text-sm font-medium", night ? "text-night-ink" : "text-ink")}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={errorId}
          className={cx("flex items-start gap-2 text-sm font-medium", night ? "text-[#ffb8ad]" : "text-critical")}
        >
          <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm-.75 3.25h1.5v4.5h-1.5v-4.5Zm0 5.75h1.5V12h-1.5v-1.5Z" />
          </svg>
          {error}
        </p>
      ) : null}
      {help ? (
        <p id={helpId} className={cx("text-sm", night ? "text-night-muted" : "text-muted")}>
          {help}
        </p>
      ) : null}
    </div>
  );
}
