import type { Severity } from "@/lib/audit/types";
import { sampleReportMeta } from "@/content/home";
import { sampleReportCopy, sampleReportPage, sampleReportResult } from "@/content/sample-report";
import { JsonLd, formatContentDate, innerPageLd, pageMetadata } from "@/lib/seo";
import { SectionTear } from "@/components/collage/SectionTear";
import { FullReport } from "@/components/audit/FullReport";
import { ScoreSummary } from "@/components/audit/ScoreSummary";
import { FixTray } from "@/components/audit/quote/FixTray";
import { QuoteProvider } from "@/components/audit/quote/QuoteContext";
import { auditUi } from "@/components/audit/labels";
import { ClosingCta } from "@/components/pages/ClosingCta";
import { PageHero } from "@/components/pages/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export const metadata = pageMetadata.sampleReport;

export default function SampleReportPage() {
  const r = sampleReportResult;
  const ran = { iso: r.startedAt.slice(0, 10), display: formatContentDate(r.startedAt) };
  const issueCounts = r.issues.reduce<Record<Severity, number>>(
    (m, i) => ({ ...m, [i.severity]: m[i.severity] + 1 }),
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
  const copy = sampleReportCopy;

  return (
    <>
      <JsonLd
        data={innerPageLd({
          name: "Sample report",
          description: sampleReportMeta.metaDescription,
          path: "/sample-report",
          dateModified: ran.iso,
        })}
      />
      <PageHero
        kicker={sampleReportPage.kicker}
        title={sampleReportPage.title}
        intro={sampleReportPage.intro}
        motif="hands"
        seed={91}
      >
        <Button href={copy.cta.href} size="lg" icon="arrow-right">
          {copy.cta.label}
        </Button>
        <Button href={copy.methodologyCta.href} size="lg" variant="secondary">
          {copy.methodologyCta.label}
        </Button>
      </PageHero>

      <section aria-labelledby="sample-report-title" className="mt-16 sm:mt-20">
        <SectionTear color="var(--color-paper)" seed={96} grain />
        <div className="paper-grain bg-paper pt-8 pb-20 sm:pt-12 sm:pb-28">
          <Container>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <Badge tone="accent">{copy.label}</Badge>
                <h2 id="sample-report-title" className="mt-4">
                  <span className="mb-3 flex items-center gap-2.5 text-kicker font-semibold text-muted uppercase">
                    <span aria-hidden className="h-px w-6 bg-ink/30" />
                    {auditUi.reportFor}
                  </span>
                  <span className="block font-serif text-display-md text-ink [overflow-wrap:anywhere]">{r.hostname}</span>
                </h2>
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span>{auditUi.pagesScanned(r.pages.length)}</span>
                <span aria-hidden className="text-line-strong">
                  ·
                </span>
                <span>{auditUi.seconds(r.durationMs)}</span>
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-white px-4 py-3.5 text-[0.9375rem] leading-relaxed text-pretty shadow-[inset_0_0_0_1px_var(--color-line)] sm:px-5">
              <p className="font-medium text-ink">
                {copy.ranFor(r.hostname)} <time dateTime={ran.iso}>{ran.display}</time>.
              </p>
              <p className="mt-1 text-muted">{copy.disclaimer}</p>
            </div>

            <ScoreSummary scores={r.scores} issueCounts={issueCounts} className="mt-8" />

            <QuoteProvider
              issues={r.issues}
              pagesScanned={r.pages.length}
              audit={{ id: r.id, url: r.finalUrl, hostname: r.hostname }}
              sample
            >
              <div className="mt-16 sm:mt-20">
                <FullReport result={r} headingId="sample-full" badgeLabel={copy.label} />
              </div>
              <FixTray id="sample-fixlist" />
            </QuoteProvider>
          </Container>
        </div>
        <SectionTear color="var(--color-paper)" seed={97} flip grain />
      </section>

      <ClosingCta
        id="sample-closing-title"
        title={copy.closing.title}
        body={copy.closing.body}
        primaryCta={copy.cta}
        secondaryCta={copy.methodologyCta}
        seed={93}
      />
    </>
  );
}
