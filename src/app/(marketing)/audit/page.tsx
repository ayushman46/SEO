import { Suspense, type ReactNode } from "react";
import { auditPage } from "@/content/audit";
import { JsonLd, innerPageLd, pageMetadata } from "@/lib/seo";
import { AuditFlow } from "@/components/audit/AuditFlow";
import { AuditFlowFallback } from "@/components/audit/AuditFlowFallback";
import { AuditHero } from "@/components/audit/AuditHero";
import { AuditSteps } from "@/components/audit/AuditSteps";

export const metadata = pageMetadata.audit;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Reads ?url= inside the Suspense boundary so the rest of the page stays in the static shell. */
async function AuditFlowFromParams({ searchParams, children }: { searchParams: SearchParams; children: ReactNode }) {
  const raw = (await searchParams).url;
  const url = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  // Keyed by URL: a client navigation to /audit with a different ?url= remounts the flow and auto-starts it.
  return (
    <AuditFlow key={url} initialUrl={url.slice(0, 2048)}>
      {children}
    </AuditFlow>
  );
}

export default function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  const idle = <AuditSteps />;
  return (
    <>
      <JsonLd data={innerPageLd({ name: "Free audit", description: auditPage.metaDescription, path: "/audit" })} />
      <AuditHero />
      <Suspense fallback={<AuditFlowFallback>{idle}</AuditFlowFallback>}>
        <AuditFlowFromParams searchParams={searchParams}>{idle}</AuditFlowFromParams>
      </Suspense>
    </>
  );
}
