import type { ReactNode } from "react";
import type { FaqItem } from "@/content/types";
import type { CheckGroup, DocItem, DocSection } from "@/content/methodology";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cx } from "@/components/ui/cx";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { InPageNav } from "./InPageNav";
import { ReadingProgress } from "./ReadingProgress";

/** Anchor for a scored check, e.g. "seo.title" -> "check-seo-title". Stable, so issue cards can deep-link. */
export function checkAnchor(checkId: string): string {
  return `check-${checkId.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

/** Small tabular chip: "weight 15". */
function WeightChip({ weight }: { weight: number }) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-1 text-[0.9375rem] whitespace-nowrap">
      <span className="text-xs text-muted md:sr-only">weight</span>
      <span className="font-semibold text-ink tabular-nums">{weight}</span>
    </span>
  );
}

/** Label + sentence pairs: a two-column definition list from sm, stacked below. */
function ItemList({ items }: { items: DocItem[] }) {
  return (
    <dl className="mt-7 border-t border-line">
      {items.map((item, i) => (
        <div
          key={item.id ?? i}
          id={item.id ? `item-${item.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}` : undefined}
          className="grid gap-1.5 border-b border-line py-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-8"
        >
          <dt className="text-[0.9375rem] font-semibold text-ink">{item.label}</dt>
          <dd className="text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
            <PlaceholderText value={item.body} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * One check group: title, intro, then every check. From md a ruled three-column
 * table (check, what we look for, weight); below md each check is a stacked card.
 * One list serves both layouts, so screen readers hear it once.
 */
function GroupBlock({ group, sectionId }: { group: CheckGroup; sectionId: string }) {
  const hid = `${sectionId}-${group.id}`;
  const weighted = group.items.some((i) => i.weight !== undefined);
  return (
    <div role="group" aria-labelledby={hid} className="mt-12 first:mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-3">
        <h3 id={hid} className="font-serif text-title-lg text-balance text-ink">
          {group.title}
        </h3>
        {weighted ? (
          <p className="text-sm text-muted tabular-nums">
            {group.items.length} {group.items.length === 1 ? "check" : "checks"}
          </p>
        ) : null}
      </div>
      <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-pretty text-muted">
        <PlaceholderText value={group.intro} />
      </p>
      {weighted ? (
        <div aria-hidden className="mt-5 hidden grid-cols-[minmax(0,13rem)_minmax(0,1fr)_5.5rem] gap-6 px-1 text-xs font-medium text-muted md:grid">
          <span>Check</span>
          <span>What we look for</span>
          <span className="text-right">Weight</span>
        </div>
      ) : null}
      <dl className={cx("grid gap-2 md:gap-0", weighted ? "mt-3 md:mt-2 md:border-t md:border-line" : "mt-5 md:border-t md:border-line")}>
        {group.items.map((item, i) => (
          <div
            key={item.id ?? i}
            id={item.id ? checkAnchor(item.id) : undefined}
            className={cx(
              "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-line)]",
              "md:items-baseline md:gap-x-6 md:rounded-none md:border-b md:border-line md:bg-transparent md:px-1 md:py-4 md:shadow-none",
              weighted ? "md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_5.5rem]" : "md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]",
            )}
          >
            <dt className="col-start-1 row-start-1 text-[0.9375rem] leading-snug font-semibold text-ink">{item.label}</dt>
            {item.weight !== undefined ? (
              <dd className="col-start-2 row-start-1 md:col-start-3 md:justify-self-end">
                <WeightChip weight={item.weight} />
              </dd>
            ) : null}
            <dd className="col-span-2 row-start-2 text-[0.9375rem] leading-relaxed text-pretty text-ink-2 md:col-span-1 md:col-start-2 md:row-start-1">
              <PlaceholderText value={item.body} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** A ruled code block for user agents, robots.txt rules and the like. */
export function CodeBlock({ children, label, className }: { children: string; label?: string; className?: string }) {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className={cx(
        "max-w-full overflow-x-auto rounded-xl bg-paper px-4 py-3.5 font-mono text-[0.8125rem] leading-relaxed whitespace-pre text-ink shadow-[inset_0_0_0_1px_var(--color-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <code>{children}</code>
    </pre>
  );
}

/**
 * Long-form documentation layout (/methodology, /bot): numbered sections with
 * anchors, a sticky "On this page" rail from lg, body paragraphs, label lists,
 * check groups, optional per-section extras (code blocks) and a closing FAQ.
 */
export function DocBody({
  sections,
  label,
  extras = {},
  faq,
}: {
  sections: DocSection[];
  /** accessible name of the article and its nav */
  label: string;
  /** rendered after a section's items/groups, before its link */
  extras?: Record<string, ReactNode>;
  faq?: { id: string; title: string; items: FaqItem[] };
}) {
  const nav = [...sections.map((s) => ({ id: s.id, label: s.title })), ...(faq ? [{ id: faq.id, label: faq.title }] : [])];
  const numbered = (i: number) => String(i + 1).padStart(2, "0");

  const head = (id: string, title: string, i: number) => (
    <div className="group flex items-baseline gap-3">
      <span aria-hidden className="shrink-0 font-serif text-lg text-muted tabular-nums">
        {numbered(i)}
      </span>
      <h2 id={`${id}-h`} className="min-w-0 font-serif text-display-sm text-balance text-ink">
        {title}
      </h2>
      <a
        href={`#${id}`}
        className="shrink-0 rounded-sm px-1 text-base text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-accent-ink focus-visible:opacity-100"
      >
        <span aria-hidden>#</span>
        <span className="sr-only">Link to section: {title}</span>
      </a>
    </div>
  );

  return (
    <div className="pt-14 pb-24 sm:pt-20 sm:pb-32">
      <ReadingProgress />
      <Container className="grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-24">
        <InPageNav variant="list" label={`${label}: contents`} heading="On this page" items={nav} />
        <article aria-label={label} className="max-w-[52rem] min-w-0">
          {sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-h`}
              className="border-t border-line pt-10 pb-12 first:border-t-0 first:pt-0"
            >
              {head(section.id, section.title, i)}
              <div className="mt-5 grid max-w-[68ch] gap-4 text-[1.0625rem] leading-[1.75] text-pretty text-ink-2">
                {section.body.map((p, j) => (
                  <p key={j}>
                    <PlaceholderText value={p} />
                  </p>
                ))}
              </div>
              {section.items?.length ? <ItemList items={section.items} /> : null}
              {section.groups?.map((g) => <GroupBlock key={g.id} group={g} sectionId={section.id} />)}
              {extras[section.id] ? <div className="mt-7">{extras[section.id]}</div> : null}
              {section.cta ? (
                <p className="mt-8">
                  <Button href={section.cta.href} variant="link" icon="arrow-right">
                    {section.cta.label}
                  </Button>
                </p>
              ) : null}
            </section>
          ))}

          {faq ? (
            <section id={faq.id} aria-labelledby={`${faq.id}-h`} className="border-t border-line pt-10">
              {head(faq.id, faq.title, sections.length)}
              <Accordion
                className="mt-6"
                items={faq.items.map((f) => ({ title: f.q, content: <p><PlaceholderText value={f.a} /></p> }))}
              />
            </section>
          ) : null}
        </article>
      </Container>
    </div>
  );
}
