import type { CheerioAPI } from "cheerio";
import { outcome, plural, type Check, type IssueSeed } from "../../context";
import { cleanText, countWords, type PageData } from "../../html";

const def = { id: "geo.answer-ready", category: "geo", label: "Answer-ready content" } as const;

const SUMMARY_HEADING = /\b(tl;?\s?dr|summary|key takeaways?|takeaways|in short|at a glance|in brief|quick answer|the short answer|bottom line)\b/i;
const SUMMARY_SELECTOR =
  '[class*="tldr" i], [id*="tldr" i], [class*="tl-dr" i], [class*="key-takeaways" i], [id*="key-takeaways" i], [class*="takeaways" i], [class*="article-summary" i], [class*="post-summary" i]';

function sentenceCount(text: string): number {
  const m = text.match(/[.!?](\s|$)/g);
  return Math.max(1, m ? m.length : 0);
}

/** Paragraph of 20–60 words and 1–3 sentences: short enough to quote, long enough to answer. */
export function isAnswerParagraph(text: string): boolean {
  const t = cleanText(text);
  const words = countWords(t);
  return words >= 20 && words <= 60 && sentenceCount(t) <= 3;
}

/** Number of headings (H1–H3) directly followed by an answer-style paragraph. */
export function countAnswerBlocks($: CheerioAPI): number {
  let count = 0;
  $("h1, h2, h3").each((_, el) => {
    const $h = $(el);
    if ($h.parents("nav, footer, header").length) return;
    const candidates = [$h.next()];
    // Heading wrapped alone in a container: look at the container's next sibling too.
    if ($h.parent().children().length === 1) candidates.push($h.parent().next());
    for (const c of candidates) {
      if (!c.length) continue;
      const p = c.is("p") ? c : c.find("p").first();
      if (p.length && isAnswerParagraph(p.text())) {
        count++;
        return;
      }
    }
  });
  return count;
}

export function hasSummary(p: PageData): boolean {
  if (p.headings.some((h) => SUMMARY_HEADING.test(h.text))) return true;
  return p.$(SUMMARY_SELECTOR).not("summary").length > 0;
}

export function hasListsOrTables($: CheerioAPI): boolean {
  const root = $("main, article, [role=main]").length ? $("main, article, [role=main]") : $("body");
  const lists = root
    .find("ul, ol")
    .filter((_, el) => $(el).parents("nav, header, footer").length === 0 && $(el).children("li").length >= 3);
  if (lists.length > 0) return true;
  const tables = root.find("table").filter((_, el) => $(el).find("tr").length >= 2);
  return tables.length > 0;
}

export const answerReadyCheck: Check = (ctx) => {
  let blocks = 0;
  let summary = false;
  let lists = false;
  for (const p of ctx.pages) {
    blocks += countAnswerBlocks(p.$);
    summary ||= hasSummary(p);
    lists ||= hasListsOrTables(p.$);
  }
  const blockScore = Math.min(1, blocks / 3);
  const score = 0.5 * blockScore + 0.2 * (summary ? 1 : 0) + 0.3 * (lists ? 1 : 0);

  const issues: IssueSeed[] = [];
  if (blocks < 3) {
    issues.push({
      key: "geo.answer-ready:no-answer-blocks",
      share: 2.5,
      ...(blocks > 0
        ? { severity: "low" as const, detail: `We found only ${plural(blocks, "heading")} followed by a short, direct answer.` }
        : {}),
    });
  }
  if (!summary) issues.push({ key: "geo.answer-ready:no-summary", share: 1 });
  if (!lists) issues.push({ key: "geo.answer-ready:no-lists", share: 1.5 });

  const parts = [
    `${plural(blocks, "answer-style section")}`,
    summary ? "a summary" : "no summary",
    lists ? "lists/tables present" : "no lists or tables",
  ];
  return outcome(def, { score, summary: `Found ${parts.join(", ")}.`, issues });
};
