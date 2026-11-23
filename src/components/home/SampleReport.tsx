import { home } from "@/content/home";
import type { Severity } from "@/lib/audit/types";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cx } from "@/components/ui/cx";
import { IssueRow, severityLabel } from "@/components/ui/IssueRow";
import { Reveal } from "@/components/ui/Reveal";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Steps } from "@/components/ui/Steps";
import { sampleEffort, sampleReport } from "./sample-report-data";

const severities: Severity[] = ["critical", "high", "medium", "low"];
const dot: Record<Severity, string> = { critical: "bg-critical", high: "bg-high", medium: "bg-medium", low: "bg-low" };

/**
 * Illustrative report preview, with "how it works" folded in as three plain
 * lines (T026: the separate HowItWorks section is gone). The figure carries one
 * plain caption (`home.sampleReport.note`), no pill.
 */
export function SampleReport() {
  const copy = home.sampleReport;
  const steps = home.howItWorks?.steps ?? [];
  const r = sampleReport;
  return (
    <section aria-labelledby="sample-title" className="relative overflow-clip py-20 sm:py-28">
      <Container className="grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-20">
        <SectionHeading id="sample-title" kicker={copy.kicker} title={copy.title} body={copy.body}>
          {steps.length ? <Steps steps={steps} layout="list" className="mt-8 max-w-xl" /> : null}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button href={home.hero.primaryCta.href} icon="arrow-right">
              {home.hero.primaryCta.label}
            </Button>
          </div>
        </SectionHeading>

        <Reveal variant="settle">
          <figure>
            <div className="rounded-panel bg-white p-5 shadow-float ring-1 ring-ink/[0.05] sm:p-8">
              {/* header */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line pb-5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.hostname}</p>
                  <p className="text-xs text-muted">
                    {r.pagesScanned} pages scanned · {Math.round(r.durationMs / 1000)} s
                  </p>
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Issues by severity">
                  {severities.map((s) => (
                    <li key={s} className="flex items-center gap-1.5 text-xs text-muted">
                      <span aria-hidden className={cx("size-2 rounded-full", dot[s])} />
                      <span className="font-semibold text-ink tabular-nums">{r.issueCounts[s]}</span>
                      {severityLabel[s].toLowerCase()}
                    </li>
                  ))}
                </ul>
              </div>

              {/* scores */}
              <div className="grid items-center gap-5 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
                <ScoreRing value={r.scores.overall} label="Overall" size={124} stroke={9} className="justify-self-center" />
                <div className="grid grid-cols-3 divide-x divide-line">
                  {(
                    [
                      ["SEO", r.scores.seo],
                      ["GEO", r.scores.geo],
                      ["Performance", r.scores.performance],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex flex-col items-center gap-2 px-1 py-1 text-center">
                      <ScoreRing value={value} label={label} size={58} stroke={5} />
                      <span className="text-xs font-medium text-muted">{label}</span>
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
                  <IssueRow key={issue.id} as="li" locked issue={{ ...issue, effort: sampleEffort[issue.id] }} />
                ))}
              </ul>
            </div>
            <figcaption className="mt-4 text-left text-xs text-muted">{copy.note}</figcaption>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}
