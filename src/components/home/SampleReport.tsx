import { home } from "@/content/home";
import type { Severity } from "@/lib/audit/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { IssueRow, severityLabel } from "@/components/ui/IssueRow";
import { Reveal } from "@/components/ui/Reveal";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { sampleEffort, sampleReport } from "./sample-report-data";

const severities: Severity[] = ["critical", "high", "medium", "low"];

/** Illustrative report preview. Always labelled with `home.sampleReport.note`. */
export function SampleReport() {
  const copy = home.sampleReport;
  const r = sampleReport;
  return (
    <section aria-labelledby="sample-title" className="relative overflow-clip py-24 sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-20">
        <SectionHeading id="sample-title" kicker={copy.kicker} title={copy.title} body={copy.body}>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button href={home.hero.primaryCta.href} icon="arrow-right">
              {home.hero.primaryCta.label}
            </Button>
          </div>
        </SectionHeading>

        <Reveal variant="tear">
          <figure className="relative">
            <figcaption className="mb-4 flex justify-center lg:justify-end">
              <Badge tone="outline">
                <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6.25" />
                  <path d="M8 7.25v4M8 4.75v.5" strokeLinecap="round" />
                </svg>
                {copy.note}
              </Badge>
            </figcaption>
            <div className="rounded-panel bg-white p-5 shadow-float ring-1 ring-ink/[0.05] sm:p-8">
              {/* header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper font-serif text-lg text-ink">
                    y
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{r.hostname}</p>
                    <p className="text-xs text-muted">
                      {r.pagesScanned} pages scanned · {Math.round(r.durationMs / 1000)} s
                    </p>
                  </div>
                </div>
                <ul className="flex flex-wrap gap-1.5" aria-label="Issues by severity">
                  {severities.map((s) => (
                    <li key={s}>
                      <Badge tone={s}>
                        {r.issueCounts[s]} {severityLabel[s].toLowerCase()}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>

              {/* scores */}
              <div className="grid items-center gap-5 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
                <ScoreRing value={r.scores.overall} label="Overall" size={124} stroke={9} className="justify-self-center" />
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {(
                    [
                      ["SEO", r.scores.seo],
                      ["GEO", r.scores.geo],
                      ["Performance", r.scores.performance],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex flex-col items-center gap-2 rounded-xl bg-paper px-1 py-3 text-center">
                      <ScoreRing value={value} label={label} size={58} stroke={5} />
                      <span className="text-[0.6875rem] font-medium text-muted sm:text-xs">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* issues */}
              <p className="text-kicker font-semibold text-muted uppercase">Top issues</p>
              <ul className="mt-3 space-y-2">
                {r.topIssues.map((issue) => (
                  <IssueRow key={issue.id} as="li" issue={issue} />
                ))}
              </ul>
              <ul className="relative mt-2 space-y-2" aria-label="More issues, unlocked with your email">
                {r.lockedIssues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    as="li"
                    locked
                    issue={{ ...issue, effort: sampleEffort[issue.id] }}
                    className="opacity-70"
                  />
                ))}
              </ul>
            </div>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}
