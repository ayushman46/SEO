"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { auditEmailGate } from "@/content/audit";
import { sampleReportLinks } from "@/content/sample-report";
import type { AuditResult } from "@/lib/audit/types";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Field, describedBy, fieldIds } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { looksLikeEmail, requestUnlock, retryInfo, toFlowError, type FlowError } from "./api";
import { auditUi } from "./labels";

/** Privacy note with "privacy policy" linked, without changing the copy. */
function PrivacyNote() {
  const text = auditEmailGate.privacyNote;
  const i = text.toLowerCase().indexOf(auditUi.privacyLinkText);
  const link = (label: string) => (
    <Link href="/privacy" className="rounded-sm text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink">
      {label}
    </Link>
  );
  if (i < 0) return <>{text} {link(auditUi.privacyLinkText)}</>;
  return (
    <>
      {text.slice(0, i)}
      {link(text.slice(i, i + auditUi.privacyLinkText.length))}
      {text.slice(i + auditUi.privacyLinkText.length)}
    </>
  );
}

/** Email + consent card that unlocks the full report. The sealed blob is only ever held in memory. */
export function EmailGate({
  sealed,
  onUnlocked,
  onRestart,
  className,
}: {
  sealed: string;
  onUnlocked: (result: AuditResult) => void;
  onRestart: () => void;
  className?: string;
}) {
  const uid = useId();
  const emailId = `${uid}-email`;
  const consentId = `${uid}-consent`;
  const titleId = `${uid}-title`;
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<FlowError | null>(null);
  const [pending, setPending] = useState(false);
  const consentErrorId = fieldIds(consentId).errorId;
  const ctrlRef = useRef<AbortController | null>(null);

  // The unlock request must not outlive the gate (e.g. the user starts another audit meanwhile).
  useEffect(() => () => ctrlRef.current?.abort(), []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const eErr = looksLikeEmail(email) ? null : auditEmailGate.invalidEmail;
    const cErr = consent ? null : auditEmailGate.consentRequired;
    setEmailError(eErr);
    setConsentError(cErr);
    setApiError(null);
    if (eErr) return emailRef.current?.focus();
    if (cErr) return consentRef.current?.focus();

    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setPending(true);
    try {
      const out = await requestUnlock(sealed, email.trim(), ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (out.ok) {
        onUnlocked(out.data);
        return;
      }
      if (out.error.code === "invalid_email") {
        setEmailError(out.error.message);
        emailRef.current?.focus();
      } else if (out.error.code === "consent_required") {
        setConsentError(out.error.message);
        consentRef.current?.focus();
      } else if (out.error.code === "rate_limited") {
        // The shared rate-limit copy talks about running audits; this limit is on unlock attempts.
        setApiError({ ...out.error, message: auditUi.unlockRateLimited });
      } else {
        setApiError(out.error);
      }
    } catch {
      if (ctrl.signal.aborted) return;
      setApiError(toFlowError("generic"));
    } finally {
      if (ctrlRef.current === ctrl) {
        ctrlRef.current = null;
        if (!ctrl.signal.aborted) setPending(false);
      }
    }
  }

  const retry = apiError ? retryInfo(apiError) : null;

  return (
    <section aria-labelledby={titleId} className={cx("rounded-panel bg-white p-6 shadow-float ring-1 ring-ink/[0.05] sm:p-8", className)}>
      <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-ink text-white">
        <Icon name="lock" size={20} />
      </span>
      <h3 id={titleId} className="mt-5 font-serif text-[1.875rem] leading-[1.08] text-balance text-ink">
        {auditEmailGate.title}
      </h3>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty text-muted">{auditEmailGate.body}</p>

      <form noValidate onSubmit={onSubmit} className="mt-6 space-y-5">
        <Field id={emailId} label={auditEmailGate.emailLabel} error={emailError ?? undefined}>
          <Input
            ref={emailRef}
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder={auditEmailGate.emailPlaceholder}
            value={email}
            invalid={!!emailError}
            aria-describedby={describedBy(emailId, { error: emailError ?? undefined })}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
          />
        </Field>

        <div>
          <div className="flex items-start gap-3">
            <input
              ref={consentRef}
              id={consentId}
              name="consent"
              type="checkbox"
              required
              checked={consent}
              aria-invalid={consentError ? true : undefined}
              aria-describedby={consentError ? consentErrorId : undefined}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (consentError) setConsentError(null);
              }}
              className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-accent-600"
            />
            <label htmlFor={consentId} className="cursor-pointer text-sm leading-relaxed text-pretty text-ink-2">
              {auditEmailGate.consentLabel}
            </label>
          </div>
          {consentError ? (
            <p id={consentErrorId} className="mt-2 flex items-start gap-2 pl-8 text-sm font-medium text-critical">
              {consentError}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" icon="arrow-right" className="w-full" aria-disabled={pending || undefined}>
          {pending ? auditEmailGate.submittingLabel : auditEmailGate.submitLabel}
        </Button>

        <div aria-live="polite">
          {apiError ? (
            <div className="rounded-xl bg-critical-soft px-4 py-3 text-sm leading-relaxed text-critical">
              <p className="font-medium">{apiError.message}</p>
              {retry ? <p className="mt-1">{auditUi.retryIn(retry.minutes, retry.at)}</p> : null}
              {apiError.code === "invalid_or_expired" ? (
                <button
                  type="button"
                  onClick={onRestart}
                  className="mt-2 rounded-sm font-semibold underline underline-offset-4"
                >
                  {auditUi.runAgain}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="text-xs leading-relaxed text-pretty text-muted">
          <PrivacyNote />
        </p>
      </form>

      {/* New tab: the audit result only lives in this page's memory, so leaving it would lose it. */}
      <p className="mt-6 border-t border-line pt-5 text-sm">
        <a
          href={sampleReportLinks.href}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-sm font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
        >
          {sampleReportLinks.gate}
          <Icon name="arrow-up-right" size={14} className="shrink-0" />
          <span className="sr-only"> {auditUi.opensInNewTab}</span>
        </a>
      </p>
    </section>
  );
}
