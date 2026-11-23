"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { auditForm, auditResultCopy } from "@/content/audit";
import type { AuditResult, PartialAuditReport } from "@/lib/audit/types";
import { looksLikeUrl } from "@/components/home/AuditUrlForm";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { IssueRow } from "@/components/ui/IssueRow";
import { requestAudit, toFlowError, type FlowError } from "./api";
import { AiPartialCard } from "./AiReading";
import { AuditForm } from "./AuditForm";
import { CheckGrid } from "./CheckGrid";
import { EmailGate } from "./EmailGate";
import { ErrorState } from "./ErrorState";
import { safeHref } from "./format";
import { FullReport } from "./FullReport";
import { IssueCard } from "./IssueCard";
import { auditUi } from "./labels";
import { ProgressSteps } from "./ProgressSteps";
import { FixTray } from "./quote/FixTray";
import { QuotePanel } from "./quote/QuotePanel";
import { QuoteProvider, useQuote } from "./quote/QuoteContext";
import { clearStoredQuote } from "./quote/handoff";
import { RequestLink } from "./quote/QuoteParts";
import { ScoreSummary } from "./ScoreSummary";
import { scrollToElement } from "@/components/scroll/smooth";
import { topFixes } from "./verdict";

/** The API allows ~60 s; give the network a little headroom before calling it a timeout. */
const CLIENT_TIMEOUT_MS = 75_000;

type FlowState =
  | { status: "idle" }
  | { status: "running"; url: string; run: number }
  | { status: "error"; url: string; error: FlowError }
  | {
      status: "report";
      url: string;
      partial: PartialAuditReport;
      sealed: string;
      full: AuditResult | null;
    };

/**
 * The free-audit flow: URL form -> progress -> partial report -> email gate -> full report.
 * The sealed report and the result live only in this component's state.
 * The idle explainer is rendered once by the page, after this component, and hidden by CSS
 * while the hidden `data-audit-active` marker below is present (R7 #17: it used to be passed in
 * as children to both the Suspense fallback and this component, so the HTML carried it twice).
 */
export function AuditFlow({ initialUrl = "" }: { initialUrl?: string }) {
  const uid = useId();
  const initial = initialUrl.trim().slice(0, 2048);
  const initialValid = initial !== "" && looksLikeUrl(initial);

  const [value, setValue] = useState(initial);
  const [fieldError, setFieldError] = useState<string | null>(
    initial && !initialValid ? auditForm.invalidInput : null,
  );
  // With a valid ?url= the server already renders the progress state, so auto-start causes no layout shift.
  const [state, setState] = useState<FlowState>(
    initialValid ? { status: "running", url: initial, run: 0 } : { status: "idle" },
  );
  const [announcement, setAnnouncement] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const fullHeadingRef = useRef<HTMLHeadingElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const focusNext = useRef<"results" | "full" | "input" | null>(null);
  const autoStarted = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const start = useCallback(async (url: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_TIMEOUT_MS);

    const run = ++runRef.current;
    setFieldError(null);
    // A quote stored from an earlier report must not ride along with an enquiry about this one (R7 #22).
    clearStoredQuote();
    setState({ status: "running", url, run });

    try {
      const out = await requestAudit(url, controller.signal);
      if (controllerRef.current !== controller) return; // cancelled or superseded
      controllerRef.current = null;
      if (out.ok) {
        focusNext.current = "results";
        setAnnouncement(auditUi.resultsReady);
        setState({
          status: "report",
          url,
          partial: out.data.partial,
          sealed: out.data.sealed,
          full: null,
        });
      } else if (out.error.code === "invalid_url") {
        focusNext.current = "input";
        setFieldError(out.error.message);
        setState({ status: "idle" });
      } else {
        setState({ status: "error", url, error: out.error });
      }
    } catch {
      if (controllerRef.current !== controller) return;
      controllerRef.current = null;
      setState({ status: "error", url, error: toFlowError(timedOut ? "timeout" : "generic") });
    } finally {
      window.clearTimeout(timer);
    }
  }, []);

  // Auto-start once from ?url=. Deferred so StrictMode's mount/unmount probe never fires two requests.
  useEffect(() => {
    if (!initialValid || autoStarted.current) return;
    const t = window.setTimeout(() => {
      autoStarted.current = true;
      void start(initial);
      // Use ?url= once: a reload or back/forward restore must not spend another audit from the hourly limit.
      const u = new URL(window.location.href);
      if (u.searchParams.has("url")) {
        u.searchParams.delete("url");
        window.history.replaceState(window.history.state, "", `${u.pathname}${u.search}${u.hash}`);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [initialValid, initial, start]);

  // Abort any in-flight audit when leaving the page. The route can be kept alive and hidden
  // (cacheComponents), so also reset to idle: coming Back must not show an error card for an
  // audit the visitor abandoned (R7 #8). Clearing the ref first makes the run's catch a no-op.
  useEffect(
    () => () => {
      const c = controllerRef.current;
      if (!c) return;
      controllerRef.current = null;
      c.abort();
      setState({ status: "idle" });
    },
    [],
  );

  // Move focus after the DOM has the target. Runs after child effects (score rings measure first).
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    if (target === "results") resultsHeadingRef.current?.focus();
    else if (target === "full") fullHeadingRef.current?.focus();
    else inputRef.current?.focus();
  }, [state, fieldError]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.status === "running") return;
    const url = value.trim();
    if (!looksLikeUrl(url)) {
      setFieldError(auditForm.invalidInput);
      inputRef.current?.focus();
      return;
    }
    void start(url);
  }

  /** Re-run from a button that is about to disappear: keep focus on the form, which also scrolls it into view. */
  function restart(url: string) {
    focusNext.current = "input";
    void start(url);
  }

  function cancel() {
    const c = controllerRef.current;
    controllerRef.current = null;
    c?.abort();
    focusNext.current = "input";
    setAnnouncement(auditUi.cancelled);
    setState({ status: "idle" });
  }

  function reset() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setValue("");
    setFieldError(null);
    focusNext.current = "input";
    setState({ status: "idle" });
  }

  const onUnlocked = useCallback((result: AuditResult) => {
    if (stateRef.current.status !== "report" || stateRef.current.partial.id !== result.id) return;
    focusNext.current = "full";
    setAnnouncement(auditUi.fullReady);
    // Drop the sealed blob once it has served its purpose.
    // Only attach to the report it was unlocked for (a newer audit may have replaced it meanwhile).
    setState((s) =>
      s.status === "report" && s.partial.id === result.id ? { ...s, sealed: "", full: result } : s,
    );
  }, []);

  const narrow = "mx-auto w-full max-w-2xl";

  // A run started (often straight from the home form with ?url=): show the progress card once,
  // if it starts low on the screen. Smooth through Lenis when active, instant under reduced motion.
  const progressRef = useRef<HTMLDivElement>(null);
  const runKey = state.status === "running" ? state.run : null;
  useEffect(() => {
    if (runKey === null) return;
    const id = requestAnimationFrame(() => {
      const el = progressRef.current;
      if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) scrollToElement(el, "center");
    });
    return () => cancelAnimationFrame(id);
  }, [runKey]);

  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <Container size="narrow" className="mt-10 sm:mt-12">
        <div className={narrow}>
          <AuditForm
            id={`${uid}-url`}
            value={value}
            onChange={(v) => {
              setValue(v);
              if (fieldError) setFieldError(null);
            }}
            onSubmit={onSubmit}
            running={state.status === "running"}
            error={fieldError}
            inputRef={inputRef}
          />
        </div>
      </Container>

      {state.status !== "idle" ? <span hidden data-audit-active="" /> : null}

      {state.status === "running" ? (
        <Container size="narrow" className="mt-10 min-h-[min(40rem,80svh)] pb-24">
          <div ref={progressRef} className={narrow}>
            <ProgressSteps
              key={state.run}
              url={state.url}
              onCancel={cancel}
              onAnnounce={setAnnouncement}
            />
          </div>
        </Container>
      ) : null}

      {state.status === "error" ? (
        <Container size="narrow" className="mt-10 pb-24">
          <div className={narrow}>
            <ErrorState error={state.error} onRetry={() => restart(state.url)} />
          </div>
        </Container>
      ) : null}

      {state.status === "report" ? (
        <Report
          headingId={`${uid}-results`}
          partial={state.partial}
          sealed={state.sealed}
          full={state.full}
          resultsHeadingRef={resultsHeadingRef}
          fullHeadingRef={fullHeadingRef}
          onUnlocked={onUnlocked}
          onRestart={() => restart(state.url)}
          onReset={reset}
        />
      ) : null}
    </>
  );
}

function Report({
  headingId,
  partial,
  sealed,
  full,
  resultsHeadingRef,
  fullHeadingRef,
  onUnlocked,
  onRestart,
  onReset,
}: {
  headingId: string;
  partial: PartialAuditReport;
  sealed: string;
  full: AuditResult | null;
  resultsHeadingRef: RefObject<HTMLHeadingElement | null>;
  fullHeadingRef: RefObject<HTMLHeadingElement | null>;
  onUnlocked: (r: AuditResult) => void;
  onRestart: () => void;
  onReset: () => void;
}) {
  const finalHref = safeHref(partial.finalUrl);
  const pages = full ? full.pages.length : partial.pagesScanned;
  // Before the email: top issues in full plus the locked titles (enough for the quote).
  const quoteIssues = useMemo(
    () => (full ? full.issues : [...partial.topIssues, ...partial.lockedIssues]),
    [full, partial.topIssues, partial.lockedIssues],
  );
  const quoteAudit = useMemo(
    () => ({ id: partial.id, url: partial.finalUrl, hostname: partial.hostname }),
    [partial.id, partial.finalUrl, partial.hostname],
  );

  return (
    <QuoteProvider issues={quoteIssues} pagesScanned={pages} audit={quoteAudit}>
      <section aria-labelledby={headingId} className="mt-16 border-t border-line-strong sm:mt-20">
        <div className="paper-grain bg-paper pt-8 pb-20 sm:pt-12 sm:pb-28">
          <Container>
            {/* Report header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <h2
                  id={headingId}
                  ref={resultsHeadingRef}
                  tabIndex={-1}
                  className="rounded-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  <span className="mb-3 flex items-center gap-2.5 text-kicker font-semibold text-muted uppercase">
                    <span aria-hidden className="h-px w-6 bg-ink/30" />
                    {auditUi.reportFor}
                  </span>{" "}
                  <span className="block font-serif text-display-md text-ink [overflow-wrap:anywhere]">
                    {partial.hostname}
                  </span>
                </h2>
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                {finalHref ? (
                  <a
                    href={finalHref}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="max-w-full truncate rounded-sm text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
                  >
                    {partial.finalUrl}
                    <span className="sr-only"> {auditUi.opensInNewTab}</span>
                  </a>
                ) : null}
                {finalHref ? (
                  <span aria-hidden className="text-line-strong">
                    ·
                  </span>
                ) : null}
                <span>{auditUi.pagesScanned(pages)}</span>
                <span aria-hidden className="text-line-strong">
                  ·
                </span>
                <span>{auditUi.seconds(partial.durationMs)}</span>
              </p>
            </div>

            {partial.truncated && !full ? (
              <p className="mt-6 rounded-xl bg-medium-soft px-4 py-3 text-sm leading-relaxed text-medium">
                {auditResultCopy.truncatedNote}
              </p>
            ) : null}

            <ScoreSummary
              scores={partial.scores}
              issueCounts={partial.issueCounts}
              topIssues={full ? topFixes(full.issues) : partial.topIssues}
              aiClarity={(full?.ai ?? partial.ai)?.clarityScore ?? null}
              className="mt-8"
            />

            {full ? (
              <div className="mt-16 sm:mt-20">
                <FullReport
                  result={full}
                  headingId={`${headingId}-full`}
                  headingRef={fullHeadingRef}
                />
              </div>
            ) : (
              <PartialBody
                headingId={headingId}
                partial={partial}
                sealed={sealed}
                onUnlocked={onUnlocked}
                onRestart={onRestart}
              />
            )}

            <NextSteps headingId={`${headingId}-next`} onReset={onReset} />
            <FixTray id={`${headingId}-fixlist`} />
          </Container>
        </div>
      </section>
    </QuoteProvider>
  );
}

function PartialBody({
  headingId,
  partial,
  sealed,
  onUnlocked,
  onRestart,
}: {
  headingId: string;
  partial: PartialAuditReport;
  sealed: string;
  onUnlocked: (r: AuditResult) => void;
  onRestart: () => void;
}) {
  const ids = {
    ai: `${headingId}-ai`,
    top: `${headingId}-top`,
    locked: `${headingId}-locked`,
    checks: `${headingId}-checks`,
    gate: `${headingId}-gate`,
    quote: `${headingId}-quote`,
  };
  const h3 = "font-serif text-display-sm text-ink";

  return (
    <div className="mt-14 grid gap-12 sm:mt-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-12 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-x-16">
      <div className="min-w-0 space-y-12">
        <section aria-labelledby={ids.top}>
          <h3 id={ids.top} className={h3}>
            {auditResultCopy.topIssuesTitle}
          </h3>
          {partial.topIssues.length > 0 ? (
            <ol className="mt-6 space-y-4">
              {partial.topIssues.map((issue) => (
                <li key={issue.id}>
                  <IssueCard issue={issue} hostname={partial.hostname} headingLevel={4} urlsOpen />
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-[0.9375rem] text-muted">{auditUi.noTopIssues}</p>
          )}
        </section>

        <AiPartialCard ai={partial.ai} headingId={ids.ai} gateHref={`#${ids.gate}`} />

        {partial.topIssues.length + partial.lockedIssues.length > 0 ? (
          <QuotePanel headingId={ids.quote} diyHref={`#${ids.top}`} headingLevel={3} />
        ) : null}

        {partial.lockedIssues.length > 0 ? (
          <section aria-labelledby={ids.locked}>
            <h3 id={ids.locked} className={`${h3} flex items-baseline gap-3`}>
              {auditResultCopy.lockedIssuesTitle}
              <span className="sr-only">, </span>
              <span className="font-sans text-sm font-medium text-muted tabular-nums">
                {partial.lockedIssues.length}
              </span>
            </h3>
            <p className="mt-2 text-[0.9375rem] text-muted">{auditUi.lockedHint}</p>
            <ul className="mt-5 space-y-2">
              {partial.lockedIssues.map((issue) => (
                <IssueRow key={issue.id} as="li" locked issue={issue} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div
          id={ids.gate}
          tabIndex={-1}
          className="rounded-panel focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent lg:sticky lg:top-28 lg:max-h-[calc(100svh-8rem-var(--fix-tray-h,0px))] lg:overflow-y-auto"
        >
          <EmailGate sealed={sealed} onUnlocked={onUnlocked} onRestart={onRestart} />
        </div>
      </div>

      <section aria-labelledby={ids.checks} className="min-w-0 lg:col-start-1">
        <h3 id={ids.checks} className={h3}>
          {auditUi.checksTitle}
        </h3>
        <CheckGrid checks={partial.checks} headingLevel={4} className="mt-6" />
      </section>
    </div>
  );
}

function NextSteps({ headingId, onReset }: { headingId: string; onReset: () => void }) {
  const cta = auditResultCopy.helpCta;
  const q = useQuote();
  const quote = q ? (q.selectionQuote ?? q.quote) : null;
  return (
    <section
      aria-labelledby={headingId}
      className="mt-16 flex flex-col gap-6 rounded-panel bg-white p-6 shadow-paper ring-1 ring-ink/[0.04] sm:mt-20 sm:p-9 md:flex-row md:items-center md:justify-between"
    >
      <h3 id={headingId} className="font-serif text-display-sm text-ink">
        {auditUi.nextTitle}
      </h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button variant="secondary" onClick={onReset}>
          {auditResultCopy.runAnother}
        </Button>
        {/* Carries the quote and audit to /contact like the panel and tray buttons (R7 #7):
            the picked issues if any, otherwise the whole-report quote. */}
        {q && quote && quote.lines.length > 0 ? (
          <RequestLink q={q} quote={quote} pill>
            {cta.label}
          </RequestLink>
        ) : (
          <Button href={cta.href} icon="arrow-right">
            {cta.label}
          </Button>
        )}
      </div>
    </section>
  );
}
