import { outcome, type Check } from "../../context";

const def = { id: "seo.https", category: "seo", label: "HTTPS" } as const;

export const httpsCheck: Check = (ctx) => {
  const finalHttps = ctx.finalUrl.startsWith("https://");
  if (!finalHttps) {
    return outcome(def, {
      score: 0,
      summary: "Your homepage loads over insecure http://.",
      issues: [{ key: "seo.https:not-https", affectedUrls: [ctx.finalUrl] }],
    });
  }
  const insecurePages = ctx.pages.filter((p) => p.url.startsWith("http://")).map((p) => p.url);
  if (insecurePages.length) {
    return outcome(def, {
      score: 0.5,
      summary: "Your homepage uses HTTPS but some pages still load over http://.",
      issues: [{ key: "seo.https:not-https", affectedUrls: insecurePages, severity: "high" }],
    });
  }
  const probe = ctx.httpToHttps;
  if (probe.checked && probe.redirectsToHttps === false) {
    return outcome(def, {
      score: 0.6,
      summary: "Your site uses HTTPS, but the http:// version doesn't redirect to it.",
      issues: [{ key: "seo.https:no-redirect" }],
    });
  }
  return outcome(def, {
    score: 1,
    summary: probe.checked
      ? "Your site uses HTTPS and redirects http:// to https://."
      : "Your site uses HTTPS.",
    issues: [],
  });
};
