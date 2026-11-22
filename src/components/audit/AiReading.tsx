import type { AiDrafts, AiFact, AiInsights, AiQuestion, Answered, FactStatus, PartialAiInsights } from "@/lib/audit/types";
import { auditAiCopy, auditAnsweredLabels, auditDraftCopy, auditFactStatusLabels } from "@/content/audit";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { CopyButton } from "./CopyButton";
import { displayUrl, safeHref } from "./format";
import { auditUi } from "./labels";

/*
 * Everything an AI model wrote (readback, facts, notes, drafts) comes from untrusted page text.
 * It is only ever rendered as React text children, never as HTML.
 */

const factTone: Record<FactStatus, BadgeTone> = { clear: "pass", vague: "medium", missing: "high" };
const answeredTone: Record<Answered, BadgeTone> = { yes: "pass", partly: "medium", no: "high" };
const FACT_STATUSES: FactStatus[] = ["clear", "vague", "missing"];

/** Draft order in the full report: page basics first, then files and schema. */
export const DRAFT_ORDER: (keyof AiDrafts)[] = ["title", "metaDescription", "answerParagraph", "organizationJsonLd", "llmsTxt"];
/** Drafts that are code/files: keep line breaks and scroll sideways instead of wrapping. */
const CODE_DRAFTS = new Set<keyof AiDrafts>(["organizationJsonLd", "llmsTxt"]);

const isDraftKey = (k: string): k is keyof AiDrafts => Object.prototype.hasOwnProperty.call(auditDraftCopy, k);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

export function FactStatusBadge({ status }: { status: FactStatus }) {
  const s = factTone[status] ? status : "missing";
  return (
    <Badge tone={factTone[s]} dot>
      {auditFactStatusLabels[s]}
    </Badge>
  );
}

export function AnsweredBadge({ answered }: { answered: Answered }) {
  const a = answeredTone[answered] ? answered : "no";
  return (
    <Badge tone={answeredTone[a]} dot>
      {auditAnsweredLabels[a]}
    </Badge>
  );
}

/** The honesty label every AI surface carries, with the model id in small mono text. */
export function HonestyLabel({ model, className }: { model: string; className?: string }) {
  const id = str(model).trim();
  return (
    <div className={cx("flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-pretty text-muted", className)}>
      <Icon name="eye" size={16} className="mt-0.5 shrink-0 text-ink-2" />
      <p>
        {auditAiCopy.honesty}
        {id ? (
          <span className="mt-1 block text-xs">
            {auditAiCopy.modelLabel}: <code className="font-mono text-[0.75rem] text-ink-2 [overflow-wrap:anywhere]">{id}</code>
          </span>
        ) : null}
      </p>
    </div>
  );
}

/** One quiet line when the AI reading did not run. No card, no reserved space. */
export function AiUnavailableNote({ className }: { className?: string }) {
  return (
    <p className={cx("flex items-start gap-2.5 text-sm leading-relaxed text-pretty text-muted", className)}>
      <Icon name="eye" size={16} className="mt-0.5 shrink-0 text-faint" />
      {auditAiCopy.unavailable}
    </p>
  );
}

function BusinessType({ value }: { value: string | null }) {
  const v = str(value).trim();
  if (!v) return null;
  return (
    <p className="inline-flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl bg-paper px-3 py-1.5 text-xs shadow-[inset_0_0_0_1px_var(--color-line)]">
      <span className="font-medium text-muted">{auditAiCopy.businessTypeLabel}</span>
      <span className="font-semibold text-ink [overflow-wrap:anywhere]">{v}</span>
    </p>
  );
}

function Readback({ ai }: { ai: Pick<PartialAiInsights, "readback" | "businessType" | "clarityScore"> }) {
  const readback = str(ai.readback).trim();
  return (
    <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-8">
      <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2">
        <ScoreRing value={Number.isFinite(ai.clarityScore) ? ai.clarityScore : null} label={auditAiCopy.clarityLabel} size={104} stroke={7} />
      </div>
      <div className="min-w-0">
        <BusinessType value={ai.businessType} />
        {readback ? (
          <figure className="mt-4">
            <figcaption className="text-kicker font-semibold text-ink-2 uppercase">{auditAiCopy.readbackLabel}</figcaption>
            <blockquote className="mt-2 border-l-2 border-accent pl-4 font-serif text-[1.3125rem] leading-snug text-pretty text-ink [overflow-wrap:anywhere] sm:text-[1.5rem]">
              {readback}
            </blockquote>
          </figure>
        ) : null}
        <p className="mt-4 text-[0.8125rem] leading-relaxed text-pretty text-muted">{auditAiCopy.clarityHint}</p>
      </div>
    </div>
  );
}

function QuestionItem({ q, hostname, withSource }: { q: AiQuestion; hostname?: string; withSource: boolean }) {
  const href = withSource && q.sourceUrl ? safeHref(q.sourceUrl) : null;
  const note = str(q.note).trim();
  return (
    <li className="rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-line)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <p className="min-w-0 text-[0.9375rem] leading-snug font-medium text-ink [overflow-wrap:anywhere]">{str(q.question)}</p>
        <span className="shrink-0">
          <AnsweredBadge answered={q.answered} />
        </span>
      </div>
      {note ? <p className="mt-2 text-sm leading-relaxed text-pretty text-muted [overflow-wrap:anywhere]">{note}</p> : null}
      {href ? (
        <p className="mt-2 text-sm text-muted">
          {auditAiCopy.answeredOn}{" "}
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-sm font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 [overflow-wrap:anywhere] hover:decoration-accent-ink"
          >
            {displayUrl(href, hostname)}
            <span className="sr-only"> {auditUi.opensInNewTab}</span>
          </a>
        </p>
      ) : null}
    </li>
  );
}

const kicker = "text-kicker font-semibold text-ink-2 uppercase";

/**
 * Partial report card: readback, business type, clarity, fact counts, two sample questions and
 * a locked list pointing at the email gate. Never receives (or shows) draft text.
 * Renders the quiet one-liner instead when the AI reading is unavailable.
 */
export function AiPartialCard({
  ai,
  headingId,
  gateHref,
  className,
}: {
  ai: PartialAiInsights | null | undefined;
  headingId: string;
  /** in-page link to the email gate, e.g. "#report-gate" */
  gateHref: string;
  className?: string;
}) {
  if (!ai) return <AiUnavailableNote className={className} />;

  const samples = Array.isArray(ai.sampleQuestions) ? ai.sampleQuestions.slice(0, 2) : [];
  const lockedQuestions = Math.max(0, Math.round(Number(ai.lockedQuestionCount) || 0));
  const lockedDrafts = (Array.isArray(ai.lockedDrafts) ? ai.lockedDrafts : []).filter(isDraftKey);
  const hasLocked = lockedQuestions > 0 || lockedDrafts.length > 0;
  const ids = { facts: `${headingId}-facts`, questions: `${headingId}-questions`, locked: `${headingId}-locked` };

  return (
    <section aria-labelledby={headingId} className={cx("rounded-panel bg-white p-5 shadow-paper ring-1 ring-ink/[0.04] sm:p-8", className)}>
      <h3 id={headingId} className="font-serif text-display-sm text-ink">
        {auditAiCopy.partialTitle}
      </h3>
      <HonestyLabel model={ai.model} className="mt-3" />

      <div className="mt-7 border-t border-line pt-7">
        <Readback ai={ai} />
      </div>

      <div className="mt-7">
        <h4 id={ids.facts} className={kicker}>
          {auditAiCopy.factsTitle}
        </h4>
        <ul aria-labelledby={ids.facts} className="mt-3 flex flex-wrap gap-2">
          {FACT_STATUSES.map((s) => (
            <li key={s}>
              <Badge tone={factTone[s]} dot className="px-3 py-1.5 text-[0.8125rem]">
                <span className="font-semibold tabular-nums">{Math.max(0, Number(ai.factCounts?.[s]) || 0)}</span>{" "}
                {auditFactStatusLabels[s].toLowerCase()}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      {samples.length > 0 ? (
        <div className="mt-7">
          <h4 id={ids.questions} className={kicker}>
            {auditAiCopy.questionsTitle}
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted">{auditAiCopy.questionsIntro}</p>
          <ul className="mt-4 space-y-2">
            {samples.map((q, i) => (
              <QuestionItem key={i} q={q} withSource={false} />
            ))}
          </ul>
        </div>
      ) : null}

      {hasLocked ? (
        <div className="mt-7 rounded-xl bg-paper p-4 shadow-[inset_0_0_0_1px_var(--color-line)] sm:p-5">
          <h4 id={ids.locked} className={cx(kicker, "flex items-center gap-2")}>
            <Icon name="lock" size={14} className="shrink-0" />
            {auditAiCopy.lockedTitle}
          </h4>
          <ul aria-labelledby={ids.locked} className="mt-3 space-y-2 text-sm text-muted">
            {lockedQuestions > 0 ? <LockedItem>{auditAiCopy.lockedQuestions(lockedQuestions)}</LockedItem> : null}
            {lockedDrafts.map((k) => (
              <LockedItem key={k}>{auditAiCopy.lockedDraft(auditDraftCopy[k].label)}</LockedItem>
            ))}
          </ul>
          <a
            href={gateHref}
            className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-accent-ink underline decoration-accent-ink/30 underline-offset-4 hover:decoration-accent-ink"
          >
            {auditAiCopy.lockedCta}
            <Icon name="arrow-right" size={15} className="shrink-0" />
          </a>
        </div>
      ) : null}
    </section>
  );
}

function LockedItem({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-2 rounded-lg bg-white px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--color-line)]">
      <Icon name="lock" size={14} className="mt-[3px] shrink-0 text-ink-2" />
      <span className="sr-only">{auditUi.lockedPrefix} </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function FactRow({ fact }: { fact: AiFact }) {
  const value = str(fact.value).trim();
  return (
    <div className="grid gap-x-6 gap-y-1.5 border-b border-line py-4 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-baseline">
      <dt className="text-sm font-semibold text-ink">{str(fact.label) || str(fact.key)}</dt>
      <dd className={cx("min-w-0 text-[0.9375rem] leading-relaxed text-pretty [overflow-wrap:anywhere]", value ? "text-ink-2" : "text-muted italic")}>
        {value || auditAiCopy.factNotFound}
      </dd>
      <dd className="sm:justify-self-end">
        <FactStatusBadge status={fact.status} />
      </dd>
    </div>
  );
}

function DraftBlock({ draftKey, text, idPrefix }: { draftKey: keyof AiDrafts; text: string; idPrefix: string }) {
  const copy = auditDraftCopy[draftKey];
  const titleId = `${idPrefix}-${draftKey}`;
  const code = CODE_DRAFTS.has(draftKey);
  return (
    <article aria-labelledby={titleId} className="min-w-0 rounded-card bg-white p-4 shadow-paper ring-1 ring-ink/[0.04] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <h6 id={titleId} className="font-serif text-[1.375rem] leading-tight text-ink">
            {copy.label}
          </h6>
          <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">{copy.where}</p>
        </div>
        <CopyButton text={text} label={copy.label} />
      </div>
      {/* Plain text only: React escapes it, so markup in a draft shows literally. */}
      <pre
        tabIndex={0}
        className={cx(
          "mt-4 max-h-96 max-w-full overflow-auto rounded-xl bg-paper p-4 font-mono text-[0.8125rem] leading-relaxed text-ink shadow-[inset_0_0_0_1px_var(--color-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          code ? "whitespace-pre" : "whitespace-pre-wrap [overflow-wrap:anywhere]",
        )}
      >
        <code>{text}</code>
      </pre>
    </article>
  );
}

/**
 * Full report "AI reading" body (the section heading comes from FullReport):
 * readback, all facts, all questions with sources, and every non-null draft with Copy.
 */
export function AiFullSection({ ai, hostname, idPrefix }: { ai: AiInsights; hostname: string; idPrefix: string }) {
  const facts = Array.isArray(ai.facts) ? ai.facts : [];
  const questions = Array.isArray(ai.questions) ? ai.questions : [];
  const drafts = DRAFT_ORDER.flatMap((k) => {
    const text = ai.drafts ? ai.drafts[k] : null;
    return typeof text === "string" && text.trim() ? [{ key: k, text }] : [];
  });
  const ids = { facts: `${idPrefix}-facts`, questions: `${idPrefix}-questions`, drafts: `${idPrefix}-drafts` };
  const h5 = "font-serif text-[1.5rem] leading-tight text-ink";

  return (
    <div className="space-y-12">
      <div className="rounded-panel bg-white p-5 shadow-paper ring-1 ring-ink/[0.04] sm:p-8">
        <HonestyLabel model={ai.model} />
        <div className="mt-6 border-t border-line pt-6">
          <Readback ai={ai} />
        </div>
      </div>

      {facts.length > 0 ? (
        <div>
          <h5 id={ids.facts} className={h5}>
            {auditAiCopy.factsTitle}
          </h5>
          <p className="mt-1.5 text-sm text-muted">{auditAiCopy.factsIntro}</p>
          <dl className="mt-4 rounded-card bg-white px-4 shadow-[inset_0_0_0_1px_var(--color-line)] sm:px-6">
            {facts.map((f, i) => (
              <FactRow key={`${f.key}-${i}`} fact={f} />
            ))}
          </dl>
        </div>
      ) : null}

      {questions.length > 0 ? (
        <div>
          <h5 id={ids.questions} className={cx(h5, "flex items-baseline gap-3")}>
            {auditAiCopy.questionsTitle}
            <span className="font-sans text-sm font-medium text-muted tabular-nums">{questions.length}</span>
          </h5>
          <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted">{auditAiCopy.questionsIntro}</p>
          <ul className="mt-4 space-y-2">
            {questions.map((q, i) => (
              <QuestionItem key={i} q={q} hostname={hostname} withSource />
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h5 id={ids.drafts} className={h5}>
          {auditAiCopy.draftsTitle}
        </h5>
        <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted">{drafts.length > 0 ? auditAiCopy.draftsIntro : auditAiCopy.noDrafts}</p>
        {drafts.length > 0 ? (
          <div className="mt-4 space-y-4">
            {drafts.map((d) => (
              <DraftBlock key={d.key} draftKey={d.key} text={d.text} idPrefix={ids.drafts} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
