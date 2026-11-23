import { auditForm } from "@/content/audit-form";
import { Container } from "@/components/ui/Container";
import { AuditForm } from "./AuditForm";

/**
 * Static shell for /audit while ?url= streams in. Same geometry as the idle AuditFlow form, no
 * client JS. The GET form only carries the address to /audit; the audit itself needs JavaScript,
 * so a <noscript> note says so instead of silently reloading the empty form (R7 #23).
 * The idle explainer is not in here: the page renders it once, after the Suspense boundary (R7 #17).
 */
export function AuditFlowFallback() {
  return (
    <Container size="narrow" className="mt-10 sm:mt-12">
      <div className="mx-auto w-full max-w-2xl">
        <AuditForm id="audit-url-static" />
        <noscript>
          <p className="mt-3 text-left text-sm font-medium text-critical">{auditForm.noScript}</p>
        </noscript>
      </div>
    </Container>
  );
}
