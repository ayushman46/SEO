"use client";

import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { auditForm } from "@/content/audit";
import { cx } from "@/components/ui/cx";
import { describedBy, fieldIds } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

const HOST = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/i;

/** True when the input looks like a public domain or http(s) URL. The server validates for real. */
export function looksLikeUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value || /\s/.test(value) || value.length > 2048) return false;
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
  if (hasScheme && !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(hasScheme ? value : `https://${value}`);
    if (url.username || url.password) return false;
    return HOST.test(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Hero URL form. Works without JS (GET /audit?url=…); with JS it validates
 * first and navigates client-side.
 */
export function AuditUrlForm({
  tone = "light",
  className,
  showHelp = true,
}: {
  tone?: "light" | "night";
  className?: string;
  showHelp?: boolean;
}) {
  const router = useRouter();
  const uid = useId();
  const id = `${uid}-url`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const night = tone === "night";
  const { helpId, errorId } = fieldIds(id);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    if (!looksLikeUrl(value)) {
      setError(auditForm.invalidInput);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    startTransition(() => {
      router.push(`/audit?url=${encodeURIComponent(value)}`);
    });
  }

  return (
    <form action="/audit" method="get" noValidate onSubmit={onSubmit} className={cx("w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {auditForm.label}
      </label>
      <div
        className={cx(
          "flex flex-col gap-2 rounded-[1.375rem] p-2 sm:flex-row sm:items-center sm:rounded-pill",
          night ? "bg-white/[0.06]" : "bg-white",
          error
            ? "shadow-[inset_0_0_0_2px_var(--color-critical)]"
            : night
              ? "shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)]"
              : "shadow-[inset_0_0_0_1px_var(--color-line-strong),0_18px_40px_-24px_rgb(18_30_60/0.35)]",
          "has-[input:focus-visible]:shadow-[inset_0_0_0_2px_var(--color-accent),0_18px_40px_-24px_rgb(18_30_60/0.35)]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 pl-3 sm:pl-4">
          <Icon name="search" size={20} className={cx("shrink-0", night ? "text-night-muted" : "text-faint")} />
          <input
            ref={inputRef}
            id={id}
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            required
            placeholder={auditForm.placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, { help: showHelp ? auditForm.help : undefined, error: error ?? undefined })}
            onChange={() => error && setError(null)}
            className={cx(
              "h-12 w-full min-w-0 bg-transparent px-1.5 text-base outline-none placeholder:opacity-100",
              night ? "text-night-ink placeholder:text-night-muted" : "text-ink placeholder:text-faint",
            )}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-pill bg-accent-600 px-6 text-[0.9375rem] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(17_79_173/0.35)] transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-accent-800 disabled:opacity-70"
        >
          {pending ? auditForm.submittingLabel : auditForm.submitLabel}
          <Icon name="arrow-right" size={18} />
        </button>
      </div>
      <div aria-live="polite" className="min-h-0">
        {error ? (
          <p id={errorId} className={cx("mt-3 text-sm font-medium", night ? "text-[#ffb8ad]" : "text-critical")}>
            {error}
          </p>
        ) : null}
      </div>
      {showHelp ? (
        <p id={helpId} className={cx("mt-3 text-sm", night ? "text-night-muted" : "text-muted")}>
          {auditForm.help}
        </p>
      ) : null}
    </form>
  );
}
