import type { LegalDoc } from "@/content/types";
import { Container } from "@/components/ui/Container";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { InPageNav } from "./InPageNav";
import { ReadingProgress } from "./ReadingProgress";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Readable legal layout: ~68ch measure, numbered sections with anchor links,
 * and a table of contents that is a list on small screens and sticky from lg.
 */
export function LegalBody({ doc }: { doc: LegalDoc }) {
  const sections = doc.sections.map((s) => ({ ...s, id: slugify(s.heading) }));
  return (
    <div className="pt-14 pb-24 sm:pt-20 sm:pb-32">
      <ReadingProgress />
      <Container className="grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-24">
        <InPageNav
          variant="list"
          label={`${doc.title}: contents`}
          heading="On this page"
          items={sections.map((s) => ({ id: s.id, label: s.heading }))}
        />
        <article aria-label={doc.title} className="max-w-[68ch] min-w-0">
          {sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-h`}
              className="border-t border-line pt-8 pb-10 first:border-t-0 first:pt-0"
            >
              <div className="group flex items-baseline gap-3">
                <span aria-hidden className="shrink-0 font-serif text-lg text-muted tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 id={`${section.id}-h`} className="min-w-0 font-serif text-display-sm text-balance text-ink">
                  {section.heading}
                </h2>
                <a
                  href={`#${section.id}`}
                  className="shrink-0 rounded-sm px-1 text-base text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-accent-ink focus-visible:opacity-100"
                >
                  <span aria-hidden>#</span>
                  <span className="sr-only">Link to section: {section.heading}</span>
                </a>
              </div>
              <div className="mt-5 grid gap-4 text-[1.0625rem] leading-[1.75] text-pretty text-ink-2">
                {section.body.map((p, j) => (
                  <p key={j}>
                    <PlaceholderText value={p} />
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </Container>
    </div>
  );
}
