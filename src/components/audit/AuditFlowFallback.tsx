import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { AuditForm } from "./AuditForm";

/** Keep in sync with IDLE_RESERVE in AuditFlow.tsx and the running card's min-height. */
const RESERVE = "min-h-[min(40rem,80svh)]";

/**
 * Static shell for /audit while ?url= streams in. Same geometry as the idle AuditFlow, no client JS.
 * It is a plain GET form, so it still works if scripts never run.
 */
export function AuditFlowFallback({ children }: { children?: ReactNode }) {
  return (
    <>
      <Container size="narrow" className="mt-10 sm:mt-12">
        <div className="mx-auto w-full max-w-2xl">
          <AuditForm id="audit-url-static" />
        </div>
      </Container>
      <div className={RESERVE}>{children}</div>
    </>
  );
}
