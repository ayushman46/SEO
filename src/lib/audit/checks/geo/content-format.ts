import { outcome, plural, type Check, type IssueSeed } from "../../context";
import { PRICE_RE, scanPage, timeRangesInText } from "./page-scan";

const def = { id: "geo.content-format", category: "geo", label: "Menus, prices & hours as text" } as const;

/** A key section is "image-only" when it has images and fewer than this many words of text. */
export const IMAGE_ONLY_MAX_WORDS = 30;
/** "Services" sections are often icon grids: require at least this many images there (R3 L2). */
export const SERVICES_MIN_IMAGES = 2;

/** The page already states prices or times as text, so a menu/price PDF isn't the only source (R3 L2). */
function hasFactsAsText(text: string): boolean {
  PRICE_RE.lastIndex = 0;
  const price = PRICE_RE.test(text);
  PRICE_RE.lastIndex = 0;
  return price || timeRangesInText(text).length > 0;
}

/**
 * geo.content-format: key facts (menu, prices, hours, services) that exist only as an image or a
 * PDF. AI assistants and search engines read text far more reliably than pictures of text.
 * Honest limit: we don't open the PDF or read the image, and the same facts may also be on
 * another page as text.
 */
export const contentFormatCheck: Check = (ctx) => {
  const pdfPages = new Set<string>();
  const pdfLabels = new Set<string>();
  const imagePages = new Set<string>();
  const imageHeadings = new Set<string>();
  const altPages = new Set<string>();
  let weakAlts = 0;

  for (const p of ctx.pages) {
    const s = scanPage(p);
    const textHasFacts = s.pdfLinks.length > 0 && hasFactsAsText(s.visibleText);
    for (const l of s.pdfLinks) {
      if (textHasFacts) break;
      pdfPages.add(p.url);
      if (pdfLabels.size < 5) pdfLabels.add(l.text || decodeURIComponentSafe(l.href.split("/").pop() ?? "PDF"));
    }
    for (const sec of s.keySections) {
      const servicesOnly = /\bservices\b/i.test(sec.heading) && !/\b(menu|price|pricing|rates|hours|timetable)/i.test(sec.heading);
      const minImages = servicesOnly ? SERVICES_MIN_IMAGES : 1;
      if (sec.images >= minImages && sec.words < IMAGE_ONLY_MAX_WORDS) {
        imagePages.add(p.url);
        if (imageHeadings.size < 5) imageHeadings.add(sec.heading);
        if (sec.weakAlts > 0) {
          weakAlts += sec.weakAlts;
          altPages.add(p.url);
        }
      }
    }
  }

  const issues: IssueSeed[] = [];
  let score = 1;
  if (imagePages.size > 0) {
    score -= 0.5;
    issues.push({
      key: "geo.content-format:image-only",
      affectedUrls: [...imagePages],
      detail: `Sections that look image-only: ${[...imageHeadings].map((h) => `"${h.slice(0, 80)}"`).join(", ")}.`,
      share: 3,
    });
  }
  if (pdfPages.size > 0) {
    score -= 0.4;
    issues.push({
      key: "geo.content-format:pdf-only",
      affectedUrls: [...pdfPages],
      detail: `PDF links found: ${[...pdfLabels].map((t) => `"${t.slice(0, 80)}"`).join(", ")}.`,
      share: 2,
    });
  }
  if (weakAlts > 0) {
    score -= 0.1;
    issues.push({ key: "geo.content-format:weak-alt", affectedUrls: [...altPages], share: 1 });
  }

  if (issues.length === 0) {
    return outcome(def, {
      score: 1,
      summary: "We didn't find menus, prices or opening hours locked in images or PDFs on the pages we read.",
      issues,
    });
  }
  const parts: string[] = [];
  if (imagePages.size) parts.push(`${plural(imageHeadings.size, "menu, price or hours section")} shown mostly as images`);
  if (pdfPages.size) parts.push(`${plural(pdfLabels.size, "link")} to a menu, price list or similar PDF`);
  return outcome(def, {
    score: Math.max(0, score),
    summary: `Found ${parts.join(" and ")} (we don't open PDFs or read images).`,
    issues,
  });
};

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
