import type { FormEvent, Ref } from "react";
import { auditForm } from "@/content/audit-form";
import { cx } from "@/components/ui/cx";
import { describedBy, fieldIds } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";

/**
 * The /audit page URL form. Controlled when `onChange` is given; otherwise an uncontrolled
 * server-rendered GET form (used as the streaming fallback, and it works without JS).
 */
export function AuditForm({
  id,
  value,
  onChange,
  onSubmit,
  running = false,
  error = null,
  inputRef,
}: {
  id: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  running?: boolean;
  error?: string | null;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const { helpId, errorId } = fieldIds(id);
  return (
    <form action="/audit" method="get" noValidate onSubmit={onSubmit} role="search" aria-label={auditForm.label}>
      <label htmlFor={id} className="mb-2.5 block text-left text-sm font-medium text-ink">
        {auditForm.label}
      </label>
      <div
        className={cx(
          "flex flex-col gap-2 rounded-[1.375rem] bg-white p-2 sm:flex-row sm:items-center sm:rounded-pill",
          error
            ? "shadow-[inset_0_0_0_2px_var(--color-critical)]"
            : "shadow-[inset_0_0_0_1px_var(--color-line-strong),0_18px_40px_-24px_rgb(18_30_60/0.35)]",
          "has-[input:focus-visible]:shadow-[inset_0_0_0_2px_var(--color-accent),0_18px_40px_-24px_rgb(18_30_60/0.35)]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 pl-3 sm:pl-4">
          <Icon name="search" size={20} className="shrink-0 text-faint" />
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
            readOnly={running}
            {...(onChange ? { value: value ?? "", onChange: (e) => onChange(e.target.value) } : { defaultValue: value })}
            placeholder={auditForm.placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, { help: auditForm.help, error: error ?? undefined })}
            className="h-12 w-full min-w-0 bg-transparent px-1.5 text-base text-ink outline-none placeholder:text-faint placeholder:opacity-100 read-only:text-ink-2"
          />
        </div>
        <button
          type="submit"
          aria-disabled={running || undefined}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-pill bg-accent-600 px-6 text-[0.9375rem] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(17_79_173/0.35)] transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-accent-800 aria-disabled:cursor-progress aria-disabled:opacity-75"
        >
          {running ? auditForm.submittingLabel : auditForm.submitLabel}
          <Icon name="arrow-right" size={18} />
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-3 text-left text-sm font-medium text-critical">
          {error}
        </p>
      ) : null}
      <p id={helpId} className="mt-3 text-left text-sm text-muted">
        {auditForm.help}
      </p>
    </form>
  );
}
