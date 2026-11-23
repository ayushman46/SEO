import { Suspense } from "react";
import { auditPage } from "@/content/audit";
import { JsonLd, innerPageLd, pageMetadata } from "@/lib/seo";
import { AuditFlow } from "@/components/audit/AuditFlow";
import { AuditFlowFallback } from "@/components/audit/AuditFlowFallback";
import { AuditHero, AuditHeroNotes } from "@/components/audit/AuditHero";
import { AuditSteps } from "@/components/audit/AuditSteps";

export const metadata = pageMetadata.audit;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Reads ?url= inside the Suspense boundary so the rest of the page stays in the static shell. */
async function AuditFlowFromParams({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).url;
  const url = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  // Keyed by URL: a client navigation to /audit with a different ?url= remounts the flow and auto-starts it.
  return <AuditFlow key={url} initialUrl={url.slice(0, 2048)} />;
}

/** Keep in sync with the running card's min-height in AuditFlow, so swapping states does not shift the page. */
const IDLE_RESERVE = "min-h-[min(40rem,80svh)]";

export default function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <JsonLd data={innerPageLd({ name: "Free audit", description: auditPage.metaDescription, path: "/audit" })} />
      <AuditHero />
      {/* The idle explainer (intro, dateline, how it works) is rendered once, here, and hidden while
          AuditFlow shows a run, an error or a report (its hidden data-audit-active marker). Passing it
          to both the fallback and the flow put it in the HTML twice, with a duplicate id (R7 #17).
          With a valid ?url= the server still renders the progress state (and the marker). */}
      <div className="group/audit">
        <Suspense fallback={<AuditFlowFallback />}>
          <AuditFlowFromParams searchParams={searchParams} />
        </Suspense>
        <div className={`${IDLE_RESERVE} group-has-[[data-audit-active]]/audit:hidden`}>
          <AuditHeroNotes />
          <AuditSteps />
        </div>
      </div>
    </>
  );
}
