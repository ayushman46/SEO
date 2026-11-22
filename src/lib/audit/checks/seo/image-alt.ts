import { outcome, type Check } from "../../context";

const def = { id: "seo.image-alt", category: "seo", label: "Image alt text" } as const;

/**
 * An <img> is OK when it has non-empty alt text, or is explicitly decorative
 * (role="presentation"/"none", aria-hidden="true", or alt="" — the W3C way to mark decoration).
 * Only a missing alt attribute counts against the site.
 */
export const imageAltCheck: Check = (ctx) => {
  let total = 0;
  let ok = 0;
  const affected: string[] = [];
  for (const p of ctx.pages) {
    const $ = p.$;
    let pageMissing = 0;
    $("img").each((_, el) => {
      const $el = $(el);
      // Ignore tracking pixels.
      if ($el.attr("width") === "1" && $el.attr("height") === "1") return;
      total++;
      const role = ($el.attr("role") ?? "").toLowerCase();
      const alt = $el.attr("alt");
      if (alt !== undefined || role === "presentation" || role === "none" || $el.attr("aria-hidden") === "true") {
        ok++;
      } else {
        pageMissing++;
      }
    });
    if (pageMissing > 0) affected.push(p.url);
  }

  if (total === 0) {
    return outcome(def, { score: 1, summary: "No images found on the scanned pages.", issues: [] });
  }
  const ratio = ok / total;
  const pct = Math.round(ratio * 100);
  return outcome(def, {
    score: ratio,
    summary: `${pct}% of ${total} images have alt text or are marked as decorative.`,
    issues:
      ok === total
        ? []
        : [
            {
              key: "seo.image-alt:missing",
              affectedUrls: affected,
              detail: `${total - ok} of ${total} images have no alt attribute.`,
            },
          ],
  });
};
