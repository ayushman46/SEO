import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { auditForm } from "@/content/audit-form";
import { AuditFlow } from "./AuditFlow";
import { AuditFlowFallback } from "./AuditFlowFallback";

describe("/audit streaming shell (R7 #17, #23)", () => {
  it("the fallback carries only the form plus a no-JS note, never the idle explainer", () => {
    const html = renderToStaticMarkup(createElement(AuditFlowFallback));
    expect(html).toContain('id="audit-url-static"');
    expect(html).toContain(`<noscript><p class="mt-3 text-left text-sm font-medium text-critical">${auditForm.noScript.replace(/'/g, "&#x27;")}</p></noscript>`);
    expect(html).not.toContain("audit-steps-title");
  });

  it("marks a server-rendered run so the page's idle block hides, and leaves idle unmarked", () => {
    expect(renderToStaticMarkup(createElement(AuditFlow, { initialUrl: "example.com" }))).toContain("data-audit-active");
    expect(renderToStaticMarkup(createElement(AuditFlow, { initialUrl: "" }))).not.toContain("data-audit-active");
  });
});
