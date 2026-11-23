"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { isRetryable, retryInfo, type FlowError } from "./api";
import { auditUi } from "./labels";

/** Error card for a failed audit. Takes focus on mount so keyboard and SR users land on it. */
export function ErrorState({ error, onRetry }: { error: FlowError; onRetry?: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [retry, setRetry] = useState<{ minutes: number; at: string } | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [error]);

  // Clock-dependent text is computed after mount only.
  useEffect(() => {
    const id = window.setTimeout(() => setRetry(retryInfo(error)), 0);
    return () => window.clearTimeout(id);
  }, [error]);

  // Both are "wait, then retry" states: clock icon, wait title and the retry time (R7 #8).
  const rate = error.code === "rate_limited" || error.code === "server_busy";
  const title = rate ? auditUi.rateTitle : error.code === "generic" ? auditUi.genericTitle : auditUi.errorTitle;

  return (
    <div className="rounded-panel bg-white p-6 shadow-float ring-1 ring-ink/[0.05] sm:p-9">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={`grid size-10 shrink-0 place-items-center rounded-full ${rate ? "bg-medium-soft text-medium" : "bg-critical-soft text-critical"}`}
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {rate ? (
              <>
                <circle cx="10" cy="10" r="7" />
                <path d="M10 6.5V10l2.25 1.5" />
              </>
            ) : (
              <path d="M10 5.5v5.25M10 14v.25" />
            )}
          </svg>
        </span>
        <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="font-serif text-title-lg text-balance text-ink rounded-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            {title}
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-pretty text-muted">{error.message}</p>
          {rate && retry ? <p className="mt-2 text-[0.9375rem] font-medium text-ink-2">{auditUi.retryIn(retry.minutes, retry.at)}</p> : null}
          {onRetry && isRetryable(error.code) ? (
            <Button onClick={onRetry} size="sm" icon="arrow-right" className="mt-6">
              {auditUi.tryAgain}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
