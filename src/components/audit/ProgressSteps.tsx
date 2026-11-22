"use client";

import { useEffect, useState } from "react";
import { auditProgressSteps } from "@/content/audit";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { displayUrl } from "./format";
import { auditUi } from "./labels";

/**
 * Seconds at which each step becomes current. The API gives no live progress,
 * so this is an honest approximation of where a typical audit spends its time;
 * the last step holds until the response arrives.
 */
const STEP_AT = [0, 2, 5, 12, 26];
const SLOW_AFTER = 40;

function stepFor(elapsed: number): number {
  let step = 0;
  for (let i = 0; i < STEP_AT.length && i < auditProgressSteps.length; i++) if (elapsed >= STEP_AT[i]) step = i;
  return step;
}

/** Live audit progress. Announces each step through the parent's polite live region. */
export function ProgressSteps({
  url,
  onCancel,
  onAnnounce,
}: {
  url: string;
  onCancel: () => void;
  onAnnounce: (message: string) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const step = stepFor(elapsed);
  const slow = elapsed >= SLOW_AFTER;

  useEffect(() => {
    const t0 = Date.now();
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    onAnnounce(`${auditProgressSteps[step]}. ${step === 0 ? auditUi.timeHint : ""}`.trim());
  }, [step, onAnnounce]);

  useEffect(() => {
    if (slow) onAnnounce(auditUi.slowHint);
  }, [slow, onAnnounce]);

  let host = url;
  try {
    host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
  } catch {
    host = displayUrl(url);
  }

  return (
    <div aria-busy="true" className="rounded-panel bg-white p-6 shadow-float ring-1 ring-ink/[0.05] sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-kicker font-semibold text-muted uppercase">{auditUi.progressTitle}</p>
          <p className="mt-2 font-serif text-[1.75rem] leading-tight text-ink [overflow-wrap:anywhere] sm:text-[2rem]">{host}</p>
        </div>
        <p aria-hidden className="rounded-pill bg-paper px-3 py-1.5 text-sm font-medium text-ink-2 tabular-nums">
          {elapsed} s
        </p>
      </div>

      <ol className="mt-7 space-y-0">
        {auditProgressSteps.map((label, i) => {
          const state = i < step ? "done" : i === step ? "current" : "pending";
          return (
            <li key={label} className="relative flex items-center gap-4 py-2.5">
              {i < auditProgressSteps.length - 1 ? (
                <span
                  aria-hidden
                  className={cx(
                    "absolute top-[calc(50%+0.875rem)] left-[0.8125rem] h-[calc(100%-1.75rem)] w-px",
                    i < step ? "bg-accent" : "bg-line-strong",
                  )}
                />
              ) : null}
              <span
                aria-hidden
                className={cx(
                  "relative grid size-[1.625rem] shrink-0 place-items-center rounded-full",
                  state === "done" && "bg-accent-600 text-white",
                  state === "current" && "bg-accent-soft",
                  state === "pending" && "bg-white shadow-[inset_0_0_0_1.5px_var(--color-line-strong)]",
                )}
              >
                {state === "done" ? (
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m4 8.5 2.5 2.5L12 5.5" />
                  </svg>
                ) : state === "current" ? (
                  <>
                    <span className="size-2 rounded-full bg-accent" />
                    <svg viewBox="0 0 26 26" className="absolute inset-0 size-full motion-safe:animate-spin" fill="none">
                      <circle cx="13" cy="13" r="11.5" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="18 60" />
                    </svg>
                  </>
                ) : null}
              </span>
              <span
                className={cx(
                  "text-[0.9875rem]",
                  state === "done" && "text-ink-2",
                  state === "current" && "font-medium text-ink",
                  state === "pending" && "text-muted",
                )}
              >
                {label}
                <span className="sr-only"> ({auditUi.stepStatus[state]})</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-7 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-pretty text-muted">{slow ? auditUi.slowHint : auditUi.timeHint}</p>
        <Button variant="secondary" size="sm" onClick={onCancel} className="self-start sm:self-auto">
          {auditUi.cancel}
        </Button>
      </div>
    </div>
  );
}
